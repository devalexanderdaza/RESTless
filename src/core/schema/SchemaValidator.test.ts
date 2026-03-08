import { describe, it, expect } from 'vitest';
import { SchemaValidator } from './SchemaValidator';
import { SchemaDefinition } from './types';

const userSchema: SchemaDefinition = {
  name: 'users',
  timestamps: false,
  fields: {
    id: { type: 'number', required: true },
    name: { type: 'string', required: true, minLength: 2, maxLength: 50 },
    age: { type: 'number', min: 0, max: 150 },
    email: {
      type: 'string',
      validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Invalid email',
    },
    role: { type: 'string', enum: ['admin', 'user', 'editor'], defaultValue: 'user' },
    price: { type: 'number', transform: (v) => Math.round(v * 100) / 100 },
  },
};

describe('SchemaValidator', () => {
  describe('validate', () => {
    it('passes for valid data', () => {
      const result = SchemaValidator.validate({ id: 1, name: 'Alice' }, userSchema);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('reports missing required field', () => {
      const result = SchemaValidator.validate({ id: 1 }, userSchema);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'name')).toBe(true);
    });

    it('reports wrong type', () => {
      const result = SchemaValidator.validate({ id: 'not-a-number', name: 'Alice' }, userSchema);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'id')).toBe(true);
    });

    it('reports min length violation', () => {
      const result = SchemaValidator.validate({ id: 1, name: 'A' }, userSchema);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'name')).toBe(true);
    });

    it('reports max length violation', () => {
      const longName = 'A'.repeat(51);
      const result = SchemaValidator.validate({ id: 1, name: longName }, userSchema);
      expect(result.valid).toBe(false);
    });

    it('reports number below min', () => {
      const result = SchemaValidator.validate({ id: 1, name: 'Alice', age: -1 }, userSchema);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'age')).toBe(true);
    });

    it('reports number above max', () => {
      const result = SchemaValidator.validate({ id: 1, name: 'Alice', age: 200 }, userSchema);
      expect(result.valid).toBe(false);
    });

    it('reports invalid enum value', () => {
      const result = SchemaValidator.validate({ id: 1, name: 'Alice', role: 'superuser' }, userSchema);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'role')).toBe(true);
    });

    it('passes for valid enum value', () => {
      const result = SchemaValidator.validate({ id: 1, name: 'Alice', role: 'admin' }, userSchema);
      expect(result.valid).toBe(true);
    });

    it('reports custom validation failure', () => {
      const result = SchemaValidator.validate({ id: 1, name: 'Alice', email: 'not-an-email' }, userSchema);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'email')).toBe(true);
    });

    it('passes for valid email', () => {
      const result = SchemaValidator.validate({ id: 1, name: 'Alice', email: 'alice@example.com' }, userSchema);
      expect(result.valid).toBe(true);
    });

    it('skips missing non-required fields without error', () => {
      const result = SchemaValidator.validate({ id: 1, name: 'Alice' }, userSchema);
      expect(result.valid).toBe(true);
    });

    it('allows missing required fields when partial=true', () => {
      const result = SchemaValidator.validate({ age: 30 }, userSchema, true);
      expect(result.valid).toBe(true);
    });

    it('supports union types', () => {
      const schema: SchemaDefinition = {
        name: 'test',
        fields: { value: { type: ['string', 'number'] } },
      };
      expect(SchemaValidator.validate({ value: 'hello' }, schema).valid).toBe(true);
      expect(SchemaValidator.validate({ value: 42 }, schema).valid).toBe(true);
      expect(SchemaValidator.validate({ value: true }, schema).valid).toBe(false);
    });
  });

  describe('transform', () => {
    it('applies default value for missing field when isNew=true', () => {
      const data = { id: 1, name: 'Alice' };
      const result = SchemaValidator.transform(data, userSchema, true);
      expect(result.role).toBe('user');
    });

    it('does not apply default value when field already present', () => {
      const data = { id: 1, name: 'Alice', role: 'admin' };
      const result = SchemaValidator.transform(data, userSchema, true);
      expect(result.role).toBe('admin');
    });

    it('does not apply default value when isNew=false', () => {
      const data = { id: 1, name: 'Alice' };
      const result = SchemaValidator.transform(data, userSchema, false);
      expect(result.role).toBeUndefined();
    });

    it('applies transform function to a field', () => {
      const data = { id: 1, name: 'Alice', price: 9.999 };
      const result = SchemaValidator.transform(data, userSchema, false);
      expect(result.price).toBe(10);
    });

    it('adds timestamps when schema.timestamps=true and isNew=true', () => {
      const schema: SchemaDefinition = {
        name: 'items',
        timestamps: true,
        fields: { id: { type: 'number' } },
      };
      const result = SchemaValidator.transform({ id: 1 }, schema, true);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('only updates updatedAt when schema.timestamps=true and isNew=false', () => {
      const schema: SchemaDefinition = {
        name: 'items',
        timestamps: true,
        fields: { id: { type: 'number' } },
      };
      const existing = { id: 1, createdAt: '2024-01-01T00:00:00.000Z' };
      const result = SchemaValidator.transform(existing, schema, false);
      expect(result.createdAt).toBe('2024-01-01T00:00:00.000Z');
      expect(result.updatedAt).toBeDefined();
    });

    it('does not mutate the original data object', () => {
      const data = { id: 1, name: 'Alice' };
      SchemaValidator.transform(data, userSchema, true);
      expect((data as any).role).toBeUndefined();
    });
  });
});
