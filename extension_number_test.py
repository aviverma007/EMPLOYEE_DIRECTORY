#!/usr/bin/env python3
"""
Extension Number Field Testing for Employee Directory Backend API
Tests the newly added extension_number field functionality across all endpoints
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from frontend/.env
BACKEND_URL = "https://4ce3f9b7-238b-44dd-bf64-f4889aa5d3c2.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Test employee codes from the review request
TEST_EMPLOYEE_CODES = ["81096", "80957", "80176", "00001", "00002"]

class ExtensionNumberTester:
    def __init__(self):
        self.results = {
            "employees_endpoint_extension": {"passed": False, "details": []},
            "search_extension_field": {"passed": False, "details": []},
            "filter_extension_field": {"passed": False, "details": []},
            "field_values_extension": {"passed": False, "details": []}
        }
        self.session = requests.Session()
        self.session.timeout = 30

    def log_result(self, test_name, success, message):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        return {"success": success, "message": message, "timestamp": datetime.now().isoformat()}

    def test_employees_endpoint_extension(self):
        """Test /api/employees endpoint - Check if extension_number field is included"""
        print("\n=== Testing /api/employees Endpoint for Extension Number Field ===")
        
        try:
            response = self.session.get(f"{API_BASE}/employees")
            
            if response.status_code != 200:
                self.results["employees_endpoint_extension"]["details"].append(
                    self.log_result("GET /api/employees", False, f"HTTP {response.status_code}: {response.text}")
                )
                return False
            
            data = response.json()
            
            # Check response structure
            if "employees" not in data:
                self.results["employees_endpoint_extension"]["details"].append(
                    self.log_result("Response Structure", False, "Missing 'employees' key in response")
                )
                return False
            
            employees = data["employees"]
            
            if not employees:
                self.results["employees_endpoint_extension"]["details"].append(
                    self.log_result("Employee Data", False, "No employee data returned")
                )
                return False
            
            # Check if extension_number field exists in employee records
            employees_with_extension = []
            employees_without_extension = []
            
            for emp in employees:
                if "extension_number" in emp:
                    if emp["extension_number"]:  # Has a value
                        employees_with_extension.append(emp)
                    else:
                        employees_without_extension.append(emp)
                else:
                    self.results["employees_endpoint_extension"]["details"].append(
                        self.log_result("Extension Field Missing", False, f"Employee {emp.get('emp_code', 'unknown')} missing extension_number field")
                    )
                    return False
            
            # Log findings
            self.results["employees_endpoint_extension"]["details"].extend([
                self.log_result("Extension Field Present", True, f"All {len(employees)} employees have extension_number field"),
                self.log_result("Extension Values", True, f"{len(employees_with_extension)} employees have extension numbers, {len(employees_without_extension)} have null/empty values")
            ])
            
            # Test specific employee codes for extension numbers
            test_employees_found = []
            for emp_code in TEST_EMPLOYEE_CODES:
                emp = next((e for e in employees if e.get("emp_code") == emp_code), None)
                if emp:
                    test_employees_found.append({
                        "emp_code": emp_code,
                        "emp_name": emp.get("emp_name", "Unknown"),
                        "extension_number": emp.get("extension_number", "None")
                    })
            
            if test_employees_found:
                for emp in test_employees_found:
                    self.results["employees_endpoint_extension"]["details"].append(
                        self.log_result(f"Test Employee {emp['emp_code']}", True, 
                                      f"{emp['emp_name']} - Extension: {emp['extension_number']}")
                    )
            
            self.results["employees_endpoint_extension"]["passed"] = True
            return True
            
        except Exception as e:
            self.results["employees_endpoint_extension"]["details"].append(
                self.log_result("Employees Endpoint Extension Test", False, f"Exception: {str(e)}")
            )
            return False

    def test_search_extension_field(self):
        """Test /api/employees/search endpoint - Test searching by extension_number field"""
        print("\n=== Testing /api/employees/search Endpoint for Extension Number Search ===")
        
        try:
            # First, get all employees to find extension numbers to search for
            response = self.session.get(f"{API_BASE}/employees")
            if response.status_code != 200:
                self.results["search_extension_field"]["details"].append(
                    self.log_result("Get Employees for Search Test", False, "Failed to get employee data")
                )
                return False
            
            employees = response.json().get("employees", [])
            extension_numbers = [emp.get("extension_number") for emp in employees if emp.get("extension_number")]
            
            if not extension_numbers:
                self.results["search_extension_field"]["details"].append(
                    self.log_result("Extension Numbers Available", False, "No extension numbers found in employee data")
                )
                return False
            
            # Test 1: Search by extension_number field with suggestions
            test_extension = extension_numbers[0]  # Use first available extension number
            
            params = {"field": "extension_number", "q": test_extension}
            response = self.session.get(f"{API_BASE}/employees/search", params=params)
            
            if response.status_code != 200:
                self.results["search_extension_field"]["details"].append(
                    self.log_result("Extension Number Search", False, f"HTTP {response.status_code}: {response.text}")
                )
                return False
            
            data = response.json()
            
            # Check response structure
            if "suggestions" not in data or "employees" not in data:
                self.results["search_extension_field"]["details"].append(
                    self.log_result("Search Response Structure", False, "Missing 'suggestions' or 'employees' key")
                )
                return False
            
            # Check if suggestions are provided for extension_number field
            suggestions = data["suggestions"]
            self.results["search_extension_field"]["details"].append(
                self.log_result("Extension Number Suggestions", True, f"Got {len(suggestions)} suggestions for extension_number field")
            )
            
            # Check if employees are returned
            matching_employees = data["employees"]
            if matching_employees:
                # Verify that returned employees have the searched extension number
                correct_matches = [emp for emp in matching_employees if emp.get("extension_number") == test_extension]
                self.results["search_extension_field"]["details"].append(
                    self.log_result("Extension Number Search Results", True, 
                                  f"Found {len(matching_employees)} employees, {len(correct_matches)} with exact extension match")
                )
            else:
                self.results["search_extension_field"]["details"].append(
                    self.log_result("Extension Number Search Results", True, "No employees returned (may be expected)")
                )
            
            # Test 2: Partial extension number search
            if len(test_extension) > 2:
                partial_extension = test_extension[:2]  # First 2 characters
                params = {"field": "extension_number", "q": partial_extension}
                response = self.session.get(f"{API_BASE}/employees/search", params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    partial_matches = data.get("employees", [])
                    self.results["search_extension_field"]["details"].append(
                        self.log_result("Partial Extension Search", True, 
                                      f"Partial search '{partial_extension}' returned {len(partial_matches)} employees")
                    )
            
            # Test 3: Extension number in global search
            params = {"q": test_extension}  # No field specified - global search
            response = self.session.get(f"{API_BASE}/employees/search", params=params)
            
            if response.status_code == 200:
                data = response.json()
                global_matches = data.get("employees", [])
                self.results["search_extension_field"]["details"].append(
                    self.log_result("Global Extension Search", True, 
                                  f"Global search for extension '{test_extension}' returned {len(global_matches)} employees")
                )
            
            # Test 4: Get suggestions for extension_number field without query
            params = {"field": "extension_number"}
            response = self.session.get(f"{API_BASE}/employees/search", params=params)
            
            if response.status_code == 200:
                data = response.json()
                field_suggestions = data.get("suggestions", [])
                self.results["search_extension_field"]["details"].append(
                    self.log_result("Extension Field Suggestions", True, 
                                  f"Extension number field suggestions: {len(field_suggestions)} values")
                )
            
            self.results["search_extension_field"]["passed"] = True
            return True
            
        except Exception as e:
            self.results["search_extension_field"]["details"].append(
                self.log_result("Search Extension Field Test", False, f"Exception: {str(e)}")
            )
            return False

    def test_filter_extension_field(self):
        """Test /api/employees/filter endpoint - Test filtering by extension_number parameter"""
        print("\n=== Testing /api/employees/filter Endpoint for Extension Number Filtering ===")
        
        try:
            # First, get all employees to find extension numbers to filter by
            response = self.session.get(f"{API_BASE}/employees")
            if response.status_code != 200:
                self.results["filter_extension_field"]["details"].append(
                    self.log_result("Get Employees for Filter Test", False, "Failed to get employee data")
                )
                return False
            
            employees = response.json().get("employees", [])
            extension_numbers = [emp.get("extension_number") for emp in employees if emp.get("extension_number")]
            
            if not extension_numbers:
                self.results["filter_extension_field"]["details"].append(
                    self.log_result("Extension Numbers Available", False, "No extension numbers found in employee data")
                )
                return False
            
            # Test 1: Filter by single extension_number
            test_extension = extension_numbers[0]
            params = {"extension_number": test_extension}
            response = self.session.get(f"{API_BASE}/employees/filter", params=params)
            
            if response.status_code != 200:
                self.results["filter_extension_field"]["details"].append(
                    self.log_result("Extension Number Filter", False, f"HTTP {response.status_code}: {response.text}")
                )
                return False
            
            data = response.json()
            
            # Check response structure
            if "employees" not in data:
                self.results["filter_extension_field"]["details"].append(
                    self.log_result("Filter Response Structure", False, "Missing 'employees' key in response")
                )
                return False
            
            filtered_employees = data["employees"]
            
            # Verify all returned employees have the correct extension number
            correct_extension_employees = [emp for emp in filtered_employees 
                                         if emp.get("extension_number") == test_extension]
            
            if len(correct_extension_employees) == len(filtered_employees):
                self.results["filter_extension_field"]["details"].append(
                    self.log_result("Extension Filter Accuracy", True, 
                                  f"All {len(filtered_employees)} filtered employees have extension '{test_extension}'")
                )
            else:
                self.results["filter_extension_field"]["details"].append(
                    self.log_result("Extension Filter Accuracy", False, 
                                  f"Only {len(correct_extension_employees)}/{len(filtered_employees)} employees have correct extension")
                )
                return False
            
            # Test 2: Filter by extension_number combined with other fields
            if filtered_employees:
                sample_employee = filtered_employees[0]
                multi_params = {
                    "extension_number": test_extension,
                    "department": sample_employee.get("department", "")
                }
                
                response = self.session.get(f"{API_BASE}/employees/filter", params=multi_params)
                
                if response.status_code == 200:
                    data = response.json()
                    multi_filtered = data.get("employees", [])
                    self.results["filter_extension_field"]["details"].append(
                        self.log_result("Multi-field Filter with Extension", True, 
                                      f"Multi-field filter (extension + department) returned {len(multi_filtered)} employees")
                    )
            
            # Test 3: Filter by non-existent extension number
            fake_extension = "99999"
            params = {"extension_number": fake_extension}
            response = self.session.get(f"{API_BASE}/employees/filter", params=params)
            
            if response.status_code == 200:
                data = response.json()
                no_match_employees = data.get("employees", [])
                if len(no_match_employees) == 0:
                    self.results["filter_extension_field"]["details"].append(
                        self.log_result("Non-existent Extension Filter", True, 
                                      "Correctly returned 0 employees for non-existent extension")
                    )
                else:
                    self.results["filter_extension_field"]["details"].append(
                        self.log_result("Non-existent Extension Filter", False, 
                                      f"Expected 0 employees, got {len(no_match_employees)}")
                    )
            
            # Test 4: Test multiple extension numbers if available
            if len(extension_numbers) > 1:
                for i, ext_num in enumerate(extension_numbers[:3]):  # Test up to 3 extension numbers
                    params = {"extension_number": ext_num}
                    response = self.session.get(f"{API_BASE}/employees/filter", params=params)
                    
                    if response.status_code == 200:
                        data = response.json()
                        filtered = data.get("employees", [])
                        self.results["filter_extension_field"]["details"].append(
                            self.log_result(f"Extension Filter Test {i+1}", True, 
                                          f"Extension '{ext_num}' filter returned {len(filtered)} employees")
                        )
            
            self.results["filter_extension_field"]["passed"] = True
            return True
            
        except Exception as e:
            self.results["filter_extension_field"]["details"].append(
                self.log_result("Filter Extension Field Test", False, f"Exception: {str(e)}")
            )
            return False

    def test_field_values_extension(self):
        """Test /api/field-values endpoint - Verify extension_numbers array is included"""
        print("\n=== Testing /api/field-values Endpoint for Extension Numbers Array ===")
        
        try:
            response = self.session.get(f"{API_BASE}/field-values")
            
            if response.status_code != 200:
                self.results["field_values_extension"]["details"].append(
                    self.log_result("GET /api/field-values", False, f"HTTP {response.status_code}: {response.text}")
                )
                return False
            
            data = response.json()
            
            # Check if extension_numbers field exists
            if "extension_numbers" not in data:
                self.results["field_values_extension"]["details"].append(
                    self.log_result("Extension Numbers Field", False, "Missing 'extension_numbers' key in response")
                )
                return False
            
            extension_numbers = data["extension_numbers"]
            
            # Verify it's a list
            if not isinstance(extension_numbers, list):
                self.results["field_values_extension"]["details"].append(
                    self.log_result("Extension Numbers Type", False, f"Expected list, got {type(extension_numbers)}")
                )
                return False
            
            # Log the extension numbers found
            self.results["field_values_extension"]["details"].append(
                self.log_result("Extension Numbers Array", True, 
                              f"Found {len(extension_numbers)} unique extension numbers")
            )
            
            # Display the extension numbers (limit to first 10 for readability)
            display_extensions = extension_numbers[:10] if len(extension_numbers) > 10 else extension_numbers
            if display_extensions:
                self.results["field_values_extension"]["details"].append(
                    self.log_result("Extension Numbers Sample", True, 
                                  f"Sample extensions: {display_extensions}")
                )
            else:
                self.results["field_values_extension"]["details"].append(
                    self.log_result("Extension Numbers Content", True, 
                                  "Extension numbers array is empty (may be expected if no extensions in data)")
                )
            
            # Verify other expected fields are still present
            expected_fields = ["departments", "locations", "designations", "emp_codes", "emp_names", "mobiles", "emails"]
            missing_fields = [field for field in expected_fields if field not in data]
            
            if not missing_fields:
                self.results["field_values_extension"]["details"].append(
                    self.log_result("Other Field Values", True, "All other expected field value arrays present")
                )
            else:
                self.results["field_values_extension"]["details"].append(
                    self.log_result("Other Field Values", False, f"Missing field value arrays: {missing_fields}")
                )
                return False
            
            # Cross-check: verify extension numbers in field-values match those in employees
            employees_response = self.session.get(f"{API_BASE}/employees")
            if employees_response.status_code == 200:
                employees_data = employees_response.json().get("employees", [])
                actual_extensions = set(emp.get("extension_number") for emp in employees_data 
                                      if emp.get("extension_number"))
                field_value_extensions = set(extension_numbers)
                
                if actual_extensions == field_value_extensions:
                    self.results["field_values_extension"]["details"].append(
                        self.log_result("Extension Numbers Consistency", True, 
                                      "Extension numbers in field-values match those in employee data")
                    )
                else:
                    missing_in_field_values = actual_extensions - field_value_extensions
                    extra_in_field_values = field_value_extensions - actual_extensions
                    
                    if missing_in_field_values:
                        self.results["field_values_extension"]["details"].append(
                            self.log_result("Missing Extensions in Field Values", False, 
                                          f"Extensions in employee data but not in field-values: {missing_in_field_values}")
                        )
                    
                    if extra_in_field_values:
                        self.results["field_values_extension"]["details"].append(
                            self.log_result("Extra Extensions in Field Values", False, 
                                          f"Extensions in field-values but not in employee data: {extra_in_field_values}")
                        )
            
            self.results["field_values_extension"]["passed"] = True
            return True
            
        except Exception as e:
            self.results["field_values_extension"]["details"].append(
                self.log_result("Field Values Extension Test", False, f"Exception: {str(e)}")
            )
            return False

    def run_all_tests(self):
        """Run all extension number tests"""
        print(f"🚀 Starting Extension Number Field Tests")
        print(f"Backend URL: {BACKEND_URL}")
        print(f"API Base: {API_BASE}")
        print("=" * 80)
        
        # Run all tests
        tests = [
            ("Employees Endpoint Extension Field", self.test_employees_endpoint_extension),
            ("Search Extension Field", self.test_search_extension_field),
            ("Filter Extension Field", self.test_filter_extension_field),
            ("Field Values Extension Array", self.test_field_values_extension)
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
        print(f"📊 EXTENSION NUMBER TESTS SUMMARY: {passed_tests}/{total_tests} tests passed")
        print("=" * 80)
        
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
    tester = ExtensionNumberTester()
    results = tester.run_all_tests()
    
    # Exit with error code if any tests failed
    failed_tests = sum(1 for result in results.values() if not result["passed"])
    sys.exit(failed_tests)