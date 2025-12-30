import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface DiseaseResult {
  disease_name: string;
  confidence: number;
  severity: string;
  description: string;
  treatment: string[];
  prevention: string[];
}

@Component({
  selector: 'app-disease-detection',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="disease-container">
      <header class="page-header">
        <h1>🔬 Disease Detection</h1>
        <p>Upload a photo of your plant leaf to detect diseases instantly using AI</p>
      </header>

      <div class="detection-content">
        <!-- Upload Section -->
        <div class="upload-section glass-card">
          <div class="upload-area" 
               (click)="fileInput.click()"
               (dragover)="onDragOver($event)"
               (drop)="onDrop($event)"
               [class.has-image]="previewUrl">
            
            <input #fileInput type="file" accept="image/*" (change)="onFileSelected($event)" hidden>
            
            <div *ngIf="!previewUrl" class="upload-placeholder">
              <span class="upload-icon">📷</span>
              <h3>Drop your image here</h3>
              <p>or click to browse</p>
              <span class="upload-hint">Supports JPG, PNG up to 10MB</span>
            </div>

            <img *ngIf="previewUrl" [src]="previewUrl" class="preview-image" alt="Preview">
          </div>

          <div class="upload-actions">
            <button class="btn-secondary" (click)="captureFromCamera()" *ngIf="!previewUrl">
              <span>📸</span> Use Camera
            </button>
            <button class="btn-primary" (click)="analyzeImage()" *ngIf="previewUrl" [disabled]="isAnalyzing">
              <span *ngIf="!isAnalyzing">🔍 Analyze</span>
              <span *ngIf="isAnalyzing">⏳ Analyzing...</span>
            </button>
            <button class="btn-secondary" (click)="clearImage()" *ngIf="previewUrl">
              <span>🗑️</span> Clear
            </button>
          </div>
        </div>

        <!-- Results Section -->
        <div class="results-section" *ngIf="result">
          <!-- Healthy Result -->
          <div class="result-card glass-card healthy" *ngIf="result.is_healthy">
            <div class="result-icon">✅</div>
            <h3>Plant is Healthy!</h3>
            <p>No disease detected. Your plant appears to be in good condition.</p>
            <div class="confidence-display">
              <span>Confidence:</span>
              <span class="confidence-value">{{ (result.confidence * 100).toFixed(1) }}%</span>
            </div>
          </div>

          <!-- Disease Detected -->
          <div class="result-card glass-card disease" *ngIf="!result.is_healthy">
            <div class="result-header">
              <div class="result-icon warning">⚠️</div>
              <div>
                <span class="severity-badge" [class]="result.diseases[0].severity">
                  {{ result.diseases[0].severity | uppercase }}
                </span>
                <h3>{{ result.diseases[0].disease_name }}</h3>
                <p class="plant-type">Plant: {{ result.plant_type }}</p>
              </div>
            </div>

            <div class="confidence-bar-container">
              <div class="confidence-bar">
                <div class="confidence-fill" [style.width.%]="result.diseases[0].confidence * 100"></div>
              </div>
              <span>{{ (result.diseases[0].confidence * 100).toFixed(1) }}% Confidence</span>
            </div>

            <div class="result-description">
              <p>{{ result.diseases[0].description }}</p>
            </div>

            <div class="action-section">
              <h4>⚡ Immediate Action</h4>
              <p class="immediate-action">{{ result.immediate_action }}</p>
            </div>

            <div class="treatment-section">
              <div class="treatment-block">
                <h4>💊 Treatment</h4>
                <ul>
                  <li *ngFor="let item of result.diseases[0].treatment">{{ item }}</li>
                </ul>
              </div>
              <div class="treatment-block">
                <h4>🛡️ Prevention</h4>
                <ul>
                  <li *ngFor="let item of result.diseases[0].prevention">{{ item }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Scans -->
        <div class="recent-scans glass-card" *ngIf="recentScans.length > 0">
          <h3>📋 Recent Scans</h3>
          <div class="scans-list">
            <div class="scan-item" *ngFor="let scan of recentScans">
              <span class="scan-icon">{{ scan.healthy ? '✅' : '⚠️' }}</span>
              <span class="scan-name">{{ scan.name }}</span>
              <span class="scan-date">{{ scan.date }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .disease-container {
      max-width: 1000px;
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

    .detection-content {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .upload-section {
      padding: 2rem;
    }

    .upload-area {
      border: 2px dashed rgba(255, 255, 255, 0.2);
      border-radius: 1rem;
      padding: 3rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      min-height: 300px;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        border-color: var(--primary-400);
        background: rgba(16, 185, 129, 0.05);
      }

      &.has-image {
        padding: 1rem;
        border-style: solid;
        border-color: var(--primary-400);
      }
    }

    .upload-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .upload-icon {
      font-size: 4rem;
      animation: pulse 2s ease-in-out infinite;
    }

    .upload-placeholder h3 {
      background: none;
      -webkit-text-fill-color: var(--text-primary);
    }

    .upload-placeholder p {
      color: var(--text-secondary);
    }

    .upload-hint {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .preview-image {
      max-width: 100%;
      max-height: 400px;
      border-radius: 0.75rem;
      object-fit: contain;
    }

    .upload-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-top: 1.5rem;
    }

    .btn-primary, .btn-secondary {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      border-radius: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.25s ease;
    }

    .btn-primary {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border: none;
      color: white;
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

    .btn-secondary {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: var(--text-primary);

      &:hover {
        background: rgba(255, 255, 255, 0.12);
        border-color: var(--primary-400);
      }
    }

    .result-card {
      padding: 2rem;
      text-align: center;

      &.healthy {
        border-color: #22c55e;
        box-shadow: 0 0 30px rgba(34, 197, 94, 0.2);
      }

      &.disease {
        text-align: left;
        border-color: #f59e0b;
        box-shadow: 0 0 30px rgba(245, 158, 11, 0.2);
      }
    }

    .result-icon {
      font-size: 4rem;
      margin-bottom: 1rem;

      &.warning {
        font-size: 3rem;
      }
    }

    .result-header {
      display: flex;
      align-items: flex-start;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .severity-badge {
      display: inline-block;
      padding: 0.25rem 1rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 700;
      margin-bottom: 0.5rem;

      &.mild {
        background: rgba(34, 197, 94, 0.2);
        color: #22c55e;
      }

      &.moderate {
        background: rgba(245, 158, 11, 0.2);
        color: #f59e0b;
      }

      &.severe {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
      }
    }

    .result-card h3 {
      background: none;
      -webkit-text-fill-color: var(--text-primary);
      font-size: 1.5rem;
    }

    .plant-type {
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    .confidence-display {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 1rem;
      color: var(--text-secondary);
    }

    .confidence-value {
      font-weight: 700;
      color: var(--primary-400);
    }

    .confidence-bar-container {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .confidence-bar {
      flex: 1;
      height: 10px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 1rem;
      overflow: hidden;
    }

    .confidence-fill {
      height: 100%;
      background: linear-gradient(90deg, #f59e0b, #ef4444);
      border-radius: 1rem;
    }

    .result-description {
      padding: 1rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .action-section {
      padding: 1.5rem;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .action-section h4 {
      background: none;
      -webkit-text-fill-color: #ef4444;
      margin-bottom: 0.5rem;
    }

    .immediate-action {
      color: var(--text-primary);
      font-weight: 500;
    }

    .treatment-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .treatment-block {
      padding: 1.5rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 0.75rem;
    }

    .treatment-block h4 {
      background: none;
      -webkit-text-fill-color: var(--text-primary);
      margin-bottom: 1rem;
    }

    .treatment-block ul {
      padding-left: 1.25rem;
      color: var(--text-secondary);
    }

    .treatment-block li {
      margin-bottom: 0.5rem;
    }

    .recent-scans {
      padding: 1.5rem;
    }

    .recent-scans h3 {
      margin-bottom: 1rem;
      background: none;
      -webkit-text-fill-color: var(--text-primary);
    }

    .scans-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .scan-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 0.5rem;
    }

    .scan-name {
      flex: 1;
      color: var(--text-primary);
    }

    .scan-date {
      color: var(--text-muted);
      font-size: 0.85rem;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
  `]
})
export class DiseaseDetectionComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  previewUrl: string | null = null;
  selectedFile: File | null = null;
  isAnalyzing = false;
  result: any = null;

  recentScans = [
    { name: 'Tomato Leaf', healthy: false, date: 'Today' },
    { name: 'Rice Plant', healthy: true, date: 'Yesterday' }
  ];

  constructor(private http: HttpClient) { }

  get formattedDate(): string {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);
    this.result = null;
  }

  captureFromCamera() {
    this.fileInput.nativeElement.setAttribute('capture', 'environment');
    this.fileInput.nativeElement.click();
  }

  clearImage() {
    this.previewUrl = null;
    this.selectedFile = null;
    this.result = null;
  }

  analyzeImage() {
    if (!this.selectedFile) return;

    this.isAnalyzing = true;
    const formData = new FormData();
    formData.append('image', this.selectedFile);

    this.http.post<any>('http://127.0.0.1:8000/api/v1/disease/detect', formData)
      .subscribe({
        next: (response) => {
          this.result = response;
          this.isAnalyzing = false;

          // Add to recent scans
          if (this.result) {
            const scan = {
              name: this.result.diseases?.[0]?.disease_name || 'Healthy Plant',
              healthy: this.result.is_healthy,
              date: 'Today'
            };
            this.recentScans.unshift(scan);
          }
        },
        error: (error) => {
          console.error('Error detecting disease:', error);
          this.isAnalyzing = false;
          alert('Failed to analyze image. Please try again.');
        }
      });
  }
}
