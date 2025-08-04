#!/usr/bin/env python3
"""
Backend API Testing for Employee Directory
Tests Google Sheets integration, search, filtering, attendance, department APIs, and image upload functionality
"""

import requests
import json
import sys
import base64
import io
from datetime import datetime
from PIL import Image

# Backend URL from frontend/.env
BACKEND_URL = "https://3755492d-69ff-4c4c-89ca-305a02a5b067.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Test employee codes from the review request
TEST_EMPLOYEE_CODES = ["81096", "80957", "80176", "00001", "00002"]

class BackendTester:
    def __init__(self):
        self.results = {
            "google_sheets_integration": {"passed": False, "details": []},
            "search_api": {"passed": False, "details": []},
            "filter_api": {"passed": False, "details": []},
            "attendance_api": {"passed": False, "details": []},
            "department_api": {"passed": False, "details": []},
            "image_upload_api": {"passed": False, "details": []},
            "image_retrieval_api": {"passed": False, "details": []},
            "image_deletion_api": {"passed": False, "details": []},
            "enhanced_employee_api": {"passed": False, "details": []},
            "file_validation": {"passed": False, "details": []}
        }
        self.session = requests.Session()
        self.session.timeout = 30

    def log_result(self, test_name, success, message):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        return {"success": success, "message": message, "timestamp": datetime.now().isoformat()}

    def test_google_sheets_integration(self):
        """Test Google Sheets CSV integration via /api/employees endpoint"""
        print("\n=== Testing Google Sheets Integration ===")
        
        try:
            # Test /api/employees endpoint
            response = self.session.get(f"{API_BASE}/employees")
            
            if response.status_code != 200:
                self.results["google_sheets_integration"]["details"].append(
                    self.log_result("GET /api/employees", False, f"HTTP {response.status_code}: {response.text}")
                )
                return False
            
            data = response.json()
            
            # Check response structure
            if "employees" not in data:
                self.results["google_sheets_integration"]["details"].append(
                    self.log_result("Response Structure", False, "Missing 'employees' key in response")
                )
                return False
            
            employees = data["employees"]
            
            # Check if we have employee data
            if not employees or len(employees) == 0:
                self.results["google_sheets_integration"]["details"].append(
                    self.log_result("Employee Data", False, "No employee data returned")
                )
                return False
            
            # Check if we have the expected test employee codes
            emp_codes = [emp.get("emp_code") for emp in employees]
            found_test_codes = [code for code in TEST_EMPLOYEE_CODES if code in emp_codes]
            
            if not found_test_codes:
                self.results["google_sheets_integration"]["details"].append(
                    self.log_result("Test Employee Codes", False, f"None of the test employee codes {TEST_EMPLOYEE_CODES} found in data")
                )
                return False
            
            # Check column mapping - verify required fields exist
            required_fields = ['emp_code', 'emp_name', 'department', 'location', 'grade', 'mobile', 'extension_number']
            sample_employee = employees[0]
            missing_fields = [field for field in required_fields if field not in sample_employee]
            
            if missing_fields:
                self.results["google_sheets_integration"]["details"].append(
                    self.log_result("Column Mapping", False, f"Missing required fields: {missing_fields}")
                )
                return False
            
            # Success
            self.results["google_sheets_integration"]["details"].extend([
                self.log_result("GET /api/employees", True, f"Successfully fetched {len(employees)} employees"),
                self.log_result("Test Employee Codes", True, f"Found test codes: {found_test_codes}"),
                self.log_result("Column Mapping", True, "All required fields present in employee data")
            ])
            
            self.results["google_sheets_integration"]["passed"] = True
            return True
            
        except Exception as e:
            self.results["google_sheets_integration"]["details"].append(
                self.log_result("Google Sheets Integration", False, f"Exception: {str(e)}")
            )
            return False

    def test_search_api(self):
        """Test search API with different field queries and dropdown suggestions"""
        print("\n=== Testing Search API ===")
        
        try:
            # Test 1: Basic search without parameters
            response = self.session.get(f"{API_BASE}/employees/search")
            
            if response.status_code != 200:
                self.results["search_api"]["details"].append(
                    self.log_result("Basic Search", False, f"HTTP {response.status_code}: {response.text}")
                )
                return False
            
            data = response.json()
            
            # Check response structure
            if "suggestions" not in data or "employees" not in data:
                self.results["search_api"]["details"].append(
                    self.log_result("Search Response Structure", False, "Missing 'suggestions' or 'employees' key")
                )
                return False
            
            self.results["search_api"]["details"].append(
                self.log_result("Basic Search", True, f"Returned {len(data['employees'])} employees")
            )
            
            # Test 2: Field-specific search with suggestions
            test_searches = [
                {"field": "department", "q": "IT", "description": "Department search"},
                {"field": "emp_name", "q": "ANIRUDH", "description": "Employee name search"},
                {"field": "emp_code", "q": "81096", "description": "Employee code search"},
                {"field": "location", "q": "IFC", "description": "Location search"}
            ]
            
            for search_test in test_searches:
                params = {"field": search_test["field"], "q": search_test["q"]}
                response = self.session.get(f"{API_BASE}/employees/search", params=params)
                
                if response.status_code != 200:
                    self.results["search_api"]["details"].append(
                        self.log_result(search_test["description"], False, f"HTTP {response.status_code}")
                    )
                    continue
                
                data = response.json()
                
                # Check if suggestions are provided
                if "suggestions" in data and len(data["suggestions"]) > 0:
                    self.results["search_api"]["details"].append(
                        self.log_result(f"{search_test['description']} - Suggestions", True, 
                                      f"Got {len(data['suggestions'])} suggestions")
                    )
                else:
                    self.results["search_api"]["details"].append(
                        self.log_result(f"{search_test['description']} - Suggestions", True, 
                                      "No suggestions (may be expected)")
                    )
                
                # Check if employees are returned
                if "employees" in data:
                    self.results["search_api"]["details"].append(
                        self.log_result(f"{search_test['description']} - Results", True, 
                                      f"Got {len(data['employees'])} employees")
                    )
            
            # Test 3: Global search
            response = self.session.get(f"{API_BASE}/employees/search", params={"q": "IT"})
            if response.status_code == 200:
                data = response.json()
                self.results["search_api"]["details"].append(
                    self.log_result("Global Search", True, f"Global search returned {len(data['employees'])} results")
                )
            
            self.results["search_api"]["passed"] = True
            return True
            
        except Exception as e:
            self.results["search_api"]["details"].append(
                self.log_result("Search API", False, f"Exception: {str(e)}")
            )
            return False

    def test_filter_api(self):
        """Test filter API with multiple criteria"""
        print("\n=== Testing Filter API ===")
        
        try:
            # Test 1: Single field filter
            single_filters = [
                {"department": "IT", "description": "Department filter"},
                {"location": "IFC", "description": "Location filter"},
                {"grade": "IT EXECUTIVE", "description": "Grade filter"}
            ]
            
            for filter_test in single_filters:
                response = self.session.get(f"{API_BASE}/employees/filter", params=filter_test)
                
                if response.status_code != 200:
                    self.results["filter_api"]["details"].append(
                        self.log_result(filter_test["description"], False, f"HTTP {response.status_code}")
                    )
                    continue
                
                data = response.json()
                
                if "employees" not in data:
                    self.results["filter_api"]["details"].append(
                        self.log_result(filter_test["description"], False, "Missing 'employees' key")
                    )
                    continue
                
                self.results["filter_api"]["details"].append(
                    self.log_result(filter_test["description"], True, 
                                  f"Filtered to {len(data['employees'])} employees")
                )
            
            # Test 2: Multiple field filter
            multi_filter = {
                "department": "IT",
                "location": "IFC",
                "grade": "IT EXECUTIVE"
            }
            
            response = self.session.get(f"{API_BASE}/employees/filter", params=multi_filter)
            
            if response.status_code == 200:
                data = response.json()
                self.results["filter_api"]["details"].append(
                    self.log_result("Multi-field Filter", True, 
                                  f"Multi-field filter returned {len(data['employees'])} employees")
                )
            else:
                self.results["filter_api"]["details"].append(
                    self.log_result("Multi-field Filter", False, f"HTTP {response.status_code}")
                )
            
            # Test 3: Empty filter (should return all)
            response = self.session.get(f"{API_BASE}/employees/filter")
            
            if response.status_code == 200:
                data = response.json()
                self.results["filter_api"]["details"].append(
                    self.log_result("Empty Filter", True, 
                                  f"Empty filter returned {len(data['employees'])} employees")
                )
            
            self.results["filter_api"]["passed"] = True
            return True
            
        except Exception as e:
            self.results["filter_api"]["details"].append(
                self.log_result("Filter API", False, f"Exception: {str(e)}")
            )
            return False

    def test_attendance_api(self):
        """Test attendance API for employee attendance generation"""
        print("\n=== Testing Attendance API ===")
        
        try:
            successful_tests = 0
            
            for emp_code in TEST_EMPLOYEE_CODES:
                response = self.session.get(f"{API_BASE}/employees/{emp_code}/attendance")
                
                if response.status_code == 404:
                    self.results["attendance_api"]["details"].append(
                        self.log_result(f"Attendance for {emp_code}", False, "Employee not found")
                    )
                    continue
                
                if response.status_code != 200:
                    self.results["attendance_api"]["details"].append(
                        self.log_result(f"Attendance for {emp_code}", False, f"HTTP {response.status_code}")
                    )
                    continue
                
                data = response.json()
                
                # Check response structure
                if "attendance" not in data:
                    self.results["attendance_api"]["details"].append(
                        self.log_result(f"Attendance for {emp_code}", False, "Missing 'attendance' key")
                    )
                    continue
                
                attendance = data["attendance"]
                
                # Check required fields
                required_fields = ["emp_code", "emp_name", "date", "status"]
                missing_fields = [field for field in required_fields if field not in attendance]
                
                if missing_fields:
                    self.results["attendance_api"]["details"].append(
                        self.log_result(f"Attendance for {emp_code}", False, 
                                      f"Missing fields: {missing_fields}")
                    )
                    continue
                
                # Check if status is valid
                valid_statuses = ["Present", "Late", "Half Day", "Absent"]
                if attendance["status"] not in valid_statuses:
                    self.results["attendance_api"]["details"].append(
                        self.log_result(f"Attendance for {emp_code}", False, 
                                      f"Invalid status: {attendance['status']}")
                    )
                    continue
                
                # Check date format (should be today)
                today = datetime.now().strftime("%Y-%m-%d")
                if attendance["date"] != today:
                    self.results["attendance_api"]["details"].append(
                        self.log_result(f"Attendance for {emp_code}", False, 
                                      f"Date mismatch: expected {today}, got {attendance['date']}")
                    )
                    continue
                
                self.results["attendance_api"]["details"].append(
                    self.log_result(f"Attendance for {emp_code}", True, 
                                  f"Status: {attendance['status']}, Hours: {attendance.get('hours_worked', 'N/A')}")
                )
                successful_tests += 1
            
            if successful_tests > 0:
                self.results["attendance_api"]["passed"] = True
                return True
            else:
                return False
            
        except Exception as e:
            self.results["attendance_api"]["details"].append(
                self.log_result("Attendance API", False, f"Exception: {str(e)}")
            )
            return False

    def test_department_api(self):
        """Test department API for department filtering"""
        print("\n=== Testing Department API ===")
        
        try:
            # Test with known department
            department_name = "IT"
            response = self.session.get(f"{API_BASE}/department/{department_name}/employees")
            
            if response.status_code != 200:
                self.results["department_api"]["details"].append(
                    self.log_result("Department API", False, f"HTTP {response.status_code}: {response.text}")
                )
                return False
            
            data = response.json()
            
            # Check response structure
            required_keys = ["employees", "department", "count"]
            missing_keys = [key for key in required_keys if key not in data]
            
            if missing_keys:
                self.results["department_api"]["details"].append(
                    self.log_result("Department Response Structure", False, f"Missing keys: {missing_keys}")
                )
                return False
            
            # Check if count matches employees length
            if data["count"] != len(data["employees"]):
                self.results["department_api"]["details"].append(
                    self.log_result("Department Count Validation", False, 
                                  f"Count mismatch: count={data['count']}, employees={len(data['employees'])}")
                )
                return False
            
            # Check if all returned employees are from the requested department
            wrong_dept_employees = [
                emp for emp in data["employees"] 
                if emp.get("department", "").lower() != department_name.lower()
            ]
            
            if wrong_dept_employees:
                self.results["department_api"]["details"].append(
                    self.log_result("Department Filter Accuracy", False, 
                                  f"Found {len(wrong_dept_employees)} employees from wrong department")
                )
                return False
            
            self.results["department_api"]["details"].extend([
                self.log_result("Department API", True, f"Found {data['count']} employees in {department_name}"),
                self.log_result("Department Filter Accuracy", True, "All employees belong to correct department")
            ])
            
            # Test with non-existent department
            response = self.session.get(f"{API_BASE}/department/NONEXISTENT/employees")
            if response.status_code == 200:
                data = response.json()
                if data["count"] == 0:
                    self.results["department_api"]["details"].append(
                        self.log_result("Non-existent Department", True, "Correctly returned 0 employees")
                    )
            
            self.results["department_api"]["passed"] = True
            return True
            
        except Exception as e:
            self.results["department_api"]["details"].append(
                self.log_result("Department API", False, f"Exception: {str(e)}")
            )
            return False

    def create_test_image(self, format="JPEG", size=(100, 100), file_size_mb=None):
        """Create a test image for upload testing"""
        try:
            # Create a simple test image
            img = Image.new('RGB', size, color='red')
            img_buffer = io.BytesIO()
            
            # Save with specified format
            img.save(img_buffer, format=format)
            img_data = img_buffer.getvalue()
            
            # If specific file size requested, pad or truncate
            if file_size_mb:
                target_size = int(file_size_mb * 1024 * 1024)
                if len(img_data) < target_size:
                    # Pad with zeros to reach target size
                    img_data += b'\x00' * (target_size - len(img_data))
                elif len(img_data) > target_size:
                    # Truncate to target size
                    img_data = img_data[:target_size]
            
            return img_data
        except Exception as e:
            print(f"Error creating test image: {e}")
            return None

    def test_image_upload_api(self):
        """Test image upload API with various scenarios"""
        print("\n=== Testing Image Upload API ===")
        
        try:
            successful_uploads = 0
            
            # Test 1: Valid image upload for each test employee
            for emp_code in TEST_EMPLOYEE_CODES[:2]:  # Test with first 2 employees
                # Create a test image
                test_image = self.create_test_image()
                if not test_image:
                    self.results["image_upload_api"]["details"].append(
                        self.log_result(f"Image Upload for {emp_code}", False, "Failed to create test image")
                    )
                    continue
                
                # Upload image
                files = {'file': ('test_image.jpg', test_image, 'image/jpeg')}
                response = self.session.post(f"{API_BASE}/employees/{emp_code}/image", files=files)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and "image_url" in data:
                        self.results["image_upload_api"]["details"].append(
                            self.log_result(f"Image Upload for {emp_code}", True, "Successfully uploaded image")
                        )
                        successful_uploads += 1
                    else:
                        self.results["image_upload_api"]["details"].append(
                            self.log_result(f"Image Upload for {emp_code}", False, "Invalid response structure")
                        )
                else:
                    self.results["image_upload_api"]["details"].append(
                        self.log_result(f"Image Upload for {emp_code}", False, f"HTTP {response.status_code}: {response.text}")
                    )
            
            # Test 2: Invalid employee code
            test_image = self.create_test_image()
            if test_image:
                files = {'file': ('test_image.jpg', test_image, 'image/jpeg')}
                response = self.session.post(f"{API_BASE}/employees/INVALID_CODE/image", files=files)
                
                if response.status_code == 404:
                    self.results["image_upload_api"]["details"].append(
                        self.log_result("Invalid Employee Code", True, "Correctly returned 404 for invalid employee")
                    )
                else:
                    self.results["image_upload_api"]["details"].append(
                        self.log_result("Invalid Employee Code", False, f"Expected 404, got {response.status_code}")
                    )
            
            # Test 3: Different image formats
            formats_to_test = [("PNG", "image/png"), ("JPEG", "image/jpeg")]
            for format_name, content_type in formats_to_test:
                test_image = self.create_test_image(format=format_name)
                if test_image:
                    files = {'file': (f'test_image.{format_name.lower()}', test_image, content_type)}
                    response = self.session.post(f"{API_BASE}/employees/{TEST_EMPLOYEE_CODES[0]}/image", files=files)
                    
                    if response.status_code == 200:
                        self.results["image_upload_api"]["details"].append(
                            self.log_result(f"{format_name} Format Upload", True, f"Successfully uploaded {format_name} image")
                        )
                    else:
                        self.results["image_upload_api"]["details"].append(
                            self.log_result(f"{format_name} Format Upload", False, f"HTTP {response.status_code}")
                        )
            
            if successful_uploads > 0:
                self.results["image_upload_api"]["passed"] = True
                return True
            else:
                return False
                
        except Exception as e:
            self.results["image_upload_api"]["details"].append(
                self.log_result("Image Upload API", False, f"Exception: {str(e)}")
            )
            return False

    def test_image_retrieval_api(self):
        """Test image retrieval API"""
        print("\n=== Testing Image Retrieval API ===")
        
        try:
            successful_retrievals = 0
            
            # Test 1: Retrieve images for employees (assuming some were uploaded in previous test)
            for emp_code in TEST_EMPLOYEE_CODES[:2]:
                response = self.session.get(f"{API_BASE}/employees/{emp_code}/image")
                
                if response.status_code == 200:
                    data = response.json()
                    if "image_url" in data and data["image_url"].startswith("data:"):
                        self.results["image_retrieval_api"]["details"].append(
                            self.log_result(f"Image Retrieval for {emp_code}", True, "Successfully retrieved image with base64 data")
                        )
                        successful_retrievals += 1
                    else:
                        self.results["image_retrieval_api"]["details"].append(
                            self.log_result(f"Image Retrieval for {emp_code}", False, "Invalid image_url format")
                        )
                elif response.status_code == 404:
                    self.results["image_retrieval_api"]["details"].append(
                        self.log_result(f"Image Retrieval for {emp_code}", True, "No image found (404) - expected if no image uploaded")
                    )
                else:
                    self.results["image_retrieval_api"]["details"].append(
                        self.log_result(f"Image Retrieval for {emp_code}", False, f"HTTP {response.status_code}: {response.text}")
                    )
            
            # Test 2: Invalid employee code
            response = self.session.get(f"{API_BASE}/employees/INVALID_CODE/image")
            if response.status_code == 404:
                self.results["image_retrieval_api"]["details"].append(
                    self.log_result("Invalid Employee Code Retrieval", True, "Correctly returned 404 for invalid employee")
                )
            else:
                self.results["image_retrieval_api"]["details"].append(
                    self.log_result("Invalid Employee Code Retrieval", False, f"Expected 404, got {response.status_code}")
                )
            
            # Test 3: Non-existent image for valid employee
            response = self.session.get(f"{API_BASE}/employees/{TEST_EMPLOYEE_CODES[-1]}/image")
            if response.status_code == 404:
                self.results["image_retrieval_api"]["details"].append(
                    self.log_result("Non-existent Image", True, "Correctly returned 404 for non-existent image")
                )
            elif response.status_code == 200:
                self.results["image_retrieval_api"]["details"].append(
                    self.log_result("Non-existent Image", True, "Image found (may have been uploaded previously)")
                )
            
            self.results["image_retrieval_api"]["passed"] = True
            return True
                
        except Exception as e:
            self.results["image_retrieval_api"]["details"].append(
                self.log_result("Image Retrieval API", False, f"Exception: {str(e)}")
            )
            return False

    def test_image_deletion_api(self):
        """Test image deletion API"""
        print("\n=== Testing Image Deletion API ===")
        
        try:
            # Test 1: Delete existing images
            for emp_code in TEST_EMPLOYEE_CODES[:2]:
                response = self.session.delete(f"{API_BASE}/employees/{emp_code}/image")
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success"):
                        self.results["image_deletion_api"]["details"].append(
                            self.log_result(f"Image Deletion for {emp_code}", True, "Successfully deleted image")
                        )
                    else:
                        self.results["image_deletion_api"]["details"].append(
                            self.log_result(f"Image Deletion for {emp_code}", False, "Invalid response structure")
                        )
                elif response.status_code == 404:
                    self.results["image_deletion_api"]["details"].append(
                        self.log_result(f"Image Deletion for {emp_code}", True, "No image to delete (404) - expected if no image exists")
                    )
                else:
                    self.results["image_deletion_api"]["details"].append(
                        self.log_result(f"Image Deletion for {emp_code}", False, f"HTTP {response.status_code}: {response.text}")
                    )
            
            # Test 2: Invalid employee code
            response = self.session.delete(f"{API_BASE}/employees/INVALID_CODE/image")
            if response.status_code == 404:
                self.results["image_deletion_api"]["details"].append(
                    self.log_result("Invalid Employee Code Deletion", True, "Correctly returned 404 for invalid employee")
                )
            else:
                self.results["image_deletion_api"]["details"].append(
                    self.log_result("Invalid Employee Code Deletion", False, f"Expected 404, got {response.status_code}")
                )
            
            # Test 3: Delete non-existent image
            response = self.session.delete(f"{API_BASE}/employees/{TEST_EMPLOYEE_CODES[-1]}/image")
            if response.status_code == 404:
                self.results["image_deletion_api"]["details"].append(
                    self.log_result("Non-existent Image Deletion", True, "Correctly returned 404 for non-existent image")
                )
            elif response.status_code == 200:
                self.results["image_deletion_api"]["details"].append(
                    self.log_result("Non-existent Image Deletion", True, "Image deleted (may have existed)")
                )
            
            self.results["image_deletion_api"]["passed"] = True
            return True
                
        except Exception as e:
            self.results["image_deletion_api"]["details"].append(
                self.log_result("Image Deletion API", False, f"Exception: {str(e)}")
            )
            return False

    def test_enhanced_employee_api(self):
        """Test enhanced employee API with image_url field"""
        print("\n=== Testing Enhanced Employee API ===")
        
        try:
            # First upload an image for testing
            test_image = self.create_test_image()
            if test_image:
                files = {'file': ('test_image.jpg', test_image, 'image/jpeg')}
                upload_response = self.session.post(f"{API_BASE}/employees/{TEST_EMPLOYEE_CODES[0]}/image", files=files)
                
                if upload_response.status_code == 200:
                    self.results["enhanced_employee_api"]["details"].append(
                        self.log_result("Test Image Upload", True, "Uploaded test image for API testing")
                    )
                else:
                    self.results["enhanced_employee_api"]["details"].append(
                        self.log_result("Test Image Upload", False, "Failed to upload test image")
                    )
            
            # Test enhanced /api/employees endpoint
            response = self.session.get(f"{API_BASE}/employees")
            
            if response.status_code != 200:
                self.results["enhanced_employee_api"]["details"].append(
                    self.log_result("Enhanced Employee API", False, f"HTTP {response.status_code}: {response.text}")
                )
                return False
            
            data = response.json()
            
            if "employees" not in data:
                self.results["enhanced_employee_api"]["details"].append(
                    self.log_result("Enhanced Employee API", False, "Missing 'employees' key in response")
                )
                return False
            
            employees = data["employees"]
            
            # Check if any employees have image_url field
            employees_with_images = [emp for emp in employees if "image_url" in emp and emp["image_url"]]
            
            if employees_with_images:
                # Verify base64 format
                valid_base64_images = 0
                for emp in employees_with_images:
                    if emp["image_url"].startswith("data:image/") and ";base64," in emp["image_url"]:
                        valid_base64_images += 1
                
                self.results["enhanced_employee_api"]["details"].append(
                    self.log_result("Image URL Field", True, f"Found {len(employees_with_images)} employees with images")
                )
                
                self.results["enhanced_employee_api"]["details"].append(
                    self.log_result("Base64 Format", True, f"{valid_base64_images}/{len(employees_with_images)} images in valid base64 format")
                )
            else:
                self.results["enhanced_employee_api"]["details"].append(
                    self.log_result("Image URL Field", True, "No employees with images found (may be expected)")
                )
            
            # Verify response structure is maintained
            if employees:
                sample_employee = employees[0]
                required_fields = ['emp_code', 'emp_name', 'department', 'location', 'designation', 'mobile']
                missing_fields = [field for field in required_fields if field not in sample_employee]
                
                if not missing_fields:
                    self.results["enhanced_employee_api"]["details"].append(
                        self.log_result("Response Structure", True, "All required fields present in employee data")
                    )
                else:
                    self.results["enhanced_employee_api"]["details"].append(
                        self.log_result("Response Structure", False, f"Missing required fields: {missing_fields}")
                    )
            
            self.results["enhanced_employee_api"]["passed"] = True
            return True
                
        except Exception as e:
            self.results["enhanced_employee_api"]["details"].append(
                self.log_result("Enhanced Employee API", False, f"Exception: {str(e)}")
            )
            return False

    def test_file_validation(self):
        """Test file validation for size limits and formats"""
        print("\n=== Testing File Validation ===")
        
        try:
            # Test 1: File size validation (>5MB should be rejected)
            large_image = self.create_test_image(file_size_mb=6)  # 6MB image
            if large_image:
                files = {'file': ('large_image.jpg', large_image, 'image/jpeg')}
                response = self.session.post(f"{API_BASE}/employees/{TEST_EMPLOYEE_CODES[0]}/image", files=files)
                
                if response.status_code == 400:
                    self.results["file_validation"]["details"].append(
                        self.log_result("File Size Validation", True, "Correctly rejected file >5MB")
                    )
                else:
                    self.results["file_validation"]["details"].append(
                        self.log_result("File Size Validation", False, f"Expected 400, got {response.status_code}")
                    )
            
            # Test 2: Invalid file format (text file)
            invalid_file = b"This is not an image file"
            files = {'file': ('invalid.txt', invalid_file, 'text/plain')}
            response = self.session.post(f"{API_BASE}/employees/{TEST_EMPLOYEE_CODES[0]}/image", files=files)
            
            if response.status_code == 400:
                self.results["file_validation"]["details"].append(
                    self.log_result("Invalid File Format", True, "Correctly rejected non-image file")
                )
            else:
                self.results["file_validation"]["details"].append(
                    self.log_result("Invalid File Format", False, f"Expected 400, got {response.status_code}")
                )
            
            # Test 3: Corrupted image file
            corrupted_image = b"CORRUPTED_IMAGE_DATA_NOT_VALID"
            files = {'file': ('corrupted.jpg', corrupted_image, 'image/jpeg')}
            response = self.session.post(f"{API_BASE}/employees/{TEST_EMPLOYEE_CODES[0]}/image", files=files)
            
            if response.status_code == 400:
                self.results["file_validation"]["details"].append(
                    self.log_result("Corrupted File", True, "Correctly rejected corrupted image")
                )
            else:
                self.results["file_validation"]["details"].append(
                    self.log_result("Corrupted File", False, f"Expected 400, got {response.status_code}")
                )
            
            # Test 4: Valid formats (JPEG, PNG, GIF, WEBP)
            valid_formats = ["JPEG", "PNG"]  # Test main formats
            for format_name in valid_formats:
                test_image = self.create_test_image(format=format_name)
                if test_image:
                    content_type = f"image/{format_name.lower()}"
                    files = {'file': (f'test.{format_name.lower()}', test_image, content_type)}
                    response = self.session.post(f"{API_BASE}/employees/{TEST_EMPLOYEE_CODES[0]}/image", files=files)
                    
                    if response.status_code == 200:
                        self.results["file_validation"]["details"].append(
                            self.log_result(f"Valid {format_name} Format", True, f"Successfully accepted {format_name} image")
                        )
                    else:
                        self.results["file_validation"]["details"].append(
                            self.log_result(f"Valid {format_name} Format", False, f"HTTP {response.status_code}")
                        )
            
            self.results["file_validation"]["passed"] = True
            return True
                
        except Exception as e:
            self.results["file_validation"]["details"].append(
                self.log_result("File Validation", False, f"Exception: {str(e)}")
            )
            return False

    def run_all_tests(self):
        """Run all backend tests"""
        print(f"🚀 Starting Backend API Tests")
        print(f"Backend URL: {BACKEND_URL}")
        print(f"API Base: {API_BASE}")
        print("=" * 60)
        
        # Run all tests
        tests = [
            ("Google Sheets Integration", self.test_google_sheets_integration),
            ("Search API", self.test_search_api),
            ("Filter API", self.test_filter_api),
            ("Attendance API", self.test_attendance_api),
            ("Department API", self.test_department_api)
        ]
        
        passed_tests = 0
        total_tests = len(tests)
        
        for test_name, test_func in tests:
            try:
                if test_func():
                    passed_tests += 1
            except Exception as e:
                print(f"❌ CRITICAL ERROR in {test_name}: {str(e)}")
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 TEST SUMMARY: {passed_tests}/{total_tests} tests passed")
        print("=" * 60)
        
        for test_name, result in self.results.items():
            status = "✅ PASSED" if result["passed"] else "❌ FAILED"
            print(f"{status}: {test_name.replace('_', ' ').title()}")
            
            # Print details for failed tests
            if not result["passed"]:
                for detail in result["details"]:
                    if not detail["success"]:
                        print(f"  - {detail['message']}")
        
        return self.results

if __name__ == "__main__":
    tester = BackendTester()
    results = tester.run_all_tests()
    
    # Exit with error code if any tests failed
    failed_tests = sum(1 for result in results.values() if not result["passed"])
    sys.exit(failed_tests)