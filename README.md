# 🌾 AgriSahayak - AI-Powered Smart Agriculture Platform

<div align="center">

![AgriSahayak Banner](https://img.shields.io/badge/AgriSahayak-Smart%20Farming-green?style=for-the-badge&logo=leaf)

[![Python](https://img.shields.io/badge/Python-3.11+-blue?style=flat-square&logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.1-EE4C2C?style=flat-square&logo=pytorch)](https://pytorch.org)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

**Empowering Indian Farmers with AI-Driven Agricultural Intelligence**

[Live Demo](https://agrisahayak.onrender.com) • [API Docs](https://agrisahayak.onrender.com/docs) • [Report Bug](../../issues)

</div>

---

## 🚀 Features

### 🌱 AI Crop Recommendation
- Neural network-based crop suggestions
- Analyzes soil NPK, pH, temperature, humidity, rainfall
- 98% accuracy across 22+ crop types

### 🔬 Disease Detection
- Deep learning plant disease detection
- Supports Tomato, Potato, Pepper crops
- 38+ disease classifications
- Treatment recommendations

### 📊 Smart Features
| Feature | Description |
|---------|-------------|
| **Crop Lifecycle Tracker** | Track crops from sowing to harvest |
| **Fertilizer Calculator** | NPK-based fertilizer recommendations |
| **Weather Intelligence** | Real-time weather with farming advisories |
| **Market Prices** | Live mandi prices from 28+ markets |
| **Government Schemes** | Access to agricultural subsidies & schemes |
| **Expense Tracker** | Farm expense & profit estimation |
| **Complaint System** | Report issues to district officers |
| **Admin Portal** | District-level complaint management |

### 🌐 Multi-Language Support
- English, हिंदी, తెలుగు, தமிழ், मराठी, ಕನ್ನಡ, বাংলা, ગુજરાતી, ਪੰਜਾਬੀ

---

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.11)
- **ML/AI**: PyTorch, scikit-learn
- **Database**: SQLite with SQLAlchemy ORM
- **Auth**: JWT with bcrypt

### Frontend
- **UI**: Vanilla HTML5, CSS3, JavaScript
- **Icons**: Lucide Icons
- **Design**: Glassmorphism UI with Aurora animations

### ML Models
- **Crop Recommendation**: Neural Network (PyTorch)
- **Disease Detection**: CNN (PyTorch)
- **Yield Prediction**: Random Forest (scikit-learn)

---

## 📦 Installation

### Prerequisites
- Python 3.11+
- Git

### Quick Start

```bash
# Clone the repository
git clone https://github.com/Puneethreddy2530/AgriSahayak.git
cd AgriSahayak

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Run the server
cd backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Open http://127.0.0.1:8000 in your browser.

---

## 🌐 Deployment

### Deploy to Render (Recommended - FREE)

1. Fork this repository
2. Go to [render.com](https://render.com)
3. Create a new **Web Service**
4. Connect your GitHub repository
5. Configure:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Environment**: Python 3.11

Or use the included `render.yaml` for Blueprint deployment.

---

## 📁 Project Structure

```
AgriSahayak/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # API routes
│   │   ├── core/               # Config
│   │   ├── db/                 # Database models
│   │   └── ml/                 # ML models
│   └── requirements.txt
├── frontend/
│   ├── index.html              # Main app
│   ├── styles.css              # Styles
│   └── app.js                  # JavaScript
├── ml/
│   ├── models/                 # Trained models
│   ├── data/                   # Datasets
│   └── training/               # Training scripts
├── render.yaml                 # Render deployment
├── Procfile                    # Heroku/Render
└── README.md
```

---

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/crop/recommend` | POST | Get crop recommendations |
| `/api/v1/disease/detect` | POST | Detect plant disease |
| `/api/v1/farmer/register` | POST | Register farmer |
| `/api/v1/farmer/login` | POST | Login |
| `/api/v1/weather/{city}` | GET | Weather data |
| `/api/v1/market/prices` | GET | Mandi prices |
| `/api/v1/schemes/` | GET | Government schemes |
| `/api/v1/complaints/` | POST | Submit complaint |
| `/docs` | GET | Swagger UI |

---

## 🎯 Use Cases

1. **Farmers**: Get AI-powered crop recommendations, detect diseases, track expenses
2. **Agricultural Officers**: Manage farmer complaints, view district statistics
3. **Researchers**: Access anonymized agricultural data

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Team

Built with ❤️ for **Aarohan Hackathon 2025**

---

<div align="center">

**⭐ Star this repository if you found it helpful!**

</div>
