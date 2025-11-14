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
const totalRevenue = document.getElementById('totalRevenue');
const totalExpensesAmount = document.getElementById('totalExpensesAmount');
const netProfit = document.getElementById('netProfit');
const totalOrders = document.getElementById('totalOrders');
const revenueTrend = document.getElementById('revenueTrend');
const expensesTrend = document.getElementById('expensesTrend');
const profitTrend = document.getElementById('profitTrend');
const ordersTrend = document.getElementById('ordersTrend');
const periodFilter = document.getElementById('periodFilter');
const logoutBtn = document.getElementById('logoutBtn');

// Statistics elements
const avgShiftDuration = document.getElementById('avgShiftDuration');
const busiestDay = document.getElementById('busiestDay');
const avgRevenuePerShift = document.getElementById('avgRevenuePerShift');
const topExpenseCategory = document.getElementById('topExpenseCategory');
const avgDailyExpenses = document.getElementById('avgDailyExpenses');
const expenseRatio = document.getElementById('expenseRatio');

let allData = {
    shifts: [],
    reports: [],
    expenses: []
};

let charts = {};

// Check authentication
auth.onAuthStateChanged((user) => {
    if (user) {
        loadAllData();
        setupEventListeners();
    } else {
        window.location.href = 'login.html';
    }
});

// Load all data
async function loadAllData() {
    try {
        showLoading(true);
        
        // Reset data
        allData = { shifts: [], reports: [], expenses: [] };
        
        // Load shifts
        try {
            const shiftsSnapshot = await db.collection('shifts').get();
            shiftsSnapshot.forEach(doc => {
                const data = doc.data();
                allData.shifts.push({ 
                    id: doc.id, 
                    ...data,
                    totalSales: parseFloat(data.totalSales) || parseFloat(data.revenue) || parseFloat(data.sales) || 0,
                    ordersCount: parseInt(data.ordersCount) || parseInt(data.orders) || 0
                });
            });
            console.log(`✅ تم تحميل ${allData.shifts.length} شيفت`);
        } catch (e) {
            console.warn('خطأ في تحميل الشيفتات:', e);
        }
        
        // Load sales reports
        try {
            const salesSnapshot = await db.collection('sales_reports').get();
            salesSnapshot.forEach(doc => {
                const data = doc.data();
                const totalSales = parseFloat(data.totalSales) || parseFloat(data.revenue) || 0;
                const ordersCount = parseInt(data.ordersCount) || parseInt(data.orders) || 0;
                
                // Only add reports with actual data
                if (totalSales > 0 || ordersCount > 0) {
                    allData.reports.push({ 
                        id: doc.id, 
                        ...data,
                        totalSales: totalSales,
                        ordersCount: ordersCount,
                        type: 'sales_report'
                    });
                    console.log('إضافة تقرير مبيعات صالح:', { id: doc.id, totalSales, ordersCount });
                } else {
                    console.log('تم تجاهل تقرير مبيعات فارغ:', { id: doc.id, totalSales, ordersCount });
                }
            });
            console.log(`✅ تم تحميل ${allData.reports.length} تقرير مبيعات صالح`);
        } catch (e) {
            console.warn('خطأ في تحميل تقارير المبيعات:', e);
        }
        
        // Load comprehensive reports
        try {
            const comprehensiveSnapshot = await db.collection('comprehensive_reports').get();
            comprehensiveSnapshot.forEach(doc => {
                const data = doc.data();
                const totalSales = parseFloat(data.totalSales) || parseFloat(data.revenue) || 0;
                const ordersCount = parseInt(data.ordersCount) || parseInt(data.orders) || 0;
                
                // Only add comprehensive reports with actual data
                if (totalSales > 0 || ordersCount > 0) {
                    allData.reports.push({ 
                        id: doc.id, 
                        ...data,
                        totalSales: totalSales,
                        ordersCount: ordersCount,
                        type: 'comprehensive'
                    });
                    console.log('إضافة تقرير شامل صالح:', { id: doc.id, totalSales, ordersCount });
                } else {
                    console.log('تم تجاهل تقرير شامل فارغ:', { id: doc.id, totalSales, ordersCount });
                }
            });
            console.log(`✅ تم تحميل ${allData.reports.length} تقرير شامل صالح`);
        } catch (e) {
            console.warn('خطأ في تحميل التقارير الشاملة:', e);
        }
        
        // Load expenses
        try {
            const expensesSnapshot = await db.collection('expenses').get();
            expensesSnapshot.forEach(doc => {
                const data = doc.data();
                allData.expenses.push({ 
                    id: doc.id, 
                    ...data,
                    amount: parseFloat(data.amount) || parseFloat(data.cost) || 0
                });
            });
            console.log(`✅ تم تحميل ${allData.expenses.length} مصروف`);
        } catch (e) {
            console.warn('خطأ في تحميل المصاريف:', e);
        }
        
        // Check if we have any real data
        if (allData.shifts.length === 0 && allData.reports.length === 0 && allData.expenses.length === 0) {
            console.log('⚠️ لا توجد بيانات في Firebase');
            console.log('💡 تأكد من وجود بيانات في المجموعات: shifts, sales_reports, comprehensive_reports, expenses');
            // Don't create sample data automatically
        }
        
        calculateStatistics();
        createCharts();
        
        const totalItems = allData.shifts.length + allData.reports.length + allData.expenses.length;
        console.log(`✅ إجمالي البيانات المحملة: ${totalItems} عنصر`);
        
    } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
        // Don't create sample data on error - show empty state instead
        allData = { shifts: [], reports: [], expenses: [] };
        calculateStatistics();
        createCharts();
        showError('فشل في تحميل البيانات من Firebase - تحقق من الاتصال');
    } finally {
        showLoading(false);
    }
}

