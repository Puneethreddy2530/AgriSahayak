"""
🔥 Disease Detection - EfficientNetV2-S (Better Approach)
Key changes from ConvNeXt-Tiny:
- EfficientNetV2-S: More proven on plant datasets, better feature extraction
- Simpler augmentation: Less regularization for faster learning
- No Mixup/CutMix: Direct learning for this short run
- Larger batch with gradient checkpointing
"""

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import transforms, datasets, models
from pathlib import Path
import numpy as np
from tqdm import tqdm
import random
import os
from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_class_weight

# ============================================
# CONFIGURATION
# ============================================
class Config:
    DATA_DIR = Path(__file__).parent.parent.parent / 'data' / 'raw' / 'plant_disease'
    MODEL_DIR = Path(__file__).parent.parent.parent / 'models'
    
    BATCH_SIZE = 32
    EPOCHS = 12  # ~10 min run
    LEARNING_RATE = 1e-3  # Higher LR for faster learning
    WEIGHT_DECAY = 0.01
    
    # NO Mixup/CutMix - direct learning
    LABEL_SMOOTHING = 0.1
    
    IMG_SIZE = 224
    NUM_WORKERS = min(6, os.cpu_count() - 1) if os.cpu_count() else 4
    SEED = 42


# ============================================
# SIMPLER, PROVEN AUGMENTATIONS
# ============================================
train_transform = transforms.Compose([
    transforms.RandomResizedCrop(224, scale=(0.8, 1.0)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomVerticalFlip(p=0.3),
    transforms.RandomRotation(15),
    transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])

val_transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])


# ============================================
# DATASET
# ============================================
class TransformSubset(torch.utils.data.Dataset):
    def __init__(self, dataset, indices, transform):
        self.dataset = dataset
        self.indices = indices
        self.transform = transform
    
    def __len__(self):
        return len(self.indices)
    
    def __getitem__(self, idx):
        img_path, label = self.dataset.samples[self.indices[idx]]
        from PIL import Image
        img = Image.open(img_path).convert('RGB')
        if self.transform:
            img = self.transform(img)
        return img, label


# ============================================
# MODEL - EfficientNetV2-S (Better than Tiny)
# ============================================
def build_model(num_classes):
    """EfficientNetV2-S with custom head"""
    model = models.efficientnet_v2_s(weights=models.EfficientNet_V2_S_Weights.DEFAULT)
    
    # Freeze early layers for transfer learning
    for param in list(model.parameters())[:-50]:
        param.requires_grad = False
    
    # Custom classifier
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(in_features, 512),
        nn.ReLU(),
        nn.Dropout(p=0.2),
        nn.Linear(512, num_classes)
    )
    
    return model


# ============================================
# TRAINING (Simple, Fast)
# ============================================
def train_epoch(model, loader, criterion, optimizer, device, scaler):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0
    
    pbar = tqdm(loader, desc="Training")
    for images, labels in pbar:
        images = images.to(device, non_blocking=True)
        labels = labels.to(device, non_blocking=True)
        
        optimizer.zero_grad()
        
        with torch.amp.autocast('cuda'):
            outputs = model(images)
            loss = criterion(outputs, labels)
        
        scaler.scale(loss).backward()
        scaler.step(optimizer)
        scaler.update()
        
        running_loss += loss.item()
        _, predicted = outputs.max(1)
        total += labels.size(0)
        correct += predicted.eq(labels).sum().item()
        
        pbar.set_postfix({
            'loss': f'{running_loss/total*labels.size(0):.4f}', 
            'acc': f'{100.*correct/total:.1f}%'
        })
    
    return running_loss / len(loader), 100. * correct / total


def validate(model, loader, criterion, device):
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0
    
    with torch.no_grad():
        for images, labels in tqdm(loader, desc="Validating"):
            images = images.to(device, non_blocking=True)
            labels = labels.to(device, non_blocking=True)
            
            with torch.amp.autocast('cuda'):
                outputs = model(images)
                loss = criterion(outputs, labels)
            
            running_loss += loss.item()
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()
    
    return running_loss / len(loader), 100. * correct / total


