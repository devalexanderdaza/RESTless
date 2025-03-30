export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface Request {
  method: HttpMethod;
  path: string;
  params: Record<string, string>;
  query: Record<string, string>;
  headers: Record<string, string>;
  body: any;
}

export interface Response {
  status: number;
  headers: Record<string, string>;
  body: any;
}

export type RouteHandler = (req: Request) => Promise<Response>;

export interface Route {
  method: HttpMethod;
  path: string;
  handler: RouteHandler;
}

export interface Middleware {
  (req: Request, next: RouteHandler): Promise<Response>;
}