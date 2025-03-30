import { Database } from '../db';
import { SchemaDefinition, Relation, ReferenceAction } from './types';

/**
 * Gestor de relaciones entre colecciones
 */
export class RelationManager {
  private db: Database;
  private schemas: Map<string, SchemaDefinition>;

  constructor(db: Database) {
    this.db = db;
    this.schemas = new Map();
  }

  /**
   * Registra un esquema para una colección
   */
  public registerSchema(schema: SchemaDefinition): void {
    this.schemas.set(schema.name, schema);
  }

  /**
   * Obtiene un esquema registrado
   */
  public getSchema(collectionName: string): SchemaDefinition | undefined {
    return this.schemas.get(collectionName);
  }

  /**
   * Obtiene todos los esquemas registrados
   */
  public getAllSchemas(): SchemaDefinition[] {
    return Array.from(this.schemas.values());
  }

  /**
   * Encuentra las relaciones para una colección
   */
  public findRelationsForCollection(collectionName: string): { field: string; relation: Relation }[] {
    const schema = this.schemas.get(collectionName);
    if (!schema) return [];

    const relations: { field: string; relation: Relation }[] = [];

    Object.entries(schema.fields).forEach(([fieldName, fieldDef]) => {
      if (fieldDef.relation) {
        relations.push({
          field: fieldName,
          relation: fieldDef.relation
        });
      }
    });

    return relations;
  }

  /**
   * Encuentra referencias a una colección específica
   * @returns Array de objetos con colección, campo y relación
   */
  public findReferencesToCollection(collectionName: string): { 
    collection: string; 
    field: string; 
    relation: Relation 
  }[] {
    const references: { collection: string; field: string; relation: Relation }[] = [];

    this.schemas.forEach((schema, schemaName) => {
      Object.entries(schema.fields).forEach(([fieldName, fieldDef]) => {
        if (fieldDef.relation && fieldDef.relation.collection === collectionName) {
          references.push({
            collection: schemaName,
            field: fieldName,
            relation: fieldDef.relation
          });
        }
      });
    });

    return references;
  }

