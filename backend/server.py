from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
from datetime import datetime, timedelta
import random
import math

# Environment variables
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

app = FastAPI(title="AgroX - Satellite-Aided Fintech Platform")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Pydantic models
class FarmPlot(BaseModel):
    id: str
    farm_name: str
    location: str
    area_acres: float
    crop_type: str
    planting_date: str
    coordinates: dict
    owner_name: str
    owner_email: str

class SatelliteReading(BaseModel):
    id: str
    plot_id: str
    date: str
    ndvi_value: float
    crop_health_score: float
    soil_moisture: float
    weather_risk: float
    precipitation: float
    temperature: float

class CreditApplication(BaseModel):
    id: str
    plot_id: str
    farmer_name: str
    farmer_email: str
    requested_amount: float
    purpose: str
    application_date: str
    status: str
    approved_amount: Optional[float] = None
    interest_rate: Optional[float] = None
    crop_health_score: float
    risk_assessment: str

class InsuranceQuote(BaseModel):
    id: str
    plot_id: str
    farmer_name: str
    farmer_email: str
    coverage_amount: float
    premium_amount: float
    coverage_type: str
    risk_level: str
    quote_date: str
    valid_until: str

# Mock data generators
def generate_ndvi_data(crop_type: str, days_since_planting: int) -> float:
    """Generate realistic NDVI values based on crop growth cycle"""
    if crop_type.lower() == "corn":
        # Corn growth cycle: low at start, peak mid-season, decline at harvest
        optimal_day = 75
        peak_ndvi = 0.85
    elif crop_type.lower() == "wheat":
        optimal_day = 90
        peak_ndvi = 0.80
    elif crop_type.lower() == "soybean":
        optimal_day = 65
        peak_ndvi = 0.82
    else:
        optimal_day = 75
        peak_ndvi = 0.80
    
    # Bell curve with noise
    base_value = peak_ndvi * math.exp(-((days_since_planting - optimal_day) ** 2) / (2 * (optimal_day / 2) ** 2))
    noise = random.uniform(-0.05, 0.05)
    return max(0.2, min(0.95, base_value + noise))

def calculate_crop_health_score(ndvi: float, soil_moisture: float, weather_risk: float) -> float:
    """Calculate crop health score from satellite metrics"""
    ndvi_score = min(100, ndvi * 120)  # NDVI to 0-100 scale
    moisture_score = min(100, soil_moisture * 100)
    weather_score = max(0, 100 - weather_risk * 100)
    
    return round((ndvi_score * 0.5 + moisture_score * 0.3 + weather_score * 0.2), 1)

def assess_credit_risk(crop_health_score: float, weather_risk: float, area_acres: float) -> tuple:
    """Assess credit risk and determine loan parameters"""
    base_risk = 100 - crop_health_score
    weather_penalty = weather_risk * 20
    size_bonus = min(10, area_acres * 0.5)  # Larger farms get bonus
    
    final_risk = max(5, base_risk + weather_penalty - size_bonus)
    
    if final_risk < 20:
        risk_level = "Low"
        max_amount_per_acre = 800
        interest_rate = 5.5
    elif final_risk < 40:
        risk_level = "Medium"
        max_amount_per_acre = 600
        interest_rate = 7.2
    elif final_risk < 60:
        risk_level = "High"
        max_amount_per_acre = 400
        interest_rate = 9.8
    else:
        risk_level = "Very High"
        max_amount_per_acre = 200
        interest_rate = 12.5
    
    return risk_level, max_amount_per_acre, interest_rate

# API Endpoints

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "AgroX API"}

@app.get("/api/farm-plots")
async def get_farm_plots():
    """Get all farm plots"""
    plots_collection = db.farm_plots
    plots_cursor = plots_collection.find({})
    plots = await plots_cursor.to_list(length=100)
    
    # Convert MongoDB _id to string and remove it
    for plot in plots:
        if '_id' in plot:
            del plot['_id']
    
    return {"plots": plots}

@app.post("/api/farm-plots")
async def create_farm_plot(plot: FarmPlot):
    """Create a new farm plot"""
    plot_dict = plot.dict()
    plots_collection = db.farm_plots
    await plots_collection.insert_one(plot_dict)
    return {"message": "Farm plot created successfully", "plot_id": plot.id}

