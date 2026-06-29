// ============================================================================
// PROPERTY MANAGEMENT HUB - Complete Backend Logic
// Firebase Realtime Database + EmailJS Integration
// ============================================================================
 
// Global state
let currentUser = null;
let currentUserRole = null;
let currentUserName = null;
let firebaseReady = false;
let staffList = [];
let propertiesList = [];
let tasksList = [];
let config = { publicKey: '', serviceId: '', templateId: '' };
 
// ============================================================================
// INITIALIZATION & FIREBASE SETUP
// ============================================================================
 
let authMode = 'signin'; // 'signin' or 'signup'
 
document.addEventListener('firebase-ready', () => {
  firebaseReady = true;
  console.log('✅ Firebase initialized');
  loadStoredConfig();
  checkAuthState();
});
 
function checkAuthState() {
  window.onAuthStateChanged(window.auth, (user) => {
    if (user) {
      // User is already signed in
      currentUser = user.email;
      console.log(`✅ Auto-logged in as ${user.email}`);
      showPinScreen();
    } else {
      // No user signed in
      showAuthScreen();
    }
  });
}
 
// ============================================================================
// AUTHENTICATION FLOW
// ============================================================================
 
function toggleAuthMode() {
  authMode = authMode === 'signin' ? 'signup' : 'signin';
  
  const title = document.getElementById('auth-title');
  const subtitle = document.getElementById('auth-subtitle');
  const submitBtn = document.getElementById('auth-submit-btn');
  const toggleText = document.getElementById('auth-toggle-text');
  const toggleBtn = document.getElementById('auth-toggle-btn');
  
  if (authMode === 'signup') {
    title.textContent = 'Create Account';
    subtitle.textContent = 'Sign up to get started';
    submitBtn.textContent = '✨ Create Account';
    toggleText.textContent = 'Already have an account?';
    toggleBtn.textContent = 'Sign In Instead';
  } else {
    title.textContent = 'Sign In';
    subtitle.textContent = 'Enter your credentials to access';
    submitBtn.textContent = '🔓 Sign In';
    toggleText.textContent = "Don't have an account?";
    toggleBtn.textContent = 'Create New Account';
  }
}
 
async function handleAuthSubmit(event) {
  event.preventDefault();
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;
 
  if (authMode === 'signup') {
    // Sign up
    try {
      const userCredential = await window.createUserWithEmailAndPassword(window.auth, email, password);
      console.log(`✅ Account created: ${email}`);
      currentUser = email;
      
      // Create user profile in database
      window.dbSet(window.dbRef(`users/${userCredential.user.uid}`), {
        email: email,
        createdAt: new Date().toISOString()
      });
      
      showPinScreen();
    } catch (error) {
      console.error(`❌ Signup failed: ${error.message}`);
      document.getElementById('auth-password').value = '';
    }
  } else {
    // Sign in
    try {
      await window.signInWithEmailAndPassword(window.auth, email, password);
      console.log(`✅ Signed in as ${email}`);
      currentUser = email;
      showPinScreen();
    } catch (error) {
      console.error(`❌ Sign in failed: ${error.message}`);
      document.getElementById('auth-email').value = '';
      document.getElementById('auth-password').value = '';
    }
  }
}
 
function showPinScreen() {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('pin-screen').classList.remove('hidden');
  loadStaffList();
}
 
function showAuthScreen() {
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('pin-screen').classList.add('hidden');
  document.getElementById('app-wrapper').classList.add('hidden');
  authMode = 'signin';
  toggleAuthMode(); // Reset to signin mode
}
 
