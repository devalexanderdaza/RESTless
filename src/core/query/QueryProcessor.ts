import { 
    QueryOptions, 
    FilterCondition, 
    FilterGroup,
    PaginationOffset,
    PaginationCursor
  } from './types';
  
  /**
   * Resultado de una consulta paginada
   */
  export interface PaginatedResult<T> {
    data: T[];
    pagination: {
      total: number;
      currentPage?: number;
      pageCount?: number;
      nextCursor?: string;
      hasMore: boolean;
    };
  }
  
  /**
   * Clase para procesar consultas avanzadas
   */
  export class QueryProcessor {
    /**
     * Aplica opciones de consulta a una colección de datos
     */
    public static process<T>(data: T[], options: QueryOptions): PaginatedResult<T> {
      let result = [...data];
  
      // Aplicar filtros si existen
      if (options.filter) {
        result = QueryProcessor.applyFilter(result, options.filter);
      }
  
      // Aplicar búsqueda si existe
      if (options.search) {
        result = QueryProcessor.applySearch(result, options.search.query, options.search.fields);
      }
  
      // Obtener el total de elementos
      const total = result.length;
  
      // Aplicar ordenamiento si existe
      if (options.sort && options.sort.length > 0) {
        result = QueryProcessor.applySort(result, options.sort);
      }
  
      // Aplicar paginación si existe
      if (options.pagination) {
        const paginationResult = QueryProcessor.applyPagination(result, options.pagination);
        result = paginationResult.data;
        
        return {
          data: result,
          pagination: {
            total,
            ...paginationResult.pagination
          }
        };
      }
  
      // Si no hay paginación, devolver todos los datos
      return {
        data: result,
        pagination: {
          total,
          hasMore: false
        }
      };
    }
  
    /**
     * Aplica filtros a los datos
     */
    private static applyFilter<T>(data: T[], filter: FilterCondition | FilterGroup): T[] {
      if ('conditions' in filter) {
        return QueryProcessor.applyFilterGroup(data, filter);
      } else {
        return QueryProcessor.applyFilterCondition(data, filter);
      }
    }
  
    /**
     * Aplica un grupo de filtros con operador lógico
     */
    private static applyFilterGroup<T>(data: T[], group: FilterGroup): T[] {
      if (group.conditions.length === 0) {
        return data;
      }
  
      return data.filter(item => {
        const results = group.conditions.map(condition => {
          if ('conditions' in condition) {
            return QueryProcessor.applyFilterGroup([item], condition).length > 0;
          } else {
            return QueryProcessor.applyFilterCondition([item], condition).length > 0;
          }
        });
  
        // Evaluar resultados según el operador lógico
        switch (group.operator) {
          case 'and':
            return results.every(Boolean);
          case 'or':
            return results.some(Boolean);
          case 'not':
            return !results.some(Boolean);
          default:
            return true;
        }
      });
    }
  
    /**
     * Aplica una condición de filtro a los datos
     */
    private static applyFilterCondition<T>(data: T[], condition: FilterCondition): T[] {
      return data.filter(item => {
        const itemValue = (item as any)[condition.field];
        
        // Si el campo no existe, no cumple la condición
        if (itemValue === undefined) {
          return false;
        }
  
        // Evaluar según el operador
        switch (condition.operator) {
          case '=':
            return String(itemValue) === String(condition.value);
          case '!=':
            return String(itemValue) !== String(condition.value);
          case '>':
            return itemValue > condition.value;
          case '>=':
            return itemValue >= condition.value;
          case '<':
            return itemValue < condition.value;
          case '<=':
            return itemValue <= condition.value;
          case 'like':
            return String(itemValue).toLowerCase().includes(String(condition.value).toLowerCase());
          case 'in':
            return Array.isArray(condition.value) && condition.value.includes(itemValue);
          case 'nin':
            return Array.isArray(condition.value) && !condition.value.includes(itemValue);
          default:
            return false;
        }
      });
    }
  
    /**
     * Aplica ordenamiento a los datos
     */
    private static applySort<T>(data: T[], sortOptions: { field: string; direction: 'asc' | 'desc' }[]): T[] {
      return [...data].sort((a, b) => {
        for (const sort of sortOptions) {
          const aValue = (a as any)[sort.field];
          const bValue = (b as any)[sort.field];
  
          // Si algún valor es undefined, continuar con el siguiente criterio
          if (aValue === undefined || bValue === undefined) {
            continue;
          }
  
          // Comparar valores
          const direction = sort.direction === 'asc' ? 1 : -1;
          
          if (typeof aValue === 'string' && typeof bValue === 'string') {
            const comparison = aValue.localeCompare(bValue);
            if (comparison !== 0) {
              return comparison * direction;
            }
          } else {
            if (aValue < bValue) return -1 * direction;
            if (aValue > bValue) return 1 * direction;
          }
        }
        
        return 0;
      });
    }
  
    /**
     * Aplica paginación a los datos
     */
    private static applyPagination<T>(
      data: T[], 
      pagination: PaginationOffset | PaginationCursor
    ): { data: T[]; pagination: { currentPage?: number; pageCount?: number; nextCursor?: string; hasMore: boolean } } {
      if (pagination.type === 'offset') {
        return QueryProcessor.applyOffsetPagination(data, pagination);
      } else {
        return QueryProcessor.applyCursorPagination(data, pagination);
      }
    }
  
    /**
     * Aplica paginación por offset
     */
    private static applyOffsetPagination<T>(
      data: T[], 
      pagination: PaginationOffset
    ): { data: T[]; pagination: { currentPage: number; pageCount: number; hasMore: boolean } } {
      const { page, limit } = pagination;
      
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      
      const paginatedData = data.slice(startIndex, endIndex);
      const pageCount = Math.ceil(data.length / limit);
      
      return {
        data: paginatedData,
        pagination: {
          currentPage: page,
          pageCount,
          hasMore: page < pageCount
        }
      };
    }
  
    /**
     * Aplica paginación por cursor
     */
    private static applyCursorPagination<T>(
      data: T[], 
      pagination: PaginationCursor
    ): { data: T[]; pagination: { nextCursor?: string; hasMore: boolean } } {
      const { cursor, limit } = pagination;
      
      // Decodificar cursor (formato: índice)
      const startIndex = cursor ? parseInt(Buffer.from(cursor, 'base64').toString(), 10) : 0;
      const endIndex = startIndex + limit;
      
      const paginatedData = data.slice(startIndex, endIndex);
      const hasMore = endIndex < data.length;
      
      // Generar cursor para la siguiente página
      const nextCursor = hasMore ? Buffer.from(String(endIndex)).toString('base64') : undefined;
      
      return {
        data: paginatedData,
        pagination: {
          nextCursor,
          hasMore
        }
      };
    }
  
    /**
     * Aplica búsqueda de texto a los datos
     */
    private static applySearch<T>(data: T[], query: string, fields?: string[]): T[] {
      if (!query) {
        return data;
      }
  
      const searchQuery = query.toLowerCase();
      
      return data.filter(item => {
        // Si no se especifican campos, buscar en todos
        const searchFields = fields || Object.keys(item as any);
        
        return searchFields.some(field => {
          const value = (item as any)[field];
          
          if (value === undefined) {
            return false;
          }
          
          // Buscar en string
          if (typeof value === 'string') {
            return value.toLowerCase().includes(searchQuery);
          }
          
          // Buscar en número
          if (typeof value === 'number') {
            return String(value).includes(searchQuery);
          }
          
          return false;
        });
      });
    }
  }