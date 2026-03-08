import { HttpMethod, Request, Response, Route, RouteHandler, Middleware } from './types';

export class Router {
  private routes: Route[] = [];
  private middlewares: Middleware[] = [];
  private notFoundHandler: RouteHandler = async () => ({
    status: 404,
    headers: { 'Content-Type': 'application/json' },
    body: { error: 'Not Found' },
  });

  // Añade un middleware a la cadena
  public use(middleware: Middleware): void {
    this.middlewares.push(middleware);
  }

  // Registra una ruta
  public register(method: HttpMethod, path: string, handler: RouteHandler): void {
    this.routes.push({ method, path, handler });
  }

  // Métodos de conveniencia para HTTP
  public get(path: string, handler: RouteHandler): void {
    this.register('GET', path, handler);
  }

  public post(path: string, handler: RouteHandler): void {
    this.register('POST', path, handler);
  }

  public put(path: string, handler: RouteHandler): void {
    this.register('PUT', path, handler);
  }

  public patch(path: string, handler: RouteHandler): void {
    this.register('PATCH', path, handler);
  }

  public delete(path: string, handler: RouteHandler): void {
    this.register('DELETE', path, handler);
  }

  // Define un manejador para rutas no encontradas
  public setNotFoundHandler(handler: RouteHandler): void {
    this.notFoundHandler = handler;
  }

  // Comprueba si una ruta coincide con una plantilla
  private matchRoute(routePath: string, requestPath: string): null | Record<string, string> {
    // Convertir la ruta en un patrón regex
    const pattern = routePath.replace(/\/:[^\/]+/g, '/([^/]+)').replace(/\//g, '\\/');

    const regex = new RegExp(`^${pattern}$`);
    const match = requestPath.match(regex);

    if (!match) return null;

    // Extraer parámetros de la URL
    const params: Record<string, string> = {};
    const paramNames = [...routePath.matchAll(/\/:([^\/]+)/g)].map((m) => m[1]);

    paramNames.forEach((name, index) => {
      params[name] = match[index + 1];
    });

    return params;
  }

  // Analiza los parámetros de consulta
  private parseQueryParams(url: string): Record<string, string> {
    const query: Record<string, string> = {};
    const queryString = url.split('?')[1];

    if (!queryString) return query;

    queryString.split('&').forEach((pair) => {
      const [key, value] = pair.split('=');
      if (key) query[key] = decodeURIComponent(value || '');
    });

    return query;
  }

  // Construye y procesa una solicitud
  public async handleRequest(
    method: HttpMethod,
    url: string,
    headers: Record<string, string> = {},
    body: any = null
  ): Promise<Response> {
    // Separar la ruta de los parámetros de consulta
    const [path, _queryString] = url.split('?');
    const query = this.parseQueryParams(url);

    // Buscar una ruta coincidente
    let matchedRoute: Route | null = null;
    let params: Record<string, string> = {};

    for (const route of this.routes) {
      if (route.method !== method) continue;

      const matchResult = this.matchRoute(route.path, path);
      if (matchResult) {
        matchedRoute = route;
        params = matchResult;
        break;
      }
    }

    if (!matchedRoute) {
      return this.notFoundHandler({
        method,
        path,
        params: {},
        query,
        headers,
        body,
      });
    }

    // Construir la solicitud
    const request: Request = {
      method,
      path,
      params,
      query,
      headers,
      body,
    };

    // Aplicar middlewares
    let handler: RouteHandler = matchedRoute.handler;

    // Aplicar middlewares en orden inverso
    for (let i = this.middlewares.length - 1; i >= 0; i--) {
      const middleware = this.middlewares[i];
      const nextHandler = handler;
      handler = async (req: Request) => middleware(req, nextHandler);
    }

    // Ejecutar la cadena de middlewares y el manejador
    return handler(request);
  }
}
