"""
IVR Helpline Backend
Twilio/Exotel compatible webhook endpoints
Press 1 → Crop Advice | Press 2 → Disease Help | Press 3 → Govt Schemes
"""

from fastapi import APIRouter, Request, Form, Response
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from typing import Optional, Dict, List
from datetime import datetime
import os

router = APIRouter()


# ==================================================
# CONFIGURATION
# ==================================================
# Set these in environment for production
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "demo")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "demo")
IVR_PHONE_NUMBER = os.getenv("IVR_PHONE_NUMBER", "+911800123456")

# Languages supported
LANGUAGES = {
    "1": "hindi",
    "2": "english",
    "3": "marathi"
}


# ==================================================
# TwiML RESPONSE HELPERS
# ==================================================
def twiml_response(content: str) -> Response:
    """Return TwiML XML response for Twilio"""
    return Response(content=content, media_type="application/xml")


def create_gather(action: str, prompt: str, num_digits: int = 1, timeout: int = 5) -> str:
    """Create TwiML Gather element for input"""
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather action="{action}" numDigits="{num_digits}" timeout="{timeout}">
        <Say language="hi-IN">{prompt}</Say>
    </Gather>
    <Say language="hi-IN">कोई इनपुट नहीं मिला। कृपया पुनः प्रयास करें।</Say>
    <Redirect>{action.replace('/handle-', '/').split('?')[0]}</Redirect>
</Response>'''


def say_and_hangup(message: str, language: str = "hi-IN") -> str:
    """Say message and hang up"""
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="{language}">{message}</Say>
    <Pause length="1"/>
    <Say language="{language}">AgriSahayak हेल्पलाइन पर कॉल करने के लिए धन्यवाद। नमस्ते!</Say>
    <Hangup/>
</Response>'''


# ==================================================
# CALL LOGS
# ==================================================
CALL_LOGS: List[Dict] = []


def log_call(caller: str, action: str, selection: str = None):
    """Log call for analytics"""
    CALL_LOGS.append({
        "timestamp": datetime.now().isoformat(),
        "caller": caller[-4:] if caller else "unknown",  # Last 4 digits only
        "action": action,
        "selection": selection
    })


# ==================================================
# CROP ADVICE CONTENT
# ==================================================
CROP_ADVICE = {
    "1": {
        "crop": "धान (Rice)",
        "message": """धान की खेती के लिए सलाह:
        अभी रोपाई का सही समय है।
        खेत में 2 से 3 इंच पानी बनाए रखें।
        यूरिया 30 किलो प्रति एकड़ डालें।
        पत्ती मोड़क कीट की निगरानी करें।"""
    },
    "2": {
        "crop": "गेहूं (Wheat)",
        "message": """गेहूं की खेती के लिए सलाह:
        बुवाई नवंबर के पहले सप्ताह में करें।
        बीज दर 40 किलो प्रति एकड़ रखें।
        पहली सिंचाई 21 दिन बाद करें।
        रतुआ रोग की निगरानी करें।"""
    },
    "3": {
        "crop": "टमाटर (Tomato)",
        "message": """टमाटर की खेती के लिए सलाह:
        पौध रोपण 30 दिन की पौध से करें।
        लाइन से लाइन 60 सेमी दूरी रखें।
        झुलसा रोग से बचाव के लिए मैंकोज़ेब छिड़काव करें।
        सप्ताह में 2 बार सिंचाई करें।"""
    },
    "4": {
        "crop": "प्याज (Onion)",
        "message": """प्याज की खेती के लिए सलाह:
        रोपाई अक्टूबर-नवंबर में करें।
        पत्ती बैंगनी धब्बा रोग की निगरानी करें।
        खुदाई से 15 दिन पहले सिंचाई बंद करें।"""
    }
}


