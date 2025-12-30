import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-expense',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="expense-container">
      <header class="page-header">
        <h1>💰 Expense & Profit Estimator</h1>
        <p>Track your farming costs and predict profits with AI</p>
      </header>

      <!-- Input Form -->
      <div class="input-section glass-card">
        <h3>📝 Enter Farming Expenses</h3>
        
        <div class="form-row">
          <div class="input-group">
            <label>Crop</label>
            <select [(ngModel)]="expense.crop" class="input">
              <option value="">Select Crop</option>
              <option *ngFor="let c of crops" [value]="c">{{ c }}</option>
            </select>
          </div>
          <div class="input-group">
            <label>Area (Acres)</label>
            <input type="number" [(ngModel)]="expense.area_acres" class="input" step="0.5" placeholder="e.g., 2.5">
          </div>
          <div class="input-group">
            <label>Season</label>
            <select [(ngModel)]="expense.season" class="input">
              <option value="kharif">Kharif (Monsoon)</option>
              <option value="rabi">Rabi (Winter)</option>
              <option value="zaid">Zaid (Summer)</option>
            </select>
          </div>
        </div>

        <h4>💸 Cost Breakdown (₹)</h4>
        <div class="cost-grid">
          <div class="cost-input">
            <label>🌱 Seed Cost</label>
            <input type="number" [(ngModel)]="expense.seed_cost" class="input" placeholder="0">
          </div>
          <div class="cost-input">
            <label>🧪 Fertilizer Cost</label>
            <input type="number" [(ngModel)]="expense.fertilizer_cost" class="input" placeholder="0">
          </div>
          <div class="cost-input">
            <label>🐛 Pesticide Cost</label>
            <input type="number" [(ngModel)]="expense.pesticide_cost" class="input" placeholder="0">
          </div>
          <div class="cost-input">
            <label>👷 Labor Cost</label>
            <input type="number" [(ngModel)]="expense.labor_cost" class="input" placeholder="0">
          </div>
          <div class="cost-input">
            <label>💧 Irrigation Cost</label>
            <input type="number" [(ngModel)]="expense.irrigation_cost" class="input" placeholder="0">
          </div>
          <div class="cost-input">
            <label>🚜 Machinery Cost</label>
            <input type="number" [(ngModel)]="expense.machinery_cost" class="input" placeholder="0">
          </div>
        </div>

        <button class="btn-primary" (click)="estimateProfit()" [disabled]="isLoading">
          {{ isLoading ? 'Calculating...' : '📊 Calculate Profit' }}
        </button>
      </div>

      <!-- Results -->
      <div class="results" *ngIf="result">
        <!-- Summary Cards -->
        <div class="summary-grid">
          <div class="summary-card expense glass-card">
            <span class="icon">📉</span>
            <div class="content">
              <span class="label">Total Expenses</span>
              <span class="value">₹{{ formatNumber(result.total_expenses) }}</span>
              <span class="sub">₹{{ formatNumber(result.expense_per_acre) }}/acre</span>
            </div>
          </div>
          <div class="summary-card yield glass-card">
            <span class="icon">🌾</span>
            <div class="content">
              <span class="label">Predicted Yield</span>
              <span class="value">{{ formatNumber(result.predicted_yield_kg) }} kg</span>
              <span class="sub">{{ result.yield_confidence * 100 }}% confidence</span>
            </div>
          </div>
          <div class="summary-card revenue glass-card">
            <span class="icon">💵</span>
            <div class="content">
              <span class="label">Expected Revenue</span>
              <span class="value">₹{{ formatNumber(result.expected_revenue) }}</span>
              <span class="sub">@ ₹{{ result.expected_price_at_harvest }}/kg</span>
            </div>
          </div>
          <div class="summary-card profit glass-card" [class.positive]="result.expected_profit > 0" [class.negative]="result.expected_profit < 0">
            <span class="icon">{{ result.expected_profit > 0 ? '🎉' : '⚠️' }}</span>
            <div class="content">
              <span class="label">Net Profit</span>
              <span class="value">₹{{ formatNumber(result.expected_profit) }}</span>
              <span class="sub">{{ result.profit_margin_percent }}% margin</span>
            </div>
          </div>
        </div>

        <!-- ROI & Metrics -->
        <div class="metrics-section glass-card">
          <h3>📈 Financial Metrics</h3>
          <div class="metrics-grid">
            <div class="metric">
              <span class="metric-label">ROI</span>
              <span class="metric-value" [class.positive]="result.roi_percent > 0">{{ result.roi_percent }}%</span>
            </div>
            <div class="metric">
              <span class="metric-label">Break-even Price</span>
              <span class="metric-value">₹{{ result.break_even_price }}/kg</span>
            </div>
            <div class="metric">
              <span class="metric-label">Current Price</span>
              <span class="metric-value">₹{{ result.current_market_price }}/kg</span>
            </div>
            <div class="metric">
              <span class="metric-label">Price Trend</span>
              <span class="metric-value trend" [class]="result.price_trend">
                {{ getTrendIcon(result.price_trend) }} {{ result.price_trend | titlecase }}
              </span>
            </div>
          </div>
        </div>

        <!-- Expense Breakdown -->
        <div class="breakdown-section glass-card">
          <h3>📊 Expense Breakdown</h3>
          <div class="breakdown-chart">
            <div class="breakdown-item" *ngFor="let item of result.expense_breakdown">
              <div class="bar-container">
                <div class="bar-label">{{ item.category }}</div>
                <div class="bar" [style.width.%]="item.percentage">
                  <span class="bar-value">{{ item.percentage }}%</span>
                </div>
              </div>
              <span class="amount">₹{{ formatNumber(item.amount) }}</span>
            </div>
          </div>
        </div>

        <!-- Risk Analysis -->
        <div class="risk-section glass-card" [class]="result.risk_level">
          <h3>⚠️ Risk Analysis</h3>
          <div class="risk-level">
            Risk Level: <span class="badge">{{ result.risk_level | uppercase }}</span>
          </div>
          <div class="risk-factors">
            <div class="factor" *ngFor="let f of result.risk_factors">{{ f }}</div>
          </div>
          <h4>💡 Recommendations</h4>
          <div class="recommendations">
            <div class="rec" *ngFor="let r of result.recommendations">✓ {{ r }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .expense-container {
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

    .form-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
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

    h4 {
      margin: 1rem 0;
      color: var(--text-secondary);
    }

    .cost-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .cost-input {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .cost-input label {
      font-size: 0.9rem;
      color: var(--text-muted);
    }

    .btn-primary {
      width: 100%;
      padding: 1rem;
      background: linear-gradient(135deg, #10b981, #059669);
      border: none;
      border-radius: 0.75rem;
      color: white;
      font-weight: 600;
      font-size: 1.1rem;
      cursor: pointer;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .summary-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
    }

    .summary-card .icon {
      font-size: 2rem;
    }

    .summary-card .content {
      display: flex;
      flex-direction: column;
    }

    .summary-card .label {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .summary-card .value {
      font-size: 1.25rem;
      font-weight: bold;
    }

    .summary-card .sub {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .summary-card.expense { border-left: 4px solid #ef4444; }
    .summary-card.yield { border-left: 4px solid #f59e0b; }
    .summary-card.revenue { border-left: 4px solid #3b82f6; }
    .summary-card.profit.positive { border-left: 4px solid #10b981; background: rgba(16,185,129,0.1); }
    .summary-card.profit.negative { border-left: 4px solid #ef4444; background: rgba(239,68,68,0.1); }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-top: 1rem;
    }

    .metric {
      text-align: center;
      padding: 1rem;
      background: rgba(0,0,0,0.2);
      border-radius: 0.5rem;
    }

    .metric-label {
      display: block;
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
    }

    .metric-value {
      font-size: 1.25rem;
      font-weight: bold;
    }

    .metric-value.positive { color: #10b981; }
    .trend.up { color: #10b981; }
    .trend.down { color: #ef4444; }
    .trend.stable { color: #3b82f6; }
    .trend.volatile { color: #f59e0b; }

    .breakdown-chart {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .breakdown-item {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .bar-container {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .bar-label {
      width: 80px;
      font-size: 0.85rem;
    }

    .bar {
      height: 24px;
      background: linear-gradient(90deg, #10b981, #f59e0b);
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 0.5rem;
      min-width: 40px;
    }

    .bar-value {
      font-size: 0.75rem;
      color: white;
    }

    .amount {
      width: 100px;
      text-align: right;
      font-weight: 500;
    }

    .risk-section.low { border-left: 4px solid #10b981; }
    .risk-section.medium { border-left: 4px solid #f59e0b; }
    .risk-section.high { border-left: 4px solid #ef4444; }

    .risk-level {
      margin-bottom: 1rem;
    }

    .badge {
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.8rem;
      font-weight: bold;
    }

    .risk-section.low .badge { background: rgba(16,185,129,0.2); color: #10b981; }
    .risk-section.medium .badge { background: rgba(245,158,11,0.2); color: #f59e0b; }
    .risk-section.high .badge { background: rgba(239,68,68,0.2); color: #ef4444; }

    .factor, .rec {
      padding: 0.5rem;
      margin-bottom: 0.5rem;
      background: rgba(0,0,0,0.2);
      border-radius: 0.25rem;
      font-size: 0.9rem;
    }

    .rec {
      color: #10b981;
    }

    @media (max-width: 768px) {
      .form-row, .cost-grid, .summary-grid, .metrics-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class ExpenseComponent {
  isLoading = false;
  result: any = null;

  crops = ['Rice', 'Wheat', 'Maize', 'Cotton', 'Tomato', 'Potato', 'Onion', 'Sugarcane', 'Soybean'];

  expense = {
    crop: '',
    area_acres: 1,
    season: 'kharif',
    state: 'Maharashtra',
    seed_cost: 0,
    fertilizer_cost: 0,
    pesticide_cost: 0,
    labor_cost: 0,
    irrigation_cost: 0,
    machinery_cost: 0,
    transport_cost: 0,
    other_cost: 0
  };

  private apiUrl = 'http://127.0.0.1:8000/api/v1/expense';

  async estimateProfit() {
    if (!this.expense.crop || !this.expense.area_acres) {
      alert('Please select crop and enter area');
      return;
    }

    this.isLoading = true;
    try {
      const res = await fetch(`${this.apiUrl}/estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.expense)
      });

      if (!res.ok) throw new Error('Failed to estimate');
      this.result = await res.json();
    } catch (e) {
      alert('Error calculating profit');
    } finally {
      this.isLoading = false;
    }
  }

  formatNumber(num: number): string {
    if (num >= 100000) {
      return (num / 100000).toFixed(1) + 'L';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toFixed(0);
  }

  getTrendIcon(trend: string): string {
    const icons: Record<string, string> = {
      up: '📈', down: '📉', stable: '➡️', volatile: '📊'
    };
    return icons[trend] || '📊';
  }
}
