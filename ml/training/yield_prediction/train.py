"""
🌾 Yield Prediction Training Script
Predicts crop yield based on environmental and input factors
Uses ensemble of Random Forest + Gradient Boosting
"""

import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
import joblib
import warnings
warnings.filterwarnings('ignore')


def main():
    DATA_PATH = Path(__file__).parent.parent.parent / 'data' / 'raw' / 'yield_prediction' / 'crop_yield.csv'
    MODEL_DIR = Path(__file__).parent.parent.parent / 'models'
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    
    print("=" * 60)
    print("🌾 Yield Prediction Training")
    print("=" * 60)
    
    # Load data
    print("\n📦 Loading data...")
    df = pd.read_csv(DATA_PATH)
    print(f"📊 Dataset shape: {df.shape}")
    print(f"📋 Columns: {df.columns.tolist()}")
    
    # Drop rows with missing values
    df = df.dropna()
    print(f"📊 After dropping NaN: {df.shape}")
    
    # Features and target
    feature_cols = ['Crop', 'Season', 'State', 'Area', 'Annual_Rainfall', 'Fertilizer', 'Pesticide']
    target_col = 'Yield'
    
    # Encode categorical variables
    print("\n🔧 Encoding categorical features...")
    encoders = {}
    df_processed = df.copy()
    
    for col in ['Crop', 'Season', 'State']:
        le = LabelEncoder()
        df_processed[col] = le.fit_transform(df_processed[col])
        encoders[col] = le
        print(f"   {col}: {len(le.classes_)} unique values")
    
    X = df_processed[feature_cols].values
    y = df_processed[target_col].values
    
    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42
    )
    print(f"\n📊 Train: {len(X_train)} | Test: {len(X_test)}")
    
    # Train Random Forest
    print("\n🌲 Training Random Forest...")
    rf = RandomForestRegressor(
        n_estimators=200,
        max_depth=20,
        min_samples_split=5,
        min_samples_leaf=2,
        n_jobs=-1,
        random_state=42
    )
    rf.fit(X_train, y_train)
    rf_pred = rf.predict(X_test)
    rf_r2 = r2_score(y_test, rf_pred)
    rf_mae = mean_absolute_error(y_test, rf_pred)
    print(f"   R² Score: {rf_r2:.4f}")
    print(f"   MAE: {rf_mae:.4f}")
    
    # Train Gradient Boosting
    print("\n🚀 Training Gradient Boosting...")
    gb = GradientBoostingRegressor(
        n_estimators=200,
        max_depth=10,
        learning_rate=0.1,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42
    )
    gb.fit(X_train, y_train)
    gb_pred = gb.predict(X_test)
    gb_r2 = r2_score(y_test, gb_pred)
    gb_mae = mean_absolute_error(y_test, gb_pred)
    print(f"   R² Score: {gb_r2:.4f}")
    print(f"   MAE: {gb_mae:.4f}")
    
    # Ensemble prediction
    print("\n🎯 Ensemble (RF + GB average)...")
    ensemble_pred = (rf_pred + gb_pred) / 2
    ensemble_r2 = r2_score(y_test, ensemble_pred)
    ensemble_mae = mean_absolute_error(y_test, ensemble_pred)
    print(f"   R² Score: {ensemble_r2:.4f}")
    print(f"   MAE: {ensemble_mae:.4f}")
    
    # Save best model (use the one with highest R²)
    if rf_r2 >= gb_r2:
        best_model = rf
        best_name = "Random Forest"
        best_r2 = rf_r2
    else:
        best_model = gb
        best_name = "Gradient Boosting"
        best_r2 = gb_r2
    
    print(f"\n💾 Saving best model ({best_name})...")
    
    # Save model, scaler, and encoders
    model_data = {
        'model': best_model,
        'scaler': scaler,
        'encoders': encoders,
        'feature_cols': feature_cols,
        'r2_score': best_r2.item() if hasattr(best_r2, 'item') else best_r2,
        'model_type': best_name
    }
    joblib.dump(model_data, MODEL_DIR / 'yield_predictor.joblib')
    
    print(f"\n" + "=" * 60)
    print(f"🎉 Training complete!")
    print(f"   Best Model: {best_name}")
    print(f"   R² Score: {best_r2:.4f} ({best_r2*100:.1f}% variance explained)")
    print(f"   Model saved to: {MODEL_DIR / 'yield_predictor.joblib'}")
    print("=" * 60)


if __name__ == "__main__":
    main()
