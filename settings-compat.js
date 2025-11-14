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

// Current user
let currentUser = null;

// DOM Elements
const currentEmail = document.getElementById('currentEmail');
const accountCreated = document.getElementById('accountCreated');
const lastSignIn = document.getElementById('lastSignIn');
const updateEmailForm = document.getElementById('updateEmailForm');
const changePasswordForm = document.getElementById('changePasswordForm');
const addUserForm = document.getElementById('addUserForm');
const usersList = document.getElementById('usersList');
const message = document.getElementById('message');
const loading = document.getElementById('loading');
const logoutBtn = document.getElementById('logoutBtn');

// Data management elements
const dataShiftsCount = document.getElementById('dataShiftsCount');
const dataReportsCount = document.getElementById('dataReportsCount');
const dataExpensesCount = document.getElementById('dataExpensesCount');
const dataUsersCount = document.getElementById('dataUsersCount');

// Tab elements
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Check authentication
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        loadUserProfile();
        loadUsers();
        loadDataStats();
    } else {
        window.location.href = 'login.html';
    }
});

// Load user profile
function loadUserProfile() {
    if (currentUser) {
        if (currentEmail) currentEmail.textContent = currentUser.email;
        if (accountCreated) accountCreated.textContent = formatDate(currentUser.metadata.creationTime);
        if (lastSignIn) lastSignIn.textContent = formatDate(currentUser.metadata.lastSignInTime);
    }
}

// Tab switching
function switchTab(tabName) {
    // Remove active class from all tabs and contents
    tabBtns.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab and content
    const selectedBtn = document.querySelector(`[data-tab="${tabName}"]`);
    const selectedContent = document.getElementById(`${tabName}Tab`);
    
    if (selectedBtn) selectedBtn.classList.add('active');
    if (selectedContent) selectedContent.classList.add('active');
    
    clearMessage();
}

// Message functions
function showMessage(text, type = 'info') {
    if (message) {
        message.innerHTML = `<div class="message ${type}">${text}</div>`;
        message.scrollIntoView({ behavior: 'smooth' });
    }
}

function clearMessage() {
    if (message) message.innerHTML = '';
}

function showLoading(show = true) {
    if (loading) loading.style.display = show ? 'block' : 'none';
}

