"""
Disease Detection Model - EfficientNet-based CNN
For detecting plant diseases from leaf images
"""

import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import os


class DiseaseDetector(nn.Module):
    """EfficientNet-based plant disease detection model"""
    
    def __init__(self, num_classes: int = 38, pretrained: bool = True):
        super(DiseaseDetector, self).__init__()
        
        # Use EfficientNet-B4 as backbone
        self.backbone = models.efficientnet_b4(pretrained=pretrained)
        
        # Replace classifier head
        in_features = self.backbone.classifier[1].in_features
        self.backbone.classifier = nn.Sequential(
            nn.Dropout(p=0.4, inplace=True),
            nn.Linear(in_features, 512),
            nn.ReLU(),
            nn.Dropout(p=0.3),
            nn.Linear(512, num_classes)
        )
        
        self.num_classes = num_classes
        
        # Class names mapping
        self.class_names = [
            'Apple___Apple_scab', 'Apple___Black_rot', 'Apple___Cedar_apple_rust', 'Apple___healthy',
            'Blueberry___healthy', 'Cherry___Powdery_mildew', 'Cherry___healthy',
            'Corn___Cercospora_leaf_spot', 'Corn___Common_rust', 'Corn___Northern_Leaf_Blight', 'Corn___healthy',
            'Grape___Black_rot', 'Grape___Esca', 'Grape___Leaf_blight', 'Grape___healthy',
            'Orange___Haunglongbing', 'Peach___Bacterial_spot', 'Peach___healthy',
            'Pepper___Bacterial_spot', 'Pepper___healthy',
            'Potato___Early_blight', 'Potato___Late_blight', 'Potato___healthy',
            'Raspberry___healthy', 'Rice___Brown_spot', 'Rice___Leaf_blast', 'Rice___healthy',
            'Soybean___healthy', 'Squash___Powdery_mildew', 'Strawberry___Leaf_scorch', 'Strawberry___healthy',
            'Tomato___Bacterial_spot', 'Tomato___Early_blight', 'Tomato___Late_blight',
            'Tomato___Leaf_Mold', 'Tomato___Septoria_leaf_spot', 'Tomato___Spider_mites', 'Tomato___healthy'
        ]
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.backbone(x)
    
    @staticmethod
    def get_transforms(train: bool = False):
        """Get image transforms for training/inference"""
        if train:
            return transforms.Compose([
                transforms.RandomResizedCrop(224),
                transforms.RandomHorizontalFlip(),
                transforms.RandomRotation(15),
                transforms.ColorJitter(brightness=0.2, contrast=0.2),
                transforms.ToTensor(),
                transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
            ])
        else:
            return transforms.Compose([
                transforms.Resize(256),
                transforms.CenterCrop(224),
                transforms.ToTensor(),
                transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
            ])
    
    def predict(self, image_path: str, device: str = 'cuda') -> dict:
        """Run inference on a single image"""
        self.eval()
        self.to(device)
        
        # Load and transform image
        image = Image.open(image_path).convert('RGB')
        transform = self.get_transforms(train=False)
        image_tensor = transform(image).unsqueeze(0).to(device)
        
        # Inference
        with torch.no_grad():
            outputs = self(image_tensor)
            probabilities = torch.softmax(outputs, dim=1)
            confidence, predicted = torch.max(probabilities, 1)
        
        class_name = self.class_names[predicted.item()]
        plant, disease = class_name.split('___')
        
        return {
            'plant': plant,
            'disease': disease,
            'confidence': confidence.item(),
            'is_healthy': disease == 'healthy',
            'class_index': predicted.item()
        }


def load_model(model_path: str, num_classes: int = 38, device: str = 'cuda') -> DiseaseDetector:
    """Load trained model from checkpoint"""
    model = DiseaseDetector(num_classes=num_classes, pretrained=False)
    
    if os.path.exists(model_path):
        checkpoint = torch.load(model_path, map_location=device)
        model.load_state_dict(checkpoint['model_state_dict'])
        print(f"✅ Loaded model from {model_path}")
    else:
        print(f"⚠️ No checkpoint found at {model_path}, using untrained model")
    
    model.to(device)
    model.eval()
    return model


if __name__ == "__main__":
    # Test model creation
    print("🧪 Testing DiseaseDetector model...")
    model = DiseaseDetector(num_classes=38, pretrained=False)
    print(f"✅ Model created with {sum(p.numel() for p in model.parameters()):,} parameters")
    
    # Test forward pass
    dummy_input = torch.randn(1, 3, 224, 224)
    output = model(dummy_input)
    print(f"✅ Output shape: {output.shape}")
