import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <div class="home-container">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-content animate-fade-in">
          <h1 class="hero-title">
            <span class="hero-icon animate-float">🌾</span>
            Smart Farming, Smarter Decisions
          </h1>
          <p class="hero-subtitle">
            AI-powered intelligence for Indian farmers. Get personalized crop recommendations, 
            instant disease detection, and real-time market insights.
          </p>
          <div class="hero-cta">
            <a routerLink="/crop-advisor" class="btn-primary btn-lg">
              <span>🌱</span> Get Crop Advice
            </a>
            <a routerLink="/disease-detection" class="btn-secondary btn-lg">
              <span>📷</span> Scan Plant Disease
            </a>
          </div>
          
          <!-- Stats -->
          <div class="hero-stats">
            <div class="stat">
              <span class="stat-value">50K+</span>
              <span class="stat-label">Farmers Helped</span>
            </div>
            <div class="stat">
              <span class="stat-value">22</span>
              <span class="stat-label">Crops Supported</span>
            </div>
            <div class="stat">
              <span class="stat-value">38</span>
              <span class="stat-label">Diseases Detected</span>
            </div>
            <div class="stat">
              <span class="stat-value">7</span>
              <span class="stat-label">Languages</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Grid -->
      <section class="features">
        <h2 class="section-title">🚀 Powerful Features</h2>
        <div class="features-grid">
          <div class="feature-card glass-card" *ngFor="let feature of features; let i = index"
               [style.animation-delay]="i * 100 + 'ms'">
            <div class="feature-icon">{{ feature.icon }}</div>
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.description }}</p>
            <a [routerLink]="feature.link" class="feature-link">
              Explore <span>→</span>
            </a>
          </div>
        </div>
      </section>

      <!-- IVR Banner -->
      <section class="ivr-banner glass-card-highlight">
        <div class="ivr-content">
          <div class="ivr-icon">📞</div>
          <div class="ivr-text">
            <h3>No Smartphone? No Problem!</h3>
            <p>Call our 24x7 IVR helpline for voice-based farming advice in your language</p>
          </div>
          <div class="ivr-action">
            <span class="ivr-number">1800-XXX-XXXX</span>
            <div class="ivr-options">
              <span class="ivr-option">Press 1 → Crop Advice</span>
              <span class="ivr-option">Press 2 → Disease Help</span>
              <span class="ivr-option">Press 3 → Market Prices</span>
            </div>
          </div>
        </div>
      </section>

      <!-- How It Works -->
      <section class="how-it-works">
        <h2 class="section-title">⚡ How It Works</h2>
        <div class="steps">
          <div class="step glass-card" *ngFor="let step of steps; let i = index">
            <div class="step-number">{{ i + 1 }}</div>
            <div class="step-icon">{{ step.icon }}</div>
            <h4>{{ step.title }}</h4>
            <p>{{ step.description }}</p>
          </div>
        </div>
      </section>

      <!-- Supported Crops -->
      <section class="crops-section">
        <h2 class="section-title">🌾 Supported Crops</h2>
        <div class="crops-grid">
          <div class="crop-tag" *ngFor="let crop of crops">
            {{ crop }}
          </div>
        </div>
      </section>
    </div>
  `,
    styles: [`
    .home-container {
      max-width: 1400px;
      margin: 0 auto;
    }

    // Hero Section
    .hero {
      text-align: center;
      padding: 4rem 2rem;
    }

    .hero-content {
      max-width: 900px;
      margin: 0 auto;
    }

    .hero-title {
      font-size: clamp(2.5rem, 6vw, 4rem);
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .hero-icon {
      font-size: 4rem;
    }

    .hero-subtitle {
      font-size: 1.25rem;
      color: var(--text-secondary);
      max-width: 700px;
      margin: 0 auto 2.5rem;
      line-height: 1.8;
    }

    .hero-cta {
      display: flex;
      gap: 1.5rem;
      justify-content: center;
      flex-wrap: wrap;
      margin-bottom: 3rem;
    }

    .btn-lg {
      padding: 1rem 2rem;
      font-size: 1.1rem;
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      border-radius: 1rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      box-shadow: 0 0 30px rgba(16, 185, 129, 0.4);

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 0 40px rgba(16, 185, 129, 0.6);
      }
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.08);
      color: var(--text-primary);
      border: 1px solid rgba(255, 255, 255, 0.2);

      &:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: var(--primary-400);
      }
    }

    .hero-stats {
      display: flex;
      justify-content: center;
      gap: 3rem;
      flex-wrap: wrap;
    }

    .stat {
      text-align: center;
    }

    .stat-value {
      display: block;
      font-size: 2.5rem;
      font-weight: 800;
      background: linear-gradient(135deg, #10b981, #f59e0b);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .stat-label {
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    // Features
    .features {
      padding: 4rem 2rem;
    }

    .section-title {
      text-align: center;
      font-size: 2rem;
      margin-bottom: 3rem;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .feature-card {
      padding: 2rem;
      animation: fadeIn 0.5s ease forwards;
      opacity: 0;
    }

    .feature-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .feature-card h3 {
      font-size: 1.25rem;
      margin-bottom: 0.75rem;
      background: none;
      -webkit-text-fill-color: var(--text-primary);
    }

    .feature-card p {
      color: var(--text-secondary);
      margin-bottom: 1rem;
      line-height: 1.6;
    }

    .feature-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--primary-400);
      font-weight: 600;
      transition: gap 0.2s ease;

      &:hover {
        gap: 1rem;
      }
    }

    // IVR Banner
    .ivr-banner {
      margin: 2rem;
      padding: 2.5rem;
      border-color: var(--accent-gold);
      box-shadow: 0 0 40px rgba(245, 158, 11, 0.2);
    }

    .ivr-content {
      display: flex;
      align-items: center;
      gap: 2rem;
      flex-wrap: wrap;
      justify-content: center;
    }

    .ivr-icon {
      font-size: 4rem;
      animation: pulse 2s ease-in-out infinite;
    }

    .ivr-text {
      flex: 1;
      min-width: 250px;
    }

    .ivr-text h3 {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, #f59e0b, #fbbf24);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .ivr-text p {
      color: var(--text-secondary);
    }

    .ivr-action {
      text-align: center;
    }

    .ivr-number {
      display: block;
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--accent-gold);
      margin-bottom: 0.75rem;
    }

    .ivr-options {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .ivr-option {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    // How It Works
    .how-it-works {
      padding: 4rem 2rem;
    }

    .steps {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.5rem;
    }

    .step {
      text-align: center;
      padding: 2rem;
      position: relative;
    }

    .step-number {
      position: absolute;
      top: -15px;
      left: 50%;
      transform: translateX(-50%);
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #10b981, #059669);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1rem;
    }

    .step-icon {
      font-size: 2.5rem;
      margin: 1rem 0;
    }

    .step h4 {
      font-size: 1.1rem;
      margin-bottom: 0.5rem;
      background: none;
      -webkit-text-fill-color: var(--text-primary);
    }

    .step p {
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    // Crops Section
    .crops-section {
      padding: 4rem 2rem;
    }

    .crops-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      justify-content: center;
    }

    .crop-tag {
      padding: 0.5rem 1.25rem;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 2rem;
      font-size: 0.9rem;
      color: var(--text-secondary);
      transition: all 0.2s ease;

      &:hover {
        background: rgba(16, 185, 129, 0.2);
        border-color: var(--primary-400);
        color: var(--primary-400);
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
  `]
})
export class HomeComponent {
    features = [
        {
            icon: '🌱',
            title: 'Crop Advisor',
            description: 'AI-powered crop recommendations based on your soil, weather, and location.',
            link: '/crop-advisor'
        },
        {
            icon: '🔬',
            title: 'Disease Detection',
            description: 'Instant plant disease diagnosis from photos using deep learning.',
            link: '/disease-detection'
        },
        {
            icon: '💰',
            title: 'Market Prices',
            description: 'Real-time mandi prices and best time to sell your produce.',
            link: '/market-prices'
        },
        {
            icon: '🌤️',
            title: 'Weather Intelligence',
            description: 'Hyperlocal weather forecasts with agricultural impact analysis.',
            link: '/crop-advisor'
        },
        {
            icon: '📋',
            title: 'Govt Schemes',
            description: 'Discover subsidies and welfare schemes you are eligible for.',
            link: '/schemes'
        },
        {
            icon: '📞',
            title: 'Voice IVR',
            description: 'Phone-based advisory in Hindi and regional languages.',
            link: '/'
        }
    ];

    steps = [
        { icon: '📊', title: 'Enter Details', description: 'Provide soil, weather, or upload plant photo' },
        { icon: '🤖', title: 'AI Analysis', description: 'Our ML models process your data' },
        { icon: '💡', title: 'Get Insights', description: 'Receive personalized recommendations' },
        { icon: '🚜', title: 'Take Action', description: 'Implement advice and improve yield' }
    ];

    crops = [
        'Rice 🌾', 'Wheat 🌾', 'Maize 🌽', 'Cotton', 'Sugarcane', 'Potato 🥔',
        'Tomato 🍅', 'Onion 🧅', 'Soybean', 'Groundnut 🥜', 'Chickpea', 'Mustard',
        'Banana 🍌', 'Mango 🥭', 'Grapes 🍇', 'Apple 🍎', 'Orange 🍊', 'Papaya',
        'Coffee ☕', 'Tea 🍵', 'Jute', 'Coconut 🥥'
    ];
}
