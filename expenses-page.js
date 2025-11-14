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
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const totalExpenses = document.getElementById('totalExpenses');
const todayExpenses = document.getElementById('todayExpenses');
const weekExpenses = document.getElementById('weekExpenses');
const totalAmount = document.getElementById('totalAmount');
const expensesContainer = document.getElementById('expensesContainer');
const categoryFilter = document.getElementById('categoryFilter');
const dateFilter = document.getElementById('dateFilter');
const minAmount = document.getElementById('minAmount');
const maxAmount = document.getElementById('maxAmount');
const logoutBtn = document.getElementById('logoutBtn');

let allExpenses = [];

// Check authentication
auth.onAuthStateChanged((user) => {
    if (user) {
        loadExpensesData();
        setupEventListeners();
    } else {
        window.location.href = 'login.html';
    }
});

// Load expenses data
async function loadExpensesData() {
    try {
        showLoading(true);
        
        // Load expenses from Firebase
        const expensesSnapshot = await db.collection('expenses').orderBy('date', 'desc').get();
        allExpenses = [];
        
        expensesSnapshot.forEach(doc => {
            allExpenses.push({ id: doc.id, ...doc.data() });
        });
        
        updateStats();
        displayExpenses(allExpenses);
        
        console.log(`✅ تم تحميل ${allExpenses.length} مصروف`);
        
    } catch (error) {
        console.error('خطأ في تحميل المصاريف:', error);
        showError('حدث خطأ في تحميل البيانات');
    } finally {
        showLoading(false);
    }
}

// Update statistics
function updateStats() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];
    
    // Total expenses count
    if (totalExpenses) totalExpenses.textContent = allExpenses.length;
    
    // Today's expenses
    const todayExpensesAmount = allExpenses
        .filter(expense => getExpenseDate(expense) === todayStr)
        .reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
    if (todayExpenses) todayExpenses.textContent = `${todayExpensesAmount.toLocaleString()} ج.م`;
    
    // Week expenses
    const weekExpensesAmount = allExpenses
        .filter(expense => getExpenseDate(expense) >= weekAgoStr)
        .reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
    if (weekExpenses) weekExpenses.textContent = `${weekExpensesAmount.toLocaleString()} ج.م`;
    
    // Total amount
    const totalAmountValue = allExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
    if (totalAmount) totalAmount.textContent = `${totalAmountValue.toLocaleString()} ج.م`;
}