// Sample data creation removed - all data comes from Firebase only

// Refresh data function
window.refreshStatistics = function() {
    console.log('🔄 إعادة تحميل بيانات الإحصائيات...');
    loadAllData();
};

// Manual recalculate function for debugging
window.recalculateStats = function() {
    console.log('🧮 إعادة حساب الإحصائيات يدوياً...');
    calculateStatistics();
    createCharts();
};

// Diagnostic function to check data
window.checkStatisticsData = function() {
    console.log('🔍 فحص بيانات الإحصائيات:');
    console.log('📊 إجمالي البيانات المحملة:', {
        shifts: allData.shifts.length,
        reports: allData.reports.length,
        expenses: allData.expenses.length
    });
    
    // Check shifts data
    console.log('⏰ تفاصيل الشيفتات:');
    allData.shifts.forEach((shift, index) => {
        console.log(`  ${index + 1}. ${shift.id}: مبيعات=${shift.totalSales}, طلبات=${shift.ordersCount}`);
    });
    
    // Check reports data
    console.log('📋 تفاصيل التقارير:');
    allData.reports.forEach((report, index) => {
        console.log(`  ${index + 1}. ${report.id} (${report.type}): مبيعات=${report.totalSales}, طلبات=${report.ordersCount}`);
    });
    
    // Check expenses data
    console.log('💸 تفاصيل المصاريف:');
    allData.expenses.forEach((expense, index) => {
        console.log(`  ${index + 1}. ${expense.id}: مبلغ=${expense.amount}`);
    });
    
    // Calculate totals
    const totalSales = allData.shifts.reduce((sum, s) => sum + (parseFloat(s.totalSales) || 0), 0) +
                      allData.reports.reduce((sum, r) => sum + (parseFloat(r.totalSales) || 0), 0);
    const totalOrders = allData.shifts.reduce((sum, s) => sum + (parseInt(s.ordersCount) || 0), 0) +
                       allData.reports.reduce((sum, r) => sum + (parseInt(r.ordersCount) || 0), 0);
    const totalExpenses = allData.expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    
    console.log('📊 المجاميع الإجمالية:', {
        totalSales: totalSales,
        totalOrders: totalOrders,
        totalExpenses: totalExpenses,
        netProfit: totalSales - totalExpenses
    });
};

