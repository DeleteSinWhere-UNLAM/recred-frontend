importScripts('https://www.gstatic.com/firebasejs/12.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.14.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDWbTInV5C6tKaExo0lXWTxuSC31JD3JDE',
  authDomain: 'recred-4aec7.firebaseapp.com',
  projectId: 'recred-4aec7',
  storageBucket: 'recred-4aec7.firebasestorage.app',
  messagingSenderId: '679990541106',
  appId: '1:679990541106:web:00d82d48cd939063c7352b'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});