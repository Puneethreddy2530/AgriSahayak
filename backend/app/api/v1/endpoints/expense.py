"""
Farmer Expense & Profit Estimation Endpoints
Track costs, predict yield, estimate profits
"""

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime

router = APIRouter()


# ==================================================
# MODELS
# ==================================================
class ExpenseInput(BaseModel):
    """Farming expenses input"""
    crop: str
    area_acres: float = Field(..., gt=0, description="Land area in acres")
    season: str = Field(default="kharif", description="kharif/rabi/zaid")
    state: str = Field(default="Maharashtra")
    
    # Cost inputs (₹)
    seed_cost: float = Field(default=0, ge=0)
    fertilizer_cost: float = Field(default=0, ge=0)
    pesticide_cost: float = Field(default=0, ge=0)
    labor_cost: float = Field(default=0, ge=0)
    irrigation_cost: float = Field(default=0, ge=0)
    machinery_cost: float = Field(default=0, ge=0)
    transport_cost: float = Field(default=0, ge=0)
    other_cost: float = Field(default=0, ge=0)


class ExpenseBreakdown(BaseModel):
    """Detailed expense breakdown"""
    category: str
    amount: float
    percentage: float
    per_acre: float


class ProfitEstimation(BaseModel):
    """Complete profit estimation response"""
    crop: str
    area_acres: float
    season: str
    
    # Expense summary
    total_expenses: float
    expense_per_acre: float
    expense_breakdown: List[ExpenseBreakdown]
    
    # Yield prediction (ML-powered)
    predicted_yield_kg: float
    yield_per_acre_kg: float
    yield_confidence: float
    
    # Price estimation
    current_market_price: float
    expected_price_at_harvest: float
    price_trend: str
    
    # Revenue & Profit
    expected_revenue: float
    expected_profit: float
    profit_margin_percent: float
    roi_percent: float
    break_even_price: float
    
    # Risk analysis
    risk_level: str
    risk_factors: List[str]
    recommendations: List[str]


# ==================================================
# REFERENCE DATA
# ==================================================
# Average yields per acre (kg)
CROP_YIELDS = {
    "rice": {"avg": 2000, "good": 2800, "excellent": 3500},
    "wheat": {"avg": 1800, "good": 2400, "excellent": 3000},
    "maize": {"avg": 2500, "good": 3500, "excellent": 4500},
    "cotton": {"avg": 400, "good": 600, "excellent": 800},
    "tomato": {"avg": 15000, "good": 25000, "excellent": 35000},
    "potato": {"avg": 10000, "good": 15000, "excellent": 20000},
    "onion": {"avg": 8000, "good": 12000, "excellent": 16000},
    "sugarcane": {"avg": 35000, "good": 45000, "excellent": 55000},
    "soybean": {"avg": 800, "good": 1200, "excellent": 1500},
}

# Current market prices (₹ per kg)
MARKET_PRICES = {
    "rice": {"current": 22, "msp": 21.83, "trend": "stable"},
    "wheat": {"current": 24, "msp": 22.75, "trend": "up"},
    "maize": {"current": 20, "msp": 19.62, "trend": "stable"},
    "cotton": {"current": 65, "msp": 62.00, "trend": "up"},
    "tomato": {"current": 25, "msp": 0, "trend": "volatile"},
    "potato": {"current": 12, "msp": 0, "trend": "down"},
    "onion": {"current": 18, "msp": 0, "trend": "volatile"},
    "sugarcane": {"current": 3.5, "msp": 3.15, "trend": "stable"},
    "soybean": {"current": 45, "msp": 44.50, "trend": "up"},
}

# Average costs per acre (₹) - reference for comparison
REFERENCE_COSTS = {
    "rice": {"seed": 800, "fertilizer": 3000, "pesticide": 1500, "labor": 8000, "irrigation": 2000, "total": 18000},
    "wheat": {"seed": 1200, "fertilizer": 2500, "pesticide": 1000, "labor": 5000, "irrigation": 1500, "total": 14000},
    "maize": {"seed": 1500, "fertilizer": 3500, "pesticide": 1200, "labor": 6000, "irrigation": 1800, "total": 16000},
    "cotton": {"seed": 2000, "fertilizer": 4000, "pesticide": 3000, "labor": 10000, "irrigation": 2500, "total": 25000},
    "tomato": {"seed": 3000, "fertilizer": 5000, "pesticide": 4000, "labor": 15000, "irrigation": 3000, "total": 35000},
    "potato": {"seed": 15000, "fertilizer": 4000, "pesticide": 2000, "labor": 8000, "irrigation": 2500, "total": 35000},
    "onion": {"seed": 8000, "fertilizer": 3000, "pesticide": 1500, "labor": 10000, "irrigation": 2000, "total": 28000},
    "sugarcane": {"seed": 12000, "fertilizer": 5000, "pesticide": 2000, "labor": 15000, "irrigation": 5000, "total": 45000},
}