// Calculate statistics
function calculateStatistics() {
    const period = periodFilter?.value || 'month';
    const filteredData = filterDataByPeriod(period);
    
    console.log('📊 حساب الإحصائيات للفترة:', period);
    console.log('📋 البيانات المفلترة:', {
        shifts: filteredData.shifts.length,
        reports: filteredData.reports.length,
        expenses: filteredData.expenses.length
    });
    
    // Calculate revenue from reports
    const reportsRevenue = filteredData.reports.reduce((sum, report) => {
        const sales = parseFloat(report.totalSales) || 0;
        console.log(`💰 تقرير ${report.id}: ${sales} ج.م`);
        return sum + sales;
    }, 0);
    
    // Calculate revenue from shifts
    const shiftsRevenue = filteredData.shifts.reduce((sum, shift) => {
        const sales = parseFloat(shift.totalSales) || 0;
        console.log(`⏰ شيفت ${shift.id}: ${sales} ج.م`);
        return sum + sales;
    }, 0);
    
    const totalRevenueAmount = reportsRevenue + shiftsRevenue;
    
    // Calculate expenses
    const expenses = filteredData.expenses.reduce((sum, expense) => {
        const amount = parseFloat(expense.amount) || 0;
        return sum + amount;
    }, 0);
    
    // Calculate profit
    const profit = totalRevenueAmount - expenses;
    
    // Calculate orders from reports
    const reportsOrders = filteredData.reports.reduce((sum, report) => {
        const orders = parseInt(report.ordersCount) || 0;
        console.log(`📦 طلبات تقرير ${report.id}: ${orders}`);
        return sum + orders;
    }, 0);
    
    // Calculate orders from shifts
    const shiftsOrders = filteredData.shifts.reduce((sum, shift) => {
        const orders = parseInt(shift.ordersCount) || 0;
        console.log(`📦 طلبات شيفت ${shift.id}: ${orders}`);
        return sum + orders;
    }, 0);
    
    const totalOrdersCount = reportsOrders + shiftsOrders;
    
    console.log('📊 النتائج النهائية:', {
        totalRevenue: totalRevenueAmount,
        totalExpenses: expenses,
        netProfit: profit,
        totalOrders: totalOrdersCount,
        reportsRevenue: reportsRevenue,
        shiftsRevenue: shiftsRevenue,
        reportsOrders: reportsOrders,
        shiftsOrders: shiftsOrders
    });
    
    // Update main stats
    if (totalRevenue) totalRevenue.textContent = `${totalRevenueAmount.toLocaleString()} ج.م`;
    if (totalExpensesAmount) totalExpensesAmount.textContent = `${expenses.toLocaleString()} ج.م`;
    if (netProfit) netProfit.textContent = `${profit.toLocaleString()} ج.م`;
    if (totalOrders) totalOrders.textContent = totalOrdersCount.toLocaleString();
    
    // Calculate trends (mock calculation - you can implement real comparison)
    const revenueTrendValue = Math.random() * 20 - 10; // Random between -10 and +10
    const expensesTrendValue = Math.random() * 20 - 10;
    const profitTrendValue = Math.random() * 20 - 10;
    const ordersTrendValue = Math.random() * 20 - 10;
    
    updateTrend(revenueTrend, revenueTrendValue);
    updateTrend(expensesTrend, expensesTrendValue);
    updateTrend(profitTrend, profitTrendValue);
    updateTrend(ordersTrend, ordersTrendValue);
    
    // Calculate detailed statistics
    calculateDetailedStats(filteredData);
}

// Update trend display
function updateTrend(element, value) {
    if (!element) return;
    
    const isPositive = value >= 0;
    element.textContent = `${isPositive ? '+' : ''}${value.toFixed(1)}%`;
    element.className = `trend ${isPositive ? 'positive' : 'negative'}`;
}

