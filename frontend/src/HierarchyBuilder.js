import React, { useState, useEffect } from 'react';

const HierarchyBuilder = ({ employees }) => {
  const [hierarchyData, setHierarchyData] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'org-chart'
  const [draggedEmployee, setDraggedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Initialize hierarchy data
  useEffect(() => {
    if (employees.length > 0) {
      // Create initial hierarchy from existing reporting structure
      buildInitialHierarchy();
    }
  }, [employees]);

  const buildInitialHierarchy = () => {
    const hierarchyMap = new Map();
    const rootEmployees = [];

    employees.forEach(emp => {
      const hierarchyItem = {
        ...emp,
        level: 0,
        directReports: [],
        directReportsCount: 0,
        id: emp.emp_code
      };
      hierarchyMap.set(emp.emp_code, hierarchyItem);
    });

    // Build hierarchy based on reporting manager
    employees.forEach(emp => {
      if (emp.reporting_manager && emp.reporting_manager !== '*') {
        // Extract manager code from format like "Name(Code)"
        const match = emp.reporting_manager.match(/\(([^)]+)\)/);
        const managerCode = match ? match[1] : null;
        
        if (managerCode && hierarchyMap.has(managerCode)) {
          const employee = hierarchyMap.get(emp.emp_code);
          const manager = hierarchyMap.get(managerCode);
          
          manager.directReports.push(employee);
          manager.directReportsCount++;
          employee.level = manager.level + 1;
        } else {
          rootEmployees.push(hierarchyMap.get(emp.emp_code));
        }
      } else {
        rootEmployees.push(hierarchyMap.get(emp.emp_code));
      }
    });

    // Flatten hierarchy for table view
    const flatHierarchy = [];
    const flattenHierarchy = (items, level = 0) => {
      items.forEach(item => {
        item.level = level;
        flatHierarchy.push(item);
        if (item.directReports.length > 0) {
          flattenHierarchy(item.directReports, level + 1);
        }
      });
    };

    flattenHierarchy(rootEmployees);
    setHierarchyData(flatHierarchy);
  };

  const addEmployeeToHierarchy = (employee, parentId = null) => {
    const newHierarchyItem = {
      ...employee,
      id: employee.emp_code,
      directReports: [],
      directReportsCount: 0,
      level: parentId ? hierarchyData.find(h => h.id === parentId)?.level + 1 : 0
    };

    if (parentId) {
      setHierarchyData(prev => 
        prev.map(item => 
          item.id === parentId 
            ? { ...item, directReports: [...item.directReports, newHierarchyItem], directReportsCount: item.directReportsCount + 1 }
            : item
        ).concat([newHierarchyItem])
      );
    } else {
      setHierarchyData(prev => [...prev, newHierarchyItem]);
    }

    setSelectedEmployees(prev => [...prev, employee.emp_code]);
  };

  const removeEmployeeFromHierarchy = (employeeId) => {
    setHierarchyData(prev => prev.filter(item => item.id !== employeeId));
    setSelectedEmployees(prev => prev.filter(id => id !== employeeId));
  };

  const updateEmployeePosition = (employeeId, newParentId) => {
    setHierarchyData(prev => {
      const updated = [...prev];
      const employeeIndex = updated.findIndex(item => item.id === employeeId);
      const employee = updated[employeeIndex];
      
      if (employee) {
        // Remove from old parent
        updated.forEach(item => {
          if (item.directReports.some(report => report.id === employeeId)) {
            item.directReports = item.directReports.filter(report => report.id !== employeeId);
            item.directReportsCount--;
          }
        });

        // Add to new parent or root
        if (newParentId) {
          const newParent = updated.find(item => item.id === newParentId);
          if (newParent) {
            employee.level = newParent.level + 1;
            newParent.directReports.push(employee);
            newParent.directReportsCount++;
          }
        } else {
          employee.level = 0;
        }
      }

      return updated;
    });
  };

  const filteredEmployees = employees.filter(emp => 
    !selectedEmployees.includes(emp.emp_code) &&
    (emp.emp_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     emp.emp_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
     emp.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const [expandedNodes, setExpandedNodes] = useState(new Set());

  const toggleNodeExpansion = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderOrgChart = () => {
    const rootEmployees = hierarchyData.filter(emp => emp.level === 0);
    
    const renderEmployeeNode = (employee, level = 0) => {
      const hasDirectReports = employee.directReports && employee.directReports.length > 0;
      const isExpanded = expandedNodes.has(employee.id);
      
      return (
        <div key={employee.id} className="org-chart-node-compact">
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
                  onClick={() => toggleNodeExpansion(employee.id)}
                  className="expand-btn"
                  title={isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isExpanded ? '▼' : '▶'}
                  <span className="reports-count-badge">{employee.directReports.length}</span>
                </button>
              )}
              <button 
                onClick={() => removeEmployeeFromHierarchy(employee.id)}
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
            <p>Start building your organization chart by adding employees from the left panel</p>
          </div>
        ) : (
          <div className="org-chart-compact">
            <div className="org-chart-header">
              <h3>Organization Structure</h3>
              <div className="chart-controls">
                <button 
                  onClick={() => setExpandedNodes(new Set(hierarchyData.map(emp => emp.id)))}
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
          <div className="text-6xl mb-4">📊</div>
          <h3>No Hierarchy Data</h3>
          <p>Add employees to build your organizational hierarchy</p>
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
                <th>Direct Reports</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {hierarchyData
                .sort((a, b) => a.level - b.level || a.emp_name.localeCompare(b.emp_name))
                .map((employee, index) => (
                  <tr key={employee.id} className="hierarchy-row">
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
                      <div className="direct-reports">
                        <span className="reports-count">{employee.directReportsCount}</span>
                        <span className="reports-label">Direct Reports</span>
                      </div>
                    </td>
                    <td>
                      <button 
                        onClick={() => removeEmployeeFromHierarchy(employee.id)}
                        className="action-btn remove"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="hierarchy-builder">
      <div className="hierarchy-builder-content">
        {/* Left Panel - Employee Selection */}
        <div className="employee-selection-panel">
          <div className="panel-header">
            <h3>👥 Add Employees</h3>
            <div className="search-container">
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="employee-search"
              />
            </div>
          </div>
          
          <div className="employee-list">
            {filteredEmployees.length === 0 ? (
              <div className="no-employees">
                <p>No employees available to add</p>
              </div>
            ) : (
              filteredEmployees.map(employee => (
                <div key={employee.emp_code} className="employee-item">
                  <div className="employee-item-info">
                    {employee.image_url ? (
                      <img src={employee.image_url} alt={employee.emp_name} className="employee-avatar-tiny" />
                    ) : (
                      <div className="employee-avatar-tiny-placeholder">
                        {employee.emp_name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="employee-name">{employee.emp_name}</div>
                      <div className="employee-details">#{employee.emp_code} • {employee.department}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => addEmployeeToHierarchy(employee)}
                    className="add-employee-btn"
                  >
                    + Add
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Hierarchy View */}
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