  /**
   * Verifica integridad referencial antes de eliminar
   * @returns true si se puede eliminar, false si hay restricciones
   */
  public async canDelete(collectionName: string, id: string | number): Promise<boolean> {
    const references = this.findReferencesToCollection(collectionName);
    
    for (const ref of references) {
      if (ref.relation.onDelete === 'restrict') {
        // Buscar referencias existentes
        const refData = this.db.queryByFilters(ref.collection, { [ref.field]: id });
        
        if (refData.length > 0) {
          // Hay referencias que restringen la eliminación
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * Procesa acciones en cascada después de eliminar
   */
  public async processCascadeDelete(collectionName: string, id: string | number): Promise<void> {
    const references = this.findReferencesToCollection(collectionName);
    
    for (const ref of references) {
      // Buscar datos referenciados
      const refData = this.db.queryByFilters(ref.collection, { [ref.field]: id });
      
      if (refData.length === 0) continue;
      
      switch (ref.relation.onDelete) {
        case 'cascade':
          // Eliminar en cascada
          for (const item of refData) {
            await this.db.remove(ref.collection, item.id);
          }
          break;
          
        case 'setNull':
          // Establecer a null
          for (const item of refData) {
            const update = { ...item, [ref.field]: null };
            await this.db.update(ref.collection, item.id, update);
          }
          break;
          
        case 'setDefault':
          // Buscar valor por defecto en el esquema
          const schema = this.schemas.get(ref.collection);
          if (!schema) continue;
          
          const fieldDef = schema.fields[ref.field];
          if (!fieldDef) continue;
          
          const defaultValue = fieldDef.defaultValue !== undefined
            ? (typeof fieldDef.defaultValue === 'function' ? fieldDef.defaultValue() : fieldDef.defaultValue)
            : null;
          
          // Aplicar valor por defecto
          for (const item of refData) {
            const update = { ...item, [ref.field]: defaultValue };
            await this.db.update(ref.collection, item.id, update);
          }
          break;
      }
    }
  }

  /**
   * Procesa acciones en cascada después de actualizar
   */
  public async processCascadeUpdate(collectionName: string, id: string | number, newId: string | number): Promise<void> {
    const references = this.findReferencesToCollection(collectionName);
    
    for (const ref of references) {
      // Buscar datos referenciados
      const refData = this.db.queryByFilters(ref.collection, { [ref.field]: id });
      
      if (refData.length === 0) continue;
      
      switch (ref.relation.onUpdate) {
        case 'cascade':
          // Actualizar en cascada
          for (const item of refData) {
            const update = { ...item, [ref.field]: newId };
            await this.db.update(ref.collection, item.id, update);
          }
          break;
          
        case 'setNull':
          // Establecer a null
          for (const item of refData) {
            const update = { ...item, [ref.field]: null };
            await this.db.update(ref.collection, item.id, update);
          }
          break;
          
        case 'setDefault':
          // Buscar valor por defecto en el esquema
          const schema = this.schemas.get(ref.collection);
          if (!schema) continue;
          
          const fieldDef = schema.fields[ref.field];
          if (!fieldDef) continue;
          
          const defaultValue = fieldDef.defaultValue !== undefined
            ? (typeof fieldDef.defaultValue === 'function' ? fieldDef.defaultValue() : fieldDef.defaultValue)
            : null;
          
          // Aplicar valor por defecto
          for (const item of refData) {
            const update = { ...item, [ref.field]: defaultValue };
            await this.db.update(ref.collection, item.id, update);
          }
          break;
      }
    }
  }

  /**
   * Expande un objeto con sus relaciones
   * @param collectionName Nombre de la colección
   * @param data Objeto a expandir
   * @param depth Profundidad máxima de expansión
   */
  public async expandRelations(collectionName: string, data: any, depth = 1): Promise<any> {
    if (depth <= 0 || !data) return data;
    
    const schema = this.schemas.get(collectionName);
    if (!schema) return data;
    
    const result = { ...data };
    
    // Procesar cada campo con relación
    for (const [fieldName, fieldDef] of Object.entries(schema.fields)) {
      if (!fieldDef.relation) continue;
      
      const relation = fieldDef.relation;
      const relatedCollection = relation.collection;
      
      // Procesar según el tipo de relación
      switch (relation.type) {
        case 'oneToOne':
        case 'manyToOne':
          if (result[fieldName]) {
            // Cargar el objeto relacionado
            const relatedObject = this.db.getById(relatedCollection, result[fieldName]);
            
            if (relatedObject) {
              // Expandir recursivamente si hay más profundidad
              result[fieldName] = depth > 1
                ? await this.expandRelations(relatedCollection, relatedObject, depth - 1)
                : relatedObject;
            }
          }
          break;
          
        case 'oneToMany':
          // Buscar objetos relacionados donde el campo de relación es igual al ID de este objeto
          const relatedObjects = this.db.queryByFilters(
            relatedCollection, 
            { [relation.field]: result.id }
          );
          
          // Expandir recursivamente si hay más profundidad
          result[fieldName] = depth > 1
            ? await Promise.all(
                relatedObjects.map(obj => 
                  this.expandRelations(relatedCollection, obj, depth - 1)
                )
              )
            : relatedObjects;
          break;
          
        case 'manyToMany':
          if (!relation.foreignField) continue;
          
          // Para relaciones muchos a muchos, necesitamos una colección "unión"
          const unionCollection = `${collectionName}_${relatedCollection}`;
          
          if (!this.db.hasCollection(unionCollection)) continue;
          
          // Buscar registros en la colección de unión
          const unionRecords = this.db.queryByFilters(
            unionCollection,
            { [relation.field]: result.id }
          );
          
          // Obtener IDs relacionados
          const relatedIds = unionRecords.map(record => record[relation.foreignField!]);
          
          // Cargar objetos relacionados
          const manyToManyObjects = relatedIds.map(id => this.db.getById(relatedCollection, id))
            .filter(Boolean);
          
          // Expandir recursivamente si hay más profundidad
          result[fieldName] = depth > 1
            ? await Promise.all(
                manyToManyObjects.map(obj => 
                  this.expandRelations(relatedCollection, obj, depth - 1)
                )
              )
            : manyToManyObjects;
          break;
      }
    }
    
    return result;
  }
}