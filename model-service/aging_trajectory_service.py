"""
Aging Trajectory Model Service
Runs on port 5002 alongside the existing skin analysis service (port 5001).
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import torch.nn as nn
import torch.nn.functional as F
import timm
import base64
from PIL import Image
import io
import os

app = Flask(__name__)
CORS(app)

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ── Model Architectures (must match Kaggle training exactly) ─────────────────

class AgeEstimatorModel(nn.Module):
    def __init__(self, num_classes=3, dropout=0.3):
        super().__init__()
        self.backbone = timm.create_model(
            'efficientnet_b3', pretrained=False, num_classes=0, global_pool='avg')
        feat_dim = self.backbone.num_features
        self.classifier = nn.Sequential(
            nn.Linear(feat_dim, 512), nn.BatchNorm1d(512), nn.SiLU(), nn.Dropout(dropout),
            nn.Linear(512, 256), nn.BatchNorm1d(256), nn.SiLU(), nn.Dropout(dropout / 2),
            nn.Linear(256, num_classes),
        )
    def forward(self, x):
        return self.classifier(self.backbone(x))


class SkinConditionModel(nn.Module):
    def __init__(self, num_classes=3, dropout=0.3):
        super().__init__()
        self.backbone = timm.create_model(
            'efficientnet_b0', pretrained=False, num_classes=0, global_pool='avg')
        feat_dim = self.backbone.num_features
        self.classifier = nn.Sequential(
            nn.Linear(feat_dim, 256), nn.BatchNorm1d(256), nn.SiLU(), nn.Dropout(dropout),
            nn.Linear(256, 128), nn.BatchNorm1d(128), nn.SiLU(), nn.Dropout(dropout / 2),
            nn.Linear(128, num_classes),
        )
    def forward(self, x):
        return self.classifier(self.backbone(x))


class AgingTrajectoryModel(nn.Module):
    def __init__(self, age_backbone, skin_backbone, num_classes=3, dropout=0.4):
        super().__init__()
        self.age_backbone  = age_backbone
        self.skin_backbone = skin_backbone
        for p in self.age_backbone.parameters():  p.requires_grad = False
        for p in self.skin_backbone.parameters(): p.requires_grad = False

        with torch.no_grad():
            dummy   = torch.zeros(1, 3, 224, 224).to(DEVICE)
            age_fd  = self.age_backbone(dummy).shape[1]
            skin_fd = self.skin_backbone(dummy).shape[1]

        self.age_proj  = nn.Sequential(nn.Linear(age_fd,  256), nn.LayerNorm(256), nn.SiLU(), nn.Dropout(dropout / 2))
        self.skin_proj = nn.Sequential(nn.Linear(skin_fd, 256), nn.LayerNorm(256), nn.SiLU(), nn.Dropout(dropout / 2))
        self.meta_encoder = nn.Sequential(nn.Linear(2, 32), nn.SiLU())
        self.fusion_head  = nn.Sequential(
            nn.Linear(544, 512), nn.BatchNorm1d(512), nn.SiLU(), nn.Dropout(dropout),
            nn.Linear(512, 256), nn.BatchNorm1d(256), nn.SiLU(), nn.Dropout(dropout / 2),
            nn.Linear(256, num_classes),
        )

    def forward(self, x, meta):
        return self.fusion_head(torch.cat([
            self.age_proj(self.age_backbone(x)),
            self.skin_proj(self.skin_backbone(x)),
            self.meta_encoder(meta),
        ], dim=1))


# ── Load models ──────────────────────────────────────────────────────────────

MODEL_DIR = os.path.join(os.path.dirname(__file__), "aging_models")

print(f"Loading aging models from {MODEL_DIR} on {DEVICE}...")

age_model  = AgeEstimatorModel(num_classes=3).to(DEVICE)
skin_model = SkinConditionModel(num_classes=3).to(DEVICE)

age_model.load_state_dict(torch.load(
    os.path.join(MODEL_DIR, "best_age_model.pth"), map_location=DEVICE))
skin_model.load_state_dict(torch.load(
    os.path.join(MODEL_DIR, "best_skin_model.pth"), map_location=DEVICE))

age_model.eval()
skin_model.eval()

combined_model = AgingTrajectoryModel(
    age_backbone=age_model.backbone,
    skin_backbone=skin_model.backbone,
    num_classes=3,
).to(DEVICE)

combined_model.load_state_dict(torch.load(
    os.path.join(MODEL_DIR, "best_trajectory_model.pth"), map_location=DEVICE))
combined_model.eval()

# ── Replace BatchNorm1d with LayerNorm to fix NaN with batch_size=1 ──────────
def replace_batchnorm1d(model):
    for name, module in list(model.named_children()):
        if isinstance(module, nn.BatchNorm1d):
            ln = nn.LayerNorm(module.num_features, elementwise_affine=False).to(DEVICE)
            setattr(model, name, ln)
        else:
            replace_batchnorm1d(module)

for m in [age_model, skin_model, combined_model]:
    replace_batchnorm1d(m)
    m.eval()

print("✅ All 3 aging models loaded successfully")

# ── Image transform ──────────────────────────────────────────────────────────

import torchvision.transforms as transforms
import math

def safe(val):
    """Convert tensor float to JSON-safe number — replaces NaN/Inf with 0."""
    f = round(float(val) * 100, 1)
    return 0.0 if (math.isnan(f) or math.isinf(f)) else f

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

# ── Label maps ───────────────────────────────────────────────────────────────

AGE_CLASSES  = ["Young (0-30)", "Middle (31-50)", "Senior (51+)"]
SKIN_CLASSES = ["Clear", "Mild Aging", "Advanced Aging"]
TRAJ_CLASSES = ["Early", "Moderate", "Advanced"]

# ── Routes ───────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "aging-trajectory", "device": str(DEVICE)})


@app.route("/aging-trajectory", methods=["POST"])
def aging_trajectory():
    try:
        data     = request.get_json()
        img_b64  = data.get("image", "")
        gender   = int(data.get("gender", 0))   # 0=male, 1=female

        # Decode image
        if "," in img_b64:
            img_b64 = img_b64.split(",")[1]
        img_bytes = base64.b64decode(img_b64)
        image     = Image.open(io.BytesIO(img_bytes)).convert("RGB")

        # Preprocess
        tensor = transform(image).unsqueeze(0).to(DEVICE)
        meta   = torch.tensor([[float(gender), 0.0]]).to(DEVICE)

        with torch.no_grad():
            # Age prediction
            age_logits  = age_model(tensor)
            age_probs   = F.softmax(age_logits, dim=1)[0]
            age_idx     = age_probs.argmax().item()

            # Skin condition prediction
            skin_logits = skin_model(tensor)
            skin_probs  = F.softmax(skin_logits, dim=1)[0]
            skin_idx    = skin_probs.argmax().item()

            # Aging trajectory prediction
            traj_logits = combined_model(tensor, meta)
            traj_probs  = F.softmax(traj_logits, dim=1)[0]
            traj_idx    = traj_probs.argmax().item()

        return jsonify({
            "success":          True,
            "agingTrajectory":  TRAJ_CLASSES[traj_idx],
            "ageGroup":         AGE_CLASSES[age_idx],
            "skinCondition":    SKIN_CLASSES[skin_idx],
            "confidence":       safe(traj_probs[traj_idx].item()),
            "probabilities": {
                "Early":    safe(traj_probs[0].item()),
                "Moderate": safe(traj_probs[1].item()),
                "Advanced": safe(traj_probs[2].item()),
            },
            "ageProbabilities": {
                AGE_CLASSES[i]: safe(age_probs[i].item()) for i in range(3)
            },
            "skinProbabilities": {
                SKIN_CLASSES[i]: safe(skin_probs[i].item()) for i in range(3)
            },
        })

    except Exception as e:
        print(f"Error: {e}")
        import traceback; traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    app.run(port=5002, debug=False)