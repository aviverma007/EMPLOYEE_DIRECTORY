import os
import csv
import requests
import base64
import io
from typing import List, Dict, Optional
from datetime import datetime
from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
import uuid
import random
from PIL import Image

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'employee_directory')

try:
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    employees_collection = db.employees
    images_collection = db.employee_images
    print(f"✅ Connected to MongoDB: {DB_NAME}")
except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")
    client = None
    db = None

# Google Sheets CSV URL
SHEETS_CSV_URL = "https://docs.google.com/spreadsheets/d/1z5MgsofbAdxCBlNY2wg1FBLap8lu-yk9/export?format=csv"

# In-memory storage for employee data
employees_data = []

# Updated Column mapping - changed grade to designation, added extension number
COLUMN_MAPPING = {
    'EMP ID': 'emp_code',
    'EMP NAME': 'emp_name', 
    'DEPARTMENT': 'department',
    'LOCATION': 'location',
    'GRADE': 'designation',  # Changed from 'grade' to 'designation'
    'MOBILE': 'mobile',
    'EXTENSION NUMBER': 'extension_number',
    'EMAIL': 'email',
    'JOINING DATE': 'joining_date',
    'IMAGE': 'image_url',
    'REPORTING MANAGER': 'reporting_manager'
}

class Employee(BaseModel):
    emp_code: str
    emp_name: str
    department: str
    location: str
    designation: str  # Changed from grade to designation
    mobile: str
    extension_number: Optional[str] = None
    email: Optional[str] = None
    joining_date: Optional[str] = None
    image_url: Optional[str] = None
    reporting_manager: Optional[str] = None

class EmployeeImage(BaseModel):
    emp_code: str
    image_data: str  # base64 encoded image
    image_type: str  # image/jpeg, image/png, etc.
    uploaded_at: str

class ImageUploadResponse(BaseModel):
    success: bool
    message: str
    image_url: Optional[str] = None

class AttendanceRecord(BaseModel):
    emp_code: str
    emp_name: str
    date: str
    check_in: str
    check_out: Optional[str] = None
    status: str
    hours_worked: Optional[float] = None

def validate_image(file_content: bytes, max_size_mb: int = 5) -> tuple[bool, str]:
    """Validate uploaded image file"""
    try:
        # Check file size
        if len(file_content) > max_size_mb * 1024 * 1024:
            return False, f"File size too large. Maximum {max_size_mb}MB allowed."
        
        # Validate image format
        image = Image.open(io.BytesIO(file_content))
        if image.format not in ['JPEG', 'PNG', 'GIF', 'WEBP']:
            return False, "Invalid image format. Only JPEG, PNG, GIF, and WEBP are allowed."
        
        return True, "Valid image"
    except Exception as e:
        return False, f"Invalid image file: {str(e)}"

def get_employee_image_from_db(emp_code: str) -> Optional[str]:
    """Get employee image from MongoDB"""
    if images_collection is None:
        return None
    
    try:
        image_doc = images_collection.find_one({"emp_code": emp_code})
        if image_doc:
            return f"data:{image_doc['image_type']};base64,{image_doc['image_data']}"
        return None
    except Exception as e:
        print(f"Error fetching image for {emp_code}: {e}")
        return None

def save_employee_image_to_db(emp_code: str, image_data: str, image_type: str) -> bool:
    """Save employee image to MongoDB"""
    if images_collection is None:
        return False
    
    try:
        image_doc = {
            "emp_code": emp_code,
            "image_data": image_data,
            "image_type": image_type,
            "uploaded_at": datetime.now().isoformat()
        }
        
        # Use upsert to replace existing image
        images_collection.replace_one(
            {"emp_code": emp_code}, 
            image_doc, 
            upsert=True
        )
        return True
    except Exception as e:
        print(f"Error saving image for {emp_code}: {e}")
        return False

def delete_employee_image_from_db(emp_code: str) -> bool:
    """Delete employee image from MongoDB"""
    if images_collection is None:
        return False
    
    try:
        result = images_collection.delete_one({"emp_code": emp_code})
        return result.deleted_count > 0
    except Exception as e:
        print(f"Error deleting image for {emp_code}: {e}")
        return False

