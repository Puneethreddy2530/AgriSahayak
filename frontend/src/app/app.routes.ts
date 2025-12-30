import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'profile', // Skip login, go straight to dashboard
        pathMatch: 'full'
    },
    {
        path: 'login',
        // Still keep login route accessible if needed, but default is profile
        loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent),
        canActivate: [authGuard]
    },
    {
        path: 'crop-cycle',
        loadComponent: () => import('./pages/crop-cycle/crop-cycle.component').then(m => m.CropCycleComponent),
        canActivate: [authGuard]
    },
    {
        path: 'crop-advisor',
        loadComponent: () => import('./pages/crop-advisor/crop-advisor.component').then(m => m.CropAdvisorComponent),
        canActivate: [authGuard]
    },
    {
        path: 'fertilizer',
        loadComponent: () => import('./pages/fertilizer/fertilizer.component').then(m => m.FertilizerComponent),
        canActivate: [authGuard]
    },
    {
        path: 'expense',
        loadComponent: () => import('./pages/expense/expense.component').then(m => m.ExpenseComponent),
        canActivate: [authGuard]
    },
    {
        path: 'disease-detection',
        loadComponent: () => import('./pages/disease-detection/disease-detection.component').then(m => m.DiseaseDetectionComponent),
        canActivate: [authGuard]
    },
    {
        path: 'market-prices',
        loadComponent: () => import('./pages/market-prices/market-prices.component').then(m => m.MarketPricesComponent),
        canActivate: [authGuard]
    },
    {
        path: 'schemes',
        loadComponent: () => import('./pages/schemes/schemes.component').then(m => m.SchemesComponent),
        canActivate: [authGuard]
    },
    {
        path: '**',
        redirectTo: ''
    }
];

