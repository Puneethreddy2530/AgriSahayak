import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface CropCycle {
  cycle_id: string;
  land_id: string;
  crop: string;
  season: string;
  sowing_date: string;
  expected_harvest: string;
  growth_stage: string;
  health_status: string;
  days_since_sowing: number;
  yield_prediction: any;
  alerts: Alert[];
  activities: Activity[];
  is_active: boolean;
}

interface Alert {
  type: string;
  severity: string;
  message: string;
}

interface Activity {
  type: string;
  description: string;
  date: string;
}

@Component({
  selector: 'app-crop-cycle',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cropcycle-container">
      <header class="page-header">
        <h1>🌱 Crop Lifecycle Tracker</h1>
        <p>Track your crops from sowing to harvest with AI-powered insights</p>
      </header>

      <!-- Start New Cycle -->
      <div class="new-cycle-section glass-card">
        <h3>🚀 Start New Crop Cycle</h3>
        <div class="form-grid">
          <div class="input-group">
            <label>Land ID</label>
            <input type="text" [(ngModel)]="newCycle.land_id" placeholder="e.g., L123ABC" class="input">
          </div>
          <div class="input-group">
            <label>Crop</label>
            <select [(ngModel)]="newCycle.crop" class="input">
              <option value="">Select Crop</option>
              <option *ngFor="let c of crops" [value]="c">{{ c }}</option>
            </select>
          </div>
          <div class="input-group">
            <label>Season</label>
            <select [(ngModel)]="newCycle.season" class="input">
              <option value="kharif">Kharif (Monsoon)</option>
              <option value="rabi">Rabi (Winter)</option>
              <option value="zaid">Zaid (Summer)</option>
            </select>
          </div>
          <div class="input-group">
            <label>Sowing Date</label>
            <input type="date" [(ngModel)]="newCycle.sowing_date" class="input">
          </div>
        </div>
        <button class="btn-primary" (click)="startCycle()" [disabled]="isLoading">
          {{ isLoading ? 'Starting...' : '🌾 Start Tracking' }}
        </button>
      </div>

      <!-- Active Cycles -->
      <div class="active-cycles" *ngIf="cycles.length > 0">
        <h3>📊 Active Crop Cycles</h3>
        
        <div class="cycle-cards">
          <div class="cycle-card glass-card" *ngFor="let cycle of cycles" 
               [class.at-risk]="cycle.health_status === 'at_risk'"
               [class.infected]="cycle.health_status === 'infected'">
            
            <!-- Header -->
            <div class="cycle-header">
              <div class="crop-info">
                <span class="crop-icon">{{ getCropIcon(cycle.crop) }}</span>
                <div>
                  <h4>{{ cycle.crop | titlecase }}</h4>
                  <span class="cycle-id">{{ cycle.cycle_id }}</span>
                </div>
              </div>
              <span class="stage-badge" [class]="cycle.growth_stage">
                {{ formatStage(cycle.growth_stage) }}
              </span>
            </div>

            <!-- Progress Bar -->
            <div class="progress-section">
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="getProgress(cycle)"></div>
              </div>
              <div class="progress-labels">
                <span>Day {{ cycle.days_since_sowing }}</span>
                <span>Harvest: {{ cycle.expected_harvest }}</span>
              </div>
            </div>

            <!-- Health Status -->
            <div class="health-status" [class]="cycle.health_status">
              <span class="health-icon">{{ getHealthIcon(cycle.health_status) }}</span>
              <span>{{ formatHealth(cycle.health_status) }}</span>
            </div>

            <!-- Yield Prediction -->
            <div class="yield-prediction" *ngIf="cycle.yield_prediction">
              <div class="yield-header">
                <span>📈 Predicted Yield</span>
                <span class="confidence">{{ (cycle.yield_prediction.confidence * 100).toFixed(0) }}% conf</span>
              </div>
              <div class="yield-value">
                {{ cycle.yield_prediction.predicted_yield_kg_per_acre }} kg/acre
              </div>
            </div>

            <!-- Alerts -->
            <div class="alerts" *ngIf="cycle.alerts.length > 0">
              <div class="alert" *ngFor="let alert of cycle.alerts.slice(0, 2)" [class]="alert.severity">
                <span class="alert-icon">{{ getAlertIcon(alert.severity) }}</span>
                <span>{{ alert.message }}</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="cycle-actions">
              <button class="btn-sm" (click)="logActivity(cycle)">📝 Log Activity</button>
              <button class="btn-sm danger" (click)="reportDisease(cycle)">🔬 Report Disease</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state glass-card" *ngIf="cycles.length === 0 && !isLoading">
        <span class="empty-icon">🌾</span>
        <h3>No Active Crops</h3>
        <p>Start tracking your first crop cycle to get AI-powered insights!</p>
      </div>

      <!-- Activity Modal -->
      <div class="modal-overlay" *ngIf="showActivityModal" (click)="showActivityModal = false">
        <div class="modal glass-card" (click)="$event.stopPropagation()">
          <h3>📝 Log Farming Activity</h3>
          <div class="input-group">
            <label>Activity Type</label>
            <select [(ngModel)]="activityForm.type" class="input">
              <option value="irrigation">💧 Irrigation</option>
              <option value="fertilizer">🧪 Fertilizer</option>
              <option value="pesticide">🐛 Pesticide</option>
              <option value="weeding">🌿 Weeding</option>
              <option value="other">📋 Other</option>
            </select>
          </div>
          <div class="input-group">
            <label>Description</label>
            <textarea [(ngModel)]="activityForm.description" class="input" rows="3" placeholder="Describe the activity..."></textarea>
          </div>
          <button class="btn-primary" (click)="submitActivity()">✅ Log Activity</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cropcycle-container {
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
      grid-template-columns: repeat(2, 1fr);
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
      cursor: pointer;
    }

    .btn-primary:disabled {
      opacity: 0.6;
    }

    .cycle-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }

    .cycle-card {
      transition: all 0.3s;
    }

    .cycle-card.at-risk {
      border-color: #f59e0b;
      box-shadow: 0 0 20px rgba(245, 158, 11, 0.2);
    }

    .cycle-card.infected {
      border-color: #ef4444;
      box-shadow: 0 0 20px rgba(239, 68, 68, 0.2);
    }

    .cycle-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .crop-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .crop-icon {
      font-size: 2rem;
    }

    .crop-info h4 {
      margin: 0;
      font-size: 1.25rem;
    }

    .cycle-id {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .stage-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .stage-badge.germination { background: #7c3aed; color: white; }
    .stage-badge.vegetative { background: #10b981; color: white; }
    .stage-badge.flowering { background: #ec4899; color: white; }
    .stage-badge.maturity { background: #f59e0b; color: white; }
    .stage-badge.harvest { background: #06b6d4; color: white; }

    .progress-section {
      margin-bottom: 1rem;
    }

    .progress-bar {
      height: 8px;
      background: rgba(255,255,255,0.1);
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #10b981, #f59e0b);
      transition: width 0.5s;
    }

    .progress-labels {
      display: flex;
      justify-content: space-between;
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .health-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      margin-bottom: 1rem;
      font-weight: 500;
    }

    .health-status.healthy { background: rgba(16, 185, 129, 0.2); color: #10b981; }
    .health-status.at_risk { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
    .health-status.infected { background: rgba(239, 68, 68, 0.2); color: #ef4444; }

    .yield-prediction {
      background: rgba(0,0,0,0.2);
      padding: 1rem;
      border-radius: 0.5rem;
      margin-bottom: 1rem;
    }

    .yield-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .confidence {
      color: var(--text-muted);
    }

    .yield-value {
      font-size: 1.5rem;
      font-weight: bold;
      color: var(--primary-400);
    }

    .alerts {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .alert {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.875rem;
    }

    .alert.info { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
    .alert.warning { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
    .alert.critical { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

    .cycle-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-sm {
      flex: 1;
      padding: 0.5rem;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 0.5rem;
      color: white;
      font-size: 0.75rem;
      cursor: pointer;
    }

    .btn-sm.danger {
      border-color: rgba(239, 68, 68, 0.3);
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
    }

    .empty-icon {
      font-size: 4rem;
    }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {
      width: 90%;
      max-width: 400px;
    }

    @media (max-width: 640px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CropCycleComponent implements OnInit {
  cycles: CropCycle[] = [];
  isLoading = false;
  showActivityModal = false;
  selectedCycle: CropCycle | null = null;

  crops = ['Rice', 'Wheat', 'Maize', 'Cotton', 'Tomato', 'Potato', 'Onion', 'Sugarcane'];

  newCycle = {
    land_id: '',
    crop: '',
    season: 'kharif',
    sowing_date: ''
  };

  activityForm = {
    type: 'irrigation',
    description: ''
  };

  private apiUrl = 'http://127.0.0.1:8000/api/v1/cropcycle';

  ngOnInit() {
    this.loadActiveCycles();
  }

  async loadActiveCycles() {
    try {
      const res = await fetch(`${this.apiUrl}/active/all`);
      const data = await res.json();
      this.cycles = data.cycles || [];
    } catch (e) {
      console.error('Failed to load cycles', e);
    }
  }

  async startCycle() {
    if (!this.newCycle.land_id || !this.newCycle.crop || !this.newCycle.sowing_date) {
      alert('Please fill all fields');
      return;
    }

    this.isLoading = true;
    try {
      const res = await fetch(`${this.apiUrl}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.newCycle)
      });

      if (!res.ok) throw new Error('Failed to start cycle');

      const cycle = await res.json();
      this.cycles.unshift(cycle);
      this.newCycle = { land_id: '', crop: '', season: 'kharif', sowing_date: '' };
    } catch (e) {
      alert('Error starting cycle');
    } finally {
      this.isLoading = false;
    }
  }

  logActivity(cycle: CropCycle) {
    this.selectedCycle = cycle;
    this.showActivityModal = true;
  }

  async submitActivity() {
    if (!this.selectedCycle || !this.activityForm.description) return;

    try {
      await fetch(`${this.apiUrl}/${this.selectedCycle.cycle_id}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_type: this.activityForm.type,
          description: this.activityForm.description
        })
      });

      this.showActivityModal = false;
      this.activityForm = { type: 'irrigation', description: '' };
      await this.loadActiveCycles();
    } catch (e) {
      alert('Error logging activity');
    }
  }

  async reportDisease(cycle: CropCycle) {
    const disease = prompt('Enter disease name detected:');
    if (!disease) return;

    try {
      const res = await fetch(`${this.apiUrl}/${cycle.cycle_id}/report-disease`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disease_name: disease,
          confidence: 0.85,
          affected_area_percent: 10
        })
      });

      const data = await res.json();
      alert(`Disease reported! Health: ${data.new_health_status}`);
      await this.loadActiveCycles();
    } catch (e) {
      alert('Error reporting disease');
    }
  }

  getCropIcon(crop: string): string {
    const icons: Record<string, string> = {
      rice: '🌾', wheat: '🌾', maize: '🌽', cotton: '🧶',
      tomato: '🍅', potato: '🥔', onion: '🧅', sugarcane: '🎋'
    };
    return icons[crop.toLowerCase()] || '🌱';
  }

  formatStage(stage: string): string {
    return stage.replace('_', ' ');
  }

  formatHealth(status: string): string {
    const labels: Record<string, string> = {
      healthy: '✅ Healthy',
      at_risk: '⚠️ At Risk',
      infected: '🔴 Infected',
      recovered: '💪 Recovered'
    };
    return labels[status] || status;
  }

  getHealthIcon(status: string): string {
    const icons: Record<string, string> = {
      healthy: '💚', at_risk: '💛', infected: '❤️', recovered: '💙'
    };
    return icons[status] || '❓';
  }

  getAlertIcon(severity: string): string {
    const icons: Record<string, string> = {
      info: 'ℹ️', warning: '⚠️', critical: '🚨'
    };
    return icons[severity] || '📢';
  }

  getProgress(cycle: CropCycle): number {
    const sowing = new Date(cycle.sowing_date).getTime();
    const harvest = new Date(cycle.expected_harvest).getTime();
    const now = Date.now();
    const progress = ((now - sowing) / (harvest - sowing)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  }
}
