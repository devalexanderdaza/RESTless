import { Component } from './Component';
import { ExportFormat, DataExporter } from '../../core/utils/DataExporter';

export class DataManager extends Component {
  private collections!: HTMLSelectElement;
  private dataTable!: HTMLTableElement;
  private importExportArea!: HTMLElement;
  private dataTextarea!: HTMLTextAreaElement;
  private formatSelect!: HTMLSelectElement;
  private storageToggle!: HTMLInputElement;

  private onCollectionSelect: (collection: string) => Promise<void>;
  private onImportData: (jsonData: string) => Promise<void>;
  private onExportData: () => Promise<Record<string, any[]>>;
  private onChangeStorage: (useIndexedDB: boolean) => Promise<void>;

  constructor(
    onCollectionSelect: (collection: string) => Promise<void>,
    onImportData: (jsonData: string) => Promise<void>,
    onExportData: () => Promise<Record<string, any[]>>,
    onChangeStorage: (useIndexedDB: boolean) => Promise<void>
  ) {
    super('div', 'data-manager');
    
    this.onCollectionSelect = onCollectionSelect;
    this.onImportData = onImportData;
    this.onExportData = onExportData;
    this.onChangeStorage = onChangeStorage;

    this.createStorageSelector();
    this.createCollectionSelector();
    this.createDataTable();
    this.createImportExportArea();
  }

  private createStorageSelector(): void {
    const container = document.createElement('div');
    container.className = 'storage-selector';
    
    const label = document.createElement('label');
    label.innerText = 'Usar IndexedDB:';
    label.htmlFor = 'storage-toggle';
    
    this.storageToggle = document.createElement('input');
    this.storageToggle.type = 'checkbox';
    this.storageToggle.id = 'storage-toggle';
    
    this.storageToggle.addEventListener('change', this.handleStorageChange.bind(this));
    
    container.appendChild(label);
    container.appendChild(this.storageToggle);
    this.element.appendChild(container);
  }

  private createCollectionSelector(): void {
    const container = document.createElement('div');
    container.className = 'collection-selector';
    
    const label = document.createElement('label');
    label.innerText = 'Colección:';
    label.htmlFor = 'collection-select';
    
    this.collections = document.createElement('select');
    this.collections.id = 'collection-select';
    
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.innerText = '-- Seleccionar colección --';
    this.collections.appendChild(defaultOption);
    
    this.collections.addEventListener('change', this.handleCollectionChange.bind(this));
    
    container.appendChild(label);
    container.appendChild(this.collections);
    this.element.appendChild(container);
  }

  private createDataTable(): void {
    const container = document.createElement('div');
    container.className = 'data-table-container';
    
    this.dataTable = document.createElement('table');
    this.dataTable.className = 'data-table';
    
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'empty-message';
    emptyMessage.innerText = 'Selecciona una colección para ver los datos';
    
    container.appendChild(emptyMessage);
    container.appendChild(this.dataTable);
    this.element.appendChild(container);
  }

  private createImportExportArea(): void {
    this.importExportArea = document.createElement('div');
    this.importExportArea.className = 'import-export-area';
    
    const title = document.createElement('h3');
    title.innerText = 'Importar / Exportar datos';
    
    // Selector de formato
    const formatContainer = document.createElement('div');
    formatContainer.className = 'format-selector';
    
    const formatLabel = document.createElement('label');
    formatLabel.innerText = 'Formato:';
    formatLabel.htmlFor = 'format-select';
    
    this.formatSelect = document.createElement('select');
    this.formatSelect.id = 'format-select';
    
    const jsonOption = document.createElement('option');
    jsonOption.value = 'json';
    jsonOption.innerText = 'JSON';
    
    const csvOption = document.createElement('option');
    csvOption.value = 'csv';
    csvOption.innerText = 'CSV';
    
    this.formatSelect.appendChild(jsonOption);
    this.formatSelect.appendChild(csvOption);
    
    formatContainer.appendChild(formatLabel);
    formatContainer.appendChild(this.formatSelect);
    
    // Área de texto
    this.dataTextarea = document.createElement('textarea');
    this.dataTextarea.className = 'data-textarea';
    this.dataTextarea.rows = 10;
    this.dataTextarea.placeholder = 'Pega aquí los datos para importar';
    
    // Contenedor de botones
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    
    // Botones de importación/exportación
    const importButton = document.createElement('button');
    importButton.innerText = 'Importar';
    importButton.addEventListener('click', this.handleImport.bind(this));
    
    const exportButton = document.createElement('button');
    exportButton.innerText = 'Exportar';
    exportButton.addEventListener('click', this.handleExport.bind(this));
    
    // Botón de descarga
    const downloadButton = document.createElement('button');
    downloadButton.innerText = 'Descargar';
    downloadButton.addEventListener('click', this.handleDownload.bind(this));
    
    buttonContainer.appendChild(importButton);
    buttonContainer.appendChild(exportButton);
    buttonContainer.appendChild(downloadButton);
    
    this.importExportArea.appendChild(title);
    this.importExportArea.appendChild(formatContainer);
    this.importExportArea.appendChild(this.dataTextarea);
    this.importExportArea.appendChild(buttonContainer);
    
    this.element.appendChild(this.importExportArea);
  }

  private async handleCollectionChange(): Promise<void> {
    const collection = this.collections.value;
    if (collection) {
      await this.onCollectionSelect(collection);
    } else {
      this.clearTable();
    }
  }