function loadStaffList() {
  const db = window.dbRef('staff');
  window.dbOnValue(db, (snapshot) => {
    const data = snapshot.val();
    staffList = data ? Object.entries(data).map(([key, val]) => ({ id: key, ...val })) : [];
    
    // Bootstrap: If no staff exists, create default demo staff
    if (staffList.length === 0) {
      const defaultStaff = [
        { id: 'staff_demo_1', name: 'Issac', pin: '1234', role: 'Manager', email: 'issac@property.hub', createdAt: new Date().toISOString() },
        { id: 'staff_demo_2', name: 'Shea', pin: '5678', role: 'Operator', email: 'shea@property.hub', createdAt: new Date().toISOString() },
        { id: 'staff_demo_3', name: 'David', pin: '9012', role: 'Operator', email: 'david@property.hub', createdAt: new Date().toISOString() }
      ];
      
      defaultStaff.forEach(staff => {
        window.dbSet(window.dbRef(`staff/${staff.id}`), {
          name: staff.name,
          pin: staff.pin,
          role: staff.role,
          email: staff.email,
          createdAt: staff.createdAt
        });
      });
      
      staffList = defaultStaff;
    }
    
    populatePinUserSelect();
  });
}
 
function populatePinUserSelect() {
  const select = document.getElementById('pin-user-select');
  select.innerHTML = '<option value="">-- Select Personnel --</option>';
  staffList.forEach((staff, idx) => {
    const option = document.createElement('option');
    option.value = idx;
    option.textContent = `${staff.name} (${staff.role})`;
    select.appendChild(option);
  });
}
 
function verifyPersonnelPin() {
  const selectIdx = document.getElementById('pin-user-select').value;
  const pinInput = document.getElementById('pin-input').value;
 
  if (selectIdx === '') {
    console.warn('⚠️ Please select a personnel profile.');
    return;
  }
 
  const selected = staffList[selectIdx];
  if (selected.pin === pinInput) {
    currentUserName = selected.name;
    currentUserRole = selected.role;
    sessionStorage.setItem('pmh-user', JSON.stringify({
      name: selected.name,
      role: selected.role,
      email: currentUser
    }));
    enterApp();
  } else {
    console.warn('❌ Incorrect PIN.');
    document.getElementById('pin-input').value = '';
  }
}
 
function enterApp() {
  document.getElementById('pin-screen').classList.add('hidden');
  document.getElementById('app-wrapper').classList.remove('hidden');
  document.getElementById('user-badge').textContent = `${currentUserName} • ${currentUserRole}`;
  initializeDashboard();
}
 
function logoutSession() {
  if (confirm('🚪 Sign out and return to login?')) {
    window.signOut(window.auth)
      .then(() => {
        sessionStorage.removeItem('pmh-user');
        currentUser = null;
        currentUserName = null;
        currentUserRole = null;
        console.log('✅ Signed out.');
        showAuthScreen();
      })
      .catch((error) => {
        console.error('❌ Logout failed:', error);
      });
  }
}
 
// ============================================================================
// NAVIGATION & TAB SWITCHING
// ============================================================================
 
function switchTab(tabName) {
  // Hide all pages
  document.querySelectorAll('[id^="page-"]').forEach(page => {
    page.classList.add('hidden');
  });
 
  // Update nav buttons
  document.querySelectorAll('[id^="nav-"]').forEach(btn => {
    btn.classList.remove('bg-blue-600', 'text-white');
    btn.classList.add('text-slate-400', 'hover:bg-slate-800', 'hover:text-white');
  });
 
  // Show selected page
  document.getElementById(`page-${tabName}`).classList.remove('hidden');
  document.getElementById(`nav-${tabName}`).classList.remove('text-slate-400', 'hover:bg-slate-800', 'hover:text-white');
  document.getElementById(`nav-${tabName}`).classList.add('bg-blue-600', 'text-white');
}
 
// ============================================================================
// DASHBOARD INITIALIZATION
// ============================================================================
 
function initializeDashboard() {
  loadProperties();
  loadTasks();
  loadStaffStats();
  updateDashboardStats();
}
 
function updateDashboardStats() {
  document.getElementById('dash-total-properties').textContent = propertiesList.length;
  document.getElementById('dash-pending-tasks').textContent = tasksList.filter(t => t.status !== 'completed').length;
  document.getElementById('dash-archived-tasks').textContent = tasksList.filter(t => t.status === 'completed').length;
  document.getElementById('dash-total-staff').textContent = staffList.length;
}
 
