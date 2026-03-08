# Informe Técnico — RESTless

> Versión del análisis: marzo 2026  
> Autor del informe: GitHub Copilot  
> Repositorio: [devalexanderdaza/RESTless](https://github.com/devalexanderdaza/RESTless)

---

## Tabla de contenido

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [¿Qué hace el proyecto?](#2-qué-hace-el-proyecto)
3. [Arquitectura y diseño](#3-arquitectura-y-diseño)
4. [Stack tecnológico](#4-stack-tecnológico)
5. [Fortalezas y buenas prácticas](#5-fortalezas-y-buenas-prácticas)
6. [Bugs y fallos encontrados](#6-bugs-y-fallos-encontrados)
7. [Deuda técnica](#7-deuda-técnica)
8. [Oportunidades de mejora](#8-oportunidades-de-mejora)
9. [Seguridad](#9-seguridad)
10. [Evaluación general](#10-evaluación-general)

---

## 1. Resumen ejecutivo

**RESTless** es una API REST simulada que funciona completamente en el navegador, sin servidores externos ni dependencias en tiempo de ejecución. Está pensada como reemplazo de `json-server` para desarrollo frontend, prototipado y aprendizaje.

El proyecto demuestra conocimiento sólido de TypeScript y patrones de diseño, con una arquitectura modular y bien separada. Sin embargo, presenta deuda técnica significativa: **no tiene pruebas automatizadas**, incluye código que no funciona en navegadores (uso de `Buffer` de Node.js) y mantiene configuraciones duplicadas, inconsistencias de versiones y otras fricciones que limitarían su adopción a escala.

---

## 2. ¿Qué hace el proyecto?

RESTless proporciona un servidor REST completo que vive en memoria en el navegador. Su flujo de trabajo es:

```
URL en el navegador
       ↓
   Server.handleRequest()
       ↓
   Router → coincide ruta + extrae params
       ↓
   Cadena de Middlewares (logger → delay → errorHandler)
       ↓
   Handler del endpoint (endpoints.ts)
       ↓
   SchemaValidator / RelationManager
       ↓
   Database (in-memory) → StorageAdapter (localStorage / IndexedDB)
       ↓
   Response { status, headers, body }
```

### Funcionalidades principales

| Funcionalidad | Descripción |
|---|---|
| CRUD completo | GET, POST, PUT, PATCH, DELETE sobre colecciones dinámicas |
| Persistencia | localStorage e IndexedDB como opciones intercambiables |
| Validación de esquema | Tipos, rangos, patrones, enums, funciones personalizadas |
| Relaciones | oneToOne, oneToMany, manyToOne, manyToMany con acciones en cascada |
| Consultas avanzadas | Filtros, ordenamiento, paginación (offset y cursor), búsqueda full-text |
| Importación / Exportación | Formatos JSON y CSV |
| UI interactiva | Consola de API y gestor de datos construidos con DOM nativo |
| Middlewares | Logger, manejo de errores y simulación de latencia de red |

---

## 3. Arquitectura y diseño

### Estructura de directorios

```
src/
├── main.ts                  # Punto de entrada: inicialización y configuración
├── index.ts                 # Exportaciones públicas de la librería
├── api/
│   ├── endpoints.ts         # Definición de todos los endpoints REST
│   └── middlewares.ts       # Logger, error handler, delay
├── core/
│   ├── server.ts            # Orquestador principal (Server)
│   ├── router.ts            # Enrutador HTTP en memoria
│   ├── db.ts                # Base de datos in-memory con adaptadores
│   ├── types.ts             # Tipos centrales (Request, Response, etc.)
│   ├── query/               # Motor de consultas
│   │   ├── QueryParser.ts   # Convierte query strings → QueryOptions
│   │   ├── QueryProcessor.ts# Aplica filtros, sort y paginación
│   │   └── types.ts         # Tipos del sistema de consultas
│   ├── schema/              # Validación y relaciones
│   │   ├── SchemaValidator.ts
│   │   ├── SchemaRegistry.ts
│   │   ├── RelationManager.ts
│   │   └── types.ts
│   ├── storage/             # Adaptadores de persistencia
│   │   ├── StorageAdapter.ts     # Interfaz (contrato)
│   │   ├── LocalStorageAdapter.ts
│   │   └── IndexedDBAdapter.ts
│   └── utils/
│       ├── DataExporter.ts  # Exportación JSON / CSV
│       └── HashUtils.ts     # Utilidades de hash (sin uso actual)
├── ui/
│   ├── app.ts               # Clase App (UI principal)
│   └── components/          # ApiConsole, DataManager, Component base
└── schemas/
    └── index.ts             # Esquemas de ejemplo
```

### Patrones de diseño identificados

- **Adapter** — `StorageAdapter` / `LocalStorageAdapter` / `IndexedDBAdapter`: el sistema de persistencia es intercambiable sin cambiar el resto del código.
- **Chain of Responsibility** — La cadena de middlewares (análoga a Express.js): cada middleware puede cortocircuitar o delegar al siguiente.
- **Singleton** — `SchemaRegistry` garantiza un registro de esquemas único durante la sesión.
- **Registry** — `SchemaRegistry` centraliza la gestión de esquemas y relaciones.
- **Template Method** — `Component` define la estructura base de los componentes UI, dejando detalles a las subclases.
- **Strategy** — `QueryProcessor` elige entre paginación por offset y por cursor según el tipo de paginación recibido.

---

## 4. Stack tecnológico

| Herramienta | Versión | Rol |
|---|---|---|
| TypeScript | ~5.7.2 | Lenguaje principal |
| Vite | ^6.2.0 | Bundler y servidor de desarrollo |
| ESLint | ^9.23.0 | Linting de código |
| Prettier | ^3.5.3 | Formato de código |
| pnpm | ≥9.0.0 | Gestor de paquetes |
| Node.js | ≥18.0.0 | Entorno de desarrollo |
| vitest | (referenciado) | Framework de pruebas — **no instalado** |

**Dependencias en producción:** ninguna. Todo el código usa únicamente APIs del navegador (localStorage, IndexedDB, Web Crypto API, Fetch API, DOM).

---

## 5. Fortalezas y buenas prácticas

### ✅ Cero dependencias en runtime
El proyecto no requiere ningún paquete externo para ejecutarse. Usa exclusivamente APIs nativas del navegador, lo que lo hace ideal para distribuir como una librería self-contained o via CDN.

### ✅ TypeScript estricto
El `tsconfig.json` tiene `"strict": true`, `"noUnusedLocals": true`, `"noUnusedParameters": true` y `"noFallthroughCasesInSwitch": true`. Esto obliga a un código más seguro y reduce bugs en tiempo de compilación.

### ✅ Separación de responsabilidades clara
Cada módulo tiene una responsabilidad única y bien definida. El `Server` orquesta sin conocer detalles de almacenamiento; el `Router` enruta sin conocer datos de negocio; el `Database` almacena sin conocer esquemas.

### ✅ Patrón Adapter para almacenamiento
La abstracción `StorageAdapter` permite cambiar la capa de persistencia (localStorage ↔ IndexedDB) en tiempo de ejecución, sin modificar el resto del sistema.

### ✅ Sistema de consultas expresivo
`QueryProcessor` y `QueryParser` implementan un motor de consultas con operadores de comparación (`=`, `!=`, `>`, `like`, `in`, `nin`), grupos lógicos (`and`, `or`, `not`), ordenamiento multi-campo, dos estrategias de paginación y búsqueda full-text.

### ✅ Validación y transformación de datos
`SchemaValidator` soporta tipos, rangos numéricos, longitudes de cadenas, patrones regex, enums, objetos anidados, arrays y funciones de validación y transformación personalizadas. La separación entre `validate()` y `transform()` es una buena práctica.

### ✅ Gestión de relaciones
`RelationManager` implementa expansión de relaciones (`_expand`), acciones referencial en cascada (`cascade`, `restrict`, `setNull`, `setDefault`) para eliminaciones y actualizaciones. Esto es una funcionalidad avanzada para un mock server.

### ✅ Middlewares reutilizables
La arquitectura de middlewares es similar a Express.js y permite componer comportamiento (logging, manejo de errores, simulación de latencia) de forma limpia y desacoplada.

### ✅ Exportación/importación dual (JSON y CSV)
`DataExporter` soporta ambos formatos y su implementación de CSV maneja casos como comillas escapadas y objetos anidados serializados.

### ✅ Herramientas modernas de desarrollo
Uso de Vite 6, ESLint 9 (flat config), Prettier y EditorConfig asegura consistencia de código y builds rápidos.

---

## 6. Bugs y fallos encontrados

### 🐛 BUG CRÍTICO: Uso de `Buffer` de Node.js en código de navegador

**Archivo:** `src/core/query/QueryProcessor.ts` (líneas ~215-216)

```typescript
// ❌ Buffer es una API de Node.js, no existe en navegadores
const startIndex = cursor ? parseInt(Buffer.from(cursor, 'base64').toString(), 10) : 0;
const nextCursor = hasMore ? Buffer.from(String(endIndex)).toString('base64') : undefined;
```

La paginación por cursor usa `Buffer.from()` que **no existe en navegadores**. Esto provoca un `ReferenceError: Buffer is not defined` en runtime al usar `_cursor` como parámetro de paginación. El reemplazo correcto son las funciones nativas del navegador `btoa()` / `atob()`.

**Corrección propuesta:**
```typescript
const startIndex = cursor ? parseInt(atob(cursor), 10) : 0;
const nextCursor = hasMore ? btoa(String(endIndex)) : undefined;
```

---

### 🐛 BUG: Inconsistencia en el endpoint PATCH con esquema

**Archivo:** `src/api/endpoints.ts` (endpoint PATCH)

El handler PATCH construye `combinedData` (objeto fusionado y transformado), lo valida correctamente, pero luego **guarda `req.body` en lugar de `transformedData`**:

```typescript
// ✅ Se valida transformedData
const validationResult = SchemaValidator.validate(transformedData, schema, true);

// ❌ Pero se guarda req.body sin transformar
const updatedItem = await db.update(collection, parsedId, req.body);
```

Esto ignora las transformaciones del esquema (por ejemplo, el redondeo de precio a 2 decimales) cuando se hace un PATCH con esquema activo.

---

### 🐛 BUG: Filtro de URL confunde campos con guiones bajos como operadores

**Archivo:** `src/core/query/QueryParser.ts` (método `parseFilterParams`)

```typescript
// Si el key contiene '_', lo trata como field_operator
if (key.includes('_')) {
  const [field, operator] = key.split('_');
  // ...
}
```

Un campo de datos llamado `created_at`, `user_name` o `product_id` quedaría mal parseado: `created` sería el campo y `at` el operador (que no existe), descartando el filtro silenciosamente. Esto es un bug de diseño en el parseo de parámetros.

---

### 🐛 BUG: `HashUtils` no se usa en ningún lugar del proyecto

**Archivo:** `src/core/utils/HashUtils.ts`

La clase `HashUtils` con métodos `sha1()` y `generateId()` está implementada pero **nunca importada ni utilizada** en ningún archivo del proyecto. El `tsconfig.json` tiene `"noUnusedLocals": true`, pero como la clase es exportada, no genera error en tiempo de compilación. Es código muerto.

---

### 🐛 BUG: Variable `_queryString` no utilizada en el Router

**Archivo:** `src/core/router.ts`

```typescript
// La variable _queryString se declara pero nunca se usa
const [path, _queryString] = url.split('?');
```

Aunque el prefijo `_` suprime la advertencia del linter, este patrón indica código de limpieza incompleta.

---

### 🐛 BUG: `changeStorage` no carga datos de la nueva fuente

**Archivo:** `src/core/db.ts`

```typescript
public async changeStorage(newType: StorageType): Promise<void> {
  const currentData = this.data;            // Toma datos en memoria
  const newAdapter = this.createAdapter(newType);
  await newAdapter.save(this.storageKey, currentData);  // Escribe en nuevo storage
  this.adapter = newAdapter;
  // ❌ No lee datos existentes en el nuevo storage
}
```

Si el usuario tiene datos en IndexedDB y cambia a localStorage, **los datos de localStorage se sobreescriben** con los datos en memoria actuales. Los datos previos en localStorage se pierden silenciosamente.

---

### 🐛 BUG: Inconsistencia de versiones

- `package.json`: `"version": "0.0.0"`
- `src/index.ts`: `export const VERSION = '1.5.0';`

La versión exportada públicamente no concuerda con la versión del paquete.

---

## 7. Deuda técnica

### 🔴 CRÍTICO: Sin pruebas automatizadas

El `package.json` tiene scripts `test`, `test:watch` y `test:coverage` que invocan `vitest`, pero:

1. **`vitest` no está en `devDependencies`** — no se puede ejecutar.
2. **No existe ningún archivo de prueba** (ni `.test.ts`, `.spec.ts`, ni directorio `__tests__`).

El `CONTRIBUTING.md` exige escribir pruebas para nuevas funcionalidades y bugfixes. Esto es inconsistente con el estado actual del repositorio. La cobertura de pruebas es **0%**.

---

### 🟠 ALTO: Dos configuraciones de ESLint en conflicto

El proyecto tiene **simultáneamente**:
- `.eslintrc.json` — formato legacy (ESLint ≤8)
- `eslint.config.mjs` — formato flat config (ESLint ≥9)

Esto crea ambigüedad sobre cuál se aplica. ESLint 9 usa flat config por defecto e ignora `.eslintrc.json`. Tener ambos genera confusión innecesaria; se debe eliminar `.eslintrc.json`.

---

### 🟠 ALTO: `SchemaRegistry` como Singleton global

`SchemaRegistry` es un singleton que persiste entre sesiones del módulo. Esto:
- **Impide el testing aislado**: los tests que registren esquemas contaminan otros tests.
- **Impide múltiples instancias**: no se puede tener dos servidores con esquemas distintos en la misma página.
- **Duplica datos**: `SchemaRegistry.schemas` y `RelationManager.schemas` almacenan los mismos esquemas por separado, pudiendo desincronizarse.

---

### 🟠 ALTO: Idioma mixto en código fuente

Los comentarios JSDoc, mensajes de error, nombres de variables en ejemplos y UI están en **español**, mientras que TypeScript y las convenciones de la industria usan inglés. Esto limita la contribución internacional y va contra los estándares de los proyectos open source.

Ejemplos:
```typescript
// "El campo es requerido" → "Field is required"
// "Error al cargar datos" → "Failed to load data"
// const initialData = { "usuarios": [...], "productos": [...] }
```

---

### 🟡 MEDIO: `format` en `FieldDefinition` no se valida

**Archivo:** `src/core/schema/types.ts`

```typescript
export interface FieldDefinition {
  // ...
  format?: string;  // Existe pero nunca se valida
}
```

`SchemaValidator` nunca comprueba el campo `format`. El esquema de usuarios define `format: 'email'` y delega la validación a una función `validate` personalizada, lo que hace que `format` sea letra muerta en la interfaz.

---

### 🟡 MEDIO: Generación de IDs frágil

**Archivo:** `src/core/db.ts`

```typescript
const maxId = this.data[collection].reduce(
  (max, current) => (current.id > max ? current.id : max),
  0
);
item.id = maxId + 1;
```

Este enfoque tiene varias limitaciones:
- IDs numéricos únicamente, no soporta UUID/ULID.
- Si se eliminan items, los IDs no se reutilizan pero tampoco siguen una secuencia estricta con gaps.
- Si se importan datos con IDs no numéricos o fuera de secuencia, el próximo ID puede colisionar con uno existente.
- `HashUtils.generateId()` existe pero nunca se usa para este propósito.

---

### 🟡 MEDIO: Datos de muestra hard-coded en `main.ts`

`main.ts` contiene datos iniciales hard-coded en español (`usuarios`, `productos`, `pedidos`). En un proyecto pensado como librería, esto debería extraerse a un archivo de configuración separado o eliminarse del entry point de producción.

---

### 🟡 MEDIO: Sin CHANGELOG

No existe un archivo `CHANGELOG.md` a pesar de que el `CONTRIBUTING.md` menciona versionado semántico y el código exporta `VERSION = '1.5.0'`. No hay forma de rastrear qué cambió entre versiones.

---

### 🟡 MEDIO: Sin CI/CD

No hay pipelines de integración continua (GitHub Actions, etc.). Cualquier commit puede romper el build o introducir bugs sin detección automática.

---

### 🟢 BAJO: `console.log` en `main.ts`

```typescript
console.log('RESTless inicializado correctamente');
```

La regla ESLint `"no-console": ["warn", { "allow": ["warn", "error"] }]` prohíbe `console.log` (solo permite `warn` y `error`). Esto debería usar el `loggerMiddleware` o eliminarse.

---

### 🟢 BAJO: `_expand` solo disponible en GET por ID, no en listados

La expansión de relaciones mediante `_expand=true` sólo funciona en `GET /:collection/:id`, no en `GET /:collection`. Los listados siempre devuelven IDs de relaciones sin expandir.

---

## 8. Oportunidades de mejora

### 1. Agregar pruebas con Vitest

**Prioridad: Crítica.** Instalar `vitest` y crear pruebas unitarias para los módulos sin dependencias de DOM:

```bash
pnpm add -D vitest
```

Módulos prioritarios para testear:
- `QueryProcessor` — lógica pura, muy testeable.
- `QueryParser` — parseo de strings, casos edge claros.
- `SchemaValidator` — validaciones deterministas.
- `DataExporter` — importación/exportación CSV y JSON.
- `Database` — operaciones CRUD con mock de StorageAdapter.

---

### 2. Corregir paginación por cursor para navegadores

Reemplazar `Buffer` con APIs nativas del navegador:

```typescript
// Antes (Node.js solamente)
Buffer.from(cursor, 'base64').toString()
Buffer.from(String(endIndex)).toString('base64')

// Después (navegador nativo)
atob(cursor)
btoa(String(endIndex))
```

---

### 3. Mejorar el parseo de filtros en QueryParser

El parseo basado en `key.includes('_')` es frágil. Una mejor estrategia es reservar un prefijo explícito para operadores:

```
# Convención actual (problemática)
?created_at=2024  → parsea como field="created", operator="at"

# Propuesta mejor
?filter[created_at][gte]=2024
# o
?created_at__gte=2024  (doble guion bajo como separador)
```

---

### 4. Hacer SchemaRegistry inyectable (no Singleton)

```typescript
// Pasar la instancia en lugar de usar getInstance()
export class Server {
  private schemaRegistry: SchemaRegistry;
  
  constructor(config: ServerConfig = {}) {
    this.schemaRegistry = new SchemaRegistry();  // instancia propia
    // ...
  }
}
```

Esto facilita el testing, permite múltiples instancias y elimina la duplicación entre `SchemaRegistry.schemas` y `RelationManager.schemas`.

---

### 5. Agregar soporte de autenticación básica (middleware)

El proyecto carece de cualquier mecanismo de autenticación. Para casos de uso reales de prototipado, sería útil un middleware opcional de autenticación básica (por ejemplo, API Key o JWT simulado):

```typescript
// Ejemplo de uso objetivo
router.use(createAuthMiddleware({ apiKey: 'dev-key' }));
```

---

### 6. Expandir relaciones también en listados

```typescript
// GET /api/pedidos?_expand=true
// Debería expandir usuarioId → usuario completo en cada item
```

Actualmente sólo funciona en `GET /:collection/:id`.

---

### 7. Soporte para operaciones en lote (batch)

```typescript
// POST /api/_batch
{
  "operations": [
    { "method": "POST", "path": "/usuarios", "body": { "nombre": "Alice" } },
    { "method": "DELETE", "path": "/usuarios/3" }
  ]
}
```

Esto mejoraría el rendimiento en escenarios de seeding de datos.

---

### 8. Persistencia de esquemas

Los esquemas se registran en cada inicialización pero no persisten. Si se cambia la estructura del esquema y se reinicia, los datos guardados pueden quedar en estado inconsistente.

---

### 9. Validar el campo `format` en SchemaValidator

El campo `format` (definido en `FieldDefinition`) podría implementarse para formatos estándar:

```typescript
// Formatos propuestos
'email' | 'url' | 'date' | 'datetime' | 'uuid' | 'ipv4'
```

---

### 10. Generar IDs con UUID/ULID

Reemplazar la generación de ID por max+1 con `crypto.randomUUID()` (disponible en todos los navegadores modernos) o ULID para IDs ordenables:

```typescript
item.id = item.id ?? crypto.randomUUID();
```

---

### 11. Añadir configuración de Vite separada para librería y demo

El `vite.config.ts` mezcla la configuración del servidor de desarrollo con la configuración de build de librería. Sería más claro tener:
- `vite.config.ts` — configuración de desarrollo (demo UI)
- `vite.lib.config.ts` — configuración de build de librería

---

### 12. Publicar en npm

El `README.md` menciona "NPM Package (Coming Soon)". Los pasos necesarios serían:
1. Corregir la versión en `package.json` (actualmente `0.0.0`).
2. Añadir `"exports"` al `package.json`.
3. Configurar CI para publicación automática al hacer release.

---

## 9. Seguridad

### Sin autenticación ni autorización

Todos los endpoints son públicos. Cualquier script en la misma página puede leer, modificar o borrar todos los datos. Para uso en producción real (no solo prototipado), se necesitaría un middleware de autenticación.

### Sin límite de tamaño de payload

No hay validación del tamaño de `req.body`. Un payload muy grande podría impactar el rendimiento del navegador.

### localStorage sin cifrado

Los datos almacenados en localStorage son accesibles en texto plano para cualquier script en el mismo origen. No almacenar datos sensibles (contraseñas, tokens, PII) en localStorage.

### `simpleSHA1` no es criptográficamente segura

```typescript
// HashUtils.ts - el fallback no es SHA-1 real
private static simpleSHA1(message: string): string {
  let hash = 0;
  // Implementación basada en djb2, no SHA-1
  // ...
}
```

La función se llama `simpleSHA1` pero implementa djb2 (un hash de propósito general no criptográfico). Aunque la clase no se usa actualmente, si se adopta en el futuro para hashing de contraseñas o integridad de datos, podría introducir una vulnerabilidad. La API Web Crypto nativa ya está correctamente usada como primera opción.

### XSS potencial en UI

Los componentes UI usan `innerHTML` y `innerText` en múltiples lugares. El uso de `innerHTML` con datos controlados por el usuario (por ejemplo, en la visualización de respuestas de la API) podría ser un vector de XSS. Se debería auditar qué datos se insertan con `innerHTML`.

---

## 10. Evaluación general

| Categoría | Puntuación | Comentario |
|---|---|---|
| Arquitectura | 8/10 | Separación de responsabilidades clara, buenos patrones |
| Código TypeScript | 7/10 | Tipado estricto, pero algunos `any` y usos de Node.js en código de navegador |
| Funcionalidades | 9/10 | Sorprendentemente completo para un mock server en el navegador |
| Pruebas | 0/10 | Sin pruebas, sin vitest instalado |
| Documentación | 6/10 | README adecuado, sin JSDoc consistente, sin CHANGELOG |
| Seguridad | 5/10 | Sin autenticación, sin límites de tamaño, posible XSS |
| Mantenibilidad | 6/10 | Idioma mixto, singleton problemático, configs duplicadas |
| DevEx | 7/10 | Buenas herramientas, pero sin CI/CD ni pruebas |

### Prioridades recomendadas

**Inmediatas (antes de cualquier release público):**
1. ~~Corregir el bug de `Buffer` en paginación por cursor~~ → usar `btoa`/`atob`
2. Instalar `vitest` y escribir pruebas básicas
3. Corregir el bug de PATCH que descarta transformaciones
4. Eliminar `.eslintrc.json` (mantener solo `eslint.config.mjs`)
5. Sincronizar versión entre `package.json` y `src/index.ts`

**Corto plazo (próximos sprints):**
6. Refactorizar `QueryParser` para evitar ambigüedad con campos que contienen `_`
7. Hacer `SchemaRegistry` inyectable (no singleton)
8. Traducir comentarios y mensajes de error al inglés
9. Agregar CI con GitHub Actions

**Largo plazo:**
10. Implementar validación del campo `format`
11. Soporte de expansión en listados (`_expand` en `GET /:collection`)
12. Operaciones batch
13. Publicar en npm

---

*Este informe fue generado mediante análisis estático del código fuente. Se recomienda complementarlo con pruebas de integración y revisión manual de los componentes UI.*