// Display expenses
function displayExpenses(expenses) {
    if (!expensesContainer) return;
    
    if (expenses.length === 0) {
        expensesContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <h3>لا توجد مصاريف</h3>
                <p>لم يتم العثور على أي مصاريف مطابقة للفلاتر المحددة</p>
            </div>
        `;
        return;
    }
    
    const expensesHTML = expenses.map(expense => `
        <div class="data-item">
            <h4>
                <i class="fas fa-receipt"></i>
                ${expense.description || 'مصروف'}
                <span class="status-badge ${getCategoryClass(expense.category)}">${getCategoryText(expense.category)}</span>
            </h4>
            <div class="data-details">
                <div class="detail-row">
                    <span><strong>المبلغ:</strong> ${(expense.amount || 0).toLocaleString()} ج.م</span>
                    <span><strong>التاريخ:</strong> ${formatDate(getExpenseDate(expense))}</span>
                </div>
                <div class="detail-row">
                    <span><strong>الفئة:</strong> ${getCategoryText(expense.category)}</span>
                    ${expense.paymentMethod ? `<span><strong>طريقة الدفع:</strong> ${getPaymentMethodText(expense.paymentMethod)}</span>` : ''}
                </div>
                ${expense.vendor ? `<div class="detail-row"><span><strong>المورد:</strong> ${expense.vendor}</span></div>` : ''}
                ${expense.notes ? `<div class="detail-row"><span><strong>ملاحظات:</strong> ${expense.notes}</span></div>` : ''}
                <div class="detail-row">
                    <span><strong>تاريخ الإضافة:</strong> ${formatDateTime(expense.createdAt)}</span>
                    ${expense.addedBy ? `<span><strong>أضيف بواسطة:</strong> ${expense.addedBy}</span>` : ''}
                </div>
            </div>
        </div>
    `).join('');
    
    expensesContainer.innerHTML = expensesHTML;
}

// Filter expenses
function filterExpenses() {
    let filteredExpenses = [...allExpenses];
    
    // Filter by category
    const category = categoryFilter?.value;
    if (category) {
        filteredExpenses = filteredExpenses.filter(expense => expense.category === category);
    }
    
    // Filter by date
    const date = dateFilter?.value;
    if (date) {
        filteredExpenses = filteredExpenses.filter(expense => {
            const expenseDate = getExpenseDate(expense);
            return expenseDate === date;
        });
    }
    
    // Filter by amount range
    const minAmountValue = parseFloat(minAmount?.value) || 0;
    const maxAmountValue = parseFloat(maxAmount?.value) || Infinity;
    
    if (minAmountValue > 0 || maxAmountValue < Infinity) {
        filteredExpenses = filteredExpenses.filter(expense => {
            const amount = parseFloat(expense.amount) || 0;
            return amount >= minAmountValue && amount <= maxAmountValue;
        });
    }
    
    displayExpenses(filteredExpenses);
}

// Refresh data
window.refreshData = async function() {
    await loadExpensesData();
    showSuccessMessage('تم تحديث البيانات بنجاح');
};

// Export data
window.exportData = function() {
    const csvContent = generateCSV(allExpenses);
    downloadCSV(csvContent, 'expenses_data.csv');
    showSuccessMessage('تم تصدير البيانات بنجاح');
};

// Generate CSV
function generateCSV(expenses) {
    const headers = ['التاريخ', 'الوصف', 'المبلغ', 'الفئة', 'طريقة الدفع', 'المورد', 'الملاحظات', 'تاريخ الإضافة', 'أضيف بواسطة'];
    const rows = expenses.map(expense => [
        getExpenseDate(expense),
        expense.description || '',
        expense.amount || 0,
        getCategoryText(expense.category),
        getPaymentMethodText(expense.paymentMethod),
        expense.vendor || '',
        expense.notes || '',
        formatDateTime(expense.createdAt),
        expense.addedBy || ''
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

// Download CSV
function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

// Utility functions
function getExpenseDate(expense) {
    if (expense.date) {
        return typeof expense.date === 'string' ? expense.date : expense.date.toDate().toISOString().split('T')[0];
    }
    if (expense.createdAt) {
        const date = expense.createdAt.toDate ? expense.createdAt.toDate() : new Date(expense.createdAt);
        return date.toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-EG');
}

function formatDateTime(timestamp) {
    if (!timestamp) return 'غير محدد';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('ar-EG');
}

function getCategoryText(category) {
    const categories = {
        'food': 'مواد غذائية',
        'utilities': 'مرافق',
        'maintenance': 'صيانة',
        'salaries': 'رواتب',
        'rent': 'إيجار',
        'equipment': 'معدات',
        'marketing': 'تسويق',
        'transportation': 'مواصلات',
        'supplies': 'مستلزمات',
        'other': 'أخرى'
    };
    return categories[category] || category || 'غير محدد';
}

function getCategoryClass(category) {
    const classes = {
        'food': 'success',
        'utilities': 'info',
        'maintenance': 'warning',
        'salaries': 'error',
        'rent': 'error',
        'equipment': 'info',
        'marketing': 'success',
        'transportation': 'warning',
        'supplies': 'info',
        'other': 'info'
    };
    return classes[category] || 'info';
}

function getPaymentMethodText(method) {
    const methods = {
        'cash': 'نقدي',
        'card': 'بطاقة',
        'bank_transfer': 'تحويل بنكي',
        'check': 'شيك',
        'other': 'أخرى'
    };
    return methods[method] || method || 'غير محدد';
}

function showLoading(show = true) {
    if (!expensesContainer) return;
    
    if (show) {
        expensesContainer.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>جاري تحميل المصاريف...</p>
            </div>
        `;
    }
}

function showError(message) {
    if (expensesContainer) {
        expensesContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>خطأ</h3>
                <p>${message}</p>
            </div>
        `;
    }
}

function showSuccessMessage(message) {
    const messageEl = document.createElement('div');
    messageEl.className = 'message success';
    messageEl.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    messageEl.style.position = 'fixed';
    messageEl.style.top = '20px';
    messageEl.style.right = '20px';
    messageEl.style.zIndex = '1000';
    messageEl.style.minWidth = '300px';
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
        document.body.removeChild(messageEl);
    }, 3000);
}

// Setup event listeners
function setupEventListeners() {
    // Filters
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterExpenses);
    }
    
    if (dateFilter) {
        dateFilter.addEventListener('change', filterExpenses);
    }
    
    if (minAmount) {
        minAmount.addEventListener('input', filterExpenses);
    }
    
    if (maxAmount) {
        maxAmount.addEventListener('input', filterExpenses);
    }
    
    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await auth.signOut();
                window.location.href = 'login.html';
            } catch (error) {
                console.error('خطأ في تسجيل الخروج:', error);
            }
        });
    }
}

// Auto refresh every 30 seconds
setInterval(async () => {
    if (auth.currentUser) {
        await loadExpensesData();
        console.log('🔄 تم تحديث بيانات المصاريف تلقائياً');
    }
}, 30000);
