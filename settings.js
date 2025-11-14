import { auth, db } from './firebase-config.js';
import { 
    onAuthStateChanged, 
    signOut, 
    updateEmail, 
    updatePassword, 
    reauthenticateWithCredential, 
    EmailAuthProvider,
    createUserWithEmailAndPassword
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    collection, 
    addDoc, 
    getDocs, 
    deleteDoc, 
    doc, 
    query, 
    orderBy 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

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

// Tab elements
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

let currentUser = null;

// Check authentication
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        loadUserProfile();
        loadUsers();
    } else {
        window.location.href = 'login.html';
    }
});

// Load user profile
function loadUserProfile() {
    if (currentUser) {
        currentEmail.textContent = currentUser.email;
        accountCreated.textContent = formatDate(currentUser.metadata.creationTime);
        lastSignIn.textContent = formatDate(currentUser.metadata.lastSignInTime);
    }
}

// Tab switching
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.getAttribute('data-tab');
        switchTab(tabName);
    });
});

function switchTab(tabName) {
    // Remove active class from all tabs and contents
    tabBtns.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab and content
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}Tab`).classList.add('active');
    
    clearMessage();
}

// Message functions
function showMessage(text, type = 'info') {
    message.innerHTML = `<div class="message ${type}">${text}</div>`;
    message.scrollIntoView({ behavior: 'smooth' });
}

function clearMessage() {
    message.innerHTML = '';
}

function showLoading(show = true) {
    loading.style.display = show ? 'block' : 'none';
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
        const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
        await reauthenticateWithCredential(currentUser, credential);
        
        // Update email
        await updateEmail(currentUser, newEmail);
        
        showMessage('تم تحديث البريد الإلكتروني بنجاح!', 'success');
        loadUserProfile();
        document.getElementById('updateEmailForm').reset();
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
        const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
        await reauthenticateWithCredential(currentUser, credential);
        
        // Update password
        await updatePassword(currentUser, newPassword);
        
        showMessage('تم تغيير كلمة المرور بنجاح!', 'success');
        document.getElementById('changePasswordForm').reset();
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
        await addDoc(collection(db, 'users'), {
            email: userEmail,
            role: userRole,
            createdAt: new Date(),
            createdBy: currentUser.email,
            active: true
        });
        
        showMessage('تم إضافة المستخدم بنجاح!', 'success');
        document.getElementById('addUserForm').reset();
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
        const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(usersQuery);
        
        if (querySnapshot.empty) {
            usersList.innerHTML = '<div class="loading">لا توجد مستخدمين مضافين</div>';
            return;
        }
        
        let usersHTML = '';
        querySnapshot.forEach((doc) => {
            const userData = doc.data();
            usersHTML += `
                <div class="user-item">
                    <div class="user-info-item">
                        <h5>${userData.email}</h5>
                        <p>الدور: ${getRoleText(userData.role)}</p>
                        <p>تاريخ الإضافة: ${formatDate(userData.createdAt?.toDate())}</p>
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
        
        usersList.innerHTML = usersHTML;
    } catch (error) {
        console.error('خطأ في تحميل المستخدمين:', error);
        usersList.innerHTML = '<div class="loading">خطأ في تحميل المستخدمين</div>';
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
        await deleteDoc(doc(db, 'users', userId));
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
        await signOut(auth);
        window.location.href = 'login.html';
    } catch (error) {
        console.error('خطأ في تسجيل الخروج:', error);
        alert('حدث خطأ في تسجيل الخروج');
    }
}

// Event Listeners
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
