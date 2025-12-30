import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="app-container">
      <!-- Animated Background Orbs -->
      <div class="bg-orbs">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
      </div>

      <!-- Navigation -->
      <nav class="navbar glass-card">
        <div class="nav-brand">
          <span class="brand-icon">🌾</span>
          <span class="brand-name">AgriSahayak</span>
        </div>

        <ul class="nav-links">
          <li>
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
              <span class="nav-icon">🏠</span>
              <span>Home</span>
            </a>
          </li>
          <li>
            <a routerLink="/profile" routerLinkActive="active">
              <span class="nav-icon">👨‍🌾</span>
              <span>My Profile</span>
            </a>
          </li>
          <li>
            <a routerLink="/crop-cycle" routerLinkActive="active">
              <span class="nav-icon">📅</span>
              <span>Crop Tracker</span>
            </a>
          </li>
          <li>
            <a routerLink="/crop-advisor" routerLinkActive="active">
              <span class="nav-icon">🌱</span>
              <span>Crop Advisor</span>
            </a>
          </li>
          <li>
            <a routerLink="/fertilizer" routerLinkActive="active">
              <span class="nav-icon">🧪</span>
              <span>Fertilizer</span>
            </a>
          </li>
          <li>
            <a routerLink="/expense" routerLinkActive="active">
              <span class="nav-icon">💰</span>
              <span>Profit Calc</span>
            </a>
          </li>
          <li>
            <a routerLink="/disease-detection" routerLinkActive="active">
              <span class="nav-icon">🔬</span>
              <span>Disease Detection</span>
            </a>
          </li>
          <li>
            <a routerLink="/market-prices" routerLinkActive="active">
              <span class="nav-icon">💰</span>
              <span>Market Prices</span>
            </a>
          </li>
          <li>
            <a routerLink="/schemes" routerLinkActive="active">
              <span class="nav-icon">📋</span>
              <span>Govt Schemes</span>
            </a>
          </li>
        </ul>

        <div class="nav-actions">
          <button class="btn-secondary" (click)="toggleLanguage()">
            {{ currentLang }}
          </button>
          <button class="btn-primary">
            <span>📞</span>
            <span>IVR Helpline</span>
          </button>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>

      <!-- Footer -->
      <footer class="footer glass-card">
        <div class="footer-content">
          <div class="footer-brand">
            <span class="brand-icon">🌾</span>
            <span>AgriSahayak</span>
            <p class="text-muted">AI-Powered Smart Agriculture Platform</p>
          </div>
          <div class="footer-links">
            <a href="#">About</a>
            <a href="#">Contact</a>
            <a href="#">Privacy</a>
            <a href="#">Help</a>
          </div>
          <div class="footer-helpline">
            <p class="helpline-title">24x7 IVR Helpline</p>
            <p class="helpline-number">📞 1800-XXX-XXXX</p>
            <p class="text-muted">Press 1 for Crop | Press 2 for Disease</p>
          </div>
        </div>
        <div class="footer-bottom">
          <p>Built with ❤️ for Indian Farmers | © 2025 AgriSahayak</p>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    // Background Orbs
    .bg-orbs {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: -1;
      overflow: hidden;
    }

    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.5;
    }

    .orb-1 {
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, transparent 70%);
      top: -200px;
      left: -100px;
      animation: float 8s ease-in-out infinite;
    }

    .orb-2 {
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, transparent 70%);
      bottom: -150px;
      right: -100px;
      animation: float 10s ease-in-out infinite reverse;
    }

    .orb-3 {
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      animation: pulse 6s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-30px) rotate(10deg); }
    }

    @keyframes pulse {
      0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
      50% { opacity: 0.5; transform: translate(-50%, -50%) scale(1.1); }
    }

    // Navbar
    .navbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 2rem;
      margin: 1rem;
      position: sticky;
      top: 1rem;
      z-index: 100;
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .brand-icon {
      font-size: 2rem;
      animation: float 3s ease-in-out infinite;
    }

    .brand-name {
      background: linear-gradient(135deg, #10b981 0%, #f59e0b 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .nav-links {
      display: flex;
      list-style: none;
      gap: 0.5rem;
    }

    .nav-links a {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      border-radius: 0.75rem;
      color: var(--text-secondary);
      font-weight: 500;
      transition: all 0.25s ease;
      text-decoration: none;

      &:hover {
        color: var(--text-primary);
        background: rgba(255, 255, 255, 0.1);
      }

      &.active {
        color: var(--primary-400);
        background: rgba(16, 185, 129, 0.15);
        box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.3);
      }
    }

    .nav-icon {
      font-size: 1.25rem;
    }

    .nav-actions {
      display: flex;
      gap: 1rem;
    }

    .btn-secondary {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 0.75rem;
      color: var(--text-primary);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.25s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.12);
        border-color: var(--primary-400);
      }
    }

    .btn-primary {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border: none;
      border-radius: 0.75rem;
      color: white;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
      transition: all 0.25s ease;

      &:hover {
        box-shadow: 0 0 30px rgba(16, 185, 129, 0.5);
        transform: translateY(-2px);
      }
    }

    // Main Content
    .main-content {
      flex: 1;
      padding: 2rem;
    }

    // Footer
    .footer {
      margin: 2rem 1rem 1rem;
      padding: 2rem;
    }

    .footer-content {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .footer-brand {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      .brand-icon {
        font-size: 2.5rem;
      }
    }

    .footer-links {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;

      a {
        color: var(--text-secondary);
        transition: color 0.2s ease;

        &:hover {
          color: var(--primary-400);
        }
      }
    }

    .footer-helpline {
      text-align: right;
    }

    .helpline-title {
      font-weight: 600;
      color: var(--text-secondary);
    }

    .helpline-number {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--primary-400);
    }

    .footer-bottom {
      padding-top: 1.5rem;
      text-align: center;
      color: var(--text-muted);
    }

    .text-muted {
      color: #64748b;
    }

    // Responsive
    @media (max-width: 1024px) {
      .nav-links span:not(.nav-icon) {
        display: none;
      }

      .footer-content {
        grid-template-columns: 1fr;
        text-align: center;
      }

      .footer-helpline {
        text-align: center;
      }
    }

    @media (max-width: 768px) {
      .navbar {
        flex-direction: column;
        gap: 1rem;
      }

      .nav-actions {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class AppComponent {
  currentLang = 'हिंदी';
  languages = ['हिंदी', 'English', 'தமிழ்', 'తెలుగు', 'ಕನ್ನಡ', 'मराठी'];
  langIndex = 0;

  toggleLanguage() {
    this.langIndex = (this.langIndex + 1) % this.languages.length;
    this.currentLang = this.languages[this.langIndex];
  }
}
