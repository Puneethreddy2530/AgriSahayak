import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface FertilizerRecommendation {
    name: string;
    name_hindi: string;
    type: string;
    dosage_kg_per_acre: number;
    application_method: string;
    best_time: string;
    cost_estimate: string;
    priority: string;
}

interface PesticideRecommendation {
    name: string;
    target: string;
    type: string;
    dosage: string;
    application_method: string;
    safety_interval_days: number;
    organic_alternative?: string;
}

@Component({
    selector: 'app-fertilizer',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="fertilizer-container">
      <header class="page-header">
        <h1>🧪 Fertilizer & Pesticide Advisory</h1>
        <p>Smart recommendations based on your soil NPK levels</p>
      </header>

      <!-- Input Form -->
      <div class="input-section glass-card">
        <h3>📊 Enter Soil Test Results</h3>
        <div class="form-grid">
          <div class="input-group">
            <label>Crop</label>
            <select [(ngModel)]="crop" class="input">
              <option value="">Select Crop</option>
              <option *ngFor="let c of crops" [value]="c">{{ c }}</option>
            </select>
          </div>
          <div class="input-group">
            <label>Nitrogen (N) kg/ha</label>
            <input type="number" [(ngModel)]="soil.nitrogen" class="input" placeholder="e.g., 150">
          </div>
          <div class="input-group">
            <label>Phosphorus (P) kg/ha</label>
            <input type="number" [(ngModel)]="soil.phosphorus" class="input" placeholder="e.g., 40">
          </div>
          <div class="input-group">
            <label>Potassium (K) kg/ha</label>
            <input type="number" [(ngModel)]="soil.potassium" class="input" placeholder="e.g., 100">
          </div>
          <div class="input-group">
            <label>Soil pH</label>
            <input type="number" [(ngModel)]="soil.ph" class="input" step="0.1" placeholder="e.g., 6.5">
          </div>
          <div class="input-group">
            <label>Organic Carbon (%)</label>
            <input type="number" [(ngModel)]="soil.organic_carbon" class="input" step="0.1" placeholder="e.g., 0.5">
          </div>
        </div>
        <button class="btn-primary" (click)="getRecommendations()" [disabled]="isLoading">
          {{ isLoading ? 'Analyzing...' : '🔬 Get Smart Recommendations' }}
        </button>
      </div>

      <!-- Results -->
      <div class="results" *ngIf="result">
        <!-- Soil Status -->
        <div class="soil-status glass-card">
          <h3>🌱 Soil Status: {{ result.crop }}</h3>
          <div class="status-grid">
            <div class="status-item" [class]="result.soil_status.nitrogen">
              <span class="nutrient">N</span>
              <span>{{ result.soil_status.nitrogen | titlecase }}</span>
            </div>
            <div class="status-item" [class]="result.soil_status.phosphorus">
              <span class="nutrient">P</span>
              <span>{{ result.soil_status.phosphorus | titlecase }}</span>
            </div>
            <div class="status-item" [class]="result.soil_status.potassium">
              <span class="nutrient">K</span>
              <span>{{ result.soil_status.potassium | titlecase }}</span>
            </div>
            <div class="status-item" [class]="result.soil_status.ph">
              <span class="nutrient">pH</span>
              <span>{{ result.soil_status.ph | titlecase }}</span>
            </div>
          </div>
        </div>

        <!-- Warnings -->
        <div class="warnings glass-card" *ngIf="result.warnings.length > 0">
          <div class="warning" *ngFor="let w of result.warnings">{{ w }}</div>
        </div>

        <!-- Fertilizer Recommendations -->
        <div class="fertilizer-section">
          <h3>🌾 Fertilizer Recommendations</h3>
          <div class="rec-cards">
            <div class="rec-card glass-card" *ngFor="let rec of result.fertilizer_recommendations" [class]="rec.priority">
              <div class="rec-header">
                <div>
                  <h4>{{ rec.name }}</h4>
                  <span class="hindi">{{ rec.name_hindi }}</span>
                </div>
                <span class="priority-badge">{{ rec.priority | titlecase }}</span>
              </div>
              <div class="rec-details">
                <div class="detail-row">
                  <span class="label">📦 Dosage:</span>
                  <span class="value">{{ rec.dosage_kg_per_acre }} kg/acre</span>
                </div>
                <div class="detail-row">
                  <span class="label">🕐 When:</span>
                  <span class="value">{{ rec.best_time }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">💰 Cost:</span>
                  <span class="value">{{ rec.cost_estimate }}</span>
                </div>
              </div>
              <p class="method">{{ rec.application_method }}</p>
            </div>
          </div>
          <div class="total-cost">
            💰 Total Estimated Cost: <strong>{{ result.total_cost_estimate }}</strong>
          </div>
        </div>

        <!-- Pesticide Recommendations -->
        <div class="pesticide-section">
          <h3>🐛 Pest & Disease Protection</h3>
          <div class="pest-cards">
            <div class="pest-card glass-card" *ngFor="let pest of result.pesticide_recommendations">
              <div class="pest-header">
                <span class="pest-type">{{ pest.type }}</span>
                <h4>{{ pest.name }}</h4>
              </div>
              <p class="target">For: {{ pest.target }}</p>
              <div class="pest-details">
                <span>📊 {{ pest.dosage }}</span>
                <span>🕐 {{ pest.safety_interval_days }} days safety</span>
              </div>
              <div class="organic" *ngIf="pest.organic_alternative">
                🌿 Organic: {{ pest.organic_alternative }}
              </div>
            </div>
          </div>
        </div>

        <!-- Schedule -->
        <div class="schedule-section glass-card">
          <h3>📅 Application Schedule</h3>
          <div class="timeline">
            <div class="timeline-item" *ngFor="let s of result.application_schedule">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <strong>{{ s.timing }}</strong>
                <span *ngFor="let p of s.products">{{ p }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .fertilizer-container {
      max-width: 1000px;
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
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .input-group label {
      font-weight: 500;
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    .input {
      padding: 0.75rem 1rem;
      background: rgba(0,0,0,0.2);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 0.5rem;
      color: white;
      font-size: 1rem;
    }

    .btn-primary {
      width: 100%;
      padding: 1rem;
      background: linear-gradient(135deg, #10b981, #059669);
      border: none;
      border-radius: 0.75rem;
      color: white;
      font-weight: 600;
      cursor: pointer;
    }

    .soil-status {
      background: linear-gradient(135deg, rgba(16,185,129,0.1), rgba(245,158,11,0.1));
    }

    .status-grid {
      display: flex;
      justify-content: space-around;
      margin-top: 1rem;
    }

    .status-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .nutrient {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 1.25rem;
    }

    .status-item.deficient .nutrient { background: rgba(239,68,68,0.3); color: #ef4444; }
    .status-item.low .nutrient { background: rgba(245,158,11,0.3); color: #f59e0b; }
    .status-item.adequate .nutrient { background: rgba(16,185,129,0.3); color: #10b981; }
    .status-item.acidic .nutrient { background: rgba(239,68,68,0.3); color: #ef4444; }
    .status-item.alkaline .nutrient { background: rgba(59,130,246,0.3); color: #3b82f6; }
    .status-item.neutral .nutrient { background: rgba(16,185,129,0.3); color: #10b981; }

    .warnings {
      background: rgba(239,68,68,0.1);
      border-color: rgba(239,68,68,0.3);
    }

    .warning {
      padding: 0.5rem;
      font-size: 0.9rem;
    }

    .rec-cards, .pest-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }

    .rec-card {
      padding: 1rem;
    }

    .rec-card.high { border-left: 4px solid #ef4444; }
    .rec-card.medium { border-left: 4px solid #f59e0b; }
    .rec-card.low { border-left: 4px solid #10b981; }

    .rec-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 1rem;
    }

    .rec-header h4 {
      margin: 0;
      font-size: 1.1rem;
    }

    .hindi {
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .priority-badge {
      padding: 0.25rem 0.5rem;
      background: rgba(255,255,255,0.1);
      border-radius: 0.25rem;
      font-size: 0.75rem;
    }

    .rec-details {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
    }

    .label {
      color: var(--text-muted);
    }

    .value {
      font-weight: 500;
    }

    .method {
      font-size: 0.8rem;
      color: var(--text-secondary);
      font-style: italic;
      margin: 0;
    }

    .total-cost {
      text-align: center;
      padding: 1rem;
      background: rgba(16,185,129,0.1);
      border-radius: 0.5rem;
      margin-top: 1rem;
      font-size: 1.1rem;
    }

    .pest-card {
      padding: 1rem;
    }

    .pest-header {
      margin-bottom: 0.5rem;
    }

    .pest-type {
      font-size: 0.75rem;
      text-transform: uppercase;
      color: var(--primary-400);
    }

    .target {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin: 0.5rem 0;
    }

    .pest-details {
      display: flex;
      gap: 1rem;
      font-size: 0.8rem;
    }

    .organic {
      margin-top: 0.5rem;
      padding: 0.5rem;
      background: rgba(16,185,129,0.1);
      border-radius: 0.25rem;
      font-size: 0.8rem;
      color: #10b981;
    }

    .timeline {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .timeline-item {
      display: flex;
      gap: 1rem;
      align-items: start;
    }

    .timeline-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--primary-400);
      margin-top: 5px;
    }

    .timeline-content {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .timeline-content span {
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    @media (max-width: 768px) {
      .form-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class FertilizerComponent {
    isLoading = false;
    result: any = null;

    crops = ['Rice', 'Wheat', 'Maize', 'Cotton', 'Tomato', 'Potato', 'Onion', 'Sugarcane'];
    crop = '';

    soil = {
        nitrogen: 150,
        phosphorus: 40,
        potassium: 100,
        ph: 6.5,
        organic_carbon: 0.5
    };

    private apiUrl = 'http://localhost:8000/api/v1/fertilizer';

    async getRecommendations() {
        if (!this.crop) {
            alert('Please select a crop');
            return;
        }

        this.isLoading = true;
        try {
            const res = await fetch(`${this.apiUrl}/recommend?crop=${this.crop}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.soil)
            });

            if (!res.ok) throw new Error('Failed to get recommendations');
            this.result = await res.json();
        } catch (e) {
            alert('Error getting recommendations');
        } finally {
            this.isLoading = false;
        }
    }
}
