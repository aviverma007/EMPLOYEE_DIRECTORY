import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchFields, setSearchFields] = useState({
    emp_code: '',
    emp_name: '',
    department: '',
    location: '',
    grade: '',
    mobile: '',
    extension_number: ''
  });
  const [suggestions, setSuggestions] = useState({});
  const [showSuggestions, setShowSuggestions] = useState({});
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'list'
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchAllEmployees();
  }, []);

  const fetchAllEmployees = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/employees`);
      const data = await response.json();
      setEmployees(data.employees);
      setFilteredEmployees(data.employees);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setLoading(false);
    }
  };

  const handleSearchChange = async (field, value) => {
    const newSearchFields = { ...searchFields, [field]: value };
    setSearchFields(newSearchFields);

    if (value.length > 0) {
      try {
        const response = await fetch(`${backendUrl}/api/employees/search?q=${encodeURIComponent(value)}&field=${field}`);
        const data = await response.json();
        
        setSuggestions(prev => ({ ...prev, [field]: data.suggestions }));
        setShowSuggestions(prev => ({ ...prev, [field]: true }));
        
        // If there's an exact match, show filtered results
        if (data.employees.length > 0) {
          setFilteredEmployees(data.employees);
        }
      } catch (error) {
        console.error('Error searching employees:', error);
      }
    } else {
      setSuggestions(prev => ({ ...prev, [field]: [] }));
      setShowSuggestions(prev => ({ ...prev, [field]: false }));
      
      // Apply filters for other non-empty fields
      applyFilters(newSearchFields);
    }
  };

  const selectSuggestion = (field, value) => {
    const newSearchFields = { ...searchFields, [field]: value };
    setSearchFields(newSearchFields);
    setShowSuggestions(prev => ({ ...prev, [field]: false }));
    
    applyFilters(newSearchFields);
  };

  const applyFilters = async (filters = searchFields) => {
    // Remove empty filters
    const activeFilters = Object.entries(filters).filter(([key, value]) => value.trim() !== '');
    
    if (activeFilters.length === 0) {
      setFilteredEmployees(employees);
      return;
    }

    try {
      const queryString = activeFilters
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
      
      const response = await fetch(`${backendUrl}/api/employees/filter?${queryString}`);
      const data = await response.json();
      setFilteredEmployees(data.employees);
    } catch (error) {
      console.error('Error filtering employees:', error);
    }
  };

  const handleEmployeeClick = async (employee) => {
    setSelectedEmployee(employee);
    
    // Fetch attendance for this employee
    try {
      const response = await fetch(`${backendUrl}/api/employees/${employee.emp_code}/attendance`);
      const data = await response.json();
      setAttendance(data.attendance);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const clearAllFilters = () => {
    setSearchFields({
      emp_code: '',
      emp_name: '',
      department: '',
      location: '',
      grade: '',
      mobile: '',
      extension_number: ''
    });
    setFilteredEmployees(employees);
    setSuggestions({});
    setShowSuggestions({});
  };

  const searchFieldsConfig = [
    { key: 'emp_code', label: 'Employee Code', placeholder: 'Search by employee code...' },
    { key: 'emp_name', label: 'Employee Name', placeholder: 'Search by name...' },
    { key: 'department', label: 'Department', placeholder: 'Search by department...' },
    { key: 'location', label: 'Location', placeholder: 'Search by location...' },
    { key: 'grade', label: 'Grade', placeholder: 'Search by grade...' },
    { key: 'mobile', label: 'Mobile', placeholder: 'Search by mobile...' },
    { key: 'extension_number', label: 'Extension', placeholder: 'Search by extension...' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading Employee Directory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Employee Directory</h1>
          <p className="text-gray-600">Search and explore our team members</p>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Search Filters</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {searchFieldsConfig.map(({ key, label, placeholder }) => (
              <div key={key} className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                <input
                  type="text"
                  value={searchFields[key]}
                  onChange={(e) => handleSearchChange(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                
                {/* Suggestions Dropdown */}
                {showSuggestions[key] && suggestions[key]?.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {suggestions[key].map((suggestion, idx) => (
                      <div
                        key={idx}
                        onClick={() => selectSuggestion(key, suggestion)}
                        className="px-4 py-2 hover:bg-indigo-50 cursor-pointer text-gray-700"
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-200"
            >
              Clear All Filters
            </button>
            
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 font-medium">View Mode:</span>
              <div className="flex bg-gray-200 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('card')}
                  className={`px-4 py-2 rounded-md transition duration-200 ${
                    viewMode === 'card' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cards
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-md transition duration-200 ${
                    viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  List
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              Employees ({filteredEmployees.length})
            </h2>
          </div>

          {filteredEmployees.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">👥</div>
              <p className="text-gray-500 text-lg">No employees found matching your search criteria</p>
            </div>
          ) : (
            <>
              {viewMode === 'card' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEmployees.map((employee) => (
                    <div
                      key={employee.emp_code}
                      onClick={() => handleEmployeeClick(employee)}
                      className="bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border hover:border-indigo-300 p-6"
                    >
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {employee.emp_name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <h3 className="font-semibold text-gray-800">{employee.emp_name}</h3>
                          <p className="text-gray-600 text-sm">#{employee.emp_code}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Department:</span>
                          <span className="font-medium">{employee.department}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Grade:</span>
                          <span className="font-medium">{employee.grade}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Location:</span>
                          <span className="font-medium">{employee.location}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Mobile:</span>
                          <span className="font-medium">{employee.mobile}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Extension:</span>
                          <span className="font-medium">{employee.extension_number}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Extension</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredEmployees.map((employee) => (
                        <tr
                          key={employee.emp_code}
                          onClick={() => handleEmployeeClick(employee)}
                          className="hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {employee.emp_name.charAt(0)}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{employee.emp_name}</div>
                                <div className="text-sm text-gray-500">#{employee.emp_code}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.department}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.grade}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.location}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.mobile}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.extension_number}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* Selected Employee Modal */}
        {selectedEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 m-4 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Employee Details</h2>
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Employee Info */}
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
                      {selectedEmployee.emp_name.charAt(0)}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">{selectedEmployee.emp_name}</h3>
                    <p className="text-gray-600">#{selectedEmployee.emp_code}</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Department</label>
                      <p className="text-gray-800 font-medium">{selectedEmployee.department}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Grade</label>
                      <p className="text-gray-800 font-medium">{selectedEmployee.grade}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Location</label>
                      <p className="text-gray-800 font-medium">{selectedEmployee.location}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Mobile</label>
                      <p className="text-gray-800 font-medium">{selectedEmployee.mobile}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Extension</label>
                      <p className="text-gray-800 font-medium">{selectedEmployee.extension_number}</p>
                    </div>
                    {selectedEmployee.reporting_manager && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Reporting Manager</label>
                        <p className="text-gray-800 font-medium">{selectedEmployee.reporting_manager}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Today's Attendance */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Today's Attendance</h4>
                  
                  {attendance ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          attendance.status === 'Present' ? 'bg-green-100 text-green-800' :
                          attendance.status === 'Late' ? 'bg-yellow-100 text-yellow-800' :
                          attendance.status === 'Half Day' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {attendance.status}
                        </span>
                      </div>
                      
                      {attendance.check_in && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Check In:</span>
                          <span className="font-medium">{attendance.check_in}</span>
                        </div>
                      )}
                      
                      {attendance.check_out && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Check Out:</span>
                          <span className="font-medium">{attendance.check_out}</span>
                        </div>
                      )}
                      
                      {attendance.hours_worked !== null && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Hours Worked:</span>
                          <span className="font-medium">{attendance.hours_worked} hrs</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium">{attendance.date}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                      <p className="text-gray-500">Loading attendance...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;