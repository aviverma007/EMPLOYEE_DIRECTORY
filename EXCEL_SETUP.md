# 📊 Excel File Configuration Guide

## 🎯 Pre-Configured Excel Integration

This Employee Directory is **pre-configured** to work with your Excel file at:
```
C:\EmployeeDirectoryServer\EMPLOPYEE DIR.xlsx
```

## 📋 Excel File Format Requirements

### Required Column Headers (Exact Names)
```excel
| EMP ID | EMP NAME | DEPARTMENT | LOCATION | GRADE | MOBILE | EXTENSION NUMBER |
|--------|----------|------------|----------|-------|--------|------------------|
| 12345  | John Doe | IT         | NYC      | L3    | 123456 | 1001            |
| 12346  | Jane Smith| HR        | LA       | L2    | 654321 | 1002            |
```

### Column Mapping
- **EMP ID** → Employee Code (Primary identifier)
- **EMP NAME** → Full employee name
- **DEPARTMENT** → Department/Team
- **LOCATION** → Office location
- **GRADE** → Designation/Position/Grade
- **MOBILE** → Phone number
- **EXTENSION NUMBER** → Internal extension

## 🚀 Quick Setup Steps

### 1. Prepare Your Excel File
1. Create/Edit: `C:\EmployeeDirectoryServer\EMPLOPYEE DIR.xlsx`
2. Ensure first row has the exact column headers above
3. Add your employee data in subsequent rows
4. Save the file

### 2. Run the Application
```batch
# Navigate to application folder
cd EMPLOYEE_DIRECTORY

# Start the pre-configured application
start_server.bat
```

### 3. Verify Excel Data Loading
The application will automatically:
- ✅ Load data from your Excel file on startup
- ✅ Display employee count in startup messages
- ✅ Show "Data Source: Excel" in the interface
- ✅ Enable refresh functionality to reload Excel data

## 🔧 Advanced Configuration

### Change Excel File Location
If you need to use a different Excel file path:

```batch
# Edit backend\.env file and change:
EXCEL_FILE_PATH=C:\Your\New\Path\To\employees.xlsx
```

### Switch to Google Sheets (Optional)
To switch back to Google Sheets:

```batch
# Edit backend\.env file and change:
DATA_SOURCE=sheets
GOOGLE_SHEETS_URL=https://docs.google.com/spreadsheets/d/YOUR_ID/export?format=csv
```

## 🧪 Testing Excel Integration

### Test Commands
```batch
# Check if Excel file is accessible
dir "C:\EmployeeDirectoryServer\EMPLOPYEE DIR.xlsx"

# Test API endpoint (after starting server)
curl http://localhost:8001/api/employees

# Test data refresh
curl -X POST http://localhost:8001/api/refresh-data
```

### Verify Data Loading
1. Start the application
2. Check startup messages for employee count
3. Access the web interface
4. Look for employees from your Excel file
5. Use search functionality to find specific employees

## 📊 Excel File Management

### Adding New Employees
1. Open `C:\EmployeeDirectoryServer\EMPLOPYEE DIR.xlsx`
2. Add new rows with employee data
3. Save the file
4. In the web interface, click "Refresh Data" or restart the server
5. New employees will appear automatically

### Updating Employee Information
1. Edit the Excel file directly
2. Save changes
3. Refresh data in the application
4. Changes will be reflected immediately

### Backup Your Data
```batch
# Create backup
copy "C:\EmployeeDirectoryServer\EMPLOPYEE DIR.xlsx" "C:\EmployeeDirectoryServer\BACKUP_EMPLOPYEE_DIR_%date%.xlsx"
```

## 🚨 Troubleshooting

### Excel File Not Found
```
Error: Excel file not found at specified path
Solution: Ensure the file exists at: C:\EmployeeDirectoryServer\EMPLOPYEE DIR.xlsx
```

### No Data Loading
```
Problem: Application starts but shows no employees
Check:
1. Excel file has correct column headers
2. File is not password protected
3. File is not open in Excel (can cause read conflicts)
```

### Column Header Mismatch
```
Problem: Some employee data missing
Solution: Ensure exact column header spelling:
- "EMP ID" (not "Employee ID")
- "EMP NAME" (not "Name") 
- "EXTENSION NUMBER" (not "Extension")
```

### Permission Issues
```
Problem: Cannot read Excel file
Solution: Ensure the file is not read-only and has proper permissions
```

## 🎉 Benefits of Excel Integration

### ✅ Easy Data Management
- Edit employee data directly in Excel
- Familiar interface for HR teams
- Bulk operations and formulas available
- No need to learn new systems

### ✅ Real-time Updates
- Changes in Excel reflect in web application
- Refresh functionality for instant updates
- No data synchronization delays
- Direct file access

### ✅ Backup & Version Control
- Easy to backup Excel files
- Track changes in Excel version history
- Export/import functionality
- Data portability

## 🔄 Data Flow

```
Excel File → Backend Server → MongoDB Cache → Frontend Display
     ↑              ↓                    ↓
   Manual         Auto-load          Live Search
   Updates        on Startup         & Filtering
```

**Your Employee Directory is now ready to use with your Excel file! 📊🚀**