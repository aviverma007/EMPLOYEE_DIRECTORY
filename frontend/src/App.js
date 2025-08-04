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
                       field === 'grade' ? 'grades' :
                       field === 'mobile' ? 'mobiles' :
                       'extension_numbers';
      
      const fieldSuggestions = fieldValues[fieldKey] || [];
      const matchingSuggestions = fieldSuggestions.filter(item => 
        item.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8);
      
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
      grade: '',
      mobile: '',
      extension_number: ''
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
    // Create colorful avatar based on employee name
    const colors = [
      'from-purple-400 to-pink-400',
      'from-blue-400 to-indigo-400', 
      'from-green-400 to-teal-400',
      'from-yellow-400 to-orange-400',
      'from-red-400 to-pink-400',
      'from-indigo-400 to-purple-400',
      'from-teal-400 to-green-400',
      'from-orange-400 to-red-400'
    ];
    
    const colorIndex = employee.emp_code.charCodeAt(employee.emp_code.length - 1) % colors.length;
    return colors[colorIndex];
  };

  const searchFieldsConfig = [
    { key: 'emp_code', label: 'Employee Code', placeholder: 'Search by employee code...', icon: '🆔' },
    { key: 'emp_name', label: 'Employee Name', placeholder: 'Search by name...', icon: '👤' },
    { key: 'department', label: 'Department', placeholder: 'Search by department...', icon: '🏢' },
    { key: 'location', label: 'Location', placeholder: 'Search by location...', icon: '📍' },
    { key: 'grade', label: 'Grade', placeholder: 'Search by grade...', icon: '⭐' },
    { key: 'mobile', label: 'Mobile', placeholder: 'Search by mobile...', icon: '📱' },
    { key: 'extension_number', label: 'Extension', placeholder: 'Search by extension...', icon: '☎️' }
  ];

  const displayedEmployees = filteredEmployees;
  const hasActiveFilters = Object.values(searchFields).some(value => value.trim() !== '');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center">
        <div className="text-center bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-3xl p-8 shadow-2xl">
          <div className="loading-spinner w-16 h-16 mx-auto mb-4 border-4 border-white"></div>
          <p className="text-white text-xl font-semibold">Loading Employee Directory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-white mb-4 text-shadow-lg animate-pulse">
            🏢 Employee Directory
          </h1>
          <p className="text-white text-xl font-medium opacity-90">Search and explore our amazing team members</p>
        </div>

        {/* Search Section */}
        <div className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-3xl shadow-2xl p-8 mb-8 border border-white border-opacity-30">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">🔍 Smart Search Filters</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {searchFieldsConfig.map(({ key, label, placeholder, icon }) => (
              <div key={key} className="relative">
                <label className="block text-lg font-bold text-white mb-3">
                  {icon} {label}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchFields[key]}
                    onChange={(e) => handleSearchChange(key, e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-6 py-4 bg-white bg-opacity-90 border-2 border-transparent rounded-2xl focus:ring-4 focus:ring-yellow-300 focus:border-yellow-400 transition-all duration-300 shadow-lg text-gray-800 font-medium placeholder-gray-500"
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-2xl">
                    {icon}
                  </div>
                </div>
                
                {/* Enhanced Suggestions Dropdown */}
                {showSuggestions[key] && suggestions[key]?.length > 0 && (
                  <div className="absolute z-20 w-full mt-2 bg-white bg-opacity-95 backdrop-filter backdrop-blur-lg border-2 border-yellow-200 rounded-2xl shadow-2xl max-h-48 overflow-y-auto animate-slide-down">
                    {suggestions[key].map((suggestion, idx) => (
                      <div
                        key={idx}
                        onClick={() => selectSuggestion(key, suggestion)}
                        className="px-6 py-3 hover:bg-gradient-to-r hover:from-yellow-100 hover:to-orange-100 cursor-pointer text-gray-800 font-medium transition-all duration-200 flex items-center space-x-2 border-b border-gray-100 last:border-b-0"
                      >
                        <span className="text-xl">{icon}</span>
                        <span>{suggestion}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex gap-4">
              <button
                onClick={clearAllFilters}
                className="px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-2xl hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg transform hover:scale-105"
              >
                🗑️ Clear All Filters
              </button>
              
              <button
                onClick={viewAllEmployees}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-2xl hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg transform hover:scale-105"
              >
                👥 View All Employees
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-white font-bold text-lg">🎨 View Mode:</span>
              <div className="flex bg-white bg-opacity-20 rounded-2xl p-1 backdrop-filter backdrop-blur-lg">
                <button
                  onClick={() => setViewMode('card')}
                  className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
                    viewMode === 'card' 
                      ? 'bg-yellow-400 text-gray-800 shadow-lg' 
                      : 'text-white hover:bg-white hover:bg-opacity-20'
                  }`}
                >
                  🎴 Cards
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
                    viewMode === 'list' 
                      ? 'bg-yellow-400 text-gray-800 shadow-lg' 
                      : 'text-white hover:bg-white hover:bg-opacity-20'
                  }`}
                >
                  📋 List
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white border-opacity-30">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-white">
              {hasActiveFilters || showAllEmployees ? (
                <>✨ Filtered Results ({displayedEmployees.length})</>
              ) : (
                <>🚀 Ready to Search!</>
              )}
            </h2>
          </div>

          {!hasActiveFilters && !showAllEmployees ? (
            <div className="text-center py-16">
              <div className="text-8xl mb-6 animate-bounce">🔍</div>
              <h3 className="text-white text-2xl font-bold mb-4">Start Your Search!</h3>
              <p className="text-white text-lg opacity-80 mb-8">Use the search filters above to find employees or click "View All Employees"</p>
              <button
                onClick={viewAllEmployees}
                className="px-12 py-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-800 font-bold text-xl rounded-3xl hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 shadow-2xl transform hover:scale-110 animate-pulse"
              >
                👥 View All Employees
              </button>
            </div>
          ) : displayedEmployees.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-8xl mb-6">😔</div>
              <p className="text-white text-xl font-medium">No employees found matching your search criteria</p>
            </div>
          ) : (
            <>
              {viewMode === 'card' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {displayedEmployees.map((employee, index) => (
                    <div
                      key={employee.emp_code}
                      onClick={() => handleEmployeeClick(employee)}
                      className="bg-white bg-opacity-90 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 cursor-pointer border-2 border-transparent hover:border-yellow-300 p-6 transform hover:scale-105 hover:-rotate-1 animate-fade-in card-hover"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      {/* Employee Image/Avatar */}
                      <div className="text-center mb-6">
                        <div className={`w-20 h-20 bg-gradient-to-br ${getEmployeeImage(employee)} rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-xl border-4 border-white`}>
                          {employee.emp_name.charAt(0)}
                        </div>
                        <h3 className="font-bold text-xl text-gray-800 mb-1">{employee.emp_name}</h3>
                        <p className="text-purple-600 font-semibold text-sm">#{employee.emp_code}</p>
                      </div>
                      
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-xl">
                          <span className="text-gray-600 font-medium">🏢 Department:</span>
                          <span className="font-bold text-blue-700">{employee.department}</span>
                        </div>
                        <div className="flex justify-between items-center bg-gradient-to-r from-green-50 to-teal-50 p-3 rounded-xl">
                          <span className="text-gray-600 font-medium">⭐ Grade:</span>
                          <span className="font-bold text-green-700">{employee.grade}</span>
                        </div>
                        <div className="flex justify-between items-center bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-xl">
                          <span className="text-gray-600 font-medium">📍 Location:</span>
                          <span className="font-bold text-purple-700">{employee.location}</span>
                        </div>
                        <div className="flex justify-between items-center bg-gradient-to-r from-orange-50 to-red-50 p-3 rounded-xl">
                          <span className="text-gray-600 font-medium">📱 Mobile:</span>
                          <span className="font-bold text-orange-700">{employee.mobile}</span>
                        </div>
                        <div className="flex justify-between items-center bg-gradient-to-r from-yellow-50 to-orange-50 p-3 rounded-xl">
                          <span className="text-gray-600 font-medium">☎️ Extension:</span>
                          <span className="font-bold text-yellow-700">{employee.extension_number}</span>
                        </div>
                      </div>
                      
                      <div className="mt-6 text-center">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold">
                          Click for Details & Attendance
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white bg-opacity-90 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">👤 Employee</th>
                          <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">🏢 Department</th>
                          <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">⭐ Grade</th>
                          <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">📍 Location</th>
                          <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">📱 Mobile</th>
                          <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">☎️ Extension</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {displayedEmployees.map((employee, index) => (
                          <tr
                            key={employee.emp_code}
                            onClick={() => handleEmployeeClick(employee)}
                            className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 cursor-pointer transition-all duration-300 transform hover:scale-[1.02]"
                            style={{ animationDelay: `${index * 0.05}s` }}
                          >
                            <td className="px-6 py-6 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className={`w-12 h-12 bg-gradient-to-br ${getEmployeeImage(employee)} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg border-2 border-white`}>
                                  {employee.emp_name.charAt(0)}
                                </div>
                                <div className="ml-4">
                                  <div className="text-lg font-bold text-gray-900">{employee.emp_name}</div>
                                  <div className="text-sm text-purple-600 font-semibold">#{employee.emp_code}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-6 whitespace-nowrap">
                              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
                                {employee.department}
                              </span>
                            </td>
                            <td className="px-6 py-6 whitespace-nowrap">
                              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
                                {employee.grade}
                              </span>
                            </td>
                            <td className="px-6 py-6 whitespace-nowrap">
                              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-bold">
                                {employee.location}
                              </span>
                            </td>
                            <td className="px-6 py-6 whitespace-nowrap">
                              <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-bold">
                                {employee.mobile}
                              </span>
                            </td>
                            <td className="px-6 py-6 whitespace-nowrap">
                              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-bold">
                                {employee.extension_number}
                              </span>
                            </td>
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

        {/* Selected Employee Modal */}
        {selectedEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-filter backdrop-blur-lg flex items-center justify-center z-50">
            <div className="bg-white bg-opacity-95 backdrop-filter backdrop-blur-lg rounded-3xl shadow-2xl p-8 m-4 max-w-4xl w-full max-h-[90vh] overflow-y-auto border-4 border-yellow-300">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  👤 Employee Profile
                </h2>
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="text-red-500 hover:text-red-700 text-3xl font-bold transition-all duration-200 hover:scale-110"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Employee Info */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 shadow-xl">
                  <div className="text-center mb-8">
                    <div className={`w-32 h-32 bg-gradient-to-br ${getEmployeeImage(selectedEmployee)} rounded-full flex items-center justify-center text-white font-bold text-4xl mx-auto mb-6 shadow-2xl border-4 border-white`}>
                      {selectedEmployee.emp_name.charAt(0)}
                    </div>
                    <h3 className="text-3xl font-bold text-gray-800 mb-2">{selectedEmployee.emp_name}</h3>
                    <p className="text-purple-600 font-bold text-lg">#{selectedEmployee.emp_code}</p>
                  </div>

                  <div className="space-y-4">
                    {[
                      { label: 'Department', value: selectedEmployee.department, icon: '🏢', color: 'blue' },
                      { label: 'Grade', value: selectedEmployee.grade, icon: '⭐', color: 'green' },
                      { label: 'Location', value: selectedEmployee.location, icon: '📍', color: 'purple' },
                      { label: 'Mobile', value: selectedEmployee.mobile, icon: '📱', color: 'orange' },
                      { label: 'Extension', value: selectedEmployee.extension_number, icon: '☎️', color: 'yellow' }
                    ].map((field, idx) => (
                      <div key={idx} className={`bg-gradient-to-r from-${field.color}-100 to-${field.color}-200 p-4 rounded-2xl shadow-lg`}>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center text-gray-700 font-bold">
                            <span className="text-2xl mr-3">{field.icon}</span>
                            {field.label}
                          </span>
                          <span className={`font-bold text-lg text-${field.color}-800`}>{field.value}</span>
                        </div>
                      </div>
                    ))}
                    
                    {selectedEmployee.reporting_manager && (
                      <div className="bg-gradient-to-r from-indigo-100 to-purple-200 p-4 rounded-2xl shadow-lg">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center text-gray-700 font-bold">
                            <span className="text-2xl mr-3">👨‍💼</span>
                            Reporting Manager
                          </span>
                          <span className="font-bold text-lg text-indigo-800">{selectedEmployee.reporting_manager}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Today's Attendance */}
                <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-3xl p-8 shadow-xl">
                  <h4 className="text-2xl font-bold text-gray-800 mb-6 text-center">📅 Today's Attendance</h4>
                  
                  {attendance ? (
                    <div className="space-y-4">
                      <div className="text-center mb-6">
                        <div className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-bold shadow-lg ${
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
                        <div key={idx} className="bg-white bg-opacity-80 p-4 rounded-2xl shadow-lg">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center text-gray-700 font-bold">
                              <span className="text-2xl mr-3">{item.icon}</span>
                              {item.label}
                            </span>
                            <span className="font-bold text-lg text-teal-800">{item.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="loading-spinner w-12 h-12 mx-auto mb-4 border-4 border-teal-600"></div>
                      <p className="text-gray-600 font-medium">Loading attendance...</p>
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