  private async handleImport(): Promise<void> {
    try {
      const content = this.dataTextarea.value.trim();
      if (!content) {
        alert('Por favor, ingresa datos válidos');
        return;
      }
      
      const format = this.formatSelect.value as ExportFormat;
      const data = DataExporter.import(content, format);
      
      await this.onImportData(JSON.stringify(data));
      alert('Datos importados correctamente');
      this.dataTextarea.value = '';

      // Obtener las colecciones actuales
      const collections = await this.onExportData();

      // Limpiar el área de texto
      this.dataTextarea.placeholder = 'Pega aquí los datos para importar';
      
      // Limpiar la tabla de datos
      this.clearTable();

      // Actualizar la lista de colecciones
      this.updateCollections(Object.keys(collections));
    } catch (error) {
      console.error('Error al importar datos:', error);
      alert(`Error al importar datos: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async handleExport(): Promise<void> {
    try {
      const data = await this.onExportData();
      const format = this.formatSelect.value as ExportFormat;
      const exported = DataExporter.export(data, format);
      
      this.dataTextarea.value = exported;
    } catch (error) {
      console.error('Error al exportar datos:', error);
      alert(`Error al exportar datos: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async handleDownload(): Promise<void> {
    try {
      const format = this.formatSelect.value as ExportFormat;
      const data = await this.onExportData();
      const content = DataExporter.export(data, format);
      
      const filename = `restless-data.${format}`;
      const mimeType = format === 'json' ? 'application/json' : 'text/csv';
      
      DataExporter.downloadAs(content, filename, mimeType);
    } catch (error) {
      console.error('Error al descargar datos:', error);
      alert(`Error al descargar datos: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async handleStorageChange(): Promise<void> {
    try {
      const useIndexedDB = this.storageToggle.checked;
      const currentStorageType = useIndexedDB ? 'indexedDB' : 'localStorage';
      const confirmation = confirm(`¿Estás seguro de que deseas cambiar el almacenamiento a ${currentStorageType}?`);

      if (!confirmation) {
        this.storageToggle.checked = !useIndexedDB; // Revertir el cambio en la UI
        return;
      }
      // Cambiar el almacenamiento
      await this.onChangeStorage(useIndexedDB);
      // Actualizar la UI
      this.storageToggle.checked = useIndexedDB;
      // Mostrar mensaje de éxito      
      alert(`Almacenamiento cambiado a ${useIndexedDB ? 'IndexedDB' : 'localStorage'}`);

      // Obtener las colecciones actuales
      const collections = await this.onExportData();

      // Actualizar la lista de colecciones
      this.updateCollections(Object.keys(collections));

      // Limpiar la tabla de datos
      this.clearTable();
      
      // Limpiar el área de texto
      this.dataTextarea.value = '';
      
      // Limpiar el textarea
      this.dataTextarea.placeholder = `Pega aquí los datos para importar (${useIndexedDB ? 'IndexedDB' : 'localStorage'})`;
    } catch (error) {
      console.error('Error al cambiar el almacenamiento:', error);
      alert(`Error al cambiar el almacenamiento: ${error instanceof Error ? error.message : String(error)}`);
      
      // Revertir el cambio en la UI
      this.storageToggle.checked = !this.storageToggle.checked;
    }
  }

  public updateCollections(collections: string[] = []): void {
    // Guardar la selección actual
    const currentSelection = this.collections.value;
    
    // Limpiar opciones existentes excepto la predeterminada
    while (this.collections.options.length > 1) {
      this.collections.remove(1);
    }
    
    // Añadir nuevas opciones
    collections.forEach(collection => {
      const option = document.createElement('option');
      option.value = collection;
      option.innerText = collection;
      this.collections.appendChild(option);
    });
    
    // Restaurar la selección si existe
    if (currentSelection && collections.includes(currentSelection)) {
      this.collections.value = currentSelection;
    }
  }

  public displayData(data: any[]): void {
    this.clearTable();
    
    if (!data.length) {
      this.dataTable.innerHTML = '<tr><td colspan="3">No hay datos disponibles</td></tr>';
      return;
    }
    
    // Crear encabezados
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    // Obtener todas las claves posibles
    const keys = new Set<string>();
    data.forEach(item => {
      Object.keys(item).forEach(key => keys.add(key));
    });
    
    // Asegurarnos de que 'id' está primero
    const sortedKeys = ['id', ...Array.from(keys).filter(key => key !== 'id')];
    
    // Crear celdas de encabezado
    sortedKeys.forEach(key => {
      const th = document.createElement('th');
      th.innerText = key;
      headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    this.dataTable.appendChild(thead);
    
    // Crear cuerpo de la tabla
    const tbody = document.createElement('tbody');
    
    data.forEach(item => {
      const row = document.createElement('tr');
      
      sortedKeys.forEach(key => {
        const cell = document.createElement('td');
        
        if (item[key] !== undefined) {
          const value = typeof item[key] === 'object'
            ? JSON.stringify(item[key])
            : String(item[key]);
          
          cell.innerText = value;
        } else {
          cell.innerText = '';
        }
        
        row.appendChild(cell);
      });
      
      tbody.appendChild(row);
    });
    
    this.dataTable.appendChild(tbody);
  }

  private clearTable(): void {
    this.dataTable.innerHTML = '';
  }
}