def fetch_employee_data():
    """Fetch employee data from Google Sheets"""
    global employees_data
    try:
        response = requests.get(SHEETS_CSV_URL)
        response.raise_for_status()
        
        # Parse CSV data
        csv_data = response.text.strip()
        lines = csv_data.split('\n')
        
        if not lines:
            return
        
        # Get headers
        headers = [h.strip() for h in lines[0].split(',')]
        employees_data = []
        
        # Process each row
        for line in lines[1:]:
            if not line.strip():
                continue
                
            values = [v.strip() for v in line.split(',')]
            employee = {}
            
            # Map columns to our schema
            for i, header in enumerate(headers):
                if i < len(values) and header in COLUMN_MAPPING:
                    employee[COLUMN_MAPPING[header]] = values[i]
            
            # Ensure all required fields exist (changed grade to designation, added extension_number)
            required_fields = ['emp_code', 'emp_name', 'department', 'location', 'designation', 'mobile']
            if all(field in employee for field in required_fields):
                employees_data.append(employee)
                
        print(f"Loaded {len(employees_data)} employees from Google Sheets")
        
    except Exception as e:
        print(f"Error fetching employee data: {e}")
        # Use sample data if Google Sheets fails (changed grade to designation)
        employees_data = [
            {
                "emp_code": "81096",
                "emp_name": "ANIRUDH VERMA",
                "department": "IT",
                "location": "IFC",
                "designation": "IT EXECUTIVE",  # Changed from grade
                "mobile": "8929987500",
                "email": "anirudh.verma@company.com",
                "joining_date": "2023-03-15",
                "reporting_manager": "CHANDAN"
            },
            {
                "emp_code": "80957",
                "emp_name": "BINAY KUMAR",
                "department": "IT",
                "location": "IFC",
                "designation": "IT EXECUTIVE",  # Changed from grade
                "mobile": "8929987500",
                "email": "binay.kumar@company.com",
                "joining_date": "2023-01-10",
                "reporting_manager": "CHANDAN"
            },
            {
                "emp_code": "80176",
                "emp_name": "NEERAJ KALRA",
                "department": "IT",
                "location": "IFC",
                "designation": "SENIOR MANAGER",  # Changed from grade
                "mobile": "8929987500",
                "email": "neeraj.kalra@company.com",
                "joining_date": "2022-08-20",
                "reporting_manager": "NITIN GUPTA"
            },
            {
                "emp_code": "00001",
                "emp_name": "NITIN GUPTA",
                "department": "IT",
                "location": "IFC",
                "designation": "AVP",  # Changed from grade
                "mobile": "8929987500",
                "email": "nitin.gupta@company.com",
                "joining_date": "2020-05-12",
                "reporting_manager": "HARI"
            },
            {
                "emp_code": "00002",
                "emp_name": "CHANDAN",
                "department": "IT",
                "location": "IFC",
                "designation": "SENIOR MANAGER",  # Changed from grade
                "mobile": "8929987500",
                "email": "chandan@company.com",
                "joining_date": "2021-11-05",
                "reporting_manager": "RANJEET SARKAR"
            }
        ]

def generate_today_attendance(emp_code: str, emp_name: str) -> AttendanceRecord:
    """Generate mock attendance data for today"""
    today = datetime.now().strftime("%Y-%m-%d")
    
    # Generate random attendance data
    statuses = ["Present", "Late", "Half Day", "Absent"]
    status = random.choice(statuses)
    
    if status == "Absent":
        return AttendanceRecord(
            emp_code=emp_code,
            emp_name=emp_name,
            date=today,
            check_in="",
            check_out="",
            status=status,
            hours_worked=0
        )
    
    # Generate check-in time
    check_in_hour = random.randint(8, 10)
    check_in_min = random.randint(0, 59)
    check_in = f"{check_in_hour:02d}:{check_in_min:02d}"
    
    check_out = None
    hours_worked = None
    
    if status != "Half Day":
        # Generate check-out time
        check_out_hour = random.randint(17, 20)
        check_out_min = random.randint(0, 59)
        check_out = f"{check_out_hour:02d}:{check_out_min:02d}"
        
        # Calculate hours worked
        hours_worked = (check_out_hour - check_in_hour) + (check_out_min - check_in_min) / 60
        hours_worked = round(hours_worked, 1)
    else:
        hours_worked = 4.0
    
    return AttendanceRecord(
        emp_code=emp_code,
        emp_name=emp_name,
        date=today,
        check_in=check_in,
        check_out=check_out,
        status=status,
        hours_worked=hours_worked
    )

