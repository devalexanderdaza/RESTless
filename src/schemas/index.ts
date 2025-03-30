import { SchemaDefinition } from '../core/schema';

/**
 * Esquema para la colección de usuarios
 */
export const usuariosSchema: SchemaDefinition = {
  name: 'usuarios',
  timestamps: true,
  fields: {
    id: {
      type: 'number',
      required: true
    },
    nombre: {
      type: 'string',
      required: true,
      minLength: 3,
      maxLength: 50
    },
    email: {
      type: 'string',
      required: true,
      format: 'email',
      validate: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) || 'Formato de email inválido';
      }
    },
    rol: {
      type: 'string',
      enum: ['admin', 'usuario', 'editor'],
      defaultValue: 'usuario'
    },
    pedidos: {
      type: 'array',
      relation: {
        type: 'oneToMany',
        collection: 'pedidos',
        field: 'usuarioId',
        onDelete: 'cascade'
      }
    }
  }
};

/**
 * Esquema para la colección de productos
 */
export const productosSchema: SchemaDefinition = {
  name: 'productos',
  timestamps: true,
  fields: {
    id: {
      type: 'number',
      required: true
    },
    nombre: {
      type: 'string',
      required: true,
      minLength: 3,
      maxLength: 100
    },
    precio: {
      type: 'number',
      required: true,
      min: 0,
      transform: (value) => Math.round(value * 100) / 100 // Redondear a 2 decimales
    },
    stock: {
      type: 'number',
      required: true,
      min: 0,
      defaultValue: 0
    },
    categoria: {
      type: 'string',
      relation: {
        type: 'manyToOne',
        collection: 'categorias',
        field: 'nombre'
      }
    },
    descripcion: {
      type: 'string',
      maxLength: 1000
    },
    pedidoItems: {
      type: 'array',
      relation: {
        type: 'oneToMany',
        collection: 'pedidoItems',
        field: 'productoId'
      }
    }
  }
};

/**
 * Esquema para la colección de pedidos
 */
export const pedidosSchema: SchemaDefinition = {
  name: 'pedidos',
  timestamps: true,
  fields: {
    id: {
      type: 'number',
      required: true
    },
    usuarioId: {
      type: 'number',
      required: true,
      relation: {
        type: 'manyToOne',
        collection: 'usuarios',
        field: 'id'
      }
    },
    fecha: {
      type: 'string',
      required: true,
      defaultValue: () => new Date().toISOString().split('T')[0]
    },
    estado: {
      type: 'string',
      enum: ['pendiente', 'enviado', 'entregado', 'cancelado'],
      defaultValue: 'pendiente'
    },
    total: {
      type: 'number',
      required: true,
      min: 0
    },
    items: {
      type: 'array',
      required: true,
      items: {
        type: 'object',
        properties: {
          productoId: {
            type: 'number',
            required: true,
            relation: {
              type: 'manyToOne',
              collection: 'productos',
              field: 'id'
            }
          },
          cantidad: {
            type: 'number',
            required: true,
            min: 1
          },
          precioUnitario: {
            type: 'number',
            required: true,
            min: 0
          }
        }
      }
    }
  }
};

/**
 * Esquema para la colección de categorías
 */
export const categoriasSchema: SchemaDefinition = {
  name: 'categorias',
  timestamps: true,
  fields: {
    id: {
      type: 'number',
      required: true
    },
    nombre: {
      type: 'string',
      required: true,
      minLength: 2,
      maxLength: 50
    },
    descripcion: {
      type: 'string',
      maxLength: 500
    },
    productos: {
      type: 'array',
      relation: {
        type: 'oneToMany',
        collection: 'productos',
        field: 'categoria'
      }
    }
  }
};

/**
 * Lista de todos los esquemas
 */
export const schemas = [
  usuariosSchema,
  productosSchema,
  pedidosSchema,
  categoriasSchema
];