// AgriSahayak - Complete Vanilla JavaScript
// Dynamic API base URL - works on localhost AND Hugging Face Spaces
const API_BASE = (() => {
    const host = window.location.hostname;
    const isLocalhost = host === 'localhost' || host === '127.0.0.1';

    if (isLocalhost) {
        // Local development - backend runs on port 8000
        return 'http://127.0.0.1:8000/api/v1';
    } else {
        // Deployed (Hugging Face Spaces) - API is on the same origin
        // The backend serves both frontend and API on the same port
        return `${window.location.origin}/api/v1`;
    }
})();

console.log('[AgriSahayak] API Base URL:', API_BASE);

// ============================================
// STATE
// ============================================
let currentFarmer = null;
let currentCycles = [];
let selectedFile = null;
let selectedCommodity = 'rice';
let selectedSchemeCategory = 'All';
let currentActivityCycle = null;
let currentAdmin = null;
let complaints = [];
let allFarmers = []; // For admin view
let currentLanguage = localStorage.getItem('appLanguage') || 'en';

// ============================================
// TRANSLATIONS (i18n)
// ============================================
const TRANSLATIONS = {
    en: {
        // Navigation
        profile: "Profile",
        cropAdvisor: "Crop Advisor",
        cropCycle: "Crop Cycle",
        diseaseDetection: "Disease Detection",
        fertilizer: "Fertilizer",
        expenseTracker: "Expense Tracker",
        marketPrices: "Market Prices",
        weather: "Weather",
        govtSchemes: "Govt Schemes",
        complaints: "Complaints",
        adminPortal: "Admin Portal",
        logout: "Logout",

        // Profile Page
        farmerProfile: "Farmer Profile",
        profileDesc: "Manage your profile and land details for personalized recommendations",
        welcomeTitle: "🌾 Welcome to AgriSahayak",
        welcomeDesc: "Your AI-powered farming companion. Get crop recommendations, detect plant diseases, track expenses, and access government schemes - all in one place.",
        aiCropAdvisor: "AI Crop Advisor",
        diseaseScanner: "Disease Scanner",
        expenseManager: "Expense Manager",
        govtSchemesFeature: "Govt Schemes",

        // Auth
        login: "Login",
        register: "Register",
        username: "Username",
        password: "Password",
        confirmPassword: "Confirm Password",
        fullName: "Full Name",
        phoneNumber: "Phone Number",
        state: "State",
        district: "District",
        language: "Language",
        loginBtn: "Login",
        registerBtn: "Create Account",
        newUser: "New user?",
        existingUser: "Already have account?",
        registerHere: "Register here",
        loginHere: "Login here",

        // Lands
        yourLands: "Your Lands",
        addLand: "+ Add Land",
        landName: "Land Name",
        areaAcres: "Area (Acres)",
        soilType: "Soil Type",
        irrigationType: "Irrigation Type",
        location: "Location",
        saveLand: "Save Land",
        cancel: "Cancel",

        // Soil Types
        black: "Black (Vertisol)",
        red: "Red (Laterite)",
        alluvial: "Alluvial",
        sandy: "Sandy",
        loamy: "Loamy",
        clay: "Clay",

        // Irrigation Types
        rainfed: "Rainfed",
        canal: "Canal",
        borewell: "Borewell/Tubewell",
        drip: "Drip Irrigation",
        sprinkler: "Sprinkler",

        // Crop Advisor
        cropAdvisorTitle: "AI Crop Recommendation",
        cropAdvisorDesc: "Get personalized crop suggestions based on your soil, climate, and market conditions",
        selectLand: "Select Land",
        season: "Season",
        getRecs: "Get Recommendations",

        // Seasons
        kharif: "Kharif (Monsoon)",
        rabi: "Rabi (Winter)",
        zaid: "Zaid (Summer)",

        // Disease Detection
        diseaseTitle: "AI Disease Detection",
        diseaseDesc: "Upload a photo of your crop to detect diseases and get treatment recommendations",
        uploadImage: "Upload Image",
        takePhoto: "Take Photo",
        analyzeDisease: "Analyze Disease",

        // Weather
        weatherTitle: "Weather Intelligence",
        weatherDesc: "Get detailed weather forecasts and agricultural advisories for your location",
        searchLocation: "Search location...",
        temperature: "Temperature",
        humidity: "Humidity",
        wind: "Wind",
        pressure: "Pressure",
        forecast: "7-Day Forecast",

        // Market
        marketTitle: "Mandi Prices",
        marketDesc: "Real-time market prices from mandis across India",
        selectCommodity: "Select Commodity",

        // Schemes
        schemesTitle: "Government Schemes",
        schemesDesc: "Access information about agricultural schemes and subsidies",
        checkEligibility: "Check Eligibility",
        applyNow: "Apply Now",

        // Complaints
        complaintsTitle: "Submit Complaint",
        complaintsDesc: "Report issues related to farming, subsidies, or government services",
        category: "Category",
        subject: "Subject",
        description: "Description",
        urgency: "Urgency",
        submitComplaint: "Submit Complaint",
        yourComplaints: "Your Complaints",

        // Admin
        adminTitle: "Admin Portal",
        adminDesc: "Manage farmer complaints and view district statistics",
        adminLogin: "Admin Login",
        selectDistrict: "Select District",
        officerId: "Officer ID",

        // Common
        loading: "Loading...",
        error: "Error",
        success: "Success",
        save: "Save",
        delete: "Delete",
        edit: "Edit",
        view: "View",
        close: "Close",
        back: "Back",
        next: "Next",
        submit: "Submit",
        search: "Search",
        noData: "No data available",

        // Status
        pending: "Pending",
        inProgress: "In Progress",
        resolved: "Resolved",
        healthy: "Healthy",
        infected: "Infected",

        // Units
        acres: "Acres",
        hectares: "Hectares",
        kg: "kg",
        quintal: "Quintal",
        perQuintal: "per Quintal",

        // Crop Advisor Page Content
        smartFarmingTitle: "🌱 Smart Farming Starts Here",
        smartFarmingDesc: "Our AI analyzes your soil nutrients, climate data, and regional patterns to recommend the perfect crops for maximum yield.",
        accuracy: "Accuracy",
        crops: "Crops",
        farmers: "Farmers",
        enterFieldData: "Enter Your Field Data",
        nitrogen: "Nitrogen (N) kg/ha",
        phosphorus: "Phosphorus (P) kg/ha",
        potassium: "Potassium (K) kg/ha",
        temperatureLabel: "Temperature (°C)",
        humidityLabel: "Humidity (%)",
        soilPH: "Soil pH",
        annualRainfall: "Annual Rainfall (mm)",
        getRecommendations: "Get Recommendations",
        recommendedCrops: "Recommended Crops",

        // Crop Cycle Page Content
        cropCycleTitle: "Crop Lifecycle Tracker",
        cropCycleDesc: "Track your crops from sowing to harvest with AI-powered insights",
        currentSeason: "Current Season",
        bestTimeToSow: "Best Time to Sow",
        irrigationNeeded: "Irrigation Needed",
        startNewCropCycle: "Start New Crop Cycle",
        landId: "Land ID",
        crop: "Crop",
        selectCrop: "Select Crop",
        sowingDate: "Sowing Date",
        startTracking: "Start Tracking",
        activeCropCycles: "Active Crop Cycles",
        noActiveCrops: "No Active Crops",
        noActiveCropsDesc: "Start tracking your first crop cycle to get AI-powered insights!",

        // Disease Detection Page Content
        howItWorks: "🔬 How It Works",
        capture: "1. Capture",
        captureDesc: "Take a clear photo of the affected leaf",
        analyze: "2. Analyze",
        analyzeDesc: "Our AI scans for 15+ common diseases",
        treat: "3. Treat",
        treatDesc: "Get treatment recommendations instantly",
        uploadLeafPhoto: "Upload Leaf Photo",
        supportedCrops: "Supported Crops",
        cropDiseasesDetected: "diseases detected",
        diseaseHistory: "Disease History",
        noDiseaseHistory: "No disease history yet",
        noDiseaseHistoryDesc: "Upload your first leaf image to start detecting diseases",

        // Fertilizer Page Content
        fertilizerTitle: "Fertilizer Calculator",
        fertilizerDesc: "Get precise fertilizer recommendations based on your soil and crop requirements",
        soilNutrientAnalysis: "Soil Nutrient Analysis",
        calculateFertilizer: "Calculate Fertilizer",
        fertilizerRecommendations: "Fertilizer Recommendations",

        // Expense Tracker Page Content
        expenseTitle: "Farm Expense Tracker",
        expenseDesc: "Track all your farming expenses and analyze spending patterns",
        totalExpenses: "Total Expenses",
        thisMonth: "This Month",
        lastMonth: "Last Month",
        addExpense: "Add Expense",
        expenseCategory: "Expense Category",
        amount: "Amount",
        date: "Date",
        notes: "Notes",
        recentExpenses: "Recent Expenses",
        noExpenses: "No expenses recorded yet",
        noExpensesDesc: "Start adding your farming expenses to track your costs",
        exportCSV: "Export CSV",

        // Weather Page Content
        weatherForecast: "Weather Forecast",
        feelsLike: "Feels like",
        windSpeed: "Wind Speed",
        uvIndex: "UV Index",
        sunrise: "Sunrise",
        sunset: "Sunset",
        farmingAdvisory: "Farming Advisory",

        // Market Page Content
        liveMarketPrices: "Live Market Prices",
        selectMandi: "Select Mandi",
        pricePerQuintal: "Price per Quintal",
        modal: "Modal",
        minPrice: "Min",
        maxPrice: "Max",
        lastUpdated: "Last Updated",

        // Schemes Page Content
        eligibleSchemes: "Eligible Schemes",
        benefits: "Benefits",
        documents: "Documents Required",
        applyOnline: "Apply Online",

        // Complaints Page Content
        submitNewComplaint: "Submit New Complaint",
        complaintCategory: "Complaint Category",
        selectCategory: "Select Category",
        complaintSubject: "Subject",
        complaintDescription: "Description",
        attachPhoto: "Attach Photo (Optional)",
        myComplaints: "My Complaints",
        noComplaints: "No complaints yet",
        noComplaintsDesc: "Submit your first complaint to get help from officials",

        // Admin Page Content
        adminDashboard: "Admin Dashboard",
        districtComplaints: "District Complaints",
        totalComplaints: "Total Complaints",
        pendingComplaints: "Pending",
        resolvedComplaints: "Resolved",
        respondToComplaint: "Respond",
        adminResponse: "Admin Response",
        markResolved: "Mark as Resolved"
    },
    hi: {
        // Navigation
        profile: "प्रोफ़ाइल",
        cropAdvisor: "फसल सलाहकार",
        cropCycle: "फसल चक्र",
        diseaseDetection: "रोग पहचान",
        fertilizer: "उर्वरक",
        expenseTracker: "खर्च ट्रैकर",
        marketPrices: "मंडी भाव",
        weather: "मौसम",
        govtSchemes: "सरकारी योजनाएं",
        complaints: "शिकायतें",
        adminPortal: "एडमिन पोर्टल",
        logout: "लॉगआउट",

        // Profile Page
        farmerProfile: "किसान प्रोफ़ाइल",
        profileDesc: "व्यक्तिगत सिफारिशों के लिए अपनी प्रोफ़ाइल और भूमि विवरण प्रबंधित करें",
        welcomeTitle: "🌾 एग्रीसहायक में आपका स्वागत है",
        welcomeDesc: "आपका AI-संचालित कृषि साथी। फसल सिफारिशें, पौधों के रोगों का पता लगाएं, खर्चों को ट्रैक करें, और सरकारी योजनाओं तक पहुंचें - सब एक जगह।",
        aiCropAdvisor: "AI फसल सलाहकार",
        diseaseScanner: "रोग स्कैनर",
        expenseManager: "खर्च प्रबंधक",
        govtSchemesFeature: "सरकारी योजनाएं",

        // Auth
        login: "लॉगिन",
        register: "पंजीकरण",
        username: "यूज़रनेम",
        password: "पासवर्ड",
        confirmPassword: "पासवर्ड पुष्टि करें",
        fullName: "पूरा नाम",
        phoneNumber: "फोन नंबर",
        state: "राज्य",
        district: "जिला",
        language: "भाषा",
        loginBtn: "लॉगिन करें",
        registerBtn: "खाता बनाएं",
        newUser: "नए उपयोगकर्ता?",
        existingUser: "खाता है?",
        registerHere: "यहां पंजीकरण करें",
        loginHere: "यहां लॉगिन करें",

        // Lands
        yourLands: "आपकी भूमि",
        addLand: "+ भूमि जोड़ें",
        landName: "भूमि का नाम",
        areaAcres: "क्षेत्रफल (एकड़)",
        soilType: "मिट्टी का प्रकार",
        irrigationType: "सिंचाई का प्रकार",
        location: "स्थान",
        saveLand: "भूमि सहेजें",
        cancel: "रद्द करें",

        // Soil Types
        black: "काली मिट्टी",
        red: "लाल मिट्टी",
        alluvial: "जलोढ़ मिट्टी",
        sandy: "बलुई मिट्टी",
        loamy: "दोमट मिट्टी",
        clay: "चिकनी मिट्टी",

        // Irrigation Types
        rainfed: "वर्षा आधारित",
        canal: "नहर",
        borewell: "बोरवेल/ट्यूबवेल",
        drip: "टपक सिंचाई",
        sprinkler: "फव्वारा सिंचाई",

        // Crop Advisor
        cropAdvisorTitle: "AI फसल सिफारिश",
        cropAdvisorDesc: "अपनी मिट्टी, जलवायु और बाजार की स्थिति के आधार पर व्यक्तिगत फसल सुझाव प्राप्त करें",
        selectLand: "भूमि चुनें",
        season: "मौसम",
        getRecs: "सिफारिशें प्राप्त करें",

        // Seasons
        kharif: "खरीफ (मानसून)",
        rabi: "रबी (सर्दी)",
        zaid: "जायद (गर्मी)",

        // Disease Detection
        diseaseTitle: "AI रोग पहचान",
        diseaseDesc: "रोगों का पता लगाने और उपचार सिफारिशें प्राप्त करने के लिए अपनी फसल की फोटो अपलोड करें",
        uploadImage: "छवि अपलोड करें",
        takePhoto: "फोटो लें",
        analyzeDisease: "रोग का विश्लेषण करें",

        // Weather
        weatherTitle: "मौसम जानकारी",
        weatherDesc: "अपने स्थान के लिए विस्तृत मौसम पूर्वानुमान और कृषि सलाह प्राप्त करें",
        searchLocation: "स्थान खोजें...",
        temperature: "तापमान",
        humidity: "आर्द्रता",
        wind: "हवा",
        pressure: "दबाव",
        forecast: "7-दिन का पूर्वानुमान",

        // Market
        marketTitle: "मंडी भाव",
        marketDesc: "पूरे भारत की मंडियों से वास्तविक समय के बाजार भाव",
        selectCommodity: "वस्तु चुनें",

        // Schemes
        schemesTitle: "सरकारी योजनाएं",
        schemesDesc: "कृषि योजनाओं और सब्सिडी के बारे में जानकारी प्राप्त करें",
        checkEligibility: "पात्रता जांचें",
        applyNow: "अभी आवेदन करें",

        // Complaints
        complaintsTitle: "शिकायत दर्ज करें",
        complaintsDesc: "खेती, सब्सिडी या सरकारी सेवाओं से संबंधित समस्याओं की रिपोर्ट करें",
        category: "श्रेणी",
        subject: "विषय",
        description: "विवरण",
        urgency: "तात्कालिकता",
        submitComplaint: "शिकायत दर्ज करें",
        yourComplaints: "आपकी शिकायतें",

        // Admin
        adminTitle: "एडमिन पोर्टल",
        adminDesc: "किसान शिकायतों का प्रबंधन करें और जिला आंकड़े देखें",
        adminLogin: "एडमिन लॉगिन",
        selectDistrict: "जिला चुनें",
        officerId: "अधिकारी आईडी",

        // Common
        loading: "लोड हो रहा है...",
        error: "त्रुटि",
        success: "सफल",
        save: "सहेजें",
        delete: "हटाएं",
        edit: "संपादित करें",
        view: "देखें",
        close: "बंद करें",
        back: "वापस",
        next: "अगला",
        submit: "जमा करें",
        search: "खोजें",
        noData: "कोई डेटा उपलब्ध नहीं",

        // Status
        pending: "लंबित",
        inProgress: "प्रगति में",
        resolved: "हल किया गया",
        healthy: "स्वस्थ",
        infected: "संक्रमित",

        // Units
        acres: "एकड़",
        hectares: "हेक्टेयर",
        kg: "किलो",
        quintal: "क्विंटल",
        perQuintal: "प्रति क्विंटल",

        // Crop Advisor Page Content
        smartFarmingTitle: "🌱 स्मार्ट खेती यहीं से शुरू",
        smartFarmingDesc: "हमारा AI आपकी मिट्टी के पोषक तत्वों, जलवायु डेटा और क्षेत्रीय पैटर्न का विश्लेषण करके अधिकतम उपज के लिए सही फसलों की सिफारिश करता है।",
        accuracy: "सटीकता",
        crops: "फसलें",
        farmers: "किसान",
        enterFieldData: "अपने खेत का डेटा दर्ज करें",
        nitrogen: "नाइट्रोजन (N) किग्रा/हेक्टेयर",
        phosphorus: "फॉस्फोरस (P) किग्रा/हेक्टेयर",
        potassium: "पोटेशियम (K) किग्रा/हेक्टेयर",
        temperatureLabel: "तापमान (°C)",
        humidityLabel: "आर्द्रता (%)",
        soilPH: "मिट्टी का pH",
        annualRainfall: "वार्षिक वर्षा (मिमी)",
        getRecommendations: "सिफारिशें प्राप्त करें",
        recommendedCrops: "अनुशंसित फसलें",

        // Crop Cycle Page Content
        cropCycleTitle: "फसल जीवनचक्र ट्रैकर",
        cropCycleDesc: "AI-संचालित जानकारी के साथ बुवाई से कटाई तक अपनी फसलों को ट्रैक करें",
        currentSeason: "वर्तमान मौसम",
        bestTimeToSow: "बुवाई का सर्वोत्तम समय",
        irrigationNeeded: "सिंचाई आवश्यक",
        startNewCropCycle: "नया फसल चक्र शुरू करें",
        landId: "भूमि आईडी",
        crop: "फसल",
        selectCrop: "फसल चुनें",
        sowingDate: "बुवाई की तारीख",
        startTracking: "ट्रैकिंग शुरू करें",
        activeCropCycles: "सक्रिय फसल चक्र",
        noActiveCrops: "कोई सक्रिय फसल नहीं",
        noActiveCropsDesc: "AI-संचालित जानकारी प्राप्त करने के लिए अपना पहला फसल चक्र ट्रैक करना शुरू करें!",

        // Disease Detection Page Content
        howItWorks: "🔬 यह कैसे काम करता है",
        capture: "1. कैप्चर करें",
        captureDesc: "प्रभावित पत्ती की स्पष्ट फोटो लें",
        analyze: "2. विश्लेषण",
        analyzeDesc: "हमारा AI 15+ आम बीमारियों के लिए स्कैन करता है",
        treat: "3. उपचार",
        treatDesc: "तुरंत उपचार सिफारिशें प्राप्त करें",
        uploadLeafPhoto: "पत्ती की फोटो अपलोड करें",
        supportedCrops: "समर्थित फसलें",
        cropDiseasesDetected: "बीमारियां पहचानी गईं",
        diseaseHistory: "रोग इतिहास",
        noDiseaseHistory: "अभी तक कोई रोग इतिहास नहीं",
        noDiseaseHistoryDesc: "रोगों का पता लगाना शुरू करने के लिए अपनी पहली पत्ती की छवि अपलोड करें",

        // Fertilizer Page Content
        fertilizerTitle: "उर्वरक कैलकुलेटर",
        fertilizerDesc: "अपनी मिट्टी और फसल की आवश्यकताओं के आधार पर सटीक उर्वरक सिफारिशें प्राप्त करें",
        soilNutrientAnalysis: "मिट्टी पोषक विश्लेषण",
        calculateFertilizer: "उर्वरक गणना करें",
        fertilizerRecommendations: "उर्वरक सिफारिशें",

        // Expense Tracker Page Content
        expenseTitle: "कृषि खर्च ट्रैकर",
        expenseDesc: "अपने सभी कृषि खर्चों को ट्रैक करें और खर्च पैटर्न का विश्लेषण करें",
        totalExpenses: "कुल खर्च",
        thisMonth: "इस महीने",
        lastMonth: "पिछले महीने",
        addExpense: "खर्च जोड़ें",
        expenseCategory: "खर्च श्रेणी",
        amount: "राशि",
        date: "तारीख",
        notes: "नोट्स",
        recentExpenses: "हाल के खर्च",
        noExpenses: "अभी तक कोई खर्च दर्ज नहीं",
        noExpensesDesc: "अपनी लागतों को ट्रैक करने के लिए अपने कृषि खर्चों को जोड़ना शुरू करें",
        exportCSV: "CSV निर्यात करें",

        // Weather Page Content
        weatherForecast: "मौसम पूर्वानुमान",
        feelsLike: "महसूस होता है",
        windSpeed: "हवा की गति",
        uvIndex: "UV इंडेक्स",
        sunrise: "सूर्योदय",
        sunset: "सूर्यास्त",
        farmingAdvisory: "कृषि सलाह",

        // Market Page Content
        liveMarketPrices: "लाइव बाजार भाव",
        selectMandi: "मंडी चुनें",
        pricePerQuintal: "प्रति क्विंटल कीमत",
        modal: "मोडल",
        minPrice: "न्यूनतम",
        maxPrice: "अधिकतम",
        lastUpdated: "अंतिम अपडेट",

        // Schemes Page Content
        eligibleSchemes: "पात्र योजनाएं",
        benefits: "लाभ",
        documents: "आवश्यक दस्तावेज",
        applyOnline: "ऑनलाइन आवेदन करें",

        // Complaints Page Content
        submitNewComplaint: "नई शिकायत दर्ज करें",
        complaintCategory: "शिकायत श्रेणी",
        selectCategory: "श्रेणी चुनें",
        complaintSubject: "विषय",
        complaintDescription: "विवरण",
        attachPhoto: "फोटो संलग्न करें (वैकल्पिक)",
        myComplaints: "मेरी शिकायतें",
        noComplaints: "अभी तक कोई शिकायत नहीं",
        noComplaintsDesc: "अधिकारियों से मदद पाने के लिए अपनी पहली शिकायत दर्ज करें",

        // Admin Page Content
        adminDashboard: "एडमिन डैशबोर्ड",
        districtComplaints: "जिला शिकायतें",
        totalComplaints: "कुल शिकायतें",
        pendingComplaints: "लंबित",
        resolvedComplaints: "हल की गई",
        respondToComplaint: "जवाब दें",
        adminResponse: "एडमिन प्रतिक्रिया",
        markResolved: "हल के रूप में चिह्नित करें"
    },
    te: {
        // Navigation
        profile: "ప్రొఫైల్",
        cropAdvisor: "పంట సలహాదారు",
        cropCycle: "పంట చక్రం",
        diseaseDetection: "వ్యాధి గుర్తింపు",
        fertilizer: "ఎరువు",
        expenseTracker: "ఖర్చుల ట్రాకర్",
        marketPrices: "మార్కెట్ ధరలు",
        weather: "వాతావరణం",
        govtSchemes: "ప్రభుత్వ పథకాలు",
        complaints: "ఫిర్యాదులు",
        adminPortal: "అడ్మిన్ పోర్టల్",
        logout: "లాగ్అవుట్",

        // Profile Page
        farmerProfile: "రైతు ప్రొఫైల్",
        profileDesc: "వ్యక్తిగత సిఫార్సుల కోసం మీ ప్రొఫైల్ మరియు భూమి వివరాలను నిర్వహించండి",
        welcomeTitle: "🌾 ఆగ్రిసహాయక్‌కు స్వాగతం",
        welcomeDesc: "మీ AI-ఆధారిత వ్యవసాయ సహచరుడు. పంట సిఫార్సులు, మొక్కల వ్యాధులను గుర్తించండి, ఖర్చులను ట్రాక్ చేయండి మరియు ప్రభుత్వ పథకాలను యాక్సెస్ చేయండి.",
        aiCropAdvisor: "AI పంట సలహాదారు",
        diseaseScanner: "వ్యాధి స్కానర్",
        expenseManager: "ఖర్చుల నిర్వహణ",
        govtSchemesFeature: "ప్రభుత్వ పథకాలు",

        // Auth
        login: "లాగిన్",
        register: "నమోదు",
        username: "యూజర్‌నేమ్",
        password: "పాస్‌వర్డ్",
        confirmPassword: "పాస్‌వర్డ్ నిర్ధారించండి",
        fullName: "పూర్తి పేరు",
        phoneNumber: "ఫోన్ నంబర్",
        state: "రాష్ట్రం",
        district: "జిల్లా",
        language: "భాష",
        loginBtn: "లాగిన్ చేయండి",
        registerBtn: "ఖాతా సృష్టించండి",
        newUser: "కొత్త వినియోగదారు?",
        existingUser: "ఖాతా ఉందా?",
        registerHere: "ఇక్కడ నమోదు చేయండి",
        loginHere: "ఇక్కడ లాగిన్ చేయండి",

        // Lands
        yourLands: "మీ భూములు",
        addLand: "+ భూమి జోడించండి",
        landName: "భూమి పేరు",
        areaAcres: "విస్తీర్ణం (ఎకరాలు)",
        soilType: "నేల రకం",
        irrigationType: "నీటిపారుదల రకం",
        location: "స్థానం",
        saveLand: "భూమి సేవ్ చేయండి",
        cancel: "రద్దు చేయండి",

        // Common
        loading: "లోడ్ అవుతోంది...",
        error: "లోపం",
        success: "విజయవంతం",
        save: "సేవ్",
        delete: "తొలగించు",
        close: "మూసివేయండి",
        submit: "సమర్పించండి",
        search: "వెతకండి",
        noData: "డేటా అందుబాటులో లేదు",

        // Status
        pending: "పెండింగ్",
        inProgress: "ప్రగతిలో",
        resolved: "పరిష్కరించబడింది",

        // Weather
        weatherTitle: "వాతావరణ సమాచారం",
        temperature: "ఉష్ణోగ్రత",
        humidity: "తేమ",
        wind: "గాలి",
        pressure: "పీడనం",
        forecast: "7-రోజుల అంచనా"
    },
    ta: {
        // Navigation
        profile: "சுயவிவரம்",
        cropAdvisor: "பயிர் ஆலோசகர்",
        cropCycle: "பயிர் சுழற்சி",
        diseaseDetection: "நோய் கண்டறிதல்",
        fertilizer: "உரம்",
        expenseTracker: "செலவு கண்காணிப்பு",
        marketPrices: "சந்தை விலைகள்",
        weather: "வானிலை",
        govtSchemes: "அரசு திட்டங்கள்",
        complaints: "புகார்கள்",
        adminPortal: "நிர்வாக போர்டல்",
        logout: "வெளியேறு",

        // Profile Page
        farmerProfile: "விவசாயி சுயவிவரம்",
        profileDesc: "தனிப்பயனாக்கப்பட்ட பரிந்துரைகளுக்கு உங்கள் சுயவிவரம் மற்றும் நில விவரங்களை நிர்வகிக்கவும்",
        welcomeTitle: "🌾 அக்ரிசஹாயக்-க்கு வரவேற்கிறோம்",
        welcomeDesc: "உங்கள் AI-இயங்கும் விவசாய தோழர். பயிர் பரிந்துரைகள், தாவர நோய்களைக் கண்டறியுங்கள், செலவுகளைக் கண்காணியுங்கள், அரசு திட்டங்களை அணுகுங்கள்.",
        aiCropAdvisor: "AI பயிர் ஆலோசகர்",
        diseaseScanner: "நோய் ஸ்கேனர்",
        expenseManager: "செலவு மேலாளர்",
        govtSchemesFeature: "அரசு திட்டங்கள்",

        // Auth
        login: "உள்நுழை",
        register: "பதிவு செய்",
        username: "பயனர்பெயர்",
        password: "கடவுச்சொல்",
        confirmPassword: "கடவுச்சொல்லை உறுதிப்படுத்தவும்",
        fullName: "முழு பெயர்",
        phoneNumber: "தொலைபேசி எண்",
        state: "மாநிலம்",
        district: "மாவட்டம்",
        language: "மொழி",
        loginBtn: "உள்நுழையவும்",
        registerBtn: "கணக்கை உருவாக்கு",
        newUser: "புதிய பயனர்?",
        existingUser: "கணக்கு உள்ளதா?",
        registerHere: "இங்கே பதிவு செய்யவும்",
        loginHere: "இங்கே உள்நுழையவும்",

        // Lands
        yourLands: "உங்கள் நிலங்கள்",
        addLand: "+ நிலம் சேர்க்கவும்",
        landName: "நில பெயர்",
        areaAcres: "பரப்பளவு (ஏக்கர்)",
        soilType: "மண் வகை",
        irrigationType: "பாசன வகை",
        location: "இடம்",
        saveLand: "நிலத்தை சேமி",
        cancel: "ரத்துசெய்",

        // Common
        loading: "ஏற்றுகிறது...",
        error: "பிழை",
        success: "வெற்றி",
        save: "சேமி",
        delete: "நீக்கு",
        close: "மூடு",
        submit: "சமர்ப்பி",
        search: "தேடு",
        noData: "தரவு இல்லை",

        // Status
        pending: "நிலுவையில்",
        inProgress: "நடப்பில்",
        resolved: "தீர்க்கப்பட்டது",

        // Weather
        weatherTitle: "வானிலை தகவல்",
        temperature: "வெப்பநிலை",
        humidity: "ஈரப்பதம்",
        wind: "காற்று",
        pressure: "அழுத்தம்",
        forecast: "7-நாள் முன்னறிவிப்பு"
    },
    mr: {
        // Navigation
        profile: "प्रोफाइल",
        cropAdvisor: "पीक सल्लागार",
        cropCycle: "पीक चक्र",
        diseaseDetection: "रोग ओळख",
        fertilizer: "खत",
        expenseTracker: "खर्च ट्रॅकर",
        marketPrices: "बाजार भाव",
        weather: "हवामान",
        govtSchemes: "सरकारी योजना",
        complaints: "तक्रारी",
        adminPortal: "प्रशासक पोर्टल",
        logout: "बाहेर पडा",

        // Profile Page
        farmerProfile: "शेतकरी प्रोफाइल",
        profileDesc: "वैयक्तिक शिफारसींसाठी तुमचे प्रोफाइल आणि जमीन तपशील व्यवस्थापित करा",
        welcomeTitle: "🌾 अॅग्रीसहायकमध्ये आपले स्वागत आहे",
        welcomeDesc: "तुमचा AI-चालित शेती साथीदार. पीक शिफारसी, वनस्पती रोग शोधा, खर्च ट्रॅक करा आणि सरकारी योजनांमध्ये प्रवेश करा.",
        aiCropAdvisor: "AI पीक सल्लागार",
        diseaseScanner: "रोग स्कॅनर",
        expenseManager: "खर्च व्यवस्थापक",
        govtSchemesFeature: "सरकारी योजना",

        // Auth
        login: "लॉगिन",
        register: "नोंदणी",
        username: "वापरकर्तानाव",
        password: "पासवर्ड",
        fullName: "पूर्ण नाव",
        phoneNumber: "फोन नंबर",
        state: "राज्य",
        district: "जिल्हा",
        language: "भाषा",
        loginBtn: "लॉगिन करा",
        registerBtn: "खाते तयार करा",

        // Common
        loading: "लोड होत आहे...",
        error: "त्रुटी",
        success: "यशस्वी",
        save: "जतन करा",
        delete: "हटवा",
        close: "बंद करा",
        submit: "सादर करा",
        search: "शोधा",
        noData: "डेटा उपलब्ध नाही"
    },
    kn: {
        // Navigation
        profile: "ಪ್ರೊಫೈಲ್",
        cropAdvisor: "ಬೆಳೆ ಸಲಹೆಗಾರ",
        cropCycle: "ಬೆಳೆ ಚಕ್ರ",
        diseaseDetection: "ರೋಗ ಪತ್ತೆ",
        fertilizer: "ರಸಗೊಬ್ಬರ",
        expenseTracker: "ವೆಚ್ಚ ಟ್ರ್ಯಾಕರ್",
        marketPrices: "ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು",
        weather: "ಹವಾಮಾನ",
        govtSchemes: "ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು",
        complaints: "ದೂರುಗಳು",
        adminPortal: "ನಿರ್ವಾಹಕ ಪೋರ್ಟಲ್",
        logout: "ಲಾಗ್ಔಟ್",

        farmerProfile: "ರೈತ ಪ್ರೊಫೈಲ್",
        welcomeTitle: "🌾 ಆಗ್ರಿಸಹಾಯಕ್‌ಗೆ ಸ್ವಾಗತ",

        // Common
        loading: "ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
        error: "ದೋಷ",
        success: "ಯಶಸ್ಸು",
        save: "ಉಳಿಸಿ",
        delete: "ಅಳಿಸಿ",
        close: "ಮುಚ್ಚಿ",
        submit: "ಸಲ್ಲಿಸಿ",
        search: "ಹುಡುಕಿ"
    },
    bn: {
        // Navigation
        profile: "প্রোফাইল",
        cropAdvisor: "ফসল পরামর্শদাতা",
        cropCycle: "ফসল চক্র",
        diseaseDetection: "রোগ সনাক্তকরণ",
        fertilizer: "সার",
        expenseTracker: "খরচ ট্র্যাকার",
        marketPrices: "বাজার দর",
        weather: "আবহাওয়া",
        govtSchemes: "সরকারি প্রকল্প",
        complaints: "অভিযোগ",
        adminPortal: "প্রশাসক পোর্টাল",
        logout: "লগআউট",

        farmerProfile: "কৃষক প্রোফাইল",
        welcomeTitle: "🌾 অ্যাগ্রিসহায়ক-এ স্বাগতম",

        // Common
        loading: "লোড হচ্ছে...",
        error: "ত্রুটি",
        success: "সফল",
        save: "সংরক্ষণ করুন",
        delete: "মুছুন",
        close: "বন্ধ করুন",
        submit: "জমা দিন",
        search: "অনুসন্ধান"
    },
    gu: {
        // Navigation
        profile: "પ્રોફાઇલ",
        cropAdvisor: "પાક સલાહકાર",
        cropCycle: "પાક ચક્ર",
        diseaseDetection: "રોગ શોધ",
        fertilizer: "ખાતર",
        expenseTracker: "ખર્ચ ટ્રેકર",
        marketPrices: "બજાર ભાવ",
        weather: "હવામાન",
        govtSchemes: "સરકારી યોજનાઓ",
        complaints: "ફરિયાદો",
        adminPortal: "એડમિન પોર્ટલ",
        logout: "લૉગઆઉટ",

        farmerProfile: "ખેડૂત પ્રોફાઇલ",
        welcomeTitle: "🌾 એગ્રીસહાયકમાં આપનું સ્વાગત છે",

        // Common
        loading: "લોડ થઈ રહ્યું છે...",
        error: "ભૂલ",
        success: "સફળતા",
        save: "સાચવો",
        delete: "કાઢી નાખો",
        close: "બંધ કરો",
        submit: "સબમિટ કરો",
        search: "શોધો"
    },
    pa: {
        // Navigation
        profile: "ਪ੍ਰੋਫਾਈਲ",
        cropAdvisor: "ਫਸਲ ਸਲਾਹਕਾਰ",
        cropCycle: "ਫਸਲ ਚੱਕਰ",
        diseaseDetection: "ਬਿਮਾਰੀ ਖੋਜ",
        fertilizer: "ਖਾਦ",
        expenseTracker: "ਖਰਚਾ ਟ੍ਰੈਕਰ",
        marketPrices: "ਮੰਡੀ ਭਾਅ",
        weather: "ਮੌਸਮ",
        govtSchemes: "ਸਰਕਾਰੀ ਸਕੀਮਾਂ",
        complaints: "ਸ਼ਿਕਾਇਤਾਂ",
        adminPortal: "ਐਡਮਿਨ ਪੋਰਟਲ",
        logout: "ਲੌਗਆਊਟ",

        farmerProfile: "ਕਿਸਾਨ ਪ੍ਰੋਫਾਈਲ",
        welcomeTitle: "🌾 ਐਗਰੀਸਹਾਇਕ ਵਿੱਚ ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ",

        // Common
        loading: "ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...",
        error: "ਗਲਤੀ",
        success: "ਸਫਲ",
        save: "ਸੇਵ ਕਰੋ",
        delete: "ਮਿਟਾਓ",
        close: "ਬੰਦ ਕਰੋ",
        submit: "ਜਮ੍ਹਾਂ ਕਰੋ",
        search: "ਖੋਜੋ"
    }
};

