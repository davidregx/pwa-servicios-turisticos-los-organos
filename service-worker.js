const CACHE_NAME = 'los-organos-v1.0.0';
const urlsToCache = [
  './',
  './index.html',
  './movilidad.html',
  './restaurantes.html',
  './tours.html',
  './tienda.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './icons/logo.png'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Archivos en caché');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Error al cachear archivos:', error);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker: Activando...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Eliminando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar peticiones de red
self.addEventListener('fetch', event => {
  // Solo manejar peticiones GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignorar peticiones a WhatsApp y otros dominios externos
  if (event.request.url.includes('wa.me') || 
      event.request.url.includes('whatsapp.com') ||
      event.request.url.includes('api.') ||
      event.request.url.includes('googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si está en caché, devolver la versión cacheada
        if (response) {
          return response;
        }

        // Si no está en caché, hacer petición de red
        return fetch(event.request)
          .then(response => {
            // Verificar si la respuesta es válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonar la respuesta
            const responseToCache = response.clone();

            // Agregar al caché
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            console.log('Error en petición de red:', error);
            
            // Si es una página HTML y no hay conexión, mostrar página offline
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
            
            // Para otros recursos, intentar devolver desde caché
            return caches.match(event.request);
          });
      })
  );
});

// Manejar mensajes del cliente
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Sincronización en segundo plano
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Sincronización en segundo plano');
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Aquí puedes implementar lógica para sincronizar datos
  // cuando la conexión se restaure
  return Promise.resolve();
}

// Notificaciones push (para futuras implementaciones)
self.addEventListener('push', event => {
  console.log('Service Worker: Notificación push recibida');
  
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación de Los Órganos',
    icon: './icons/icon-192x192.png',
    badge: './icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver más',
        icon: './icons/icon-96x96.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: './icons/icon-96x96.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Servicios Turísticos Los Órganos', options)
  );
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Click en notificación');
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('./')
    );
  } else if (event.action === 'close') {
    // No hacer nada, solo cerrar
  } else {
    // Click en el cuerpo de la notificación
    event.waitUntil(
      clients.openWindow('./')
    );
  }
});

// Manejar errores
self.addEventListener('error', event => {
  console.error('Service Worker: Error:', event.error);
});

// Manejar errores no capturados
self.addEventListener('unhandledrejection', event => {
  console.error('Service Worker: Promise rechazada:', event.reason);
});

// Función para limpiar caché antigua
function cleanupCache() {
  return caches.keys().then(cacheNames => {
    return Promise.all(
      cacheNames.map(cacheName => {
        if (cacheName.startsWith('los-organos-') && cacheName !== CACHE_NAME) {
          console.log('Eliminando caché antigua:', cacheName);
          return caches.delete(cacheName);
        }
      })
    );
  });
}

// Ejecutar limpieza de caché al activar
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      cleanupCache(),
      self.clients.claim()
    ])
  );
});

console.log('Service Worker: Cargado correctamente');
