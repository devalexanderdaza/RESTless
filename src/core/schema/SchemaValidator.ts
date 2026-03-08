import { 
    SchemaDefinition, 
    FieldDefinition, 
    ValidationResult,
    ValidationError
  } from './types';
  
  /**
   * Clase para validar datos contra un esquema
   */
  export class SchemaValidator {
    /**
     * Valida un objeto contra un esquema
     * @param data Datos a validar
     * @param schema Esquema para validación
     * @param partial Si es true, no valida campos requeridos que faltan (útil para PATCH)
     */
    public static validate(data: any, schema: SchemaDefinition, partial = false): ValidationResult {
      const errors: ValidationError[] = [];
      
      // Validar campos del esquema
      Object.entries(schema.fields).forEach(([fieldName, fieldDef]) => {
        // Si el campo existe en los datos, validarlo
        if (fieldName in data) {
          const value = data[fieldName];
          const fieldErrors = SchemaValidator.validateField(value, fieldDef, fieldName);
          errors.push(...fieldErrors);
        } 
        // Si el campo no existe pero es requerido (y no es parcial), es un error
        else if (fieldDef.required && !partial) {
          errors.push({
            field: fieldName,
            message: `El campo es requerido`
          });
        }
      });
  
      return {
        valid: errors.length === 0,
        errors
      };
    }
  
    /**
     * Valida un valor contra la definición de un campo
     */
    private static validateField(value: any, fieldDef: FieldDefinition, path: string): ValidationError[] {
      const errors: ValidationError[] = [];
      
      // Si el valor es null o undefined
      if (value === null || value === undefined) {
        // Si el campo es requerido, es un error
        if (fieldDef.required) {
          errors.push({
            field: path,
            message: `El campo es requerido`
          });
        }
        return errors;
      }
  
      // Validar tipo
      if (!SchemaValidator.validateType(value, fieldDef.type)) {
        errors.push({
          field: path,
          message: `Tipo inválido, se esperaba ${Array.isArray(fieldDef.type) ? fieldDef.type.join(' o ') : fieldDef.type}`
        });
      }
  
      // Validaciones numéricas
      if (typeof value === 'number') {
        if (fieldDef.min !== undefined && value < fieldDef.min) {
          errors.push({
            field: path,
            message: `El valor debe ser mayor o igual a ${fieldDef.min}`
          });
        }
        
        if (fieldDef.max !== undefined && value > fieldDef.max) {
          errors.push({
            field: path,
            message: `El valor debe ser menor o igual a ${fieldDef.max}`
          });
        }
      }
  
      // Validaciones de cadena
      if (typeof value === 'string') {
        if (fieldDef.minLength !== undefined && value.length < fieldDef.minLength) {
          errors.push({
            field: path,
            message: `La longitud debe ser mayor o igual a ${fieldDef.minLength}`
          });
        }
        
        if (fieldDef.maxLength !== undefined && value.length > fieldDef.maxLength) {
          errors.push({
            field: path,
            message: `La longitud debe ser menor o igual a ${fieldDef.maxLength}`
          });
        }
        
        if (fieldDef.pattern !== undefined) {
          const regex = new RegExp(fieldDef.pattern);
          if (!regex.test(value)) {
            errors.push({
              field: path,
              message: `El valor no coincide con el patrón requerido`
            });
          }
        }
      }
  
      // Validación de enumeración
      if (fieldDef.enum !== undefined && !fieldDef.enum.includes(value)) {
        errors.push({
          field: path,
          message: `El valor debe ser uno de: ${fieldDef.enum.join(', ')}`
        });
      }
  
      // Validación de objetos anidados
      if (typeof value === 'object' && !Array.isArray(value) && fieldDef.properties) {
        Object.entries(fieldDef.properties).forEach(([propName, propDef]) => {
          if (propName in value) {
            const propErrors = SchemaValidator.validateField(
              value[propName], 
              propDef, 
              `${path}.${propName}`
            );
            errors.push(...propErrors);
          } else if (propDef.required) {
            errors.push({
              field: `${path}.${propName}`,
              message: `El campo es requerido`
            });
          }
        });
      }
  
      // Validación de arrays
      if (Array.isArray(value) && fieldDef.items) {
        value.forEach((item, index) => {
          const itemErrors = SchemaValidator.validateField(
            item,
            fieldDef.items!,
            `${path}[${index}]`
          );
          errors.push(...itemErrors);
        });
      }
  
      // Validación personalizada
      if (fieldDef.validate) {
        const result = fieldDef.validate(value);
        if (result !== true) {
          errors.push({
            field: path,
            message: typeof result === 'string' ? result : 'Validación personalizada fallida'
          });
        }
      }
  
      return errors;
    }
  
    /**
     * Valida si un valor es del tipo especificado
     */
    private static validateType(value: any, type: string | string[]): boolean {
      const types = Array.isArray(type) ? type : [type];
      
      return types.some(t => {
        switch (t) {
          case 'string':
            return typeof value === 'string';
          case 'number':
            return typeof value === 'number';
          case 'boolean':
            return typeof value === 'boolean';
          case 'object':
            return typeof value === 'object' && value !== null && !Array.isArray(value);
          case 'array':
            return Array.isArray(value);
          case 'null':
            return value === null;
          case 'any':
            return true;
          default:
            return false;
        }
      });
    }
  
    /**
     * Aplica transformaciones y valores por defecto según el esquema
     * @param data Datos a transformar
     * @param schema Esquema con transformaciones
     * @param isNew Si es un nuevo objeto (para aplicar valores por defecto)
     */
    public static transform(data: any, schema: SchemaDefinition, isNew = true): any {
      const result = { ...data };
      
      // Procesar cada campo del esquema
      Object.entries(schema.fields).forEach(([fieldName, fieldDef]) => {
        // Si el campo no existe y es nuevo, aplicar valor por defecto
        if (!(fieldName in result) && isNew && fieldDef.defaultValue !== undefined) {
          result[fieldName] = typeof fieldDef.defaultValue === 'function'
            ? fieldDef.defaultValue()
            : fieldDef.defaultValue;
        }
        
        // Si el campo existe y tiene transformador, aplicarlo
        if (fieldName in result && fieldDef.transform) {
          result[fieldName] = fieldDef.transform(result[fieldName]);
        }
        
        // Procesar objetos anidados
        if (result[fieldName] && typeof result[fieldName] === 'object' && !Array.isArray(result[fieldName]) && fieldDef.properties) {
          result[fieldName] = SchemaValidator.transform(result[fieldName], {
            name: `${schema.name}.${fieldName}`,
            fields: fieldDef.properties
          }, isNew);
        }
        
        // Procesar arrays
        if (Array.isArray(result[fieldName]) && fieldDef.items) {
          result[fieldName] = result[fieldName].map((item: any) => {
            if (typeof item === 'object' && fieldDef.items!.properties) {
              return SchemaValidator.transform(item, {
                name: `${schema.name}.${fieldName}[]`,
                fields: fieldDef.items!.properties
              }, isNew);
            }
            
            return fieldDef.items!.transform ? fieldDef.items!.transform(item) : item;
          });
        }
      });
      
      // Agregar timestamps si están habilitados
      if (schema.timestamps && isNew) {
        const now = new Date().toISOString();
        result.createdAt = now;
        result.updatedAt = now;
      } else if (schema.timestamps && !isNew) {
        result.updatedAt = new Date().toISOString();
      }
      
      return result;
    }
  }