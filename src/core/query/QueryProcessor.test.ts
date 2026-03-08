import { describe, it, expect } from 'vitest';
import { QueryProcessor } from './QueryProcessor';
import { QueryOptions } from './types';

const sampleData = [
  { id: 1, name: 'Alice', age: 30, role: 'admin', active: true },
  { id: 2, name: 'Bob', age: 25, role: 'user', active: false },
  { id: 3, name: 'Charlie', age: 35, role: 'user', active: true },
  { id: 4, name: 'Diana', age: 28, role: 'editor', active: true },
  { id: 5, name: 'Eve', age: 22, role: 'user', active: false },
];

describe('QueryProcessor', () => {
  describe('no options', () => {
    it('returns all data when no options are provided', () => {
      const result = QueryProcessor.process(sampleData, {});
      expect(result.data).toHaveLength(5);
      expect(result.pagination.total).toBe(5);
      expect(result.pagination.hasMore).toBe(false);
    });
  });

  describe('filtering', () => {
    it('filters by equality', () => {
      const options: QueryOptions = {
        filter: { field: 'role', operator: '=', value: 'user' },
      };
      const result = QueryProcessor.process(sampleData, options);
      expect(result.data).toHaveLength(3);
      result.data.forEach((item) => expect(item.role).toBe('user'));
    });

    it('filters by not-equal', () => {
      const options: QueryOptions = {
        filter: { field: 'role', operator: '!=', value: 'user' },
      };
      const result = QueryProcessor.process(sampleData, options);
      expect(result.data).toHaveLength(2);
    });

    it('filters by greater-than', () => {
      const options: QueryOptions = {
        filter: { field: 'age', operator: '>', value: 28 },
      };
      const result = QueryProcessor.process(sampleData, options);
      expect(result.data.map((d) => d.id)).toEqual([1, 3]);
    });

    it('filters by less-than-or-equal', () => {
      const options: QueryOptions = {
        filter: { field: 'age', operator: '<=', value: 25 },
      };
      const result = QueryProcessor.process(sampleData, options);
      expect(result.data.map((d) => d.id)).toEqual([2, 5]);
    });

    it('filters by like (case-insensitive substring)', () => {
      const options: QueryOptions = {
        filter: { field: 'name', operator: 'like', value: 'ali' },
      };
      const result = QueryProcessor.process(sampleData, options);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(1);
    });

    it('filters by in', () => {
      const options: QueryOptions = {
        filter: { field: 'role', operator: 'in', value: ['admin', 'editor'] },
      };
      const result = QueryProcessor.process(sampleData, options);
      expect(result.data.map((d) => d.id)).toEqual([1, 4]);
    });

    it('filters by nin', () => {
      const options: QueryOptions = {
        filter: { field: 'role', operator: 'nin', value: ['admin', 'editor'] },
      };
      const result = QueryProcessor.process(sampleData, options);
      expect(result.data).toHaveLength(3);
      result.data.forEach((item) => expect(item.role).toBe('user'));
    });

    it('returns empty when field is missing in all items', () => {
      const options: QueryOptions = {
        filter: { field: 'nonexistent', operator: '=', value: 'x' },
      };
      const result = QueryProcessor.process(sampleData, options);
      expect(result.data).toHaveLength(0);
    });

    it('supports AND group', () => {
      const options: QueryOptions = {
        filter: {
          operator: 'and',
          conditions: [
            { field: 'role', operator: '=', value: 'user' },
            { field: 'active', operator: '=', value: false },
          ],
        },
      };
      const result = QueryProcessor.process(sampleData, options);
      expect(result.data.map((d) => d.id)).toEqual([2, 5]);
    });

    it('supports OR group', () => {
      const options: QueryOptions = {
        filter: {
          operator: 'or',
          conditions: [
            { field: 'role', operator: '=', value: 'admin' },
            { field: 'role', operator: '=', value: 'editor' },
          ],
        },
      };
      const result = QueryProcessor.process(sampleData, options);
      expect(result.data.map((d) => d.id)).toEqual([1, 4]);
    });

    it('supports NOT group', () => {
      const options: QueryOptions = {
        filter: {
          operator: 'not',
          conditions: [{ field: 'role', operator: '=', value: 'user' }],
        },
      };
      const result = QueryProcessor.process(sampleData, options);
      expect(result.data).toHaveLength(2);
    });
  });

  describe('sorting', () => {
    it('sorts ascending by a string field', () => {
      const options: QueryOptions = {
        sort: [{ field: 'name', direction: 'asc' }],
      };
      const result = QueryProcessor.process(sampleData, options);
      const names = result.data.map((d) => d.name);
      expect(names).toEqual([...names].sort());
    });

    it('sorts descending by a numeric field', () => {
      const options: QueryOptions = {
        sort: [{ field: 'age', direction: 'desc' }],
      };
      const result = QueryProcessor.process(sampleData, options);
      const ages = result.data.map((d) => d.age);
      expect(ages[0]).toBeGreaterThanOrEqual(ages[1]);
    });
  });

  describe('offset pagination', () => {
    it('returns the first page', () => {
      const options: QueryOptions = {
        pagination: { type: 'offset', page: 1, limit: 2 },
      };
      const result = QueryProcessor.process(sampleData, options);
      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(5);
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.pageCount).toBe(3);
      expect(result.pagination.hasMore).toBe(true);
    });

    it('returns the last page correctly', () => {
      const options: QueryOptions = {
        pagination: { type: 'offset', page: 3, limit: 2 },
      };
      const result = QueryProcessor.process(sampleData, options);
      expect(result.data).toHaveLength(1);
      expect(result.pagination.hasMore).toBe(false);
    });
  });

  describe('cursor pagination', () => {
    it('returns the first page without a cursor', () => {
      const options: QueryOptions = {
        pagination: { type: 'cursor', cursor: '', limit: 2 },
      };
      const result = QueryProcessor.process(sampleData, options);
      expect(result.data).toHaveLength(2);
      expect(result.pagination.hasMore).toBe(true);
      expect(result.pagination.nextCursor).toBeDefined();
    });

    it('uses the next cursor to return the second page', () => {
      const first = QueryProcessor.process(sampleData, {
        pagination: { type: 'cursor', cursor: '', limit: 2 },
      });
      const nextCursor = first.pagination.nextCursor!;

      const second = QueryProcessor.process(sampleData, {
        pagination: { type: 'cursor', cursor: nextCursor, limit: 2 },
      });
      expect(second.data).toHaveLength(2);
      // IDs on second page should not overlap with first page
      const firstIds = first.data.map((d) => d.id);
      const secondIds = second.data.map((d) => d.id);
      expect(secondIds.some((id) => firstIds.includes(id))).toBe(false);
    });

    it('returns hasMore=false on the last page', () => {
      const first = QueryProcessor.process(sampleData, {
        pagination: { type: 'cursor', cursor: '', limit: 3 },
      });
      const second = QueryProcessor.process(sampleData, {
        pagination: { type: 'cursor', cursor: first.pagination.nextCursor!, limit: 3 },
      });
      expect(second.pagination.hasMore).toBe(false);
      expect(second.pagination.nextCursor).toBeUndefined();
    });
  });

  describe('search', () => {
    it('searches across all fields when no fields specified', () => {
      const options: QueryOptions = {
        search: { query: 'Alice' },
      };
      const result = QueryProcessor.process(sampleData, options);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(1);
    });

    it('searches within specified fields only', () => {
      const options: QueryOptions = {
        search: { query: '3', fields: ['id'] },
      };
      const result = QueryProcessor.process(sampleData, options);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(3);
    });

    it('returns empty when query matches nothing', () => {
      const options: QueryOptions = {
        search: { query: 'zzz_nonexistent' },
      };
      const result = QueryProcessor.process(sampleData, options);
      expect(result.data).toHaveLength(0);
    });
  });
});
