import { describe, it, expect } from 'vitest';
import { QueryParser } from './QueryParser';

describe('QueryParser', () => {
  describe('parseQueryParams', () => {
    it('returns empty options for empty query params', () => {
      const options = QueryParser.parseQueryParams({});
      expect(options.filter).toBeUndefined();
      expect(options.sort).toBeUndefined();
      expect(options.pagination).toBeUndefined();
      expect(options.search).toBeUndefined();
    });

    it('parses simple equality filter', () => {
      const options = QueryParser.parseQueryParams({ role: 'admin' });
      expect(options.filter).toBeDefined();
      expect(options.filter).toMatchObject({
        operator: 'and',
        conditions: [{ field: 'role', operator: '=', value: 'admin' }],
      });
    });

    it('parses operator-suffixed filters', () => {
      const options = QueryParser.parseQueryParams({ age_gt: '25' });
      expect(options.filter).toBeDefined();
      expect(options.filter).toMatchObject({
        operator: 'and',
        conditions: [{ field: 'age', operator: '>', value: 25 }],
      });
    });

    it('parses ne operator', () => {
      const options = QueryParser.parseQueryParams({ role_ne: 'user' });
      expect(options.filter).toMatchObject({
        conditions: [{ field: 'role', operator: '!=' }],
      });
    });

    it('parses gte and lte operators', () => {
      const options = QueryParser.parseQueryParams({ age_gte: '18', age_lte: '60' });
      const conditions = (options.filter as any).conditions;
      expect(conditions).toHaveLength(2);
      const ops = conditions.map((c: any) => c.operator);
      expect(ops).toContain('>=');
      expect(ops).toContain('<=');
    });

    it('parses like operator', () => {
      const options = QueryParser.parseQueryParams({ name_like: 'ali' });
      expect(options.filter).toMatchObject({
        conditions: [{ field: 'name', operator: 'like', value: 'ali' }],
      });
    });

    it('parses in operator as array', () => {
      const options = QueryParser.parseQueryParams({ role_in: 'admin,editor' });
      expect(options.filter).toMatchObject({
        conditions: [{ field: 'role', operator: 'in', value: ['admin', 'editor'] }],
      });
    });

    it('parses nin operator as array', () => {
      const options = QueryParser.parseQueryParams({ role_nin: 'admin,editor' });
      expect(options.filter).toMatchObject({
        conditions: [{ field: 'role', operator: 'nin', value: ['admin', 'editor'] }],
      });
    });

    it('ignores reserved query params in filter', () => {
      const options = QueryParser.parseQueryParams({ _sort: 'name', _order: 'asc', _page: '1' });
      expect(options.filter).toBeUndefined();
    });
  });

  describe('sort parsing', () => {
    it('parses single sort field ascending', () => {
      const options = QueryParser.parseQueryParams({ _sort: 'name', _order: 'asc' });
      expect(options.sort).toEqual([{ field: 'name', direction: 'asc' }]);
    });

    it('parses single sort field descending', () => {
      const options = QueryParser.parseQueryParams({ _sort: 'age', _order: 'desc' });
      expect(options.sort).toEqual([{ field: 'age', direction: 'desc' }]);
    });

    it('defaults to asc when order is missing', () => {
      const options = QueryParser.parseQueryParams({ _sort: 'name' });
      expect(options.sort).toEqual([{ field: 'name', direction: 'asc' }]);
    });

    it('parses multiple sort fields', () => {
      const options = QueryParser.parseQueryParams({ _sort: 'role,age', _order: 'asc,desc' });
      expect(options.sort).toEqual([
        { field: 'role', direction: 'asc' },
        { field: 'age', direction: 'desc' },
      ]);
    });

    it('returns undefined when no sort params', () => {
      const options = QueryParser.parseQueryParams({ name: 'Alice' });
      expect(options.sort).toBeUndefined();
    });
  });

  describe('offset pagination parsing', () => {
    it('parses page and limit', () => {
      const options = QueryParser.parseQueryParams({ _page: '2', _limit: '5' });
      expect(options.pagination).toMatchObject({ type: 'offset', page: 2, limit: 5 });
    });

    it('defaults page to 1 when only limit given', () => {
      const options = QueryParser.parseQueryParams({ _limit: '10' });
      expect(options.pagination).toMatchObject({ type: 'offset', page: 1, limit: 10 });
    });

    it('defaults limit to 10 when only page given', () => {
      const options = QueryParser.parseQueryParams({ _page: '3' });
      expect(options.pagination).toMatchObject({ type: 'offset', page: 3, limit: 10 });
    });

    it('returns undefined when no pagination params', () => {
      const options = QueryParser.parseQueryParams({ name: 'Alice' });
      expect(options.pagination).toBeUndefined();
    });
  });

  describe('cursor pagination parsing', () => {
    it('parses cursor pagination', () => {
      const options = QueryParser.parseQueryParams({ _cursor: 'abc123', _limit: '5' });
      expect(options.pagination).toMatchObject({ type: 'cursor', cursor: 'abc123', limit: 5 });
    });

    it('cursor pagination takes precedence over offset pagination', () => {
      const options = QueryParser.parseQueryParams({ _cursor: 'abc', _page: '2', _limit: '5' });
      expect((options.pagination as any).type).toBe('cursor');
    });
  });

  describe('search parsing', () => {
    it('parses search query', () => {
      const options = QueryParser.parseQueryParams({ _q: 'hello' });
      expect(options.search).toMatchObject({ query: 'hello' });
      expect(options.search?.fields).toBeUndefined();
    });

    it('parses search with field restrictions', () => {
      const options = QueryParser.parseQueryParams({ _q: 'hello', _fields: 'name,email' });
      expect(options.search).toMatchObject({ query: 'hello', fields: ['name', 'email'] });
    });

    it('returns undefined when no search params', () => {
      const options = QueryParser.parseQueryParams({ name: 'Alice' });
      expect(options.search).toBeUndefined();
    });
  });
});
