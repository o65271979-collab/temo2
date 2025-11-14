// Notifications System
class NotificationManager {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.isInitialized = false;
        this.audioContext = null;
        this.notificationSound = null;
        
        this.init();
    }

    async init() {
        try {
            // Register service worker for push notifications
            await this.registerServiceWorker();
            
            // Request notification permission
            if ('Notification' in window) {
                const permission = await Notification.requestPermission();
                console.log('Notification permission:', permission);
            }

            // Initialize audio context for mobile
            this.initAudio();
            
            // Create notification UI
            this.createNotificationUI();
            
            // Load existing notifications
            this.loadNotifications();
            
            // Setup Firebase listeners
            this.setupFirebaseListeners();
            
            this.isInitialized = true;
            console.log('✅ Notification system initialized');
            
        } catch (error) {
            console.error('❌ Error initializing notifications:', error);
        }
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered:', registration);
                
                // Update service worker if needed
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New service worker available
                            console.log('New service worker available');
                        }
                    });
                });
                
                this.serviceWorkerRegistration = registration;
                
            } catch (error) {
                console.warn('Service Worker registration failed:', error);
            }
        }
    }

    initAudio() {
        try {
            // Create audio context for mobile compatibility
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create notification sound using Web Audio API
            this.createNotificationSound();
            
        } catch (error) {
            console.warn('Audio context not supported:', error);
        }
    }

    createNotificationSound() {
        // Create a simple notification beep sound
        const createBeep = (frequency = 800, duration = 200) => {
            if (!this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration / 1000);
        };
        
        this.notificationSound = createBeep;
    }

    createNotificationUI() {
        // Create notification bell icon
        const notificationHTML = `
            <div id="notificationContainer" class="notification-container">
                <div id="notificationBell" class="notification-bell" onclick="toggleNotifications()">
                    <i class="fas fa-bell"></i>
                    <span id="notificationBadge" class="notification-badge" style="display: none;">0</span>
                </div>
                
                <div id="notificationDropdown" class="notification-dropdown" style="display: none;">
                    <div class="notification-header">
                        <h4>الإشعارات</h4>
                        <button onclick="markAllAsRead()" class="mark-all-read">
                            <i class="fas fa-check-double"></i> تحديد الكل كمقروء
                        </button>
                    </div>
                    
                    <div id="notificationsList" class="notifications-list">
                        <div class="no-notifications">
                            <i class="fas fa-bell-slash"></i>
                            <p>لا توجد إشعارات</p>
                        </div>
                    </div>
                    
                    <div class="notification-footer">
                        <button onclick="clearAllNotifications()" class="clear-all">
                            <i class="fas fa-trash"></i> مسح جميع الإشعارات
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add to header
        const header = document.querySelector('.header-actions') || document.querySelector('header') || document.body;
        if (header) {
            header.insertAdjacentHTML('beforeend', notificationHTML);
        }
    }

    setupFirebaseListeners() {
        if (!window.db) {
            console.warn('Firebase not initialized for notifications');
            return;
        }

        // Listen for new shifts
        db.collection('shifts').onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const shift = { id: change.doc.id, ...change.doc.data() };
                    this.addNotification({
                        type: 'shift',
                        title: 'شيفت جديد',
                        message: `تم إضافة شيفت جديد - ${this.formatDate(shift.startTime)}`,
                        data: shift,
                        timestamp: new Date()
                    });
                }
            });
        });

        // Listen for new sales reports
        db.collection('sales_reports').onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const report = { id: change.doc.id, ...change.doc.data() };
                    this.addNotification({
                        type: 'sales_report',
                        title: 'تقرير مبيعات جديد',
                        message: `تم إنشاء تقرير مبيعات - ${report.totalSales?.toLocaleString()} ج.م`,
                        data: report,
                        timestamp: new Date()
                    });
                }
            });
        });

        // Listen for new expenses
        db.collection('expenses').onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const expense = { id: change.doc.id, ...change.doc.data() };
                    this.addNotification({
                        type: 'expense',
                        title: 'مصروف جديد',
                        message: `تم إضافة مصروف - ${expense.amount?.toLocaleString()} ج.م`,
                        data: expense,
                        timestamp: new Date()
                    });
                }
            });
        });

        // Listen for comprehensive reports
        db.collection('comprehensive_reports').onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const report = { id: change.doc.id, ...change.doc.data() };
                    this.addNotification({
                        type: 'comprehensive_report',
                        title: 'تقرير شامل جديد',
                        message: `تم إنشاء تقرير شامل - صافي الربح: ${report.netProfit?.toLocaleString()} ج.م`,
                        data: report,
                        timestamp: new Date()
                    });
                }
            });
        });
    }

    addNotification(notification) {
        // Add unique ID and read status
        notification.id = Date.now() + Math.random();
        notification.read = false;
        
        // Add to notifications array
        this.notifications.unshift(notification);
        
        // Limit notifications to 50
        if (this.notifications.length > 50) {
            this.notifications = this.notifications.slice(0, 50);
        }
        
        // Update unread count
        this.unreadCount++;
        
        // Update UI
        this.updateNotificationUI();
        
        // Play sound
        this.playNotificationSound();
        
        // Show browser notification
        this.showBrowserNotification(notification);
        
        // Save to localStorage
        this.saveNotifications();
        
        console.log('📢 New notification:', notification.title);
    }

    playNotificationSound() {
        try {
            // Resume audio context if suspended (mobile requirement)
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            // Play notification sound
            if (this.notificationSound) {
                this.notificationSound(800, 200); // First beep
                setTimeout(() => this.notificationSound(1000, 150), 250); // Second beep
            }
            
            // Vibrate on mobile if supported
            if ('vibrate' in navigator) {
                navigator.vibrate([200, 100, 200]);
            }
            
        } catch (error) {
            console.warn('Could not play notification sound:', error);
        }
    }

    showBrowserNotification(notification) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const browserNotification = new Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: notification.type,
                requireInteraction: true,
                silent: false
            });

            // Auto close after 5 seconds
            setTimeout(() => {
                browserNotification.close();
            }, 5000);

            // Handle click
            browserNotification.onclick = () => {
                window.focus();
                this.markAsRead(notification.id);
                browserNotification.close();
            };
        }
    }

    updateNotificationUI() {
        const badge = document.getElementById('notificationBadge');
        const bell = document.getElementById('notificationBell');
        const list = document.getElementById('notificationsList');

        // Update badge
        if (badge) {
            if (this.unreadCount > 0) {
                badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
                badge.style.display = 'block';
                bell?.classList.add('has-notifications');
            } else {
                badge.style.display = 'none';
                bell?.classList.remove('has-notifications');
            }
        }

        // Update notifications list
        if (list) {
            if (this.notifications.length === 0) {
                list.innerHTML = `
                    <div class="no-notifications">
                        <i class="fas fa-bell-slash"></i>
                        <p>لا توجد إشعارات</p>
                    </div>
                `;
            } else {
                list.innerHTML = this.notifications.map(notification => `
                    <div class="notification-item ${notification.read ? 'read' : 'unread'}" 
                         onclick="markAsRead('${notification.id}')" 
                         data-id="${notification.id}">
                        <div class="notification-icon">
                            <i class="fas ${this.getNotificationIcon(notification.type)}"></i>
                        </div>
                        <div class="notification-content">
                            <div class="notification-title">${notification.title}</div>
                            <div class="notification-message">${notification.message}</div>
                            <div class="notification-time">${this.formatTime(notification.timestamp)}</div>
                        </div>
                        ${!notification.read ? '<div class="unread-dot"></div>' : ''}
                    </div>
                `).join('');
            }
        }
    }

    getNotificationIcon(type) {
        const icons = {
            'shift': 'fa-clock',
            'sales_report': 'fa-chart-line',
            'expense': 'fa-money-bill-wave',
            'comprehensive_report': 'fa-chart-bar',
            'system': 'fa-cog',
            'warning': 'fa-exclamation-triangle',
            'success': 'fa-check-circle',
            'error': 'fa-times-circle'
        };
        return icons[type] || 'fa-bell';
    }

    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id == notificationId);
        if (notification && !notification.read) {
            notification.read = true;
            this.unreadCount = Math.max(0, this.unreadCount - 1);
            this.updateNotificationUI();
            this.saveNotifications();
        }
    }

    markAllAsRead() {
        this.notifications.forEach(notification => {
            notification.read = true;
        });
        this.unreadCount = 0;
        this.updateNotificationUI();
        this.saveNotifications();
    }

    clearAllNotifications() {
        if (confirm('هل أنت متأكد من حذف جميع الإشعارات؟')) {
            this.notifications = [];
            this.unreadCount = 0;
            this.updateNotificationUI();
            this.saveNotifications();
        }
    }

    saveNotifications() {
        try {
            localStorage.setItem('temo_notifications', JSON.stringify(this.notifications));
            localStorage.setItem('temo_unread_count', this.unreadCount.toString());
        } catch (error) {
            console.warn('Could not save notifications:', error);
        }
    }

    loadNotifications() {
        try {
            const saved = localStorage.getItem('temo_notifications');
            const savedCount = localStorage.getItem('temo_unread_count');
            
            if (saved) {
                this.notifications = JSON.parse(saved);
                this.notifications.forEach(notification => {
                    notification.timestamp = new Date(notification.timestamp);
                });
            }
            
            if (savedCount) {
                this.unreadCount = parseInt(savedCount) || 0;
            }
            
            this.updateNotificationUI();
            
        } catch (error) {
            console.warn('Could not load notifications:', error);
        }
    }

    formatDate(date) {
        if (!date) return '';
        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toLocaleDateString('ar-EG');
    }

    formatTime(date) {
        if (!date) return '';
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;
        
        if (diff < 60000) return 'الآن';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} دقيقة`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} ساعة`;
        return d.toLocaleDateString('ar-EG');
    }

    // Public methods for manual notifications
    showSuccess(message, title = 'نجح العملية') {
        this.addNotification({
            type: 'success',
            title,
            message,
            timestamp: new Date()
        });
    }

    showError(message, title = 'خطأ') {
        this.addNotification({
            type: 'error',
            title,
            message,
            timestamp: new Date()
        });
    }

    showWarning(message, title = 'تحذير') {
        this.addNotification({
            type: 'warning',
            title,
            message,
            timestamp: new Date()
        });
    }

    showInfo(message, title = 'معلومات') {
        this.addNotification({
            type: 'system',
            title,
            message,
            timestamp: new Date()
        });
    }

    // Test notification function - only for manual testing
    sendTestNotification() {
        console.log('📢 إرسال إشعار تجريبي يدوي');
        this.addNotification({
            type: 'system',
            title: 'إشعار تجريبي',
            message: 'هذا إشعار تجريبي يدوي - لن يتم إرساله تلقائياً',
            timestamp: new Date()
        });
    }
}

// Global functions for UI interaction
function toggleNotifications() {
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
        const isVisible = dropdown.style.display !== 'none';
        dropdown.style.display = isVisible ? 'none' : 'block';
        
        // Close when clicking outside
        if (!isVisible) {
            setTimeout(() => {
                document.addEventListener('click', closeNotificationsOnOutsideClick, { once: true });
            }, 100);
        }
    }
}

function closeNotificationsOnOutsideClick(event) {
    const container = document.getElementById('notificationContainer');
    if (container && !container.contains(event.target)) {
        document.getElementById('notificationDropdown').style.display = 'none';
    }
}

function markAsRead(notificationId) {
    if (window.notificationManager) {
        window.notificationManager.markAsRead(notificationId);
    }
}

function markAllAsRead() {
    if (window.notificationManager) {
        window.notificationManager.markAllAsRead();
    }
}

function clearAllNotifications() {
    if (window.notificationManager) {
        window.notificationManager.clearAllNotifications();
    }
}

function sendTestNotification() {
    if (window.notificationManager) {
        window.notificationManager.sendTestNotification();
    }
}

// Initialize notification manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for Firebase to be initialized
    setTimeout(() => {
        window.notificationManager = new NotificationManager();
    }, 1000);
});

// Enable audio on user interaction (required for mobile)
document.addEventListener('click', () => {
    if (window.notificationManager && window.notificationManager.audioContext) {
        window.notificationManager.audioContext.resume();
    }
}, { once: true });
