from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import torch.nn as nn
import torchvision.transforms as transforms
import timm
import json
import base64
from PIL import Image
import io

app = Flask(__name__)
CORS(app)

# ── Load class names ──────────────────────────────────────────
with open("model/class_names.json", "r") as f:
    class_names = json.load(f)

# ── Same model class as your Colab notebook ───────────────────
class SkinAnalysisModel(nn.Module):
    def __init__(self, num_classes):
        super(SkinAnalysisModel, self).__init__()
        self.backbone = timm.create_model(
            'efficientnet_b3',
            pretrained=False,
            num_classes=0,
            drop_rate=0.3,          # ← added
            drop_path_rate=0.2,     # ← added
        )
        feature_dim = self.backbone.num_features

        self.classifier = nn.Sequential(
            nn.BatchNorm1d(feature_dim),   # ← added
            nn.Dropout(0.4),
            nn.Linear(feature_dim, 512),
            nn.ReLU(),
            nn.BatchNorm1d(512),           # ← added
            nn.Dropout(0.3),
            nn.Linear(512, num_classes)
        )

    def forward(self, x):
        return self.classifier(self.backbone(x))

# ── Load model ────────────────────────────────────────────────
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
checkpoint = torch.load("model/skin_model_best.pth", map_location=device)
model = SkinAnalysisModel(num_classes=len(class_names))
model.load_state_dict(checkpoint["model_state_dict"])
model.eval()
model.to(device)
print(f"✅ Model loaded with {len(class_names)} classes on {device}")

# ── Transform (same as Colab val_transform) ───────────────────
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "classes": len(class_names)})

@app.route("/analyze", methods=["POST"])
def analyze():
    try:
        data = request.get_json()
        image_b64 = data.get("image", "")

        # Strip data URL prefix if present
        if "," in image_b64:
            image_b64 = image_b64.split(",")[1]

        # Decode base64 → PIL image
        img_bytes = base64.b64decode(image_b64)
        image = Image.open(io.BytesIO(img_bytes)).convert("RGB")

        # Run inference
        tensor = transform(image).unsqueeze(0).to(device)
        with torch.no_grad():
            outputs = model(tensor)
            probs = torch.softmax(outputs, dim=1)[0]

        top_probs, top_indices = torch.topk(probs, 5)

        conditions = []
        for i in range(5):
            label = class_names[top_indices[i].item()]
            confidence = round(top_probs[i].item() * 100, 2)
            conditions.append({"condition": label, "confidence": confidence})

        top_condition = conditions[0]["condition"]
        top_confidence = conditions[0]["confidence"]

        # Determine severity based on confidence
        severity = "Mild" if top_confidence < 60 else "Moderate" if top_confidence < 80 else "Severe"

        return jsonify({
            "success": True,
            "source": "local_model",
            "topCondition": top_condition,
            "confidence": top_confidence,
            "severity": severity,
            "allConditions": conditions,
            "modelInfo": f"EfficientNet-B3 trained on DermNet · {len(class_names)} classes"
        })

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5001, debug=False)