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
const totalShifts = document.getElementById('totalShifts');
const todayShifts = document.getElementById('todayShifts');
const activeShifts = document.getElementById('activeShifts');
const totalRevenue = document.getElementById('totalRevenue');
const shiftsContainer = document.getElementById('shiftsContainer');
const statusFilter = document.getElementById('statusFilter');
const dateFilter = document.getElementById('dateFilter');
const logoutBtn = document.getElementById('logoutBtn');

let allShifts = [];
let originalShiftsData = []; // Keep original data before filtering

// Check authentication
auth.onAuthStateChanged((user) => {
    if (user) {
        loadShiftsData();
        setupEventListeners();
    } else {
        window.location.href = 'login.html';
    }
});

// Load shifts data
async function loadShiftsData() {
    try {
        showLoading(true);
        
        // Load shifts from Firebase with better error handling
        let shiftsData = [];
        
        try {
            // Try to load shifts collection
            const shiftsSnapshot = await db.collection('shifts').get();
            
            shiftsSnapshot.forEach(doc => {
                const data = doc.data();
                console.log('بيانات الشيفت:', data); // Debug log
                
                shiftsData.push({ 
                    id: doc.id, 
                    ...data,
                    // Ensure we have proper date handling
                    startTime: data.startTime || data.createdAt || data.date || new Date(),
                    endTime: data.endTime || data.startTime || data.createdAt || data.date || null,
                    totalSales: parseFloat(data.totalSales) || parseFloat(data.revenue) || parseFloat(data.sales) || parseFloat(data.amount) || 0,
                    ordersCount: parseInt(data.ordersCount) || parseInt(data.orders) || parseInt(data.orderCount) || parseInt(data.count) || 0,
                    status: data.status || 'completed',
                    type: 'shift'
                });
            });
            console.log(`✅ تم تحميل ${shiftsSnapshot.size} شيفت من مجموعة shifts`);
        } catch (e) {
            console.warn('خطأ في تحميل مجموعة shifts:', e);
        }
        
        // Also try to load from sales_reports
        try {
            const salesSnapshot = await db.collection('sales_reports').get();
            
            salesSnapshot.forEach(doc => {
                const data = doc.data();
                const totalSales = parseFloat(data.totalSales) || parseFloat(data.revenue) || parseFloat(data.sales) || 0;
                const ordersCount = parseInt(data.ordersCount) || parseInt(data.orders) || parseInt(data.orderCount) || 0;
                
                // Only add sales reports that have actual sales data
                if (totalSales > 0 || ordersCount > 0) {
                    console.log('إضافة تقرير مبيعات صالح:', { totalSales, ordersCount });
                    
                    shiftsData.push({
                        id: `sales_${doc.id}`,
                        ...data,
                        startTime: data.date || data.createdAt || new Date(),
                        endTime: data.date || data.createdAt || new Date(),
                        totalSales: totalSales,
                        ordersCount: ordersCount,
                        status: 'completed',
                        type: 'sales_report',
                        description: 'تقرير مبيعات'
                    });
                } else {
                    console.log('تم تجاهل تقرير مبيعات فارغ:', { id: doc.id, totalSales, ordersCount });
                }
            });
            console.log(`✅ تم تحميل ${salesSnapshot.size} تقرير مبيعات من مجموعة sales_reports`);
        } catch (e) {
            console.warn('خطأ في تحميل مجموعة sales_reports:', e);
        }
        
        // Also try comprehensive_reports
        try {
            const comprehensiveSnapshot = await db.collection('comprehensive_reports').get();
            
            comprehensiveSnapshot.forEach(doc => {
                const data = doc.data();
                const totalSales = parseFloat(data.totalSales) || parseFloat(data.revenue) || parseFloat(data.sales) || 0;
                const ordersCount = parseInt(data.ordersCount) || parseInt(data.orders) || parseInt(data.orderCount) || 0;
                
                // Only add comprehensive reports that have actual sales data
                if (totalSales > 0 || ordersCount > 0) {
                    console.log('إضافة تقرير شامل صالح:', { totalSales, ordersCount });
                    
                    shiftsData.push({
                        id: `comprehensive_${doc.id}`,
                        ...data,
                        startTime: data.date || data.createdAt || new Date(),
                        endTime: data.date || data.createdAt || new Date(),
                        totalSales: totalSales,
                        ordersCount: ordersCount,
                        status: 'completed',
                        type: 'comprehensive_report',
                        description: 'تقرير شامل'
                    });
                } else {
                    console.log('تم تجاهل تقرير شامل فارغ:', { id: doc.id, totalSales, ordersCount });
                }
            });
            console.log(`✅ تم تحميل ${comprehensiveSnapshot.size} تقرير شامل من مجموعة comprehensive_reports`);
        } catch (e) {
            console.warn('خطأ في تحميل مجموعة comprehensive_reports:', e);
        }
        
        // Sort by date (newest first)
        shiftsData.sort((a, b) => {
            const dateA = a.startTime?.toDate ? a.startTime.toDate() : new Date(a.startTime);
            const dateB = b.startTime?.toDate ? b.startTime.toDate() : new Date(b.startTime);
            return dateB - dateA;
        });
        
        if (shiftsData.length === 0) {
            console.log('⚠️ لا توجد بيانات في Firebase');
            console.log('💡 تأكد من وجود بيانات في المجموعات: shifts, sales_reports, comprehensive_reports');
        }
        
        // Save original data
        originalShiftsData = shiftsData;
        
        // Filter out empty reports based on user preference
        const filteredShifts = filterEmptyReports(shiftsData);
        
        allShifts = filteredShifts;
        updateStats();
        displayShifts(allShifts);
        
        console.log(`✅ تم تحميل ${allShifts.length} عنصر (شيفتات وتقارير)`);
        
    } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
        // Don't create sample data on error - show empty state instead
        allShifts = [];
        updateStats();
        displayShifts(allShifts);
        showError('فشل في تحميل البيانات من Firebase - تحقق من الاتصال');
    } finally {
        showLoading(false);
    }
}

