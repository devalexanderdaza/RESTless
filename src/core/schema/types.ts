/**
 * Tipos de campos para el esquema
 */
export type FieldType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null' | 'any';

/**
 * Tipo de relación entre colecciones
 */
export type RelationType = 'oneToOne' | 'oneToMany' | 'manyToOne' | 'manyToMany';

/**
 * Acciones de referencia para integridad referencial
 */
export type ReferenceAction = 'cascade' | 'restrict' | 'setNull' | 'setDefault';

/**
 * Definición de una relación entre colecciones
 */
export interface Relation {
  type: RelationType;
  collection: string; // Colección relacionada
  field: string; // Campo de la relación en la colección relacionada
  foreignField?: string; // Campo de la relación en esta colección (para manyToMany)
  onDelete?: ReferenceAction; // Acción al eliminar
  onUpdate?: ReferenceAction; // Acción al actualizar
}

/**
 * Definición de un campo en el esquema
 */
export interface FieldDefinition {
  type: FieldType | FieldType[];
  required?: boolean;
  defaultValue?: any;
  relation?: Relation;
  properties?: Record<string, FieldDefinition>; // Para objetos anidados
  items?: FieldDefinition; // Para arrays
  validate?: (value: any) => boolean | string; // Función de validación personalizada
  transform?: (value: any) => any; // Función de transformación
  
  // Validaciones comunes
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enum?: any[];
  format?: string;
}

/**
 * Definición del esquema para una colección
 */
export interface SchemaDefinition {
  name: string; // Nombre de la colección
  fields: Record<string, FieldDefinition>; // Definiciones de campos
  timestamps?: boolean; // Agregar campos createdAt y updatedAt
}

/**
 * Error de validación
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Resultado de validación
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}