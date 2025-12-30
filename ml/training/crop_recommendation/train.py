"""
Crop Recommendation Training Script
Train ensemble model on Kaggle crop dataset
"""

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib
from pathlib import Path
import sys
from tqdm import tqdm

# Add parent path
sys.path.append(str(Path(__file__).parent.parent.parent))


class CropMLP(nn.Module):
    """MLP for crop recommendation"""
    
    def __init__(self, input_size: int = 7, num_classes: int = 22):
        super(CropMLP, self).__init__()
        
        self.network = nn.Sequential(
            nn.Linear(input_size, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(),
            nn.Dropout(0.3),
            
            nn.Linear(256, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.Dropout(0.2),
            
            nn.Linear(128, 64),
            nn.ReLU(),
            
            nn.Linear(64, num_classes)
        )
    
    def forward(self, x):
        return self.network(x)


def train_neural_network(X_train, y_train, X_val, y_val, num_classes, device, epochs=100):
    """Train the neural network component"""
    
    # Create datasets
    train_dataset = TensorDataset(
        torch.FloatTensor(X_train),
        torch.LongTensor(y_train)
    )
    val_dataset = TensorDataset(
        torch.FloatTensor(X_val),
        torch.LongTensor(y_val)
    )
    
    train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=64, shuffle=False)
    
    # Model
    model = CropMLP(input_size=7, num_classes=num_classes).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=30, gamma=0.1)
    
    best_acc = 0.0
    
    for epoch in range(1, epochs + 1):
        # Training
        model.train()
        train_loss = 0.0
        train_correct = 0
        train_total = 0
        
        for inputs, labels in train_loader:
            inputs, labels = inputs.to(device), labels.to(device)
            
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item()
            _, predicted = outputs.max(1)
            train_total += labels.size(0)
            train_correct += predicted.eq(labels).sum().item()
        
        scheduler.step()
        
        # Validation
        model.eval()
        val_correct = 0
        val_total = 0
        
        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs, labels = inputs.to(device), labels.to(device)
                outputs = model(inputs)
                _, predicted = outputs.max(1)
                val_total += labels.size(0)
                val_correct += predicted.eq(labels).sum().item()
        
        train_acc = 100. * train_correct / train_total
        val_acc = 100. * val_correct / val_total
        
        if epoch % 10 == 0:
            print(f"Epoch {epoch}: Train Acc: {train_acc:.2f}% | Val Acc: {val_acc:.2f}%")
        
        if val_acc > best_acc:
            best_acc = val_acc
            best_model_state = model.state_dict()
    
    model.load_state_dict(best_model_state)
    return model, best_acc


def main():
    # Paths
    DATA_DIR = Path(__file__).parent.parent.parent / 'data' / 'raw' / 'crop_recommendation'
    MODEL_DIR = Path(__file__).parent.parent.parent / 'models'
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    
    # Device
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"🔥 Using device: {device}")
    
    # Load data
    data_file = DATA_DIR / 'Crop_recommendation.csv'
    if not data_file.exists():
        print(f"❌ Data file not found: {data_file}")
        print("📥 Please download from: https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset")
        return
    
    print("📦 Loading data...")
    df = pd.read_csv(data_file)
    print(f"📊 Dataset shape: {df.shape}")
    print(f"🌾 Crops: {df['label'].nunique()} unique classes")
    
    # Features and labels
    feature_cols = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
    X = df[feature_cols].values
    y = df['label'].values
    
    # Encode labels
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)
    num_classes = len(label_encoder.classes_)
    
    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Split data
    X_train, X_val, y_train, y_val = train_test_split(
        X_scaled, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )
    
    print(f"\n📊 Train: {len(X_train)} samples | Val: {len(X_val)} samples")
    
    # Train Random Forest
    print("\n🌲 Training Random Forest...")
    rf_model = RandomForestClassifier(
        n_estimators=200,
        max_depth=15,
        min_samples_split=5,
        random_state=42,
        n_jobs=-1
    )
    rf_model.fit(X_train, y_train)
    rf_preds = rf_model.predict(X_val)
    rf_acc = accuracy_score(y_val, rf_preds) * 100
    print(f"✅ Random Forest Accuracy: {rf_acc:.2f}%")
    
    # Train Neural Network
    print("\n🧠 Training Neural Network...")
    nn_model, nn_acc = train_neural_network(
        X_train, y_train, X_val, y_val, 
        num_classes, device, epochs=100
    )
    print(f"✅ Neural Network Accuracy: {nn_acc:.2f}%")
    
    # Save models
    print("\n💾 Saving models...")
    
    # Save RF model
    joblib.dump({
        'model': rf_model,
        'scaler': scaler,
        'label_encoder': label_encoder,
        'feature_cols': feature_cols,
        'accuracy': rf_acc
    }, MODEL_DIR / 'crop_recommender_rf.pkl')
    
    # Save NN model
    torch.save({
        'model_state_dict': nn_model.state_dict(),
        'num_classes': num_classes,
        'label_encoder_classes': label_encoder.classes_.tolist(),
        'feature_cols': feature_cols,
        'accuracy': nn_acc
    }, MODEL_DIR / 'crop_recommender_nn.pth')
    
    print(f"\n🎉 Training complete!")
    print(f"   RF Model: {MODEL_DIR / 'crop_recommender_rf.pkl'}")
    print(f"   NN Model: {MODEL_DIR / 'crop_recommender_nn.pth'}")


if __name__ == "__main__":
    main()
