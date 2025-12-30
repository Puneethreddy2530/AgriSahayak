"""
Market Prices Endpoints - UPGRADED
Comprehensive state-wise mandi prices for all major crops
With caching and integration support
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime, timedelta
import random

router = APIRouter()


# ==================================================
# MODELS
# ==================================================
class PriceData(BaseModel):
    """Price for a commodity in a location"""
    commodity: str
    variety: str
    min_price: float
    max_price: float
    modal_price: float
    unit: str = "₹/quintal"
    trend: str
    change_percent: float


class StatePrices(BaseModel):
    """State-wise price summary"""
    state: str
    state_code: str
    avg_price: float
    min_price: float
    max_price: float
    num_markets: int
    top_markets: List[Dict]


class MarketResponse(BaseModel):
    """Complete market price response"""
    commodity: str
    commodity_hindi: str
    national_average: float
    unit: str
    msp: Optional[float]
    trend: str
    state_prices: List[StatePrices]
    advisory: str
    best_selling_states: List[str]
    last_updated: str


# ==================================================
# COMPREHENSIVE INDIAN STATE DATA
# ==================================================
INDIAN_STATES = {
    "AP": {"name": "Andhra Pradesh", "region": "south"},
    "AR": {"name": "Arunachal Pradesh", "region": "northeast"},
    "AS": {"name": "Assam", "region": "northeast"},
    "BR": {"name": "Bihar", "region": "east"},
    "CG": {"name": "Chhattisgarh", "region": "central"},
    "GA": {"name": "Goa", "region": "west"},
    "GJ": {"name": "Gujarat", "region": "west"},
    "HR": {"name": "Haryana", "region": "north"},
    "HP": {"name": "Himachal Pradesh", "region": "north"},
    "JK": {"name": "Jammu & Kashmir", "region": "north"},
    "JH": {"name": "Jharkhand", "region": "east"},
    "KA": {"name": "Karnataka", "region": "south"},
    "KL": {"name": "Kerala", "region": "south"},
    "MP": {"name": "Madhya Pradesh", "region": "central"},
    "MH": {"name": "Maharashtra", "region": "west"},
    "MN": {"name": "Manipur", "region": "northeast"},
    "ML": {"name": "Meghalaya", "region": "northeast"},
    "MZ": {"name": "Mizoram", "region": "northeast"},
    "NL": {"name": "Nagaland", "region": "northeast"},
    "OR": {"name": "Odisha", "region": "east"},
    "PB": {"name": "Punjab", "region": "north"},
    "RJ": {"name": "Rajasthan", "region": "west"},
    "SK": {"name": "Sikkim", "region": "northeast"},
    "TN": {"name": "Tamil Nadu", "region": "south"},
    "TS": {"name": "Telangana", "region": "south"},
    "TR": {"name": "Tripura", "region": "northeast"},
    "UP": {"name": "Uttar Pradesh", "region": "north"},
    "UK": {"name": "Uttarakhand", "region": "north"},
    "WB": {"name": "West Bengal", "region": "east"},
    "DL": {"name": "Delhi", "region": "north"},
}

# ==================================================
# COMPREHENSIVE COMMODITY DATA WITH REGIONAL PRICES
# ==================================================
COMMODITIES = {
    "rice": {
        "hindi": "चावल",
        "msp": 2183,
        "base_price": 2200,
        "trend": "stable",
        "unit": "quintal",
        "season": "kharif",
        "major_states": ["PB", "HR", "UP", "WB", "AP", "TN"],
        "price_variance": {"north": 1.05, "south": 0.95, "east": 0.90, "west": 1.0, "central": 0.98, "northeast": 0.92}
    },
    "wheat": {
        "hindi": "गेहूं",
        "msp": 2275,
        "base_price": 2400,
        "trend": "up",
        "unit": "quintal",
        "season": "rabi",
        "major_states": ["PB", "HR", "UP", "MP", "RJ"],
        "price_variance": {"north": 1.0, "south": 1.15, "east": 1.10, "west": 1.05, "central": 0.98, "northeast": 1.20}
    },
    "maize": {
        "hindi": "मक्का",
        "msp": 1962,
        "base_price": 2000,
        "trend": "stable",
        "unit": "quintal",
        "season": "kharif",
        "major_states": ["KA", "AP", "MH", "RJ", "MP", "BR"],
        "price_variance": {"north": 1.02, "south": 0.95, "east": 0.98, "west": 1.0, "central": 0.96, "northeast": 1.05}
    },
    "cotton": {
        "hindi": "कपास",
        "msp": 6620,
        "base_price": 6500,
        "trend": "up",
        "unit": "quintal",
        "season": "kharif",
        "major_states": ["GJ", "MH", "TS", "AP", "HR", "PB"],
        "price_variance": {"north": 0.98, "south": 1.0, "east": 1.05, "west": 1.02, "central": 1.0, "northeast": 1.10}
    },
    "soybean": {
        "hindi": "सोयाबीन",
        "msp": 4600,
        "base_price": 4500,
        "trend": "up",
        "unit": "quintal",
        "season": "kharif",
        "major_states": ["MP", "MH", "RJ"],
        "price_variance": {"north": 1.05, "south": 1.10, "east": 1.08, "west": 1.02, "central": 0.98, "northeast": 1.15}
    },
    "groundnut": {
        "hindi": "मूंगफली",
        "msp": 6377,
        "base_price": 6200,
        "trend": "stable",
        "unit": "quintal",
        "season": "kharif",
        "major_states": ["GJ", "RJ", "AP", "TN", "KA"],
        "price_variance": {"north": 1.08, "south": 0.98, "east": 1.05, "west": 1.0, "central": 1.02, "northeast": 1.15}
    },
    "onion": {
        "hindi": "प्याज",
        "msp": 0,
        "base_price": 1800,
        "trend": "volatile",
        "unit": "quintal",
        "season": "rabi",
        "major_states": ["MH", "MP", "KA", "GJ", "RJ"],
        "price_variance": {"north": 1.15, "south": 0.95, "east": 1.20, "west": 0.90, "central": 0.95, "northeast": 1.30}
    },
    "potato": {
        "hindi": "आलू",
        "msp": 0,
        "base_price": 1200,
        "trend": "down",
        "unit": "quintal",
        "season": "rabi",
        "major_states": ["UP", "WB", "BR", "GJ", "PB"],
        "price_variance": {"north": 0.95, "south": 1.20, "east": 0.85, "west": 1.0, "central": 1.05, "northeast": 1.10}
    },
    "tomato": {
        "hindi": "टमाटर",
        "msp": 0,
        "base_price": 2500,
        "trend": "volatile",
        "unit": "quintal",
        "season": "all",
        "major_states": ["MH", "KA", "AP", "MP", "OR"],
        "price_variance": {"north": 1.10, "south": 0.85, "east": 1.05, "west": 0.95, "central": 0.90, "northeast": 1.25}
    },
    "mustard": {
        "hindi": "सरसों",
        "msp": 5650,
        "base_price": 5500,
        "trend": "up",
        "unit": "quintal",
        "season": "rabi",
        "major_states": ["RJ", "MP", "HR", "UP", "GJ"],
        "price_variance": {"north": 0.98, "south": 1.15, "east": 1.10, "west": 1.02, "central": 1.0, "northeast": 1.20}
    },
    "chana": {
        "hindi": "चना",
        "msp": 5440,
        "base_price": 5200,
        "trend": "stable",
        "unit": "quintal",
        "season": "rabi",
        "major_states": ["MP", "RJ", "MH", "UP", "KA"],
        "price_variance": {"north": 1.02, "south": 0.98, "east": 1.05, "west": 1.0, "central": 0.95, "northeast": 1.10}
    },
    "tur": {
        "hindi": "तुअर दाल",
        "msp": 7000,
        "base_price": 7200,
        "trend": "up",
        "unit": "quintal",
        "season": "kharif",
        "major_states": ["MH", "KA", "MP", "UP", "GJ"],
        "price_variance": {"north": 1.05, "south": 0.95, "east": 1.08, "west": 1.0, "central": 0.98, "northeast": 1.12}
    },
    "moong": {
        "hindi": "मूंग",
        "msp": 8558,
        "base_price": 8200,
        "trend": "stable",
        "unit": "quintal",
        "season": "kharif",
        "major_states": ["RJ", "MH", "MP", "AP", "KA"],
        "price_variance": {"north": 1.0, "south": 0.98, "east": 1.05, "west": 1.02, "central": 0.96, "northeast": 1.08}
    },
    "sugarcane": {
        "hindi": "गन्ना",
        "msp": 315,
        "base_price": 350,
        "trend": "stable",
        "unit": "quintal",
        "season": "all",
        "major_states": ["UP", "MH", "KA", "TN", "AP"],
        "price_variance": {"north": 1.0, "south": 0.95, "east": 0.98, "west": 1.05, "central": 0.92, "northeast": 0.90}
    },
    "banana": {
        "hindi": "केला",
        "msp": 0,
        "base_price": 1500,
        "trend": "stable",
        "unit": "quintal",
        "season": "all",
        "major_states": ["TN", "GJ", "MH", "AP", "KA"],
        "price_variance": {"north": 1.20, "south": 0.85, "east": 1.10, "west": 0.95, "central": 1.05, "northeast": 1.0}
    },
}

# Top markets by state
STATE_MARKETS = {
    "MH": ["Pune", "Nashik", "Vashi Mumbai", "Nagpur", "Ahmednagar", "Kolhapur"],
    "UP": ["Agra", "Mathura", "Varanasi", "Lucknow", "Kanpur", "Allahabad"],
    "MP": ["Indore", "Bhopal", "Neemuch", "Mandsaur", "Ujjain", "Dewas"],
    "GJ": ["Rajkot", "Gondal", "Ahmedabad", "Unjha", "Mahuva", "Junagadh"],
    "RJ": ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Alwar", "Sri Ganganagar"],
    "PB": ["Amritsar", "Ludhiana", "Jalandhar", "Bathinda", "Khanna", "Moga"],
    "HR": ["Narela", "Karnal", "Hisar", "Sirsa", "Rohtak", "Tohana"],
    "KA": ["Bangalore", "Hubli", "Davangere", "Bellary", "Gadag", "Bijapur"],
    "AP": ["Guntur", "Kurnool", "Nizamabad", "Warangal", "Vijayawada"],
    "TN": ["Koyambedu Chennai", "Coimbatore", "Madurai", "Salem", "Trichy"],
    "WB": ["Kolkata", "Siliguri", "Asansol", "Burdwan", "Howrah"],
    "BR": ["Patna", "Muzaffarpur", "Gaya", "Darbhanga", "Bhagalpur"],
    "TS": ["Hyderabad", "Warangal", "Karimnagar", "Nizamabad", "Khammam"],
    "OR": ["Bhubaneswar", "Cuttack", "Sambalpur", "Balasore"],
    "DL": ["Azadpur", "Okhla", "Ghazipur"],
}

# ==================================================
# CACHE
# ==================================================
PRICE_CACHE: Dict[str, Dict] = {}
CACHE_DURATION = timedelta(hours=6)


def get_cached_prices(commodity: str) -> Optional[Dict]:
    """Get cached prices if fresh"""
    if commodity in PRICE_CACHE:
        cached = PRICE_CACHE[commodity]
        if datetime.now() - cached["timestamp"] < CACHE_DURATION:
            return cached["data"]
    return None


def cache_prices(commodity: str, data: Dict):
    """Cache prices"""
    PRICE_CACHE[commodity] = {"data": data, "timestamp": datetime.now()}


# ==================================================
# PRICE GENERATION (Simulates real API data)
# ==================================================
def generate_state_prices(commodity: str) -> List[StatePrices]:
    """Generate realistic state-wise prices"""
    if commodity not in COMMODITIES:
        return []
    
    comm = COMMODITIES[commodity]
    base = comm["base_price"]
    state_prices = []
    
    for code, state_info in INDIAN_STATES.items():
        region = state_info["region"]
        variance = comm["price_variance"].get(region, 1.0)
        
        # Base calculation with regional variance
        state_base = base * variance
        
        # Add random daily fluctuation (-3% to +3%)
        fluctuation = random.uniform(-0.03, 0.03)
        state_base = state_base * (1 + fluctuation)
        
        # Calculate min/max
        min_price = state_base * 0.92
        max_price = state_base * 1.08
        
        # Get markets for this state
        markets = STATE_MARKETS.get(code, [f"{state_info['name']} Mandi"])
        num_markets = len(markets)
        
        # Top markets with prices
        top_markets = []
        for market in markets[:3]:
            market_price = state_base * random.uniform(0.95, 1.05)
            top_markets.append({
                "name": market,
                "price": round(market_price, 0),
                "trend": random.choice(["up", "stable", "down"])
            })
        
        state_prices.append(StatePrices(
            state=state_info["name"],
            state_code=code,
            avg_price=round(state_base, 0),
            min_price=round(min_price, 0),
            max_price=round(max_price, 0),
            num_markets=num_markets,
            top_markets=top_markets
        ))
    
    # Sort by price descending (best prices first)
    state_prices.sort(key=lambda x: x.avg_price, reverse=True)
    
    return state_prices


# ==================================================
# ENDPOINTS
# ==================================================
@router.get("/prices/{commodity}")
async def get_commodity_prices(
    commodity: str,
    state: Optional[str] = Query(None, description="Filter by state code (MH, UP, etc.)"),
    region: Optional[str] = Query(None, description="Filter by region (north, south, east, west, central)")
):
    """
    Get comprehensive state-wise prices for a commodity.
    
    Includes:
    - All 29 states + Delhi
    - Multiple markets per state
    - Price trends and MSP
    - Selling advisory
    """
    commodity = commodity.lower()
    if commodity not in COMMODITIES:
        available = ", ".join(COMMODITIES.keys())
        raise HTTPException(status_code=404, detail=f"Commodity not found. Available: {available}")
    
    # Check cache
    cached = get_cached_prices(commodity)
    if cached and not state and not region:
        return cached
    
    comm = COMMODITIES[commodity]
    state_prices = generate_state_prices(commodity)
    
    # Apply filters
    if state:
        state_prices = [s for s in state_prices if s.state_code.upper() == state.upper()]
    if region:
        region_lower = region.lower()
        state_prices = [s for s in state_prices 
                       if INDIAN_STATES.get(s.state_code, {}).get("region") == region_lower]
    
    # Calculate national average
    if state_prices:
        national_avg = sum(s.avg_price for s in state_prices) / len(state_prices)
    else:
        national_avg = comm["base_price"]
    
    # Best selling states
    best_states = [s.state for s in state_prices[:5]]
    
    # Advisory
    trend = comm["trend"]
    if trend == "up":
        advisory = "📈 Prices rising. Hold stock 1-2 weeks for better returns if storage available."
    elif trend == "down":
        advisory = "📉 Prices declining. Consider selling soon to minimize losses."
    elif trend == "volatile":
        advisory = "📊 Prices fluctuating. Monitor daily and sell during price spikes."
    else:
        advisory = "➡️ Prices stable. Sell based on your cash flow needs."
    
    response = {
        "commodity": commodity.capitalize(),
        "commodity_hindi": comm["hindi"],
        "national_average": round(national_avg, 0),
        "unit": f"₹/{comm['unit']}",
        "msp": comm["msp"] if comm["msp"] > 0 else None,
        "trend": trend,
        "season": comm["season"],
        "state_prices": state_prices,
        "total_states": len(state_prices),
        "best_selling_states": best_states,
        "advisory": advisory,
        "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M")
    }
    
    # Cache if no filters
    if not state and not region:
        cache_prices(commodity, response)
    
    return response


@router.get("/commodities")
async def list_commodities(season: Optional[str] = None):
    """Get list of all tracked commodities with current prices"""
    commodities = []
    for name, data in COMMODITIES.items():
        if season and data["season"] != season and data["season"] != "all":
            continue
        commodities.append({
            "name": name.capitalize(),
            "hindi": data["hindi"],
            "current_price": data["base_price"],
            "msp": data["msp"] if data["msp"] > 0 else None,
            "trend": data["trend"],
            "season": data["season"],
            "unit": f"₹/{data['unit']}"
        })
    
    return {
        "commodities": commodities,
        "total": len(commodities),
        "seasons": ["kharif", "rabi", "all"]
    }


@router.get("/states")
async def list_states():
    """Get list of all states with market info"""
    states = []
    for code, info in INDIAN_STATES.items():
        markets = STATE_MARKETS.get(code, [])
        states.append({
            "code": code,
            "name": info["name"],
            "region": info["region"],
            "num_markets": len(markets),
            "top_markets": markets[:3]
        })
    
    return {
        "states": sorted(states, key=lambda x: x["name"]),
        "total": len(states),
        "regions": ["north", "south", "east", "west", "central", "northeast"]
    }


@router.get("/compare")
async def compare_prices(
    commodity: str,
    states: str = Query(..., description="Comma-separated state codes (MH,UP,GJ)")
):
    """Compare prices across specific states"""
    commodity = commodity.lower()
    if commodity not in COMMODITIES:
        raise HTTPException(status_code=404, detail="Commodity not found")
    
    state_list = [s.strip().upper() for s in states.split(",")]
    all_prices = generate_state_prices(commodity)
    
    comparison = []
    for sp in all_prices:
        if sp.state_code in state_list:
            comparison.append({
                "state": sp.state,
                "code": sp.state_code,
                "avg_price": sp.avg_price,
                "min_price": sp.min_price,
                "max_price": sp.max_price,
                "top_market": sp.top_markets[0] if sp.top_markets else None
            })
    
    if comparison:
        best = max(comparison, key=lambda x: x["avg_price"])
        worst = min(comparison, key=lambda x: x["avg_price"])
        diff = best["avg_price"] - worst["avg_price"]
        diff_percent = (diff / worst["avg_price"]) * 100
    else:
        best = worst = diff = diff_percent = None
    
    return {
        "commodity": commodity.capitalize(),
        "comparison": comparison,
        "best_state": best["state"] if best else None,
        "price_difference": round(diff, 0) if diff else 0,
        "difference_percent": round(diff_percent, 1) if diff_percent else 0,
        "recommendation": f"Sell in {best['state']} for ₹{diff:.0f}/quintal extra profit" if best and diff else None
    }


@router.get("/trends/{commodity}")
async def get_price_trends(
    commodity: str,
    days: int = Query(default=30, le=90, description="Number of days (max 90)")
):
    """Get historical price trends"""
    commodity = commodity.lower()
    if commodity not in COMMODITIES:
        raise HTTPException(status_code=404, detail="Commodity not found")
    
    comm = COMMODITIES[commodity]
    base = comm["base_price"]
    trend = comm["trend"]
    
    # Generate realistic trend data
    history = []
    current = base
    for i in range(days):
        date = datetime.now() - timedelta(days=days-i-1)
        
        # Apply trend direction
        if trend == "up":
            change = random.uniform(-1, 2.5)  # Slightly upward bias
        elif trend == "down":
            change = random.uniform(-2.5, 1)  # Slightly downward bias
        elif trend == "volatile":
            change = random.uniform(-4, 4)  # High volatility
        else:
            change = random.uniform(-1.5, 1.5)  # Stable
        
        current = current * (1 + change/100)
        current = max(current, base * 0.7)  # Floor
        current = min(current, base * 1.3)  # Ceiling
        
        history.append({
            "date": date.strftime("%Y-%m-%d"),
            "price": round(current, 0)
        })
    
    prices = [h["price"] for h in history]
    
    return {
        "commodity": commodity.capitalize(),
        "period": f"Last {days} days",
        "history": history,
        "statistics": {
            "min": round(min(prices), 0),
            "max": round(max(prices), 0),
            "average": round(sum(prices)/len(prices), 0),
            "current": round(prices[-1], 0),
            "change_30d": round(((prices[-1] - prices[0]) / prices[0]) * 100, 1)
        },
        "trend": trend
    }


# ==================================================
# INTEGRATION HELPERS (for other modules)
# ==================================================
def get_commodity_price(commodity: str, state: str = None) -> float:
    """Get price for profit estimation integration"""
    commodity = commodity.lower()
    if commodity not in COMMODITIES:
        return 0
    
    base = COMMODITIES[commodity]["base_price"]
    
    if state and state.upper() in INDIAN_STATES:
        region = INDIAN_STATES[state.upper()]["region"]
        variance = COMMODITIES[commodity]["price_variance"].get(region, 1.0)
        return base * variance
    
    return base


def get_commodity_msp(commodity: str) -> float:
    """Get MSP for a commodity"""
    commodity = commodity.lower()
    return COMMODITIES.get(commodity, {}).get("msp", 0)
