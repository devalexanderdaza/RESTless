import { Server } from '../core/server';
import { HttpMethod } from '../core/types';
import { ApiConsole } from './components/ApiConsole';
import { DataManager } from './components/DataManager';

export class App {
  private server: Server;
  private container: HTMLElement;
  private apiConsole!: ApiConsole;
  private dataManager!: DataManager;

  constructor(server: Server, containerId: string = 'app') {
    this.server = server;
    this.container = document.getElementById(containerId) || document.body;
    
    this.initialize();
  }

  private async initialize(): Promise<void> {
    this.createLayout();
    
    // Inicializar componentes de UI
    this.apiConsole = new ApiConsole(this.handleSendRequest.bind(this));
    this.apiConsole.appendTo(document.getElementById('api-section')!);
    
    this.dataManager = new DataManager(
      this.handleCollectionSelect.bind(this),
      this.handleImportData.bind(this),
      this.handleExportData.bind(this),
      this.handleChangeStorage.bind(this)
    );
    this.dataManager.appendTo(document.getElementById('data-section')!);
    
    // Cargar colecciones iniciales
    await this.loadCollections();
  }

  private createLayout(): void {
    this.container.innerHTML = '';
    
    // Crear encabezado
    const header = document.createElement('header');
    const title = document.createElement('h1');
    title.innerText = 'RESTless API';
    
    const subtitle = document.createElement('p');
    subtitle.innerText = 'API REST completamente en el navegador';
    
    header.appendChild(title);
    header.appendChild(subtitle);
    
    // Crear contenedor principal
    const main = document.createElement('main');
    
    // Sección de API
    const apiSection = document.createElement('section');
    apiSection.id = 'api-section';
    apiSection.className = 'section';
    
    const apiTitle = document.createElement('h2');
    apiTitle.innerText = 'Consola de API';
    apiSection.appendChild(apiTitle);
    
    // Sección de datos
    const dataSection = document.createElement('section');
    dataSection.id = 'data-section';
    dataSection.className = 'section';
    
    const dataTitle = document.createElement('h2');
    dataTitle.innerText = 'Gestión de Datos';
    dataSection.appendChild(dataTitle);
    
    // Añadir secciones al contenedor principal
    main.appendChild(apiSection);
    main.appendChild(dataSection);
    
    // Añadir todo al contenedor de la aplicación
    this.container.appendChild(header);
    this.container.appendChild(main);
  }

  private async handleSendRequest(method: string, url: string, body: string): Promise<void> {
    try {
      let parsedBody = null;
      
      if (body.trim() && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        try {
          parsedBody = JSON.parse(body);
        } catch (error) {
          this.apiConsole.displayResponse({
            status: 400,
            headers: { 'Content-Type': 'application/json' },
            body: { error: 'JSON inválido en el cuerpo de la solicitud' }
          });
          return;
        }
      }
      
      const response = await this.server.handleRequest(
        method as HttpMethod,
        url,
        { 'Content-Type': 'application/json' },
        parsedBody
      );
      
      this.apiConsole.displayResponse(response);
      
      // Actualizar colecciones después de modificaciones
      if (method !== 'GET') {
        await this.loadCollections();
      }
    } catch (error) {
      console.error('Error al procesar la solicitud:', error);
      this.apiConsole.displayResponse({
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: { error: 'Error interno al procesar la solicitud' }
      });
    }
  }

  private async handleCollectionSelect(collection: string): Promise<void> {
    try {
      const response = await this.server.handleRequest(
        'GET',
        `/api/${collection}`,
        { 'Content-Type': 'application/json' }
      );
      
      if (response.status === 200) {
        this.dataManager.displayData(response.body);
      } else {
        console.error('Error al cargar la colección:', response);
      }
    } catch (error) {
      console.error('Error al seleccionar la colección:', error);
    }
  }

  private async handleImportData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      await this.server.importData(data);
      await this.loadCollections();
    } catch (error) {
      console.error('Error al importar datos:', error);
      throw error;
    }
  }

  private async handleExportData(): Promise<Record<string, any[]>> {
    return await this.server.exportData();
  }

  private async handleChangeStorage(useIndexedDB: boolean): Promise<void> {
    try {
      const storageType = useIndexedDB ? 'indexedDB' : 'localStorage';
      await this.server.changeStorage(storageType);
    } catch (error) {
      console.error('Error al cambiar el almacenamiento:', error);
      throw error;
    }
  }

  private async loadCollections(): Promise<void> {
    try {
      const response = await this.server.handleRequest(
        'GET',
        '/api/',
        { 'Content-Type': 'application/json' }
      );
      
      if (response.status === 200 && response.body.collections) {
        this.dataManager.updateCollections(response.body.collections);
      }
    } catch (error) {
      console.error('Error al cargar colecciones:', error);
    }
  }
}