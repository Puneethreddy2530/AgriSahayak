import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Scheme {
    id: string;
    name: string;
    nameHindi: string;
    ministry: string;
    description: string;
    benefits: string[];
    eligibility: string[];
    documents: string[];
    applyLink: string;
    helpline: string;
}

@Component({
    selector: 'app-schemes',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="schemes-container">
      <header class="page-header">
        <h1>📋 Government Schemes</h1>
        <p>Discover subsidies and welfare schemes you're eligible for</p>
      </header>

      <div class="schemes-content">
        <!-- Filter Section -->
        <div class="filter-section glass-card">
          <div class="search-bar">
            <span class="search-icon">🔍</span>
            <input type="text" 
                   [(ngModel)]="searchQuery" 
                   placeholder="Search schemes..."
                   class="search-input"
                   (input)="filterSchemes()">
          </div>
          <div class="category-filters">
            <button *ngFor="let cat of categories" 
                    class="category-btn"
                    [class.active]="selectedCategory === cat"
                    (click)="selectCategory(cat)">
              {{ cat }}
            </button>
          </div>
        </div>

        <!-- Eligibility Check CTA -->
        <div class="eligibility-cta glass-card-highlight">
          <div class="cta-content">
            <span class="cta-icon">✅</span>
            <div>
              <h3>Check Your Eligibility</h3>
              <p>Answer a few questions to find schemes you qualify for</p>
            </div>
          </div>
          <button class="btn-primary" (click)="startEligibilityCheck()">
            Start Check →
          </button>
        </div>

        <!-- Schemes Grid -->
        <div class="schemes-grid">
          <div class="scheme-card glass-card" 
               *ngFor="let scheme of filteredSchemes"
               (click)="openScheme(scheme)"
               [class.expanded]="expandedScheme === scheme.id">
            
            <div class="scheme-header">
              <div class="scheme-titles">
                <h3>{{ scheme.name }}</h3>
                <span class="scheme-hindi">{{ scheme.nameHindi }}</span>
              </div>
              <span class="ministry-badge">{{ scheme.ministry }}</span>
            </div>

            <p class="scheme-desc">{{ scheme.description }}</p>

            <div class="scheme-benefits">
              <h4>✨ Key Benefits</h4>
              <ul>
                <li *ngFor="let benefit of scheme.benefits.slice(0, 3)">{{ benefit }}</li>
              </ul>
            </div>

            <div class="scheme-footer">
              <span class="helpline">📞 {{ scheme.helpline }}</span>
              <a [href]="scheme.applyLink" target="_blank" class="apply-link" (click)="$event.stopPropagation()">
                Apply Now →
              </a>
            </div>

            <!-- Expanded Details -->
            <div class="scheme-details" *ngIf="expandedScheme === scheme.id">
              <div class="detail-section">
                <h4>📝 Eligibility</h4>
                <ul>
                  <li *ngFor="let item of scheme.eligibility">{{ item }}</li>
                </ul>
              </div>
              <div class="detail-section">
                <h4>📄 Documents Required</h4>
                <ul>
                  <li *ngFor="let doc of scheme.documents">{{ doc }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- No Results -->
        <div class="no-results glass-card" *ngIf="filteredSchemes.length === 0">
          <span class="no-results-icon">🔍</span>
          <h3>No schemes found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .schemes-container {
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

    .schemes-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .filter-section {
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
    }

    .category-filters {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .category-btn {
      padding: 0.5rem 1.25rem;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 2rem;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.12);
      }

      &.active {
        background: rgba(16, 185, 129, 0.2);
        border-color: var(--primary-400);
        color: var(--primary-400);
      }
    }

    .eligibility-cta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem 2rem;
      flex-wrap: wrap;
      gap: 1rem;
      border-color: var(--accent-gold);
      box-shadow: 0 0 30px rgba(245, 158, 11, 0.2);
    }

    .cta-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .cta-icon {
      font-size: 2.5rem;
    }

    .cta-content h3 {
      margin-bottom: 0.25rem;
      background: linear-gradient(135deg, #f59e0b, #fbbf24);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .cta-content p {
      color: var(--text-secondary);
      margin: 0;
    }

    .btn-primary {
      padding: 0.875rem 1.5rem;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border: none;
      border-radius: 0.75rem;
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.25s ease;
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);

      &:hover {
        box-shadow: 0 0 30px rgba(16, 185, 129, 0.5);
        transform: translateY(-2px);
      }
    }

    .schemes-grid {
      display: grid;
      gap: 1.5rem;
    }

    .scheme-card {
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        border-color: var(--primary-400);
      }

      &.expanded {
        border-color: var(--primary-400);
        box-shadow: 0 0 30px rgba(16, 185, 129, 0.2);
      }
    }

    .scheme-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .scheme-titles h3 {
      font-size: 1.25rem;
      margin-bottom: 0.25rem;
      background: none;
      -webkit-text-fill-color: var(--text-primary);
    }

    .scheme-hindi {
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    .ministry-badge {
      padding: 0.25rem 0.75rem;
      background: rgba(59, 130, 246, 0.2);
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 1rem;
      font-size: 0.75rem;
      color: #3b82f6;
    }

    .scheme-desc {
      color: var(--text-secondary);
      margin-bottom: 1.25rem;
      line-height: 1.6;
    }

    .scheme-benefits h4 {
      font-size: 0.9rem;
      margin-bottom: 0.75rem;
      background: none;
      -webkit-text-fill-color: var(--text-primary);
    }

    .scheme-benefits ul {
      padding-left: 1.25rem;
      color: var(--text-secondary);
    }

    .scheme-benefits li {
      margin-bottom: 0.5rem;
    }

    .scheme-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .helpline {
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    .apply-link {
      color: var(--primary-400);
      font-weight: 600;
      transition: gap 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;

      &:hover {
        gap: 0.5rem;
      }
    }

    .scheme-details {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .detail-section h4 {
      font-size: 0.9rem;
      margin-bottom: 0.75rem;
      background: none;
      -webkit-text-fill-color: var(--text-primary);
    }

    .detail-section ul {
      padding-left: 1.25rem;
      color: var(--text-secondary);
    }

    .detail-section li {
      margin-bottom: 0.5rem;
    }

    .no-results {
      text-align: center;
      padding: 3rem;
    }

    .no-results-icon {
      font-size: 4rem;
      display: block;
      margin-bottom: 1rem;
    }

    .no-results h3 {
      margin-bottom: 0.5rem;
      background: none;
      -webkit-text-fill-color: var(--text-primary);
    }

    .no-results p {
      margin: 0 auto;
    }
  `]
})
export class SchemesComponent {
    searchQuery = '';
    selectedCategory = 'All';
    expandedScheme = '';
    categories = ['All', 'Income Support', 'Insurance', 'Credit', 'Irrigation', 'Soil Health'];

    schemes: Scheme[] = [
        {
            id: 'pm-kisan',
            name: 'PM-KISAN',
            nameHindi: 'पीएम-किसान सम्मान निधि',
            ministry: 'Ministry of Agriculture',
            description: 'Direct income support of ₹6000/year to farmer families, transferred in three installments directly to bank accounts.',
            benefits: ['₹6000 per year in 3 installments', 'Direct bank transfer', 'No intermediaries'],
            eligibility: ['Small and marginal farmers', 'Landholding up to 2 hectares', 'Valid Aadhaar card'],
            documents: ['Aadhaar Card', 'Land records (Khatauni)', 'Bank account details'],
            applyLink: 'https://pmkisan.gov.in',
            helpline: '155261'
        },
        {
            id: 'pmfby',
            name: 'PM Fasal Bima Yojana',
            nameHindi: 'प्रधानमंत्री फसल बीमा योजना',
            ministry: 'Ministry of Agriculture',
            description: 'Comprehensive crop insurance scheme for farmers against crop loss due to natural calamities, pests, and diseases.',
            benefits: ['Low premium (2% Kharif, 1.5% Rabi)', 'Full insured sum on crop loss', 'Covers natural calamities'],
            eligibility: ['All farmers (loanee and non-loanee)', 'Crops notified under the scheme'],
            documents: ['Aadhaar Card', 'Land records', 'Bank account', 'Sowing certificate'],
            applyLink: 'https://pmfby.gov.in',
            helpline: '1800-180-1111'
        },
        {
            id: 'kcc',
            name: 'Kisan Credit Card',
            nameHindi: 'किसान क्रेडिट कार्ड',
            ministry: 'Ministry of Finance',
            description: 'Credit facility for farmers at low interest rates for agricultural and allied activities.',
            benefits: ['Credit up to ₹3 lakh at 4% interest', 'Interest subvention on timely repayment', 'Flexible repayment'],
            eligibility: ['Owner cultivators', 'Tenant farmers', 'Sharecroppers'],
            documents: ['Land ownership proof', 'Identity proof', 'Address proof', 'Passport photo'],
            applyLink: 'https://www.nabard.org',
            helpline: '1800-180-8087'
        },
        {
            id: 'pmksy',
            name: 'PM Krishi Sinchai Yojana',
            nameHindi: 'प्रधानमंत्री कृषि सिंचाई योजना',
            ministry: 'Ministry of Agriculture',
            description: 'Irrigation and water use efficiency scheme with subsidies on micro-irrigation systems.',
            benefits: ['55-75% subsidy on micro-irrigation', 'Drip and sprinkler systems', 'Water conservation support'],
            eligibility: ['All farmers with agricultural land', 'Priority to small and marginal farmers'],
            documents: ['Land records', 'Bank details', 'Application form'],
            applyLink: 'https://pmksy.gov.in',
            helpline: '1800-180-1551'
        }
    ];

    filteredSchemes: Scheme[] = [];

    ngOnInit() {
        this.filteredSchemes = [...this.schemes];
    }

    constructor() {
        this.filteredSchemes = [...this.schemes];
    }

    filterSchemes() {
        this.filteredSchemes = this.schemes.filter(scheme =>
            scheme.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            scheme.nameHindi.includes(this.searchQuery) ||
            scheme.description.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
    }

    selectCategory(category: string) {
        this.selectedCategory = category;
        if (category === 'All') {
            this.filteredSchemes = [...this.schemes];
        } else {
            this.filterSchemes();
        }
    }

    openScheme(scheme: Scheme) {
        this.expandedScheme = this.expandedScheme === scheme.id ? '' : scheme.id;
    }

    startEligibilityCheck() {
        alert('Eligibility check wizard coming soon!');
    }
}
