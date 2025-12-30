import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-market-prices',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="market-container">
      <header class="page-header">
        <h1>💰 Market Prices</h1>
        <p>Real-time mandi prices and market intelligence for your produce</p>
      </header>

      <div class="market-content">
        <!-- Search Section -->
        <div class="search-section glass-card">
          <div class="search-bar">
            <span class="search-icon">🔍</span>
            <input type="text" 
                   [(ngModel)]="searchQuery" 
                   placeholder="Search commodity (rice, wheat, cotton...)"
                   class="search-input"
                   (keyup.enter)="searchCommodity()">
          </div>
          <div class="quick-filters">
            <button *ngFor="let commodity of quickFilters" 
                    class="filter-btn" 
                    [class.active]="selectedCommodity === commodity"
                    (click)="selectCommodity(commodity)">
              {{ commodity }}
            </button>
          </div>
        </div>

        <!-- Price Overview -->
        <div class="price-overview" *ngIf="selectedCommodity">
          <div class="overview-header glass-card">
            <div class="commodity-info">
              <span class="commodity-icon">{{ getCommodityIcon(selectedCommodity) }}</span>
              <div>
                <h2>{{ selectedCommodity | titlecase }}</h2>
                <span class="trend-badge" [class]="priceData.trend">
                  {{ priceData.trend === 'up' ? '📈' : priceData.trend === 'down' ? '📉' : '➡️' }}
                  {{ priceData.trend | titlecase }}
                </span>
              </div>
            </div>
            <div class="national-avg">
              <span class="label">National Average</span>
              <span class="price">₹{{ priceData.nationalAverage }}</span>
              <span class="unit">per quintal</span>
            </div>
          </div>

          <!-- Advisory Card -->
          <div class="advisory-card glass-card" [class]="priceData.trend">
            <div class="advisory-icon">💡</div>
            <div class="advisory-content">
              <h4>Market Advisory</h4>
              <p>{{ priceData.advisory }}</p>
              <span class="best-time">Best time to sell: <strong>{{ priceData.bestTime }}</strong></span>
            </div>
          </div>

          <!-- Mandi Prices Table -->
          <div class="mandi-prices glass-card">
            <h3>📍 Mandi-wise Prices</h3>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Mandi</th>
                    <th>State</th>
                    <th>Min Price</th>
                    <th>Max Price</th>
                    <th>Modal Price</th>
                    <th>Change</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let mandi of priceData.mandiPrices">
                    <td>{{ mandi.name }}</td>
                    <td>{{ mandi.state }}</td>
                    <td>₹{{ mandi.minPrice }}</td>
                    <td>₹{{ mandi.maxPrice }}</td>
                    <td class="modal-price">₹{{ mandi.modalPrice }}</td>
                    <td [class]="mandi.change > 0 ? 'positive' : mandi.change < 0 ? 'negative' : ''">
                      {{ mandi.change > 0 ? '+' : '' }}{{ mandi.change.toFixed(1) }}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Price Trend Chart Placeholder -->
          <div class="price-chart glass-card">
            <h3>📊 30-Day Price Trend</h3>
            <div class="chart-placeholder">
              <div class="chart-bars">
                <div *ngFor="let bar of chartData" 
                     class="chart-bar" 
                     [style.height.%]="bar.height"
                     [title]="bar.date + ': ₹' + bar.price">
                </div>
              </div>
              <div class="chart-labels">
                <span>30 days ago</span>
                <span>Today</span>
              </div>
            </div>
          </div>
        </div>

        <!-- All Commodities Grid -->
        <div class="commodities-grid" *ngIf="!selectedCommodity">
          <h3>📋 All Commodities</h3>
          <div class="commodities-list">
            <div class="commodity-card glass-card" 
                 *ngFor="let item of allCommodities"
                 (click)="selectCommodity(item.name)">
              <span class="commodity-icon">{{ item.icon }}</span>
              <span class="commodity-name">{{ item.name }}</span>
              <span class="commodity-price">₹{{ item.avgPrice }}</span>
              <span class="commodity-trend" [class]="item.trend">
                {{ item.trend === 'up' ? '↑' : item.trend === 'down' ? '↓' : '→' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .market-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .page-header p {
      color: var(--text-secondary);
    }

    .market-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .search-section {
      padding: 1.5rem;
    }

    .search-bar {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: rgba(255, 255, 255, 0.05);
      padding: 0.75rem 1.25rem;
      border-radius: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.15);
      margin-bottom: 1rem;
    }

    .search-icon {
      font-size: 1.25rem;
    }

    .search-input {
      flex: 1;
      background: transparent;
      border: none;
      color: var(--text-primary);
      font-size: 1rem;
      outline: none;

      &::placeholder {
        color: var(--text-muted);
      }
    }

    .quick-filters {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .filter-btn {
      padding: 0.5rem 1.25rem;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 2rem;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.12);
        color: var(--text-primary);
      }

      &.active {
        background: rgba(16, 185, 129, 0.2);
        border-color: var(--primary-400);
        color: var(--primary-400);
      }
    }

    .overview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 2rem;
      flex-wrap: wrap;
      gap: 1.5rem;
    }

    .commodity-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .commodity-icon {
      font-size: 3rem;
    }

    .commodity-info h2 {
      font-size: 1.75rem;
      margin-bottom: 0.25rem;
    }

    .trend-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.85rem;
      font-weight: 600;

      &.up {
        background: rgba(34, 197, 94, 0.2);
        color: #22c55e;
      }

      &.down {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
      }

      &.stable {
        background: rgba(148, 163, 184, 0.2);
        color: #94a3b8;
      }
    }

    .national-avg {
      text-align: right;
    }

    .national-avg .label {
      display: block;
      color: var(--text-muted);
      font-size: 0.85rem;
    }

    .national-avg .price {
      font-size: 2rem;
      font-weight: 800;
      background: linear-gradient(135deg, #10b981, #f59e0b);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .national-avg .unit {
      display: block;
      color: var(--text-muted);
      font-size: 0.85rem;
    }

    .advisory-card {
      display: flex;
      align-items: flex-start;
      gap: 1.5rem;
      padding: 1.5rem;

      &.up {
        border-color: #22c55e;
        background: rgba(34, 197, 94, 0.1);
      }

      &.down {
        border-color: #f59e0b;
        background: rgba(245, 158, 11, 0.1);
      }
    }

    .advisory-icon {
      font-size: 2rem;
    }

    .advisory-content h4 {
      margin-bottom: 0.5rem;
      background: none;
      -webkit-text-fill-color: var(--text-primary);
    }

    .advisory-content p {
      margin-bottom: 0.75rem;
    }

    .best-time {
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    .mandi-prices {
      padding: 1.5rem;
    }

    .mandi-prices h3 {
      margin-bottom: 1rem;
      background: none;
      -webkit-text-fill-color: var(--text-primary);
    }

    .table-container {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th, td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    th {
      color: var(--text-muted);
      font-weight: 600;
      font-size: 0.85rem;
      text-transform: uppercase;
    }

    td {
      color: var(--text-secondary);
    }

    .modal-price {
      font-weight: 700;
      color: var(--text-primary);
    }

    .positive {
      color: #22c55e;
    }

    .negative {
      color: #ef4444;
    }

    .price-chart {
      padding: 1.5rem;
    }

    .price-chart h3 {
      margin-bottom: 1.5rem;
      background: none;
      -webkit-text-fill-color: var(--text-primary);
    }

    .chart-placeholder {
      height: 200px;
      display: flex;
      flex-direction: column;
    }

    .chart-bars {
      flex: 1;
      display: flex;
      align-items: flex-end;
      gap: 4px;
    }

    .chart-bar {
      flex: 1;
      background: linear-gradient(180deg, #10b981, #059669);
      border-radius: 4px 4px 0 0;
      min-height: 10px;
      transition: all 0.2s ease;
      cursor: pointer;

      &:hover {
        background: linear-gradient(180deg, #34d399, #10b981);
      }
    }

    .chart-labels {
      display: flex;
      justify-content: space-between;
      padding-top: 0.75rem;
      color: var(--text-muted);
      font-size: 0.85rem;
    }

    .commodities-grid h3 {
      margin-bottom: 1.5rem;
      background: none;
      -webkit-text-fill-color: var(--text-primary);
    }

    .commodities-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 1rem;
    }

    .commodity-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1.5rem;
      cursor: pointer;
      text-align: center;

      &:hover {
        border-color: var(--primary-400);
      }
    }

    .commodity-card .commodity-icon {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }

    .commodity-name {
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }

    .commodity-price {
      color: var(--primary-400);
      font-weight: 700;
    }

    .commodity-trend {
      margin-top: 0.5rem;
      font-weight: 700;

      &.up { color: #22c55e; }
      &.down { color: #ef4444; }
      &.stable { color: #94a3b8; }
    }
  `]
})
export class MarketPricesComponent implements OnInit {
    searchQuery = '';
    selectedCommodity = '';
    quickFilters = ['Rice', 'Wheat', 'Cotton', 'Onion', 'Tomato', 'Soybean'];

    priceData = {
        nationalAverage: 2250,
        trend: 'up',
        advisory: 'Prices are on an upward trend due to increased demand. Consider holding your stock for 1-2 weeks for better returns.',
        bestTime: 'Next 2 weeks',
        mandiPrices: [
            { name: 'Azadpur Mandi', state: 'Delhi', minPrice: 2100, maxPrice: 2400, modalPrice: 2300, change: 3.2 },
            { name: 'Vashi APMC', state: 'Maharashtra', minPrice: 2050, maxPrice: 2350, modalPrice: 2200, change: 1.5 },
            { name: 'Yeshwanthpur', state: 'Karnataka', minPrice: 2000, maxPrice: 2300, modalPrice: 2150, change: -0.8 },
            { name: 'Koyambedu', state: 'Tamil Nadu', minPrice: 2150, maxPrice: 2450, modalPrice: 2350, change: 4.1 }
        ]
    };

    chartData: { date: string; price: number; height: number }[] = [];

    allCommodities = [
        { name: 'Rice', icon: '🌾', avgPrice: 2250, trend: 'up' },
        { name: 'Wheat', icon: '🌾', avgPrice: 2400, trend: 'stable' },
        { name: 'Cotton', icon: '🧶', avgPrice: 6500, trend: 'up' },
        { name: 'Onion', icon: '🧅', avgPrice: 1500, trend: 'down' },
        { name: 'Tomato', icon: '🍅', avgPrice: 800, trend: 'up' },
        { name: 'Potato', icon: '🥔', avgPrice: 1200, trend: 'stable' },
        { name: 'Sugarcane', icon: '🎋', avgPrice: 350, trend: 'stable' },
        { name: 'Soybean', icon: '🫘', avgPrice: 4500, trend: 'up' }
    ];

    ngOnInit() {
        this.generateChartData();
    }

    generateChartData() {
        const basePrice = 2200;
        this.chartData = [];
        for (let i = 0; i < 30; i++) {
            const price = basePrice + Math.random() * 200 - 50;
            this.chartData.push({
                date: `Day ${i + 1}`,
                price: Math.round(price),
                height: ((price - 2000) / 400) * 100
            });
        }
    }

    selectCommodity(commodity: string) {
        this.selectedCommodity = commodity;
        this.searchQuery = commodity;
        this.generateChartData();
    }

    searchCommodity() {
        if (this.searchQuery) {
            this.selectedCommodity = this.searchQuery;
            this.generateChartData();
        }
    }

    getCommodityIcon(name: string): string {
        const icons: { [key: string]: string } = {
            'Rice': '🌾', 'Wheat': '🌾', 'Cotton': '🧶', 'Onion': '🧅',
            'Tomato': '🍅', 'Potato': '🥔', 'Sugarcane': '🎋', 'Soybean': '🫘'
        };
        return icons[name] || '🌱';
    }
}
