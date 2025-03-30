export class Component {
    protected element: HTMLElement;
  
    constructor(tagName: string = 'div', className: string = '') {
      this.element = document.createElement(tagName);
      if (className) {
        this.element.className = className;
      }
    }
  
    public getElement(): HTMLElement {
      return this.element;
    }
  
    public appendTo(parent: HTMLElement | Component): void {
      if (parent instanceof Component) {
        parent.getElement().appendChild(this.element);
      } else {
        parent.appendChild(this.element);
      }
    }
  }
  
  export class ApiConsole extends Component {
    private requestForm: HTMLFormElement;
    private methodSelect: HTMLSelectElement;
    private urlInput: HTMLInputElement;
    private bodyTextarea: HTMLTextAreaElement;
    private sendButton: HTMLButtonElement;
    private responseArea: HTMLElement;
  
    private onSendRequest: (method: string, url: string, body: string) => Promise<void>;
  
    constructor(onSendRequest: (method: string, url: string, body: string) => Promise<void>) {
      super('div', 'api-console');
      this.onSendRequest = onSendRequest;
  
      this.createForm();
      this.createResponseArea();
    }
  
    private createForm(): void {
      this.requestForm = document.createElement('form');
      this.requestForm.className = 'request-form';
      this.element.appendChild(this.requestForm);
  
      // Método HTTP
      const methodContainer = document.createElement('div');
      methodContainer.className = 'form-group';
      
      const methodLabel = document.createElement('label');
      methodLabel.innerText = 'Método:';
      methodLabel.htmlFor = 'method-select';
      
      this.methodSelect = document.createElement('select');
      this.methodSelect.id = 'method-select';
      
      ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].forEach(method => {
        const option = document.createElement('option');
        option.value = method;
        option.innerText = method;
        this.methodSelect.appendChild(option);
      });
  
      methodContainer.appendChild(methodLabel);
      methodContainer.appendChild(this.methodSelect);
      this.requestForm.appendChild(methodContainer);
  
      // URL
      const urlContainer = document.createElement('div');
      urlContainer.className = 'form-group';
      
      const urlLabel = document.createElement('label');
      urlLabel.innerText = 'URL:';
      urlLabel.htmlFor = 'url-input';
      
      this.urlInput = document.createElement('input');
      this.urlInput.id = 'url-input';
      this.urlInput.type = 'text';
      this.urlInput.placeholder = '/api/...';
      this.urlInput.value = '/api/';
      
      urlContainer.appendChild(urlLabel);
      urlContainer.appendChild(this.urlInput);
      this.requestForm.appendChild(urlContainer);
  
      // Cuerpo
      const bodyContainer = document.createElement('div');
      bodyContainer.className = 'form-group';
      
      const bodyLabel = document.createElement('label');
      bodyLabel.innerText = 'Cuerpo:';
      bodyLabel.htmlFor = 'body-textarea';
      
      this.bodyTextarea = document.createElement('textarea');
      this.bodyTextarea.id = 'body-textarea';
      this.bodyTextarea.placeholder = 'Cuerpo JSON (para POST, PUT, PATCH)';
      this.bodyTextarea.rows = 5;
      
      bodyContainer.appendChild(bodyLabel);
      bodyContainer.appendChild(this.bodyTextarea);
      this.requestForm.appendChild(bodyContainer);
  
      // Botón de envío
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'form-group';
      
      this.sendButton = document.createElement('button');
      this.sendButton.type = 'submit';
      this.sendButton.innerText = 'Enviar solicitud';
      
      buttonContainer.appendChild(this.sendButton);
      this.requestForm.appendChild(buttonContainer);
  
      // Evento de envío
      this.requestForm.addEventListener('submit', this.handleSubmit.bind(this));
    }
  
    private createResponseArea(): void {
      const responseContainer = document.createElement('div');
      responseContainer.className = 'response-container';
      
      const responseTitle = document.createElement('h3');
      responseTitle.innerText = 'Respuesta';
      
      this.responseArea = document.createElement('pre');
      this.responseArea.className = 'response-area';
      
      responseContainer.appendChild(responseTitle);
      responseContainer.appendChild(this.responseArea);
      this.element.appendChild(responseContainer);
    }
  
    private async handleSubmit(event: Event): Promise<void> {
      event.preventDefault();
      
      const method = this.methodSelect.value;
      const url = this.urlInput.value;
      const body = this.bodyTextarea.value;
      
      this.sendButton.disabled = true;
      this.sendButton.innerText = 'Enviando...';
      
      try {
        await this.onSendRequest(method, url, body);
      } catch (error) {
        console.error('Error al enviar la solicitud:', error);
        this.displayResponse({
          status: 500,
          headers: { 'Content-Type': 'application/json' },
          body: { error: 'Error al enviar la solicitud' }
        });
      } finally {
        this.sendButton.disabled = false;
        this.sendButton.innerText = 'Enviar solicitud';
      }
    }
  
    public displayResponse(response: any): void {
      const formatted = JSON.stringify(response, null, 2);
      this.responseArea.textContent = formatted;
    }
  }
  
  export class DataManager extends Component {
    private collections: HTMLSelectElement;
    private dataTable: HTMLTableElement;
    private importExportArea: HTMLElement;
    private dataTextarea: HTMLTextAreaElement;
  
    private onCollectionSelect: (collection: string) => Promise<void>;
    private onImportData: (jsonData: string) => Promise<void>;
    private onExportData: () => Promise<string>;
  
    constructor(
      onCollectionSelect: (collection: string) => Promise<void>,
      onImportData: (jsonData: string) => Promise<void>,
      onExportData: () => Promise<string>
    ) {
      super('div', 'data-manager');
      
      this.onCollectionSelect = onCollectionSelect;
      this.onImportData = onImportData;
      this.onExportData = onExportData;
  
      this.createCollectionSelector();
      this.createDataTable();
      this.createImportExportArea();
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
      
      this.dataTextarea = document.createElement('textarea');
      this.dataTextarea.className = 'data-textarea';
      this.dataTextarea.rows = 10;
      this.dataTextarea.placeholder = 'Pega aquí los datos JSON para importar';
      
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'button-container';
      
      const importButton = document.createElement('button');
      importButton.innerText = 'Importar';
      importButton.addEventListener('click', this.handleImport.bind(this));
      
      const exportButton = document.createElement('button');
      exportButton.innerText = 'Exportar';
      exportButton.addEventListener('click', this.handleExport.bind(this));
      
      buttonContainer.appendChild(importButton);
      buttonContainer.appendChild(exportButton);
      
      this.importExportArea.appendChild(title);
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
        const jsonData = this.dataTextarea.value.trim();
        if (!jsonData) {
          alert('Por favor, ingresa datos JSON válidos');
          return;
        }
        
        await this.onImportData(jsonData);
        alert('Datos importados correctamente');
        this.dataTextarea.value = '';
        
        // Actualizar la lista de colecciones
        await this.updateCollections();
      } catch (error) {
        console.error('Error al importar datos:', error);
        alert('Error al importar datos. Asegúrate de que el JSON sea válido.');
      }
    }
  
    private async handleExport(): Promise<void> {
      try {
        const data = await this.onExportData();
        this.dataTextarea.value = data;
      } catch (error) {
        console.error('Error al exportar datos:', error);
        alert('Error al exportar datos');
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