import { Middleware } from '../core/types';

// Middleware para registro de solicitudes
export const loggerMiddleware: Middleware = async (req, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);

  const start = Date.now();
  const response = await next(req);
  const duration = Date.now() - start;

  console.log(`${new Date().toISOString()} | ${response.status} | ${duration}ms`);

  return response;
};

// Middleware para manejo de errores
export const errorHandlerMiddleware: Middleware = async (req, next) => {
  try {
    return await next(req);
  } catch (error) {
    console.error('Error en la solicitud:', error);
    return {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido',
      },
    };
  }
};

// Middleware para simular latencia de red
export const delayMiddleware: Middleware = async (req, next) => {
  const delay = Math.floor(Math.random() * 200) + 100; // 100-300ms
  await new Promise((resolve) => setTimeout(resolve, delay));
  return next(req);
};
