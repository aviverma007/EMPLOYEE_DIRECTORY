#!/usr/bin/env python3
"""
Comprehensive API Testing for Employee Directory
Tests all main endpoints as requested in the review
"""

import requests
import json
import base64
import io
from PIL import Image
from datetime import datetime

# Backend URL
BACKEND_URL = "http://localhost:8001"
API_BASE = f"{BACKEND_URL}/api"

class ComprehensiveAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.session.timeout = 30
        
    def log_result(self, test_name, success, message):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        return {"success": success, "message": message}

    def test_get_all_employees(self):
        """Test GET /api/employees endpoint"""
        print("\n=== Testing GET /api/employees ===")
        
        try:
            response = self.session.get(f"{API_BASE}/employees")
            
            if response.status_code != 200:
                self.log_result("GET /api/employees", False, f"HTTP {response.status_code}")
                return False
            
            data = response.json()
            
            # Check structure
            if "employees" not in data:
                self.log_result("Response Structure", False, "Missing 'employees' key")
                return False
            
            employees = data["employees"]
            employee_count = len(employees)
            
            # Check if we have employees
            if employee_count == 0:
                self.log_result("Employee Data", False, "No employees returned")
                return False
            
            # Check employee structure
            sample_emp = employees[0]
            required_fields = ['emp_code', 'emp_name', 'department', 'location', 'designation', 'mobile']
            missing_fields = [field for field in required_fields if field not in sample_emp]
            
            if missing_fields:
                self.log_result("Employee Structure", False, f"Missing fields: {missing_fields}")
                return False
            
            self.log_result("GET /api/employees", True, f"Successfully returned {employee_count} employees")
            self.log_result("Employee Structure", True, "All required fields present")
            
            # Check for additional fields
            optional_fields = ['extension_number', 'email', 'joining_date', 'reporting_manager']
            present_optional = [field for field in optional_fields if field in sample_emp]
            self.log_result("Optional Fields", True, f"Present optional fields: {present_optional}")
            
            return True
            
        except Exception as e:
            self.log_result("GET /api/employees", False, f"Exception: {str(e)}")
            return False

    def test_search_endpoint(self):
        """Test GET /api/employees/search endpoint"""
        print("\n=== Testing GET /api/employees/search ===")
        
        try:
            # Test 1: Basic search without parameters
            response = self.session.get(f"{API_BASE}/employees/search")
            if response.status_code != 200:
                self.log_result("Basic Search", False, f"HTTP {response.status_code}")
                return False
            
            data = response.json()
            if "suggestions" not in data or "employees" not in data:
                self.log_result("Search Structure", False, "Missing 'suggestions' or 'employees'")
                return False
            
            self.log_result("Basic Search", True, f"Returned {len(data['employees'])} employees")
            
            # Test 2: Field-specific searches
            search_tests = [
                {"field": "emp_code", "q": "80002", "desc": "Employee Code Search"},
                {"field": "emp_name", "q": "VIKAS", "desc": "Employee Name Search"},
                {"field": "department", "q": "Human", "desc": "Department Search"},
                {"field": "location", "q": "Delhi", "desc": "Location Search"},
                {"field": "designation", "q": "Manager", "desc": "Designation Search"},
                {"field": "mobile", "q": "9876", "desc": "Mobile Search"},
                {"field": "extension_number", "q": "1001", "desc": "Extension Number Search"}
            ]
            
            successful_searches = 0
            for test in search_tests:
                params = {"field": test["field"], "q": test["q"]}
                response = self.session.get(f"{API_BASE}/employees/search", params=params)
                
                if response.status_code == 200:
                    search_data = response.json()
                    suggestions = search_data.get("suggestions", [])
                    employees = search_data.get("employees", [])
                    
                    self.log_result(test["desc"], True, f"Query '{test['q']}' returned {len(suggestions)} suggestions, {len(employees)} employees")
                    successful_searches += 1
                else:
                    self.log_result(test["desc"], False, f"HTTP {response.status_code}")
            
            # Test 3: Global search
            response = self.session.get(f"{API_BASE}/employees/search", params={"q": "IT"})
            if response.status_code == 200:
                data = response.json()
                self.log_result("Global Search", True, f"Global search returned {len(data['employees'])} results")
                successful_searches += 1
            
            return successful_searches >= 5  # At least 5 searches should work
            
        except Exception as e:
            self.log_result("Search Endpoint", False, f"Exception: {str(e)}")
            return False

    def test_filter_endpoint(self):
        """Test GET /api/employees/filter endpoint"""
        print("\n=== Testing GET /api/employees/filter ===")
        
        try:
            # Test 1: Single field filters
            filter_tests = [
                {"department": "Human Resources", "desc": "Department Filter"},
                {"location": "Delhi", "desc": "Location Filter"},
                {"designation": "Manager", "desc": "Designation Filter"},
                {"emp_code": "80002", "desc": "Employee Code Filter"}
            ]
            
            successful_filters = 0
            for test in filter_tests:
                # Remove desc from params
                params = {k: v for k, v in test.items() if k != "desc"}
                response = self.session.get(f"{API_BASE}/employees/filter", params=params)
                
                if response.status_code == 200:
                    filter_data = response.json()
                    if "employees" in filter_data:
                        employees = filter_data["employees"]
                        self.log_result(test["desc"], True, f"Returned {len(employees)} employees")
                        successful_filters += 1
                    else:
                        self.log_result(test["desc"], False, "Missing 'employees' in response")
                else:
                    self.log_result(test["desc"], False, f"HTTP {response.status_code}")
            
            # Test 2: Multi-criteria filter
            multi_params = {"department": "Human Resources", "location": "Delhi"}
            response = self.session.get(f"{API_BASE}/employees/filter", params=multi_params)
            
            if response.status_code == 200:
                data = response.json()
                employees = data.get("employees", [])
                self.log_result("Multi-criteria Filter", True, f"Multi-field filter returned {len(employees)} employees")
                successful_filters += 1
            
            # Test 3: Empty filter (should return all)
            response = self.session.get(f"{API_BASE}/employees/filter")
            if response.status_code == 200:
                data = response.json()
                employees = data.get("employees", [])
                self.log_result("Empty Filter", True, f"Empty filter returned {len(employees)} employees")
                successful_filters += 1
            
            return successful_filters >= 4
            
        except Exception as e:
            self.log_result("Filter Endpoint", False, f"Exception: {str(e)}")
            return False

    def test_field_values_endpoint(self):
        """Test GET /api/field-values endpoint"""
        print("\n=== Testing GET /api/field-values ===")
        
        try:
            response = self.session.get(f"{API_BASE}/field-values")
            
            if response.status_code != 200:
                self.log_result("Field Values API", False, f"HTTP {response.status_code}")
                return False
            
            data = response.json()
            
            # Expected field arrays
            expected_fields = [
                'departments', 'locations', 'designations', 'emp_codes', 
                'emp_names', 'mobiles', 'extension_numbers', 'emails'
            ]
            
            missing_fields = [field for field in expected_fields if field not in data]
            if missing_fields:
                self.log_result("Field Structure", False, f"Missing fields: {missing_fields}")
                return False
            
            # Check counts and content
            field_info = {}
            for field in expected_fields:
                values = data.get(field, [])
                field_info[field] = len(values)
            
            self.log_result("Field Values API", True, "All expected field arrays present")
            self.log_result("Field Counts", True, 
                          f"Departments: {field_info['departments']}, Locations: {field_info['locations']}, "
                          f"Designations: {field_info['designations']}, Extension Numbers: {field_info['extension_numbers']}")
            
            # Verify unique values for dropdowns
            if field_info['departments'] > 0 and field_info['locations'] > 0:
                self.log_result("Dropdown Data", True, "Sufficient unique values for dropdowns")
                return True
            else:
                self.log_result("Dropdown Data", False, "Insufficient unique values")
                return False
            
        except Exception as e:
            self.log_result("Field Values Endpoint", False, f"Exception: {str(e)}")
            return False

    def test_refresh_data_endpoint(self):
        """Test POST /api/refresh-data endpoint"""
        print("\n=== Testing POST /api/refresh-data ===")
        
        try:
            response = self.session.post(f"{API_BASE}/refresh-data")
            
            if response.status_code != 200:
                self.log_result("Refresh Data API", False, f"HTTP {response.status_code}")
                return False
            
            data = response.json()
            
            # Check response structure
            if "message" not in data or "source" not in data:
                self.log_result("Refresh Response", False, "Missing 'message' or 'source'")
                return False
            
            # Check if message contains employee count
            message = data["message"]
            if "employees" not in message.lower():
                self.log_result("Message Content", False, "Message doesn't mention employees")
                return False
            
            # Check source
            source = data["source"]
            if source not in ["excel", "sheets", "upload"]:
                self.log_result("Source Validation", False, f"Invalid source: {source}")
                return False
            
            self.log_result("Refresh Data API", True, f"Successfully refreshed from {source}")
            self.log_result("Message Content", True, f"Message: {message}")
            
            return True
            
        except Exception as e:
            self.log_result("Refresh Data Endpoint", False, f"Exception: {str(e)}")
            return False

    def test_data_source_info_endpoint(self):
        """Test GET /api/data-source-info endpoint"""
        print("\n=== Testing GET /api/data-source-info ===")
        
        try:
            response = self.session.get(f"{API_BASE}/data-source-info")
            
            if response.status_code != 200:
                self.log_result("Data Source Info API", False, f"HTTP {response.status_code}")
                return False
            
            data = response.json()
            
            # Check required fields
            required_fields = ["data_source", "employees_count", "last_updated"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                self.log_result("Required Fields", False, f"Missing: {missing_fields}")
                return False
            
            # Validate field values
            data_source = data["data_source"]
            employees_count = data["employees_count"]
            last_updated = data["last_updated"]
            
            # Check data source
            if data_source not in ["excel", "sheets", "upload"]:
                self.log_result("Data Source Value", False, f"Invalid data_source: {data_source}")
                return False
            
            # Check employee count
            if not isinstance(employees_count, int) or employees_count < 0:
                self.log_result("Employee Count", False, f"Invalid count: {employees_count}")
                return False
            
            # Check timestamp
            try:
                datetime.fromisoformat(last_updated.replace('Z', '+00:00'))
                timestamp_valid = True
            except:
                timestamp_valid = False
            
            if not timestamp_valid:
                self.log_result("Timestamp", False, f"Invalid timestamp: {last_updated}")
                return False
            
            self.log_result("Data Source Info API", True, 
                          f"Source: {data_source}, Count: {employees_count}")
            
            # Check Excel-specific fields
            if data_source == "excel":
                if "excel_file_path" in data and "file_exists" in data:
                    excel_path = data["excel_file_path"]
                    file_exists = data["file_exists"]
                    self.log_result("Excel Info", True, f"Path: {excel_path}, Exists: {file_exists}")
                else:
                    self.log_result("Excel Info", False, "Missing Excel-specific fields")
                    return False
            
            return True
            
        except Exception as e:
            self.log_result("Data Source Info Endpoint", False, f"Exception: {str(e)}")
            return False

    def create_test_image(self):
        """Create a test image for upload testing"""
        try:
            img = Image.new('RGB', (100, 100), color='blue')
            img_buffer = io.BytesIO()
            img.save(img_buffer, format='JPEG')
            return img_buffer.getvalue()
        except Exception as e:
            print(f"Error creating test image: {e}")
            return None

    def test_image_upload_endpoints(self):
        """Test image upload, retrieval, and deletion endpoints"""
        print("\n=== Testing Image Upload Features ===")
        
        try:
            # Get a test employee
            response = self.session.get(f"{API_BASE}/employees")
            if response.status_code != 200:
                return False
            
            employees = response.json().get("employees", [])
            if not employees:
                self.log_result("Test Employee", False, "No employees available for testing")
                return False
            
            test_emp_code = employees[0]["emp_code"]
            
            # Test 1: Image Upload
            test_image = self.create_test_image()
            if not test_image:
                self.log_result("Test Image Creation", False, "Failed to create test image")
                return False
            
            files = {'file': ('test_image.jpg', test_image, 'image/jpeg')}
            response = self.session.post(f"{API_BASE}/employees/{test_emp_code}/image", files=files)
            
            if response.status_code == 200:
                upload_data = response.json()
                if upload_data.get("success") and "image_url" in upload_data:
                    self.log_result("Image Upload", True, f"Successfully uploaded image for {test_emp_code}")
                else:
                    self.log_result("Image Upload", False, "Invalid upload response")
                    return False
            else:
                self.log_result("Image Upload", False, f"HTTP {response.status_code}")
                return False
            
            # Test 2: Image Retrieval
            response = self.session.get(f"{API_BASE}/employees/{test_emp_code}/image")
            
            if response.status_code == 200:
                image_data = response.json()
                if "image_url" in image_data and image_data["image_url"].startswith("data:"):
                    self.log_result("Image Retrieval", True, "Successfully retrieved image with base64 data")
                else:
                    self.log_result("Image Retrieval", False, "Invalid image data format")
                    return False
            else:
                self.log_result("Image Retrieval", False, f"HTTP {response.status_code}")
                return False
            
            # Test 3: Image Deletion
            response = self.session.delete(f"{API_BASE}/employees/{test_emp_code}/image")
            
            if response.status_code == 200:
                delete_data = response.json()
                if delete_data.get("success"):
                    self.log_result("Image Deletion", True, "Successfully deleted image")
                else:
                    self.log_result("Image Deletion", False, "Invalid deletion response")
                    return False
            else:
                self.log_result("Image Deletion", False, f"HTTP {response.status_code}")
                return False
            
            # Test 4: File Validation (oversized file)
            large_image = b'x' * (6 * 1024 * 1024)  # 6MB
            files = {'file': ('large_image.jpg', large_image, 'image/jpeg')}
            response = self.session.post(f"{API_BASE}/employees/{test_emp_code}/image", files=files)
            
            if response.status_code == 400:
                self.log_result("File Size Validation", True, "Correctly rejected oversized file")
            else:
                self.log_result("File Size Validation", False, f"Expected 400, got {response.status_code}")
                return False
            
            return True
            
        except Exception as e:
            self.log_result("Image Upload Features", False, f"Exception: {str(e)}")
            return False

    def test_attendance_system(self):
        """Test attendance generation for existing employees"""
        print("\n=== Testing Attendance System ===")
        
        try:
            # Get test employees
            response = self.session.get(f"{API_BASE}/employees")
            if response.status_code != 200:
                return False
            
            employees = response.json().get("employees", [])
            if not employees:
                return False
            
            # Test attendance for first few employees
            test_employees = employees[:3]
            successful_tests = 0
            
            for emp in test_employees:
                emp_code = emp["emp_code"]
                response = self.session.get(f"{API_BASE}/employees/{emp_code}/attendance")
                
                if response.status_code == 200:
                    attendance_data = response.json()
                    if "attendance" in attendance_data:
                        attendance = attendance_data["attendance"]
                        
                        # Check required fields
                        required_fields = ["emp_code", "emp_name", "date", "status"]
                        if all(field in attendance for field in required_fields):
                            status = attendance["status"]
                            hours = attendance.get("hours_worked", "N/A")
                            self.log_result(f"Attendance for {emp_code}", True, 
                                          f"Status: {status}, Hours: {hours}")
                            successful_tests += 1
                        else:
                            self.log_result(f"Attendance for {emp_code}", False, "Missing required fields")
                    else:
                        self.log_result(f"Attendance for {emp_code}", False, "Missing 'attendance' key")
                else:
                    self.log_result(f"Attendance for {emp_code}", False, f"HTTP {response.status_code}")
            
            return successful_tests >= 2  # At least 2 should work
            
        except Exception as e:
            self.log_result("Attendance System", False, f"Exception: {str(e)}")
            return False

    def run_comprehensive_tests(self):
        """Run all comprehensive API tests"""
        print(f"🎯 Starting Comprehensive API Testing")
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 80)
        
        tests = [
            ("GET /api/employees", self.test_get_all_employees),
            ("GET /api/employees/search", self.test_search_endpoint),
            ("GET /api/employees/filter", self.test_filter_endpoint),
            ("GET /api/field-values", self.test_field_values_endpoint),
            ("POST /api/refresh-data", self.test_refresh_data_endpoint),
            ("GET /api/data-source-info", self.test_data_source_info_endpoint),
            ("Image Upload Features", self.test_image_upload_endpoints),
            ("Attendance System", self.test_attendance_system)
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
        print("\n" + "=" * 80)
        print(f"📊 COMPREHENSIVE API TEST SUMMARY: {passed_tests}/{total_tests} tests passed")
        print("=" * 80)
        
        return passed_tests == total_tests

if __name__ == "__main__":
    tester = ComprehensiveAPITester()
    success = tester.run_comprehensive_tests()
    
    if success:
        print("\n🎉 ALL COMPREHENSIVE API TESTS PASSED!")
    else:
        print("\n❌ SOME COMPREHENSIVE API TESTS FAILED!")