# ============================================
# MAIN
# ============================================
def main():
    config = Config()
    torch.manual_seed(config.SEED)
    np.random.seed(config.SEED)
    random.seed(config.SEED)
    
    config.MODEL_DIR.mkdir(parents=True, exist_ok=True)
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    print("=" * 60)
    print("🔥 Disease Detection - EfficientNetV2-S (Improved)")
    print("=" * 60)
    print(f"📱 Device: {device}")
    if torch.cuda.is_available():
        print(f"🎮 GPU: {torch.cuda.get_device_name(0)}")
    print(f"👷 Workers: {config.NUM_WORKERS}")
    
    # Load dataset
    print("\n📦 Loading dataset...")
    full_dataset = datasets.ImageFolder(config.DATA_DIR)
    NUM_CLASSES = len(full_dataset.classes)
    print(f"📊 Found {len(full_dataset)} images in {NUM_CLASSES} classes")
    
    # Split
    all_indices = list(range(len(full_dataset)))
    all_labels = [full_dataset.targets[i] for i in all_indices]
    train_indices, val_indices = train_test_split(
        all_indices, test_size=0.15, stratify=all_labels, random_state=config.SEED
    )
    print(f"📊 Train: {len(train_indices)} | Val: {len(val_indices)}")
    
    # Tempered class weights
    train_labels = [all_labels[i] for i in train_indices]
    class_weights = compute_class_weight('balanced', classes=np.unique(train_labels), y=train_labels)
    class_weights = np.clip(class_weights, 0.5, 3.0)  # Less aggressive clipping
    class_weights = class_weights / class_weights.mean()
    class_weights = torch.tensor(class_weights, dtype=torch.float).to(device)
    print(f"⚖️ Class weights: {class_weights.min():.2f} → {class_weights.max():.2f}")
    
    # Create datasets
    train_dataset = TransformSubset(full_dataset, train_indices, train_transform)
    val_dataset = TransformSubset(full_dataset, val_indices, val_transform)
    
    train_loader = DataLoader(
        train_dataset, batch_size=config.BATCH_SIZE, shuffle=True,
        num_workers=config.NUM_WORKERS, pin_memory=True, persistent_workers=True, drop_last=True
    )
    val_loader = DataLoader(
        val_dataset, batch_size=config.BATCH_SIZE * 2, shuffle=False,
        num_workers=config.NUM_WORKERS, pin_memory=True, persistent_workers=True
    )
    
    # Build model
    print("\n🏗️ Building EfficientNetV2-S model...")
    model = build_model(NUM_CLASSES).to(device)
    
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    print(f"📊 Trainable: {trainable:,} / {total:,} parameters")
    
    criterion = nn.CrossEntropyLoss(weight=class_weights, label_smoothing=config.LABEL_SMOOTHING)
    optimizer = optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), 
                           lr=config.LEARNING_RATE, weight_decay=config.WEIGHT_DECAY)
    scheduler = optim.lr_scheduler.OneCycleLR(
        optimizer, max_lr=config.LEARNING_RATE, 
        steps_per_epoch=len(train_loader), epochs=config.EPOCHS
    )
    scaler = torch.amp.GradScaler('cuda')
    
    # Training
    best_acc = 0.0
    print(f"\n🚀 Starting training for {config.EPOCHS} epochs (~10 min)...")
    print(f"🔧 No Mixup/CutMix | Label Smoothing: {config.LABEL_SMOOTHING}")
    print(f"🔧 OneCycleLR | Higher LR for faster convergence")
    print()
    
    for epoch in range(config.EPOCHS):
        print(f"📍 Epoch {epoch+1}/{config.EPOCHS} [LR: {optimizer.param_groups[0]['lr']:.6f}]")
        
        train_loss, train_acc = train_epoch(model, train_loader, criterion, optimizer, device, scaler)
        val_loss, val_acc = validate(model, val_loader, criterion, device)
        
        # Step scheduler per batch is handled by OneCycleLR during training
        
        print(f"   Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.1f}%")
        print(f"   Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.1f}%")
        
        if val_acc > best_acc:
            best_acc = val_acc
            checkpoint = {
                'epoch': epoch,
                'model_state_dict': model.state_dict(),
                'val_acc': val_acc,
                'num_classes': NUM_CLASSES,
                'class_names': full_dataset.classes
            }
            torch.save(checkpoint, config.MODEL_DIR / 'disease_detector.pth')
            print(f"   ✅ New best! Saved model with {val_acc:.1f}% accuracy")
        print()
    
    print("=" * 60)
    print(f"🎉 Training complete! Best accuracy: {best_acc:.1f}%")
    print(f"📁 Model saved to: {config.MODEL_DIR / 'disease_detector.pth'}")
    print("=" * 60)


if __name__ == "__main__":
    main()
