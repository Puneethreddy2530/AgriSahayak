import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Farmer {
  id: string;
  name: string;
  phone: string;
  language: string;
  state: string;
  district: string;
  created_at: string;
  lands: Land[];
}

interface Land {
  land_id: string;
  area: number;
  soil_type: string;
  irrigation_type: string;
  crop_history: CropHistory[];
}

interface CropHistory {
  crop: string;
  season: string;
  year: number;
  yield_kg?: number;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="profile-container">
      <header class="page-header">
        <h1>👨‍🌾 Farmer Profile</h1>
        <p>Manage your profile and land details for personalized recommendations</p>
      </header>

      <!-- Registration / Login Toggle -->
      <div class="auth-toggle glass-card" *ngIf="!farmer">
        <button 
          [class.active]="authMode === 'register'" 
          (click)="authMode = 'register'"
        >New Registration</button>
        <button 
          [class.active]="authMode === 'login'" 
          (click)="authMode = 'login'"
        >Already Registered</button>
      </div>

      <!-- Registration Form -->
      <div class="registration-form glass-card" *ngIf="!farmer && authMode === 'register'">
        <h3>📝 Register as Farmer</h3>
        <div class="form-grid">
          <div class="input-group">
            <label>Full Name</label>
            <input type="text" [(ngModel)]="regForm.name" placeholder="Enter your name" class="input">
          </div>
          <div class="input-group">
            <label>Phone Number</label>
            <input type="tel" [(ngModel)]="regForm.phone" placeholder="10-digit mobile" class="input" maxlength="10">
          </div>
          <div class="input-group">
            <label>State</label>
            <select [(ngModel)]="regForm.state" class="input">
              <option value="">Select State</option>
              <option *ngFor="let s of states" [value]="s">{{s}}</option>
            </select>
          </div>
          <div class="input-group">
            <label>District</label>
            <input type="text" [(ngModel)]="regForm.district" placeholder="Your district" class="input">
          </div>
          <div class="input-group">
            <label>Preferred Language</label>
            <select [(ngModel)]="regForm.language" class="input">
              <option value="hi">हिंदी</option>
              <option value="en">English</option>
              <option value="mr">मराठी</option>
              <option value="ta">தமிழ்</option>
              <option value="te">తెలుగు</option>
              <option value="kn">ಕನ್ನಡ</option>
            </select>
          </div>
        </div>
        <button class="btn-primary" (click)="registerFarmer()" [disabled]="isLoading">
          {{ isLoading ? 'Registering...' : '✅ Complete Registration' }}
        </button>
      </div>

      <!-- Login Form -->
      <div class="login-form glass-card" *ngIf="!farmer && authMode === 'login'">
        <h3>🔑 Find Your Profile</h3>
        <div class="input-group">
          <label>Phone Number</label>
          <input type="tel" [(ngModel)]="loginPhone" placeholder="Enter registered mobile" class="input" maxlength="10">
        </div>
        <button class="btn-primary" (click)="lookupFarmer()" [disabled]="isLoading">
          {{ isLoading ? 'Searching...' : '🔍 Find Profile' }}
        </button>
        <p class="error-msg" *ngIf="error">{{ error }}</p>
      </div>