// Sample data creation removed - all data comes from Firebase only

// Filter empty reports based on user preference
function filterEmptyReports(shiftsData) {
    const hideEmptyReports = document.getElementById('hideEmptyReports')?.checked ?? true;
    
    if (!hideEmptyReports) {
        return shiftsData; // Show all data if filter is disabled
    }
    
    return shiftsData.filter(item => {
        // Always keep actual shifts
        if (!item.type || !item.type.includes('report')) {
            return true;
        }
        
        // For reports, check if they have meaningful data
        const hasSales = (item.totalSales && item.totalSales > 0);
        const hasOrders = (item.ordersCount && item.ordersCount > 0);
        
        // Skip empty reports when filter is enabled
        if (!hasSales && !hasOrders) {
            console.log('تم تجاهل تقرير فارغ:', { 
                id: item.id, 
                type: item.type, 
                totalSales: item.totalSales, 
                ordersCount: item.ordersCount 
            });
            return false;
        }
        
        return true;
    });
}

// Update statistics
function updateStats() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Separate actual shifts from reports
    const actualShifts = allShifts.filter(item => !item.type || !item.type.includes('report'));
    const reports = allShifts.filter(item => item.type && item.type.includes('report'));
    
    // Total shifts (only actual shifts, not reports)
    if (totalShifts) totalShifts.textContent = actualShifts.length;
    
    // Today's shifts and reports
    const todayItems = allShifts.filter(item => {
        const itemDate = getShiftDate(item);
        return itemDate === todayStr;
    });
    if (todayShifts) todayShifts.textContent = todayItems.length;
    
    // Active shifts (only actual shifts with active status)
    const activeShiftsCount = actualShifts.filter(shift => 
        shift.status === 'active' || shift.status === 'ongoing'
    ).length;
    if (activeShifts) activeShifts.textContent = activeShiftsCount;
    
    // Total revenue from all sources
    const revenue = allShifts.reduce((total, item) => {
        return total + (parseFloat(item.totalSales) || 0);
    }, 0);
    if (totalRevenue) totalRevenue.textContent = `${revenue.toLocaleString()} ج.م`;
    
    // Log statistics for debugging
    console.log(`📊 الإحصائيات: ${actualShifts.length} شيفت، ${reports.length} تقرير، إجمالي الإيرادات: ${revenue.toLocaleString()} ج.م`);
}