@app.get("/api/satellite-data/{plot_id}")
async def get_satellite_data(plot_id: str, days: int = 30):
    """Get satellite readings for a specific plot"""
    # Get plot info
    plots_collection = db.farm_plots
    plot = await plots_collection.find_one({"id": plot_id})
    
    if not plot:
        raise HTTPException(status_code=404, detail="Farm plot not found")
    
    # Generate mock satellite data for the requested period
    readings = []
    planting_date = datetime.strptime(plot["planting_date"], "%Y-%m-%d")
    
    for i in range(days):
        date = datetime.now() - timedelta(days=days-i-1)
        days_since_planting = (date - planting_date).days
        
        ndvi = generate_ndvi_data(plot["crop_type"], days_since_planting)
        soil_moisture = random.uniform(0.3, 0.8)
        weather_risk = random.uniform(0.1, 0.6)
        precipitation = random.uniform(0, 25)
        temperature = random.uniform(18, 35)
        
        crop_health_score = calculate_crop_health_score(ndvi, soil_moisture, weather_risk)
        
        reading = {
            "id": str(uuid.uuid4()),
            "plot_id": plot_id,
            "date": date.strftime("%Y-%m-%d"),
            "ndvi_value": round(ndvi, 3),
            "crop_health_score": crop_health_score,
            "soil_moisture": round(soil_moisture, 3),
            "weather_risk": round(weather_risk, 3),
            "precipitation": round(precipitation, 1),
            "temperature": round(temperature, 1)
        }
        readings.append(reading)
    
    return {"readings": readings}

@app.get("/api/dashboard-summary")
async def get_dashboard_summary():
    """Get dashboard summary with key metrics"""
    plots_collection = db.farm_plots
    plots_cursor = plots_collection.find({})
    plots = await plots_cursor.to_list(length=100)
    
    if not plots:
        return {
            "total_plots": 0,
            "total_acres": 0,
            "avg_crop_health": 0,
            "active_loans": 0,
            "total_insured_value": 0
        }
    
    total_acres = sum(plot.get("area_acres", 0) for plot in plots)
    
    # Generate current health scores for all plots
    health_scores = []
    for plot in plots:
        planting_date = datetime.strptime(plot["planting_date"], "%Y-%m-%d")
        days_since_planting = (datetime.now() - planting_date).days
        
        ndvi = generate_ndvi_data(plot["crop_type"], days_since_planting)
        soil_moisture = random.uniform(0.4, 0.7)
        weather_risk = random.uniform(0.2, 0.5)
        
        health_score = calculate_crop_health_score(ndvi, soil_moisture, weather_risk)
        health_scores.append(health_score)
    
    avg_health = sum(health_scores) / len(health_scores) if health_scores else 0
    
    return {
        "total_plots": len(plots),
        "total_acres": round(total_acres, 1),
        "avg_crop_health": round(avg_health, 1),
        "active_loans": random.randint(8, 15),
        "total_insured_value": round(total_acres * random.uniform(800, 1200), 0)
    }

@app.post("/api/credit-application")
async def submit_credit_application(application_data: dict):
    """Submit a credit application"""
    plot_id = application_data.get("plot_id")
    requested_amount = application_data.get("requested_amount", 0)
    
    # Get plot info
    plots_collection = db.farm_plots
    plot = await plots_collection.find_one({"id": plot_id})
    
    if not plot:
        raise HTTPException(status_code=404, detail="Farm plot not found")
    
    # Get latest satellite data for risk assessment
    planting_date = datetime.strptime(plot["planting_date"], "%Y-%m-%d")
    days_since_planting = (datetime.now() - planting_date).days
    
    ndvi = generate_ndvi_data(plot["crop_type"], days_since_planting)
    soil_moisture = random.uniform(0.4, 0.7)
    weather_risk = random.uniform(0.2, 0.5)
    
    crop_health_score = calculate_crop_health_score(ndvi, soil_moisture, weather_risk)
    risk_level, max_amount_per_acre, interest_rate = assess_credit_risk(
        crop_health_score, weather_risk, plot["area_acres"]
    )
    
    max_loan_amount = plot["area_acres"] * max_amount_per_acre
    approved_amount = min(requested_amount, max_loan_amount)
    
    status = "approved" if crop_health_score > 60 else "under_review"
    
    application = {
        "id": str(uuid.uuid4()),
        "plot_id": plot_id,
        "farmer_name": application_data.get("farmer_name"),
        "farmer_email": application_data.get("farmer_email"),
        "requested_amount": requested_amount,
        "approved_amount": approved_amount,
        "purpose": application_data.get("purpose"),
        "application_date": datetime.now().strftime("%Y-%m-%d"),
        "status": status,
        "interest_rate": interest_rate,
        "crop_health_score": crop_health_score,
        "risk_assessment": risk_level
    }
    
    # Store application
    applications_collection = db.credit_applications
    await applications_collection.insert_one(application)
    
    return {
        "application_id": application["id"],
        "status": status,
        "approved_amount": approved_amount,
        "interest_rate": interest_rate,
        "crop_health_score": crop_health_score,
        "risk_level": risk_level,
        "message": f"Application {status}. Based on satellite analysis, your crop health score is {crop_health_score}/100."
    }

