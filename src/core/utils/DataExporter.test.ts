import { describe, it, expect } from 'vitest';
import { DataExporter } from './DataExporter';

const sampleData = {
  users: [
    { id: 1, name: 'Alice', active: true, score: 9.5 },
    { id: 2, name: 'Bob', active: false, score: 7 },
  ],
  products: [
    { id: 1, label: 'Laptop', price: 999.99 },
  ],
};

describe('DataExporter', () => {
  describe('JSON export/import round-trip', () => {
    it('exports to valid JSON string', () => {
      const json = DataExporter.export(sampleData, 'json');
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('imports exported JSON back to original data', () => {
      const json = DataExporter.export(sampleData, 'json');
      const imported = DataExporter.import(json, 'json');
      expect(imported).toEqual(sampleData);
    });

    it('throws on invalid JSON input', () => {
      expect(() => DataExporter.import('not valid json', 'json')).toThrow();
    });

    it('handles empty collections', () => {
      const json = DataExporter.export({ empty: [] }, 'json');
      const imported = DataExporter.import(json, 'json');
      expect(imported).toEqual({ empty: [] });
    });
  });

  describe('CSV export/import round-trip', () => {
    it('exports to a non-empty CSV string', () => {
      const csv = DataExporter.export(sampleData, 'csv');
      expect(csv).toContain('# Collection: users');
      expect(csv).toContain('# Collection: products');
      expect(csv).toContain('Alice');
      expect(csv).toContain('Laptop');
    });

    it('imports exported CSV back to equivalent data', () => {
      const csv = DataExporter.export(sampleData, 'csv');
      const imported = DataExporter.import(csv, 'csv');

      // IDs, names and booleans should round-trip correctly
      expect(imported.users).toHaveLength(2);
      expect(imported.users[0].id).toBe(1);
      expect(imported.users[0].name).toBe('Alice');
      expect(imported.users[0].active).toBe(true);
      expect(imported.users[1].active).toBe(false);
      expect(imported.products[0].price).toBe(999.99);
    });

    it('handles values with commas inside quotes', () => {
      const data = { items: [{ id: 1, desc: 'hello, world' }] };
      const csv = DataExporter.export(data, 'csv');
      const imported = DataExporter.import(csv, 'csv');
      expect(imported.items[0].desc).toBe('hello, world');
    });

    it('handles values with double-quotes escaped', () => {
      const data = { items: [{ id: 1, desc: 'say "hi"' }] };
      const csv = DataExporter.export(data, 'csv');
      const imported = DataExporter.import(csv, 'csv');
      expect(imported.items[0].desc).toBe('say "hi"');
    });

    it('handles nested objects serialized as JSON strings', () => {
      const data = { items: [{ id: 1, meta: { key: 'val' } }] };
      const csv = DataExporter.export(data, 'csv');
      const imported = DataExporter.import(csv, 'csv');
      expect(imported.items[0].meta).toEqual({ key: 'val' });
    });

    it('skips empty collections in CSV output', () => {
      const csv = DataExporter.export({ empty: [], users: [{ id: 1, name: 'Alice' }] }, 'csv');
      expect(csv).not.toContain('# Collection: empty');
      expect(csv).toContain('# Collection: users');
    });
  });

  describe('default format', () => {
    it('defaults to JSON export', () => {
      const output = DataExporter.export(sampleData);
      expect(() => JSON.parse(output)).not.toThrow();
    });

    it('defaults to JSON import', () => {
      const json = JSON.stringify(sampleData);
      const imported = DataExporter.import(json);
      expect(imported).toEqual(sampleData);
    });
  });
});