// Display shifts
function displayShifts(shifts) {
    if (!shiftsContainer) return;
    
    // Store currently displayed shifts
    displayedShifts = shifts;
    
    if (shifts.length === 0) {
        shiftsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>لا توجد شيفتات</h3>
                <p>لم يتم العثور على أي شيفتات أو تقارير في Firebase</p>
                <div style="margin-top: 20px;">
                    <button onclick="loadShiftsData()" class="btn btn-info">
                        <i class="fas fa-refresh"></i> إعادة تحميل من Firebase
                    </button>
                </div>
                <div style="margin-top: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px; text-align: right;">
                    <h5>💡 معلومات:</h5>
                    <p>لا توجد شيفتات أو تقارير في قاعدة البيانات Firebase</p>
                    <p>يمكنك إضافة البيانات من خلال النظام الأساسي للمطعم</p>
                </div>
            </div>
        `;
        return;
    }
    
    // ... (rest of the code remains the same)
    const shiftsHTML = shifts.map((shift, index) => {
        const isReport = shift.type && shift.type.includes('report');
        const icon = isReport ? 'fas fa-chart-bar' : 'fas fa-clock';
        const title = isReport ? (shift.description || 'تقرير') : 'شيفت';
        
        return `
        <div class="data-item ${isReport ? 'report-item' : 'shift-item'}" onclick="showShiftDetails(${index})" style="cursor: pointer;" data-shift-id="${shift.id || 'no-id'}" data-index="${index}">
            <h4>
                <i class="${icon}"></i>
                ${title} ${formatDate(getShiftDate(shift))}
                <span class="status-badge ${getStatusClass(shift.status)}">${getStatusText(shift.status)}</span>
                ${isReport ? `<span class="type-badge">${getTypeText(shift.type)}</span>` : ''}
                <span class="click-hint" style="margin-left: auto; color: #666; font-size: 0.8em;">
                    <i class="fas fa-eye"></i> انقر للتفاصيل
                </span>
            </h4>
            <div class="data-details">
                <div class="detail-row">
                    <span><strong>إجمالي المبيعات:</strong> ${(shift.totalSales || 0).toLocaleString()} ج.م</span>
                    <span><strong>عدد الطلبات:</strong> ${shift.ordersCount || 0}</span>
                </div>
                ${!isReport ? `
                <div class="detail-row">
                    <span><strong>وقت البداية:</strong> ${formatTime(shift.startTime)}</span>
                    <span><strong>وقت النهاية:</strong> ${formatTime(shift.endTime)}</span>
                </div>
                ` : ''}
                ${shift.cashSales ? `
                <div class="detail-row">
                    <span><strong>المبيعات النقدية:</strong> ${parseFloat(shift.cashSales).toLocaleString()} ج.م</span>
                    <span><strong>المبيعات الآجلة:</strong> ${parseFloat(shift.creditSales || 0).toLocaleString()} ج.م</span>
                </div>
                ` : ''}
                ${shift.totalExpenses ? `
                <div class="detail-row">
                    <span><strong>إجمالي المصاريف:</strong> ${parseFloat(shift.totalExpenses).toLocaleString()} ج.م</span>
                    <span><strong>صافي الربح:</strong> ${((shift.totalSales || 0) - (shift.totalExpenses || 0)).toLocaleString()} ج.م</span>
                </div>
                ` : ''}
                ${shift.averageOrderValue ? `
                <div class="detail-row">
                    <span><strong>متوسط قيمة الطلب:</strong> ${parseFloat(shift.averageOrderValue).toLocaleString()} ج.م</span>
                    ${shift.shiftsCount ? `<span><strong>عدد الشيفتات:</strong> ${shift.shiftsCount}</span>` : ''}
                </div>
                ` : ''}
                ${shift.notes || shift.description ? `
                <div class="detail-row">
                    <span><strong>ملاحظات:</strong> ${shift.notes || shift.description || ''}</span>
                </div>
                ` : ''}
                ${shift.addedBy || shift.createdBy ? `
                <div class="detail-row">
                    <span><strong>أضيف بواسطة:</strong> ${shift.addedBy || shift.createdBy}</span>
                </div>
                ` : ''}
                <div class="detail-row">
                    <span><strong>تاريخ الإنشاء:</strong> ${formatDateTime(shift.createdAt)}</span>
                    ${shift.updatedAt ? `<span><strong>آخر تحديث:</strong> ${formatDateTime(shift.updatedAt)}</span>` : ''}
                </div>
            </div>
        </div>
    `;
    }).join('');
    
    shiftsContainer.innerHTML = shiftsHTML;
    console.log(`✅ تم عرض ${shifts.length} عنصر`);
    console.log('📋 الشيفتات المعروضة:', displayedShifts.map((s, i) => `${i}: ${s.id || 'no-id'}`));
}

// Filter shifts
function filterShifts() {
    let filteredShifts = [...allShifts];
    
    // Filter by status
    const status = statusFilter?.value;
    if (status) {
        filteredShifts = filteredShifts.filter(shift => shift.status === status);
    }
    
    // Filter by date
    const date = dateFilter?.value;
    if (date) {
        filteredShifts = filteredShifts.filter(shift => {
            const shiftDate = getShiftDate(shift);
            return shiftDate === date;
        });
    }
    
    displayShifts(filteredShifts);
}

// Refresh data
window.refreshData = async function() {
    await loadShiftsData();
    showSuccessMessage('تم تحديث البيانات بنجاح');
};

// Export data
window.exportData = function() {
    const csvContent = generateCSV(allShifts);
    downloadCSV(csvContent, 'shifts_data.csv');
    showSuccessMessage('تم تصدير البيانات بنجاح');
};

// Generate CSV
function generateCSV(shifts) {
    const headers = ['التاريخ', 'وقت البداية', 'وقت النهاية', 'الحالة', 'إجمالي المبيعات', 'عدد الطلبات', 'الملاحظات'];
    const rows = shifts.map(shift => [
        getShiftDate(shift),
        formatTime(shift.startTime),
        formatTime(shift.endTime),
        getStatusText(shift.status),
        shift.totalSales || 0,
        shift.ordersCount || 0,
        shift.notes || ''
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
function getShiftDate(shift) {
    let date;
    
    if (shift.date) {
        date = shift.date.toDate ? shift.date.toDate() : new Date(shift.date);
    } else if (shift.startTime) {
        date = shift.startTime.toDate ? shift.startTime.toDate() : new Date(shift.startTime);
    } else if (shift.createdAt) {
        date = shift.createdAt.toDate ? shift.createdAt.toDate() : new Date(shift.createdAt);
    } else {
        date = new Date();
    }
    
    return date.toISOString().split('T')[0];
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-EG');
}

function formatTime(timestamp) {
    if (!timestamp) return 'غير محدد';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(timestamp) {
    if (!timestamp) return 'غير محدد';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('ar-EG');
}

function getStatusText(status) {
    const statusMap = {
        'active': 'نشط',
        'ongoing': 'جاري',
        'completed': 'مكتمل',
        'cancelled': 'ملغي'
    };
    return statusMap[status] || status || 'غير محدد';
}

function getStatusClass(status) {
    const classMap = {
        'active': 'success',
        'ongoing': 'info',
        'completed': 'success',
        'cancelled': 'error'
    };
    return classMap[status] || 'info';
}

function getTypeText(type) {
    const typeMap = {
        'sales_report': 'تقرير مبيعات',
        'comprehensive_report': 'تقرير شامل',
        'daily_report': 'تقرير يومي',
        'weekly_report': 'تقرير أسبوعي',
        'monthly_report': 'تقرير شهري'
    };
    return typeMap[type] || type || 'تقرير';
}

function getFieldLabel(field) {
    const fieldLabels = {
        // Basic fields
        'startTime': 'وقت البداية',
        'endTime': 'وقت النهاية',
        'createdAt': 'تاريخ الإنشاء',
        'updatedAt': 'آخر تحديث',
        'date': 'التاريخ',
        
        // Financial fields
        'totalSales': 'إجمالي المبيعات',
        'revenue': 'الإيرادات',
        'sales': 'المبيعات',
        'amount': 'المبلغ',
        'cashSales': 'المبيعات النقدية',
        'creditSales': 'المبيعات الآجلة',
        'totalExpenses': 'إجمالي المصاريف',
        'expenses': 'المصاريف',
        'cost': 'التكلفة',
        'profit': 'الربح',
        'netProfit': 'صافي الربح',
        'averageOrderValue': 'متوسط قيمة الطلب',
        
        // Order fields
        'ordersCount': 'عدد الطلبات',
        'orders': 'الطلبات',
        'orderCount': 'عدد الطلبات',
        'count': 'العدد',
        'quantity': 'الكمية',
        
        // User fields
        'addedBy': 'أضيف بواسطة',
        'createdBy': 'أنشئ بواسطة',
        'updatedBy': 'حُدث بواسطة',
        'userId': 'معرف المستخدم',
        'userEmail': 'بريد المستخدم',
        
        // Shift specific
        'shiftsCount': 'عدد الشيفتات',
        'duration': 'المدة',
        'notes': 'الملاحظات',
        'description': 'الوصف',
        'location': 'الموقع',
        'branch': 'الفرع',
        'employee': 'الموظف',
        'manager': 'المدير',
        
        // Status fields
        'active': 'نشط',
        'completed': 'مكتمل',
        'cancelled': 'ملغي',
        'pending': 'في الانتظار',
        'approved': 'موافق عليه',
        'rejected': 'مرفوض',
        
        // Category fields
        'category': 'الفئة',
        'type': 'النوع',
        'subCategory': 'الفئة الفرعية',
        'tags': 'العلامات',
        
        // Payment fields
        'paymentMethod': 'طريقة الدفع',
        'paymentStatus': 'حالة الدفع',
        'discount': 'الخصم',
        'tax': 'الضريبة',
        'tip': 'البقشيش',
        
        // Additional fields
        'reference': 'المرجع',
        'invoiceNumber': 'رقم الفاتورة',
        'receiptNumber': 'رقم الإيصال',
        'customerName': 'اسم العميل',
        'customerPhone': 'هاتف العميل',
        'deliveryAddress': 'عنوان التوصيل',
        'deliveryFee': 'رسوم التوصيل',
        'preparationTime': 'وقت التحضير',
        'deliveryTime': 'وقت التوصيل'
    };
    
    return fieldLabels[field] || field.replace(/([A-Z])/g, ' $1').trim() || field;
}

function showLoading(show = true) {
    if (!shiftsContainer) return;
    
    if (show) {
        shiftsContainer.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>جاري تحميل البيانات من Firebase...</p>
                <small>يتم تحميل الشيفتات والتقارير من جميع المصادر</small>
            </div>
        `;
    }
}

