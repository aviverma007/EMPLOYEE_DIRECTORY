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
    designation: '',
    mobile: ''
  });
  const [suggestions, setSuggestions] = useState({});
  const [showSuggestions, setShowSuggestions] = useState({});
  const [fieldValues, setFieldValues] = useState({});
  const [viewMode, setViewMode] = useState('card');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllEmployees, setShowAllEmployees] = useState(false);

  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchAllEmployees();
    fetchFieldValues();
  }, []);

  const fetchAllEmployees = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/employees`);
      const data = await response.json();
      setEmployees(data.employees);
      setFilteredEmployees([]);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setLoading(false);
    }
  };

  const fetchFieldValues = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/field-values`);
      const data = await response.json();
      setFieldValues(data);
    } catch (error) {
      console.error('Error fetching field values:', error);
    }
  };

  const handleSearchChange = async (field, value) => {
    const newSearchFields = { ...searchFields, [field]: value };
    setSearchFields(newSearchFields);

    if (value.length > 0) {
      // Get suggestions based on field values
      const fieldKey = field === 'emp_name' ? 'emp_names' :
                       field === 'emp_code' ? 'emp_codes' :
                       field === 'department' ? 'departments' :
                       field === 'location' ? 'locations' :
                       field === 'designation' ? 'designations' :
                       'mobiles';
      
      const fieldSuggestions = fieldValues[fieldKey] || [];
      const matchingSuggestions = fieldSuggestions.filter(item => 
        item.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 6);
      
      setSuggestions(prev => ({ ...prev, [field]: matchingSuggestions }));
      setShowSuggestions(prev => ({ ...prev, [field]: true }));
    } else {
      setSuggestions(prev => ({ ...prev, [field]: [] }));
      setShowSuggestions(prev => ({ ...prev, [field]: false }));
    }

    // Apply filters when user types
    applyFilters(newSearchFields);
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
      setFilteredEmployees([]);
      setShowAllEmployees(false);
      return;
    }

    try {
      const queryString = activeFilters
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
      
      const response = await fetch(`${backendUrl}/api/employees/filter?${queryString}`);
      const data = await response.json();
      setFilteredEmployees(data.employees);
      setShowAllEmployees(false);
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
      designation: '',
      mobile: ''
    });
    setFilteredEmployees([]);
    setSuggestions({});
    setShowSuggestions({});
    setShowAllEmployees(false);
  };

  const viewAllEmployees = () => {
    setFilteredEmployees(employees);
    setShowAllEmployees(true);
  };

  const getEmployeeImage = (employee) => {
    // Professional blue gradient variations
    const blueGradients = [
      'from-blue-500 to-blue-600',
      'from-blue-600 to-indigo-600', 
      'from-indigo-500 to-blue-500',
      'from-cyan-500 to-blue-500',
      'from-blue-400 to-blue-600',
      'from-indigo-400 to-indigo-600',
      'from-blue-500 to-cyan-500',
      'from-sky-500 to-blue-600'
    ];
    
    const colorIndex = employee.emp_code.charCodeAt(employee.emp_code.length - 1) % blueGradients.length;
    return blueGradients[colorIndex];
  };

  const searchFieldsConfig = [
    { key: 'emp_code', label: 'Employee Code', placeholder: 'Employee Code', icon: '🆔' },
    { key: 'emp_name', label: 'Employee Name', placeholder: 'Employee Name', icon: '👤' },
    { key: 'department', label: 'Department', placeholder: 'Department', icon: '🏢' },
    { key: 'location', label: 'Location', placeholder: 'Location', icon: '📍' },
    { key: 'designation', label: 'Designation', placeholder: 'Designation', icon: '⭐' },
    { key: 'mobile', label: 'Mobile', placeholder: 'Mobile Number', icon: '📱' }
  ];

  const displayedEmployees = filteredEmployees;
  const hasActiveFilters = Object.values(searchFields).some(value => value.trim() !== '');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-2xl border-2 border-blue-100">
          <div className="loading-spinner w-16 h-16 mx-auto mb-4 border-4 border-blue-600"></div>
          <p className="text-blue-800 text-xl font-semibold">Loading Employee Directory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-lg border-b-4 border-blue-600 mb-6">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-center space-x-4">
            <div className="w-16 h-16 rounded-xl shadow-lg overflow-hidden bg-white border-2 border-blue-200">
              <img 
                src="https://drive.google.com/uc?export=download&id=18D6OMrrNXNleg7DglVTg325vMggq9vlc" 
                alt="Smartworld Developers Logo" 
                className="w-full h-full object-contain p-1"
                onError={(e) => {
                  // Fallback to text logo if image fails to load
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="w-full h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-2xl" style={{display: 'none'}}>
                SW
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-blue-800 mb-1">
                SMARTWORLD DEVELOPERS PVT. LTD.
              </h1>
              <p className="text-blue-600 font-medium">Employee Directory</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6">
        {/* Compact Search Section */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6 border border-blue-200">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
            {searchFieldsConfig.map(({ key, label, placeholder }) => (
              <div key={key} className="relative">
                <input
                  type="text"
                  value={searchFields[key]}
                  onChange={(e) => handleSearchChange(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm font-medium"
                />
                
                {/* Compact Suggestions Dropdown */}
                {showSuggestions[key] && suggestions[key]?.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-blue-200 rounded-lg shadow-xl max-h-40 overflow-y-auto">
                    {suggestions[key].map((suggestion, idx) => (
                      <div
                        key={idx}
                        onClick={() => selectSuggestion(key, suggestion)}
                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 border-b border-gray-100 last:border-b-0"
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
            <div className="flex gap-2">
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition duration-200"
              >
                Clear Filters
              </button>
              
              <button
                onClick={viewAllEmployees}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition duration-200"
              >
                View All
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-gray-700 text-sm font-medium">View:</span>
              <div className="flex bg-gray-200 rounded-lg">
                <button
                  onClick={() => setViewMode('card')}
                  className={`px-3 py-1 rounded-l-lg text-sm font-medium transition duration-200 ${
                    viewMode === 'card' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cards
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded-r-lg text-sm font-medium transition duration-200 ${
                    viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  List
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-200">
          {!hasActiveFilters && !showAllEmployees ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 text-blue-400">🔍</div>
              <h3 className="text-blue-800 text-xl font-bold mb-2">Search Employees</h3>
              <p className="text-blue-600 mb-6">Use the filters above to search for employees</p>
              <button
                onClick={viewAllEmployees}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition duration-200"
              >
                View All Employees
              </button>
            </div>
          ) : displayedEmployees.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 text-gray-400">😔</div>
              <p className="text-gray-600 text-lg">No employees found matching your criteria</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-blue-800">
                  Employees ({displayedEmployees.length})
                </h2>
              </div>

              {viewMode === 'card' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {displayedEmployees.map((employee, index) => (
                    <div
                      key={employee.emp_code}
                      onClick={() => handleEmployeeClick(employee)}
                      className="bg-gradient-to-br from-white to-blue-50 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-blue-200 hover:border-blue-400 p-4 card-hover"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      {/* Simplified Employee Card - Only Image, Name, Designation */}
                      <div className="text-center">
                        <div className={`w-16 h-16 bg-gradient-to-br ${getEmployeeImage(employee)} rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-3 shadow-lg border-2 border-white`}>
                          {employee.emp_name.charAt(0)}
                        </div>
                        <h3 className="font-bold text-gray-800 text-sm mb-1">{employee.emp_name}</h3>
                        <p className="text-blue-600 font-medium text-xs mb-2">{employee.designation}</p>
                        <p className="text-gray-500 text-xs">#{employee.emp_code}</p>
                      </div>
                      
                      <div className="mt-3 text-center">
                        <div className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs">
                          Click for Details
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg overflow-hidden shadow-lg border border-blue-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-blue-600 text-white">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-bold">Employee</th>
                          <th className="px-4 py-3 text-left text-sm font-bold">Designation</th>
                          <th className="px-4 py-3 text-left text-sm font-bold">Department</th>
                          <th className="px-4 py-3 text-left text-sm font-bold">Location</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-blue-100">
                        {displayedEmployees.map((employee, index) => (
                          <tr
                            key={employee.emp_code}
                            onClick={() => handleEmployeeClick(employee)}
                            className="hover:bg-blue-50 cursor-pointer transition-colors duration-200"
                          >
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className={`w-10 h-10 bg-gradient-to-br ${getEmployeeImage(employee)} rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                                  {employee.emp_name.charAt(0)}
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-bold text-gray-900">{employee.emp_name}</div>
                                  <div className="text-xs text-gray-500">#{employee.emp_code}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                {employee.designation}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{employee.department}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{employee.location}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Enhanced Employee Modal */}
        {selectedEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 m-4 max-w-4xl w-full max-h-[90vh] overflow-y-auto border-4 border-blue-200">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-blue-800">Employee Profile</h2>
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold transition-all duration-200"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Employee Info */}
                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                  <div className="text-center mb-6">
                    <div className={`w-24 h-24 bg-gradient-to-br ${getEmployeeImage(selectedEmployee)} rounded-full flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4 shadow-xl border-4 border-white`}>
                      {selectedEmployee.emp_name.charAt(0)}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-1">{selectedEmployee.emp_name}</h3>
                    <p className="text-blue-600 font-bold">#{selectedEmployee.emp_code}</p>
                  </div>

                  <div className="space-y-4">
                    {[
                      { label: 'Department', value: selectedEmployee.department, icon: '🏢' },
                      { label: 'Designation', value: selectedEmployee.designation, icon: '⭐' },
                      { label: 'Location', value: selectedEmployee.location, icon: '📍' },
                      { label: 'Mobile', value: selectedEmployee.mobile, icon: '📱' }
                    ].map((field, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-xl border border-blue-200">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center text-gray-700 font-medium">
                            <span className="text-xl mr-3">{field.icon}</span>
                            {field.label}
                          </span>
                          <span className="font-bold text-blue-800">{field.value}</span>
                        </div>
                      </div>
                    ))}
                    
                    {selectedEmployee.reporting_manager && (
                      <div className="bg-white p-4 rounded-xl border border-blue-200">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center text-gray-700 font-medium">
                            <span className="text-xl mr-3">👨‍💼</span>
                            Reporting Manager
                          </span>
                          <span className="font-bold text-blue-800">{selectedEmployee.reporting_manager}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Today's Attendance */}
                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                  <h4 className="text-xl font-bold text-gray-800 mb-6 text-center">Today's Attendance</h4>
                  
                  {attendance ? (
                    <div className="space-y-4">
                      <div className="text-center mb-6">
                        <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-bold ${
                          attendance.status === 'Present' ? 'bg-green-500 text-white' :
                          attendance.status === 'Late' ? 'bg-yellow-500 text-white' :
                          attendance.status === 'Half Day' ? 'bg-blue-500 text-white' :
                          'bg-red-500 text-white'
                        }`}>
                          {attendance.status === 'Present' ? '✅' :
                           attendance.status === 'Late' ? '⏰' :
                           attendance.status === 'Half Day' ? '🕐' : '❌'}
                          <span className="ml-2">{attendance.status}</span>
                        </div>
                      </div>
                      
                      {[
                        { label: 'Check In', value: attendance.check_in, icon: '🕐' },
                        { label: 'Check Out', value: attendance.check_out, icon: '🕕' },
                        { label: 'Hours Worked', value: `${attendance.hours_worked} hrs`, icon: '⏱️' },
                        { label: 'Date', value: attendance.date, icon: '📅' }
                      ].filter(item => item.value && item.value !== '').map((item, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-xl border border-blue-200">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center text-gray-700 font-medium">
                              <span className="text-xl mr-3">{item.icon}</span>
                              {item.label}
                            </span>
                            <span className="font-bold text-blue-800">{item.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="loading-spinner w-8 h-8 mx-auto mb-4 border-4 border-blue-600"></div>
                      <p className="text-gray-600">Loading attendance...</p>
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