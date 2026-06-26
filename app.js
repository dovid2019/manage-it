// Wait for Firebase to be ready before initializing UI
window.addEventListener('firebase-ready', () => {
    console.log("System Ready.");
    // Initial check: Hide auth screen if user is already logged in
    // Note: You would add Firebase 'onAuthStateChanged' logic here
});

// 1. Authentication
function handleAuthSubmit(event) {
    event.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    
    console.log("Authenticating:", email);
    
    // Placeholder: Replace with Firebase signInWithEmailAndPassword
    // For now, we'll simulate a successful login to show the app
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app-wrapper').classList.remove('hidden');
}

// 2. Tab Switching
function switchTab(tabName) {
    // Hide all pages
    document.getElementById('page-dashboard').classList.add('hidden');
    document.getElementById('page-properties').classList.add('hidden');
    document.getElementById('page-tasks').classList.add('hidden');
    document.getElementById('page-archive').classList.add('hidden');
    document.getElementById('page-settings').classList.add('hidden');

    // Show selected page
    document.getElementById(`page-${tabName}`).classList.remove('hidden');
    
    // Update button styles (basic)
    console.log("Switched to:", tabName);
}

// 3. Modals
function openNewPropertyModal() {
    document.getElementById('modal-new-property').classList.remove('hidden');
}

function closeNewPropertyModal() {
    document.getElementById('modal-new-property').classList.add('hidden');
}

function submitNewProperty(event) {
    event.preventDefault();
    alert("Property record registered!");
    closeNewPropertyModal();
}

// 4. Session
function logoutSession() {
    if(confirm("Terminate session?")) {
        window.location.reload();
    }
}

// Placeholder for other functions used in HTML
function verifyPersonnelPin() { alert("Verification logic needed."); }
function addStaffMember(event) { event.preventDefault(); alert("Staff added."); }
function saveConfig() { console.log("Config saved."); }
function spawnKeyTask(event) { event.preventDefault(); alert("Task spawned."); }
function simulateMediaVaultUpload(event) { alert("Media processed."); }
