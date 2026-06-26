// --- Global Firebase References ---
let auth, db;

// Listener for when Firebase initializes in your HTML
window.addEventListener('firebase-ready', () => {
    // These globals are provided by the script in your HTML
    db = window.dbRef;
    console.log("System Initialized and Ready.");
});

// --- 1. Authentication ---
function handleAuthSubmit(event) {
    event.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;

    // Placeholder logic for sign-in
    // In a real app, use: signInWithEmailAndPassword(getAuth(), email, password)
    console.log("Authenticating:", email);
    
    // Hide Auth Screen, Show App
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app-wrapper').classList.remove('hidden');
    document.getElementById('user-badge').innerText = `User: ${email}`;
}

// --- 2. Navigation & UI ---
function switchTab(tabName) {
    // Hide all main pages
    ['dashboard', 'properties', 'tasks', 'archive', 'settings'].forEach(page => {
        document.getElementById(`page-${page}`).classList.add('hidden');
    });
    
    // Show selected
    document.getElementById(`page-${tabName}`).classList.remove('hidden');
}

// --- 3. Property Management ---
function openNewPropertyModal() {
    document.getElementById('modal-new-property').classList.remove('hidden');
}

function closeNewPropertyModal() {
    document.getElementById('modal-new-property').classList.add('hidden');
}

function submitNewProperty(event) {
    event.preventDefault();
    alert("Property Registered to Matrix.");
    closeNewPropertyModal();
}

// --- 4. Workspace & Tabs ---
function switchModalSubTab(tab) {
    document.getElementById('modal-subtab-keys').classList.add('hidden');
    document.getElementById('modal-subtab-compliance').classList.add('hidden');
    document.getElementById('modal-subtab-media').classList.add('hidden');
    
    document.getElementById(`modal-subtab-${tab}`).classList.remove('hidden');
}

// --- 5. Session Control ---
function logoutSession() {
    if(confirm("Terminate session?")) {
        window.location.reload();
    }
}

// --- 6. Empty Handlers (Fill these as you build features) ---
function verifyPersonnelPin() { alert("Verification logic needed."); }
function addStaffMember(event) { event.preventDefault(); alert("Staff member added."); }
function saveConfig() { console.log("Config changed."); }
function spawnKeyTask(event) { event.preventDefault(); alert("Task workflow spawned."); }
function simulateMediaVaultUpload(event) { alert("Media processed."); }
function closePropertyWorkspaceModal() { document.getElementById('modal-property-workspace').classList.add('hidden'); }