# ==================================================
# DISEASE HELP CONTENT
# ==================================================
DISEASE_HELP = {
    "1": {
        "disease": "झुलसा रोग (Blight)",
        "message": """झुलसा रोग का उपचार:
        मैंकोज़ेब 2.5 ग्राम प्रति लीटर पानी में घोलकर छिड़काव करें।
        सुबह या शाम को छिड़काव करें।
        7 दिन बाद दोबारा छिड़काव करें।
        पीले पत्ते तोड़कर जला दें।"""
    },
    "2": {
        "disease": "रतुआ (Rust)",
        "message": """रतुआ रोग का उपचार:
        प्रोपीकोनाज़ोल 1 मिली प्रति लीटर पानी में छिड़काव करें।
        रोग दिखते ही तुरंत उपचार करें।
        10 दिन बाद दोबारा छिड़काव करें।"""
    },
    "3": {
        "disease": "सफेद मक्खी (Whitefly)",
        "message": """सफेद मक्खी नियंत्रण:
        इमिडाक्लोप्रिड 0.5 मिली प्रति लीटर पानी में छिड़काव।
        पीले चिपचिपे ट्रैप लगाएं।
        नीम का तेल 5 मिली प्रति लीटर भी प्रभावी है।"""
    },
    "4": {
        "disease": "फल छेदक (Fruit Borer)",
        "message": """फल छेदक कीट नियंत्रण:
        फेरोमोन ट्रैप प्रति एकड़ 5 लगाएं।
        प्रभावित फल तोड़कर नष्ट करें।
        स्पाइनोसैड 0.5 मिली प्रति लीटर छिड़काव करें।"""
    }
}


# ==================================================
# GOVT SCHEMES CONTENT
# ==================================================
GOVT_SCHEMES = {
    "1": {
        "scheme": "पीएम किसान (PM-KISAN)",
        "message": """प्रधानमंत्री किसान सम्मान निधि:
        प्रति वर्ष 6000 रुपये तीन किस्तों में।
        आवेदन के लिए आधार कार्ड और बैंक खाता जरूरी।
        pmkisan.gov.in पर ऑनलाइन आवेदन करें।
        हेल्पलाइन: 155261"""
    },
    "2": {
        "scheme": "फसल बीमा (PMFBY)",
        "message": """प्रधानमंत्री फसल बीमा योजना:
        खरीफ फसलों पर 2% प्रीमियम।
        रबी फसलों पर 1.5% प्रीमियम।
        बुवाई के 10 दिन के अंदर बीमा कराएं।
        अपने बैंक या CSC केंद्र पर संपर्क करें।"""
    },
    "3": {
        "scheme": "किसान क्रेडिट कार्ड (KCC)",
        "message": """किसान क्रेडिट कार्ड योजना:
        4% ब्याज दर पर ऋण।
        3 लाख तक का ऋण बिना गारंटी।
        अपने नजदीकी बैंक में आवेदन करें।
        जमीन के कागजात साथ लाएं।"""
    },
    "4": {
        "scheme": "सोलर पंप (PM-KUSUM)",
        "message": """पीएम कुसुम सोलर पंप योजना:
        सोलर पंप पर 90% तक सब्सिडी।
        2 से 10 HP पंप के लिए आवेदन करें।
        अपने जिला कृषि कार्यालय में संपर्क करें।
        ऑनलाइन: pmkusum.mnre.gov.in"""
    }
}


# ==================================================
# IVR ENDPOINTS
# ==================================================
@router.post("/incoming")
async def handle_incoming_call(
    request: Request,
    From: str = Form(default=""),
    CallSid: str = Form(default="")
):
    """
    Handle incoming call - Main IVR menu.
    Twilio will POST to this endpoint when someone calls.
    """
    log_call(From, "incoming")
    
    welcome = """AgriSahayak हेल्पलाइन में आपका स्वागत है।
    
    फसल सलाह के लिए 1 दबाएं।
    रोग और कीट उपचार के लिए 2 दबाएं।
    सरकारी योजनाओं की जानकारी के लिए 3 दबाएं।
    मौसम की जानकारी के लिए 4 दबाएं।
    ऑपरेटर से बात करने के लिए 0 दबाएं।"""
    
    twiml = create_gather("/api/v1/ivr/handle-main", welcome, num_digits=1)
    return twiml_response(twiml)


