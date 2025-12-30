import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private baseUrl = 'http://127.0.0.1:8000/api/v1';

    constructor(private http: HttpClient) { }

    // Crop Advisory
    getCropRecommendations(data: {
        nitrogen: number;
        phosphorus: number;
        potassium: number;
        temperature: number;
        humidity: number;
        ph: number;
        rainfall: number;
    }): Observable<any> {
        return this.http.post(`${this.baseUrl}/crop/recommend`, data);
    }

    getCrops(): Observable<any> {
        return this.http.get(`${this.baseUrl}/crop/crops`);
    }

    getSeasons(): Observable<any> {
        return this.http.get(`${this.baseUrl}/crop/seasons`);
    }

    // Disease Detection
    detectDisease(image: File): Observable<any> {
        const formData = new FormData();
        formData.append('image', image);
        return this.http.post(`${this.baseUrl}/disease/detect`, formData);
    }

    getDiseases(): Observable<any> {
        return this.http.get(`${this.baseUrl}/disease/diseases`);
    }

    getDiseaseDetails(diseaseId: string): Observable<any> {
        return this.http.get(`${this.baseUrl}/disease/diseases/${diseaseId}`);
    }

    // Weather
    getWeather(lat: number, lon: number, district?: string): Observable<any> {
        let url = `${this.baseUrl}/weather/current?lat=${lat}&lon=${lon}`;
        if (district) {
            url += `&district=${district}`;
        }
        return this.http.get(url);
    }

    getWeatherAlerts(state: string): Observable<any> {
        return this.http.get(`${this.baseUrl}/weather/alerts/${state}`);
    }

    // Market Prices
    getCommodityPrices(commodity: string, state?: string): Observable<any> {
        let url = `${this.baseUrl}/market/prices/${commodity}`;
        if (state) {
            url += `?state=${state}`;
        }
        return this.http.get(url);
    }

    getAllCommodities(): Observable<any> {
        return this.http.get(`${this.baseUrl}/market/commodities`);
    }

    getPriceTrends(commodity: string, days: number = 30): Observable<any> {
        return this.http.get(`${this.baseUrl}/market/trends/${commodity}?days=${days}`);
    }

    // Government Schemes
    getSchemes(search?: string): Observable<any> {
        let url = `${this.baseUrl}/schemes/list`;
        if (search) {
            url += `?search=${search}`;
        }
        return this.http.get(url);
    }

    getSchemeDetails(schemeId: string): Observable<any> {
        return this.http.get(`${this.baseUrl}/schemes/${schemeId}`);
    }

    checkEligibility(schemeId: string, landSize: number, farmerType: string): Observable<any> {
        return this.http.get(
            `${this.baseUrl}/schemes/eligibility-check/${schemeId}?land_size=${landSize}&farmer_type=${farmerType}`
        );
    }

    // Health Check
    healthCheck(): Observable<any> {
        return this.http.get('http://localhost:8000/health');
    }
}
