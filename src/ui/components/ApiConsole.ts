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