// Get translation
function t(key) {
    const lang = currentLanguage || 'en';
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en']?.[key] || key;
}

// Change app language
function changeAppLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('appLanguage', lang);

    // Update both desktop and mobile selectors
    const desktopSelect = document.getElementById('app-language');
    const mobileSelect = document.getElementById('mobile-app-language');
    if (desktopSelect) desktopSelect.value = lang;
    if (mobileSelect) mobileSelect.value = lang;

    updateAllTranslations();
}

// Update all UI text using data-i18n attributes
function updateAllTranslations() {
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translation = t(key);
        if (translation && translation !== key) {
            el.textContent = translation;
        }
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = t(key);
    });

    // Refresh icons after DOM changes
    lucide.createIcons();
}

// ============================================
// LOCAL STORAGE HELPERS
// ============================================
function saveToStorage() {
    if (currentFarmer) {
        localStorage.setItem('farmer', JSON.stringify(currentFarmer));
    }
    localStorage.setItem('cropCycles', JSON.stringify(currentCycles));
    localStorage.setItem('complaints', JSON.stringify(complaints));
    if (currentAdmin) {
        localStorage.setItem('admin', JSON.stringify(currentAdmin));
    }
}

function loadFromStorage() {
    const savedFarmer = localStorage.getItem('farmer');
    const savedCycles = localStorage.getItem('cropCycles');
    const savedComplaints = localStorage.getItem('complaints');
    const savedAdmin = localStorage.getItem('admin');

    if (savedFarmer) {
        try {
            currentFarmer = JSON.parse(savedFarmer);
        } catch (e) {
            currentFarmer = null;
        }
    }

    if (savedCycles) {
        try {
            currentCycles = JSON.parse(savedCycles);
        } catch (e) {
            currentCycles = [];
        }
    }

    if (savedComplaints) {
        try {
            complaints = JSON.parse(savedComplaints);
        } catch (e) {
            complaints = [];
        }
    }

    if (savedAdmin) {
        try {
            currentAdmin = JSON.parse(savedAdmin);
        } catch (e) {
            currentAdmin = null;
        }
    }
}

