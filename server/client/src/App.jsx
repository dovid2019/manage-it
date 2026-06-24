import React, { useState, useEffect } from 'react';

function App() {
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  
  // Form States
  const [currentLocation, setCurrentLocation] = useState('');
  const [assignedEmployee, setAssignedEmployee] = useState('');
  const [scheduledDateTime, setScheduledDateTime] = useState('');

  // Fetch data on load
  useEffect(() => {
    fetch('http://localhost:5000/api/properties')
      .then(res => res.json())
      .then(data => setProperties(data));
  }, []);

  // Submit Key Collection Task
  const handleAddTask = (e) => {
    e.preventDefault();
    if (!selectedProperty) return;

    const taskData = {
      type: 'Key Collection',
      currentLocation,
      assignedEmployee,
      scheduledDateTime
    };

    fetch(`http://localhost:5000/api/properties/${selectedProperty.id}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    })
    .then(res => res.json())
    .then(updatedProperty => {
      setProperties(properties.map(p => p.id === updatedProperty.id ? updatedProperty : p));
      setSelectedProperty(updatedProperty);
      // Reset Form
      setCurrentLocation('');
      setAssignedEmployee('');
      setScheduledDateTime('');
    });
  };

  // Mark task as Collected (triggers backend email)
  const handleCollectKey = (propertyId, taskId) => {
    fetch(`http://localhost:5000/api/properties/${propertyId}/tasks/${taskId}/collect`, {
      method: 'POST'
    })
    .then(res => res.json())
    .then(data => {
      alert(data.message); // Let user know email went out!
      setProperties(properties.map(p => p.id === data.property.id ? data.property : p));
      if (selectedProperty && selectedProperty.id === data.property.id) {
        setSelectedProperty(data.property);
      }
    });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>🏢 Property Management Dashboard</h1>
      <hr />

      <div style={{ display: 'flex', gap: '40px', marginTop: '20px' }}>
        {/* Left Side: Property List */}
        <div style={{ flex: 1 }}>
          <h2>Property Portfolio</h2>
          <div style={{ display: 'grid', gap: '10px' }}>
            {properties.map(property => (
              <div 
                key={property.id} 
                onClick={() => setSelectedProperty(property)}
                style={{ 
                  padding: '15px', 
                  border: '1px solid #ccc', 
                  borderRadius: '5px', 
                  cursor: 'pointer',
                  background: selectedProperty?.id === property.id ? '#f0f7ff' : '#fff'
                }}
              >
                <h3>{property.name}</h3>
                <p style={{ color: '#666' }}>📩 Landlord: {property.landlordEmail}</p>
                <span style={{ fontSize: '12px', background: '#eee', padding: '3px 8px', borderRadius: '10px' }}>
                  {property.tasks.length} Active Tasks
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Task Manager Workspace */}
        <div style={{ flex: 1.5, background: '#fafafa', padding: '20px', borderRadius: '8px' }}>
          {selectedProperty ? (
            <div>
              <h2>Management Unit: {selectedProperty.name}</h2>
              
              {/* Existing Tasks View */}
              <h3>📋 Current Tasks</h3>
              {selectedProperty.tasks.length === 0 ? <p>No tasks assigned yet.</p> : (
                selectedProperty.tasks.map(task => (
                  <div key={task.id} style={{ background: '#fff', padding: '15px', borderLeft: '5px solid #007bff', marginBottom: '10px', borderRadius: '4px' }}>
                    <strong>🛠️ {task.type}</strong>
                    <p style={{ margin: '5px 0' }}>📍 <strong>Key Location:</strong> {task.currentLocation}</p>
                    <p style={{ margin: '5px 0' }}>👤 <strong>Assigned to:</strong> {task.assignedEmployee}</p>
                    <p style={{ margin: '5px 0' }}>📅 <strong>When:</strong> {task.scheduledDateTime}</p>
                    <p style={{ margin: '5px 0' }}>⚡ <strong>Status:</strong> <span style={{ color: task.status === 'Collected' ? 'green' : 'orange', fontWeight: 'bold' }}>{task.status}</span></p>
                    
                    {task.status !== 'Collected' && (
                      <button 
                        onClick={() => handleCollectKey(selectedProperty.id, task.id)}
                        style={{ marginTop: '10px', background: '#28a745', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        ✅ Confirm Collection & Notify Landlord
                      </button>
                    )}
                  </div>
                ))
              )}

              {/* Add New Key Collection Task Form */}
              <h3 style={{ marginTop: '30px' }}>🔑 Create Key Collection Task</h3>
              <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label>Where is the key right now?</label>
                <input type="text" value={currentLocation} onChange={e => setCurrentLocation(e.target.value)} required placeholder="e.g. Front desk, Key safe box" style={{ padding: '8px' }} />

                <label>Assigned Employee</label>
                <input type="text" value={assignedEmployee} onChange={e => setAssignedEmployee(e.target.value)} required placeholder="Employee Name" style={{ padding: '8px' }} />

                <label>Date & Time to Fetch</label>
                <input type="datetime-local" value={scheduledDateTime} onChange={e => setScheduledDateTime(e.target.value)} required style={{ padding: '8px' }} />

                <button type="submit" style={{ background: '#007bff', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', marginTop: '10px' }}>
                  ➕ Assign Key Collection Task
                </button>
              </form>
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#999', marginTop: '40px' }}>⬅️ Select a property from the left pane to view or add tasks.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;