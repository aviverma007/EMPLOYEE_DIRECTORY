#!/usr/bin/env python3

"""
Create a sample Excel file for Employee Directory
This ensures users have a proper template when they clone the repository
"""

import pandas as pd
import os

# Sample employee data with proper column headers
sample_employees = [
    {
        'EMP ID': '12345',
        'EMP NAME': 'John Doe',
        'DEPARTMENT': 'IT',
        'LOCATION': 'New York',
        'GRADE': 'Senior Developer',
        'MOBILE': '+1-555-0101',
        'EXTENSION NUMBER': '1001'
    },
    {
        'EMP ID': '12346', 
        'EMP NAME': 'Jane Smith',
        'DEPARTMENT': 'HR',
        'LOCATION': 'Los Angeles',
        'GRADE': 'Manager',
        'MOBILE': '+1-555-0102',
        'EXTENSION NUMBER': '1002'
    },
    {
        'EMP ID': '12347',
        'EMP NAME': 'Mike Johnson',
        'DEPARTMENT': 'Finance',
        'LOCATION': 'Chicago',
        'GRADE': 'Analyst',
        'MOBILE': '+1-555-0103', 
        'EXTENSION NUMBER': '1003'
    },
    {
        'EMP ID': '12348',
        'EMP NAME': 'Sarah Wilson',
        'DEPARTMENT': 'IT',
        'LOCATION': 'Seattle',
        'GRADE': 'Developer',
        'MOBILE': '+1-555-0104',
        'EXTENSION NUMBER': '1004'
    },
    {
        'EMP ID': '12349',
        'EMP NAME': 'David Brown',
        'DEPARTMENT': 'Sales',
        'LOCATION': 'Miami',
        'GRADE': 'Representative',
        'MOBILE': '+1-555-0105',
        'EXTENSION NUMBER': '1005'
    },
    {
        'EMP ID': '12350',
        'EMP NAME': 'Lisa Anderson',
        'DEPARTMENT': 'Marketing',
        'LOCATION': 'Boston',
        'GRADE': 'Coordinator',
        'MOBILE': '+1-555-0106',
        'EXTENSION NUMBER': '1006'
    },
    {
        'EMP ID': '12351',
        'EMP NAME': 'Robert Taylor',
        'DEPARTMENT': 'IT', 
        'LOCATION': 'Austin',
        'GRADE': 'Team Lead',
        'MOBILE': '+1-555-0107',
        'EXTENSION NUMBER': '1007'
    },
    {
        'EMP ID': '12352',
        'EMP NAME': 'Emily Davis',
        'DEPARTMENT': 'Operations',
        'LOCATION': 'Denver',
        'GRADE': 'Manager',
        'MOBILE': '+1-555-0108',
        'EXTENSION NUMBER': '1008'
    },
    {
        'EMP ID': '12353',
        'EMP NAME': 'Chris Miller',
        'DEPARTMENT': 'IT',
        'LOCATION': 'San Francisco',
        'GRADE': 'Senior Developer',
        'MOBILE': '+1-555-0109',
        'EXTENSION NUMBER': '1009'
    },
    {
        'EMP ID': '12354',
        'EMP NAME': 'Amanda Garcia',
        'DEPARTMENT': 'Customer Service',
        'LOCATION': 'Phoenix',
        'GRADE': 'Supervisor',
        'MOBILE': '+1-555-0110',
        'EXTENSION NUMBER': '1010'
    }
]

def create_sample_excel():
    """Create sample Excel file for Employee Directory"""
    
    # Ensure data directory exists
    os.makedirs('data', exist_ok=True)
    
    # Create DataFrame
    df = pd.DataFrame(sample_employees)
    
    # Save to Excel with proper formatting
    with pd.ExcelWriter('data/EMPLOYEE_DIR.xlsx', engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Employees', index=False)
        
        # Get the workbook and worksheet objects
        workbook = writer.book
        worksheet = writer.sheets['Employees']
        
        # Auto-adjust column widths
        for column in worksheet.columns:
            max_length = 0
            column_letter = column[0].column_letter
            
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            
            adjusted_width = min(max_length + 2, 50)
            worksheet.column_dimensions[column_letter].width = adjusted_width
    
    print(f"✅ Created sample Excel file: data/EMPLOYEE_DIR.xlsx")
    print(f"📊 Contains {len(sample_employees)} sample employees")
    print("🔧 Ready for Employee Directory application!")

if __name__ == "__main__":
    create_sample_excel()