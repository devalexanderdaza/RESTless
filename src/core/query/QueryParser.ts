import { QueryOptions, FilterCondition, FilterGroup, SortOption, Pagination } from './types';

/**
 * Clase para parsear parámetros URL en opciones de consulta
 */
export class QueryParser {
  /**
   * Parsea parámetros de consulta en opciones estructuradas
   */
  public static parseQueryParams(queryParams: Record<string, string>): QueryOptions {
    const options: QueryOptions = {};

    // Parsear filtro
    options.filter = QueryParser.parseFilterParams(queryParams);

    // Parsear ordenamiento
    options.sort = QueryParser.parseSortParams(queryParams);

    // Parsear paginación
    options.pagination = QueryParser.parsePaginationParams(queryParams);

    // Parsear búsqueda
    options.search = QueryParser.parseSearchParams(queryParams);

    return options;
  }

  /**
   * Parsea parámetros de filtro
   */
  private static parseFilterParams(queryParams: Record<string, string>): FilterGroup | undefined {
    // Extraer parámetros de filtro
    const filterParams = Object.entries(queryParams).filter(([key]) => {
      return !['_sort', '_order', '_page', '_limit', '_cursor', '_q', '_fields'].includes(key);
    });

    if (filterParams.length === 0) {
      return undefined;
    }

    // Crear grupo de condiciones
    const filterGroup: FilterGroup = {
      operator: 'and',
      conditions: []
    };

    // Procesar cada parámetro de filtro
    filterParams.forEach(([key, value]) => {
      // Comprobar si es una condición especial
      if (key.includes('_')) {
        const [field, operator] = key.split('_');
        
        if (field && operator) {
          // Parsear operador
          const condition = QueryParser.createFilterCondition(field, operator, value);
          if (condition) {
            filterGroup.conditions.push(condition);
          }
        }
      } else {
        // Condición de igualdad simple
        filterGroup.conditions.push({
          field: key,
          operator: '=',
          value
        });
      }
    });

    return filterGroup.conditions.length > 0 ? filterGroup : undefined;
  }

  /**
   * Crea una condición de filtro a partir de un operador
   */
  private static createFilterCondition(field: string, operator: string, value: string): FilterCondition | undefined {
    switch (operator) {
      case 'eq':
        return { field, operator: '=', value };
      case 'ne':
        return { field, operator: '!=', value };
      case 'gt':
        return { field, operator: '>', value: parseFloat(value) };
      case 'gte':
        return { field, operator: '>=', value: parseFloat(value) };
      case 'lt':
        return { field, operator: '<', value: parseFloat(value) };
      case 'lte':
        return { field, operator: '<=', value: parseFloat(value) };
      case 'like':
        return { field, operator: 'like', value };
      case 'in':
        return { field, operator: 'in', value: value.split(',') };
      case 'nin':
        return { field, operator: 'nin', value: value.split(',') };
      default:
        return undefined;
    }
  }

  /**
   * Parsea parámetros de ordenamiento
   */
  private static parseSortParams(queryParams: Record<string, string>): SortOption[] | undefined {
    const sort = queryParams['_sort'];
    const order = queryParams['_order'];

    if (!sort) {
      return undefined;
    }

    // Procesar múltiples campos
    const sortFields = sort.split(',');
    const orderDirections = order ? order.split(',') : [];

    return sortFields.map((field, index) => {
      const direction = orderDirections[index] === 'desc' ? 'desc' : 'asc';
      return { field, direction };
    });
  }

  /**
   * Parsea parámetros de paginación
   */
  private static parsePaginationParams(queryParams: Record<string, string>): Pagination | undefined {
    // Paginación por cursor
    if (queryParams['_cursor']) {
      const limit = parseInt(queryParams['_limit'] || '10', 10);
      return {
        type: 'cursor',
        cursor: queryParams['_cursor'],
        limit: isNaN(limit) ? 10 : limit
      };
    }

    // Paginación por offset
    if (queryParams['_page'] || queryParams['_limit']) {
      const page = parseInt(queryParams['_page'] || '1', 10);
      const limit = parseInt(queryParams['_limit'] || '10', 10);
      
      return {
        type: 'offset',
        page: isNaN(page) ? 1 : page,
        limit: isNaN(limit) ? 10 : limit
      };
    }

    return undefined;
  }

  /**
   * Parsea parámetros de búsqueda
   */
  private static parseSearchParams(queryParams: Record<string, string>): { query: string; fields?: string[] } | undefined {
    const query = queryParams['_q'];
    
    if (!query) {
      return undefined;
    }

    const fields = queryParams['_fields'] ? queryParams['_fields'].split(',') : undefined;
    
    return { query, fields };
  }
}