function clearStorage() {
    localStorage.removeItem('farmer');
    localStorage.removeItem('cropCycles');
}

// ============================================
// PAGE NAVIGATION
// ============================================
function showPage(pageId) {
    console.log('Navigating to:', pageId);

    // Hide all pages
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));

    // Show target page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    } else {
        console.error('Page not found:', pageId);
        return;
    }

    // Update sidebar nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('onclick')?.includes(`'${pageId}'`)) {
            link.classList.add('active');
        }
    });

    // Update mobile bottom nav
    document.querySelectorAll('.mobile-bottom-nav .nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('onclick')?.includes(`'${pageId}'`)) {
            item.classList.add('active');
        }
    });

    // Close mobile menu if open
    closeMobileMenu();

    // Initialize page content
    if (pageId === 'market') loadMarketPrices();
    if (pageId === 'schemes') loadSchemes();
    if (pageId === 'crop-cycle') {
        populateLandDropdown();
        loadCropCycles();
    }
    if (pageId === 'weather') loadWeatherPage();
}

// ============================================
// MOBILE MENU FUNCTIONS
// ============================================
function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const overlay = document.querySelector('.sidebar-overlay');

    sidebar.classList.toggle('open');
    menuBtn.classList.toggle('active');
    overlay.classList.toggle('show');
}

function closeMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const overlay = document.querySelector('.sidebar-overlay');

    if (sidebar) sidebar.classList.remove('open');
    if (menuBtn) menuBtn.classList.remove('active');
    if (overlay) overlay.classList.remove('show');
}

// ============================================
// BACKEND STATUS CHECK
// ============================================
async function checkBackendStatus() {
    const statusEl = document.getElementById('backend-status');
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // On deployed environments (HuggingFace), hide the status indicator
    if (!isLocalhost) {
        statusEl.style.display = 'none';
        return;
    }

    try {
        const response = await fetch(`${API_BASE.replace('/api/v1', '')}/health`);
        const data = await response.json();
        statusEl.innerHTML = `<span style="color: var(--success);">● Connected</span><br><small>GPU: ${data.cuda ? 'Active' : 'CPU'}</small>`;
        statusEl.className = 'backend-status connected';
    } catch (error) {
        statusEl.innerHTML = '<span style="color: var(--danger);">● Offline</span><br><small>Start backend server</small>';
        statusEl.className = 'backend-status disconnected';
    }
}

// ============================================
// PROFILE / FARMER MANAGEMENT
// ============================================
function setAuthMode(mode) {
    document.querySelectorAll('.auth-toggle button').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    document.getElementById('register-form').style.display = mode === 'register' ? 'block' : 'none';
    document.getElementById('login-form').style.display = mode === 'login' ? 'block' : 'none';
}

// Toggle password visibility
function togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    const icon = btn.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.setAttribute('data-lucide', 'eye-off');
    } else {
        input.type = 'password';
        icon.setAttribute('data-lucide', 'eye');
    }
    lucide.createIcons();
}

// Forgot password handler
function showForgotPassword() {
    const phone = prompt('Enter your registered phone number:');
    if (phone && phone.length === 10) {
        alert(`Password reset link would be sent to phone: ${phone}\n\nNote: In production, this would send an OTP or reset link.`);
    } else if (phone) {
        alert('Please enter a valid 10-digit phone number');
    }
}

// ============================================
// AUTHENTICATION - BACKEND AS SOURCE OF TRUTH
// ============================================
let authToken = null;

function getAuthHeaders() {
    if (authToken) {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        };
    }
    return { 'Content-Type': 'application/json' };
}

async function registerFarmer() {
    const data = {
        name: document.getElementById('reg-name').value.trim(),
        username: document.getElementById('reg-username').value.trim().toLowerCase(),
        password: document.getElementById('reg-password').value,
        confirmPassword: document.getElementById('reg-confirm-password').value,
        phone: document.getElementById('reg-phone').value.trim(),
        state: document.getElementById('reg-state').value,
        district: document.getElementById('reg-district').value.trim(),
        language: document.getElementById('reg-language').value
    };

    // Client-side validation
    if (!data.name || !data.username || !data.password || !data.phone || !data.state || !data.district) {
        alert('Please fill all required fields');
        return;
    }

    if (data.username.length < 4) {
        alert('Username must be at least 4 characters');
        return;
    }

    if (!/^[a-z0-9_]+$/.test(data.username)) {
        alert('Username can only contain lowercase letters, numbers, and underscores');
        return;
    }

    if (data.password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }

    if (data.password !== data.confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    if (data.phone.length !== 10 || !/^\d+$/.test(data.phone)) {
        alert('Please enter a valid 10-digit phone number');
        return;
    }

    try {
        // Call backend auth/register - BACKEND IS SOURCE OF TRUTH
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: data.name,
                username: data.username,
                password: data.password,
                phone: data.phone,
                state: data.state,
                district: data.district,
                language: data.language
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Registration failed');
        }

        const result = await response.json();

        // Store token from backend
        authToken = result.access_token;
        localStorage.setItem('authToken', authToken);

        // Use user data from backend response
        const farmer = {
            id: result.user.farmer_id,
            name: result.user.name,
            phone: result.user.phone,
            username: result.user.username,
            state: data.state,
            district: data.district,
            language: data.language,
            lands: []
        };

        alert('Registration successful! Welcome to AgriSahayak.');
        onLoginSuccess(farmer);
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function loginFarmer() {
    const usernameOrPhone = document.getElementById('login-username').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    const rememberMe = document.getElementById('remember-me').checked;

    errorEl.textContent = '';

    if (!usernameOrPhone || !password) {
        errorEl.textContent = 'Please enter username/phone and password';
        return;
    }

    try {
        // Call backend auth/login - BACKEND IS SOURCE OF TRUTH
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: usernameOrPhone,
                password: password
            })
        });

        if (!response.ok) {
            const err = await response.json();
            errorEl.textContent = err.detail || 'Login failed';
            return;
        }

        const result = await response.json();

        // Store token from backend
        authToken = result.access_token;
        localStorage.setItem('authToken', authToken);

        if (rememberMe) {
            localStorage.setItem('rememberedUser', usernameOrPhone);
        } else {
            localStorage.removeItem('rememberedUser');
        }

        // Fetch full profile from backend
        const profileResponse = await fetch(`${API_BASE}/auth/me`, {
            headers: getAuthHeaders()
        });

        let farmer;
        if (profileResponse.ok) {
            const profile = await profileResponse.json();
            farmer = {
                id: profile.farmer_id,
                name: profile.name,
                phone: profile.phone,
                username: profile.username,
                state: profile.state,
                district: profile.district,
                language: profile.language,
                lands: []
            };

            // Fetch lands from backend
            try {
                const landsResponse = await fetch(`${API_BASE}/farmer/land/farmer/${profile.farmer_id}`, {
                    headers: getAuthHeaders()
                });
                if (landsResponse.ok) {
                    const landsData = await landsResponse.json();
                    farmer.lands = landsData.lands || [];
                }
            } catch (e) {
                console.log('Could not fetch lands:', e);
            }
        } else {
            // Use data from login response
            farmer = {
                id: result.user.farmer_id,
                name: result.user.name,
                phone: result.user.phone,
                username: result.user.username,
                lands: []
            };
        }

        onLoginSuccess(farmer);
    } catch (error) {
        errorEl.textContent = 'Error connecting to server: ' + error.message;
    }
}

// Legacy function kept for backward compatibility
async function lookupFarmer() {
    loginFarmer();
}

function onLoginSuccess(farmer) {
    currentFarmer = farmer;
    saveToStorage(); // Save to localStorage for offline access

    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('profile-dashboard').style.display = 'block';
    document.getElementById('sidebar-logout').style.display = 'flex'; // Show sidebar logout
    document.getElementById('nav-complaints').style.display = 'flex'; // Show complaints nav

    updateProfileDisplay();
    displayProfilePicture();
    renderMyComplaints();
}

// Language display names
const LANGUAGE_NAMES = {
    'hi': 'हिंदी',
    'en': 'English',
    'mr': 'मराठी',
    'ta': 'தமிழ்',
    'te': 'తెలుగు',
    'kn': 'ಕನ್ನಡ'
};

function updateProfileDisplay() {
    if (!currentFarmer) return;

    document.getElementById('farmer-avatar').textContent = currentFarmer.name.charAt(0).toUpperCase();
    document.getElementById('farmer-name').textContent = currentFarmer.name;
    document.getElementById('farmer-username').textContent = currentFarmer.username || 'Not set';
    document.getElementById('farmer-phone').textContent = currentFarmer.phone;
    document.getElementById('farmer-location').textContent = `${currentFarmer.district || ''}, ${currentFarmer.state || ''}`;
    document.getElementById('farmer-id').textContent = `ID: ${currentFarmer.id}`;

    // Display language preference
    const langCode = currentFarmer.language || 'hi';
    document.getElementById('farmer-language').textContent = LANGUAGE_NAMES[langCode] || langCode;

    const lands = currentFarmer.lands || [];
    document.getElementById('stat-lands').textContent = lands.length;
    document.getElementById('stat-area').textContent = lands.reduce((sum, l) => sum + (l.area || 0), 0).toFixed(1);

    // Count crops from both crop_history and active cycles
    const historyCount = lands.reduce((sum, l) => sum + (l.crop_history?.length || 0), 0);
    const activeCount = currentCycles.length;
    document.getElementById('stat-crops').textContent = historyCount + activeCount;

    renderLands();
}

function logoutFarmer() {
    currentFarmer = null;
    currentCycles = [];
    clearStorage(); // Clear all localStorage
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('profile-dashboard').style.display = 'none';
    document.getElementById('sidebar-logout').style.display = 'none'; // Hide sidebar logout
    document.getElementById('nav-complaints').style.display = 'none'; // Hide complaints nav

    // Reset avatar
    document.getElementById('farmer-avatar').style.display = 'flex';
    document.getElementById('farmer-avatar-img').style.display = 'none';

    lucide.createIcons(); // Refresh icons
}

