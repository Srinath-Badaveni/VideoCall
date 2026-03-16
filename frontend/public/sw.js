/* public/sw.js — Service Worker for Web Push Notifications
 * Receives push events from the server and shows OS-level notifications.
 * Also handles notification clicks to navigate the user to the right page.
 */

self.addEventListener("push", (event) => {
    let data = {};
    try {
        data = event.data?.json() || {};
    } catch {
        data = { title: "New notification", body: event.data?.text() || "" };
    }

    const { title = "VideoCaller Pro", body = "", url = "/chat" } = data;

    event.waitUntil(
        self.registration.showNotification(title, {
            body,
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            tag: "vidcall-push",       // replaces previous identical notification
            renotify: true,
            data: { url },
            vibrate: [200, 100, 200],
        })
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const targetUrl = event.notification.data?.url || "/chat";

    event.waitUntil(
        clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((clientList) => {
                // If a tab is already open, focus it
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && "focus" in client) {
                        client.navigate(targetUrl);
                        return client.focus();
                    }
                }
                // Otherwise open a new tab
                if (clients.openWindow) return clients.openWindow(targetUrl);
            })
    );
});