// Update email
async function handleUpdateEmail(e) {
    e.preventDefault();
    
    const newEmail = document.getElementById('newEmail').value;
    const currentPassword = document.getElementById('currentPasswordForEmail').value;
    
    if (!newEmail || !currentPassword) {
        showMessage('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    showLoading(true);
    clearMessage();
    
    try {
        // Re-authenticate user
        const credential = firebase.auth.EmailAuthProvider.credential(currentUser.email, currentPassword);
        await currentUser.reauthenticateWithCredential(credential);
        
        // Update email
        await currentUser.updateEmail(newEmail);
        
        showMessage('تم تحديث البريد الإلكتروني بنجاح!', 'success');
        loadUserProfile();
        if (updateEmailForm) updateEmailForm.reset();
    } catch (error) {
        console.error('خطأ في تحديث البريد الإلكتروني:', error);
        let errorMessage = 'حدث خطأ في تحديث البريد الإلكتروني';
        
        switch (error.code) {
            case 'auth/wrong-password':
                errorMessage = 'كلمة المرور غير صحيحة';
                break;
            case 'auth/email-already-in-use':
                errorMessage = 'البريد الإلكتروني مستخدم بالفعل';
                break;
            case 'auth/invalid-email':
                errorMessage = 'البريد الإلكتروني غير صحيح';
                break;
            case 'auth/requires-recent-login':
                errorMessage = 'يرجى تسجيل الدخول مرة أخرى قبل تحديث البريد الإلكتروني';
                break;
        }
        
        showMessage(errorMessage, 'error');
    } finally {
        showLoading(false);
    }
}

// Change password
async function handleChangePassword(e) {
    e.preventDefault();
    console.log('handleChangePassword called');
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    
    if (!currentPassword || !newPassword || !confirmNewPassword) {
        showMessage('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    if (newPassword !== confirmNewPassword) {
        showMessage('كلمات المرور الجديدة غير متطابقة', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showMessage('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل', 'error');
        return;
    }
    
    showLoading(true);
    clearMessage();
    
    try {
        // Re-authenticate user
        const credential = firebase.auth.EmailAuthProvider.credential(currentUser.email, currentPassword);
        await currentUser.reauthenticateWithCredential(credential);
        
        // Update password
        await currentUser.updatePassword(newPassword);
        
        showMessage('تم تغيير كلمة المرور بنجاح!', 'success');
        if (changePasswordForm) changePasswordForm.reset();
    } catch (error) {
        console.error('خطأ في تغيير كلمة المرور:', error);
        let errorMessage = 'حدث خطأ في تغيير كلمة المرور';
        
        switch (error.code) {
            case 'auth/wrong-password':
                errorMessage = 'كلمة المرور الحالية غير صحيحة';
                break;
            case 'auth/weak-password':
                errorMessage = 'كلمة المرور الجديدة ضعيفة جداً';
                break;
            case 'auth/requires-recent-login':
                errorMessage = 'يرجى تسجيل الدخول مرة أخرى قبل تغيير كلمة المرور';
                break;
        }
        
        showMessage(errorMessage, 'error');
    } finally {
        showLoading(false);
    }
}

// Add new user
async function handleAddUser(e) {
    e.preventDefault();
    
    const userEmail = document.getElementById('userEmail').value;
    const userPassword = document.getElementById('userPassword').value;
    const userRole = document.getElementById('userRole').value;
    
    if (!userEmail || !userPassword || !userRole) {
        showMessage('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    if (userPassword.length < 6) {
        showMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
        return;
    }
    
    showLoading(true);
    clearMessage();
    
    try {
        // Save user info to Firestore
        await db.collection('users').add({
            email: userEmail,
            role: userRole,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: currentUser.email,
            active: true
        });
        
        showMessage('تم إضافة المستخدم بنجاح!', 'success');
        if (addUserForm) addUserForm.reset();
        loadUsers();
    } catch (error) {
        console.error('خطأ في إضافة المستخدم:', error);
        showMessage('حدث خطأ في إضافة المستخدم', 'error');
    } finally {
        showLoading(false);
    }
}

// Load users
async function loadUsers() {
    try {
        const usersSnapshot = await db.collection('users').orderBy('createdAt', 'desc').get();
        
        if (usersSnapshot.empty) {
            if (usersList) usersList.innerHTML = '<div class="loading">لا توجد مستخدمين مضافين</div>';
            return;
        }
        
        let usersHTML = '';
        usersSnapshot.forEach((doc) => {
            const userData = doc.data();
            const createdAt = userData.createdAt ? userData.createdAt.toDate() : new Date();
            usersHTML += `
                <div class="user-item">
                    <div class="user-info-item">
                        <h5>${userData.email}</h5>
                        <p>الدور: ${getRoleText(userData.role)}</p>
                        <p>تاريخ الإضافة: ${formatDate(createdAt)}</p>
                        <p>أضيف بواسطة: ${userData.createdBy}</p>
                    </div>
                    <div class="user-actions">
                        <button class="btn btn-danger btn-small" onclick="deleteUser('${doc.id}')">
                            حذف
                        </button>
                    </div>
                </div>
            `;
        });
        
        if (usersList) usersList.innerHTML = usersHTML;
    } catch (error) {
        console.error('خطأ في تحميل المستخدمين:', error);
        if (usersList) usersList.innerHTML = '<div class="loading">خطأ في تحميل المستخدمين</div>';
    }
}

// Delete user
window.deleteUser = async function(userId) {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
        return;
    }
    
    showLoading(true);
    clearMessage();
    
    try {
        await db.collection('users').doc(userId).delete();
        showMessage('تم حذف المستخدم بنجاح!', 'success');
        loadUsers();
    } catch (error) {
        console.error('خطأ في حذف المستخدم:', error);
        showMessage('حدث خطأ في حذف المستخدم', 'error');
    } finally {
        showLoading(false);
    }
};

// Get role text in Arabic
function getRoleText(role) {
    const roles = {
        'admin': 'مدير',
        'manager': 'مدير فرع',
        'employee': 'موظف'
    };
    return roles[role] || role;
}

// Format date
function formatDate(date) {
    if (!date) return 'غير متوفر';
    
    return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Logout function
async function handleLogout() {
    try {
        await auth.signOut();
        window.location.href = 'login.html';
    } catch (error) {
        console.error('خطأ في تسجيل الخروج:', error);
        alert('حدث خطأ في تسجيل الخروج');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    if (updateEmailForm) {
        updateEmailForm.addEventListener('submit', handleUpdateEmail);
    }

    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', handleChangePassword);
    }

    if (addUserForm) {
        addUserForm.addEventListener('submit', handleAddUser);
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});

// Load data statistics
async function loadDataStats() {
    try {
        // Load shifts count
        const shiftsSnapshot = await db.collection('shifts').get();
        if (dataShiftsCount) dataShiftsCount.textContent = shiftsSnapshot.size;
        
        // Load reports count
        let reportsTotal = 0;
        try {
            const salesReportsSnapshot = await db.collection('sales_reports').get();
            reportsTotal += salesReportsSnapshot.size;
        } catch (e) {}
        
        try {
            const comprehensiveReportsSnapshot = await db.collection('comprehensive_reports').get();
            reportsTotal += comprehensiveReportsSnapshot.size;
        } catch (e) {}
        
        try {
            const reportsSnapshot = await db.collection('reports').get();
            reportsTotal += reportsSnapshot.size;
        } catch (e) {}
        
        if (dataReportsCount) dataReportsCount.textContent = reportsTotal;
        
        // Load expenses count
        const expensesSnapshot = await db.collection('expenses').get();
        if (dataExpensesCount) dataExpensesCount.textContent = expensesSnapshot.size;
        
        // Load users count
        const usersSnapshot = await db.collection('users').get();
        if (dataUsersCount) dataUsersCount.textContent = usersSnapshot.size;
        
    } catch (error) {
        console.error('خطأ في تحميل إحصائيات البيانات:', error);
    }
}

// Refresh data function will be defined at the end of file

// Clear specific data type
async function clearData(dataType) {
    console.log('clearData called with:', dataType);
    
    const confirmMessages = {
        'shifts': 'هل أنت متأكد من حذف جميع الشيفتات؟ هذا الإجراء لا يمكن التراجع عنه!',
        'reports': 'هل أنت متأكد من حذف جميع التقارير؟ هذا الإجراء لا يمكن التراجع عنه!',
        'expenses': 'هل أنت متأكد من حذف جميع المصاريف؟ هذا الإجراء لا يمكن التراجع عنه!'
    };
    
    if (!confirm(confirmMessages[dataType])) {
        return;
    }
    
    // Double confirmation for critical action
    if (!confirm('تأكيد نهائي: سيتم حذف جميع البيانات نهائياً. هل تريد المتابعة؟')) {
        return;
    }
    
    showLoading(true);
    clearMessage();
    
    try {
        let collections = [];
        
        switch (dataType) {
            case 'shifts':
                collections = ['shifts'];
                break;
            case 'reports':
                collections = ['sales_reports', 'comprehensive_reports', 'reports'];
                break;
            case 'expenses':
                collections = ['expenses'];
                break;
        }
        
        for (const collectionName of collections) {
            try {
                const snapshot = await db.collection(collectionName).get();
                const batch = db.batch();
                
                snapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
                
                await batch.commit();
                console.log(`✅ تم حذف مجموعة ${collectionName}`);
            } catch (error) {
                console.warn(`⚠️ لم يتم العثور على مجموعة ${collectionName} أو حدث خطأ:`, error);
            }
        }
        
        showMessage(`تم حذف جميع ${getDataTypeName(dataType)} بنجاح!`, 'success');
        await loadDataStats();
        
    } catch (error) {
        console.error('خطأ في حذف البيانات:', error);
        showMessage('حدث خطأ في حذف البيانات', 'error');
    } finally {
        showLoading(false);
    }
};

// Clear all data
async function clearAllData() {
    console.log('clearAllData called');
    
    if (!confirm('⚠️ تحذير خطير: سيتم حذف جميع البيانات في النظام نهائياً!\n\nهذا يشمل:\n- جميع الشيفتات\n- جميع التقارير\n- جميع المصاريف\n\nهل أنت متأكد تماماً؟')) {
        return;
    }
    
    // Triple confirmation for this critical action
    if (!confirm('تأكيد ثاني: هذا الإجراء سيمحو جميع بيانات النظام ولا يمكن التراجع عنه. هل تريد المتابعة؟')) {
        return;
    }
    
    if (!confirm('تأكيد نهائي: اكتب "نعم" في المربع التالي إذا كنت متأكداً من حذف جميع البيانات') || 
        prompt('اكتب "نعم" للتأكيد:') !== 'نعم') {
        showMessage('تم إلغاء العملية', 'info');
        return;
    }
    
    showLoading(true);
    clearMessage();
    
    try {
        const collections = ['shifts', 'sales_reports', 'comprehensive_reports', 'reports', 'expenses'];
        let deletedCount = 0;
        
        for (const collectionName of collections) {
            try {
                const snapshot = await db.collection(collectionName).get();
                const batch = db.batch();
                
                snapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
                
                await batch.commit();
                deletedCount += snapshot.size;
                console.log(`✅ تم حذف ${snapshot.size} عنصر من مجموعة ${collectionName}`);
            } catch (error) {
                console.warn(`⚠️ لم يتم العثور على مجموعة ${collectionName} أو حدث خطأ:`, error);
            }
        }
        
        showMessage(`تم حذف جميع البيانات بنجاح! (${deletedCount} عنصر)`, 'success');
        await loadDataStats();
        
    } catch (error) {
        console.error('خطأ في حذف جميع البيانات:', error);
        showMessage('حدث خطأ في حذف البيانات', 'error');
    } finally {
        showLoading(false);
    }
};

// Helper function to get data type name in Arabic
function getDataTypeName(dataType) {
    const names = {
        'shifts': 'الشيفتات',
        'reports': 'التقارير',
        'expenses': 'المصاريف'
    };
    return names[dataType] || dataType;
}

// Show/hide loading
function showLoading(show = true) {
    if (loading) {
        loading.style.display = show ? 'block' : 'none';
    }
}

// Show message
function showMessage(text, type = 'info') {
    if (message) {
        message.innerHTML = `<div class="message ${type}"><i class="fas fa-${getMessageIcon(type)}"></i> ${text}</div>`;
        message.style.display = 'block';
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            clearMessage();
        }, 5000);
    }
}

// Clear message
function clearMessage() {
    if (message) {
        message.innerHTML = '';
        message.style.display = 'none';
    }
}

// Get message icon
function getMessageIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-triangle',
        'info': 'info-circle',
        'warning': 'exclamation-circle'
    };
    return icons[type] || 'info-circle';
}

// Switch tabs
function switchTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    tabBtns.forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab content
    const selectedTab = document.getElementById(tabName + 'Tab');
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Add active class to selected tab button
    const selectedBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('active');
    }
    
    // Load data stats when switching to data tab
    if (tabName === 'data') {
        loadDataStats();
    }
}

// Make functions available globally for onclick handlers
window.clearData = clearData;
window.clearAllData = clearAllData;
window.refreshData = async function() {
    await loadUserProfile();
    await loadUsers();
    await loadDataStats();
    showMessage('تم تحديث البيانات بنجاح!', 'success');
};

// Logout function
async function handleLogout() {
    try {
        await auth.signOut();
        window.location.href = 'login.html';
    } catch (error) {
        console.error('خطأ في تسجيل الخروج:', error);
        showMessage('حدث خطأ في تسجيل الخروج', 'error');
    }
}
