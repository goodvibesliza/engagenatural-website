/* eslint-env serviceworker */
// Minimal background handler for FCM push events
self.addEventListener('push', (event) => {
  try {
    const data = event.data ? event.data.json() : {};
    const notif = data.notification || {};
    const title = notif.title || 'Update';
    const options = {
      body: notif.body || '',
      icon: notif.icon || '/icons/icon-192.png',
      data: { click_action: (notif.click_action || '/') },
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch {
    // no-op: swallow unexpected payload errors
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification?.data && event.notification.data.click_action) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
