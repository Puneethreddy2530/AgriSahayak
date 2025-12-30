import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface User {
    farmer_id?: string;
    phone: string;
    name?: string;
    role: 'farmer' | 'admin';
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'http://127.0.0.1:8000/api/v1/auth';
    private tokenKey = 'agrisahayak_token';

    // DEMO USER FOR HACKATHON
    private demoUser: User = {
        farmer_id: 'F12345',
        phone: '9876543210',
        name: 'Demo Farmer',
        role: 'farmer'
    };

    private currentUserSubject = new BehaviorSubject<User | null>(this.demoUser);
    public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

    constructor(private http: HttpClient) {
        // HACKATHON MODE: Always logged in
        // this.checkExistingToken();
    }

    private async checkExistingToken() {
        const token = this.getToken();
        if (token) {
            try {
                const user = await this.verifyToken(token);
                this.currentUserSubject.next(user);
            } catch {
                this.logout();
            }
        }
    }

    getToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    isLoggedIn(): boolean {
        // return !!this.getToken();
        return true; // Always allow access
    }

    getCurrentUser(): User | null {
        // return this.currentUserSubject.value;
        return this.demoUser;
    }

    async requestOTP(phone: string): Promise<{ demo_otp?: string }> {
        const res = await fetch(`${this.apiUrl}/request-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone })
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.detail || 'Failed to send OTP');
        }

        return res.json();
    }

    async verifyOTP(phone: string, otp: string): Promise<User> {
        const res = await fetch(`${this.apiUrl}/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, otp })
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.detail || 'Invalid OTP');
        }

        const data = await res.json();
        localStorage.setItem(this.tokenKey, data.access_token);
        this.currentUserSubject.next(data.user);
        return data.user;
    }

    async verifyToken(token: string): Promise<User> {
        const res = await fetch(`${this.apiUrl}/verify-token`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            throw new Error('Invalid token');
        }

        const data = await res.json();
        return data.user;
    }

    logout(): void {
        localStorage.removeItem(this.tokenKey);
        this.currentUserSubject.next(null);
    }

    getAuthHeaders(): { [key: string]: string } {
        const token = this.getToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }
}
