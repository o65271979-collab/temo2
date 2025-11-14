// Service Worker for Push Notifications
const CACHE_NAME = 'temo-notifications-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/shifts.html',
    '/reports.html',
    '/statistics.html',
    '/settings.html',
    '/styles-pro.css',
    '/notifications.js'
];

// Install event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Cache opened');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                return response || fetch(event.request);
            })
    );
});

// Push event for notifications
self.addEventListener('push', (event) => {
    console.log('Push event received:', event);
    
    let notificationData = {
        title: 'إشعار جديد من Temo',
        body: 'لديك إشعار جديد',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'temo-notification',
        requireInteraction: true,
        actions: [
            {
                action: 'view',
                title: 'عرض',
                icon: '/favicon.ico'
            },
            {
                action: 'dismiss',
                title: 'إغلاق'
            }
        ],
        data: {
            url: '/',
            timestamp: Date.now()
        }
    };

    // Parse push data if available
    if (event.data) {
        try {
            const pushData = event.data.json();
            notificationData = { ...notificationData, ...pushData };
        } catch (e) {
            console.warn('Could not parse push data:', e);
        }
    }

    event.waitUntil(
        self.registration.showNotification(notificationData.title, notificationData)
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event);
    
    event.notification.close();
    
    const action = event.action;
    const notificationData = event.notification.data || {};
    
    if (action === 'dismiss') {
        return;
    }
    
    // Default action or 'view' action
    const urlToOpen = notificationData.url || '/';
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if app is already open
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.focus();
                        client.navigate(urlToOpen);
                        return;
                    }
                }
                
                // Open new window if app is not open
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Background sync for offline notifications
self.addEventListener('sync', (event) => {
    console.log('Background sync:', event.tag);
    
    if (event.tag === 'background-sync-notifications') {
        event.waitUntil(
            // Sync notifications when back online
            syncNotifications()
        );
    }
});

async function syncNotifications() {
    try {
        // This would sync with your backend/Firebase when back online
        console.log('Syncing notifications...');
        
        // You can implement your sync logic here
        // For example, fetch missed notifications from Firebase
        
    } catch (error) {
        console.error('Error syncing notifications:', error);
    }
}

// Message event for communication with main thread
self.addEventListener('message', (event) => {
    console.log('Service Worker received message:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        const notificationData = event.data.notification;
        self.registration.showNotification(notificationData.title, notificationData);
    }
});

// Activate event
self.addEventListener('activate', (event) => {
    console.log('Service Worker activated');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Clearing old cache');
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    // Claim all clients
    return self.clients.claim();
});