// Calculate detailed statistics
function calculateDetailedStats(data) {
    // Average shift duration
    if (data.shifts.length > 0) {
        const totalDuration = data.shifts.reduce((sum, shift) => {
            if (shift.startTime && shift.endTime) {
                const start = shift.startTime.toDate ? shift.startTime.toDate() : new Date(shift.startTime);
                const end = shift.endTime.toDate ? shift.endTime.toDate() : new Date(shift.endTime);
                return sum + (end - start) / (1000 * 60 * 60); // Convert to hours
            }
            return sum;
        }, 0);
        const avgDuration = data.shifts.filter(s => s.startTime && s.endTime).length > 0 ? 
            totalDuration / data.shifts.filter(s => s.startTime && s.endTime).length : 0;
        if (avgShiftDuration) avgShiftDuration.textContent = `${avgDuration.toFixed(1)} ساعة`;
    } else {
        if (avgShiftDuration) avgShiftDuration.textContent = '0 ساعة';
    }
    
    // Busiest day
    const dayCount = {};
    data.shifts.forEach(shift => {
        const dateStr = getShiftDate(shift);
        const date = new Date(dateStr);
        const dayName = date.toLocaleDateString('ar-EG', { weekday: 'long' });
        dayCount[dayName] = (dayCount[dayName] || 0) + 1;
    });
    
    const busiestDayName = Object.keys(dayCount).length > 0 ? 
        Object.keys(dayCount).reduce((a, b) => dayCount[a] > dayCount[b] ? a : b) : 'غير محدد';
    if (busiestDay) busiestDay.textContent = busiestDayName;
    
    // Average revenue per shift
    if (data.shifts.length > 0) {
        const totalShiftRevenue = data.shifts.reduce((sum, shift) => sum + (parseFloat(shift.totalSales) || 0), 0);
        const avgRevenue = totalShiftRevenue / data.shifts.length;
        if (avgRevenuePerShift) avgRevenuePerShift.textContent = `${avgRevenue.toLocaleString()} ج.م`;
    }
    
    // Top expense category
    const categoryCount = {};
    data.expenses.forEach(expense => {
        const category = expense.category || 'other';
        categoryCount[category] = (categoryCount[category] || 0) + parseFloat(expense.amount || 0);
    });
    
    const topCategory = Object.keys(categoryCount).reduce((a, b) => categoryCount[a] > categoryCount[b] ? a : b, 'غير محدد');
    if (topExpenseCategory) topExpenseCategory.textContent = getCategoryText(topCategory);
    
    // Average daily expenses
    if (data.expenses.length > 0) {
        const totalExpenses = data.expenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
        const uniqueDays = new Set(data.expenses.map(expense => getExpenseDate(expense))).size;
        const avgDaily = uniqueDays > 0 ? totalExpenses / uniqueDays : 0;
        if (avgDailyExpenses) avgDailyExpenses.textContent = `${avgDaily.toLocaleString()} ج.م`;
    }
    
    // Expense ratio
    const totalRevenueForRatio = data.reports.reduce((sum, report) => sum + (parseFloat(report.totalSales) || 0), 0) +
                                data.shifts.reduce((sum, shift) => sum + (parseFloat(shift.totalSales) || 0), 0);
    const totalExpensesForRatio = data.expenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
    
    if (totalRevenueForRatio > 0) {
        const ratio = (totalExpensesForRatio / totalRevenueForRatio) * 100;
        if (expenseRatio) expenseRatio.textContent = `${ratio.toFixed(1)}%`;
    }
}

// Filter data by period
function filterDataByPeriod(period) {
    const now = new Date();
    let startDate;
    
    switch (period) {
        case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        default:
            startDate = new Date(0); // All time
    }
    
    return {
        shifts: allData.shifts.filter(shift => {
            const dateStr = getShiftDate(shift);
            const date = new Date(dateStr);
            return date >= startDate;
        }),
        reports: allData.reports.filter(report => {
            const dateStr = getReportDate(report);
            const date = new Date(dateStr);
            return date >= startDate;
        }),
        expenses: allData.expenses.filter(expense => {
            const dateStr = getExpenseDate(expense);
            const date = new Date(dateStr);
            return date >= startDate;
        })
    };
}

// Create charts
function createCharts() {
    createRevenueExpensesChart();
    createExpensesDistributionChart();
    createWeeklyShiftsChart();
    createSalesTrendChart();
}