// ============================================================================
// PROPERTIES MANAGEMENT
// ============================================================================
 
function loadProperties() {
  const db = window.dbRef('properties');
  window.dbOnValue(db, (snapshot) => {
    const data = snapshot.val();
    propertiesList = data ? Object.entries(data).map(([key, val]) => ({ id: key, ...val })) : [];
    renderPropertiesTable();
    updateDashboardStats();
  });
}
 
function renderPropertiesTable() {
  const tbody = document.getElementById('portfolio-table-rows');
  tbody.innerHTML = '';
 
  propertiesList.forEach(prop => {
    const row = document.createElement('tr');
    const pendingTasks = tasksList.filter(t => t.propertyId === prop.id && t.status !== 'completed').length;
 
    row.innerHTML = `
      <td class="p-4 pl-6 font-medium text-slate-800">${prop.name}</td>
      <td class="p-4 text-slate-600">${prop.town}, ${prop.postcode}</td>
      <td class="p-4 text-slate-600">${prop.landlordName}</td>
      <td class="p-4 text-center">
        <span class="inline-flex items-center justify-center bg-amber-100 text-amber-700 text-xs font-bold rounded-full w-6 h-6">
          ${pendingTasks}
        </span>
      </td>
      <td class="p-4 text-right pr-6 space-x-2">
        <button onclick="openPropertyWorkspace('${prop.id}')" class="text-blue-600 hover:text-blue-800 font-semibold text-sm">📂 Open</button>
        <button onclick="deleteProperty('${prop.id}')" class="text-rose-600 hover:text-rose-800 font-semibold text-sm">🗑️</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}
 
function openNewPropertyModal() {
  document.getElementById('modal-new-property').classList.remove('hidden');
}
 
function closeNewPropertyModal() {
  document.getElementById('modal-new-property').classList.add('hidden');
  document.getElementById('p-form-name').value = '';
  document.getElementById('p-form-town').value = '';
  document.getElementById('p-form-postcode').value = '';
  document.getElementById('p-form-ll-name').value = '';
  document.getElementById('p-form-ll-email').value = '';
  document.getElementById('p-form-ll-phone').value = '';
}
 
function submitNewProperty(event) {
  event.preventDefault();
 
  const propertyId = `prop_${Date.now()}`;
  const property = {
    id: propertyId,
    name: document.getElementById('p-form-name').value,
    town: document.getElementById('p-form-town').value,
    postcode: document.getElementById('p-form-postcode').value,
    landlordName: document.getElementById('p-form-ll-name').value,
    landlordEmail: document.getElementById('p-form-ll-email').value,
    landlordPhone: document.getElementById('p-form-ll-phone').value,
    createdAt: new Date().toISOString(),
    createdBy: currentUserName
  };
 
  window.dbSet(window.dbRef(`properties/${propertyId}`), property);
  closeNewPropertyModal();
  sendNotification('new_property', {
    landlordEmail: property.landlordEmail,
    propertyName: property.name,
    landlordName: property.landlordName
  });
}
 
function deleteProperty(propertyId) {
  if (confirm('🗑️ Delete this property and all associated tasks?')) {
    window.dbSet(window.dbRef(`properties/${propertyId}`), null);
    tasksList = tasksList.filter(t => t.propertyId !== propertyId);
    window.dbSet(window.dbRef('tasks'), tasksList.reduce((acc, t) => ({ ...acc, [t.id]: t }), {}));
    console.log('✅ Property deleted.');
  }
}
 
// ============================================================================
// PROPERTY WORKSPACE MODAL
// ============================================================================
 
let currentPropertyId = null;
 
function openPropertyWorkspace(propertyId) {
  currentPropertyId = propertyId;
  const property = propertiesList.find(p => p.id === propertyId);
 
  document.getElementById('modal-workspace-title').textContent = property.name;
  document.getElementById('modal-workspace-subtitle').textContent = `${property.town} • ${property.postcode}`;
  document.getElementById('modal-property-workspace').classList.remove('hidden');
 
  switchModalSubTab('keys');
  loadPropertyWorkspaceData();
}
 
function closePropertyWorkspaceModal() {
  document.getElementById('modal-property-workspace').classList.add('hidden');
  currentPropertyId = null;
}
 
function switchModalSubTab(tabName) {
  document.querySelectorAll('[id^="modal-subtab-"]').forEach(el => {
    el.classList.add('hidden');
  });
  document.getElementById(`modal-subtab-${tabName}`).classList.remove('hidden');
 
  document.querySelectorAll('[id^="tab-btn-"]').forEach(btn => {
    btn.classList.remove('bg-slate-900', 'text-white');
    btn.classList.add('bg-slate-100', 'text-slate-600');
  });
  document.getElementById(`tab-btn-${tabName}`).classList.add('bg-slate-900', 'text-white');
  document.getElementById(`tab-btn-${tabName}`).classList.remove('bg-slate-100', 'text-slate-600');
}
 
function loadPropertyWorkspaceData() {
  loadKeyHistory();
  loadComplianceData();
  loadPropertyMediaGallery();
  populateKeyStaffMatrix();
}
 
function populateKeyStaffMatrix() {
  const container = document.getElementById('k-staff-matrix');
  container.innerHTML = '';
  staffList.forEach((staff, idx) => {
    const label = document.createElement('label');
    label.className = 'flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg cursor-pointer text-xs font-medium text-slate-700';
    label.innerHTML = `
      <input type="checkbox" value="${idx}" class="staff-checkbox">
      ${staff.name}
    `;
    container.appendChild(label);
  });
}
 
// ============================================================================
// KEY DISTRIBUTION WORKFLOW
// ============================================================================
 
function spawnKeyTask(event) {
  event.preventDefault();
 
  const selectedStaff = Array.from(document.querySelectorAll('.staff-checkbox:checked'))
    .map(cb => staffList[cb.value].name);
 
  if (selectedStaff.length === 0) {
    console.warn('⚠️ Select at least one handler.');
    return;
  }
 
  const keyTaskId = `keytask_${Date.now()}`;
  const keyTask = {
    id: keyTaskId,
    type: 'key_distribution',
    title: 'Key Distribution',
    propertyId: currentPropertyId,
    vaultAddress: document.getElementById('k-vault-address').value,
    targetDate: document.getElementById('k-target-date').value,
    assignedStaff: selectedStaff,
    notes: document.getElementById('k-notes').value,
    status: 'pending',
    createdAt: new Date().toISOString(),
    createdBy: currentUserName
  };
 
  // FIX: Save to 'tasks' collection instead of 'keyTasks' so they show in the task page
  window.dbSet(window.dbRef(`tasks/${keyTaskId}`), keyTask);
 
  // Send notifications to assigned staff
  selectedStaff.forEach(staffName => {
    const staff = staffList.find(s => s.name === staffName);
    if (staff) {
      sendNotification('key_dispatch', {
        staffEmail: staff.email,
        staffName: staffName,
        propertyName: propertiesList.find(p => p.id === currentPropertyId).name,
        targetDate: keyTask.targetDate
      });
    }
  });
 
  console.log('✅ Key distribution protocol dispatched.');
  event.target.reset();
  loadKeyHistory();
}
 
function loadKeyHistory() {
  // FIX: Load from 'tasks' collection instead of 'keyTasks' to match where tasks are saved
  const db = window.dbRef('tasks');
  window.dbOnValue(db, (snapshot) => {
    const data = snapshot.val();
    const allTasks = data ? Object.values(data) : [];
    const propertyTasks = allTasks.filter(t => t.propertyId === currentPropertyId);
 
    const container = document.getElementById('k-history-logs');
    container.innerHTML = '';
 
    propertyTasks.forEach(t => {
      const logEl = document.createElement('div');
      logEl.className = 'bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs';
      logEl.innerHTML = `
        <div class="font-bold text-slate-800">${new Date(t.createdAt).toLocaleDateString()}</div>
        <div class="text-slate-600 mt-1">📍 ${t.vaultAddress || 'N/A'}</div>
        <div class="text-slate-600">👥 ${(t.assignedStaff || []).join(', ')}</div>
        <div class="text-slate-500 mt-1">${t.notes}</div>
      `;
      container.appendChild(logEl);
    });
  });
}
 
// ============================================================================
// COMPLIANCE TRACKING
// ============================================================================
 
function saveComplianceRegistry(event) {
  event.preventDefault();
 
  const complianceId = `compliance_${currentPropertyId}`;
  const compliance = {
    propertyId: currentPropertyId,
    epcDate: document.getElementById('c-epc-date').value || null,
    eicr: document.getElementById('c-eicr-date').value || null,
    gasSafe: document.getElementById('c-gas-date').value || null,
    customTitle: document.getElementById('c-custom-title').value,
    customDate: document.getElementById('c-custom-date').value || null,
    lastUpdated: new Date().toISOString(),
    updatedBy: currentUserName
  };
 
  window.dbSet(window.dbRef(`compliance/${complianceId}`), compliance);
  console.log('✅ Compliance framework saved.');
  loadComplianceData();
}
 
function loadComplianceData() {
  const db = window.dbRef(`compliance/compliance_${currentPropertyId}`);
  window.dbOnValue(db, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      populateComplianceForm(data);
      renderComplianceStatus(data);
    }
  });
}
 
function populateComplianceForm(data) {
  document.getElementById('c-epc-date').value = data.epcDate || '';
  document.getElementById('c-eicr-date').value = data.eicr || '';
  document.getElementById('c-gas-date').value = data.gasSafe || '';
  document.getElementById('c-custom-title').value = data.customTitle || '';
  document.getElementById('c-custom-date').value = data.customDate || '';
}
 
function renderComplianceStatus(data) {
  const board = document.getElementById('compliance-status-summary-board');
  board.innerHTML = `
    <div class="flex items-center justify-between pb-2 border-b border-slate-200">
      <span>🔍 EPC Certificate</span>
      <span class="font-bold">${data.epcDate ? new Date(data.epcDate).toLocaleDateString() : 'Not set'}</span>
    </div>
    <div class="flex items-center justify-between pb-2 border-b border-slate-200">
      <span>⚡ EICR Inspection</span>
      <span class="font-bold">${data.eicr ? new Date(data.eicr).toLocaleDateString() : 'Not set'}</span>
    </div>
    <div class="flex items-center justify-between pb-2 border-b border-slate-200">
      <span>🔥 Gas Safe Check</span>
      <span class="font-bold">${data.gasSafe ? new Date(data.gasSafe).toLocaleDateString() : 'Not set'}</span>
    </div>
    ${data.customTitle ? `
    <div class="flex items-center justify-between">
      <span>${data.customTitle}</span>
      <span class="font-bold">${data.customDate ? new Date(data.customDate).toLocaleDateString() : 'Not set'}</span>
    </div>
    ` : ''}
  `;
}
 
// ============================================================================
// TASKS MANAGEMENT
// ============================================================================
 
function loadTasks() {
  const db = window.dbRef('tasks');
  window.dbOnValue(db, (snapshot) => {
    const data = snapshot.val();
    tasksList = data ? Object.entries(data).map(([key, val]) => ({ id: key, ...val })) : [];
    renderLiveTasks();
    renderArchiveTasks();
    updateDashboardStats();
  });
}
 
function renderLiveTasks() {
  const container = document.getElementById('live-tasks-workspace-container');
  const liveTasks = tasksList.filter(t => t.status !== 'completed');
 
  if (liveTasks.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12">
        <div class="text-5xl mb-3">✨</div>
        <p class="text-slate-500 font-medium">No active tasks</p>
        <p class="text-slate-400 text-sm mt-1">Create a key distribution task from a property workspace</p>
      </div>
    `;
    return;
  }
 
  container.innerHTML = '';
  liveTasks.forEach(task => {
    const property = propertiesList.find(p => p.id === task.propertyId);
    const taskEl = document.createElement('div');
    taskEl.className = 'bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-5 flex justify-between items-start hover:shadow-md transition-all';
    
    const taskContent = `
      <div class="flex-1">
        <div class="font-bold text-slate-800 text-base">${task.title || 'Key Distribution'}</div>
        <p class="text-xs text-slate-500 mt-1">📍 ${property?.name || 'Unknown Property'}</p>
        <p class="text-sm text-slate-600 mt-2">${task.description || task.notes || 'No description'}</p>
        <div class="flex gap-2 mt-3 flex-wrap">
          <span class="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-lg font-semibold">🗓️ ${new Date(task.dueDate || task.targetDate).toLocaleDateString()}</span>
          <span class="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg font-semibold">👤 ${task.assignedTo || (task.assignedStaff ? task.assignedStaff.join(', ') : 'Unassigned')}</span>
          <span class="text-xs bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg font-semibold">📝 ${task.createdBy || 'System'}</span>
        </div>
      </div>
      <div class="flex gap-2 ml-4 shrink-0">
        <button onclick="completeTask('${task.id}')" class="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all">✓ Mark Done</button>
        <button onclick="deleteTask('${task.id}')" class="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all">✕ Delete</button>
      </div>
    `;
    
    taskEl.innerHTML = taskContent;
    container.appendChild(taskEl);
  });
}
 
function renderArchiveTasks() {
  const tbody = document.getElementById('archive-table-body');
  const completedTasks = tasksList.filter(t => t.status === 'completed');
 
  tbody.innerHTML = '';
  completedTasks.forEach(task => {
    const property = propertiesList.find(p => p.id === task.propertyId);
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="p-4 pl-6 font-medium text-slate-800">${property?.name || 'N/A'}</td>
      <td class="p-4 text-slate-600">${task.title}</td>
      <td class="p-4 text-slate-600">${task.completedBy || 'N/A'}</td>
      <td class="p-4 text-slate-600">${task.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'N/A'}</td>
      <td class="p-4 text-right pr-6"><span class="text-emerald-600 font-bold text-xs">✅ COMPLETED</span></td>
    `;
    tbody.appendChild(row);
  });
}
 
function completeTask(taskId) {
  const task = tasksList.find(t => t.id === taskId);
  task.status = 'completed';
  task.completedAt = new Date().toISOString();
  task.completedBy = currentUserName;
  window.dbUpdate(window.dbRef('tasks'), { [taskId]: task });
}
 
function deleteTask(taskId) {
  if (confirm('🗑️ Delete this task?')) {
    window.dbSet(window.dbRef(`tasks/${taskId}`), null);
  }
}
 
// ============================================================================
// STAFF MANAGEMENT (SETTINGS)
// ============================================================================
 
function addStaffMember(event) {
  event.preventDefault();
 
  const name = document.getElementById('staff-name-input').value;
  const pin = document.getElementById('staff-pin-input').value;
  const role = document.getElementById('staff-role-select').value;
 
  if (pin.length !== 4) {
    console.warn('⚠️ PIN must be 4 digits.');
    return;
  }
 
  const staffId = `staff_${Date.now()}`;
  const staff = {
    id: staffId,
    name: name,
    pin: pin,
    role: role,
    email: `${name.toLowerCase().replace(/\s/g, '')}@property.hub`,
    createdAt: new Date().toISOString()
  };
 
  window.dbSet(window.dbRef(`staff/${staffId}`), staff);
 
  document.getElementById('staff-name-input').value = '';
  document.getElementById('staff-pin-input').value = '';
  document.getElementById('staff-role-select').value = 'Operator';
 
  console.log(`✅ ${name} provisioned as ${role}.`);
  loadAndRenderStaffList();
}
 
function loadAndRenderStaffList() {
  const db = window.dbRef('staff');
  window.dbOnValue(db, (snapshot) => {
    const data = snapshot.val();
    // FIX: Use Object.entries to preserve staff IDs (not Object.values)
    staffList = data ? Object.entries(data).map(([key, val]) => ({ id: key, ...val })) : [];
    renderSettingsStaffList();
  });
}
 
function renderSettingsStaffList() {
  const container = document.getElementById('settings-staff-list');
  container.innerHTML = '';
 
  staffList.forEach(staff => {
    const el = document.createElement('div');
    el.className = 'p-3 hover:bg-slate-100 transition-colors flex justify-between items-center';
    el.innerHTML = `
      <div>
        <div class="font-bold text-slate-800">${staff.name}</div>
        <div class="text-xs text-slate-500">${staff.role} • PIN: ${staff.pin}</div>
      </div>
      <button onclick="removeStaff('${staff.id}')" class="text-rose-600 hover:text-rose-800 font-bold text-sm">✕</button>
    `;
    container.appendChild(el);
  });
}
 
function removeStaff(staffId) {
  if (confirm('❌ Remove this staff member?')) {
    window.dbSet(window.dbRef(`staff/${staffId}`), null);
    console.log('✅ Staff member removed.');
  }
}
 
// ============================================================================
// SETTINGS & CONFIGURATION
// ============================================================================
 
function loadStoredConfig() {
  const stored = localStorage.getItem('pmh-config');
  if (stored) {
    config = JSON.parse(stored);
    document.getElementById('cfg-public-key').value = config.publicKey || '';
    document.getElementById('cfg-service-id').value = config.serviceId || '';
    document.getElementById('cfg-template-id').value = config.templateId || '';
 
    // Initialize EmailJS if keys are set
    if (config.publicKey) {
      emailjs.init(config.publicKey);
    }
  }
}
 
function saveConfig() {
  config = {
    publicKey: document.getElementById('cfg-public-key').value,
    serviceId: document.getElementById('cfg-service-id').value,
    templateId: document.getElementById('cfg-template-id').value
  };
 
  localStorage.setItem('pmh-config', JSON.stringify(config));
 
  if (config.publicKey) {
    emailjs.init(config.publicKey);
  }
 
  console.log('✅ Configuration saved.');
}
 
// ============================================================================
// EMAIL NOTIFICATIONS (EmailJS)
// ============================================================================
 
function sendNotification(type, data) {
  if (!config.publicKey || !config.serviceId || !config.templateId) {
    console.warn('⚠️ EmailJS not configured. Skipping notification.');
    return;
  }
 
  let templateParams = {};
 
  switch (type) {
    case 'new_property':
      templateParams = {
        to_email: data.landlordEmail,
        landlord_name: data.landlordName,
        property_name: data.propertyName,
        message: `Your property "${data.propertyName}" has been registered in our system.`
      };
      break;
 
    case 'key_dispatch':
      templateParams = {
        to_email: data.staffEmail,
        staff_name: data.staffName,
        property_name: data.propertyName,
        target_date: data.targetDate,
        message: `You have been assigned a key distribution task for ${data.propertyName} on ${data.targetDate}.`
      };
      break;
 
    default:
      return;
  }
 
  emailjs.send(config.serviceId, config.templateId, templateParams)
    .then((response) => {
      console.log('✅ Email sent:', response);
    })
    .catch((error) => {
      console.error('❌ Email failed:', error);
    });
}
 
// ============================================================================
// MEDIA VAULT (Firebase Storage)
// ============================================================================
 
async function simulateMediaVaultUpload(event) {
  const files = event.target.files;
  if (files.length === 0) return;
 
  console.log(`📸 Uploading ${files.length} image(s) to Firebase Storage...`);
  
  const propertyId = currentPropertyId;
  const uploadPromises = [];
  const fileMetadata = [];
 
  for (let file of files) {
    const fileName = `${Date.now()}_${file.name}`;
    const fileRef = window.storageRef(window.storage, `properties/${propertyId}/${fileName}`);
    
    uploadPromises.push(
      window.uploadBytes(fileRef, file)
        .then(async (snapshot) => {
          const downloadURL = await window.getDownloadURL(fileRef);
          fileMetadata.push({
            name: file.name,
            fileName: fileName,
            size: file.size,
            type: file.type,
            downloadURL: downloadURL,
            uploadedAt: new Date().toISOString(),
            uploadedBy: currentUserName,
            storagePath: snapshot.ref.fullPath
          });
          console.log(`✅ ${file.name} uploaded to Firebase Storage`);
        })
        .catch((error) => {
          console.error(`❌ Failed to upload ${file.name}:`, error);
        })
    );
  }
 
  try {
    await Promise.all(uploadPromises);
    
    if (fileMetadata.length > 0) {
      const mediaId = `media_${propertyId}_${Date.now()}`;
      window.dbSet(window.dbRef(`propertyMedia/${propertyId}/${mediaId}`), {
        files: fileMetadata,
        batchUploadedAt: new Date().toISOString(),
        uploadedBy: currentUserName
      });
      console.log(`✅ ${fileMetadata.length} file(s) saved with metadata.`);
      loadPropertyMediaGallery();
    }
  } catch (error) {
    console.error('❌ Upload batch failed:', error);
  }
  
  event.target.value = '';
}
 
function loadPropertyMediaGallery() {
  if (!currentPropertyId) return;
  
  const db = window.dbRef(`propertyMedia/${currentPropertyId}`);
  window.dbOnValue(db, (snapshot) => {
    const data = snapshot.val();
    const allMedia = data ? Object.values(data).flatMap(batch => batch.files || []) : [];
    renderMediaGallery(allMedia);
  });
}
 
function renderMediaGallery(mediaItems) {
  const container = document.getElementById('media-gallery-container');
  if (!container) {
    console.warn('Media gallery container not found');
    return;
  }
  
  if (!mediaItems || mediaItems.length === 0) {
    container.innerHTML = '<p class="text-slate-500 text-center py-8 text-sm">📸 No photos uploaded yet. Upload some images above!</p>';
    return;
  }
 
  container.innerHTML = '';
  const gallery = document.createElement('div');
  gallery.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4';
  
  mediaItems.forEach((media, idx) => {
    const thumbnail = document.createElement('div');
    thumbnail.className = 'relative group rounded-lg overflow-hidden bg-slate-200 aspect-square shadow-sm hover:shadow-md transition-all';
    
    if (media.downloadURL) {
      thumbnail.innerHTML = `
        <img src="${media.downloadURL}" alt="${media.name}" class="w-full h-full object-cover">
        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex flex-col items-center justify-center opacity-0 group-hover:opacity-100">
          <p class="text-white text-xs font-semibold px-2 text-center line-clamp-2 mb-2">${media.name}</p>
          <button onclick="deleteMediaFile('${media.fileName}')" class="text-white hover:text-rose-300 text-2xl font-light">×</button>
        </div>
      `;
    } else {
      thumbnail.innerHTML = `
        <div class="w-full h-full flex items-center justify-center bg-slate-300">
          <span class="text-slate-600 text-xs">No image</span>
        </div>
      `;
    }
    
    gallery.appendChild(thumbnail);
  });
  
  container.appendChild(gallery);
  console.log(`✅ Rendered ${mediaItems.length} images in gallery`);
}
 
async function deleteMediaFile(fileName) {
  if (confirm('🗑️ Delete this image?')) {
    try {
      const fileRef = window.storageRef(window.storage, `properties/${currentPropertyId}/${fileName}`);
      // Note: Actual deletion requires deleteObject from Firebase Storage
      console.log(`📝 Mark for deletion: ${fileName}`);
      // TODO: Implement actual Firebase Storage deletion when available
    } catch (error) {
      console.error('❌ Delete failed:', error);
    }
  }
}
 
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
 
// Initialize app on page load
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Property Management Hub initialized.');
  loadAndRenderStaffList();
});
