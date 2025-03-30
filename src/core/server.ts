import { Database } from './db';
import { Router } from './router';
import { HttpMethod, Response } from './types';

export class Server {
  private router: Router;
  private db: Database;
  private baseUrl: string;

  constructor() {
    this.router = new Router();
    this.db = new Database();
    this.baseUrl = '/api';
  }

  // Obtiene la instancia del router
  public getRouter(): Router {
    return this.router;
  }

  // Obtiene la instancia de la base de datos
  public getDb(): Database {
    return this.db;
  }

  // Establece la URL base para todas las rutas
  public setBaseUrl(url: string): void {
    this.baseUrl = url.startsWith('/') ? url : `/${url}`;
  }

  // Inicializa el servidor con datos
  public async initialize(initialData: Record<string, any[]>): Promise<void> {
    await this.db.initialize(initialData);
  }

  // Procesa una solicitud al servidor
  public async handleRequest(
    method: HttpMethod,
    url: string,
    headers: Record<string, string> = {},
    body: any = null
  ): Promise<Response> {
    // Si la URL no comienza con la URL base, no es para esta API
    if (!url.startsWith(this.baseUrl)) {
      return {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
        body: { error: 'Not Found' },
      };
    }

    // Eliminar la URL base del path
    const apiPath = url.substring(this.baseUrl.length);

    // Procesar la solicitud a través del router
    return this.router.handleRequest(method, apiPath, headers, body);
  }
}