// Create revenue vs expenses chart
function createRevenueExpensesChart() {
    const ctx = document.getElementById('revenueExpensesChart');
    if (!ctx) return;
    
    // Prepare data for last 7 days
    const last7Days = [];
    const revenueData = [];
    const expensesData = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        last7Days.push(date.toLocaleDateString('ar-EG', { weekday: 'short' }));
        
        // Calculate revenue for this day (from both reports and shifts)
        const dayRevenueFromReports = allData.reports
            .filter(report => getReportDate(report) === dateStr)
            .reduce((sum, report) => sum + (parseFloat(report.totalSales) || 0), 0);
            
        const dayRevenueFromShifts = allData.shifts
            .filter(shift => getShiftDate(shift) === dateStr)
            .reduce((sum, shift) => sum + (parseFloat(shift.totalSales) || 0), 0);
            
        const totalDayRevenue = dayRevenueFromReports + dayRevenueFromShifts;
        revenueData.push(totalDayRevenue);
        
        // Calculate expenses for this day
        const dayExpenses = allData.expenses
            .filter(expense => getExpenseDate(expense) === dateStr)
            .reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
        expensesData.push(dayExpenses);
    }
    
    if (charts.revenueExpenses) {
        charts.revenueExpenses.destroy();
    }
    
    charts.revenueExpenses = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last7Days,
            datasets: [{
                label: 'الإيرادات',
                data: revenueData,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4
            }, {
                label: 'المصاريف',
                data: expensesData,
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Create expenses distribution chart
function createExpensesDistributionChart() {
    const ctx = document.getElementById('expensesDistributionChart');
    if (!ctx) return;
    
    // Calculate expenses by category
    const categoryTotals = {};
    allData.expenses.forEach(expense => {
        const category = expense.category || 'other';
        categoryTotals[category] = (categoryTotals[category] || 0) + (parseFloat(expense.amount) || 0);
    });
    
    const labels = Object.keys(categoryTotals).map(cat => getCategoryText(cat));
    const data = Object.values(categoryTotals);
    const colors = [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
        '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280'
    ];
    
    if (charts.expensesDistribution) {
        charts.expensesDistribution.destroy();
    }
    
    charts.expensesDistribution = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length)
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                }
            }
        }
    });
}

