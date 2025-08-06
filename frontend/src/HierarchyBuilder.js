import React, { useState, useEffect } from 'react';

const HierarchyBuilder = ({ employees }) => {
  const [hierarchyData, setHierarchyData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'chart'
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedManager, setSelectedManager] = useState('');

  // Filter employees based on search
  const filteredEmployees = employees.filter(emp =>
    emp.emp_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.emp_code.includes(searchTerm) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addEmployeeToHierarchy = () => {
    if (!selectedEmployee || !selectedManager) return;

    const employee = employees.find(emp => emp.emp_code === selectedEmployee);
    const manager = employees.find(emp => emp.emp_code === selectedManager);

    if (!employee || !manager) return;

    setHierarchyData(prev => ({
      ...prev,
      [selectedEmployee]: {
        ...employee,
        manager: selectedManager,
        managerName: manager.emp_name
      }
    }));

    setSelectedEmployee('');
    setSelectedManager('');
  };

  const removeEmployeeFromHierarchy = (empCode) => {
    setHierarchyData(prev => {
      const newData = { ...prev };
      delete newData[empCode];
      
      // Also remove this employee as manager for others
      Object.keys(newData).forEach(key => {
        if (newData[key].manager === empCode) {
          delete newData[key].manager;
          delete newData[key].managerName;
        }
      });
      
      return newData;
    });
  };

  const clearAllHierarchy = () => {
    if (window.confirm('Are you sure you want to clear the entire hierarchy?')) {
      setHierarchyData({});
    }
  };

  const buildHierarchyTree = () => {
    const tree = {};
    const hierarchyArray = Object.values(hierarchyData);
    
    // Find root employees (those without managers)
    const roots = hierarchyArray.filter(emp => !emp.manager);
    
    // Build tree structure
    const buildNode = (employee) => {
      const children = hierarchyArray.filter(emp => emp.manager === employee.emp_code);
      return {
        ...employee,
        children: children.map(buildNode),
        level: 0
      };
    };
    
    return roots.map(buildNode);
  };

  const flattenHierarchy = () => {
    const tree = buildHierarchyTree();
    const flattened = [];
    
    const flatten = (nodes, level = 0) => {
      nodes.forEach(node => {
        flattened.push({ ...node, level });
        if (node.children && node.children.length > 0) {
          flatten(node.children, level + 1);
        }
      });
    };
    
    flatten(tree);
    return flattened;
  };

  const getDirectReports = (empCode) => {
    return Object.values(hierarchyData).filter(emp => emp.manager === empCode).length;
  };

  const renderOrgChart = () => {
    const tree = buildHierarchyTree();
    
    if (tree.length === 0) {
      return (
        <div className="empty-org-chart">
          <h3>No Hierarchy Built Yet</h3>
          <p>Use the controls above to add employees and build your organizational structure.</p>
        </div>
      );
    }

    const renderNode = (node, level = 0) => (
      <div key={node.emp_code} className="org-chart-node-compact">
        <div className="org-chart-card-compact">
          <div className="employee-avatar-compact">
            {node.image_url ? (
              <img
                src={node.image_url}
                alt={node.emp_name}
                className="avatar-img-compact"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div className={`avatar-placeholder-compact ${node.image_url ? 'hidden' : ''}`}>
              {node.emp_name.charAt(0)}
            </div>
          </div>
          
          <div className="employee-info-compact">
            <h4>{node.emp_name}</h4>
            <div className="employee-code-compact">#{node.emp_code}</div>
            <div className="employee-designation-compact">{node.designation}</div>
            <div className="employee-department-compact">{node.department}</div>
          </div>

          <div className="card-actions">
            {node.children && node.children.length > 0 && (
              <div className="expand-btn">
                {node.children.length}
                <div className="reports-count-badge">{node.children.length}</div>
              </div>
            )}
            <button
              onClick={() => removeEmployeeFromHierarchy(node.emp_code)}
              className="remove-btn-compact"
            >
              ×
            </button>
          </div>
        </div>

        {node.children && node.children.length > 0 && (
          <div className="org-chart-children-compact">
            <div className="org-chart-line-compact"></div>
            <div className="org-chart-children-container-compact">
              {node.children.map(child => renderNode(child, level + 1))}
            </div>
          </div>
        )}
      </div>
    );

    return (
      <div className="org-chart-container-compact">
        <div className="org-chart-compact">
          <div className="org-chart-header">
            <h3>Organizational Chart</h3>
            <div className="chart-controls">
              <button className="control-btn" onClick={() => window.print()}>
                🖨️ Print
              </button>
              <button className="control-btn" onClick={clearAllHierarchy}>
                🗑️ Clear All
              </button>
            </div>
          </div>
          <div className="org-chart-grid">
            {tree.map(root => renderNode(root))}
          </div>
        </div>
      </div>
    );
  };

  const renderTableView = () => {
    const flatHierarchy = flattenHierarchy();
    
    if (flatHierarchy.length === 0) {
      return (
        <div className="empty-hierarchy-table">
          <h3>No Hierarchy Built Yet</h3>
          <p>Use the controls above to add employees and build your organizational structure.</p>
        </div>
      );
    }

    return (
      <div className="hierarchy-table-container">
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
              {flatHierarchy.map(employee => (
                <tr key={employee.emp_code} className="hierarchy-row">
                  <td>
                    <div className="level-indicator">
                      <span className="level-badge">{employee.level + 1}</span>
                      <span className="level-indent">
                        {'└─'.repeat(employee.level)}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="employee-cell">
                      {employee.image_url ? (
                        <img
                          src={employee.image_url}
                          alt={employee.emp_name}
                          className="employee-avatar-small"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`employee-avatar-placeholder ${employee.image_url ? 'hidden' : ''}`}>
                        {employee.emp_name.charAt(0)}
                      </div>
                      <span className="employee-position">{employee.emp_name}</span>
                    </div>
                  </td>
                  <td className="text-blue-600 font-mono text-sm">#{employee.emp_code}</td>
                  <td className="text-gray-800 font-medium">{employee.designation}</td>
                  <td className="text-gray-600">{employee.department}</td>
                  <td>
                    <div className="direct-reports">
                      <span className="reports-count">{getDirectReports(employee.emp_code)}</span>
                      <span className="reports-label">reports</span>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const hierarchyStats = {
    totalEmployees: Object.keys(hierarchyData).length,
    totalLevels: Math.max(...flattenHierarchy().map(emp => emp.level + 1), 0),
    rootEmployees: buildHierarchyTree().length
  };

  return (
    <div className="hierarchy-builder">
      <div className="hierarchy-builder-content-new">
        {/* Manual Hierarchy Builder */}
        <div className="hierarchy-builder-panel">
          <div className="hierarchy-builder-manual">
            <div className="manual-builder-header">
              <h3>🏗️ Hierarchy Table Builder</h3>
              <button onClick={clearAllHierarchy} className="clear-all-btn">
                🗑️ Clear All
              </button>
            </div>

            <div className="manual-builder-form">
              <div className="form-group">
                <label htmlFor="employee-select">Select Employee</label>
                <select
                  id="employee-select"
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="hierarchy-select"
                >
                  <option value="">Choose employee...</option>
                  {employees
                    .filter(emp => !hierarchyData[emp.emp_code]) // Only show employees not in hierarchy
                    .map(emp => (
                      <option key={emp.emp_code} value={emp.emp_code}>
                        {emp.emp_name} (#{emp.emp_code}) - {emp.designation}
                      </option>
                    ))
                  }
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="manager-select">Reports To (Manager)</label>
                <select
                  id="manager-select"
                  value={selectedManager}
                  onChange={(e) => setSelectedManager(e.target.value)}
                  className="hierarchy-select"
                >
                  <option value="">Choose manager...</option>
                  {employees
                    .filter(emp => emp.emp_code !== selectedEmployee) // Can't report to themselves
                    .map(emp => (
                      <option key={emp.emp_code} value={emp.emp_code}>
                        {emp.emp_name} (#{emp.emp_code}) - {emp.designation}
                      </option>
                    ))
                  }
                </select>
              </div>

              <div className="form-group">
                <div className="mt-6">
                  {selectedEmployee && selectedManager && (
                    <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="manager-info">
                        <strong>{employees.find(emp => emp.emp_code === selectedEmployee)?.emp_name}</strong>
                        {' will report to '}
                        <strong>{employees.find(emp => emp.emp_code === selectedManager)?.emp_name}</strong>
                      </div>
                    </div>
                  )}
                  {selectedEmployee && !selectedManager && (
                    <div className="mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="no-manager">
                        <strong>{employees.find(emp => emp.emp_code === selectedEmployee)?.emp_name}</strong>
                        {' will be a root level employee (no manager)'}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={addEmployeeToHierarchy}
                disabled={!selectedEmployee}
                className="add-relationship-btn disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ➕ Add to Hierarchy
              </button>
            </div>

            {/* Hierarchy Stats */}
            {Object.keys(hierarchyData).length > 0 && (
              <div className="hierarchy-stats">
                <div className="stat-item">
                  <span className="stat-label">Total Employees</span>
                  <span className="stat-value">{hierarchyStats.totalEmployees}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Hierarchy Levels</span>
                  <span className="stat-value">{hierarchyStats.totalLevels}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Root Employees</span>
                  <span className="stat-value">{hierarchyStats.rootEmployees}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hierarchy View Panel */}
        <div className="hierarchy-view-panel">
          <div className="panel-header">
            <h3>📊 Hierarchy View</h3>
            <div className="view-controls">
              <div className="view-toggle">
                <button
                  onClick={() => setViewMode('table')}
                  className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                >
                  📊 Table
                </button>
                <button
                  onClick={() => setViewMode('chart')}
                  className={`toggle-btn ${viewMode === 'chart' ? 'active' : ''}`}
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