function toggleAddLand() {
    const form = document.getElementById('add-land-form');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

async function addLand() {
    if (!currentFarmer) {
        alert('Please login first');
        return;
    }

    const name = document.getElementById('land-name').value.trim();
    const area = parseFloat(document.getElementById('land-area').value);
    const soilType = document.getElementById('land-soil').value;
    const irrigationType = document.getElementById('land-irrigation').value;
    const location = document.getElementById('land-location').value.trim();

    if (!area || !soilType || !irrigationType) {
        alert('Please fill all required fields (Area, Soil Type, Irrigation)');
        return;
    }

    const data = {
        farmer_id: currentFarmer.id,
        area: area,
        soil_type: soilType,
        irrigation_type: irrigationType
    };

    try {
        const response = await fetch(`${API_BASE}/farmer/land/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const land = await response.json();
            // Add name and location to the land object locally
            land.name = name || `Land ${(currentFarmer.lands?.length || 0) + 1}`;
            land.location = location;
            currentFarmer.lands = currentFarmer.lands || [];
            currentFarmer.lands.push(land);
            saveToStorage(); // Save after adding land
            updateProfileDisplay();
            toggleAddLand();
            // Clear form
            document.getElementById('land-name').value = '';
            document.getElementById('land-area').value = '';
            document.getElementById('land-soil').value = '';
            document.getElementById('land-irrigation').value = '';
            document.getElementById('land-location').value = '';
            alert('Land added successfully!');
        } else {
            const error = await response.json();
            alert('Error: ' + (error.detail || 'Failed to add land'));
        }
    } catch (error) {
        console.error('Add land error:', error);
        alert('Error adding land: ' + error.message);
    }
}

function renderLands() {
    const container = document.getElementById('lands-container');
    const lands = currentFarmer?.lands || [];

    if (lands.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No lands registered yet. Add your first land!</p></div>';
        return;
    }

    container.innerHTML = lands.map((land, i) => `
        <div class="land-card glass-card">
            <div class="land-header">
                <i data-lucide="map-pin" class="land-icon-svg"></i>
                <div>
                    <h4>${land.name || 'Land #' + (i + 1)}</h4>
                    <span class="land-id">${land.land_id}</span>
                </div>
                <button class="btn-delete-land" onclick="deleteLand(${i})" title="Delete Land">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
            <div class="land-details">
                <div class="detail"><span class="label">Area</span><span class="value">${land.area} acres</span></div>
                <div class="detail"><span class="label">Soil</span><span class="value">${capitalize(land.soil_type)}</span></div>
                <div class="detail"><span class="label">Irrigation</span><span class="value">${capitalize(land.irrigation_type)}</span></div>
                ${land.location ? `<div class="detail"><span class="label">Location</span><span class="value">${land.location}</span></div>` : ''}
                <div class="detail"><span class="label">Crops</span><span class="value">${land.crop_history?.length || 0} seasons</span></div>
            </div>
        </div>
    `).join('');

    // Refresh Lucide icons for newly rendered content
    lucide.createIcons();
}

function deleteLand(index) {
    if (!currentFarmer || !currentFarmer.lands) return;

    const land = currentFarmer.lands[index];
    const landName = land.name || `Land #${index + 1}`;

    if (confirm(`Are you sure you want to delete "${landName}"?`)) {
        currentFarmer.lands.splice(index, 1);
        saveToStorage();
        updateProfileDisplay();
    }
}

// ============================================
// CROP ADVISOR
// ============================================
async function getCropRecommendations() {
    const btn = document.getElementById('crop-btn');
    btn.innerHTML = '⏳ Analyzing...';
    btn.disabled = true;

    const data = {
        nitrogen: parseFloat(document.getElementById('nitrogen').value) || 50,
        phosphorus: parseFloat(document.getElementById('phosphorus').value) || 40,
        potassium: parseFloat(document.getElementById('potassium').value) || 30,
        temperature: parseFloat(document.getElementById('temperature').value) || 28,
        humidity: parseFloat(document.getElementById('humidity').value) || 70,
        ph: parseFloat(document.getElementById('ph').value) || 6.5,
        rainfall: parseFloat(document.getElementById('rainfall').value) || 150
    };

    try {
        const response = await fetch(`${API_BASE}/crop/recommend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        displayCropResults(result);
    } catch (error) {
        alert('Error getting recommendations: ' + error.message);
    } finally {
        btn.innerHTML = '🔍 Get Recommendations';
        btn.disabled = false;
    }
}

function displayCropResults(data) {
    const icons = { rice: '🌾', wheat: '🌾', maize: '🌽', cotton: '🧶', sugarcane: '🎋', potato: '🥔', tomato: '🍅', onion: '🧅', mango: '🥭', banana: '🍌', apple: '🍎', coffee: '☕' };

    const cardsHtml = data.recommendations.map((rec, i) => `
        <div class="recommendation-card glass-card ${i === 0 ? 'top-pick' : ''}">
            ${i === 0 ? '<div style="color: var(--warning); font-weight: 600; margin-bottom: 0.5rem;">🏆 TOP PICK</div>' : ''}
            <div class="crop-icon">${icons[rec.crop_name.toLowerCase()] || '🌱'}</div>
            <h4>${rec.crop_name}</h4>
            <div class="confidence-bar"><div class="confidence-fill" style="width: ${rec.confidence * 100}%"></div></div>
            <span class="confidence-text">${(rec.confidence * 100).toFixed(0)}% Match</span>
            <div class="crop-details">
                <div class="detail"><span class="label">Season</span><span class="value">${rec.season}</span></div>
                <div class="detail"><span class="label">Water</span><span class="value">${rec.water_requirement}</span></div>
                <div class="detail"><span class="label">Yield</span><span class="value">${rec.expected_yield}</span></div>
            </div>
        </div>
    `).join('');

    document.getElementById('crop-cards').innerHTML = cardsHtml;

    const healthClass = data.soil_health === 'Excellent' ? 'success' : data.soil_health === 'Good' ? 'success' : 'warning';
    document.getElementById('soil-health').innerHTML = `
        <h4>🌿 Soil Health: <span style="color: var(--${healthClass})">${data.soil_health}</span></h4>
        <p style="color: var(--text-secondary); margin-top: 0.5rem;">${data.advisory}</p>
    `;

    document.getElementById('crop-results').style.display = 'block';
    document.getElementById('crop-results').scrollIntoView({ behavior: 'smooth' });
}

// ============================================
// CROP CYCLE
// ============================================
function populateLandDropdown() {
    const select = document.getElementById('cycle-land-id');
    if (!select) return;

    // Clear existing options except the first one
    select.innerHTML = '<option value="">-- Select your land --</option>';

    // Check if user has lands
    if (!currentFarmer || !currentFarmer.lands || currentFarmer.lands.length === 0) {
        select.innerHTML += '<option value="" disabled>No lands registered. Add land in Profile first.</option>';
        return;
    }

    // Add each land as an option
    currentFarmer.lands.forEach(land => {
        const option = document.createElement('option');
        option.value = land.land_id || land.id;
        option.textContent = `${land.name || 'Land'} (${land.land_id || land.id}) - ${land.area || 0} acres`;
        select.appendChild(option);
    });
}

async function startCropCycle() {
    const data = {
        land_id: document.getElementById('cycle-land-id').value,
        crop: document.getElementById('cycle-crop').value,
        season: document.getElementById('cycle-season').value,
        sowing_date: document.getElementById('cycle-sowing-date').value
    };

    if (!data.land_id || !data.crop || !data.sowing_date) {
        alert('Please fill all fields');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/cropcycle/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const cycle = await response.json();
            currentCycles.push(cycle);
            saveToStorage(); // Save after adding crop cycle
            renderCropCycles();
            updateProfileDisplay(); // Update crops count in profile
            alert('Crop cycle started successfully!');
        } else {
            // Show the actual error from the API
            const errorData = await response.json();
            const errorMsg = errorData.detail || 'Failed to start crop cycle';
            alert('Error: ' + errorMsg + '\n\nTip: Make sure you have registered a land with this Land ID in your Profile first.');
        }
    } catch (error) {
        console.error('Crop cycle error:', error);
        alert('Error starting crop cycle: ' + error.message);
    }
}

async function loadCropCycles() {
    // For demo, use local state
    renderCropCycles();
}

function renderCropCycles() {
    const container = document.getElementById('cycles-container');
    const emptyEl = document.getElementById('empty-cycles');

    if (currentCycles.length === 0) {
        container.innerHTML = '';
        emptyEl.style.display = 'block';
        return;
    }

    emptyEl.style.display = 'none';
    const icons = { rice: '🌾', wheat: '🌾', maize: '🌽', cotton: '🧶', tomato: '🍅', potato: '🥔', onion: '🧅', sugarcane: '🎋' };

    container.innerHTML = currentCycles.map(cycle => `
        <div class="cycle-card glass-card ${cycle.health_status}">
            <div class="cycle-header">
                <div class="crop-info">
                    <span class="crop-icon">${icons[cycle.crop] || '🌱'}</span>
                    <div>
                        <h4>${capitalize(cycle.crop)}</h4>
                        <span class="cycle-id">${cycle.cycle_id}</span>
                    </div>
                </div>
                <span class="stage-badge">${formatStage(cycle.growth_stage)}</span>
            </div>
            <div class="progress-section">
                <div class="progress-bar"><div class="progress-fill" style="width: ${getProgress(cycle)}%"></div></div>
                <div class="progress-labels">
                    <span>Day ${cycle.days_since_sowing}</span>
                    <span>Harvest: ${cycle.expected_harvest}</span>
                </div>
            </div>
            <div class="health-status ${cycle.health_status}">
                <span>${getHealthIcon(cycle.health_status)}</span>
                <span>${formatHealth(cycle.health_status)}</span>
            </div>
            ${cycle.yield_prediction ? `
                <div class="yield-prediction">
                    <div class="yield-header">
                        <span>📈 Predicted Yield</span>
                        <span class="confidence">${(cycle.yield_prediction.confidence * 100).toFixed(0)}% conf</span>
                    </div>
                    <div class="yield-value">${cycle.yield_prediction.predicted_yield_kg_per_acre} kg/acre</div>
                </div>
            ` : ''}
            <div class="cycle-actions">
                <button class="btn-sm" onclick="openActivityModal('${cycle.cycle_id}')">📝 Log Activity</button>
                <button class="btn-sm danger" onclick="reportDisease('${cycle.cycle_id}')">🔬 Report Disease</button>
            </div>
        </div>
    `).join('');
}

function getProgress(cycle) {
    const durations = { rice: 120, wheat: 140, maize: 100, cotton: 180, tomato: 90, potato: 100, onion: 130, sugarcane: 360 };
    const total = durations[cycle.crop] || 120;
    return Math.min((cycle.days_since_sowing / total) * 100, 100);
}

function formatStage(stage) {
    return capitalize(stage?.replace('_', ' ') || 'Unknown');
}

function formatHealth(status) {
    const map = { healthy: 'Healthy', at_risk: 'At Risk', infected: 'Infected' };
    return map[status] || 'Unknown';
}

function getHealthIcon(status) {
    const map = { healthy: '✅', at_risk: '⚠️', infected: '🔴' };
    return map[status] || '❓';
}

function openActivityModal(cycleId) {
    currentActivityCycle = cycleId;
    document.getElementById('activity-modal').style.display = 'flex';
}

function closeActivityModal() {
    document.getElementById('activity-modal').style.display = 'none';
    currentActivityCycle = null;
}

async function submitActivity() {
    const data = {
        activity_type: document.getElementById('activity-type').value,
        description: document.getElementById('activity-description').value
    };

    // In real app, would POST to API
    alert(`Activity logged for cycle ${currentActivityCycle}: ${data.activity_type}`);
    closeActivityModal();
}

function reportDisease(cycleId) {
    showPage('disease');
}

// ============================================
// DISEASE DETECTION
// ============================================
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }

    selectedFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('preview-image').src = e.target.result;
        document.getElementById('preview-image').style.display = 'block';
        document.getElementById('upload-placeholder').style.display = 'none';
        document.getElementById('upload-area').classList.add('has-image');
        document.getElementById('analyze-btn').disabled = false;
    };
    reader.readAsDataURL(file);

    document.getElementById('disease-results').style.display = 'none';
}

function clearImage() {
    selectedFile = null;
    document.getElementById('preview-image').style.display = 'none';
    document.getElementById('upload-placeholder').style.display = 'flex';
    document.getElementById('upload-area').classList.remove('has-image');
    document.getElementById('analyze-btn').disabled = true;
    document.getElementById('file-input').value = '';
    document.getElementById('disease-results').style.display = 'none';
}

async function analyzeDisease() {
    if (!selectedFile) return;

    const btn = document.getElementById('analyze-btn');
    btn.innerHTML = '⏳ Analyzing...';
    btn.disabled = true;

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
        const response = await fetch(`${API_BASE}/disease/detect`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        displayDiseaseResults(data);
    } catch (error) {
        alert('Error analyzing image: ' + error.message);
    } finally {
        btn.innerHTML = '🔍 Analyze';
        btn.disabled = false;
    }
}

function displayDiseaseResults(data) {
    const resultsEl = document.getElementById('disease-results');

    if (data.is_healthy) {
        resultsEl.innerHTML = `
            <div class="disease-result healthy glass-card">
                <h3><span class="icon">✅</span> Plant is Healthy!</h3>
                <p>No disease detected. Your plant appears to be in good condition.</p>
                <p style="margin-top: 1rem; color: var(--primary);"><strong>Confidence: ${(data.top_3_predictions?.[0]?.confidence || 100).toFixed(1)}%</strong></p>
                ${data.top_3_predictions ? `
                    <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border);">
                        <h4>Top Predictions:</h4>
                        ${data.top_3_predictions.map(p => `
                            <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border);">
                                <span>${p.disease}</span>
                                <span style="color: var(--primary)">${p.confidence.toFixed(1)}%</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    } else {
        const disease = data.diseases?.[0] || {};
        resultsEl.innerHTML = `
            <div class="disease-result warning glass-card">
                <h3>
                    <span class="icon">⚠️</span> 
                    ${disease.disease_name || 'Disease Detected'}
                    <span class="severity-badge ${disease.severity || 'moderate'}">${disease.severity || 'Unknown'}</span>
                </h3>
                <p style="color: var(--text-secondary);">${disease.description || 'Disease detected in your plant.'}</p>
                <p style="margin-top: 0.5rem;"><strong>Plant:</strong> ${data.plant_type}</p>
                <p style="margin-top: 0.5rem; color: var(--primary);"><strong>Confidence: ${((disease.confidence || 0) * 100).toFixed(1)}%</strong></p>
                
                <div style="margin-top: 1.5rem; padding: 1rem; background: rgba(245, 158, 11, 0.1); border-radius: 8px;">
                    <h4>⚡ Immediate Action</h4>
                    <p style="color: var(--text-secondary);">${data.immediate_action}</p>
                </div>
                
                <div class="treatment-section">
                    <div class="treatment-block">
                        <h4>💊 Treatment</h4>
                        <ul>${(disease.treatment || ['Consult local expert']).map(t => `<li>${t}</li>`).join('')}</ul>
                    </div>
                    <div class="treatment-block">
                        <h4>🛡️ Prevention</h4>
                        <ul>${(disease.prevention || ['Monitor regularly']).map(p => `<li>${p}</li>`).join('')}</ul>
                    </div>
                </div>
            </div>
        `;
    }

    resultsEl.style.display = 'block';
    resultsEl.scrollIntoView({ behavior: 'smooth' });
}

// ============================================
// FERTILIZER ADVISOR
// ============================================
async function getFertilizerRecommendations() {
    const crop = document.getElementById('fert-crop').value;
    if (!crop) {
        alert('Please select a crop');
        return;
    }

    const soil = {
        nitrogen: parseFloat(document.getElementById('fert-nitrogen').value),
        phosphorus: parseFloat(document.getElementById('fert-phosphorus').value),
        potassium: parseFloat(document.getElementById('fert-potassium').value),
        ph: parseFloat(document.getElementById('fert-ph').value),
        organic_carbon: parseFloat(document.getElementById('fert-oc').value)
    };

    try {
        const response = await fetch(`${API_BASE}/fertilizer/recommend?crop=${crop}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(soil)
        });

        const data = await response.json();
        displayFertilizerResults(data);
    } catch (error) {
        alert('Error getting recommendations');
    }
}

function displayFertilizerResults(data) {
    const resultsEl = document.getElementById('fertilizer-results');

    resultsEl.innerHTML = `
        <div class="glass-card">
            <h3>🌱 Soil Status: ${data.crop}</h3>
            <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                ${Object.entries(data.soil_status).map(([key, value]) => `
                    <div style="padding: 0.75rem 1.5rem; background: rgba(${value === 'adequate' ? '34, 197, 94' : value === 'low' ? '245, 158, 11' : '239, 68, 68'}, 0.2); border-radius: 0.5rem;">
                        <span style="font-weight: 700;">${key.toUpperCase()}</span>: ${capitalize(value)}
                    </div>
                `).join('')}
            </div>
        </div>

        ${data.warnings?.length ? `
            <div class="glass-card" style="border-color: var(--warning);">
                ${data.warnings.map(w => `<div style="color: var(--warning); padding: 0.5rem 0;">⚠️ ${w}</div>`).join('')}
            </div>
        ` : ''}

        <h3 style="margin: 1.5rem 0 1rem;">🌾 Fertilizer Recommendations</h3>
        <div class="recommendations-grid">
            ${data.fertilizer_recommendations.map(rec => `
                <div class="glass-card ${rec.priority}">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                        <div>
                            <h4>${rec.name}</h4>
                            <span style="color: var(--text-muted);">${rec.name_hindi}</span>
                        </div>
                        <span class="badge">${capitalize(rec.priority)}</span>
                    </div>
                    <div style="font-size: 0.9rem; color: var(--text-secondary);">
                        <div>📦 Dosage: <strong>${rec.dosage_kg_per_acre} kg/acre</strong></div>
                        <div>🕐 When: ${rec.best_time}</div>
                        <div>💰 Cost: ${rec.cost_estimate}</div>
                    </div>
                    <p style="margin-top: 1rem; font-size: 0.85rem; color: var(--text-muted);">${rec.application_method}</p>
                </div>
            `).join('')}
        </div>

        <div class="glass-card" style="text-align: center;">
            <h4>💰 Total Estimated Cost: <span style="color: var(--primary);">${data.total_cost_estimate}</span></h4>
        </div>

        ${data.pesticide_recommendations?.length ? `
            <h3 style="margin: 1.5rem 0 1rem;">🐛 Pest & Disease Protection</h3>
            <div class="recommendations-grid">
                ${data.pesticide_recommendations.map(pest => `
                    <div class="glass-card">
                        <span style="background: rgba(239, 68, 68, 0.2); color: var(--danger); padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.75rem;">${pest.type}</span>
                        <h4 style="margin: 0.5rem 0;">${pest.name}</h4>
                        <p style="color: var(--text-secondary); font-size: 0.9rem;">For: ${pest.target}</p>
                        <div style="margin-top: 1rem; font-size: 0.85rem;">
                            <span>📊 ${pest.dosage}</span> | 
                            <span>🕐 ${pest.safety_interval_days} days safety</span>
                        </div>
                        ${pest.organic_alternative ? `<div style="margin-top: 0.5rem; color: var(--success); font-size: 0.85rem;">🌿 Organic: ${pest.organic_alternative}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        ` : ''}
    `;

    resultsEl.style.display = 'block';
    resultsEl.scrollIntoView({ behavior: 'smooth' });
}

// ============================================
// EXPENSE & PROFIT
// ============================================
async function estimateProfit() {
    const crop = document.getElementById('exp-crop').value;
    if (!crop) {
        alert('Please select a crop');
        return;
    }

    const data = {
        crop: crop,
        area_acres: parseFloat(document.getElementById('exp-area').value),
        season: document.getElementById('exp-season').value,
        seed_cost: parseFloat(document.getElementById('exp-seed').value) || 0,
        fertilizer_cost: parseFloat(document.getElementById('exp-fertilizer').value) || 0,
        pesticide_cost: parseFloat(document.getElementById('exp-pesticide').value) || 0,
        labor_cost: parseFloat(document.getElementById('exp-labor').value) || 0,
        irrigation_cost: parseFloat(document.getElementById('exp-irrigation').value) || 0,
        machinery_cost: parseFloat(document.getElementById('exp-machinery').value) || 0
    };

    try {
        const response = await fetch(`${API_BASE}/expense/estimate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        displayExpenseResults(result);
    } catch (error) {
        alert('Error calculating profit');
    }
}

function displayExpenseResults(data) {
    const resultsEl = document.getElementById('expense-results');
    const profitClass = data.expected_profit > 0 ? 'positive' : 'negative';

    resultsEl.innerHTML = `
        <div class="summary-grid">
            <div class="summary-card expense glass-card">
                <span class="icon">📉</span>
                <div class="content">
                    <span class="label">Total Expenses</span>
                    <span class="value">₹${formatNumber(data.total_expenses)}</span>
                    <span class="sub">₹${formatNumber(data.expense_per_acre)}/acre</span>
                </div>
            </div>
            <div class="summary-card yield glass-card">
                <span class="icon">🌾</span>
                <div class="content">
                    <span class="label">Predicted Yield</span>
                    <span class="value">${formatNumber(data.predicted_yield_kg)} kg</span>
                    <span class="sub">${(data.yield_confidence * 100).toFixed(0)}% confidence</span>
                </div>
            </div>
            <div class="summary-card revenue glass-card">
                <span class="icon">💵</span>
                <div class="content">
                    <span class="label">Expected Revenue</span>
                    <span class="value">₹${formatNumber(data.expected_revenue)}</span>
                    <span class="sub">@ ₹${data.expected_price_at_harvest}/kg</span>
                </div>
            </div>
            <div class="summary-card profit ${profitClass} glass-card">
                <span class="icon">${data.expected_profit > 0 ? '🎉' : '⚠️'}</span>
                <div class="content">
                    <span class="label">Net Profit</span>
                    <span class="value">₹${formatNumber(data.expected_profit)}</span>
                    <span class="sub">${data.profit_margin_percent}% margin</span>
                </div>
            </div>
        </div>

        <div class="glass-card">
            <h3>📈 Financial Metrics</h3>
            <div class="metrics-grid">
                <div class="metric"><span class="metric-label">ROI</span><span class="metric-value ${data.roi_percent > 0 ? 'positive' : 'negative'}">${data.roi_percent}%</span></div>
                <div class="metric"><span class="metric-label">Break-even Price</span><span class="metric-value">₹${data.break_even_price}/kg</span></div>
                <div class="metric"><span class="metric-label">Current Price</span><span class="metric-value">₹${data.current_market_price}/kg</span></div>
                <div class="metric"><span class="metric-label">Price Trend</span><span class="metric-value">${getTrendIcon(data.price_trend)} ${capitalize(data.price_trend)}</span></div>
            </div>
        </div>

        <div class="glass-card">
            <h3>📊 Expense Breakdown</h3>
            <div class="breakdown-chart">
                ${data.expense_breakdown.map(item => `
                    <div class="breakdown-item">
                        <div class="bar-container">
                            <div class="bar-label">${item.category}</div>
                            <div class="bar" style="width: ${item.percentage}%"><span class="bar-value">${item.percentage}%</span></div>
                        </div>
                        <span class="amount">₹${formatNumber(item.amount)}</span>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="glass-card risk-section ${data.risk_level}">
            <h3>⚠️ Risk Analysis</h3>
            <div class="risk-level">Risk Level: <span class="badge" style="background: rgba(${data.risk_level === 'low' ? '34, 197, 94' : data.risk_level === 'medium' ? '245, 158, 11' : '239, 68, 68'}, 0.2); color: var(--${data.risk_level === 'low' ? 'success' : data.risk_level === 'medium' ? 'warning' : 'danger'});">${data.risk_level.toUpperCase()}</span></div>
            <div class="risk-factors">${data.risk_factors.map(f => `<span class="factor">${f}</span>`).join('')}</div>
            <h4>💡 Recommendations</h4>
            <div class="recommendations">${data.recommendations.map(r => `<div class="rec">✓ ${r}</div>`).join('')}</div>
        </div>
    `;

    resultsEl.style.display = 'block';
    resultsEl.scrollIntoView({ behavior: 'smooth' });
}

function getTrendIcon(trend) {
    return trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➡️';
}

// ============================================
// MARKET PRICES
// ============================================
const MARKET_DATA = {
    // Cereals
    rice: { avg: 2200, min: 1800, max: 2600, trend: 'stable', advisory: 'Prices stable. Good time to sell if stored well.', bestTime: 'Next 2 weeks' },
    wheat: { avg: 2400, min: 2000, max: 2800, trend: 'up', advisory: 'Prices rising due to export demand. Consider holding.', bestTime: 'After 1 month' },
    maize: { avg: 2000, min: 1400, max: 2400, trend: 'stable', advisory: 'Stable market. Sell based on your storage capacity.', bestTime: 'Now' },
    bajra: { avg: 2100, min: 1700, max: 2500, trend: 'up', advisory: 'Good demand in Gujarat & Rajasthan. Prices may rise further.', bestTime: 'Next 2 weeks' },
    jowar: { avg: 2300, min: 1900, max: 2700, trend: 'stable', advisory: 'Steady demand. Fair prices currently.', bestTime: 'Now' },
    // Cash Crops
    cotton: { avg: 6500, min: 5500, max: 7500, trend: 'up', advisory: 'Good demand from textile mills. Favorable conditions.', bestTime: 'Next 3 weeks' },
    sugarcane: { avg: 3500, min: 3000, max: 4000, trend: 'stable', advisory: 'FRP announced. Sell to nearest sugar mill.', bestTime: 'During crushing season' },
    soybean: { avg: 4500, min: 3800, max: 5200, trend: 'up', advisory: 'Export demand high. Hold for better prices.', bestTime: 'After 2 weeks' },
    groundnut: { avg: 5800, min: 5000, max: 6500, trend: 'up', advisory: 'Oil mills buying actively. Good time to sell.', bestTime: 'This week' },
    mustard: { avg: 5200, min: 4500, max: 5900, trend: 'stable', advisory: 'MSP support available. Check local mandi rates.', bestTime: 'Now' },
    // Pulses
    chana: { avg: 5500, min: 4800, max: 6200, trend: 'up', advisory: 'Government procurement active. Register at e-NAM.', bestTime: 'Next month' },
    moong: { avg: 7500, min: 6500, max: 8500, trend: 'up', advisory: 'High demand for exports. Premium quality fetching more.', bestTime: 'Now' },
    urad: { avg: 6800, min: 5800, max: 7800, trend: 'stable', advisory: 'Steady market. Grade your produce for better rates.', bestTime: 'Next 2 weeks' },
    tur: { avg: 7000, min: 6000, max: 8000, trend: 'up', advisory: 'MSP operations ongoing. Register at procurement centers.', bestTime: 'This month' },
    // Vegetables
    tomato: { avg: 2500, min: 1000, max: 4000, trend: 'volatile', advisory: 'Highly volatile. Sell quickly to avoid losses.', bestTime: 'Immediately' },
    potato: { avg: 1200, min: 800, max: 1800, trend: 'down', advisory: 'Prices falling due to oversupply. Consider cold storage.', bestTime: 'After 2 months' },
    onion: { avg: 2000, min: 1200, max: 3000, trend: 'up', advisory: 'Prices recovering. Good time to sell excess stock.', bestTime: 'This week' },
    cauliflower: { avg: 1500, min: 800, max: 2500, trend: 'down', advisory: 'Peak season oversupply. Sell at earliest.', bestTime: 'Immediately' },
    cabbage: { avg: 1200, min: 600, max: 2000, trend: 'stable', advisory: 'Moderate demand. Check local rates before selling.', bestTime: 'This week' },
    // Fruits
    banana: { avg: 2000, min: 1200, max: 2800, trend: 'stable', advisory: 'Consistent demand. Grade properly for best rates.', bestTime: 'Weekly harvest' },
    mango: { avg: 4500, min: 2500, max: 8000, trend: 'up', advisory: 'Export quality mangoes in high demand.', bestTime: 'Peak season' },
    apple: { avg: 8000, min: 5000, max: 12000, trend: 'up', advisory: 'Kashmir/Himachal apples premium. Cold storage recommended.', bestTime: 'October-December' },
    // Spices
    turmeric: { avg: 8500, min: 7000, max: 10000, trend: 'up', advisory: 'Strong demand. Hold good quality stock.', bestTime: 'After 1 month' },
    chilli: { avg: 12000, min: 9000, max: 15000, trend: 'up', advisory: 'Guntur chilli rates rising. Quality matters.', bestTime: 'Now' }
};

const MANDI_PRICES = [
    // North India
    { name: 'Azadpur', state: 'Delhi', minPrice: 1900, maxPrice: 2400, modalPrice: 2200, change: 2.5 },
    { name: 'Ghazipur', state: 'Uttar Pradesh', minPrice: 1750, maxPrice: 2250, modalPrice: 2000, change: 1.5 },
    { name: 'Lucknow', state: 'Uttar Pradesh', minPrice: 1700, maxPrice: 2200, modalPrice: 1950, change: 0.9 },
    { name: 'Kanpur', state: 'Uttar Pradesh', minPrice: 1680, maxPrice: 2150, modalPrice: 1900, change: -0.5 },
    { name: 'Ludhiana', state: 'Punjab', minPrice: 2000, maxPrice: 2500, modalPrice: 2250, change: 1.8 },
    { name: 'Amritsar', state: 'Punjab', minPrice: 1950, maxPrice: 2450, modalPrice: 2200, change: 2.1 },
    { name: 'Jaipur', state: 'Rajasthan', minPrice: 1800, maxPrice: 2300, modalPrice: 2050, change: 1.2 },
    { name: 'Jodhpur', state: 'Rajasthan', minPrice: 1750, maxPrice: 2200, modalPrice: 1980, change: 0.6 },
    // West India
    { name: 'Vashi', state: 'Maharashtra', minPrice: 1850, maxPrice: 2350, modalPrice: 2100, change: -1.2 },
    { name: 'Pune', state: 'Maharashtra', minPrice: 1900, maxPrice: 2400, modalPrice: 2150, change: 1.5 },
    { name: 'Nashik', state: 'Maharashtra', minPrice: 1800, maxPrice: 2300, modalPrice: 2050, change: 2.0 },
    { name: 'Nagpur', state: 'Maharashtra', minPrice: 1750, maxPrice: 2250, modalPrice: 2000, change: 0.8 },
    { name: 'Ahmedabad', state: 'Gujarat', minPrice: 1850, maxPrice: 2350, modalPrice: 2100, change: 1.3 },
    { name: 'Rajkot', state: 'Gujarat', minPrice: 1800, maxPrice: 2300, modalPrice: 2050, change: 0.7 },
    // South India
    { name: 'Koyambedu', state: 'Tamil Nadu', minPrice: 1800, maxPrice: 2300, modalPrice: 2050, change: 0.8 },
    { name: 'Coimbatore', state: 'Tamil Nadu', minPrice: 1750, maxPrice: 2250, modalPrice: 2000, change: 1.1 },
    { name: 'Yeshwanthpur', state: 'Karnataka', minPrice: 1900, maxPrice: 2500, modalPrice: 2200, change: 3.2 },
    { name: 'Hubli', state: 'Karnataka', minPrice: 1850, maxPrice: 2400, modalPrice: 2120, change: 2.5 },
    { name: 'Hyderabad (Bowenpally)', state: 'Telangana', minPrice: 1820, maxPrice: 2320, modalPrice: 2070, change: 1.9 },
    { name: 'Vijayawada', state: 'Andhra Pradesh', minPrice: 1780, maxPrice: 2280, modalPrice: 2030, change: 1.4 },
    { name: 'Kochi', state: 'Kerala', minPrice: 2000, maxPrice: 2600, modalPrice: 2300, change: 2.8 },
    // East India
    { name: 'Kolkata (Burrabazar)', state: 'West Bengal', minPrice: 1850, maxPrice: 2350, modalPrice: 2100, change: 1.6 },
    { name: 'Patna', state: 'Bihar', minPrice: 1700, maxPrice: 2200, modalPrice: 1950, change: 0.4 },
    { name: 'Guwahati', state: 'Assam', minPrice: 1900, maxPrice: 2450, modalPrice: 2180, change: 2.2 },
    { name: 'Bhubaneswar', state: 'Odisha', minPrice: 1750, maxPrice: 2250, modalPrice: 2000, change: 1.0 },
    { name: 'Ranchi', state: 'Jharkhand', minPrice: 1720, maxPrice: 2220, modalPrice: 1970, change: 0.5 },
    // Central India
    { name: 'Indore', state: 'Madhya Pradesh', minPrice: 1850, maxPrice: 2400, modalPrice: 2125, change: 1.7 },
    { name: 'Bhopal', state: 'Madhya Pradesh', minPrice: 1800, maxPrice: 2350, modalPrice: 2080, change: 1.3 },
    { name: 'Raipur', state: 'Chhattisgarh', minPrice: 1750, maxPrice: 2250, modalPrice: 2000, change: 0.9 }
];

function selectCommodity(commodity) {
    selectedCommodity = commodity;
    document.querySelectorAll('.quick-filters .filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toLowerCase().includes(commodity));
    });
    loadMarketPrices();
}

function filterMarket(event) {
    if (event.key === 'Enter') {
        const query = event.target.value.toLowerCase();
        if (MARKET_DATA[query]) {
            selectCommodity(query);
        }
    }
}

function loadMarketPrices() {
    const data = MARKET_DATA[selectedCommodity];
    const icons = {
        rice: '🌾', wheat: '🌾', maize: '🌽', bajra: '🌾', jowar: '🌾',
        cotton: '🧶', sugarcane: '🎋', soybean: '🫘', groundnut: '🥜', mustard: '🌻',
        chana: '🫘', moong: '🫛', urad: '🫘', tur: '🫘',
        tomato: '🍅', potato: '🥔', onion: '🧅', cauliflower: '🥦', cabbage: '🥬', banana: '🍌', mango: '🥭', apple: '🍎',
        turmeric: '🟡', chilli: '🌶️'
    };

    document.getElementById('market-results').innerHTML = `
        <div class="price-overview">
            <div class="overview-header glass-card">
                <div class="commodity-info">
                    <span class="commodity-icon">${icons[selectedCommodity] || '🌾'}</span>
                    <div>
                        <h2>${capitalize(selectedCommodity)}</h2>
                        <span class="trend-badge ${data.trend}">${getTrendIcon(data.trend)} ${capitalize(data.trend)}</span>
                    </div>
                </div>
                <div class="national-avg">
                    <span class="label">National Average</span>
                    <span class="price">₹${data.avg}</span>
                    <span class="unit">per quintal</span>
                </div>
            </div>

            <div class="advisory-card glass-card ${data.trend}">
                <div class="advisory-icon">💡</div>
                <div class="advisory-content">
                    <h4>Market Advisory</h4>
                    <p>${data.advisory}</p>
                    <span class="best-time">Best time to sell: <strong>${data.bestTime}</strong></span>
                </div>
            </div>

            <div class="glass-card">
                <h3>📍 Mandi-wise Prices</h3>
                <table class="mandi-table">
                    <thead>
                        <tr><th>Mandi</th><th>State</th><th>Min Price</th><th>Max Price</th><th>Modal Price</th><th>Change</th></tr>
                    </thead>
                    <tbody>
                        ${MANDI_PRICES.map(m => `
                            <tr>
                                <td>${m.name}</td>
                                <td>${m.state}</td>
                                <td>₹${m.minPrice}</td>
                                <td>₹${m.maxPrice}</td>
                                <td class="modal-price">₹${m.modalPrice}</td>
                                <td class="${m.change > 0 ? 'positive' : m.change < 0 ? 'negative' : ''}">${m.change > 0 ? '+' : ''}${m.change.toFixed(1)}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="glass-card">
                <h3>📊 Price Range</h3>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; text-align: center; margin-top: 1rem;">
                    <div style="padding: 1rem; background: rgba(239, 68, 68, 0.1); border-radius: 0.5rem;">
                        <div style="font-size: 0.85rem; color: var(--text-muted);">Min Price</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--danger);">₹${data.min}</div>
                    </div>
                    <div style="padding: 1rem; background: rgba(16, 185, 129, 0.1); border-radius: 0.5rem;">
                        <div style="font-size: 0.85rem; color: var(--text-muted);">Average</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">₹${data.avg}</div>
                    </div>
                    <div style="padding: 1rem; background: rgba(245, 158, 11, 0.1); border-radius: 0.5rem;">
                        <div style="font-size: 0.85rem; color: var(--text-muted);">Max Price</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--warning);">₹${data.max}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// SCHEMES
// ============================================
const SCHEMES = [
    {
        id: 'pmfby', name: 'PM Fasal Bima Yojana', nameHindi: 'प्रधानमंत्री फसल बीमा योजना',
        ministry: 'Agriculture', category: 'Insurance',
        description: 'Crop insurance scheme to provide financial support to farmers in case of crop failure due to natural calamities, pests, and diseases.',
        benefits: ['Premium: 2% Kharif, 1.5% Rabi, 5% Commercial', 'Coverage for all food & oilseed crops', 'Claims settled within 2 months', 'Smartphone-based crop cutting'],
        eligibility: ['All farmers (landowners/tenants/sharecroppers)', 'Crop loan borrowers (compulsory till 2020, now voluntary)', 'Non-loanee farmers voluntary'],
        documents: ['Aadhaar Card', 'Land Records (Khatauni/ROR)', 'Bank Account Details', 'Sowing Certificate from Patwari'],
        applyLink: 'https://pmfby.gov.in', helpline: '1800-180-1551'
    },
    {
        id: 'pmkisan', name: 'PM-KISAN Samman Nidhi', nameHindi: 'पीएम-किसान सम्मान निधि',
        ministry: 'Agriculture', category: 'Subsidy',
        description: 'Direct income support of ₹6,000 per year to all landholding farmer families to supplement their financial needs.',
        benefits: ['₹6,000 per year in 3 installments of ₹2,000', 'Direct Bank Transfer (DBT)', '100% Central Government funded', 'No middlemen involvement'],
        eligibility: ['All landholding farmer families', 'Subject to exclusion criteria (IT payees, govt employees excluded)', 'Valid Aadhaar linked bank account'],
        documents: ['Aadhaar Card', 'Land ownership documents', 'Bank Passbook with IFSC'],
        applyLink: 'https://pmkisan.gov.in', helpline: '155261 / 011-24300606'
    },
    {
        id: 'kcc', name: 'Kisan Credit Card (KCC)', nameHindi: 'किसान क्रेडिट कार्ड',
        ministry: 'Finance', category: 'Credit',
        description: 'Provides farmers with affordable credit for agricultural needs, including crop production, post-harvest expenses, and allied activities.',
        benefits: ['Credit limit up to ₹3 lakh at 4% interest', '2% interest subvention + 3% prompt repayment bonus', 'Covers crop production, allied activities, consumption', 'Personal accident insurance up to ₹50,000'],
        eligibility: ['Owner cultivators', 'Tenant farmers & sharecroppers', 'SHGs & JLGs of farmers', 'Fisheries & animal husbandry farmers'],
        documents: ['Identity Proof (Aadhaar/Voter ID)', 'Address Proof', 'Land Documents/Tenancy Agreement', '2 Passport Photos'],
        applyLink: 'https://pmkisan.gov.in/KCC.aspx', helpline: '1800-180-1551'
    },
    {
        id: 'pmksy', name: 'PM Krishi Sinchayee Yojana', nameHindi: 'प्रधानमंत्री कृषि सिंचाई योजना',
        ministry: 'Agriculture', category: 'Irrigation',
        description: 'Har Khet Ko Paani - Ensuring water availability to every farm through micro irrigation and water management.',
        benefits: ['55% subsidy for small/marginal farmers', '45% subsidy for other farmers', 'Drip & sprinkler system support', 'Per Drop More Crop component'],
        eligibility: ['All categories of farmers', 'Priority to drought-prone areas', 'Farmers with assured water source'],
        documents: ['Land Records', 'Aadhaar Card', 'Bank Account', 'Water source proof', 'Quotation from authorized dealer'],
        applyLink: 'https://pmksy.gov.in', helpline: '1800-180-1551'
    },
    {
        id: 'soil', name: 'Soil Health Card Scheme', nameHindi: 'मृदा स्वास्थ्य कार्ड योजना',
        ministry: 'Agriculture', category: 'Subsidy',
        description: 'Provides soil health cards to farmers with crop-wise nutrient recommendations to improve productivity and reduce fertilizer costs.',
        benefits: ['Free soil testing every 2 years', '12 parameters tested (N, P, K, S, Zn, Fe, Cu, Mn, Bo, pH, EC, OC)', 'Crop-wise fertilizer recommendations', 'Reduces input costs by 8-10%'],
        eligibility: ['All farmers across India', 'Any size of land holding', 'No income criteria'],
        documents: ['Aadhaar Card', 'Land Details', 'Mobile Number'],
        applyLink: 'https://soilhealth.dac.gov.in', helpline: '1800-180-1551'
    },
    {
        id: 'enam', name: 'e-NAM (National Agriculture Market)', nameHindi: 'राष्ट्रीय कृषि बाज़ार',
        ministry: 'Agriculture', category: 'Market',
        description: 'Pan-India electronic trading portal linking APMCs across states to create unified national market for agricultural commodities.',
        benefits: ['Better price discovery', 'Transparent auction process', 'Online payment within 24-48 hours', 'Reduced intermediaries', 'Access to more buyers'],
        eligibility: ['All farmers with produce to sell', 'Traders & commission agents', 'FPOs & cooperatives'],
        documents: ['Aadhaar Card', 'Bank Account', 'Mobile Number', 'Mandi registration (if trader)'],
        applyLink: 'https://enam.gov.in', helpline: '1800-270-0224'
    },
    {
        id: 'pkvy', name: 'Paramparagat Krishi Vikas Yojana', nameHindi: 'परम्परागत कृषि विकास योजना',
        ministry: 'Agriculture', category: 'Organic',
        description: 'Promotes organic farming through cluster approach with PGS (Participatory Guarantee System) certification.',
        benefits: ['₹50,000 per hectare over 3 years', 'Covers inputs, certification, marketing', 'Premium prices for organic produce', 'Training & capacity building'],
        eligibility: ['Groups of 50+ farmers in cluster', 'Minimum 20 hectares contiguous land', 'Commitment to organic practices'],
        documents: ['Group registration', 'Land Records', 'Aadhaar of all members', 'Bank Account'],
        applyLink: 'https://pgsindia-ncof.gov.in', helpline: '1800-180-1551'
    },
    {
        id: 'pmkmy', name: 'PM Kisan Maandhan Yojana', nameHindi: 'पीएम किसान मानधन योजना',
        ministry: 'Agriculture', category: 'Pension',
        description: 'Voluntary pension scheme for small and marginal farmers providing ₹3,000 monthly pension after age 60.',
        benefits: ['₹3,000 monthly pension after 60', 'Govt contributes equal amount', 'Family pension to spouse', 'Nominal contribution ₹55-200/month'],
        eligibility: ['Small & marginal farmers (land up to 2 hectares)', 'Age 18-40 years', 'Not covered under other pension schemes'],
        documents: ['Aadhaar Card', 'Land Records', 'Bank Account', 'Age Proof'],
        applyLink: 'https://maandhan.in', helpline: '1800-267-6888'
    },
    {
        id: 'aif', name: 'Agriculture Infrastructure Fund', nameHindi: 'कृषि अवसंरचना कोष',
        ministry: 'Agriculture', category: 'Credit',
        description: '₹1 lakh crore financing facility for post-harvest management & community farming assets.',
        benefits: ['3% interest subvention on loans up to ₹2 crore', 'Credit guarantee coverage', '15-year repayment with 2-year moratorium', 'Covers warehouses, cold storage, processing units'],
        eligibility: ['Farmers', 'FPOs, PACS, Cooperatives', 'Agri-entrepreneurs', 'Startups & joint ventures'],
        documents: ['Project Report', 'Land Documents', 'Bank Account', 'GST Registration (if applicable)'],
        applyLink: 'https://agriinfra.dac.gov.in', helpline: '1800-180-1551'
    },
    {
        id: 'pmfme', name: 'PM Formalisation of Micro Food Enterprises', nameHindi: 'पीएम सूक्ष्म खाद्य उद्योग उन्नयन योजना',
        ministry: 'Food Processing', category: 'Subsidy',
        description: 'Support for upgradation of existing micro food processing enterprises with One District One Product approach.',
        benefits: ['35% credit-linked subsidy (max ₹10 lakh)', 'Seed capital for SHGs (₹40,000/member)', 'Free training & handholding', 'Marketing & branding support'],
        eligibility: ['Existing micro food processing units', 'SHGs, FPOs, Cooperatives', 'Individual entrepreneurs'],
        documents: ['Udyam Registration', 'Project Report', 'Bank Account', 'Land/Rent Agreement'],
        applyLink: 'https://pmfme.mofpi.gov.in', helpline: '1800-111-175'
    },
    {
        id: 'smam', name: 'Sub-Mission on Agricultural Mechanization', nameHindi: 'कृषि यंत्रीकरण उप-मिशन',
        ministry: 'Agriculture', category: 'Subsidy',
        description: 'Promoting farm mechanization through subsidized farm machinery and custom hiring centres.',
        benefits: ['40-50% subsidy on farm machinery', '80% subsidy for CHCs (Custom Hiring Centres)', 'Covers tractors, harvesters, implements', 'Training on machinery operation'],
        eligibility: ['Individual farmers', 'FPOs, Cooperatives, SHGs', 'Entrepreneurs for CHC', 'Priority to SC/ST & small farmers'],
        documents: ['Aadhaar Card', 'Land Records', 'Bank Account', 'Caste Certificate (if SC/ST)'],
        applyLink: 'https://agrimachinery.nic.in', helpline: '1800-180-1551'
    },
    {
        id: 'rkvy', name: 'Rashtriya Krishi Vikas Yojana', nameHindi: 'राष्ट्रीय कृषि विकास योजना',
        ministry: 'Agriculture', category: 'Subsidy',
        description: 'Incentivizes states to increase investment in agriculture and allied sectors for overall growth.',
        benefits: ['Flexible funding for state priorities', 'Covers crops, horticulture, livestock', 'Infrastructure development', 'Agri-business promotion'],
        eligibility: ['Through state agriculture departments', 'Farmers benefit indirectly', 'Project-based implementation'],
        documents: ['Apply through state schemes', 'Requirements vary by project'],
        applyLink: 'https://rkvy.nic.in', helpline: '011-23382651'
    },
    {
        id: 'nfsm', name: 'National Food Security Mission', nameHindi: 'राष्ट्रीय खाद्य सुरक्षा मिशन',
        ministry: 'Agriculture', category: 'Subsidy',
        description: 'Increasing production of rice, wheat, pulses, coarse cereals & commercial crops through area expansion and productivity enhancement.',
        benefits: ['Subsidized certified seeds (50%)', 'INM/IPM demonstrations', 'Farm machinery assistance', 'Cluster demonstrations'],
        eligibility: ['Farmers in identified districts', 'Focus on pulses & oilseeds', 'SC/ST farmers priority'],
        documents: ['Aadhaar Card', 'Land Records', 'Bank Account'],
        applyLink: 'https://nfsm.gov.in', helpline: '1800-180-1551'
    },
    {
        id: 'midh', name: 'Mission for Integrated Development of Horticulture', nameHindi: 'एकीकृत बागवानी विकास मिशन',
        ministry: 'Agriculture', category: 'Horticulture',
        description: 'Holistic development of horticulture sector including fruits, vegetables, flowers, spices, and plantation crops.',
        benefits: ['Subsidy for orchard establishment (40-75%)', 'Protected cultivation support', 'Post-harvest infrastructure', 'INM/IPM support'],
        eligibility: ['All farmers', 'Priority to NE & Himalayan states', 'FPOs & cooperatives'],
        documents: ['Land Records', 'Aadhaar Card', 'Bank Account', 'Project Proposal'],
        applyLink: 'https://midh.gov.in', helpline: '1800-180-1551'
    },
    {
        id: 'acabc', name: 'Agri-Clinics & Agri-Business Centres', nameHindi: 'कृषि क्लिनिक एवं कृषि व्यवसाय केंद्र',
        ministry: 'Agriculture', category: 'Credit',
        description: 'Supports agriculture graduates to set up agri-ventures providing extension services to farmers.',
        benefits: ['Free 2-month training (MANAGE)', '44% subsidy on project cost', 'Loans up to ₹20 lakh individuals, ₹1 crore groups', 'Handholding support for 5 years'],
        eligibility: ['Agriculture graduates/diploma holders', 'Age: no limit', 'Biological science graduates with relevant experience'],
        documents: ['Degree/Diploma Certificate', 'Project Report', 'Bank Account', 'Aadhaar Card'],
        applyLink: 'https://acabcmis.gov.in', helpline: '1800-425-1556'
    },
    {
        id: 'nmsa', name: 'National Mission for Sustainable Agriculture', nameHindi: 'राष्ट्रीय सतत कृषि मिशन',
        ministry: 'Agriculture', category: 'Climate',
        description: 'Promotes sustainable agriculture through climate change adaptation, water use efficiency, and soil health management.',
        benefits: ['Rainfed area development', 'On-farm water management', 'Soil health management', 'Climate resilient practices'],
        eligibility: ['Farmers in rainfed areas', 'Priority to resource-poor farmers', 'Focus on 100 most vulnerable districts'],
        documents: ['Aadhaar Card', 'Land Records', 'Bank Account'],
        applyLink: 'https://nmsa.dac.gov.in', helpline: '1800-180-1551'
    },
    {
        id: 'deds', name: 'Dairy Entrepreneurship Development Scheme', nameHindi: 'डेयरी उद्यमिता विकास योजना',
        ministry: 'Animal Husbandry', category: 'Dairy',
        description: 'Promotes modern dairy farms and infrastructure for milk production, processing and marketing.',
        benefits: ['25% subsidy (33% for SC/ST)', 'Covers dairy units, milk processing, cold chain', 'Back-ended subsidy through banks', 'NABARD refinance available'],
        eligibility: ['Farmers, entrepreneurs, SHGs', 'Dairy cooperatives', 'Companies & NGOs'],
        documents: ['Project Report', 'Land Documents', 'Bank Account', 'Caste Certificate (if applicable)'],
        applyLink: 'https://dahd.nic.in', helpline: '1800-180-1551'
    },
    {
        id: 'gobar', name: 'GOBAR-Dhan (Galvanizing Organic Bio-Agro Resources)', nameHindi: 'गोबर-धन योजना',
        ministry: 'Jal Shakti', category: 'Organic',
        description: 'Converting cattle dung and solid waste into compost, biogas, and bio-CNG for additional income and clean energy.',
        benefits: ['Support for biogas plants', 'Organic fertilizer production', 'Additional farmer income', 'Clean cooking fuel'],
        eligibility: ['Individual households', 'Dairy cooperatives', 'Village clusters', 'Entrepreneurs'],
        documents: ['Aadhaar Card', 'Land/Space availability proof', 'Bank Account'],
        applyLink: 'https://sbm.gov.in/gbdw20', helpline: '1800-180-1551'
    }
];

function loadSchemes() {
    renderSchemes(SCHEMES);
}

function filterSchemes() {
    const query = document.getElementById('scheme-search').value.toLowerCase();
    const filtered = SCHEMES.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.nameHindi.includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.ministry.toLowerCase().includes(query) ||
        s.benefits.some(b => b.toLowerCase().includes(query))
    );
    renderSchemes(filtered);

    // Update scheme count
    const countEl = document.getElementById('scheme-count');
    if (countEl) countEl.textContent = filtered.length;
}

function filterSchemeCategory(category) {
    selectedSchemeCategory = category;
    document.querySelectorAll('#schemes .filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.includes(category));
    });

    const filtered = category === 'All' ? SCHEMES : SCHEMES.filter(s => s.category === category);
    renderSchemes(filtered);

    // Update scheme count
    const countEl = document.getElementById('scheme-count');
    if (countEl) countEl.textContent = filtered.length;
}

function renderSchemes(schemes) {
    const categoryIcons = {
        'Insurance': '🛡️', 'Subsidy': '💰', 'Credit': '🏦', 'Irrigation': '💧',
        'Market': '🏪', 'Organic': '🌿', 'Pension': '👴', 'Horticulture': '🍎',
        'Dairy': '🥛', 'Climate': '🌍'
    };

    const categoryColors = {
        'Insurance': '#3b82f6', 'Subsidy': '#10b981', 'Credit': '#f59e0b', 'Irrigation': '#06b6d4',
        'Market': '#8b5cf6', 'Organic': '#22c55e', 'Pension': '#ec4899', 'Horticulture': '#f97316',
        'Dairy': '#6366f1', 'Climate': '#14b8a6'
    };

    document.getElementById('schemes-grid').innerHTML = schemes.map(scheme => `
        <div class="scheme-card glass-card" onclick="toggleSchemeDetails('${scheme.id}')">
            <div class="scheme-category-badge" style="position: absolute; top: 0.75rem; right: 0.75rem; background: ${categoryColors[scheme.category] || 'var(--primary)'}22; padding: 0.35rem 0.85rem; border-radius: 1rem; font-size: 0.75rem; color: ${categoryColors[scheme.category] || 'var(--primary)'}; font-weight: 600; border: 1px solid ${categoryColors[scheme.category] || 'var(--primary)'}44;">
                ${categoryIcons[scheme.category] || '📋'} ${scheme.category}
            </div>
            <div class="scheme-header">
                <div class="scheme-titles">
                    <h3>${scheme.name}</h3>
                    <span class="scheme-hindi">${scheme.nameHindi}</span>
                </div>
            </div>
            <p class="scheme-desc">${scheme.description}</p>
            <div class="scheme-benefits">
                <h4>✨ Key Benefits</h4>
                <ul>${scheme.benefits.slice(0, 3).map(b => `<li>${b}</li>`).join('')}</ul>
            </div>
            <div class="scheme-footer">
                <span class="helpline">📞 ${scheme.helpline}</span>
                <a href="${scheme.applyLink}" target="_blank" class="apply-link" onclick="event.stopPropagation()">Apply Now →</a>
            </div>
        </div>
    `).join('');
}

function toggleSchemeDetails(schemeId) {
    // Could expand to show more details
}

// ============================================
// ELIGIBILITY CHECK SYSTEM
// ============================================
const eligibilityQuestions = [
    {
        id: 'land_size',
        question: 'What is your total agricultural land holding?',
        type: 'select',
        options: [
            { value: 'marginal', label: 'Less than 1 hectare (Marginal)' },
            { value: 'small', label: '1-2 hectares (Small)' },
            { value: 'medium', label: '2-4 hectares (Medium)' },
            { value: 'large', label: 'More than 4 hectares (Large)' }
        ]
    },
    {
        id: 'farmer_type',
        question: 'What is your farming status?',
        type: 'options',
        options: [
            { value: 'owner', label: '🏠 Owner Cultivator' },
            { value: 'tenant', label: '📝 Tenant Farmer' },
            { value: 'sharecropper', label: '🤝 Sharecropper' },
            { value: 'landless', label: '👤 Landless Laborer' }
        ]
    },
    {
        id: 'age',
        question: 'What is your age group?',
        type: 'options',
        options: [
            { value: '18-30', label: '18-30 years' },
            { value: '30-40', label: '30-40 years' },
            { value: '40-60', label: '40-60 years' },
            { value: '60+', label: 'Above 60 years' }
        ]
    },
    {
        id: 'interests',
        question: 'What are you looking for? (Select all that apply)',
        type: 'multi',
        options: [
            { value: 'credit', label: '💳 Credit/Loan' },
            { value: 'insurance', label: '🛡️ Crop Insurance' },
            { value: 'subsidy', label: '💰 Subsidies' },
            { value: 'pension', label: '👴 Pension' },
            { value: 'irrigation', label: '💧 Irrigation' },
            { value: 'organic', label: '🌿 Organic Farming' }
        ]
    },
    {
        id: 'category',
        question: 'Do you belong to any special category?',
        type: 'options',
        options: [
            { value: 'general', label: 'General' },
            { value: 'sc', label: 'SC (Scheduled Caste)' },
            { value: 'st', label: 'ST (Scheduled Tribe)' },
            { value: 'obc', label: 'OBC' },
            { value: 'woman', label: 'Woman Farmer' }
        ]
    }
];

let eligibilityStep = 0;
let eligibilityAnswers = {};

function startEligibilityCheck() {
    eligibilityStep = 0;
    eligibilityAnswers = {};
    document.getElementById('eligibility-modal').classList.add('active');
    renderEligibilityQuestion();
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeEligibilityModal() {
    document.getElementById('eligibility-modal').classList.remove('active');
}

function renderEligibilityQuestion() {
    const progressHtml = eligibilityQuestions.map((_, i) =>
        `<div class="progress-dot ${i < eligibilityStep ? 'completed' : ''} ${i === eligibilityStep ? 'active' : ''}"></div>`
    ).join('');
    document.getElementById('eligibility-progress').innerHTML = progressHtml;

    const q = eligibilityQuestions[eligibilityStep];
    let html = `<div class="eligibility-question">
        <label>${q.question}</label>`;

    if (q.type === 'select') {
        html += `<select class="input" id="elig-${q.id}" onchange="saveEligibilityAnswer('${q.id}', this.value)">
            <option value="">Select an option...</option>
            ${q.options.map(o => `<option value="${o.value}" ${eligibilityAnswers[q.id] === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
        </select>`;
    } else if (q.type === 'options') {
        html += `<div class="eligibility-options">
            ${q.options.map(o => `
                <div class="eligibility-option ${eligibilityAnswers[q.id] === o.value ? 'selected' : ''}" 
                     onclick="selectEligibilityOption('${q.id}', '${o.value}', this)">
                    ${o.label}
                </div>
            `).join('')}
        </div>`;
    } else if (q.type === 'multi') {
        const selected = eligibilityAnswers[q.id] || [];
        html += `<div class="eligibility-options">
            ${q.options.map(o => `
                <div class="eligibility-option ${selected.includes(o.value) ? 'selected' : ''}" 
                     onclick="toggleEligibilityOption('${q.id}', '${o.value}', this)">
                    ${o.label}
                </div>
            `).join('')}
        </div>`;
    }

    html += '</div>';
    document.getElementById('eligibility-questions').innerHTML = html;

    // Update buttons
    document.getElementById('eligibility-prev').style.display = eligibilityStep > 0 ? 'block' : 'none';
    document.getElementById('eligibility-next').textContent = eligibilityStep === eligibilityQuestions.length - 1 ? 'Check Eligibility ✓' : 'Next →';
}

function selectEligibilityOption(questionId, value, el) {
    document.querySelectorAll(`#eligibility-questions .eligibility-option`).forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    eligibilityAnswers[questionId] = value;
}

function toggleEligibilityOption(questionId, value, el) {
    if (!eligibilityAnswers[questionId]) eligibilityAnswers[questionId] = [];
    const idx = eligibilityAnswers[questionId].indexOf(value);
    if (idx === -1) {
        eligibilityAnswers[questionId].push(value);
        el.classList.add('selected');
    } else {
        eligibilityAnswers[questionId].splice(idx, 1);
        el.classList.remove('selected');
    }
}

function saveEligibilityAnswer(questionId, value) {
    eligibilityAnswers[questionId] = value;
}

function prevEligibilityStep() {
    if (eligibilityStep > 0) {
        eligibilityStep--;
        renderEligibilityQuestion();
    }
}

function nextEligibilityStep() {
    const q = eligibilityQuestions[eligibilityStep];
    if (!eligibilityAnswers[q.id] || (Array.isArray(eligibilityAnswers[q.id]) && eligibilityAnswers[q.id].length === 0)) {
        alert('Please select an option to continue');
        return;
    }

    if (eligibilityStep < eligibilityQuestions.length - 1) {
        eligibilityStep++;
        renderEligibilityQuestion();
    } else {
        showEligibilityResults();
    }
}

function showEligibilityResults() {
    const answers = eligibilityAnswers;
    const results = [];

    SCHEMES.forEach(scheme => {
        let eligible = true;
        let reasons = [];
        let matchScore = 0;

        // PM-KISAN: Small & marginal farmers only
        if (scheme.id === 'pmkisan') {
            if (['large', 'medium'].includes(answers.land_size)) {
                eligible = false;
                reasons.push('Land holding exceeds 2 hectares limit');
            } else {
                matchScore += 20;
            }
        }

        // PM-KISAN Maandhan: Age 18-40, land up to 2 hectares
        if (scheme.id === 'pmkmy') {
            if (!['18-30', '30-40'].includes(answers.age)) {
                eligible = false;
                reasons.push('Age must be between 18-40 years to enroll');
            }
            if (['large', 'medium'].includes(answers.land_size)) {
                eligible = false;
                reasons.push('Land holding exceeds 2 hectares limit');
            }
            if (answers.interests?.includes('pension')) matchScore += 30;
        }

        // KCC: All farmer types eligible
        if (scheme.id === 'kcc') {
            if (answers.farmer_type === 'landless') {
                eligible = false;
                reasons.push('Must be owner/tenant/sharecropper');
            }
            if (answers.interests?.includes('credit')) matchScore += 30;
        }

        // PMFBY: All farmers
        if (scheme.id === 'pmfby') {
            if (answers.interests?.includes('insurance')) matchScore += 30;
        }

        // PMKSY: Irrigation interest
        if (scheme.id === 'pmksy') {
            if (answers.interests?.includes('irrigation')) matchScore += 30;
        }

        // Organic schemes
        if (['pkvy', 'gobar'].includes(scheme.id)) {
            if (answers.interests?.includes('organic')) matchScore += 30;
        }

        // SC/ST get higher subsidy in many schemes
        if (['sc', 'st'].includes(answers.category)) {
            if (['smam', 'deds', 'midh'].includes(scheme.id)) {
                matchScore += 15;
                reasons.push('Higher subsidy rate for SC/ST (33% vs 25%)');
            }
        }

        // Small/marginal farmers get priority
        if (['marginal', 'small'].includes(answers.land_size)) {
            matchScore += 10;
        }

        // Interest-based scoring
        const interestMap = {
            'credit': ['kcc', 'aif', 'acabc'],
            'insurance': ['pmfby'],
            'subsidy': ['pmkisan', 'soil', 'smam', 'nfsm', 'pmfme', 'rkvy'],
            'irrigation': ['pmksy'],
            'organic': ['pkvy', 'gobar'],
            'pension': ['pmkmy']
        };

        (answers.interests || []).forEach(interest => {
            if (interestMap[interest]?.includes(scheme.id)) {
                matchScore += 20;
            }
        });

        results.push({
            scheme,
            eligible,
            reasons,
            matchScore
        });
    });

    // Sort by eligibility and match score
    results.sort((a, b) => {
        if (a.eligible !== b.eligible) return b.eligible - a.eligible;
        return b.matchScore - a.matchScore;
    });

    // Show results
    const eligibleCount = results.filter(r => r.eligible).length;
    let html = `
        <div class="eligibility-results">
            <h3 style="margin-bottom: 0.5rem;">
                <i data-lucide="check-circle" style="width: 20px; height: 20px; color: var(--primary); vertical-align: middle;"></i>
                You're eligible for ${eligibleCount} schemes!
            </h3>
            <p style="color: var(--text-secondary); margin-bottom: 1rem;">Based on your profile, here are your best matches:</p>
            
            <div class="eligible-schemes">
                ${results.slice(0, 8).map(r => `
                    <div class="eligible-scheme-item ${!r.eligible ? 'not-eligible-item' : ''}">
                        <div>
                            <strong>${r.scheme.name}</strong>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">${r.scheme.nameHindi}</div>
                            ${r.matchScore > 20 ? `<span style="font-size: 0.75rem; color: var(--primary);">⭐ High Match</span>` : ''}
                            ${r.reasons.length > 0 && !r.eligible ? `<div style="font-size: 0.75rem; color: #ef4444; margin-top: 0.25rem;">${r.reasons[0]}</div>` : ''}
                        </div>
                        <div style="text-align: right;">
                            ${r.eligible ?
            `<a href="${r.scheme.applyLink}" target="_blank" class="btn-primary" style="padding: 0.5rem 1rem; font-size: 0.8rem;">Apply</a>` :
            `<span style="color: #ef4444; font-size: 0.8rem;">Not Eligible</span>`
        }
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <button class="btn-secondary" style="width: 100%; margin-top: 1.5rem;" onclick="closeEligibilityModal()">Close</button>
        </div>
    `;

    document.getElementById('eligibility-questions').innerHTML = html;
    document.getElementById('eligibility-progress').innerHTML = '';
    document.getElementById('eligibility-footer') ? document.getElementById('eligibility-footer').style.display = 'none' : null;
    document.querySelector('.eligibility-footer').style.display = 'none';

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ============================================
// UTILITIES
// ============================================
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatNumber(num) {
    return num?.toLocaleString('en-IN') || '0';
}

function showLoading() {
    document.getElementById('loading-overlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
}

// ============================================
// DRAG & DROP FOR IMAGE UPLOAD
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    checkBackendStatus();
    setInterval(checkBackendStatus, 30000);

    // Initialize language
    const savedLang = localStorage.getItem('appLanguage') || 'en';
    currentLanguage = savedLang;
    const desktopLangSelect = document.getElementById('app-language');
    const mobileLangSelect = document.getElementById('mobile-app-language');
    if (desktopLangSelect) desktopLangSelect.value = savedLang;
    if (mobileLangSelect) mobileLangSelect.value = savedLang;
    updateAllTranslations();

    // Load saved data from localStorage
    loadFromStorage();

    // Pre-fill remembered username
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
        const usernameInput = document.getElementById('login-username');
        const rememberCheckbox = document.getElementById('remember-me');
        if (usernameInput) usernameInput.value = rememberedUser;
        if (rememberCheckbox) rememberCheckbox.checked = true;
    }

    if (currentFarmer) {
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('profile-dashboard').style.display = 'block';
        document.getElementById('sidebar-logout').style.display = 'flex'; // Show sidebar logout
        document.getElementById('nav-complaints').style.display = 'flex'; // Show complaints nav
        updateProfileDisplay();
        displayProfilePicture();
        renderCropCycles(); // Render saved crop cycles
        renderMyComplaints();

        // Add to allFarmers for admin view
        let savedFarmers = JSON.parse(localStorage.getItem('allFarmers') || '[]');
        if (!savedFarmers.find(f => f.id === currentFarmer.id)) {
            savedFarmers.push(currentFarmer);
            localStorage.setItem('allFarmers', JSON.stringify(savedFarmers));
        }
    }

    // Restore admin session
    if (currentAdmin) {
        document.getElementById('admin-auth-section').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
        document.getElementById('admin-district-name').textContent = currentAdmin.district;
        document.getElementById('admin-officer-id').textContent = 'ID: ' + currentAdmin.adminId.toUpperCase();
        loadAdminDashboard();
    }

    // Set today's date for sowing date input
    const today = new Date().toISOString().split('T')[0];
    const sowingInput = document.getElementById('cycle-sowing-date');
    if (sowingInput) sowingInput.value = today;

    // Drag & drop
    const uploadArea = document.getElementById('upload-area');
    if (uploadArea) {
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--primary)';
            uploadArea.style.background = 'rgba(16, 185, 129, 0.1)';
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = 'var(--border)';
            uploadArea.style.background = 'transparent';
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--border)';
            uploadArea.style.background = 'transparent';

            if (e.dataTransfer.files.length > 0) {
                document.getElementById('file-input').files = e.dataTransfer.files;
                handleFileSelect({ target: { files: e.dataTransfer.files } });
            }
        });
    }

    // Initialize animated background particles
    initParticles();

    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Load initial content
    loadMarketPrices();
    loadSchemes();
});

// ============================================
// ANIMATED BACKGROUND - FLOATING PARTICLES (Clean dots, no emojis)
// ============================================
function initParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;

    const particleCount = 30;

    for (let i = 0; i < particleCount; i++) {
        createParticle(particlesContainer);
    }
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';

    // Random starting position
    particle.style.left = Math.random() * 100 + '%';

    // Random size (small dots)
    const size = Math.random() * 4 + 2; // 2-6px
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    particle.style.borderRadius = '50%';
    particle.style.background = `rgba(16, 185, 129, ${Math.random() * 0.4 + 0.1})`;

    // Random animation duration and delay
    const duration = Math.random() * 25 + 20; // 20-45 seconds
    const delay = Math.random() * 20; // 0-20 seconds delay

    particle.style.animation = `particleFloat ${duration}s linear ${delay}s infinite`;

    container.appendChild(particle);
}

// Add mouse parallax effect to orbs
document.addEventListener('mousemove', (e) => {
    const orbs = document.querySelectorAll('.orb');
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;

    orbs.forEach((orb, index) => {
        const speed = (index + 1) * 10;
        orb.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
    });
});

// ============================================
// WEATHER - REAL API INTEGRATION (Open-Meteo - FREE, No API Key)
// ============================================
// City coordinates for India
const CITY_COORDS = {
    'pune': { lat: 18.52, lon: 73.86 },
    'mumbai': { lat: 19.08, lon: 72.88 },
    'delhi': { lat: 28.61, lon: 77.21 },
    'bangalore': { lat: 12.97, lon: 77.59 },
    'chennai': { lat: 13.08, lon: 80.27 },
    'hyderabad': { lat: 17.39, lon: 78.49 },
    'kolkata': { lat: 22.57, lon: 88.36 },
    'ahmedabad': { lat: 23.02, lon: 72.57 },
    'jaipur': { lat: 26.91, lon: 75.79 },
    'lucknow': { lat: 26.85, lon: 80.95 },
    'chandigarh': { lat: 30.73, lon: 76.78 },
    'patna': { lat: 25.61, lon: 85.14 },
    'bhopal': { lat: 23.26, lon: 77.41 },
    'indore': { lat: 22.72, lon: 75.86 },
    'nagpur': { lat: 21.15, lon: 79.09 },
    'nashik': { lat: 19.99, lon: 73.79 },
    'aurangabad': { lat: 19.88, lon: 75.34 },
    'amritsar': { lat: 31.63, lon: 74.87 },
    'ludhiana': { lat: 30.90, lon: 75.85 },
    'varanasi': { lat: 25.32, lon: 82.99 },
    'agra': { lat: 27.18, lon: 78.02 },
    'kanpur': { lat: 26.45, lon: 80.35 },
    'surat': { lat: 21.17, lon: 72.83 },
    'vadodara': { lat: 22.31, lon: 73.19 },
    'rajkot': { lat: 22.30, lon: 70.78 },
    'coimbatore': { lat: 11.01, lon: 76.97 },
    'madurai': { lat: 9.93, lon: 78.12 },
    'visakhapatnam': { lat: 17.69, lon: 83.22 },
    'vijayawada': { lat: 16.51, lon: 80.65 },
    'mysore': { lat: 12.30, lon: 76.64 },
    'mangalore': { lat: 12.91, lon: 74.86 },
    'thiruvananthapuram': { lat: 8.52, lon: 76.94 },
    'kochi': { lat: 9.93, lon: 76.27 },
    'guwahati': { lat: 26.14, lon: 91.74 },
    'ranchi': { lat: 23.34, lon: 85.31 },
    'bhubaneswar': { lat: 20.30, lon: 85.82 },
    'raipur': { lat: 21.25, lon: 81.63 },
    'dehradun': { lat: 30.32, lon: 78.03 },
    'shimla': { lat: 31.10, lon: 77.17 },
    'srinagar': { lat: 34.08, lon: 74.80 },
    'default': { lat: 20.59, lon: 78.96 } // Central India
};

function loadWeatherPage() {
    // Auto-load weather for default city
    const cityInput = document.getElementById('weather-city');
    if (cityInput && cityInput.value) {
        // Don't auto-fetch, wait for user click
    }
}

async function getWeather() {
    const cityInput = document.getElementById('weather-city').value.trim().toLowerCase();
    const state = document.getElementById('weather-state').value;

    if (!cityInput) {
        alert('Please enter a city name');
        return;
    }

    showLoading();

    try {
        // Get coordinates
        let coords = CITY_COORDS[cityInput] || CITY_COORDS['default'];

        // If city not in our list, try geocoding API
        if (!CITY_COORDS[cityInput]) {
            try {
                const geoResponse = await fetch(
                    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityInput)}&count=1&language=en&format=json`
                );
                const geoData = await geoResponse.json();
                if (geoData.results && geoData.results.length > 0) {
                    coords = { lat: geoData.results[0].latitude, lon: geoData.results[0].longitude };
                }
            } catch (e) {
                console.log('Geocoding failed, using default coords');
            }
        }

        // Fetch weather from Open-Meteo (FREE API - No key needed!)
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m,uv_index,surface_pressure&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,rain_sum,wind_speed_10m_max,uv_index_max&timezone=Asia%2FKolkata`;

        console.log('Fetching weather from:', weatherUrl);
        const response = await fetch(weatherUrl);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Weather data received:', data);

        if (!data.current) {
            throw new Error('Invalid weather data received');
        }

        displayWeatherData(data, cityInput, state);

    } catch (error) {
        console.error('Weather fetch error:', error);
        alert('Failed to fetch weather data. Please try again.');
    } finally {
        hideLoading();
    }
}

function displayWeatherData(data, city, state) {
    const current = data.current;
    const daily = data.daily;

    // Show all weather sections
    document.getElementById('current-weather').style.display = 'block';
    document.getElementById('risk-alerts').style.display = 'block';
    document.getElementById('forecast-section').style.display = 'block';
    document.getElementById('farming-advice').style.display = 'block';

    // Weather code to icon & description mapping
    const weatherIcons = {
        0: { icon: '☀️', desc: 'Clear sky' },
        1: { icon: '🌤️', desc: 'Mainly clear' },
        2: { icon: '⛅', desc: 'Partly cloudy' },
        3: { icon: '☁️', desc: 'Overcast' },
        45: { icon: '🌫️', desc: 'Foggy' },
        48: { icon: '🌫️', desc: 'Depositing rime fog' },
        51: { icon: '🌧️', desc: 'Light drizzle' },
        53: { icon: '🌧️', desc: 'Moderate drizzle' },
        55: { icon: '🌧️', desc: 'Dense drizzle' },
        61: { icon: '🌧️', desc: 'Slight rain' },
        63: { icon: '🌧️', desc: 'Moderate rain' },
        65: { icon: '🌧️', desc: 'Heavy rain' },
        71: { icon: '🌨️', desc: 'Slight snow' },
        73: { icon: '🌨️', desc: 'Moderate snow' },
        75: { icon: '❄️', desc: 'Heavy snow' },
        80: { icon: '🌦️', desc: 'Rain showers' },
        81: { icon: '🌦️', desc: 'Moderate showers' },
        82: { icon: '⛈️', desc: 'Violent showers' },
        95: { icon: '⛈️', desc: 'Thunderstorm' },
        96: { icon: '⛈️', desc: 'Thunderstorm with hail' },
        99: { icon: '⛈️', desc: 'Severe thunderstorm' }
    };

    const currentWeather = weatherIcons[current.weather_code] || { icon: '🌡️', desc: 'Unknown' };

    // Update current weather display
    document.getElementById('weather-icon').textContent = currentWeather.icon;
    document.getElementById('temp-value').textContent = Math.round(current.temperature_2m);
    document.getElementById('weather-desc').textContent = `${currentWeather.desc} in ${city.charAt(0).toUpperCase() + city.slice(1)}, ${state}`;
    document.getElementById('weather-humidity').textContent = `${current.relative_humidity_2m}%`;
    document.getElementById('wind-speed').textContent = `${Math.round(current.wind_speed_10m)} km/h`;
    document.getElementById('rainfall').textContent = `${current.rain || 0} mm`;
    document.getElementById('uv-index').textContent = current.uv_index || 'N/A';
    document.getElementById('pressure').textContent = `${Math.round(current.surface_pressure || 1013)} hPa`;
    document.getElementById('feels-like').textContent = `${Math.round(current.apparent_temperature)}°C`;

    // Generate risk alerts based on weather
    generateRiskAlerts(current, daily);

    // Display 7-day forecast
    displayForecast(daily, weatherIcons);

    // Generate farming advice
    generateFarmingAdvice(current, daily);
}

function generateRiskAlerts(current, daily) {
    const alertsContainer = document.getElementById('alerts-container');
    const alerts = [];

    // Check various risk conditions
    if (current.temperature_2m > 40) {
        alerts.push({
            severity: 'critical',
            icon: '🔥',
            title: 'Extreme Heat Warning',
            desc: `Temperature is ${current.temperature_2m}°C. Crops are at severe heat stress risk.`,
            action: '💡 Increase irrigation frequency. Provide shade for sensitive crops. Avoid fieldwork during 11 AM - 4 PM.'
        });
    } else if (current.temperature_2m > 35) {
        alerts.push({
            severity: 'high',
            icon: '🌡️',
            title: 'High Temperature Alert',
            desc: `Temperature is ${current.temperature_2m}°C. Monitor crops for heat stress.`,
            action: '💡 Ensure adequate water supply. Consider mulching to retain soil moisture.'
        });
    }

    if (current.relative_humidity_2m > 85) {
        alerts.push({
            severity: 'high',
            icon: '🍄',
            title: 'Fungal Disease Risk',
            desc: `Humidity at ${current.relative_humidity_2m}%. High risk of fungal infections.`,
            action: '💡 Apply preventive fungicide. Ensure proper plant spacing for air circulation.'
        });
    }

    // Check 3-day rainfall
    const rainfall3Day = daily.precipitation_sum.slice(0, 3).reduce((a, b) => a + b, 0);
    if (rainfall3Day > 100) {
        alerts.push({
            severity: 'critical',
            icon: '🌊',
            title: 'Flood Risk Warning',
            desc: `Expected ${rainfall3Day.toFixed(0)}mm rainfall in next 3 days.`,
            action: '💡 Ensure proper drainage. Move harvested crops to dry storage. Avoid low-lying areas.'
        });
    } else if (rainfall3Day > 50) {
        alerts.push({
            severity: 'high',
            icon: '🌧️',
            title: 'Heavy Rain Expected',
            desc: `${rainfall3Day.toFixed(0)}mm rainfall expected in next 3 days.`,
            action: '💡 Postpone spraying activities. Check field drainage. Harvest ripe crops before rain.'
        });
    }

    if (current.wind_speed_10m > 30) {
        alerts.push({
            severity: 'medium',
            icon: '💨',
            title: 'High Wind Advisory',
            desc: `Wind speed is ${current.wind_speed_10m} km/h.`,
            action: '💡 Do not spray pesticides. Provide support for tall crops. Secure loose structures.'
        });
    }

    if (current.uv_index > 8) {
        alerts.push({
            severity: 'medium',
            icon: '☀️',
            title: 'Very High UV Index',
            desc: `UV Index is ${current.uv_index}. Risk of sunburn for fieldworkers.`,
            action: '💡 Work during early morning or late afternoon. Wear protective clothing.'
        });
    }

    // No rain warning
    const totalRain7Day = daily.precipitation_sum.reduce((a, b) => a + b, 0);
    if (totalRain7Day < 5 && current.temperature_2m > 30) {
        alerts.push({
            severity: 'high',
            icon: '🏜️',
            title: 'Drought Conditions',
            desc: `Only ${totalRain7Day.toFixed(1)}mm rain expected in 7 days with high temperatures.`,
            action: '💡 Plan irrigation schedule. Consider drip irrigation. Apply mulch to conserve moisture.'
        });
    }

    // If no alerts, show positive message
    if (alerts.length === 0) {
        alerts.push({
            severity: 'low',
            icon: '✅',
            title: 'Good Farming Conditions',
            desc: 'Weather conditions are favorable for farming activities.',
            action: '💡 Ideal time for field operations, spraying, and outdoor work.'
        });
    }

    alertsContainer.innerHTML = alerts.map(alert => `
        <div class="risk-alert ${alert.severity}">
            <div class="risk-alert-icon">${alert.icon}</div>
            <div class="risk-alert-content">
                <div class="risk-alert-title">${alert.title}</div>
                <div class="risk-alert-desc">${alert.desc}</div>
                <div class="risk-alert-action">${alert.action}</div>
            </div>
        </div>
    `).join('');
}

function displayForecast(daily, weatherIcons) {
    const forecastGrid = document.getElementById('forecast-grid');
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    forecastGrid.innerHTML = daily.time.slice(0, 7).map((date, i) => {
        const d = new Date(date);
        const dayName = i === 0 ? 'Today' : days[d.getDay()];
        const weather = weatherIcons[daily.weather_code[i]] || { icon: '🌡️' };
        const rain = daily.precipitation_sum[i] || 0;
        const suitable = rain < 10 && daily.temperature_2m_max[i] < 40 && daily.wind_speed_10m_max[i] < 25;

        return `
            <div class="forecast-day ${suitable ? 'suitable' : rain > 20 ? 'not-suitable' : ''}">
                <div class="day-name">${dayName}</div>
                <div class="day-icon">${weather.icon}</div>
                <div class="day-temp">
                    <span class="temp-high">${Math.round(daily.temperature_2m_max[i])}°</span>
                    <span class="temp-low">${Math.round(daily.temperature_2m_min[i])}°</span>
                </div>
                <div class="day-rain">💧 ${rain.toFixed(1)}mm</div>
            </div>
        `;
    }).join('');
}

function generateFarmingAdvice(current, daily) {
    const adviceContainer = document.getElementById('advice-container');
    const advice = [];

    // Spray window advice
    const canSpray = current.wind_speed_10m < 15 && current.relative_humidity_2m < 85 && (current.rain || 0) < 1;
    if (canSpray) {
        advice.push({
            icon: '🎯',
            title: 'Spray Window: OPEN',
            desc: 'Current conditions are suitable for pesticide/fertilizer spraying. Low wind and no rain expected in next few hours.'
        });
    } else {
        advice.push({
            icon: '⏳',
            title: 'Spray Window: CLOSED',
            desc: `Not ideal for spraying due to ${current.wind_speed_10m > 15 ? 'high wind' : current.relative_humidity_2m > 85 ? 'high humidity' : 'rain'}. Wait for better conditions.`
        });
    }

    // Irrigation advice
    const avgTemp = (daily.temperature_2m_max[0] + daily.temperature_2m_min[0]) / 2;
    const rainToday = daily.precipitation_sum[0] || 0;

    if (avgTemp > 32 && rainToday < 5) {
        advice.push({
            icon: '💧',
            title: 'Irrigation Needed',
            desc: `High temperature (${Math.round(avgTemp)}°C avg) with minimal rain. Irrigate crops in early morning (before 8 AM) or evening (after 5 PM).`
        });
    } else if (rainToday > 10) {
        advice.push({
            icon: '💧',
            title: 'Skip Irrigation',
            desc: `${rainToday.toFixed(1)}mm rain expected/received. No irrigation needed today. Check soil moisture before next irrigation.`
        });
    }

    // Harvest advice
    const rainNext3Days = daily.precipitation_sum.slice(0, 3).reduce((a, b) => a + b, 0);
    if (rainNext3Days > 30) {
        advice.push({
            icon: '🌾',
            title: 'Harvest Soon',
            desc: `${rainNext3Days.toFixed(0)}mm rain expected in next 3 days. If crops are ready, harvest before the rain to prevent losses.`
        });
    }

    // Sowing/planting advice
    if (rainNext3Days > 15 && rainNext3Days < 50 && current.temperature_2m > 20 && current.temperature_2m < 35) {
        advice.push({
            icon: '🌱',
            title: 'Good Time for Sowing',
            desc: 'Moderate rain expected with favorable temperatures. Good conditions for sowing or transplanting seedlings.'
        });
    }

    // General field work
    if (current.uv_index < 6 && current.temperature_2m < 35 && current.wind_speed_10m < 20) {
        advice.push({
            icon: '👨‍🌾',
            title: 'Fieldwork Conditions: Good',
            desc: 'Weather is comfortable for outdoor field activities. Stay hydrated and take breaks.'
        });
    }

    // Pest alert based on humidity + temp
    if (current.relative_humidity_2m > 70 && current.temperature_2m > 25) {
        advice.push({
            icon: '🐛',
            title: 'Pest Activity Warning',
            desc: 'Warm and humid conditions favor pest breeding. Monitor crops closely and consider preventive measures.'
        });
    }

    adviceContainer.innerHTML = advice.map(item => `
        <div class="advice-item">
            <div class="advice-icon">${item.icon}</div>
            <div class="advice-content">
                <h4>${item.title}</h4>
                <p>${item.desc}</p>
            </div>
        </div>
    `).join('');
}

// ============================================
// PROFILE PICTURE
// ============================================
function uploadProfilePicture(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const imageData = e.target.result;

        // Update display
        const avatarEl = document.getElementById('farmer-avatar');
        const avatarImg = document.getElementById('farmer-avatar-img');

        avatarEl.style.display = 'none';
        avatarImg.src = imageData;
        avatarImg.style.display = 'block';

        // Save to farmer profile
        if (currentFarmer) {
            currentFarmer.profilePicture = imageData;
            saveToStorage();
        }

        lucide.createIcons();
    };
    reader.readAsDataURL(file);
}

function displayProfilePicture() {
    if (!currentFarmer) return;

    const avatarEl = document.getElementById('farmer-avatar');
    const avatarImg = document.getElementById('farmer-avatar-img');

    if (currentFarmer.profilePicture) {
        avatarEl.style.display = 'none';
        avatarImg.src = currentFarmer.profilePicture;
        avatarImg.style.display = 'block';
    } else {
        avatarEl.style.display = 'flex';
        avatarImg.style.display = 'none';
    }
}

// ============================================
// COMPLAINTS SYSTEM - DATABASE PERSISTED
// ============================================
async function submitComplaint() {
    if (!currentFarmer) {
        alert('Please login first to submit a complaint');
        showPage('profile');
        return;
    }

    const category = document.getElementById('complaint-category').value;
    const subject = document.getElementById('complaint-subject').value.trim();
    const description = document.getElementById('complaint-description').value.trim();
    const urgency = document.getElementById('complaint-urgency').value;

    if (!category || !subject || !description) {
        alert('Please fill all required fields');
        return;
    }

    try {
        // Submit to backend API
        const response = await fetch(`${API_BASE}/complaints/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                category: category,
                subject: subject,
                description: description,
                urgency: urgency
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Failed to submit complaint');
        }

        const result = await response.json();

        // Clear form
        document.getElementById('complaint-category').value = '';
        document.getElementById('complaint-subject').value = '';
        document.getElementById('complaint-description').value = '';
        document.getElementById('complaint-urgency').value = 'low';
        document.getElementById('complaint-photo').value = '';

        alert('Complaint submitted successfully! Your complaint ID: ' + result.complaint.id);
        renderMyComplaints();
    } catch (error) {
        console.error('Error submitting complaint:', error);
        alert('Error: ' + error.message);
    }
}

async function renderMyComplaints() {
    const container = document.getElementById('my-complaints-container');
    if (!container || !currentFarmer) return;

    try {
        // Fetch from backend API
        const response = await fetch(`${API_BASE}/complaints/my`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch complaints');
        }

        const myComplaints = await response.json();

        if (myComplaints.length === 0) {
            container.innerHTML = '<div class="empty-state glass-card"><p>No complaints submitted yet.</p></div>';
            return;
        }

        container.innerHTML = myComplaints.map(c => `
            <div class="complaint-card glass-card">
                <div class="complaint-header">
                    <div>
                        <h4>${c.subject}</h4>
                        <div class="complaint-meta">
                            <span><i data-lucide="tag" style="width:12px;height:12px;"></i> ${getCategoryLabel(c.category)}</span>
                            <span><i data-lucide="calendar" style="width:12px;height:12px;"></i> ${formatDate(c.createdAt)}</span>
                            <span class="urgency-badge ${c.urgency}">${c.urgency}</span>
                        </div>
                    </div>
                    <span class="complaint-status ${c.status}">${c.status.replace('-', ' ')}</span>
                </div>
                <p class="complaint-description">${c.description}</p>
                <div class="complaint-meta"><span>ID: ${c.id}</span></div>
                ${c.adminResponse ? `
                    <div class="admin-response">
                        <div class="response-label">Admin Response:</div>
                        <p>${c.adminResponse}</p>
                    </div>
                ` : ''}
            </div>
        `).join('');

        lucide.createIcons();
    } catch (error) {
        console.error('Error fetching complaints:', error);
        container.innerHTML = '<div class="empty-state glass-card"><p>Error loading complaints. Please try again.</p></div>';
    }
}

function getCategoryLabel(cat) {
    const labels = {
        'water': 'Water/Irrigation',
        'seeds': 'Seed Quality',
        'fertilizer': 'Fertilizer',
        'pests': 'Pest/Disease',
        'market': 'Market Price',
        'subsidy': 'Subsidy/Scheme',
        'land': 'Land Dispute',
        'equipment': 'Equipment',
        'other': 'Other'
    };
    return labels[cat] || cat;
}

function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ============================================
// ADMIN SYSTEM - DATABASE PERSISTED
// ============================================
function adminLogin() {
    const district = document.getElementById('admin-district').value;
    const adminId = document.getElementById('admin-id').value.trim();
    const password = document.getElementById('admin-password').value;

    if (!district || !adminId || !password) {
        alert('Please fill all fields');
        return;
    }

    // Demo auth - accept admin/admin123 for any district
    if (adminId === 'admin' && password === 'admin123') {
        currentAdmin = {
            id: 'ADM' + Date.now(),
            district: district,
            adminId: adminId,
            name: `${district} Agriculture Officer`
        };

        localStorage.setItem('admin', JSON.stringify(currentAdmin));

        document.getElementById('admin-auth-section').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
        document.getElementById('admin-district-name').textContent = district;
        document.getElementById('admin-officer-id').textContent = 'ID: ' + adminId.toUpperCase();

        loadAdminDashboard();
    } else {
        alert('Invalid credentials. Use: admin / admin123');
    }
}

function adminLogout() {
    currentAdmin = null;
    localStorage.removeItem('admin');

    document.getElementById('admin-auth-section').style.display = 'block';
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('admin-district').value = '';
    document.getElementById('admin-id').value = '';
    document.getElementById('admin-password').value = '';
}

async function loadAdminDashboard() {
    if (!currentAdmin) return;

    try {
        // Fetch stats from backend API
        const statsResponse = await fetch(`${API_BASE}/complaints/admin/stats/${encodeURIComponent(currentAdmin.district)}`);

        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            document.getElementById('admin-total-farmers').textContent = stats.totalFarmers || 0;
            document.getElementById('admin-pending-complaints').textContent = stats.pending || 0;
            document.getElementById('admin-resolved-complaints').textContent = stats.resolved || 0;
        }

        // Get total area from farmers in district
        const farmersResponse = await fetch(`${API_BASE}/farmer/all?district=${encodeURIComponent(currentAdmin.district)}`);
        if (farmersResponse.ok) {
            const farmers = await farmersResponse.json();
            const totalArea = farmers.reduce((sum, f) => {
                const farmerArea = (f.lands || []).reduce((s, l) => s + (l.area || 0), 0);
                return sum + farmerArea;
            }, 0);
            document.getElementById('admin-total-area').textContent = totalArea.toFixed(1);
        } else {
            document.getElementById('admin-total-area').textContent = '0';
        }

        await renderAdminComplaints('all');
        await renderAdminFarmers();
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
    }
}

function filterComplaints(status) {
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    renderAdminComplaints(status);
}

async function renderAdminComplaints(filter) {
    const container = document.getElementById('admin-complaints-container');
    if (!container || !currentAdmin) return;

    try {
        // Fetch from backend API
        let url = `${API_BASE}/complaints/admin/district/${encodeURIComponent(currentAdmin.district)}`;
        if (filter && filter !== 'all') {
            url += `?status=${filter}`;
        }

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Failed to fetch complaints');
        }

        const filtered = await response.json();

        if (filtered.length === 0) {
            container.innerHTML = '<div class="empty-state glass-card"><p>No complaints found.</p></div>';
            return;
        }

        container.innerHTML = filtered.map(c => `
            <div class="admin-complaint-card">
                <div class="farmer-info">
                    <div class="farmer-avatar">
                        ${c.farmerProfilePic ? `<img src="${c.farmerProfilePic}" alt="">` : c.farmerName.charAt(0)}
                    </div>
                    <div>
                        <strong>${c.farmerName}</strong>
                        <p class="text-muted" style="font-size:0.8rem;">${c.farmerPhone} • ${c.farmerDistrict}</p>
                    </div>
                    <span class="complaint-status ${c.status}" style="margin-left:auto;">${c.status.replace('-', ' ')}</span>
                </div>
                <div class="complaint-header">
                    <div>
                        <h4>${c.subject}</h4>
                        <div class="complaint-meta">
                            <span><i data-lucide="tag" style="width:12px;height:12px;"></i> ${getCategoryLabel(c.category)}</span>
                            <span><i data-lucide="calendar" style="width:12px;height:12px;"></i> ${formatDate(c.createdAt)}</span>
                            <span class="urgency-badge ${c.urgency}">${c.urgency}</span>
                        </div>
                    </div>
                </div>
                <p class="complaint-description">${c.description}</p>
                <div class="complaint-meta"><span>ID: ${c.id}</span></div>
                ${c.adminResponse ? `
                    <div class="admin-response">
                        <div class="response-label">Your Response:</div>
                        <p>${c.adminResponse}</p>
                    </div>
                ` : ''}
                ${c.status !== 'resolved' ? `
                    <div class="admin-actions">
                        ${c.status === 'pending' ? `<button class="btn-progress" onclick="updateComplaintStatus('${c.id}', 'in-progress')"><i data-lucide="clock" style="width:14px;height:14px;"></i> Mark In Progress</button>` : ''}
                        <button class="btn-resolve" onclick="resolveComplaint('${c.id}')"><i data-lucide="check-circle" style="width:14px;height:14px;"></i> Resolve</button>
                    </div>
                ` : ''}
            </div>
        `).join('');

        lucide.createIcons();
    } catch (error) {
        console.error('Error rendering admin complaints:', error);
        container.innerHTML = '<div class="empty-state glass-card"><p>Error loading complaints.</p></div>';
    }
}

async function updateComplaintStatus(complaintId, newStatus) {
    try {
        const response = await fetch(`${API_BASE}/complaints/admin/${complaintId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: newStatus
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update complaint');
        }

        loadAdminDashboard();
    } catch (error) {
        console.error('Error updating complaint:', error);
        alert('Error updating complaint: ' + error.message);
    }
}

async function resolveComplaint(complaintId) {
    const response = prompt('Enter your response/resolution for this complaint:');
    if (!response) return;

    try {
        const apiResponse = await fetch(`${API_BASE}/complaints/admin/${complaintId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'resolved',
                admin_response: response,
                resolved_by: currentAdmin?.name || 'Admin'
            })
        });

        if (!apiResponse.ok) {
            throw new Error('Failed to resolve complaint');
        }

        alert('Complaint resolved successfully!');
        loadAdminDashboard();
    } catch (error) {
        console.error('Error resolving complaint:', error);
        alert('Error resolving complaint: ' + error.message);
    }
}

