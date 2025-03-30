import { QueryParser } from '../core/query';
import { Server } from '../core/server';
import { Request, Response } from '../core/types';

export function registerApiEndpoints(server: Server): void {
  const router = server.getRouter();
  const db = server.getDb();

  // Listar todas las colecciones
  router.get('/', async (_req: Request): Promise<Response> => {
    const collections = db.getCollections();
    return Promise.resolve({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: { collections },
    });
  });

  // Obtener todos los elementos de una colección
  router.get('/:collection', async (req: Request): Promise<Response> => {
    const { collection } = req.params;
    
    // Parsear opciones de consulta desde los parámetros URL
    const queryOptions = QueryParser.parseQueryParams(req.query);
    
    // Ejecutar consulta
    const result = db.query(collection, queryOptions);
    
    // Preparar encabezados con metadatos de paginación
    const headers: Record<string, string> = { 
      'Content-Type': 'application/json' 
    };
    
    // Agregar encabezados de paginación si corresponde
    if (result.pagination) {
      headers['X-Total-Count'] = String(result.pagination.total);
      
      if (result.pagination.currentPage !== undefined) {
        headers['X-Page'] = String(result.pagination.currentPage);
      }
      
      if (result.pagination.pageCount !== undefined) {
        headers['X-Total-Pages'] = String(result.pagination.pageCount);
      }
      
      if (result.pagination.nextCursor !== undefined) {
        headers['X-Next-Cursor'] = result.pagination.nextCursor;
      }
      
      headers['X-Has-More'] = String(result.pagination.hasMore);
    }
    
    return {
      status: 200,
      headers,
      body: result.data
    };
  });

  // Obtener un elemento por ID
  router.get('/:collection/:id', async (req: Request): Promise<Response> => {
    const { collection, id } = req.params;
    const item = db.getById(collection, isNaN(+id) ? id : +id);

    if (!item) {
      return {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
        body: { error: `No se encontró el elemento con ID ${id}` },
      };
    }

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: item,
    };
  });

  // Crear un nuevo elemento
  router.post('/:collection', async (req: Request): Promise<Response> => {
    const { collection } = req.params;

    if (!req.body || typeof req.body !== 'object') {
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: { error: 'Cuerpo de la solicitud inválido' },
      };
    }

    const newItem = await db.add(collection, req.body);
    return {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        Location: `/${collection}/${newItem.id}`,
      },
      body: newItem,
    };
  });

  // Actualizar un elemento
  router.put('/:collection/:id', async (req: Request): Promise<Response> => {
    const { collection, id } = req.params;

    if (!req.body || typeof req.body !== 'object') {
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: { error: 'Cuerpo de la solicitud inválido' },
      };
    }

    const parsedId = isNaN(+id) ? id : +id;
    const item = db.getById(collection, parsedId);

    if (!item) {
      return {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
        body: { error: `No se encontró el elemento con ID ${id}` },
      };
    }

    const updatedItem = db.update(collection, parsedId, req.body);

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: updatedItem,
    };
  });

  // Actualizar parcialmente un elemento
  router.patch('/:collection/:id', async (req: Request): Promise<Response> => {
    const { collection, id } = req.params;

    if (!req.body || typeof req.body !== 'object') {
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: { error: 'Cuerpo de la solicitud inválido' },
      };
    }

    const parsedId = isNaN(+id) ? id : +id;
    const item = db.getById(collection, parsedId);

    if (!item) {
      return {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
        body: { error: `No se encontró el elemento con ID ${id}` },
      };
    }

    const updatedItem = db.update(collection, parsedId, req.body);

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: updatedItem,
    };
  });

  // Eliminar un elemento
  router.delete('/:collection/:id', async (req: Request): Promise<Response> => {
    const { collection, id } = req.params;
    const parsedId = isNaN(+id) ? id : +id;

    const success = db.remove(collection, parsedId);

    if (!success) {
      return {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
        body: { error: `No se encontró el elemento con ID ${id}` },
      };
    }

    return {
      status: 204,
      headers: { 'Content-Type': 'application/json' },
      body: null,
    };
  });
}
