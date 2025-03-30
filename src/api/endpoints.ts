import { QueryParser } from '../core/query';
import { SchemaRegistry, SchemaValidator } from '../core/schema';
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

  // Obtener esquemas
  router.get('/_schemas', async () => {
    const schemas = SchemaRegistry.getInstance().getAllSchemas();
    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: schemas
    };
  });

  // Obtener esquema de una colección
  router.get('/_schemas/:collection', async (req: Request): Promise<Response> => {
    const { collection } = req.params;
    const schema = SchemaRegistry.getInstance().getSchema(collection);
    
    if (!schema) {
      return {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
        body: { error: `No se encontró esquema para la colección ${collection}` }
      };
    }
    
    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: schema
    };
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
    const parsedId = isNaN(+id) ? id : +id;
    const expand = req.query._expand === 'true' || req.query._expand === '1';
    const expandDepth = parseInt(req.query._expandDepth || '1', 10);
    
    // Obtener el elemento
    const item = db.getById(collection, parsedId);

    if (!item) {
      return {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
        body: { error: `No se encontró el elemento con ID ${id}` }
      };
    }

    // Expandir relaciones si se solicita
    let result = item;
    if (expand) {
      const relationManager = SchemaRegistry.getInstance().getRelationManager();
      if (relationManager) {
        result = await relationManager.expandRelations(collection, item, expandDepth);
      }
    }

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: result
    };
  });

  // Crear un nuevo elemento
  router.post('/:collection', async (req: Request): Promise<Response> => {
    const { collection } = req.params;

    if (!req.body || typeof req.body !== 'object') {
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: { error: 'Cuerpo de la solicitud inválido' }
      };
    }

    // Validar con esquema si existe
    const schema = SchemaRegistry.getInstance().getSchema(collection);
    if (schema) {
      // Aplicar transformaciones y valores por defecto
      const transformedData = SchemaValidator.transform(req.body, schema, true);
      
      // Validar datos
      const validationResult = SchemaValidator.validate(transformedData, schema);
      
      if (!validationResult.valid) {
        return {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
          body: { 
            error: 'Error de validación',
            details: validationResult.errors
          }
        };
      }
      
      // Usar datos transformados
      const newItem = await db.add(collection, transformedData);
      
      return {
        status: 201,
        headers: { 
          'Content-Type': 'application/json',
          'Location': `/${collection}/${newItem.id}`
        },
        body: newItem
      };
    }

    // Si no hay esquema, continuar sin validación
    const newItem = await db.add(collection, req.body);
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
  router.put('/:collection/:id', async (req: Request): Promise<Response> => {
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

    // Validar con esquema si existe
    const schema = SchemaRegistry.getInstance().getSchema(collection);
    if (schema) {
      // Asegurar que el ID no cambie
      const dataWithId = { ...req.body, id: parsedId };
      
      // Aplicar transformaciones (no es un nuevo objeto)
      const transformedData = SchemaValidator.transform(dataWithId, schema, false);
      
      // Validar datos
      const validationResult = SchemaValidator.validate(transformedData, schema);
      
      if (!validationResult.valid) {
        return {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
          body: { 
            error: 'Error de validación',
            details: validationResult.errors
          }
        };
      }
      
      // Si el ID cambió, verificar integridad referencial
      if (req.body.id !== undefined && req.body.id !== parsedId) {
        const relationManager = SchemaRegistry.getInstance().getRelationManager();
        if (relationManager) {
          // Procesar actualizaciones en cascada
          await relationManager.processCascadeUpdate(collection, parsedId, req.body.id);
        }
      }
      
      // Usar datos transformados
      const updatedItem = await db.update(collection, parsedId, transformedData);
      
      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: updatedItem
      };
    }

    // Si no hay esquema, continuar sin validación
    const updatedItem = await db.update(collection, parsedId, req.body);

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: updatedItem
    };
  });

  // Actualizar parcialmente un elemento
  router.patch('/:collection/:id', async (req: Request): Promise<Response> => {
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

    // Validar con esquema si existe
    const schema = SchemaRegistry.getInstance().getSchema(collection);
    if (schema) {
      // Combinar objeto existente con cambios
      const combinedData = { ...item, ...req.body };
      
      // Asegurar que el ID no cambie
      combinedData.id = parsedId;
      
      // Aplicar transformaciones (no es un nuevo objeto)
      const transformedData = SchemaValidator.transform(combinedData, schema, false);
      
      // Validar datos (parcial)
      const validationResult = SchemaValidator.validate(transformedData, schema, true);
      
      if (!validationResult.valid) {
        return {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
          body: { 
            error: 'Error de validación',
            details: validationResult.errors
          }
        };
      }
      
      // Si el ID cambió, verificar integridad referencial
      if (req.body.id !== undefined && req.body.id !== parsedId) {
        const relationManager = SchemaRegistry.getInstance().getRelationManager();
        if (relationManager) {
          // Procesar actualizaciones en cascada
          await relationManager.processCascadeUpdate(collection, parsedId, req.body.id);
        }
      }
      
      // Usar datos transformados - solo actualizar los campos enviados
      const updatedItem = await db.update(collection, parsedId, req.body);
      
      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: updatedItem
      };
    }

    // Si no hay esquema, continuar sin validación
    const updatedItem = await db.update(collection, parsedId, req.body);

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: updatedItem
    };
  });

  // Eliminar un elemento
  router.delete('/:collection/:id', async (req: Request): Promise<Response> => {
    const { collection, id } = req.params;
    const parsedId = isNaN(+id) ? id : +id;
    
    // Verificar integridad referencial
    const relationManager = SchemaRegistry.getInstance().getRelationManager();
    if (relationManager) {
      // Verificar si se puede eliminar
      const canDelete = await relationManager.canDelete(collection, parsedId);
      
      if (!canDelete) {
        return {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
          body: { error: `No se puede eliminar el elemento porque está siendo referenciado` }
        };
      }
      
      // Procesar eliminaciones en cascada
      await relationManager.processCascadeDelete(collection, parsedId);
    }
    
    // Eliminar el elemento
    const success = await db.remove(collection, parsedId);

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
