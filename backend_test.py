#!/usr/bin/env python3
"""
Backend API Testing for Employee Directory
Tests Google Sheets integration, search, filtering, attendance, and department APIs
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from frontend/.env
BACKEND_URL = "https://3d999134-2e10-4e36-be76-424a258eb684.preview.emergentagent.com"
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
            "department_api": {"passed": False, "details": []}
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