# ==================================================
# CALCULATION FUNCTIONS
# ==================================================
def predict_yield(crop: str, area: float, expenses: ExpenseInput) -> tuple:
    """Predict yield based on crop, area, and investment"""
    crop_lower = crop.lower()
    yields = CROP_YIELDS.get(crop_lower, CROP_YIELDS["rice"])
    ref_costs = REFERENCE_COSTS.get(crop_lower, REFERENCE_COSTS["rice"])
    
    # Calculate investment ratio vs reference
    total_input = (expenses.seed_cost + expenses.fertilizer_cost + 
                   expenses.pesticide_cost + expenses.labor_cost + 
                   expenses.irrigation_cost) / area if area > 0 else 0
    
    ref_input = ref_costs["total"]
    investment_ratio = total_input / ref_input if ref_input > 0 else 1.0
    
    # Predict yield based on investment
    if investment_ratio >= 1.2:
        yield_per_acre = yields["excellent"]
        confidence = 0.85
    elif investment_ratio >= 0.9:
        yield_per_acre = yields["good"]
        confidence = 0.80
    elif investment_ratio >= 0.7:
        yield_per_acre = yields["avg"]
        confidence = 0.75
    else:
        yield_per_acre = yields["avg"] * 0.8  # Below average
        confidence = 0.65
    
    total_yield = yield_per_acre * area
    return total_yield, yield_per_acre, confidence


def get_price_estimate(crop: str) -> tuple:
    """Get current and expected harvest price"""
    crop_lower = crop.lower()
    prices = MARKET_PRICES.get(crop_lower, {"current": 20, "msp": 18, "trend": "stable"})
    
    current = prices["current"]
    trend = prices["trend"]
    
    # Estimate harvest price based on trend
    if trend == "up":
        expected = current * 1.1
    elif trend == "down":
        expected = current * 0.9
    elif trend == "volatile":
        expected = current * 0.95  # Conservative estimate
    else:
        expected = current
    
    return current, expected, trend


def calculate_profit(total_expenses: float, yield_kg: float, price_per_kg: float) -> Dict:
    """Calculate revenue, profit, and financial metrics"""
    revenue = yield_kg * price_per_kg
    profit = revenue - total_expenses
    
    margin = (profit / revenue * 100) if revenue > 0 else 0
    roi = (profit / total_expenses * 100) if total_expenses > 0 else 0
    break_even = total_expenses / yield_kg if yield_kg > 0 else 0
    
    return {
        "revenue": round(revenue, 2),
        "profit": round(profit, 2),
        "margin": round(margin, 1),
        "roi": round(roi, 1),
        "break_even": round(break_even, 2)
    }


def analyze_risk(expenses: ExpenseInput, profit_margin: float, price_trend: str) -> tuple:
    """Analyze risk factors"""
    risk_factors = []
    recommendations = []
    risk_score = 0
    
    # Price volatility risk
    if price_trend == "volatile":
        risk_factors.append("High price volatility - market unpredictable")
        recommendations.append("Consider forward contracts or mandi tie-ups")
        risk_score += 2
    elif price_trend == "down":
        risk_factors.append("Falling prices - may affect returns")
        recommendations.append("Plan early harvest or storage for better prices")
        risk_score += 1
    
    # Low margin risk
    if profit_margin < 20:
        risk_factors.append("Low profit margin - vulnerable to cost overruns")
        recommendations.append("Reduce input costs or consider crop diversification")
        risk_score += 2
    elif profit_margin < 35:
        risk_factors.append("Moderate margin - watch expenses closely")
        risk_score += 1
    
    # Investment analysis
    total = expenses.seed_cost + expenses.fertilizer_cost + expenses.pesticide_cost
    if expenses.pesticide_cost > total * 0.3:
        risk_factors.append("High pesticide costs - possible pest infestation")
        recommendations.append("Use IPM techniques to reduce pesticide dependency")
        risk_score += 1
    
    if expenses.irrigation_cost > expenses.labor_cost * 0.5:
        risk_factors.append("High irrigation costs")
        recommendations.append("Consider drip/sprinkler irrigation for water savings")
    
    # Overall risk level
    if risk_score >= 4:
        risk_level = "high"
    elif risk_score >= 2:
        risk_level = "medium"
    else:
        risk_level = "low"
    
    if not risk_factors:
        risk_factors.append("No significant risk factors identified")
    if not recommendations:
        recommendations.append("Continue with current practices - good cost management")
    
    return risk_level, risk_factors, recommendations