@app.on_event("startup")
async def startup_event():
    """Load employee data on startup"""
    fetch_employee_data()

@app.get("/api/employees")
async def get_all_employees():
    """Get all employees with their images"""
    enriched_employees = []
    for emp in employees_data:
        emp_copy = emp.copy()
        # Add image URL if available
        image_url = get_employee_image_from_db(emp['emp_code'])
        if image_url:
            emp_copy['image_url'] = image_url
        enriched_employees.append(emp_copy)
    
    return {"employees": enriched_employees}

@app.get("/api/employees/search")
async def search_employees(q: str = "", field: str = ""):
    """Enhanced search employees with improved suggestions and filtering"""
    if not q:
        # Return all employees and some sample suggestions for the field
        suggestions = []
        if field and field in ['emp_code', 'emp_name', 'department', 'location', 'designation', 'mobile', 'extension_number', 'email']:
            # Get first 10 unique values for suggestions, but prioritize them for uniqueness
            field_values = set()
            for emp in employees_data:
                if field in emp and emp[field]:
                    field_values.add(emp[field])
            suggestions = sorted(list(field_values))[:10]
        
        # Return employees with images
        enriched_employees = []
        for emp in employees_data:
            emp_copy = emp.copy()
            image_url = get_employee_image_from_db(emp['emp_code'])
            if image_url:
                emp_copy['image_url'] = image_url
            enriched_employees.append(emp_copy)
        
        return {"suggestions": suggestions, "employees": enriched_employees}
    
    q = q.lower()
    suggestions = []
    matching_employees = []
    
    # Enhanced search with email, extension_number and joining_date included
    searchable_fields = ['emp_code', 'emp_name', 'department', 'location', 'designation', 'mobile', 'extension_number', 'email']
    
    if field and field in searchable_fields:
        # Get unique values for dropdown suggestions with better uniqueness handling
        field_values = set()
        unique_matches = {}  # Track which employees have which field values
        
        for emp in employees_data:
            if field in emp and emp[field]:
                field_value = emp[field]
                field_values.add(field_value)
                
                # Track the first employee for each unique field value
                if field_value not in unique_matches:
                    unique_matches[field_value] = emp
        
        # Enhanced suggestions: show both "starts with" and "contains" results
        starts_with = [val for val in field_values if val.lower().startswith(q)]
        contains = [val for val in field_values if q in val.lower() and not val.lower().startswith(q)]
        
        # Prioritize "starts with" matches, then "contains" matches
        suggestions = sorted(starts_with) + sorted(contains)
        suggestions = suggestions[:10]  # Limit to 10 suggestions
        
        # Get matching employees - but ensure we return the right ones
        for emp in employees_data:
            if field in emp and emp[field]:
                field_value = emp[field].lower()
                if q in field_value:
                    matching_employees.append(emp)
    else:
        # Global search across all fields
        for emp in employees_data:
            match = False
            for key, value in emp.items():
                if value and q in str(value).lower():
                    match = True
                    break
            if match:
                matching_employees.append(emp)
    
    # Add images to matching employees
    enriched_matching = []
    for emp in matching_employees:
        emp_copy = emp.copy()
        image_url = get_employee_image_from_db(emp['emp_code'])
        if image_url:
            emp_copy['image_url'] = image_url
        enriched_matching.append(emp_copy)
    
    return {
        "suggestions": suggestions,
        "employees": enriched_matching
    }

@app.get("/api/employees/filter")
async def filter_employees(
    emp_code: str = "",
    emp_name: str = "",
    department: str = "",
    location: str = "",
    designation: str = "",  # Changed from grade to designation
    mobile: str = "",
    extension_number: str = "",
    email: str = ""
):
    """Filter employees by multiple criteria (changed grade to designation, added extension_number)"""
    filtered_employees = employees_data.copy()
    
    filters = {
        'emp_code': emp_code,
        'emp_name': emp_name,
        'department': department,
        'location': location,
        'designation': designation,  # Changed from grade
        'mobile': mobile,
        'extension_number': extension_number,
        'email': email
    }
    
    for field, value in filters.items():
        if value:
            filtered_employees = [
                emp for emp in filtered_employees 
                if emp.get(field, "").lower() == value.lower()
            ]
    
    # Add images to filtered employees
    enriched_filtered = []
    for emp in filtered_employees:
        emp_copy = emp.copy()
        image_url = get_employee_image_from_db(emp['emp_code'])
        if image_url:
            emp_copy['image_url'] = image_url
        enriched_filtered.append(emp_copy)
    
    return {"employees": enriched_filtered}

