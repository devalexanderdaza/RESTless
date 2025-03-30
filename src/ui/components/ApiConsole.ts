import { Component } from './Component';

export class ApiConsole extends Component {
  private requestForm!: HTMLFormElement;
  private methodSelect!: HTMLSelectElement;
  private urlInput!: HTMLInputElement;
  private bodyTextarea!: HTMLTextAreaElement;
  private sendButton!: HTMLButtonElement;
  private responseArea!: HTMLElement;

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
    
    // Añadir ayuda para parámetros
    const urlHelp = document.createElement('div');
    urlHelp.className = 'form-help';
    urlHelp.innerHTML = `
      <details>
        <summary>Parámetros de consulta avanzados</summary>
        <ul>
          <li><code>_page=1&_limit=10</code> - Paginación por offset</li>
          <li><code>_cursor=xxx&_limit=10</code> - Paginación por cursor</li>
          <li><code>_sort=field1,field2&_order=asc,desc</code> - Ordenamiento</li>
          <li><code>_q=texto</code> - Búsqueda de texto</li>
          <li><code>_fields=field1,field2</code> - Campos para búsqueda</li>
          <li><code>field_gt=100</code> - Mayor que (también: _lt, _gte, _lte, _ne)</li>
          <li><code>field_like=valor</code> - Contiene valor</li>
          <li><code>field_in=val1,val2</code> - Dentro de valores</li>
        </ul>
      </details>
    `;
    
    urlContainer.appendChild(urlLabel);
    urlContainer.appendChild(this.urlInput);
    urlContainer.appendChild(urlHelp);
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
    
    // Agregar botones de ayuda para ejemplos comunes
    const helpButtonsContainer = document.createElement('div');
    helpButtonsContainer.className = 'help-buttons';
    
    const paginationBtn = document.createElement('button');
    paginationBtn.type = 'button';
    paginationBtn.className = 'help-button';
    paginationBtn.innerText = 'Ejemplo de paginación';
    paginationBtn.addEventListener('click', () => {
      // Ejemplo de URL con paginación
      this.methodSelect.value = 'GET';
      this.urlInput.value = '/api/productos?_page=1&_limit=2';
      this.bodyTextarea.value = '';
    });
    
    const sortingBtn = document.createElement('button');
    sortingBtn.type = 'button';
    sortingBtn.className = 'help-button';
    sortingBtn.innerText = 'Ejemplo de ordenamiento';
    sortingBtn.addEventListener('click', () => {
      // Ejemplo de URL con ordenamiento
      this.methodSelect.value = 'GET';
      this.urlInput.value = '/api/productos?_sort=precio&_order=desc';
      this.bodyTextarea.value = '';
    });
    
    const filteringBtn = document.createElement('button');
    filteringBtn.type = 'button';
    filteringBtn.className = 'help-button';
    filteringBtn.innerText = 'Ejemplo de filtrado';
    filteringBtn.addEventListener('click', () => {
      // Ejemplo de URL con filtrado
      this.methodSelect.value = 'GET';
      this.urlInput.value = '/api/productos?precio_gt=500&stock_lte=15';
      this.bodyTextarea.value = '';
    });
    
    const searchBtn = document.createElement('button');
    searchBtn.type = 'button';
    searchBtn.className = 'help-button';
    searchBtn.innerText = 'Ejemplo de búsqueda';
    searchBtn.addEventListener('click', () => {
      // Ejemplo de URL con búsqueda
      this.methodSelect.value = 'GET';
      this.urlInput.value = '/api/productos?_q=lap&_fields=nombre,descripcion';
      this.bodyTextarea.value = '';
    });
    
    const expandBtn = document.createElement('button');
    expandBtn.type = 'button';
    expandBtn.className = 'help-button';
    expandBtn.innerText = 'Ejemplo de relaciones';
    expandBtn.addEventListener('click', () => {
      // Ejemplo de URL con expansión de relaciones
      this.methodSelect.value = 'GET';
      this.urlInput.value = '/api/pedidos/1?_expand=true&_expandDepth=2';
      this.bodyTextarea.value = '';
    });
    
    const schemaBtn = document.createElement('button');
    schemaBtn.type = 'button';
    schemaBtn.className = 'help-button';
    schemaBtn.innerText = 'Ver esquemas';
    schemaBtn.addEventListener('click', () => {
      // Ejemplo de URL para ver esquemas
      this.methodSelect.value = 'GET';
      this.urlInput.value = '/api/_schemas';
      this.bodyTextarea.value = '';
    });
    
    helpButtonsContainer.appendChild(paginationBtn);
    helpButtonsContainer.appendChild(sortingBtn);
    helpButtonsContainer.appendChild(filteringBtn);
    helpButtonsContainer.appendChild(searchBtn);
    helpButtonsContainer.appendChild(expandBtn);
    helpButtonsContainer.appendChild(schemaBtn);
    
    buttonContainer.appendChild(this.sendButton);
    buttonContainer.appendChild(helpButtonsContainer);
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