@app.get("/api/insurance-quote/{plot_id}")
async def get_insurance_quote(plot_id: str, coverage_amount: float):
    """Get insurance quote for a farm plot"""
    # Get plot info
    plots_collection = db.farm_plots
    plot = await plots_collection.find_one({"id": plot_id})
    
    if not plot:
        raise HTTPException(status_code=404, detail="Farm plot not found")
    
    # Calculate risk-based premium
    planting_date = datetime.strptime(plot["planting_date"], "%Y-%m-%d")
    days_since_planting = (datetime.now() - planting_date).days
    
    ndvi = generate_ndvi_data(plot["crop_type"], days_since_planting)
    soil_moisture = random.uniform(0.4, 0.7)
    weather_risk = random.uniform(0.2, 0.5)
    
    crop_health_score = calculate_crop_health_score(ndvi, soil_moisture, weather_risk)
    
    # Premium calculation based on risk
    base_premium_rate = 0.05  # 5% base rate
    risk_multiplier = max(0.8, (100 - crop_health_score) / 100 + 0.5)
    
    premium_rate = base_premium_rate * risk_multiplier
    premium_amount = coverage_amount * premium_rate
    
    risk_level = "Low" if crop_health_score > 80 else "Medium" if crop_health_score > 60 else "High"
    
    quote = {
        "id": str(uuid.uuid4()),
        "plot_id": plot_id,
        "coverage_amount": coverage_amount,
        "premium_amount": round(premium_amount, 2),
        "premium_rate": round(premium_rate * 100, 2),
        "risk_level": risk_level,
        "crop_health_score": crop_health_score,
        "quote_date": datetime.now().strftime("%Y-%m-%d"),
        "valid_until": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
        "coverage_details": {
            "crop_failure": coverage_amount * 0.8,
            "weather_damage": coverage_amount * 0.6,
            "pest_disease": coverage_amount * 0.4
        }
    }
    
    return quote

# Initialize with sample data
@app.on_event("startup")
async def startup_event():
    """Initialize database with sample farm plots"""
    plots_collection = db.farm_plots
    
    # Check if sample data already exists
    existing_plots = await plots_collection.count_documents({})
    
    if existing_plots == 0:
        sample_plots = [
            {
                "id": str(uuid.uuid4()),
                "farm_name": "Green Valley Farm",
                "location": "Iowa, USA",
                "area_acres": 120.5,
                "crop_type": "Corn",
                "planting_date": "2024-04-15",
                "coordinates": {"lat": 41.5868, "lng": -93.6250},
                "owner_name": "John Smith",
                "owner_email": "john.smith@email.com"
            },
            {
                "id": str(uuid.uuid4()),
                "farm_name": "Sunrise Wheat Fields",
                "location": "Nebraska, USA",
                "area_acres": 85.3,
                "crop_type": "Wheat",
                "planting_date": "2024-03-20",
                "coordinates": {"lat": 41.4925, "lng": -99.9018},
                "owner_name": "Mary Johnson",
                "owner_email": "mary.johnson@email.com"
            },
            {
                "id": str(uuid.uuid4()),
                "farm_name": "Prairie Soybean Co",
                "location": "Illinois, USA", 
                "area_acres": 95.7,
                "crop_type": "Soybean",
                "planting_date": "2024-05-10",
                "coordinates": {"lat": 40.6331, "lng": -89.3985},
                "owner_name": "Robert Davis",
                "owner_email": "robert.davis@email.com"
            },
            {
                "id": str(uuid.uuid4()),
                "farm_name": "Golden Harvest Farms",
                "location": "Kansas, USA",
                "area_acres": 150.2,
                "crop_type": "Corn",
                "planting_date": "2024-04-22",
                "coordinates": {"lat": 38.5267, "lng": -96.7265},
                "owner_name": "Sarah Wilson",
                "owner_email": "sarah.wilson@email.com"
            },
            {
                "id": str(uuid.uuid4()),
                "farm_name": "Riverside Agriculture",
                "location": "Missouri, USA",
                "area_acres": 75.8,
                "crop_type": "Wheat",
                "planting_date": "2024-03-28",
                "coordinates": {"lat": 38.4623, "lng": -92.3020},
                "owner_name": "Michael Brown",
                "owner_email": "michael.brown@email.com"
            }
        ]
        
        await plots_collection.insert_many(sample_plots)
        print("Sample farm plots initialized successfully!")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)