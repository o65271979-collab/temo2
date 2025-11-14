// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAtCV2XfOJwLy050kHg5y_Oqy-9NfKyOlc",
  authDomain: "temo-a8e65.firebaseapp.com",
  projectId: "temo-a8e65",
  storageBucket: "temo-a8e65.firebasestorage.app",
  messagingSenderId: "897974034557",
  appId: "1:897974034557:web:fcb74ee2c9e9b73def1114",
  measurementId: "G-EVZ5JG42TS"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const guestSection = document.getElementById('guestSection');
const dashboardSection = document.getElementById('dashboardSection');
const userInfo = document.getElementById('userInfo');
const settingsLink = document.getElementById('settingsLink');
const shiftsLink = document.getElementById('shiftsLink');
const reportsLink = document.getElementById('reportsLink');
const expensesLink = document.getElementById('expensesLink');
const statisticsLink = document.getElementById('statisticsLink');
const logoutBtn = document.getElementById('logoutBtn');
const userEmail = document.getElementById('userEmail');
const userDisplayName = document.getElementById('userDisplayName');
const lastLogin = document.getElementById('lastLogin');
const shiftsCount = document.getElementById('shiftsCount');
const reportsCount = document.getElementById('reportsCount');
const expensesCount = document.getElementById('expensesCount');
const totalRevenue = document.getElementById('totalRevenue');

// Auth State Observer
auth.onAuthStateChanged(async (user) => {
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
    if (guestSection) guestSection.style.display = 'none';
    if (dashboardSection) dashboardSection.style.display = 'block';
    if (settingsLink) settingsLink.style.display = 'inline-block';
    if (shiftsLink) shiftsLink.style.display = 'inline-block';
    if (reportsLink) reportsLink.style.display = 'inline-block';
    if (expensesLink) expensesLink.style.display = 'inline-block';
    if (statisticsLink) statisticsLink.style.display = 'inline-block';
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
    
    // Display user information
    if (userEmail) userEmail.textContent = user.email;
    if (userDisplayName) {
        const displayName = user.displayName || user.email.split('@')[0];
        userDisplayName.textContent = displayName;
    }
    if (lastLogin) lastLogin.textContent = formatDate(user.metadata.lastSignInTime);
}

// Show Guest Interface
function showGuestInterface() {
    if (guestSection) guestSection.style.display = 'block';
    if (dashboardSection) dashboardSection.style.display = 'none';
    if (settingsLink) settingsLink.style.display = 'none';
    if (shiftsLink) shiftsLink.style.display = 'none';
    if (reportsLink) reportsLink.style.display = 'none';
    if (expensesLink) expensesLink.style.display = 'none';
    if (statisticsLink) statisticsLink.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
}

// Load System Data
async function loadSystemData() {
    try {
        // Load shifts count
        const shiftsSnapshot = await db.collection('shifts').get();
        if (shiftsCount) shiftsCount.textContent = shiftsSnapshot.size;
        
        // Load reports count - check both collections
        let reportsTotal = 0;
        try {
            const salesReportsSnapshot = await db.collection('sales_reports').get();
            reportsTotal += salesReportsSnapshot.size;
        } catch (e) {
            console.log('sales_reports collection not found');
        }
        
        try {
            const comprehensiveReportsSnapshot = await db.collection('comprehensive_reports').get();
            reportsTotal += comprehensiveReportsSnapshot.size;
        } catch (e) {
            console.log('comprehensive_reports collection not found');
        }
        
        try {
            const reportsSnapshot = await db.collection('reports').get();
            reportsTotal += reportsSnapshot.size;
        } catch (e) {
            console.log('reports collection not found');
        }
        
        if (reportsCount) reportsCount.textContent = reportsTotal;
        
        // Load expenses count
        const expensesSnapshot = await db.collection('expenses').get();
        if (expensesCount) expensesCount.textContent = expensesSnapshot.size;
        
        // Calculate total revenue (mock calculation)
        let revenue = 0;
        try {
            const salesReportsSnapshot = await db.collection('sales_reports').get();
            salesReportsSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.totalSales) revenue += parseFloat(data.totalSales) || 0;
            });
        } catch (e) {
            console.log('No sales data found');
        }
        
        if (totalRevenue) totalRevenue.textContent = `${revenue.toLocaleString()} ج.م`;
        
        console.log('📊 إحصائيات البيانات:');
        console.log(`- الشيفتات: ${shiftsSnapshot.size}`);
        console.log(`- التقارير: ${reportsTotal}`);
        console.log(`- المصاريف: ${expensesSnapshot.size}`);
        console.log(`- الإيرادات: ${revenue} ج.م`);
        
    } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
        // Set counts to 0 if there's an error
        if (shiftsCount) shiftsCount.textContent = '0';
        if (reportsCount) reportsCount.textContent = '0';
        if (expensesCount) expensesCount.textContent = '0';
        if (totalRevenue) totalRevenue.textContent = '0 ج.م';
    }
}

// Refresh all data
window.refreshAllData = async function() {
    console.log('🔄 تحديث جميع البيانات...');
    await loadSystemData();
    
    // Show success message
    const message = document.createElement('div');
    message.className = 'message success';
    message.innerHTML = '<i class="fas fa-check-circle"></i> تم تحديث البيانات بنجاح!';
    message.style.position = 'fixed';
    message.style.top = '20px';
    message.style.right = '20px';
    message.style.zIndex = '1000';
    message.style.minWidth = '300px';
    document.body.appendChild(message);
    
    setTimeout(() => {
        document.body.removeChild(message);
    }, 3000);
}

// Auto refresh data every 30 seconds
setInterval(async () => {
    if (auth.currentUser) {
        await loadSystemData();
        console.log('🔄 تم تحديث البيانات تلقائياً');
    }
}, 30000);

// Logout Function
async function handleLogout() {
    try {
        await auth.signOut();
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
document.addEventListener('DOMContentLoaded', function() {
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});
