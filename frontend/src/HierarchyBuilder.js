import React, { useState, useEffect } from 'react';

const HierarchyBuilder = ({ employees }) => {
  const [hierarchyData, setHierarchyData] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'org-chart'
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  
  // Manual hierarchy building states
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedManager, setSelectedManager] = useState('');
  const [selectedSubordinate, setSelectedSubordinate] = useState('');
  const [availableManagers, setAvailableManagers] = useState([]);
  const [availableSubordinates, setAvailableSubordinates] = useState([]);

  // Get unique departments
  const departments = [...new Set(employees.map(emp => emp.department))].sort();

  useEffect(() => {
    if (selectedDepartment) {
      // Get employees in selected department
      const deptEmployees = employees.filter(emp => emp.department === selectedDepartment);
      setAvailableManagers(deptEmployees);
      setAvailableSubordinates(deptEmployees);
    } else {
      setAvailableManagers([]);
      setAvailableSubordinates([]);
    }
    setSelectedManager('');
    setSelectedSubordinate('');
  }, [selectedDepartment, employees]);

  useEffect(() => {
    if (selectedManager) {
      // Filter subordinates to exclude the selected manager and anyone already in hierarchy
      const usedEmployeeCodes = hierarchyData.map(h => h.emp_code);
      const availableSubs = employees.filter(emp => 
        emp.department === selectedDepartment && 
        emp.emp_code !== selectedManager &&
        !usedEmployeeCodes.includes(emp.emp_code)
      );
      setAvailableSubordinates(availableSubs);
    }
  }, [selectedManager, hierarchyData, selectedDepartment, employees]);

  const clearAllHierarchy = () => {
    setHierarchyData([]);
    setSelectedDepartment('');
    setSelectedManager('');
    setSelectedSubordinate('');
    setExpandedNodes(new Set());
  };

  const addHierarchyRelationship = () => {
    if (!selectedManager || !selectedSubordinate) {
      alert('Please select both manager and subordinate');
      return;
    }

    const managerEmployee = employees.find(emp => emp.emp_code === selectedManager);
    const subordinateEmployee = employees.find(emp => emp.emp_code === selectedSubordinate);

    if (!managerEmployee || !subordinateEmployee) {
      alert('Selected employees not found');
      return;
    }

    // Check if manager already exists in hierarchy
    const existingManagerIndex = hierarchyData.findIndex(h => h.emp_code === selectedManager);
    
    let newHierarchy = [...hierarchyData];
    
    if (existingManagerIndex >= 0) {
      // Manager exists, add subordinate to their direct reports
      const manager = newHierarchy[existingManagerIndex];
      const subordinateWithLevel = {
        ...subordinateEmployee,
        level: manager.level + 1,
        directReports: [],
        directReportsCount: 0,
        managerId: selectedManager
      };
      
      manager.directReports.push(subordinateWithLevel);
      manager.directReportsCount++;
      
      // Add subordinate to main hierarchy array
      newHierarchy.push(subordinateWithLevel);
    } else {
      // Manager doesn't exist, add both manager and subordinate
      const managerWithHierarchy = {
        ...managerEmployee,
        level: 0, // Will be recalculated based on their position
        directReports: [],
        directReportsCount: 0,
        managerId: null
      };
      
      const subordinateWithLevel = {
        ...subordinateEmployee,
        level: 1,
        directReports: [],
        directReportsCount: 0,
        managerId: selectedManager
      };
      
      managerWithHierarchy.directReports.push(subordinateWithLevel);
      managerWithHierarchy.directReportsCount = 1;
      
      newHierarchy.push(managerWithHierarchy);
      newHierarchy.push(subordinateWithLevel);
    }

    // Recalculate levels for all employees
    const recalculatedHierarchy = recalculateLevels(newHierarchy);
    setHierarchyData(recalculatedHierarchy);
    
    // Reset selections
    setSelectedManager('');
    setSelectedSubordinate('');
  };

  const recalculateLevels = (hierarchy) => {
    const hierarchyMap = new Map();
    hierarchy.forEach(emp => hierarchyMap.set(emp.emp_code, emp));
    
    // Find roots (employees with no manager in the hierarchy)
    const roots = hierarchy.filter(emp => !emp.managerId || !hierarchyMap.has(emp.managerId));
    
    // Set root levels to 0
    roots.forEach(root => root.level = 0);
    
    // Recursively set levels
    const setLevelsRecursively = (employee, level) => {
      employee.level = level;
      employee.directReports.forEach(subordinate => {
        const subordinateInHierarchy = hierarchyMap.get(subordinate.emp_code);
        if (subordinateInHierarchy) {
          setLevelsRecursively(subordinateInHierarchy, level + 1);
        }
      });
    };
    
    roots.forEach(root => setLevelsRecursively(root, 0));
    
    return hierarchy;
  };

  const removeEmployeeFromHierarchy = (empCode) => {
    // Remove employee and all their subordinates
    const removeEmployeeAndSubordinates = (empToRemove, hierarchy) => {
      // Find all subordinates of this employee
      const subordinates = hierarchy.filter(emp => emp.managerId === empToRemove);
      
      // Recursively remove subordinates
      subordinates.forEach(sub => {
        hierarchy = removeEmployeeAndSubordinates(sub.emp_code, hierarchy);
      });
      
      // Remove the employee from their manager's direct reports
      hierarchy.forEach(emp => {
        emp.directReports = emp.directReports.filter(sub => sub.emp_code !== empToRemove);
        emp.directReportsCount = emp.directReports.length;
      });
      
      // Remove the employee from main hierarchy
      return hierarchy.filter(emp => emp.emp_code !== empToRemove);
    };

    const updatedHierarchy = removeEmployeeAndSubordinates(empCode, [...hierarchyData]);
    setHierarchyData(updatedHierarchy);
  };

  const toggleNodeExpansion = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderHierarchyBuilder = () => (
    <div className="hierarchy-builder-manual">
      <div className="manual-builder-header">
        <h3>🏗️ Build Organization Hierarchy</h3>
        <button 
          onClick={clearAllHierarchy}
          className="clear-all-btn"
        >
          🗑️ Clear All
        </button>
      </div>

      <div className="manual-builder-form">
        {/* Department Selection */}
        <div className="form-group">
          <label>1. Select Department:</label>
          <select 
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="hierarchy-select"
          >
            <option value="">Choose Department...</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {selectedDepartment && (
          <>
            {/* Manager Selection */}
            <div className="form-group">
              <label>2. Select Manager:</label>
              <select 
                value={selectedManager}
                onChange={(e) => setSelectedManager(e.target.value)}
                className="hierarchy-select"
              >
                <option value="">Choose Manager...</option>
                {availableManagers.map(emp => (
                  <option key={emp.emp_code} value={emp.emp_code}>
                    {emp.emp_name} (#{emp.emp_code}) - {emp.designation}
                  </option>
                ))}
              </select>
            </div>

            {selectedManager && (
              <>
                {/* Subordinate Selection */}
                <div className="form-group">
                  <label>3. Select Who Reports to {availableManagers.find(e => e.emp_code === selectedManager)?.emp_name}:</label>
                  <select 
                    value={selectedSubordinate}
                    onChange={(e) => setSelectedSubordinate(e.target.value)}
                    className="hierarchy-select"
                  >
                    <option value="">Choose Subordinate...</option>
                    {availableSubordinates.map(emp => (
                      <option key={emp.emp_code} value={emp.emp_code}>
                        {emp.emp_name} (#{emp.emp_code}) - {emp.designation}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedSubordinate && (
                  <button 
                    onClick={addHierarchyRelationship}
                    className="add-relationship-btn"
                  >
                    ➕ Add Reporting Relationship
                  </button>
                )}
              </>
            )}
          </>
        )}
      </div>

      <div className="hierarchy-stats">
        <div className="stat-item">
          <span className="stat-label">Total Employees in Hierarchy:</span>
          <span className="stat-value">{hierarchyData.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Departments:</span>
          <span className="stat-value">{[...new Set(hierarchyData.map(h => h.department))].length}</span>
        </div>
      </div>
    </div>
  );

  const renderOrgChart = () => {
    const rootEmployees = hierarchyData.filter(emp => emp.level === 0);
    
    const renderEmployeeNode = (employee, level = 0) => {
      const hasDirectReports = employee.directReports && employee.directReports.length > 0;
      const isExpanded = expandedNodes.has(employee.emp_code);
      
      return (
        <div key={employee.emp_code} className="org-chart-node-compact">
          <div className="org-chart-card-compact">
            <div className="employee-avatar-compact">
              {employee.image_url ? (
                <img src={employee.image_url} alt={employee.emp_name} className="avatar-img-compact" />
              ) : (
                <div className="avatar-placeholder-compact">
                  {employee.emp_name.charAt(0)}
                </div>
              )}
            </div>
            <div className="employee-info-compact">
              <h4>{employee.emp_name}</h4>
              <p className="employee-code-compact">#{employee.emp_code}</p>
              <p className="employee-designation-compact">{employee.designation}</p>
              <p className="employee-department-compact">{employee.department}</p>
            </div>
            
            <div className="card-actions">
              {hasDirectReports && (
                <button 
                  onClick={() => toggleNodeExpansion(employee.emp_code)}
                  className="expand-btn"
                  title={isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isExpanded ? '▼' : '▶'}
                  <span className="reports-count-badge">{employee.directReports.length}</span>
                </button>
              )}
              <button 
                onClick={() => removeEmployeeFromHierarchy(employee.emp_code)}
                className="remove-btn-compact"
                title="Remove from hierarchy"
              >
                ✕
              </button>
            </div>
          </div>
          
          {hasDirectReports && isExpanded && (
            <div className="org-chart-children-compact">
              <div className="org-chart-line-compact"></div>
              <div className="org-chart-children-container-compact">
                {employee.directReports.map(report => renderEmployeeNode(report, level + 1))}
              </div>
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="org-chart-container-compact">
        {rootEmployees.length === 0 ? (
          <div className="empty-org-chart">
            <div className="text-4xl mb-4">🌳</div>
            <h3>No Hierarchy Created</h3>
            <p>Use the form above to build your organization hierarchy step by step</p>
          </div>
        ) : (
          <div className="org-chart-compact">
            <div className="org-chart-header">
              <h3>Organization Structure</h3>
              <div className="chart-controls">
                <button 
                  onClick={() => setExpandedNodes(new Set(hierarchyData.map(emp => emp.emp_code)))}
                  className="control-btn"
                >
                  ⬇ Expand All
                </button>
                <button 
                  onClick={() => setExpandedNodes(new Set())}
                  className="control-btn"
                >
                  ⬆ Collapse All
                </button>
              </div>
            </div>
            <div className="org-chart-grid">
              {rootEmployees.map(employee => renderEmployeeNode(employee))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTableView = () => (
    <div className="hierarchy-table-container">
      {hierarchyData.length === 0 ? (
        <div className="empty-hierarchy-table">
          <div className="text-4xl mb-4">📊</div>
          <h3>No Hierarchy Data</h3>
          <p>Use the form above to build your organizational hierarchy</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="hierarchy-table">
            <thead>
              <tr>
                <th>Level</th>
                <th>Employee</th>
                <th>Code</th>
                <th>Position</th>
                <th>Department</th>
                <th>Manager</th>
                <th>Direct Reports</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {hierarchyData
                .sort((a, b) => a.level - b.level || a.emp_name.localeCompare(b.emp_name))
                .map((employee, index) => {
                  const manager = employee.managerId ? employees.find(e => e.emp_code === employee.managerId) : null;
                  return (
                    <tr key={employee.emp_code} className="hierarchy-row">
                      <td>
                        <div className="level-indicator">
                          <div className="level-badge">{employee.level}</div>
                          <div className="level-indent" style={{ paddingLeft: `${employee.level * 20}px` }}>
                            {'└─'.repeat(employee.level > 0 ? 1 : 0)}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="employee-cell">
                          {employee.image_url ? (
                            <img src={employee.image_url} alt={employee.emp_name} className="employee-avatar-small" />
                          ) : (
                            <div className="employee-avatar-placeholder">
                              {employee.emp_name.charAt(0)}
                            </div>
                          )}
                          <span className="employee-name">{employee.emp_name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="employee-code">#{employee.emp_code}</span>
                      </td>
                      <td>
                        <span className="employee-position">{employee.designation}</span>
                      </td>
                      <td>
                        <span className="employee-department">{employee.department}</span>
                      </td>
                      <td>
                        {manager ? (
                          <span className="manager-info">
                            {manager.emp_name} (#{manager.emp_code})
                          </span>
                        ) : (
                          <span className="no-manager">Top Level</span>
                        )}
                      </td>
                      <td>
                        <div className="direct-reports">
                          <span className="reports-count">{employee.directReportsCount}</span>
                          <span className="reports-label">Direct Reports</span>
                        </div>
                      </td>
                      <td>
                        <button 
                          onClick={() => removeEmployeeFromHierarchy(employee.emp_code)}
                          className="action-btn remove"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="hierarchy-builder">
      <div className="hierarchy-builder-content-new">
        {/* Top Section - Manual Hierarchy Builder */}
        <div className="hierarchy-builder-panel">
          {renderHierarchyBuilder()}
        </div>

        {/* Bottom Section - View Toggle and Results */}
        <div className="hierarchy-view-panel">
          <div className="panel-header">
            <h3>🏗️ Organization Hierarchy</h3>
            <div className="view-controls">
              <div className="view-toggle">
                <button
                  onClick={() => setViewMode('table')}
                  className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                >
                  📊 Table
                </button>
                <button
                  onClick={() => setViewMode('org-chart')}
                  className={`toggle-btn ${viewMode === 'org-chart' ? 'active' : ''}`}
                >
                  🌳 Org Chart
                </button>
              </div>
            </div>
          </div>

          <div className="hierarchy-content">
            {viewMode === 'table' ? renderTableView() : renderOrgChart()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HierarchyBuilder;