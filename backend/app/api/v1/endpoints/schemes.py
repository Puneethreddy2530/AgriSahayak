"""
Government Schemes Endpoints
Information about agricultural subsidies and welfare schemes
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()


class SchemeDetails(BaseModel):
    """Government scheme information"""
    id: str
    name: str
    name_hindi: str
    ministry: str
    description: str
    benefits: List[str]
    eligibility: List[str]
    documents_required: List[str]
    apply_link: str
    helpline: str


class SchemeResponse(BaseModel):
    """Scheme search response"""
    total: int
    schemes: List[SchemeDetails]


# Schemes database
SCHEMES = [
    {
        "id": "pm-kisan",
        "name": "PM-KISAN",
        "name_hindi": "पीएम-किसान सम्मान निधि",
        "ministry": "Ministry of Agriculture",
        "description": "Direct income support of ₹6000/year to farmer families",
        "benefits": [
            "₹6000 per year in 3 installments",
            "Direct bank transfer",
            "No intermediaries"
        ],
        "eligibility": [
            "Small and marginal farmers",
            "Landholding up to 2 hectares",
            "Valid Aadhaar card"
        ],
        "documents_required": [
            "Aadhaar Card",
            "Land records (Khatauni)",
            "Bank account details"
        ],
        "apply_link": "https://pmkisan.gov.in",
        "helpline": "155261"
    },
    {
        "id": "pmfby",
        "name": "PM Fasal Bima Yojana",
        "name_hindi": "प्रधानमंत्री फसल बीमा योजना",
        "ministry": "Ministry of Agriculture",
        "description": "Crop insurance scheme for farmers against crop loss",
        "benefits": [
            "Low premium (2% for Kharif, 1.5% for Rabi)",
            "Full insured sum on crop loss",
            "Covers natural calamities, pests, diseases"
        ],
        "eligibility": [
            "All farmers (loanee and non-loanee)",
            "Crops notified under the scheme"
        ],
        "documents_required": [
            "Aadhaar Card",
            "Land records",
            "Bank account",
            "Sowing certificate"
        ],
        "apply_link": "https://pmfby.gov.in",
        "helpline": "1800-180-1111"
    },
    {
        "id": "kcc",
        "name": "Kisan Credit Card",
        "name_hindi": "किसान क्रेडिट कार्ड",
        "ministry": "Ministry of Finance",
        "description": "Credit facility for farmers at low interest rates",
        "benefits": [
            "Credit up to ₹3 lakh at 4% interest",
            "Interest subvention on timely repayment",
            "Flexible repayment options"
        ],
        "eligibility": [
            "Owner cultivators",
            "Tenant farmers",
            "Sharecroppers"
        ],
        "documents_required": [
            "Land ownership proof",
            "Identity proof",
            "Address proof",
            "Passport photo"
        ],
        "apply_link": "https://www.nabard.org",
        "helpline": "1800-180-8087"
    },
    {
        "id": "soil-health-card",
        "name": "Soil Health Card Scheme",
        "name_hindi": "मृदा स्वास्थ्य कार्ड योजना",
        "ministry": "Ministry of Agriculture",
        "description": "Free soil testing and health card for farmers",
        "benefits": [
            "Free soil testing",
            "Crop-wise fertilizer recommendations",
            "Improves soil health awareness"
        ],
        "eligibility": [
            "All farmers with agricultural land"
        ],
        "documents_required": [
            "Aadhaar Card",
            "Land details"
        ],
        "apply_link": "https://soilhealth.dac.gov.in",
        "helpline": "1800-180-1551"
    },
    {
        "id": "pmksy",
        "name": "PM Krishi Sinchai Yojana",
        "name_hindi": "प्रधानमंत्री कृषि सिंचाई योजना",
        "ministry": "Ministry of Agriculture",
        "description": "Irrigation and water use efficiency scheme",
        "benefits": [
            "Subsidy on micro-irrigation (55-75%)",
            "Drip and sprinkler systems",
            "Water conservation support"
        ],
        "eligibility": [
            "All farmers with agricultural land",
            "Priority to small and marginal farmers"
        ],
        "documents_required": [
            "Land records",
            "Bank details",
            "Application form"
        ],
        "apply_link": "https://pmksy.gov.in",
        "helpline": "1800-180-1551"
    }
]


@router.get("/list", response_model=SchemeResponse)
async def list_schemes(
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search in scheme names")
):
    """
    Get list of all government agricultural schemes.
    
    - **category**: Filter by category (credit, insurance, subsidy)
    - **search**: Search term to filter schemes
    """
    
    filtered = SCHEMES
    
    if search:
        search = search.lower()
        filtered = [s for s in filtered if search in s["name"].lower() or search in s["name_hindi"]]
    
    return SchemeResponse(
        total=len(filtered),
        schemes=[SchemeDetails(**s) for s in filtered]
    )


@router.get("/{scheme_id}", response_model=SchemeDetails)
async def get_scheme_details(scheme_id: str):
    """Get detailed information about a specific scheme"""
    
    for scheme in SCHEMES:
        if scheme["id"] == scheme_id:
            return SchemeDetails(**scheme)
    
    raise HTTPException(status_code=404, detail="Scheme not found")


@router.get("/eligibility-check/{scheme_id}")
async def check_eligibility(
    scheme_id: str,
    land_size: float = Query(..., description="Land size in hectares"),
    farmer_type: str = Query(..., description="owner/tenant/sharecropper")
):
    """Check if a farmer is eligible for a specific scheme"""
    
    for scheme in SCHEMES:
        if scheme["id"] == scheme_id:
            # Basic eligibility check
            eligible = True
            reasons = []
            
            if scheme_id == "pm-kisan" and land_size > 2:
                eligible = False
                reasons.append("Land size exceeds 2 hectares limit for PM-KISAN")
            
            return {
                "scheme": scheme["name"],
                "eligible": eligible,
                "reasons": reasons if not eligible else ["You are eligible for this scheme"],
                "next_steps": scheme["documents_required"] if eligible else []
            }
    
    raise HTTPException(status_code=404, detail="Scheme not found")
