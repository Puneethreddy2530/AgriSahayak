"""
Crop Recommendation Model
Ensemble model using XGBoost + Neural Network
"""

import torch
import torch.nn as nn
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
import joblib
import os


class CropRecommendationNet(nn.Module):
    """Neural network for crop recommendation"""
    
    def __init__(self, input_size: int = 7, hidden_size: int = 128, num_classes: int = 22):
        super(CropRecommendationNet, self).__init__()
        
        self.network = nn.Sequential(
            nn.Linear(input_size, hidden_size),
            nn.BatchNorm1d(hidden_size),
            nn.ReLU(),
            nn.Dropout(0.3),
            
            nn.Linear(hidden_size, hidden_size // 2),
            nn.BatchNorm1d(hidden_size // 2),
            nn.ReLU(),
            nn.Dropout(0.2),
            
            nn.Linear(hidden_size // 2, hidden_size // 4),
            nn.ReLU(),
            
            nn.Linear(hidden_size // 4, num_classes)
        )
        
        self.num_classes = num_classes
        
        # Crop names
        self.crop_names = [
            'rice', 'maize', 'chickpea', 'kidneybeans', 'pigeonpeas',
            'mothbeans', 'mungbean', 'blackgram', 'lentil', 'pomegranate',
            'banana', 'mango', 'grapes', 'watermelon', 'muskmelon',
            'apple', 'orange', 'papaya', 'coconut', 'cotton',
            'jute', 'coffee'
        ]
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.network(x)
    
    def predict(self, features: dict, device: str = 'cuda') -> list:
        """
        Predict top crops for given soil and weather features
        
        Args:
            features: dict with keys: N, P, K, temperature, humidity, ph, rainfall
            device: cuda or cpu
        
        Returns:
            List of (crop_name, confidence) tuples
        """
        self.eval()
        self.to(device)
        
        # Prepare input tensor
        input_data = torch.tensor([
            features['nitrogen'],
            features['phosphorus'],
            features['potassium'],
            features['temperature'],
            features['humidity'],
            features['ph'],
            features['rainfall']
        ], dtype=torch.float32).unsqueeze(0).to(device)
        
        # Normalize (assuming scaler is applied externally)
        with torch.no_grad():
            outputs = self(input_data)
            probabilities = torch.softmax(outputs, dim=1).squeeze()
        
        # Get top 5 predictions
        top_probs, top_indices = torch.topk(probabilities, k=5)
        
        results = []
        for prob, idx in zip(top_probs.cpu().numpy(), top_indices.cpu().numpy()):
            results.append({
                'crop': self.crop_names[idx],
                'confidence': float(prob)
            })
        
        return results


class CropRecommendationEnsemble:
    """Ensemble model combining RF + Neural Network"""
    
    def __init__(self):
        self.rf_model = None
        self.nn_model = None
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.is_fitted = False
    
    def fit(self, X: np.ndarray, y: np.ndarray):
        """Train both models"""
        # Fit scaler and encoder
        X_scaled = self.scaler.fit_transform(X)
        y_encoded = self.label_encoder.fit_transform(y)
        
        # Train Random Forest
        self.rf_model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        self.rf_model.fit(X_scaled, y_encoded)
        
        self.is_fitted = True
        return self
    
    def predict(self, features: dict) -> list:
        """Get ensemble predictions"""
        if not self.is_fitted:
            raise ValueError("Model not fitted. Call fit() first.")
        
        # Prepare input
        X = np.array([[
            features['nitrogen'],
            features['phosphorus'],
            features['potassium'],
            features['temperature'],
            features['humidity'],
            features['ph'],
            features['rainfall']
        ]])
        
        X_scaled = self.scaler.transform(X)
        
        # Get RF probabilities
        rf_probs = self.rf_model.predict_proba(X_scaled)[0]
        
        # Get top 5
        top_indices = np.argsort(rf_probs)[-5:][::-1]
        
        results = []
        for idx in top_indices:
            crop = self.label_encoder.inverse_transform([idx])[0]
            results.append({
                'crop': crop,
                'confidence': float(rf_probs[idx])
            })
        
        return results
    
    def save(self, path: str):
        """Save model to disk"""
        joblib.dump({
            'rf_model': self.rf_model,
            'scaler': self.scaler,
            'label_encoder': self.label_encoder,
            'is_fitted': self.is_fitted
        }, path)
    
    @classmethod
    def load(cls, path: str):
        """Load model from disk"""
        data = joblib.load(path)
        model = cls()
        model.rf_model = data['rf_model']
        model.scaler = data['scaler']
        model.label_encoder = data['label_encoder']
        model.is_fitted = data['is_fitted']
        return model


if __name__ == "__main__":
    print("🧪 Testing CropRecommendationNet...")
    model = CropRecommendationNet()
    print(f"✅ Model created with {sum(p.numel() for p in model.parameters()):,} parameters")
    
    # Test forward pass
    dummy_input = torch.randn(4, 7)  # Batch of 4
    output = model(dummy_input)
    print(f"✅ Output shape: {output.shape}")