function showError(message) {
    if (shiftsContainer) {
        shiftsContainer.innerHTML = `
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
    if (statusFilter) {
        statusFilter.addEventListener('change', filterShifts);
    }
    
    if (dateFilter) {
        dateFilter.addEventListener('change', filterShifts);
    }
    
    // Hide empty reports toggle
    const hideEmptyReportsToggle = document.getElementById('hideEmptyReports');
    if (hideEmptyReportsToggle) {
        hideEmptyReportsToggle.addEventListener('change', () => {
            console.log('تم تغيير إعداد إخفاء التقارير الفارغة:', hideEmptyReportsToggle.checked);
            // Re-filter and display shifts using original data
            const filteredShifts = filterEmptyReports(originalShiftsData);
            allShifts = filteredShifts;
            updateStats();
            displayShifts(allShifts);
        });
    }
    
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

// Modal functions

// Simple function to show shift details
window.showShiftDetails = function(index) {
    console.log('👆 تم النقر على الشيفت رقم:', index);
    
    // Use the currently displayed shifts
    const currentShifts = displayedShifts.length > 0 ? displayedShifts : allShifts;
    
    if (index < 0 || index >= currentShifts.length) {
        console.error('❌ فهرس غير صحيح:', index, 'من أصل', currentShifts.length);
        alert('خطأ في فهرس الشيفت');
        return;
    }
    
    const shift = currentShifts[index];
    console.log('✅ تم العثور على الشيفت:', shift);
    
    // Call the modal function
    openShiftModal(shift);
};

// New function using index instead of ID
window.openShiftModalByIndex = function(index) {
    console.log('🔍 فتح تفاصيل الشيفت بالفهرس:', index);
    
    if (index < 0 || index >= allShifts.length) {
        console.error('❌ فهرس الشيفت غير صحيح:', index);
        alert('فهرس الشيفت غير صحيح');
        return;
    }
    
    const shift = allShifts[index];
    console.log('📊 بيانات الشيفت:', shift);
    
    openShiftModal(shift);
};

// Updated function to work with shift object directly
window.openShiftModal = function(shift) {
    console.log('🔍 فتح تفاصيل الشيفت:', shift.id || 'بدون معرف');
    
    if (!shift) {
        console.error('❌ لم يتم تمرير بيانات الشيفت');
        alert('لم يتم العثور على بيانات الشيفت');
        return;
    }
    
    console.log('📊 بيانات الشيفت:', shift);
    
    currentShiftData = shift;
    const modal = document.getElementById('shiftModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    if (!modal || !modalTitle || !modalBody) {
        console.error('❌ عناصر النافذة المنبثقة غير موجودة');
        alert('خطأ في عرض النافذة المنبثقة');
        return;
    }
    
    // Set title
    const isReport = shift.type && shift.type.includes('report');
    const title = isReport ? (shift.description || 'تقرير') : 'شيفت';
    modalTitle.textContent = `${title} - ${formatDate(getShiftDate(shift))}`;
    
    // Generate detailed content
    console.log('🔄 إنشاء محتوى التفاصيل...');
    modalBody.innerHTML = generateShiftDetails(shift);
    
    // Show modal
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Add collapsible functionality to sections
    setTimeout(() => {
        console.log('🎛️ إضافة وظائف الطي والتوسيع...');
        const sections = modalBody.querySelectorAll('.modal-section');
        console.log(`📂 تم العثور على ${sections.length} قسم`);
        
        sections.forEach((section, index) => {
            // Make raw data section collapsible by default
            if (section.querySelector('h4 i.fa-code')) {
                section.classList.add('collapsible', 'collapsed');
                console.log('💻 تم طي قسم البيانات الخام');
            } else if (index > 2) {
                // Make sections after the first 3 collapsible
                section.classList.add('collapsible');
                console.log(`📁 تم جعل القسم ${index + 1} قابل للطي`);
            }
            
            const header = section.querySelector('h4');
            if (header && section.classList.contains('collapsible')) {
                header.addEventListener('click', () => {
                    section.classList.toggle('collapsed');
                    console.log(`🔄 تم تبديل حالة القسم ${index + 1}`);
                });
            }
        });
        
        console.log('✅ تم إعداد النافذة المنبثقة بنجاح');
    }, 100);
};

window.closeShiftModal = function() {
    console.log('❌ إغلاق النافذة المنبثقة');
    const modal = document.getElementById('shiftModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    currentShiftData = null;
};

// All test and diagnostic functions removed - data comes from Firebase only

// All sample data functions removed - data comes from Firebase only

window.exportShiftDetails = function() {
    if (!currentShiftData) return;
    
    const csvContent = generateShiftCSV(currentShiftData);
    const filename = `shift_${currentShiftData.id}_${getShiftDate(currentShiftData)}.csv`;
    downloadCSV(csvContent, filename);
    showSuccessMessage('تم تصدير تفاصيل الشيفت بنجاح');
};

function generateShiftDetails(shift) {
    const isReport = shift.type && shift.type.includes('report');
    
    let html = `
        <!-- Basic Information -->
        <div class="modal-section">
            <h4><i class="fas fa-info-circle"></i> المعلومات الأساسية</h4>
            <div class="modal-detail-grid">
                <div class="modal-detail-item">
                    <div class="modal-detail-label">نوع العنصر</div>
                    <div class="modal-detail-value">${isReport ? getTypeText(shift.type) : 'شيفت عمل'}</div>
                </div>
                <div class="modal-detail-item">
                    <div class="modal-detail-label">الحالة</div>
                    <div class="modal-detail-value ${getStatusClass(shift.status)}">${getStatusText(shift.status)}</div>
                </div>
                <div class="modal-detail-item">
                    <div class="modal-detail-label">التاريخ</div>
                    <div class="modal-detail-value">${formatDate(getShiftDate(shift))}</div>
                </div>
                <div class="modal-detail-item">
                    <div class="modal-detail-label">المعرف</div>
                    <div class="modal-detail-value" style="font-family: monospace; font-size: 0.9em;">${shift.id}</div>
                </div>
            </div>
        </div>
    `;
    
    // Show ALL available data fields
    const allFields = Object.keys(shift).filter(key => 
        !['id', 'type', 'status', 'description'].includes(key)
    );
    
    if (allFields.length > 0) {
        html += `
            <div class="modal-section">
                <h4><i class="fas fa-database"></i> جميع البيانات المتاحة</h4>
                <div class="modal-detail-grid">
        `;
        
        allFields.forEach(field => {
            const value = shift[field];
            if (value !== null && value !== undefined && value !== '') {
                let displayValue = value;
                let label = getFieldLabel(field);
                
                // Format different types of values
                if (typeof value === 'object' && value.toDate) {
                    displayValue = formatDateTime(value);
                } else if (typeof value === 'number') {
                    if (field.includes('Sales') || field.includes('amount') || field.includes('cost') || field.includes('revenue')) {
                        displayValue = `${value.toLocaleString()} ج.م`;
                    } else {
                        displayValue = value.toLocaleString();
                    }
                } else if (typeof value === 'boolean') {
                    displayValue = value ? 'نعم' : 'لا';
                } else if (typeof value === 'object') {
                    displayValue = JSON.stringify(value, null, 2);
                }
                
                html += `
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">${label}</div>
                        <div class="modal-detail-value">${displayValue}</div>
                    </div>
                `;
            }
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    // Financial Information
    html += `
        <div class="modal-section">
            <h4><i class="fas fa-money-bill-wave"></i> المعلومات المالية</h4>
            <div class="modal-detail-grid">
                <div class="modal-detail-item">
                    <div class="modal-detail-label">إجمالي المبيعات</div>
                    <div class="modal-detail-value large">${(shift.totalSales || 0).toLocaleString()} ج.م</div>
                </div>
                <div class="modal-detail-item">
                    <div class="modal-detail-label">عدد الطلبات</div>
                    <div class="modal-detail-value">${shift.ordersCount || 0}</div>
                </div>
    `;
    
    if (shift.cashSales || shift.creditSales) {
        html += `
                <div class="modal-detail-item">
                    <div class="modal-detail-label">المبيعات النقدية</div>
                    <div class="modal-detail-value success">${(shift.cashSales || 0).toLocaleString()} ج.م</div>
                </div>
                <div class="modal-detail-item">
                    <div class="modal-detail-label">المبيعات الآجلة</div>
                    <div class="modal-detail-value">${(shift.creditSales || 0).toLocaleString()} ج.م</div>
                </div>
        `;
    }
    
    if (shift.totalExpenses) {
        html += `
                <div class="modal-detail-item">
                    <div class="modal-detail-label">إجمالي المصاريف</div>
                    <div class="modal-detail-value error">${parseFloat(shift.totalExpenses).toLocaleString()} ج.م</div>
                </div>
                <div class="modal-detail-item">
                    <div class="modal-detail-label">صافي الربح</div>
                    <div class="modal-detail-value success">${((shift.totalSales || 0) - (shift.totalExpenses || 0)).toLocaleString()} ج.م</div>
                </div>
        `;
    }
    
    if (shift.averageOrderValue) {
        html += `
                <div class="modal-detail-item">
                    <div class="modal-detail-label">متوسط قيمة الطلب</div>
                    <div class="modal-detail-value">${parseFloat(shift.averageOrderValue).toLocaleString()} ج.م</div>
                </div>
        `;
    }
    
    html += `
            </div>
        </div>
    `;
    
    // Time Information (for shifts only)
    if (!isReport) {
        html += `
            <div class="modal-section">
                <h4><i class="fas fa-clock"></i> معلومات التوقيت</h4>
                <div class="modal-detail-grid">
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">وقت البداية</div>
                        <div class="modal-detail-value">${formatTime(shift.startTime)}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">وقت النهاية</div>
                        <div class="modal-detail-value">${formatTime(shift.endTime)}</div>
                    </div>
        `;
        
        if (shift.startTime && shift.endTime) {
            const start = shift.startTime.toDate ? shift.startTime.toDate() : new Date(shift.startTime);
            const end = shift.endTime.toDate ? shift.endTime.toDate() : new Date(shift.endTime);
            const duration = (end - start) / (1000 * 60 * 60); // hours
            
            html += `
                    <div class="modal-detail-item">
                        <div class="modal-detail-label">مدة الشيفت</div>
                        <div class="modal-detail-value">${duration.toFixed(1)} ساعة</div>
                    </div>
            `;
        }
        
        html += `
                </div>
            </div>
        `;
    }
    
    // Additional Information
    html += `
        <div class="modal-section">
            <h4><i class="fas fa-info"></i> معلومات إضافية</h4>
            <div class="modal-detail-grid">
                <div class="modal-detail-item">
                    <div class="modal-detail-label">تاريخ الإنشاء</div>
                    <div class="modal-detail-value">${formatDateTime(shift.createdAt)}</div>
                </div>
    `;
    
    if (shift.updatedAt) {
        html += `
                <div class="modal-detail-item">
                    <div class="modal-detail-label">آخر تحديث</div>
                    <div class="modal-detail-value">${formatDateTime(shift.updatedAt)}</div>
                </div>
        `;
    }
    
    if (shift.addedBy || shift.createdBy) {
        html += `
                <div class="modal-detail-item">
                    <div class="modal-detail-label">أضيف بواسطة</div>
                    <div class="modal-detail-value">${shift.addedBy || shift.createdBy}</div>
                </div>
        `;
    }
    
    if (shift.shiftsCount) {
        html += `
                <div class="modal-detail-item">
                    <div class="modal-detail-label">عدد الشيفتات</div>
                    <div class="modal-detail-value">${shift.shiftsCount}</div>
                </div>
        `;
    }
    
    html += `
            </div>
        </div>
    `;
    
    // Notes
    if (shift.notes || shift.description) {
        html += `
            <div class="modal-section">
                <h4><i class="fas fa-sticky-note"></i> الملاحظات</h4>
                <div class="modal-detail-item">
                    <div class="modal-detail-value">${shift.notes || shift.description}</div>
                </div>
            </div>
        `;
    }
    
    // Raw data section for debugging
    html += `
        <div class="modal-section">
            <h4><i class="fas fa-code"></i> البيانات الخام (للمطورين)</h4>
            <div class="modal-detail-item">
                <div class="modal-detail-value" style="background: #f8f9fa; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 12px; white-space: pre-wrap; max-height: 300px; overflow-y: auto; border: 1px solid #e9ecef;">
${JSON.stringify(shift, null, 2)}
                </div>
            </div>
        </div>
    `;
    
    return html;
}

function generateShiftCSV(shift) {
    const isReport = shift.type && shift.type.includes('report');
    const headers = ['الحقل', 'القيمة'];
    const rows = [
        ['نوع العنصر', isReport ? getTypeText(shift.type) : 'شيفت عمل'],
        ['الحالة', getStatusText(shift.status)],
        ['التاريخ', formatDate(getShiftDate(shift))],
        ['المعرف', shift.id],
        ['إجمالي المبيعات', `${(shift.totalSales || 0).toLocaleString()} ج.م`],
        ['عدد الطلبات', shift.ordersCount || 0]
    ];
    
    if (!isReport) {
        rows.push(['وقت البداية', formatTime(shift.startTime)]);
        rows.push(['وقت النهاية', formatTime(shift.endTime)]);
    }
    
    if (shift.cashSales) rows.push(['المبيعات النقدية', `${shift.cashSales.toLocaleString()} ج.م`]);
    if (shift.creditSales) rows.push(['المبيعات الآجلة', `${shift.creditSales.toLocaleString()} ج.م`]);
    if (shift.totalExpenses) rows.push(['إجمالي المصاريف', `${shift.totalExpenses.toLocaleString()} ج.م`]);
    if (shift.averageOrderValue) rows.push(['متوسط قيمة الطلب', `${shift.averageOrderValue.toLocaleString()} ج.م`]);
    if (shift.notes) rows.push(['الملاحظات', shift.notes]);
    if (shift.addedBy) rows.push(['أضيف بواسطة', shift.addedBy]);
    
    rows.push(['تاريخ الإنشاء', formatDateTime(shift.createdAt)]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('shiftModal');
    if (event.target === modal) {
        closeShiftModal();
    }
};

// Auto refresh every 30 seconds
setInterval(async () => {
    if (auth.currentUser) {
        await loadShiftsData();
        console.log('🔄 تم تحديث بيانات الشيفتات تلقائياً');
    }
}, 30000);