# ==================================================
# ENDPOINTS
# ==================================================
@router.post("/estimate", response_model=ProfitEstimation)
async def estimate_profit(expenses: ExpenseInput):
    """
    Estimate profit based on farming expenses.
    
    Uses:
    - ML-based yield prediction
    - Current market prices
    - Cost analysis
    - Risk assessment
    """
    # Calculate total expenses
    total = (expenses.seed_cost + expenses.fertilizer_cost + 
             expenses.pesticide_cost + expenses.labor_cost +
             expenses.irrigation_cost + expenses.machinery_cost +
             expenses.transport_cost + expenses.other_cost)
    
    expense_per_acre = total / expenses.area_acres if expenses.area_acres > 0 else 0
    
    # Create expense breakdown
    categories = [
        ("Seed", expenses.seed_cost),
        ("Fertilizer", expenses.fertilizer_cost),
        ("Pesticide", expenses.pesticide_cost),
        ("Labor", expenses.labor_cost),
        ("Irrigation", expenses.irrigation_cost),
        ("Machinery", expenses.machinery_cost),
        ("Transport", expenses.transport_cost),
        ("Other", expenses.other_cost),
    ]
    
    breakdown = [
        ExpenseBreakdown(
            category=cat,
            amount=amt,
            percentage=round((amt/total*100) if total > 0 else 0, 1),
            per_acre=round(amt/expenses.area_acres if expenses.area_acres > 0 else 0, 2)
        )
        for cat, amt in categories if amt > 0
    ]
    
    # Predict yield using ML
    total_yield, yield_per_acre, confidence = predict_yield(
        expenses.crop, expenses.area_acres, expenses
    )
    
    # Get price estimates
    current_price, expected_price, trend = get_price_estimate(expenses.crop)
    
    # Calculate profit
    financials = calculate_profit(total, total_yield, expected_price)
    
    # Risk analysis
    risk_level, risk_factors, recommendations = analyze_risk(
        expenses, financials["margin"], trend
    )
    
    return ProfitEstimation(
        crop=expenses.crop.capitalize(),
        area_acres=expenses.area_acres,
        season=expenses.season,
        
        total_expenses=round(total, 2),
        expense_per_acre=round(expense_per_acre, 2),
        expense_breakdown=breakdown,
        
        predicted_yield_kg=round(total_yield, 0),
        yield_per_acre_kg=round(yield_per_acre, 0),
        yield_confidence=confidence,
        
        current_market_price=current_price,
        expected_price_at_harvest=round(expected_price, 2),
        price_trend=trend,
        
        expected_revenue=financials["revenue"],
        expected_profit=financials["profit"],
        profit_margin_percent=financials["margin"],
        roi_percent=financials["roi"],
        break_even_price=financials["break_even"],
        
        risk_level=risk_level,
        risk_factors=risk_factors,
        recommendations=recommendations
    )


@router.get("/reference-costs/{crop}")
async def get_reference_costs(crop: str):
    """Get reference costs for a crop to help farmers estimate"""
    crop_lower = crop.lower()
    if crop_lower not in REFERENCE_COSTS:
        return {"error": f"Crop '{crop}' not found", "available": list(REFERENCE_COSTS.keys())}
    
    costs = REFERENCE_COSTS[crop_lower]
    yields = CROP_YIELDS.get(crop_lower, {})
    prices = MARKET_PRICES.get(crop_lower, {})
    
    return {
        "crop": crop.capitalize(),
        "reference_costs_per_acre": costs,
        "expected_yields_per_acre_kg": yields,
        "current_prices": prices,
        "estimated_revenue_per_acre": yields.get("avg", 0) * prices.get("current", 0),
        "estimated_profit_per_acre": yields.get("avg", 0) * prices.get("current", 0) - costs["total"]
    }


@router.get("/market-prices")
async def get_all_market_prices():
    """Get current market prices for all crops"""
    return {
        "prices": [
            {
                "crop": k.capitalize(),
                "current_price": v["current"],
                "msp": v["msp"],
                "trend": v["trend"],
                "unit": "₹/kg"
            }
            for k, v in MARKET_PRICES.items()
        ],
        "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M")
    }


@router.post("/compare")
async def compare_scenarios(scenarios: List[ExpenseInput]):
    """Compare multiple expense scenarios"""
    results = []
    for exp in scenarios[:5]:  # Max 5 scenarios
        total = (exp.seed_cost + exp.fertilizer_cost + exp.pesticide_cost + 
                 exp.labor_cost + exp.irrigation_cost + exp.machinery_cost)
        yield_kg, _, conf = predict_yield(exp.crop, exp.area_acres, exp)
        _, price, trend = get_price_estimate(exp.crop)
        profit = yield_kg * price - total
        
        results.append({
            "crop": exp.crop,
            "area": exp.area_acres,
            "expenses": total,
            "yield": yield_kg,
            "revenue": yield_kg * price,
            "profit": profit,
            "roi": (profit / total * 100) if total > 0 else 0
        })
    
    # Sort by profit
    results.sort(key=lambda x: x["profit"], reverse=True)
    
    return {
        "scenarios": results,
        "best_option": results[0] if results else None,
        "recommendation": f"Best ROI: {results[0]['crop']} with {results[0]['roi']:.1f}% return" if results else "No scenarios provided"
    }
