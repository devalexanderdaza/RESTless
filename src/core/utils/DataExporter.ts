/**
 * Formatos de exportación soportados
 */
export type ExportFormat = 'json' | 'csv';

/**
 * Utilidad para exportar e importar datos en diferentes formatos
 */
export class DataExporter {
  /**
   * Exporta los datos al formato especificado
   * @param data Datos a exportar
   * @param format Formato de exportación
   */
  public static export(data: Record<string, any[]>, format: ExportFormat = 'json'): string {
    switch (format) {
      case 'json':
        return DataExporter.exportToJSON(data);
      case 'csv':
        return DataExporter.exportToCSV(data);
      default:
        return DataExporter.exportToJSON(data);
    }
  }

  /**
   * Importa datos desde una cadena en el formato especificado
   * @param content Contenido a importar
   * @param format Formato del contenido
   */
  public static import(content: string, format: ExportFormat = 'json'): Record<string, any[]> {
    switch (format) {
      case 'json':
        return DataExporter.importFromJSON(content);
      case 'csv':
        return DataExporter.importFromCSV(content);
      default:
        return DataExporter.importFromJSON(content);
    }
  }

  /**
   * Exporta datos a formato JSON
   */
  private static exportToJSON(data: Record<string, any[]>): string {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Importa datos desde formato JSON
   */
  private static importFromJSON(content: string): Record<string, any[]> {
    try {
      return JSON.parse(content);
    } catch (error) {
      throw new Error('El contenido JSON no es válido');
    }
  }

  /**
   * Exporta datos a formato CSV
   * Genera un CSV para cada colección y los combina
   */
  private static exportToCSV(data: Record<string, any[]>): string {
    const csvParts: string[] = [];
    
    for (const [collection, items] of Object.entries(data)) {
      if (items.length === 0) continue;
      
      // Obtener encabezados del primer elemento
      const headers = Object.keys(items[0]);
      
      // Crear encabezado del CSV con el nombre de la colección
      csvParts.push(`# Collection: ${collection}`);
      csvParts.push(headers.join(','));
      
      // Agregar filas de datos
      items.forEach(item => {
        const row = headers.map(header => {
          const value = item[header];
          
          // Manejar diferentes tipos de datos
          if (value === null || value === undefined) {
            return '';
          } else if (typeof value === 'object') {
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          } else if (typeof value === 'string') {
            return `"${value.replace(/"/g, '""')}"`;
          } else {
            return String(value);
          }
        });
        
        csvParts.push(row.join(','));
      });
      
      // Separador entre colecciones
      csvParts.push('\n');
    }
    
    return csvParts.join('\n');
  }

  /**
   * Importa datos desde formato CSV
   * Espera un formato específico con marcadores de colección
   */
  private static importFromCSV(content: string): Record<string, any[]> {
    const result: Record<string, any[]> = {};
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    let currentCollection = '';
    let headers: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Si es un marcador de colección
      if (line.startsWith('# Collection:')) {
        currentCollection = line.substring('# Collection:'.length).trim();
        result[currentCollection] = [];
        headers = [];
      } 
      // Si son encabezados
      else if (headers.length === 0 && currentCollection !== '') {
        headers = line.split(',').map(header => header.trim());
      } 
      // Si son datos
      else if (headers.length > 0 && currentCollection !== '') {
        const item: Record<string, any> = {};
        const values = DataExporter.parseCSVLine(line);
        
        headers.forEach((header, index) => {
          let value: any = values[index] || '';
          
          // Intentar convertir a tipos primitivos
          if (value === '') {
            value = '';
          } else if (value === 'true') {
            value = true;
          } else if (value === 'false') {
            value = false;
          } else if (!isNaN(Number(value)) && value.trim() !== '') {
            value = Number(value);
          } else if (value.startsWith('{') || value.startsWith('[')) {
            try {
              value = JSON.parse(value);
            } catch (e) {
              // Si no es JSON válido, mantener como string
            }
          }
          
          item[header] = value;
        });
        
        result[currentCollection].push(item);
      }
    }
    
    return result;
  }

  /**
   * Analiza una línea CSV considerando comillas
   */
  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (i < line.length - 1 && line[i + 1] === '"') {
          current += '"';
          i++; // Saltar la siguiente comilla
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }

  /**
   * Descarga el contenido como un archivo
   * @param content Contenido a descargar
   * @param filename Nombre del archivo
   * @param mimeType Tipo MIME del archivo
   */
  public static downloadAs(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }
}