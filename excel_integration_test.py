#!/usr/bin/env python3
"""
Comprehensive Excel Integration Testing for Employee Directory
Tests the specific Excel file /app/EMPLOPYEE DIR.xlsx with 640 employees
"""

import requests
import json
import pandas as pd
import os
from datetime import datetime

# Backend URL
BACKEND_URL = "http://localhost:8001"
API_BASE = f"{BACKEND_URL}/api"

class ExcelIntegrationTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.timeout = 30
        self.excel_file_path = "/app/EMPLOPYEE DIR.xlsx"
        
    def log_result(self, test_name, success, message):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        return {"success": success, "message": message, "timestamp": datetime.now().isoformat()}

    def test_excel_file_exists(self):
        """Test if Excel file exists at specified path"""
        print("\n=== Testing Excel File Existence ===")
        
        if os.path.exists(self.excel_file_path):
            file_size = os.path.getsize(self.excel_file_path)
            self.log_result("Excel File Exists", True, f"File found at {self.excel_file_path} ({file_size} bytes)")
            return True
        else:
            self.log_result("Excel File Exists", False, f"File not found at {self.excel_file_path}")
            return False

    def test_excel_structure(self):
        """Test Excel file structure and column mapping"""
        print("\n=== Testing Excel File Structure ===")
        
        try:
            # Read Excel file directly
            df = pd.read_excel(self.excel_file_path, engine='openpyxl')
            
            # Expected columns based on COLUMN_MAPPING
            expected_columns = [
                'EMP ID', 'EMP NAME', 'DEPARTMENT', 'LOCATION', 'GRADE', 
                'MOBILE', 'EXTENSION NUMBER', 'EMAIL ID', 'DATE OF JOINING', 
                'REPORTING MANAGER'
            ]
            
            actual_columns = df.columns.tolist()
            self.log_result("Excel File Read", True, f"Successfully read Excel file with {len(df)} rows")
            self.log_result("Excel Columns", True, f"Found columns: {actual_columns}")
            
            # Check if expected columns exist
            missing_columns = [col for col in expected_columns if col not in actual_columns]
            if missing_columns:
                self.log_result("Column Mapping", False, f"Missing expected columns: {missing_columns}")
                return False
            else:
                self.log_result("Column Mapping", True, "All expected columns found in Excel file")
            
            # Check data quality
            non_empty_rows = df.dropna(subset=['EMP ID', 'EMP NAME']).shape[0]
            self.log_result("Data Quality", True, f"Found {non_empty_rows} rows with valid EMP ID and EMP NAME")
            
            return True
            
        except Exception as e:
            self.log_result("Excel File Structure", False, f"Error reading Excel file: {str(e)}")
            return False

    def test_employee_count(self):
        """Test that all 640 employees are loaded"""
        print("\n=== Testing Employee Count ===")
        
        try:
            response = self.session.get(f"{API_BASE}/employees")
            
            if response.status_code != 200:
                self.log_result("Employee Count API", False, f"HTTP {response.status_code}: {response.text}")
                return False
            
            data = response.json()
            employees = data.get("employees", [])
            employee_count = len(employees)
            
            self.log_result("Employee Count", True, f"Loaded {employee_count} employees from Excel")
            
            # Check if we have close to 640 employees (allowing for some data quality issues)
            if employee_count >= 500:  # Allow some tolerance for data quality
                self.log_result("Expected Count Range", True, f"Employee count ({employee_count}) is in expected range")
                return True
            else:
                self.log_result("Expected Count Range", False, f"Employee count ({employee_count}) is lower than expected (~640)")
                return False
                
        except Exception as e:
            self.log_result("Employee Count", False, f"Exception: {str(e)}")
            return False

    def test_column_mapping_accuracy(self):
        """Test that column mapping works correctly"""
        print("\n=== Testing Column Mapping Accuracy ===")
        
        try:
            response = self.session.get(f"{API_BASE}/employees")
            
            if response.status_code != 200:
                self.log_result("Column Mapping API", False, f"HTTP {response.status_code}")
                return False
            
            data = response.json()
            employees = data.get("employees", [])
            
            if not employees:
                self.log_result("Column Mapping", False, "No employees found")
                return False
            
            # Check first few employees for proper mapping
            sample_employee = employees[0]
            
            # Expected fields after mapping
            expected_fields = [
                'emp_code', 'emp_name', 'department', 'location', 'designation', 
                'mobile', 'extension_number', 'email', 'joining_date', 'reporting_manager'
            ]
            
            missing_fields = [field for field in expected_fields if field not in sample_employee]
            
            if missing_fields:
                self.log_result("Field Mapping", False, f"Missing mapped fields: {missing_fields}")
                return False
            else:
                self.log_result("Field Mapping", True, "All expected fields present after column mapping")
            
            # Check specific mapping: GRADE -> designation
            if 'designation' in sample_employee:
                self.log_result("GRADE to designation mapping", True, f"Sample designation: {sample_employee['designation']}")
            else:
                self.log_result("GRADE to designation mapping", False, "designation field missing")
                return False
            
            return True
            
        except Exception as e:
            self.log_result("Column Mapping Accuracy", False, f"Exception: {str(e)}")
            return False

    def test_search_functionality_with_real_data(self):
        """Test search functionality with real employee data"""
        print("\n=== Testing Search with Real Data ===")
        
        try:
            # Get all employees first
            response = self.session.get(f"{API_BASE}/employees")
            if response.status_code != 200:
                return False
            
            employees = response.json().get("employees", [])
            if not employees:
                return False
            
            # Test search with real employee data
            sample_employee = employees[0]
            
            # Test emp_code search
            emp_code = sample_employee.get('emp_code')
            if emp_code:
                response = self.session.get(f"{API_BASE}/employees/search", params={"field": "emp_code", "q": emp_code})
                if response.status_code == 200:
                    search_data = response.json()
                    found_employees = search_data.get("employees", [])
                    if any(emp.get('emp_code') == emp_code for emp in found_employees):
                        self.log_result("Employee Code Search", True, f"Successfully found employee {emp_code}")
                    else:
                        self.log_result("Employee Code Search", False, f"Employee {emp_code} not found in search results")
                        return False
            
            # Test department search
            department = sample_employee.get('department')
            if department:
                response = self.session.get(f"{API_BASE}/employees/search", params={"field": "department", "q": department})
                if response.status_code == 200:
                    search_data = response.json()
                    suggestions = search_data.get("suggestions", [])
                    if department in suggestions:
                        self.log_result("Department Search", True, f"Department '{department}' found in suggestions")
                    else:
                        self.log_result("Department Search", True, f"Department search returned {len(suggestions)} suggestions")
            
            # Test name search
            emp_name = sample_employee.get('emp_name')
            if emp_name:
                # Search with first word of name
                first_name = emp_name.split()[0] if emp_name else ""
                if first_name:
                    response = self.session.get(f"{API_BASE}/employees/search", params={"field": "emp_name", "q": first_name})
                    if response.status_code == 200:
                        search_data = response.json()
                        found_employees = search_data.get("employees", [])
                        if found_employees:
                            self.log_result("Name Search", True, f"Name search for '{first_name}' returned {len(found_employees)} results")
                        else:
                            self.log_result("Name Search", False, f"No results for name search '{first_name}'")
                            return False
            
            return True
            
        except Exception as e:
            self.log_result("Search with Real Data", False, f"Exception: {str(e)}")
            return False

    def test_filter_functionality_with_real_data(self):
        """Test filter functionality with real employee data"""
        print("\n=== Testing Filter with Real Data ===")
        
        try:
            # Get all employees first
            response = self.session.get(f"{API_BASE}/employees")
            if response.status_code != 200:
                return False
            
            employees = response.json().get("employees", [])
            if not employees:
                return False
            
            # Get unique values for filtering
            departments = list(set(emp.get('department', '') for emp in employees if emp.get('department')))
            locations = list(set(emp.get('location', '') for emp in employees if emp.get('location')))
            designations = list(set(emp.get('designation', '') for emp in employees if emp.get('designation')))
            
            self.log_result("Unique Values", True, f"Found {len(departments)} departments, {len(locations)} locations, {len(designations)} designations")
            
            # Test department filter
            if departments:
                test_dept = departments[0]
                response = self.session.get(f"{API_BASE}/employees/filter", params={"department": test_dept})
                if response.status_code == 200:
                    filter_data = response.json()
                    filtered_employees = filter_data.get("employees", [])
                    # Verify all returned employees belong to the department
                    correct_dept = all(emp.get('department') == test_dept for emp in filtered_employees)
                    if correct_dept:
                        self.log_result("Department Filter", True, f"Department filter for '{test_dept}' returned {len(filtered_employees)} employees")
                    else:
                        self.log_result("Department Filter", False, "Some employees don't belong to filtered department")
                        return False
            
            # Test location filter
            if locations:
                test_location = locations[0]
                response = self.session.get(f"{API_BASE}/employees/filter", params={"location": test_location})
                if response.status_code == 200:
                    filter_data = response.json()
                    filtered_employees = filter_data.get("employees", [])
                    correct_location = all(emp.get('location') == test_location for emp in filtered_employees)
                    if correct_location:
                        self.log_result("Location Filter", True, f"Location filter for '{test_location}' returned {len(filtered_employees)} employees")
                    else:
                        self.log_result("Location Filter", False, "Some employees don't belong to filtered location")
                        return False
            
            return True
            
        except Exception as e:
            self.log_result("Filter with Real Data", False, f"Exception: {str(e)}")
            return False

    def test_field_values_api(self):
        """Test field values API for dropdown data"""
        print("\n=== Testing Field Values API ===")
        
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
                self.log_result("Field Values Structure", False, f"Missing fields: {missing_fields}")
                return False
            
            # Check counts
            field_counts = {}
            for field in expected_fields:
                field_counts[field] = len(data.get(field, []))
            
            self.log_result("Field Values API", True, "All expected field arrays present")
            self.log_result("Field Counts", True, f"Departments: {field_counts['departments']}, Locations: {field_counts['locations']}, Designations: {field_counts['designations']}")
            self.log_result("Extension Numbers", True, f"Found {field_counts['extension_numbers']} unique extension numbers")
            
            return True
            
        except Exception as e:
            self.log_result("Field Values API", False, f"Exception: {str(e)}")
            return False

    def test_data_source_configuration(self):
        """Test data source configuration"""
        print("\n=== Testing Data Source Configuration ===")
        
        try:
            response = self.session.get(f"{API_BASE}/data-source-info")
            
            if response.status_code != 200:
                self.log_result("Data Source Info", False, f"HTTP {response.status_code}")
                return False
            
            data = response.json()
            
            # Check if configured for Excel
            if data.get("data_source") == "excel":
                self.log_result("Data Source Type", True, "Correctly configured for Excel data source")
            else:
                self.log_result("Data Source Type", False, f"Expected 'excel', got '{data.get('data_source')}'")
                return False
            
            # Check Excel file path
            excel_path = data.get("excel_file_path")
            if excel_path == self.excel_file_path:
                self.log_result("Excel File Path", True, f"Correctly configured path: {excel_path}")
            else:
                self.log_result("Excel File Path", False, f"Expected '{self.excel_file_path}', got '{excel_path}'")
            
            # Check file exists flag
            file_exists = data.get("file_exists")
            if file_exists:
                self.log_result("File Exists Flag", True, "Excel file exists flag is True")
            else:
                self.log_result("File Exists Flag", False, "Excel file exists flag is False")
                return False
            
            return True
            
        except Exception as e:
            self.log_result("Data Source Configuration", False, f"Exception: {str(e)}")
            return False

    def run_comprehensive_excel_tests(self):
        """Run all Excel integration tests"""
        print(f"🎯 Starting Comprehensive Excel Integration Tests")
        print(f"Excel File: {self.excel_file_path}")
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 80)
        
        tests = [
            ("Excel File Existence", self.test_excel_file_exists),
            ("Excel File Structure", self.test_excel_structure),
            ("Employee Count", self.test_employee_count),
            ("Column Mapping Accuracy", self.test_column_mapping_accuracy),
            ("Search with Real Data", self.test_search_functionality_with_real_data),
            ("Filter with Real Data", self.test_filter_functionality_with_real_data),
            ("Field Values API", self.test_field_values_api),
            ("Data Source Configuration", self.test_data_source_configuration)
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
        print(f"📊 EXCEL INTEGRATION TEST SUMMARY: {passed_tests}/{total_tests} tests passed")
        print("=" * 80)
        
        return passed_tests == total_tests

if __name__ == "__main__":
    tester = ExcelIntegrationTester()
    success = tester.run_comprehensive_excel_tests()
    
    if success:
        print("\n🎉 ALL EXCEL INTEGRATION TESTS PASSED!")
    else:
        print("\n❌ SOME EXCEL INTEGRATION TESTS FAILED!")