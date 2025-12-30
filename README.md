# AgriSahayak 🌾

**AI-Powered Smart Agriculture & Farmer Intelligence Platform**

An ML-driven decision support system for Indian farmers featuring crop recommendations, disease detection, yield prediction, and voice-based IVR advisory.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL 14+
- CUDA 11.8+ (for GPU inference)

### Frontend (Angular)
```bash
cd frontend
npm install
npm start
# Opens at http://localhost:4200
```

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --reload
# API at http://localhost:8000
```

### ML Training
```bash
cd ml
pip install -r requirements.txt
python training/disease_detection/train.py
```

## 📂 Project Structure

```
agrisahayak/
├── frontend/          # Angular 19 PWA with i18n
├── backend/           # FastAPI + PostgreSQL + Twilio IVR  
├── ml/                # PyTorch CUDA training pipelines
└── database/          # PostgreSQL schemas & migrations
```

## 🎯 Features

- 🌾 **Crop Advisor** - ML-powered crop recommendations
- 🦠 **Disease Detective** - Real-time plant disease detection  
- 📊 **Yield Predictor** - LSTM-based yield forecasting
- 📞 **Voice IVR** - Twilio phone advisory ("Press 1 for...")
- 🌐 **Multi-language** - Hindi, Tamil, Telugu, Kannada, Marathi
- 📱 **Offline PWA** - Works without internet

## 📊 Datasets Required

Place in `ml/data/raw/`:
- `crop_recommendation/` - [Kaggle Dataset](https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset)
- `plant_disease/` - [PlantVillage Dataset](https://www.kaggle.com/datasets/emmarex/plantdisease)
- `yield_prediction/` - [India Crop Yield](https://www.kaggle.com/datasets/akshatgupta7/crop-yield-in-indian-states-dataset)

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Angular 19, SCSS, PWA, i18n |
| Backend | FastAPI, SQLAlchemy, Alembic |
| Database | PostgreSQL, Redis |
| ML | PyTorch 2.0, CUDA 11.8, EfficientNet |
| IVR | Twilio Voice API |

---
Built with ❤️ for Indian Farmers
