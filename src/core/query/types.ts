/**
 * Tipos de operadores para filtrado
 */
export type ComparisonOperator = '=' | '!=' | '>' | '>=' | '<' | '<=' | 'like' | 'in' | 'nin';

/**
 * Operadores lógicos
 */
export type LogicalOperator = 'and' | 'or' | 'not';

/**
 * Condición de filtrado simple
 */
export interface FilterCondition {
  field: string;
  operator: ComparisonOperator;
  value: any;
}

/**
 * Grupo de condiciones con operador lógico
 */
export interface FilterGroup {
  operator: LogicalOperator;
  conditions: (FilterCondition | FilterGroup)[];
}

/**
 * Opciones de ordenamiento
 */
export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Opciones de paginación (offset)
 */
export interface PaginationOffset {
  type: 'offset';
  page: number;
  limit: number;
}

/**
 * Opciones de paginación (cursor)
 */
export interface PaginationCursor {
  type: 'cursor';
  cursor: string;
  limit: number;
}

/**
 * Tipo de paginación
 */
export type Pagination = PaginationOffset | PaginationCursor;

/**
 * Opciones de consulta completas
 */
export interface QueryOptions {
  filter?: FilterCondition | FilterGroup;
  sort?: SortOption[];
  pagination?: Pagination;
  search?: {
    query: string;
    fields?: string[];
  };
}