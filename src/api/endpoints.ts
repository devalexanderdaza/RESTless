import { Server } from '../core/server';
import { Request, Response } from '../core/types';

export function registerApiEndpoints(server: Server): void {
  const router = server.getRouter();
  const db = server.getDb();

  // Listar todas las colecciones
  router.get('/', async () => {
    const collections = db.getCollections();
    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: { collections }
    };
  });

  // Obtener todos los elementos de una colección
  router.get('/:collection', async (req: Request) => {
    const { collection } = req.params;
    const data = db.getAll(collection);

    // Aplicar filtros si hay query params
    const filteredData = Object.keys(req.query).length 
      ? data.filter(item => {
          return Object.entries(req.query).every(([key, value]) => {
            return String(item[key]) === String(value);
          });
        })
      : data;

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: filteredData
    };
  });

  // Obtener un elemento por ID
  router.get('/:collection/:id', async (req: Request) => {
    const { collection, id } = req.params;
    const item = db.getById(collection, isNaN(+id) ? id : +id);

    if (!item) {
      return {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
        body: { error: `No se encontró el elemento con ID ${id}` }
      };
    }

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: item
    };
  });

  // Crear un nuevo elemento
  router.post('/:collection', async (req: Request) => {
    const { collection } = req.params;
    
    if (!req.body || typeof req.body !== 'object') {
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: { error: 'Cuerpo de la solicitud inválido' }
      };
    }

    const newItem = db.add(collection, req.body);

    return {
      status: 201,
      headers: { 
        'Content-Type': 'application/json',
        'Location': `/${collection}/${newItem.id}`
      },
      body: newItem
    };
  });

  // Actualizar un elemento
  router.put('/:collection/:id', async (req: Request) => {
    const { collection, id } = req.params;
    
    if (!req.body || typeof req.body !== 'object') {
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: { error: 'Cuerpo de la solicitud inválido' }
      };
    }

    const parsedId = isNaN(+id) ? id : +id;
    const item = db.getById(collection, parsedId);

    if (!item) {
      return {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
        body: { error: `No se encontró el elemento con ID ${id}` }
      };
    }

    const updatedItem = db.update(collection, parsedId, req.body);

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: updatedItem
    };
  });

  // Actualizar parcialmente un elemento
  router.patch('/:collection/:id', async (req: Request) => {
    const { collection, id } = req.params;
    
    if (!req.body || typeof req.body !== 'object') {
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: { error: 'Cuerpo de la solicitud inválido' }
      };
    }

    const parsedId = isNaN(+id) ? id : +id;
    const item = db.getById(collection, parsedId);

    if (!item) {
      return {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
        body: { error: `No se encontró el elemento con ID ${id}` }
      };
    }

    const updatedItem = db.update(collection, parsedId, req.body);

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: updatedItem
    };
  });

  // Eliminar un elemento
  router.delete('/:collection/:id', async (req: Request) => {
    const { collection, id } = req.params;
    const parsedId = isNaN(+id) ? id : +id;
    
    const success = db.remove(collection, parsedId);

    if (!success) {
      return {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
        body: { error: `No se encontró el elemento con ID ${id}` }
      };
    }

    return {
      status: 204,
      headers: { 'Content-Type': 'application/json' },
      body: null
    };
  });
}