      <!-- Profile Dashboard -->
      <div class="profile-dashboard" *ngIf="farmer">
        <!-- Profile Card -->
        <div class="profile-card glass-card">
          <div class="profile-header">
            <div class="avatar">{{ farmer.name.charAt(0) }}</div>
            <div class="profile-info">
              <h2>{{ farmer.name }}</h2>
              <p class="text-muted">📱 {{ farmer.phone }}</p>
              <p class="text-muted">📍 {{ farmer.district }}, {{ farmer.state }}</p>
            </div>
            <span class="badge">ID: {{ farmer.id }}</span>
          </div>
          <div class="profile-stats">
            <div class="stat">
              <span class="stat-value">{{ farmer.lands.length }}</span>
              <span class="stat-label">Lands</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ getTotalArea() }}</span>
              <span class="stat-label">Acres</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ getTotalCrops() }}</span>
              <span class="stat-label">Crops Grown</span>
            </div>
          </div>
        </div>

        <!-- Lands Section -->
        <div class="lands-section">
          <div class="section-header">
            <h3>🌾 Your Lands</h3>
            <button class="btn-secondary" (click)="showAddLand = !showAddLand">
              {{ showAddLand ? '✕ Cancel' : '+ Add Land' }}
            </button>
          </div>

          <!-- Add Land Form -->
          <div class="add-land-form glass-card" *ngIf="showAddLand">
            <div class="form-grid">
              <div class="input-group">
                <label>Area (Acres)</label>
                <input type="number" [(ngModel)]="landForm.area" placeholder="e.g., 2.5" class="input" step="0.1">
              </div>
              <div class="input-group">
                <label>Soil Type</label>
                <select [(ngModel)]="landForm.soil_type" class="input">
                  <option value="">Select</option>
                  <option value="black">Black (Regur)</option>
                  <option value="red">Red Soil</option>
                  <option value="alluvial">Alluvial</option>
                  <option value="sandy">Sandy</option>
                  <option value="loamy">Loamy</option>
                </select>
              </div>
              <div class="input-group">
                <label>Irrigation Type</label>
                <select [(ngModel)]="landForm.irrigation_type" class="input">
                  <option value="">Select</option>
                  <option value="rainfed">Rainfed</option>
                  <option value="canal">Canal</option>
                  <option value="borewell">Borewell</option>
                  <option value="drip">Drip Irrigation</option>
                  <option value="sprinkler">Sprinkler</option>
                </select>
              </div>
            </div>
            <button class="btn-primary" (click)="addLand()">
              {{ isLoading ? 'Adding...' : '🌱 Add Land' }}
            </button>
          </div>

          <!-- Land Cards -->
          <div class="land-cards">
            <div class="land-card glass-card" *ngFor="let land of farmer.lands; let i = index">
              <div class="land-header">
                <span class="land-icon">🏞️</span>
                <div>
                  <h4>Land #{{ i + 1 }}</h4>
                  <span class="land-id">{{ land.land_id }}</span>
                </div>
              </div>
              <div class="land-details">
                <div class="detail">
                  <span class="label">Area</span>
                  <span class="value">{{ land.area }} acres</span>
                </div>
                <div class="detail">
                  <span class="label">Soil</span>
                  <span class="value">{{ land.soil_type | titlecase }}</span>
                </div>
                <div class="detail">
                  <span class="label">Irrigation</span>
                  <span class="value">{{ land.irrigation_type | titlecase }}</span>
                </div>
              </div>
              <div class="crop-history">
                <h5>📊 Crop History ({{ land.crop_history.length }})</h5>
                <div class="history-items" *ngIf="land.crop_history.length > 0">
                  <div class="history-item" *ngFor="let h of land.crop_history">
                    <span>{{ h.crop }}</span>
                    <span class="text-muted">{{ h.season }} {{ h.year }}</span>
                    <span *ngIf="h.yield_kg">{{ h.yield_kg }} kg</span>
                  </div>
                </div>
                <p class="text-muted" *ngIf="land.crop_history.length === 0">No crop history yet</p>
              </div>
            </div>
          </div>

          <p class="text-muted" *ngIf="farmer.lands.length === 0">
            No lands registered yet. Add your first land to get personalized recommendations!
          </p>
        </div>

        <!-- Logout -->
        <button class="btn-secondary logout-btn" (click)="logout()">
          🚪 Switch Profile
        </button>
      </div>
    </div>
  `,
  styles: [`
    .profile-container {
      max-width: 900px;
      margin: 0 auto;
    }

    .page-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .page-header h1 {
      font-size: 2.5rem;
      background: linear-gradient(135deg, #10b981, #f59e0b);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .auth-toggle {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      margin-bottom: 2rem;
    }

    .auth-toggle button {
      flex: 1;
      padding: 1rem;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 0.75rem;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.3s;
    }

    .auth-toggle button.active {
      background: rgba(16, 185, 129, 0.2);
      border-color: var(--primary-400);
      color: var(--primary-400);
    }

    .glass-card {
      background: rgba(255,255,255,0.05);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 1rem;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .input-group label {
      font-weight: 500;
      color: var(--text-secondary);
    }

    .input {
      padding: 0.75rem 1rem;
      background: rgba(0,0,0,0.2);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 0.5rem;
      color: white;
      font-size: 1rem;
    }

    .input:focus {
      outline: none;
      border-color: var(--primary-400);
    }

    .btn-primary {
      width: 100%;
      padding: 1rem;
      background: linear-gradient(135deg, #10b981, #059669);
      border: none;
      border-radius: 0.75rem;
      color: white;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      transition: transform 0.2s;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      padding: 0.75rem 1.5rem;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 0.5rem;
      color: white;
      cursor: pointer;
    }

    .error-msg {
      color: #ef4444;
      margin-top: 1rem;
      text-align: center;
    }

    .profile-card {
      background: linear-gradient(135deg, rgba(16,185,129,0.1), rgba(245,158,11,0.1));
    }

    .profile-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #10b981, #f59e0b);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: bold;
      color: white;
    }

    .profile-info h2 {
      margin: 0;
      font-size: 1.5rem;
    }

    .badge {
      margin-left: auto;
      padding: 0.5rem 1rem;
      background: rgba(255,255,255,0.1);
      border-radius: 2rem;
      font-size: 0.875rem;
    }

    .profile-stats {
      display: flex;
      justify-content: space-around;
      padding-top: 1rem;
      border-top: 1px solid rgba(255,255,255,0.1);
    }

    .stat {
      text-align: center;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: bold;
      color: var(--primary-400);
    }

    .stat-label {
      display: block;
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .land-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }

    .land-card {
      padding: 1rem;
    }

    .land-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .land-icon {
      font-size: 2rem;
    }

    .land-id {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .land-details {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .detail {
      display: flex;
      flex-direction: column;
    }

    .detail .label {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .detail .value {
      font-weight: 500;
    }

    .crop-history h5 {
      margin: 0 0 0.5rem;
      font-size: 0.875rem;
    }

    .history-items {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .history-item {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
      padding: 0.25rem 0;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }

    .text-muted {
      color: #64748b;
    }

    .logout-btn {
      margin-top: 2rem;
    }

    @media (max-width: 640px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
      .profile-header {
        flex-wrap: wrap;
      }
      .badge {
        margin-left: 0;
        margin-top: 1rem;
      }
    }
  `]
})
export class ProfileComponent {
  authMode: 'register' | 'login' = 'register';
  isLoading = false;
  error = '';
  farmer: Farmer | null = null;
  showAddLand = false;
  loginPhone = '';

  states = [
    'Andhra Pradesh', 'Bihar', 'Gujarat', 'Haryana', 'Karnataka',
    'Madhya Pradesh', 'Maharashtra', 'Punjab', 'Rajasthan', 'Tamil Nadu',
    'Telangana', 'Uttar Pradesh', 'West Bengal'
  ];

  regForm = {
    name: '',
    phone: '',
    language: 'hi',
    state: '',
    district: ''
  };

  landForm = {
    area: 0,
    soil_type: '',
    irrigation_type: ''
  };

  private apiUrl = 'http://127.0.0.1:8000/api/v1/farmer';

  async registerFarmer() {
    if (!this.regForm.name || !this.regForm.phone || !this.regForm.state) {
      this.error = 'Please fill all required fields';
      return;
    }

    this.isLoading = true;
    this.error = '';

    try {
      const res = await fetch(`${this.apiUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.regForm)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Registration failed');
      }

      const data = await res.json();
      this.farmer = { ...data, lands: [] };
      localStorage.setItem('farmer_id', data.id);
    } catch (e: any) {
      this.error = e.message;
    } finally {
      this.isLoading = false;
    }
  }

  async lookupFarmer() {
    if (!this.loginPhone || this.loginPhone.length !== 10) {
      this.error = 'Please enter valid 10-digit phone number';
      return;
    }

    this.isLoading = true;
    this.error = '';

    try {
      const res = await fetch(`${this.apiUrl}/lookup?phone=${this.loginPhone}`);
      if (!res.ok) {
        throw new Error('Profile not found');
      }

      const data = await res.json();
      await this.loadFarmerWithLands(data.id);
      localStorage.setItem('farmer_id', data.id);
    } catch (e: any) {
      this.error = e.message;
    } finally {
      this.isLoading = false;
    }
  }

  async loadFarmerWithLands(farmerId: string) {
    const profileRes = await fetch(`${this.apiUrl}/profile/${farmerId}`);
    const profile = await profileRes.json();

    const landsRes = await fetch(`${this.apiUrl}/land/farmer/${farmerId}`);
    const landsData = await landsRes.json();

    this.farmer = {
      ...profile,
      lands: landsData.lands || []
    };
  }

  async addLand() {
    if (!this.farmer || !this.landForm.area || !this.landForm.soil_type) {
      this.error = 'Please fill land details';
      return;
    }

    this.isLoading = true;

    try {
      const res = await fetch(`${this.apiUrl}/land/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmer_id: this.farmer.id,
          ...this.landForm
        })
      });

      if (!res.ok) throw new Error('Failed to add land');

      const land = await res.json();
      this.farmer.lands.push({ ...land, crop_history: [] });
      this.showAddLand = false;
      this.landForm = { area: 0, soil_type: '', irrigation_type: '' };
    } catch (e: any) {
      this.error = e.message;
    } finally {
      this.isLoading = false;
    }
  }

  getTotalArea(): number {
    return this.farmer?.lands.reduce((sum, l) => sum + l.area, 0) || 0;
  }

  getTotalCrops(): number {
    return this.farmer?.lands.reduce((sum, l) => sum + l.crop_history.length, 0) || 0;
  }

  logout() {
    this.farmer = null;
    localStorage.removeItem('farmer_id');
  }
}
