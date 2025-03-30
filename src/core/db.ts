export class Database {
  private storageKey: string;
  private data: Record<string, any[]>;

  constructor(storageKey: string = 'browser-api-db') {
    this.storageKey = storageKey;
    this.data = this.load();
  }

  private load(): Record<string, any[]> {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : {};
  }

  private save(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.data));
  }

  // Inicializa la base de datos con datos iniciales
  public async initialize(initialData: Record<string, any[]>): Promise<void> {
    this.data = initialData;
    this.save();
  }

  // Obtiene todas las colecciones
  public getCollections(): string[] {
    return Object.keys(this.data);
  }

  // Verifica si existe una colección
  public hasCollection(collection: string): boolean {
    return !!this.data[collection];
  }

  // Crea una colección si no existe
  public createCollection(collection: string): void {
    if (!this.data[collection]) {
      this.data[collection] = [];
      this.save();
    }
  }

  // Obtiene todos los elementos de una colección
  public getAll(collection: string): any[] {
    return this.hasCollection(collection) ? [...this.data[collection]] : [];
  }

  // Obtiene un elemento por ID
  public getById(collection: string, id: string | number): any {
    if (!this.hasCollection(collection)) return null;
    return this.data[collection].find((item) => item.id === id);
  }

  // Añade un elemento a una colección
  public add(collection: string, item: any): any {
    this.createCollection(collection);

    // Asignar ID si no tiene
    if (!item.id) {
      const maxId = this.data[collection].reduce(
        (max, current) => (current.id > max ? current.id : max),
        0
      );
      item.id = maxId + 1;
    }

    this.data[collection].push(item);
    this.save();
    return item;
  }

  // Actualiza un elemento existente
  public update(collection: string, id: string | number, updates: any): any {
    if (!this.hasCollection(collection)) return null;

    const index = this.data[collection].findIndex((item) => item.id === id);
    if (index === -1) return null;

    const updated = { ...this.data[collection][index], ...updates };
    this.data[collection][index] = updated;
    this.save();
    return updated;
  }

  // Elimina un elemento por ID
  public remove(collection: string, id: string | number): boolean {
    if (!this.hasCollection(collection)) return false;

    const initialLength = this.data[collection].length;
    this.data[collection] = this.data[collection].filter((item) => item.id !== id);

    if (initialLength !== this.data[collection].length) {
      this.save();
      return true;
    }
    return false;
  }

  // Consulta avanzada con filtros
  public query(collection: string, filters: Record<string, any>): any[] {
    if (!this.hasCollection(collection)) return [];

    return this.data[collection].filter((item) => {
      return Object.entries(filters).every(([key, value]) => {
        return item[key] === value;
      });
    });
  }
}