async function renderAdminFarmers() {
    const container = document.getElementById('admin-farmers-container');
    if (!container || !currentAdmin) return;

    try {
        // Fetch farmers from backend
        const response = await fetch(`${API_BASE}/farmer/all?district=${encodeURIComponent(currentAdmin.district)}`);

        if (!response.ok) {
            // Fallback to localStorage if API fails
            const savedFarmersData = localStorage.getItem('allFarmers') || '[]';
            const allFarmersLocal = JSON.parse(savedFarmersData);
            const districtFarmers = allFarmersLocal.filter(f => f.district === currentAdmin.district);
            renderFarmersList(container, districtFarmers);
            return;
        }

        const farmers = await response.json();
        renderFarmersList(container, farmers);
    } catch (error) {
        console.error('Error fetching farmers:', error);
        container.innerHTML = '<div class="empty-state glass-card"><p>Error loading farmers list.</p></div>';
    }
}

function renderFarmersList(container, farmers) {
    if (farmers.length === 0) {
        container.innerHTML = '<div class="empty-state glass-card"><p>No farmers registered in this district yet.</p></div>';
        return;
    }

    container.innerHTML = farmers.map(f => `
        <div class="farmer-list-card">
            <div class="farmer-avatar">
                ${f.profilePicture ? `<img src="${f.profilePicture}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : (f.name || 'U').charAt(0)}
            </div>
            <div class="farmer-details">
                <h4>${f.name || 'Unknown'}</h4>
                <p>${f.phone || ''} • ${f.district || ''}, ${f.state || ''}</p>
            </div>
            <div class="farmer-stats">
                <span><strong>${f.lands?.length || 0}</strong> Lands</span>
                <span><strong>${(f.lands?.reduce((s, l) => s + (l.area || 0), 0) || 0).toFixed(1)}</strong> Acres</span>
            </div>
        </div>
    `).join('');
}