@router.post("/handle-main")
async def handle_main_menu(
    Digits: str = Form(default=""),
    From: str = Form(default="")
):
    """Handle main menu selection"""
    log_call(From, "main_menu", Digits)
    
    if Digits == "1":
        # Crop Advice submenu
        prompt = """फसल चुनें:
        धान के लिए 1 दबाएं।
        गेहूं के लिए 2 दबाएं।
        टमाटर के लिए 3 दबाएं।
        प्याज के लिए 4 दबाएं।
        मुख्य मेनू के लिए 9 दबाएं।"""
        return twiml_response(create_gather("/api/v1/ivr/handle-crop", prompt))
    
    elif Digits == "2":
        # Disease Help submenu
        prompt = """समस्या चुनें:
        झुलसा रोग के लिए 1 दबाएं।
        रतुआ रोग के लिए 2 दबाएं।
        सफेद मक्खी के लिए 3 दबाएं।
        फल छेदक के लिए 4 दबाएं।
        मुख्य मेनू के लिए 9 दबाएं।"""
        return twiml_response(create_gather("/api/v1/ivr/handle-disease", prompt))
    
    elif Digits == "3":
        # Govt Schemes submenu
        prompt = """योजना चुनें:
        पीएम किसान के लिए 1 दबाएं।
        फसल बीमा के लिए 2 दबाएं।
        किसान क्रेडिट कार्ड के लिए 3 दबाएं।
        सोलर पंप योजना के लिए 4 दबाएं।
        मुख्य मेनू के लिए 9 दबाएं।"""
        return twiml_response(create_gather("/api/v1/ivr/handle-scheme", prompt))
    
    elif Digits == "4":
        # Weather Info
        message = """आज का मौसम:
        तापमान 28 डिग्री सेल्सियस।
        आर्द्रता 65 प्रतिशत।
        अगले 3 दिनों में बारिश की संभावना।
        छिड़काव के लिए अच्छा मौसम नहीं है।
        सिंचाई की आवश्यकता नहीं।"""
        return twiml_response(say_and_hangup(message))
    
    elif Digits == "0":
        # Transfer to operator
        twiml = '''<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="hi-IN">कृपया प्रतीक्षा करें, आपकी कॉल ऑपरेटर को ट्रांसफर की जा रही है।</Say>
    <Dial timeout="30">
        <Number>+919999999999</Number>
    </Dial>
    <Say language="hi-IN">कोई ऑपरेटर उपलब्ध नहीं है। कृपया बाद में कॉल करें।</Say>
</Response>'''
        return twiml_response(twiml)
    
    else:
        # Invalid input
        return twiml_response(create_gather(
            "/api/v1/ivr/handle-main",
            "गलत विकल्प। कृपया सही विकल्प दबाएं।"
        ))


@router.post("/handle-crop")
async def handle_crop_selection(
    Digits: str = Form(default=""),
    From: str = Form(default="")
):
    """Handle crop advice selection"""
    log_call(From, "crop_advice", Digits)
    
    if Digits == "9":
        return await handle_incoming_call(None, From, "")
    
    if Digits in CROP_ADVICE:
        advice = CROP_ADVICE[Digits]
        return twiml_response(say_and_hangup(advice["message"]))
    
    return twiml_response(create_gather(
        "/api/v1/ivr/handle-crop",
        "गलत विकल्प। कृपया 1 से 4 के बीच में चुनें।"
    ))


@router.post("/handle-disease")
async def handle_disease_selection(
    Digits: str = Form(default=""),
    From: str = Form(default="")
):
    """Handle disease help selection"""
    log_call(From, "disease_help", Digits)
    
    if Digits == "9":
        return await handle_incoming_call(None, From, "")
    
    if Digits in DISEASE_HELP:
        help_info = DISEASE_HELP[Digits]
        return twiml_response(say_and_hangup(help_info["message"]))
    
    return twiml_response(create_gather(
        "/api/v1/ivr/handle-disease",
        "गलत विकल्प। कृपया 1 से 4 के बीच में चुनें।"
    ))