@app.get("/api/employees/{emp_code}/attendance")
async def get_employee_attendance(emp_code: str):
    """Get today's attendance for a specific employee"""
    # Find employee
    employee = None
    for emp in employees_data:
        if emp['emp_code'] == emp_code:
            employee = emp
            break
    
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Generate today's attendance
    attendance = generate_today_attendance(emp_code, employee['emp_name'])
    
    return {"attendance": attendance}

@app.get("/api/department/{department_name}/employees")
async def get_department_employees(department_name: str):
    """Get all employees in a specific department"""
    dept_employees = [
        emp for emp in employees_data 
        if emp.get('department', '').lower() == department_name.lower()
    ]
    
    return {"employees": dept_employees, "department": department_name, "count": len(dept_employees)}

@app.get("/api/field-values")
async def get_field_values():
    """Get all unique values for each searchable field (changed grades to designations, added extension_numbers)"""
    field_values = {
        'departments': list(set(emp.get('department', '') for emp in employees_data if emp.get('department'))),
        'locations': list(set(emp.get('location', '') for emp in employees_data if emp.get('location'))),
        'designations': list(set(emp.get('designation', '') for emp in employees_data if emp.get('designation'))),  # Changed from grades
        'emp_codes': list(set(emp.get('emp_code', '') for emp in employees_data if emp.get('emp_code'))),
        'emp_names': list(set(emp.get('emp_name', '') for emp in employees_data if emp.get('emp_name'))),
        'mobiles': list(set(emp.get('mobile', '') for emp in employees_data if emp.get('mobile'))),
        'extension_numbers': list(set(emp.get('extension_number', '') for emp in employees_data if emp.get('extension_number'))),
        'emails': list(set(emp.get('email', '') for emp in employees_data if emp.get('email')))
    }
    
    return field_values

@app.post("/api/refresh-data")
async def refresh_employee_data():
    """Manually refresh employee data from Google Sheets"""
    fetch_employee_data()
    return {"message": f"Data refreshed successfully. Loaded {len(employees_data)} employees."}

@app.post("/api/employees/{emp_code}/image")
async def upload_employee_image(emp_code: str, file: UploadFile = File(...)):
    """Upload employee image"""
    # Check if employee exists
    employee = None
    for emp in employees_data:
        if emp['emp_code'] == emp_code:
            employee = emp
            break
    
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Validate image
        is_valid, message = validate_image(file_content)
        if not is_valid:
            raise HTTPException(status_code=400, detail=message)
        
        # Convert to base64
        image_base64 = base64.b64encode(file_content).decode('utf-8')
        
        # Save to database
        success = save_employee_image_to_db(emp_code, image_base64, file.content_type)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to save image to database")
        
        # Return success response
        image_url = f"data:{file.content_type};base64,{image_base64}"
        return ImageUploadResponse(
            success=True,
            message="Image uploaded successfully",
            image_url=image_url
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@app.get("/api/employees/{emp_code}/image")
async def get_employee_image(emp_code: str):
    """Get employee image"""
    # Check if employee exists
    employee = None
    for emp in employees_data:
        if emp['emp_code'] == emp_code:
            employee = emp
            break
    
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    image_url = get_employee_image_from_db(emp_code)
    if not image_url:
        raise HTTPException(status_code=404, detail="Image not found")
    
    return {"image_url": image_url}

@app.delete("/api/employees/{emp_code}/image")
async def delete_employee_image(emp_code: str):
    """Delete employee image"""
    # Check if employee exists
    employee = None
    for emp in employees_data:
        if emp['emp_code'] == emp_code:
            employee = emp
            break
    
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    success = delete_employee_image_from_db(emp_code)
    if not success:
        raise HTTPException(status_code=404, detail="Image not found")
    
    return {"success": True, "message": "Image deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)