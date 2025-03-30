import { Server } from './core/server';
import { registerApiEndpoints } from './api/endpoints';
import { errorHandlerMiddleware, loggerMiddleware, delayMiddleware } from './api/middlewares';
import { App } from './';

// Datos iniciales de ejemplo
const initialData = {
  "usuarios": [
    { "id": 1, "nombre": "Juan Pérez", "email": "juan@example.com", "rol": "admin" },
    { "id": 2, "nombre": "Ana García", "email": "ana@example.com", "rol": "usuario" }
  ],
  "productos": [
    { "id": 1, "nombre": "Laptop", "precio": 1200, "stock": 10 },
    { "id": 2, "nombre": "Smartphone", "precio": 800, "stock": 15 },
    { "id": 3, "nombre": "Tablet", "precio": 350, "stock": 8 }
  ],
  "pedidos": [
    { 
      "id": 1, 
      "usuarioId": 2, 
      "fecha": "2023-09-15", 
      "total": 1550,
      "items": [
        { "productoId": 1, "cantidad": 1, "precioUnitario": 1200 },
        { "productoId": 3, "cantidad": 1, "precioUnitario": 350 }
      ]
    }
  ]
};

// Función principal para inicializar la aplicación
async function init() {
  try {
    // Crear e inicializar el servidor con configuración personalizada
    const server = new Server({
      baseUrl: '/api',
      storageType: 'indexedDB', // Por defecto usar localStorage
      storageKey: 'restless-db'
    });
    
    // Registrar middlewares
    const router = server.getRouter();
    router.use(errorHandlerMiddleware);
    router.use(loggerMiddleware);
    router.use(delayMiddleware);
    
    // Registrar endpoints
    registerApiEndpoints(server);
    
    // Inicializar con datos
    await server.initialize(initialData);
    
    // Inicializar la UI
    new App(server);
    
    console.log('RESTless inicializado correctamente');
    
    // Eliminar mensaje de carga
    const loadingElement = document.querySelector('.loading');
    if (loadingElement && loadingElement.parentNode) {
      loadingElement.parentNode.removeChild(loadingElement);
    }
  } catch (error) {
    console.error('Error al inicializar la aplicación:', error);
    const loadingElement = document.querySelector('.loading');
    if (loadingElement) {
      loadingElement.textContent = 'Error al cargar la aplicación. Consulta la consola para más detalles.';
    }
  }
}

// Iniciar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);