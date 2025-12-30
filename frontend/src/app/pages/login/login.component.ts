import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card glass-card">
        <div class="logo">
          <span class="logo-icon">🌾</span>
          <h1>AgriSahayak</h1>
          <p>AI-Powered Smart Agriculture</p>
        </div>

        <!-- Step 1: Phone Input -->
        <div class="form-section" *ngIf="step === 'phone'">
          <h2>📱 Login with Phone</h2>
          <p class="subtitle">Enter your mobile number to receive OTP</p>
          
          <div class="input-group">
            <label>Mobile Number</label>
            <div class="phone-input">
              <span class="prefix">+91</span>
              <input type="tel" [(ngModel)]="phone" maxlength="10" 
                     placeholder="9876543210" class="input"
                     (keyup.enter)="requestOTP()">
            </div>
          </div>
          
          <button class="btn-primary" (click)="requestOTP()" [disabled]="isLoading || phone.length !== 10">
            {{ isLoading ? 'Sending...' : '📤 Send OTP' }}
          </button>
        </div>

        <!-- Step 2: OTP Verification -->
        <div class="form-section" *ngIf="step === 'otp'">
          <h2>🔐 Verify OTP</h2>
          <p class="subtitle">Enter 6-digit OTP sent to +91 {{ phone }}</p>
          
          <div class="input-group">
            <label>OTP Code</label>
            <input type="text" [(ngModel)]="otp" maxlength="6" 
                   placeholder="123456" class="input otp-input"
                   (keyup.enter)="verifyOTP()">
          </div>
          
          <!-- Demo OTP Display -->
          <div class="demo-otp" *ngIf="demoOtp">
            🎯 Demo OTP: <strong>{{ demoOtp }}</strong>
          </div>
          
          <button class="btn-primary" (click)="verifyOTP()" [disabled]="isLoading || otp.length !== 6">
            {{ isLoading ? 'Verifying...' : '✅ Verify & Login' }}
          </button>
          
          <button class="btn-link" (click)="step = 'phone'; otp = ''">
            ← Change Phone Number
          </button>
        </div>

        <!-- Step 3: Success -->
        <div class="form-section success" *ngIf="step === 'success'">
          <div class="success-icon">✅</div>
          <h2>Welcome to AgriSahayak!</h2>
          <p>You are now logged in as {{ user?.role | titlecase }}</p>
          <button class="btn-primary" (click)="goToProfile()">
            👨‍🌾 Go to Dashboard
          </button>
        </div>

        <!-- Error Message -->
        <div class="error" *ngIf="error">{{ error }}</div>

        <!-- Footer -->
        <div class="login-footer">
          <p>🌱 Farmer-friendly OTP login</p>
          <p>No password needed!</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .login-card {
      width: 100%;
      max-width: 400px;
      padding: 2rem;
    }

    .glass-card {
      background: rgba(255,255,255,0.05);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 1.5rem;
    }

    .logo {
      text-align: center;
      margin-bottom: 2rem;
    }

    .logo-icon {
      font-size: 4rem;
    }

    .logo h1 {
      margin: 0.5rem 0 0;
      font-size: 2rem;
      background: linear-gradient(135deg, #10b981, #f59e0b);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .logo p {
      margin: 0;
      color: var(--text-muted);
      font-size: 0.875rem;
    }

    .form-section h2 {
      margin: 0 0 0.5rem;
      font-size: 1.25rem;
    }

    .subtitle {
      color: var(--text-muted);
      font-size: 0.875rem;
      margin-bottom: 1.5rem;
    }

    .input-group {
      margin-bottom: 1.5rem;
    }

    .input-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: var(--text-secondary);
    }

    .phone-input {
      display: flex;
      gap: 0.5rem;
    }

    .prefix {
      padding: 0.75rem 1rem;
      background: rgba(0,0,0,0.3);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 0.5rem;
      color: var(--text-muted);
    }

    .input {
      flex: 1;
      padding: 0.75rem 1rem;
      background: rgba(0,0,0,0.2);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 0.5rem;
      color: white;
      font-size: 1.1rem;
      letter-spacing: 1px;
    }

    .otp-input {
      text-align: center;
      font-size: 1.5rem;
      letter-spacing: 0.5rem;
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
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-link {
      display: block;
      width: 100%;
      margin-top: 1rem;
      padding: 0.75rem;
      background: transparent;
      border: none;
      color: var(--primary-400);
      cursor: pointer;
    }

    .demo-otp {
      margin-bottom: 1rem;
      padding: 0.75rem;
      background: rgba(245, 158, 11, 0.2);
      border-radius: 0.5rem;
      text-align: center;
      color: #f59e0b;
    }

    .success {
      text-align: center;
    }

    .success-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .error {
      margin-top: 1rem;
      padding: 0.75rem;
      background: rgba(239, 68, 68, 0.2);
      border-radius: 0.5rem;
      color: #ef4444;
      text-align: center;
    }

    .login-footer {
      margin-top: 2rem;
      text-align: center;
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .login-footer p {
      margin: 0.25rem 0;
    }
  `]
})
export class LoginComponent {
  step: 'phone' | 'otp' | 'success' = 'phone';
  phone = '';
  otp = '';
  demoOtp = '';
  isLoading = false;
  error = '';
  user: any = null;

  private apiUrl = 'http://127.0.0.1:8000/api/v1/auth';

  constructor(private router: Router) {
    // Check if already logged in
    const token = localStorage.getItem('agrisahayak_token');
    if (token) {
      this.verifyExistingToken(token);
    }
  }

  async verifyExistingToken(token: string) {
    try {
      const res = await fetch(`${this.apiUrl}/verify-token`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        this.user = data.user;
        this.step = 'success';
      } else {
        localStorage.removeItem('agrisahayak_token');
      }
    } catch (e) {
      console.error('Token verification failed:', e);
      localStorage.removeItem('agrisahayak_token');
    }
  }

  async requestOTP() {
    if (this.phone.length !== 10) {
      this.error = 'Please enter valid 10-digit number';
      return;
    }

    this.isLoading = true;
    this.error = '';

    try {
      console.log('Requesting OTP for:', this.phone);
      const res = await fetch(`${this.apiUrl}/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: this.phone })
      });

      console.log('OTP Response status:', res.status);
      const data = await res.json();
      console.log('OTP Data:', data);

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to send OTP');
      }

      this.demoOtp = data.demo_otp; // Demo only
      this.step = 'otp';
    } catch (e: any) {
      console.error('OTP Request Error:', e);
      this.error = 'Connection failed. Is backend running? ' + e.message;
    } finally {
      this.isLoading = false;
    }
  }

  async verifyOTP() {
    if (this.otp.length !== 6) {
      this.error = 'Please enter 6-digit OTP';
      return;
    }

    this.isLoading = true;
    this.error = '';

    try {
      const res = await fetch(`${this.apiUrl}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: this.phone, otp: this.otp })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Invalid OTP');
      }

      // Store token
      localStorage.setItem('agrisahayak_token', data.access_token);
      this.user = data.user;
      this.step = 'success';
    } catch (e: any) {
      this.error = e.message;
    } finally {
      this.isLoading = false;
    }
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }
}