@router.post("/handle-scheme")
async def handle_scheme_selection(
    Digits: str = Form(default=""),
    From: str = Form(default="")
):
    """Handle government scheme selection"""
    log_call(From, "govt_scheme", Digits)
    
    if Digits == "9":
        return await handle_incoming_call(None, From, "")
    
    if Digits in GOVT_SCHEMES:
        scheme = GOVT_SCHEMES[Digits]
        return twiml_response(say_and_hangup(scheme["message"]))
    
    return twiml_response(create_gather(
        "/api/v1/ivr/handle-scheme",
        "गलत विकल्प। कृपया 1 से 4 के बीच में चुनें।"
    ))


# ==================================================
# ANALYTICS & TESTING
# ==================================================
@router.get("/call-logs")
async def get_call_logs(limit: int = 50):
    """Get recent call logs for analytics"""
    return {
        "total_calls": len(CALL_LOGS),
        "recent_calls": CALL_LOGS[-limit:][::-1]  # Most recent first
    }


@router.get("/test-menu")
async def test_ivr_menu():
    """Test endpoint to see IVR menu structure"""
    return {
        "helpline_number": IVR_PHONE_NUMBER,
        "menu_structure": {
            "1": {
                "name": "Crop Advice",
                "hindi": "फसल सलाह",
                "options": {k: v["crop"] for k, v in CROP_ADVICE.items()}
            },
            "2": {
                "name": "Disease Help", 
                "hindi": "रोग उपचार",
                "options": {k: v["disease"] for k, v in DISEASE_HELP.items()}
            },
            "3": {
                "name": "Govt Schemes",
                "hindi": "सरकारी योजनाएं",
                "options": {k: v["scheme"] for k, v in GOVT_SCHEMES.items()}
            },
            "4": {
                "name": "Weather Info",
                "hindi": "मौसम जानकारी"
            },
            "0": {
                "name": "Speak to Operator",
                "hindi": "ऑपरेटर से बात"
            }
        },
        "twilio_webhooks": {
            "incoming_call": "/api/v1/ivr/incoming",
            "main_menu": "/api/v1/ivr/handle-main",
            "crop_advice": "/api/v1/ivr/handle-crop",
            "disease_help": "/api/v1/ivr/handle-disease",
            "govt_schemes": "/api/v1/ivr/handle-scheme"
        }
    }


@router.post("/simulate")
async def simulate_call(
    caller_number: str = "9876543210",
    menu_path: str = "1,2"
):
    """
    Simulate an IVR call for testing.
    
    menu_path: Comma-separated digits (e.g., "1,2" = Crop advice -> Wheat)
    """
    digits = menu_path.split(",")
    responses = []
    
    # Initial call
    responses.append({
        "step": "incoming",
        "action": "Welcome message played",
        "options": "1: Crop, 2: Disease, 3: Schemes, 4: Weather, 0: Operator"
    })
    
    current_menu = "main"
    for i, digit in enumerate(digits):
        if current_menu == "main":
            if digit == "1":
                responses.append({"step": "main_selection", "digit": digit, "result": "Crop Advice Menu"})
                current_menu = "crop"
            elif digit == "2":
                responses.append({"step": "main_selection", "digit": digit, "result": "Disease Help Menu"})
                current_menu = "disease"
            elif digit == "3":
                responses.append({"step": "main_selection", "digit": digit, "result": "Govt Schemes Menu"})
                current_menu = "scheme"
        elif current_menu == "crop" and digit in CROP_ADVICE:
            responses.append({
                "step": "crop_selection",
                "digit": digit,
                "crop": CROP_ADVICE[digit]["crop"],
                "message_preview": CROP_ADVICE[digit]["message"][:100] + "..."
            })
        elif current_menu == "disease" and digit in DISEASE_HELP:
            responses.append({
                "step": "disease_selection",
                "digit": digit,
                "disease": DISEASE_HELP[digit]["disease"]
            })
        elif current_menu == "scheme" and digit in GOVT_SCHEMES:
            responses.append({
                "step": "scheme_selection",
                "digit": digit,
                "scheme": GOVT_SCHEMES[digit]["scheme"]
            })
    
    return {
        "simulation": True,
        "caller": f"+91{caller_number}",
        "menu_path": menu_path,
        "call_flow": responses
    }
