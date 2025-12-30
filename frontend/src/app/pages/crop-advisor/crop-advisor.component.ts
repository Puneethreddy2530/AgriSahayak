import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface CropRecommendation {
    crop_name: string;
    confidence: number;
    season: string;
    water_requirement: string;
    expected_yield: string;
}

@Component({
    selector: 'app-crop-advisor',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="crop-advisor-container">
      <header class="page-header">
        <h1>🌱 Crop Advisor</h1>
        <p>Get AI-powered crop recommendations based on your soil and climate conditions</p>
      </header>

      <div class="advisor-content">
        <!-- Input Form -->
        <div class="input-section glass-card">
          <h3>📊 Enter Your Field Data</h3>
          
          <div class="form-grid">
            <div class="input-group">
              <label>Nitrogen (N) kg/ha</label>
              <input type="number" [(ngModel)]="formData.nitrogen" placeholder="0-140" class="input">
            </div>
            <div class="input-group">
              <label>Phosphorus (P) kg/ha</label>
              <input type="number" [(ngModel)]="formData.phosphorus" placeholder="0-145" class="input">
            </div>
            <div class="input-group">
              <label>Potassium (K) kg/ha</label>
              <input type="number" [(ngModel)]="formData.potassium" placeholder="0-205" class="input">
            </div>
            <div class="input-group">
              <label>Temperature (°C)</label>
              <input type="number" [(ngModel)]="formData.temperature" placeholder="10-45" class="input">
            </div>
            <div class="input-group">
              <label>Humidity (%)</label>
              <input type="number" [(ngModel)]="formData.humidity" placeholder="0-100" class="input">
            </div>
            <div class="input-group">
              <label>Soil pH</label>
              <input type="number" [(ngModel)]="formData.ph" step="0.1" placeholder="3.5-9.5" class="input">
            </div>
            <div class="input-group full-width">
              <label>Annual Rainfall (mm)</label>
              <input type="number" [(ngModel)]="formData.rainfall" placeholder="20-300" class="input">
            </div>
          </div>

          <button class="btn-primary btn-full" (click)="getRecommendations()" [disabled]="isLoading">
            <span *ngIf="!isLoading">🔍 Get Recommendations</span>
            <span *ngIf="isLoading">⏳ Analyzing...</span>
          </button>
        </div>

        <!-- Results Section -->
        <div class="results-section" *ngIf="recommendations.length > 0">
          <h3>🌾 Recommended Crops</h3>
          
          <div class="recommendations-grid">
            <div class="recommendation-card glass-card" 
                 *ngFor="let rec of recommendations; let i = index"
                 [class.top-pick]="i === 0">
              <div class="rank-badge" *ngIf="i === 0">🏆 TOP PICK</div>
              <div class="crop-icon">{{ getCropIcon(rec.crop_name) }}</div>
              <h4>{{ rec.crop_name }}</h4>
              
              <div class="confidence-bar">
                <div class="confidence-fill" [style.width.%]="rec.confidence * 100"></div>
              </div>
              <span class="confidence-text">{{ (rec.confidence * 100).toFixed(0) }}% Match</span>
              
              <div class="crop-details">
                <div class="detail">
                  <span class="label">Season</span>
                  <span class="value">{{ rec.season }}</span>
                </div>
                <div class="detail">
                  <span class="label">Water</span>
                  <span class="value">{{ rec.water_requirement }}</span>
                </div>
                <div class="detail">
                  <span class="label">Yield</span>
                  <span class="value">{{ rec.expected_yield }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Soil Health -->
          <div class="soil-health glass-card" *ngIf="soilHealth">
            <h4>🌿 Soil Health Assessment</h4>
            <div class="health-indicator" [class.good]="soilHealth === 'Good'" 
                 [class.excellent]="soilHealth === 'Excellent'"
                 [class.needs-work]="soilHealth === 'Needs Improvement'">
              {{ soilHealth }}
            </div>
            <p class="advisory">{{ advisory }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .crop-advisor-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .page-header p {
      color: var(--text-secondary);
      font-size: 1.1rem;
    }

    .advisor-content {
      display: grid;
      gap: 2rem;
    }

    .input-section {
      padding: 2rem;
    }

    .input-section h3 {
      margin-bottom: 1.5rem;
      background: none;
      -webkit-text-fill-color: var(--text-primary);
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .input-group.full-width {
      grid-column: 1 / -1;
    }

    .input-group label {
      font-size: 0.9rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .input {
      padding: 0.875rem 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 0.75rem;
      color: var(--text-primary);
      font-size: 1rem;
      transition: all 0.2s ease;

      &:focus {
        outline: none;
        border-color: var(--primary-400);
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
      }

      &::placeholder {
        color: var(--text-muted);
      }
    }

    .btn-primary {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1rem 2rem;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border: none;
      border-radius: 0.75rem;
      color: white;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.25s ease;
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);

      &:hover:not(:disabled) {
        box-shadow: 0 0 30px rgba(16, 185, 129, 0.5);
        transform: translateY(-2px);
      }

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
    }

    .btn-full {
      width: 100%;
    }

    .results-section h3 {
      margin-bottom: 1.5rem;
      text-align: center;
      background: none;
      -webkit-text-fill-color: var(--text-primary);
    }

    .recommendations-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .recommendation-card {
      padding: 1.5rem;
      text-align: center;
      position: relative;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-5px);
      }

      &.top-pick {
        border-color: var(--primary-400);
        box-shadow: 0 0 30px rgba(16, 185, 129, 0.3);
      }
    }

    .rank-badge {
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #f59e0b, #d97706);
      padding: 0.25rem 1rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: white;
    }

    .crop-icon {
      font-size: 3rem;
      margin-bottom: 0.75rem;
    }

    .recommendation-card h4 {
      font-size: 1.25rem;
      margin-bottom: 1rem;
      background: none;
      -webkit-text-fill-color: var(--text-primary);
    }

    .confidence-bar {
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 1rem;
      overflow: hidden;
      margin-bottom: 0.5rem;
    }

    .confidence-fill {
      height: 100%;
      background: linear-gradient(90deg, #10b981, #f59e0b);
      border-radius: 1rem;
      transition: width 0.5s ease;
    }

    .confidence-text {
      font-size: 0.85rem;
      color: var(--primary-400);
      font-weight: 600;
    }

    .crop-details {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .detail {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .detail .label {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
    }

    .detail .value {
      font-size: 0.85rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .soil-health {
      padding: 2rem;
      text-align: center;
    }

    .soil-health h4 {
      margin-bottom: 1rem;
      background: none;
      -webkit-text-fill-color: var(--text-primary);
    }

    .health-indicator {
      display: inline-block;
      padding: 0.5rem 2rem;
      border-radius: 2rem;
      font-weight: 700;
      font-size: 1.1rem;
      margin-bottom: 1rem;

      &.good {
        background: rgba(34, 197, 94, 0.2);
        color: #22c55e;
      }

      &.excellent {
        background: rgba(16, 185, 129, 0.2);
        color: #10b981;
      }

      &.needs-work {
        background: rgba(245, 158, 11, 0.2);
        color: #f59e0b;
      }
    }

    .advisory {
      max-width: 600px;
      margin: 0 auto;
      color: var(--text-secondary);
    }
  `]
})
export class CropAdvisorComponent {
    formData = {
        nitrogen: 50,
        phosphorus: 40,
        potassium: 30,
        temperature: 28,
        humidity: 70,
        ph: 6.5,
        rainfall: 150
    };

    recommendations: CropRecommendation[] = [];
    soilHealth = '';
    advisory = '';
    isLoading = false;

    async getRecommendations() {
        this.isLoading = true;
        this.recommendations = [];
        this.soilHealth = '';
        this.advisory = '';

        try {
            const apiUrl = 'http://127.0.0.1:8000/api/v1/crop/recommend';
            const res = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.formData)
            });

            if (!res.ok) {
                throw new Error('Failed to get recommendations');
            }

            const data = await res.json();

            if (data.success) {
                this.recommendations = data.recommendations;
                this.soilHealth = data.soil_health;
                this.advisory = data.advisory;
            }
        } catch (e) {
            console.error('Error fetching recommendations:', e);
            alert('Failed to get recommendations. Please try again.');
        } finally {
            this.isLoading = false;
        }
    }

    getCropIcon(cropName: string): string {
        const icons: { [key: string]: string } = {
            'Rice': '🌾',
            'Wheat': '🌾',
            'Maize': '🌽',
            'Cotton': '🧶',
            'Sugarcane': '🎋',
            'Potato': '🥔',
            'Tomato': '🍅',
            'Onion': '🧅'
        };
        return icons[cropName] || '🌱';
    }
}