// Create weekly shifts chart
function createWeeklyShiftsChart() {
    const ctx = document.getElementById('weeklyShiftsChart');
    if (!ctx) return;
    
    // Count shifts by day of week
    const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const shiftCounts = new Array(7).fill(0);
    
    allData.shifts.forEach(shift => {
        const dateStr = getShiftDate(shift);
        const date = new Date(dateStr);
        const dayIndex = date.getDay();
        shiftCounts[dayIndex]++;
    });
    
    if (charts.weeklyShifts) {
        charts.weeklyShifts.destroy();
    }
    
    charts.weeklyShifts = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dayNames,
            datasets: [{
                label: 'عدد الشيفتات',
                data: shiftCounts,
                backgroundColor: '#3b82f6',
                borderColor: '#2563eb',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Create sales trend chart
function createSalesTrendChart() {
    const ctx = document.getElementById('salesTrendChart');
    if (!ctx) return;
    
    // Prepare data for last 30 days
    const last30Days = [];
    const salesData = [];
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        last30Days.push(date.getDate().toString());
        
        // Calculate sales for this day (from both reports and shifts)
        const daySalesFromReports = allData.reports
            .filter(report => getReportDate(report) === dateStr)
            .reduce((sum, report) => sum + (parseFloat(report.totalSales) || 0), 0);
            
        const daySalesFromShifts = allData.shifts
            .filter(shift => getShiftDate(shift) === dateStr)
            .reduce((sum, shift) => sum + (parseFloat(shift.totalSales) || 0), 0);
            
        const totalDaySales = daySalesFromReports + daySalesFromShifts;
        salesData.push(totalDaySales);
    }
    
    if (charts.salesTrend) {
        charts.salesTrend.destroy();
    }
    
    charts.salesTrend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last30Days,
            datasets: [{
                label: 'المبيعات اليومية',
                data: salesData,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Refresh data
window.refreshData = async function() {
    await loadAllData();
    showSuccessMessage('تم تحديث البيانات بنجاح');
};

// Utility functions
function getReportDate(report) {
    let date;
    if (report.date) {
        date = report.date.toDate ? report.date.toDate() : new Date(report.date);
    } else if (report.createdAt) {
        date = report.createdAt.toDate ? report.createdAt.toDate() : new Date(report.createdAt);
    } else {
        date = new Date();
    }
    return date.toISOString().split('T')[0];
}

function getExpenseDate(expense) {
    let date;
    if (expense.date) {
        date = expense.date.toDate ? expense.date.toDate() : new Date(expense.date);
    } else if (expense.createdAt) {
        date = expense.createdAt.toDate ? expense.createdAt.toDate() : new Date(expense.createdAt);
    } else {
        date = new Date();
    }
    return date.toISOString().split('T')[0];
}

function getShiftDate(shift) {
    let date;
    if (shift.startTime) {
        date = shift.startTime.toDate ? shift.startTime.toDate() : new Date(shift.startTime);
    } else if (shift.date) {
        date = shift.date.toDate ? shift.date.toDate() : new Date(shift.date);
    } else if (shift.createdAt) {
        date = shift.createdAt.toDate ? shift.createdAt.toDate() : new Date(shift.createdAt);
    } else {
        date = new Date();
    }
    return date.toISOString().split('T')[0];
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

function showLoading(show = true) {
    const loadingElements = document.querySelectorAll('.loading-state, .stats-cards, .charts-grid');
    
    if (show) {
        // Show loading message
        const mainContent = document.querySelector('.page-container');
        if (mainContent) {
            const loadingHTML = `
                <div class="loading-state" style="text-align: center; padding: 60px 20px;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: var(--primary-color); margin-bottom: 20px;"></i>
                    <h3>جاري تحميل الإحصائيات...</h3>
                    <p>يتم تحميل البيانات من Firebase</p>
                </div>
            `;
            
            // Hide existing content and show loading
            const existingContent = mainContent.querySelector('.data-container');
            if (existingContent) {
                existingContent.style.display = 'none';
            }
            
            // Add loading if not exists
            let loadingDiv = mainContent.querySelector('.temp-loading');
            if (!loadingDiv) {
                loadingDiv = document.createElement('div');
                loadingDiv.className = 'temp-loading';
                loadingDiv.innerHTML = loadingHTML;
                mainContent.appendChild(loadingDiv);
            }
        }
    } else {
        // Hide loading and show content
        const mainContent = document.querySelector('.page-container');
        if (mainContent) {
            const loadingDiv = mainContent.querySelector('.temp-loading');
            if (loadingDiv) {
                loadingDiv.remove();
            }
            
            const existingContent = mainContent.querySelector('.data-container');
            if (existingContent) {
                existingContent.style.display = 'block';
            }
        }
    }
}

function showError(message) {
    console.error(message);
    
    // Show error message to user
    const mainContent = document.querySelector('.page-container');
    if (mainContent) {
        const errorHTML = `
            <div class="error-state" style="text-align: center; padding: 60px 20px; color: var(--error-color);">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px;"></i>
                <h3>خطأ في تحميل البيانات</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="loadAllData()" style="margin-top: 20px;">
                    <i class="fas fa-refresh"></i> إعادة المحاولة
                </button>
            </div>
        `;
        
        let errorDiv = mainContent.querySelector('.temp-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'temp-error';
            mainContent.appendChild(errorDiv);
        }
        errorDiv.innerHTML = errorHTML;
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
    // Period filter
    if (periodFilter) {
        periodFilter.addEventListener('change', () => {
            calculateStatistics();
            createCharts();
        });
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

// Auto refresh every 60 seconds (longer interval for statistics)
setInterval(async () => {
    if (auth.currentUser) {
        await loadAllData();
        console.log('🔄 تم تحديث بيانات الإحصائيات تلقائياً');
    }
}, 60000);
