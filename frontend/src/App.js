import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import HierarchyBuilder from './HierarchyBuilder';

// Toast Notification Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`}>
      <div className="flex items-center">
        <span className="mr-2 text-lg">
          {type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
        </span>
        <p className="font-medium">{message}</p>
        <button onClick={onClose} className="ml-4 text-xl hover:opacity-70">×</button>
      </div>
    </div>
  );
};

// Theme Toggle Component
const ThemeToggle = ({ darkMode, toggleTheme }) => {
  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {darkMode ? '☀️' : '🌙'}
    </button>
  );
};

// Image Upload Component
const ImageUpload = ({ employeeCode, currentImage, onImageUpdate, onClose }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState(currentImage);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    // Upload file
    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => prev < 90 ? prev + 10 : prev);
      }, 100);

      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/employees/${employeeCode}/image`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const result = await response.json();
        onImageUpdate(result.image_url, 'Image uploaded successfully!');
        setTimeout(onClose, 1000);
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveImage = async () => {
    if (!currentImage) return;
    
    if (!confirm('Are you sure you want to remove this image?')) return;

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/employees/${employeeCode}/image`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onImageUpdate(null, 'Image removed successfully!');
        setPreview(null);
        setTimeout(onClose, 1000);
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to remove image');
      }
    } catch (error) {
      console.error('Remove error:', error);
      alert(`Failed to remove image: ${error.message}`);
    }
  };

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 m-4 max-w-md w-full modal-enter">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-blue-800">Upload Employee Image</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Image Preview */}
        {preview && (
          <div className="mb-6 text-center">
            <div className="inline-block relative">
              <img
                src={preview}
                alt="Preview"
                className="image-preview mx-auto"
                style={{ maxWidth: '150px', maxHeight: '150px' }}
              />
              {currentImage && (
                <div className="image-actions">
                  <button
                    onClick={handleRemoveImage}
                    className="btn-danger text-sm px-3 py-1"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upload Area */}
        <div
          className={`image-upload-container ${dragActive ? 'image-upload-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />
          
          <div className="text-center">
            <div className="text-4xl mb-4 text-blue-500">📸</div>
            <p className="text-blue-800 font-semibold mb-2">
              {dragActive ? 'Drop image here' : 'Click or drag image to upload'}
            </p>
            <p className="text-gray-600 text-sm">
              Supports JPG, PNG, GIF, WEBP (Max 5MB)
            </p>
          </div>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="upload-progress">
              <div 
                className="upload-progress-bar"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1 btn-primary disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Select Image'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 btn-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

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
  const [currentTab, setCurrentTab] = useState('directory'); // New state for tab management
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllEmployees, setShowAllEmployees] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [toast, setToast] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Hierarchy Builder Functions
  const getDepartments = () => {
    return [...new Set(employees.map(emp => emp.department))].sort();
  };

  const getDepartmentHeads = (department) => {
    return employees.filter(emp => 
      emp.department === department && 
      (emp.reporting_manager === '*' || emp.designation.toLowerCase().includes('president') || emp.designation.toLowerCase().includes('head'))
    );
  };

  const getDirectReports = (managerCode) => {
    return employees.filter(emp => {
      const manager = emp.reporting_manager;
      if (!manager || manager === '*') return false;
      
      // Extract manager code from format like "Name(Code)"
      const match = manager.match(/\(([^)]+)\)/);
      return match ? match[1] === managerCode : false;
    });
  };

  const buildHierarchy = (rootEmployee, level = 0, visited = new Set()) => {
    if (visited.has(rootEmployee.emp_code) || level > 5) return null; // Prevent infinite loops and deep nesting
    
    visited.add(rootEmployee.emp_code);
    const directReports = getDirectReports(rootEmployee.emp_code);
    
    return {
      ...rootEmployee,
      level,
      directReports: directReports.map(report => buildHierarchy(report, level + 1, new Set(visited)))
        .filter(Boolean) // Remove null entries
    };
  };

  const handleDepartmentChange = (department) => {
    setSelectedDepartment(department);
    setSelectedHead('');
    setHierarchyData({});
    
    if (department) {
      const heads = getDepartmentHeads(department);
      setDepartmentHeads(heads);
    } else {
      setDepartmentHeads([]);
    }
  };

  const handleHeadSelection = (headCode) => {
    setSelectedHead(headCode);
    
    if (headCode) {
      const headEmployee = employees.find(emp => emp.emp_code === headCode);
      if (headEmployee) {
        const hierarchy = buildHierarchy(headEmployee);
        setHierarchyData(hierarchy);
      }
    } else {
      setHierarchyData({});
    }
  };

  useEffect(() => {
    fetchAllEmployees();
    fetchFieldValues();
    
    // Load theme preference from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    // Close suggestions when clicking outside
    const handleClickOutside = (event) => {
      if (!event.target.closest('.relative')) {
        setShowSuggestions({});
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  const fetchAllEmployees = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/employees`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setEmployees(data.employees);
      setFilteredEmployees([]);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching employees:', error);
      showToast('Failed to load employees', 'error');
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

    // Only show suggestions when user has typed something
    if (value.length === 0) {
      setSuggestions(prev => ({ ...prev, [field]: [] }));
      setShowSuggestions(prev => ({ ...prev, [field]: false }));
      applyFilters(newSearchFields);
      return;
    }

    try {
      // Use the enhanced backend API for better suggestions
      const response = await fetch(`${backendUrl}/api/employees/search?q=${encodeURIComponent(value)}&field=${field}`);
      const data = await response.json();
      
      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(prev => ({ ...prev, [field]: data.suggestions }));
        setShowSuggestions(prev => ({ ...prev, [field]: true }));
      } else {
        setSuggestions(prev => ({ ...prev, [field]: [] }));
        setShowSuggestions(prev => ({ ...prev, [field]: false }));
      }
      
      // Update the filtered employees with the search results
      if (value.length > 0) {
        setFilteredEmployees(data.employees || []);
      } else {
        // Apply existing filters when input is cleared
        applyFilters(newSearchFields);
      }
    } catch (error) {
      console.error('Error fetching search suggestions:', error);
      // Fallback to local filtering
      if (value.length > 0) {
        const fieldKey = field === 'emp_name' ? 'emp_names' :
                         field === 'emp_code' ? 'emp_codes' :
                         field === 'department' ? 'departments' :
                         field === 'location' ? 'locations' :
                         field === 'designation' ? 'designations' :
                         field === 'mobile' ? 'mobiles' :
                         'designations';
        
        const fieldSuggestions = fieldValues[fieldKey] || [];
        const matchingSuggestions = fieldSuggestions.filter(item => 
          item && item.toLowerCase().includes(value.toLowerCase())
        ).slice(0, 6);
        
        setSuggestions(prev => ({ ...prev, [field]: matchingSuggestions }));
        setShowSuggestions(prev => ({ ...prev, [field]: matchingSuggestions.length > 0 }));
      } else {
        setSuggestions(prev => ({ ...prev, [field]: [] }));
        setShowSuggestions(prev => ({ ...prev, [field]: false }));
      }
      
      applyFilters(newSearchFields);
    }
  };

  const handleInputFocus = async (field) => {
    // Don't show suggestions automatically on focus - only when user types
    // This was causing the hassle mentioned by user
  };

  const selectSuggestion = (field, value) => {
    const newSearchFields = { ...searchFields, [field]: value };
    setSearchFields(newSearchFields);
    setShowSuggestions(prev => ({ ...prev, [field]: false }));
    setSuggestions(prev => ({ ...prev, [field]: [] }));
    
    applyFilters(newSearchFields);
  };

  const applyFilters = async (filters = searchFields) => {
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
      
      // Ensure we're showing the right employees by logging the filter
      console.log(`Applied filters:`, activeFilters, `Found ${data.employees.length} employees`);
      
      setFilteredEmployees(data.employees);
      setShowAllEmployees(false);
    } catch (error) {
      console.error('Error filtering employees:', error);
      showToast('Error filtering employees', 'error');
    }
  };

  const handleEmployeeClick = async (employee) => {
    setSelectedEmployee(employee);
    setAttendance(null);
    
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
    if (employee.image_url) {
      return employee.image_url;
    }
    
    // Professional blue gradient variations for fallback
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

  const handleImageUpload = (emp_code) => {
    const employee = employees.find(emp => emp.emp_code === emp_code) || selectedEmployee;
    if (employee) {
      setSelectedEmployee(employee);
      setShowImageUpload(true);
    }
  };

  const handleImageUpdate = (newImageUrl, message = 'Image updated successfully!') => {
    // Update employees list
    setEmployees(prev => prev.map(emp => 
      emp.emp_code === selectedEmployee.emp_code 
        ? { ...emp, image_url: newImageUrl }
        : emp
    ));
    
    // Update filtered employees if applicable
    setFilteredEmployees(prev => prev.map(emp => 
      emp.emp_code === selectedEmployee.emp_code 
        ? { ...emp, image_url: newImageUrl }
        : emp
    ));
    
    // Update selected employee
    if (selectedEmployee) {
      setSelectedEmployee(prev => ({ ...prev, image_url: newImageUrl }));
    }
    
    showToast(message, 'success');
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
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${darkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-white'}`}>
        <ThemeToggle darkMode={darkMode} toggleTheme={toggleTheme} />
        <div className="text-center bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border-2 border-blue-100 dark:border-gray-600 glass-effect">
          <div className="skeleton-image w-16 h-16 mx-auto mb-4 rounded-full"></div>
          <p className="text-blue-800 dark:text-blue-200 text-xl font-semibold animate-pulse">Loading Employee Directory...</p>
          <div className="mt-4 flex justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
            <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
            <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-blue-50'}`}>
      {/* Theme Toggle */}
      <ThemeToggle darkMode={darkMode} toggleTheme={toggleTheme} />
      
      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}

      {/* Enhanced Header */}
      <div className="header-professional shadow-professional dark:bg-gray-800 dark:border-gray-600">
        <div className="container mx-auto px-6 py-4">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-professional-primary dark:text-white mb-2 animate-fade-in">
              SMARTWORLD DEVELOPERS PVT. LTD.
            </h1>
            <p className="text-2xl font-semibold text-professional-secondary dark:text-gray-300">Employee Directory</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="container mx-auto px-6 mb-6">
        <div className="glass-effect rounded-professional shadow-professional p-4 border-professional">
          <div className="flex space-x-1 bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setCurrentTab('directory')}
              className={`flex-1 px-6 py-3 font-medium transition-all duration-200 rounded-md ${
                currentTab === 'directory' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              🏢 Employee Directory
            </button>
            <button
              onClick={() => setCurrentTab('hierarchy')}
              className={`flex-1 px-6 py-3 font-medium transition-all duration-200 rounded-md ${
                currentTab === 'hierarchy' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              🌳 Hierarchy Builder
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6">
        {currentTab === 'directory' ? (
          <>
            {/* Enhanced Search Section */}
            <div className="glass-effect rounded-professional shadow-professional-lg p-6 mb-6 border-professional animate-slide-up">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-4 mb-6">
            {searchFieldsConfig.map(({ key, label, placeholder, icon }) => (
              <div key={key} className="relative">
                <div className="relative">
                  <span className="search-input-icon">{icon}</span>
                  <input
                    type="text"
                    value={searchFields[key]}
                    onChange={(e) => handleSearchChange(key, e.target.value)}
                    onFocus={() => handleInputFocus(key)}
                    placeholder={placeholder}
                    className="search-input"
                  />
                </div>
                
                {showSuggestions[key] && suggestions[key]?.length > 0 && (
                  <div className="suggestions-dropdown animate-slide-down">
                    {suggestions[key].map((suggestion, idx) => (
                      <div
                        key={idx}
                        onClick={() => selectSuggestion(key, suggestion)}
                        className="suggestion-item"
                        title={`Select: ${suggestion}`}
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
            <div className="flex gap-3">
              <button
                onClick={clearAllFilters}
                className="btn-secondary ripple"
              >
                Clear Filters
              </button>
              
              <button
                onClick={viewAllEmployees}
                className="btn-primary ripple"
              >
                View All Employees
              </button>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-professional-muted dark:text-gray-300 font-medium">View:</span>
              <div className="flex bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('card')}
                  className={`px-4 py-2 font-medium transition-all duration-200 ${
                    viewMode === 'card' 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500'
                  }`}
                >
                  🎴 Cards
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 font-medium transition-all duration-200 ${
                    viewMode === 'list' 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500'
                  }`}
                >
                  📋 List
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Results Section */}
        <div className="glass-effect rounded-professional shadow-professional-lg p-6 border-professional">
          {!hasActiveFilters && !showAllEmployees ? (
            <div className="text-center py-16 animate-fade-in">
              <div className="text-8xl mb-6 text-blue-400 animate-bounce">🔍</div>
              <h3 className="text-professional-primary dark:text-white text-2xl font-bold mb-3">Discover Our Team</h3>
              <p className="text-professional-secondary dark:text-gray-300 mb-8 text-lg">Use the advanced filters above to find employees</p>
              <button
                onClick={viewAllEmployees}
                className="btn-primary text-lg px-8 py-4 ripple"
              >
                🚀 View All Employees
              </button>
            </div>
          ) : displayedEmployees.length === 0 ? (
            <div className="text-center py-16 animate-fade-in">
              <div className="text-8xl mb-6 text-gray-400">😔</div>
              <h3 className="text-gray-600 dark:text-gray-300 text-xl font-bold mb-3">No Employees Found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Try adjusting your search criteria</p>
              <button
                onClick={clearAllFilters}
                className="btn-primary ripple"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-professional-primary dark:text-white animate-fade-in">
                  Our Team ({displayedEmployees.length} {displayedEmployees.length === 1 ? 'Employee' : 'Employees'})
                </h2>
              </div>

              {viewMode === 'card' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {displayedEmployees.map((employee, index) => (
                    <div
                      key={employee.emp_code}
                      onClick={() => handleEmployeeClick(employee)}
                      className="employee-card animate-slide-up"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="text-center relative">
                        {employee.image_url ? (
                          <div className="relative inline-block">
                            <img
                              src={employee.image_url}
                              alt={employee.emp_name}
                              className="w-20 h-20 rounded-full mx-auto mb-4 object-cover shadow-lg border-4 border-white"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <div
                              className={`w-20 h-20 bg-gradient-to-br ${getEmployeeImage(employee)} rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg border-4 border-white`}
                              style={{display: 'none'}}
                            >
                              {employee.emp_name.charAt(0)}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleImageUpload(employee.emp_code);
                              }}
                              className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 text-white rounded-full text-xs hover:bg-blue-600 transition-colors"
                              title="Upload/Change Image"
                            >
                              📸
                            </button>
                          </div>
                        ) : (
                          <div className="relative inline-block">
                            <div className={`w-20 h-20 bg-gradient-to-br ${getEmployeeImage(employee)} rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg border-4 border-white`}>
                              {employee.emp_name.charAt(0)}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleImageUpload(employee.emp_code);
                              }}
                              className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 text-white rounded-full text-xs hover:bg-blue-600 transition-colors"
                              title="Upload Image"
                            >
                              📸
                            </button>
                          </div>
                        )}
                        
                        <h3 className="font-bold text-gray-800 text-sm mb-1">{employee.emp_name}</h3>
                        <p className="text-professional-secondary font-medium text-xs mb-1">{employee.designation}</p>
                        <p className="text-professional-muted text-xs mb-1">#{employee.emp_code}</p>
                        
                        {/* Additional Info */}
                        <div className="space-y-1 mb-3">
                          <p className="text-gray-600 text-xs">🏢 {employee.department}</p>
                          <p className="text-gray-600 text-xs">📍 {employee.location}</p>
                          {employee.joining_date && <p className="text-gray-600 text-xs">📅 {employee.joining_date}</p>}
                        </div>
                        
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                          Click for Details
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="table-container">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr>
                          <th className="table-header">Employee</th>
                          <th className="table-header">Designation</th>
                          <th className="table-header">Department</th>
                          <th className="table-header">Location</th>
                          <th className="table-header">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-blue-100">
                        {displayedEmployees.map((employee, index) => (
                          <tr
                            key={employee.emp_code}
                            onClick={() => handleEmployeeClick(employee)}
                            className="hover:bg-blue-50 cursor-pointer transition-all duration-200 animate-slide-up"
                            style={{ animationDelay: `${index * 0.05}s` }}
                          >
                            <td className="table-cell">
                              <div className="flex items-center">
                                {employee.image_url ? (
                                  <img
                                    src={employee.image_url}
                                    alt={employee.emp_name}
                                    className="w-12 h-12 rounded-full object-cover shadow-md border-2 border-white"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                <div className={`w-12 h-12 bg-gradient-to-br ${getEmployeeImage(employee)} rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ${employee.image_url ? 'hidden' : ''}`}>
                                  {employee.emp_name.charAt(0)}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-bold text-gray-900">{employee.emp_name}</div>
                                  <div className="text-xs text-professional-muted">#{employee.emp_code}</div>
                                </div>
                              </div>
                            </td>
                            <td className="table-cell">
                              <span className="status-badge bg-blue-100 text-blue-800">
                                {employee.designation}
                              </span>
                            </td>
                            <td className="table-cell text-gray-900">{employee.department}</td>
                            <td className="table-cell text-gray-900">{employee.location}</td>
                            <td className="table-cell">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleImageUpload(employee.emp_code);
                                }}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                title="Upload/Change Image"
                              >
                                📸 Image
                              </button>
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

        {/* Enhanced Employee Modal */}
        {selectedEmployee && (
          <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
            <div className="glass-effect-dark rounded-2xl shadow-2xl p-4 max-w-4xl w-full max-h-[95vh] overflow-hidden border-2 border-white border-opacity-20 modal-enter">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Employee Profile</h2>
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="text-white hover:text-gray-300 text-2xl font-bold transition-all duration-200 hover:rotate-90"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden">
                {/* Employee Info */}
                <div className="glass-effect rounded-xl p-4 border border-white border-opacity-20">
                  <div className="text-center mb-4">
                    <div className="relative inline-block">
                      {selectedEmployee.image_url ? (
                        <img
                          src={selectedEmployee.image_url}
                          alt={selectedEmployee.emp_name}
                          className="w-20 h-20 rounded-full mx-auto mb-3 object-cover shadow-lg border-2 border-white"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`w-20 h-20 bg-gradient-to-br ${getEmployeeImage(selectedEmployee)} rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3 shadow-lg border-2 border-white ${selectedEmployee.image_url ? 'hidden' : ''}`}>
                        {selectedEmployee.emp_name.charAt(0)}
                      </div>
                      <button
                        onClick={() => handleImageUpload(selectedEmployee.emp_code)}
                        className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-lg text-xs"
                        title="Upload/Change Image"
                      >
                        📸
                      </button>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{selectedEmployee.emp_name}</h3>
                    <p className="text-professional-secondary font-bold text-sm">#{selectedEmployee.emp_code}</p>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {[
                      { label: 'Department', value: selectedEmployee.department, icon: '🏢' },
                      { label: 'Designation', value: selectedEmployee.designation, icon: '⭐' },
                      { label: 'Location', value: selectedEmployee.location, icon: '📍' },
                      { label: 'Mobile', value: selectedEmployee.mobile, icon: '📱' },
                      { label: 'Joining Date', value: selectedEmployee.joining_date, icon: '📅' }
                    ].filter(field => field.value).map((field, idx) => (
                      <div key={idx} className="bg-white bg-opacity-90 p-2 rounded-lg border border-blue-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center text-gray-700 font-medium text-sm">
                            <span className="text-lg mr-2">{field.icon}</span>
                            {field.label}
                          </span>
                          <span className="font-bold text-professional-primary text-sm">{field.value}</span>
                        </div>
                      </div>
                    ))}
                    
                    {selectedEmployee.reporting_manager && (
                      <div className="bg-white bg-opacity-90 p-2 rounded-lg border border-blue-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center text-gray-700 font-medium text-sm">
                            <span className="text-lg mr-2">👨‍💼</span>
                            Reporting Manager
                          </span>
                          <span className="font-bold text-professional-primary text-sm">{selectedEmployee.reporting_manager}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Today's Attendance */}
                <div className="glass-effect rounded-xl p-4 border border-white border-opacity-20">
                  <h4 className="text-xl font-bold text-gray-800 mb-4 text-center">Today's Attendance</h4>
                  
                  {attendance ? (
                    <div className="space-y-3">
                      <div className="text-center mb-4">
                        <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-lg ${
                          attendance.status === 'Present' ? 'status-present' :
                          attendance.status === 'Late' ? 'status-late' :
                          attendance.status === 'Half Day' ? 'status-half-day' :
                          'status-absent'
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
                        <div key={idx} className="bg-white bg-opacity-90 p-2 rounded-lg border border-blue-200 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center text-gray-700 font-medium text-sm">
                              <span className="text-lg mr-2">{item.icon}</span>
                              {item.label}
                            </span>
                            <span className="font-bold text-professional-primary text-sm">{item.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="skeleton-image w-12 h-12 mx-auto mb-3 rounded-full"></div>
                      <p className="text-gray-600 text-sm">Loading attendance...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Image Upload Modal */}
        {showImageUpload && selectedEmployee && (
          <ImageUpload
            employeeCode={selectedEmployee.emp_code}
            currentImage={selectedEmployee.image_url}
            onImageUpdate={handleImageUpdate}
            onClose={() => setShowImageUpload(false)}
          />
        )}
        </>
        ) : (
          /* Hierarchy Builder Content */
          <HierarchyBuilder 
            employees={employees}
          />
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={viewAllEmployees}
        className="fab"
        title="View All Employees"
      >
        👥
      </button>
    </div>
  );
}

export default App;