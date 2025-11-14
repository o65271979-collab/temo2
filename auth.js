import { auth } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    sendPasswordResetEmail,
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const resetForm = document.getElementById('resetForm');
const loginFormElement = document.getElementById('loginFormElement');
const registerFormElement = document.getElementById('registerFormElement');
const resetFormElement = document.getElementById('resetFormElement');
const message = document.getElementById('message');
const loading = document.getElementById('loading');

// Form switching elements
const showRegister = document.getElementById('showRegister');
const showLogin = document.getElementById('showLogin');
const showReset = document.getElementById('showReset');
const backToLogin = document.getElementById('backToLogin');

// Check if user is already logged in
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in, redirect to main page
        window.location.href = 'index.html';
    }
});

// Form switching functions
function showLoginForm() {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    resetForm.style.display = 'none';
    clearMessage();
}

function showRegisterForm() {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    resetForm.style.display = 'none';
    clearMessage();
}

function showResetForm() {
    loginForm.style.display = 'none';
    registerForm.style.display = 'none';
    resetForm.style.display = 'block';
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

// Login function
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showMessage('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    showLoading(true);
    clearMessage();
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
        showMessage('تم تسجيل الدخول بنجاح!', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        let errorMessage = 'حدث خطأ في تسجيل الدخول';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'المستخدم غير موجود';
                break;
            case 'auth/wrong-password':
                errorMessage = 'كلمة المرور غير صحيحة';
                break;
            case 'auth/invalid-email':
                errorMessage = 'البريد الإلكتروني غير صحيح';
                break;
            case 'auth/user-disabled':
                errorMessage = 'تم تعطيل هذا الحساب';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'تم تجاوز عدد المحاولات المسموح. حاول مرة أخرى لاحقاً';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'خطأ في الاتصال بالإنترنت';
                break;
        }
        
        showMessage(errorMessage, 'error');
    } finally {
        showLoading(false);
    }
}

// Register function
async function handleRegister(e) {
    e.preventDefault();
    
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!email || !password || !confirmPassword) {
        showMessage('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('كلمات المرور غير متطابقة', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
        return;
    }
    
    showLoading(true);
    clearMessage();
    
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        showMessage('تم إنشاء الحساب بنجاح!', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } catch (error) {
        console.error('خطأ في إنشاء الحساب:', error);
        let errorMessage = 'حدث خطأ في إنشاء الحساب';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'البريد الإلكتروني مستخدم بالفعل';
                break;
            case 'auth/invalid-email':
                errorMessage = 'البريد الإلكتروني غير صحيح';
                break;
            case 'auth/weak-password':
                errorMessage = 'كلمة المرور ضعيفة جداً';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'خطأ في الاتصال بالإنترنت';
                break;
        }
        
        showMessage(errorMessage, 'error');
    } finally {
        showLoading(false);
    }
}

// Reset password function
async function handleReset(e) {
    e.preventDefault();
    
    const email = document.getElementById('resetEmail').value;
    
    if (!email) {
        showMessage('يرجى إدخال البريد الإلكتروني', 'error');
        return;
    }
    
    showLoading(true);
    clearMessage();
    
    try {
        await sendPasswordResetEmail(auth, email);
        showMessage('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني', 'success');
    } catch (error) {
        console.error('خطأ في إرسال رابط الإعادة:', error);
        let errorMessage = 'حدث خطأ في إرسال رابط الإعادة';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'البريد الإلكتروني غير مسجل';
                break;
            case 'auth/invalid-email':
                errorMessage = 'البريد الإلكتروني غير صحيح';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'خطأ في الاتصال بالإنترنت';
                break;
        }
        
        showMessage(errorMessage, 'error');
    } finally {
        showLoading(false);
    }
}

// Event Listeners
if (loginFormElement) {
    loginFormElement.addEventListener('submit', handleLogin);
}

if (registerFormElement) {
    registerFormElement.addEventListener('submit', handleRegister);
}

if (resetFormElement) {
    resetFormElement.addEventListener('submit', handleReset);
}

if (showRegister) {
    showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        showRegisterForm();
    });
}

if (showLogin) {
    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        showLoginForm();
    });
}

if (showReset) {
    showReset.addEventListener('click', (e) => {
        e.preventDefault();
        showResetForm();
    });
}

if (backToLogin) {
    backToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        showLoginForm();
    });
}
