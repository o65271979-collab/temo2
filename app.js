import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { collection, getDocs, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// DOM Elements
const userInfo = document.getElementById('userInfo');
const guestSection = document.getElementById('guestSection');
const dataSection = document.getElementById('dataSection');
const settingsLink = document.getElementById('settingsLink');
const reportsLink = document.getElementById('reportsLink');
const logoutBtn = document.getElementById('logoutBtn');
const userEmail = document.getElementById('userEmail');
const userCreated = document.getElementById('userCreated');
const lastLogin = document.getElementById('lastLogin');
const shiftsCount = document.getElementById('shiftsCount');
const reportsCount = document.getElementById('reportsCount');
const expensesCount = document.getElementById('expensesCount');

// Auth State Observer
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User is signed in
        showUserInterface(user);
        await loadSystemData();
    } else {
        // User is signed out
        showGuestInterface();
    }
});

// Show User Interface
function showUserInterface(user) {
    userInfo.style.display = 'block';
    dataSection.style.display = 'block';
    guestSection.style.display = 'none';
    settingsLink.style.display = 'inline-block';
    reportsLink.style.display = 'inline-block';
    logoutBtn.style.display = 'inline-block';
    
    // Display user information
    userEmail.textContent = user.email;
    userCreated.textContent = formatDate(user.metadata.creationTime);
    lastLogin.textContent = formatDate(user.metadata.lastSignInTime);
}

// Show Guest Interface
function showGuestInterface() {
    userInfo.style.display = 'none';
    dataSection.style.display = 'none';
    guestSection.style.display = 'block';
    settingsLink.style.display = 'none';
    reportsLink.style.display = 'none';
    logoutBtn.style.display = 'none';
}

// Load System Data
async function loadSystemData() {
    try {
        // Load shifts count
        const shiftsSnapshot = await getDocs(collection(db, 'shifts'));
        shiftsCount.textContent = shiftsSnapshot.size;
        
        // Load reports count
        const reportsSnapshot = await getDocs(collection(db, 'reports'));
        reportsCount.textContent = reportsSnapshot.size;
        
        // Load expenses count
        const expensesSnapshot = await getDocs(collection(db, 'expenses'));
        expensesCount.textContent = expensesSnapshot.size;
        
    } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
        // Set counts to 0 if there's an error
        shiftsCount.textContent = '0';
        reportsCount.textContent = '0';
        expensesCount.textContent = '0';
    }
}

// Logout Function
async function handleLogout() {
    try {
        await signOut(auth);
        window.location.href = 'login.html';
    } catch (error) {
        console.error('خطأ في تسجيل الخروج:', error);
        alert('حدث خطأ في تسجيل الخروج');
    }
}

// Format Date
function formatDate(dateString) {
    if (!dateString) return 'غير متوفر';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Event Listeners
if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
}
