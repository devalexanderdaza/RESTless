# RESTless — API Contracts

## Table of Contents

1. [Overview](#overview)
2. [Base URL and Route Prefix](#base-url-and-route-prefix)
3. [Root Endpoint](#root-endpoint)
4. [Schema Introspection Endpoints](#schema-introspection-endpoints)
5. [Collection CRUD Endpoints](#collection-crud-endpoints)
   - [List collection items](#get-collection)
   - [Get a single item](#get-collectionid)
   - [Create an item](#post-collection)
   - [Replace an item (full update)](#put-collectionid)
   - [Partial update](#patch-collectionid)
   - [Delete an item](#delete-collectionid)
6. [Query Parameters](#query-parameters)
   - [Filtering](#filtering)
   - [Sorting](#sorting)
   - [Offset-based pagination](#offset-based-pagination)
   - [Cursor-based pagination](#cursor-based-pagination)
   - [Full-text search](#full-text-search)
   - [Relation expansion](#relation-expansion)
7. [Response Headers](#response-headers)
8. [Error Responses](#error-responses)
9. [Request and Response Examples](#request-and-response-examples)

---

## Overview

RESTless is a browser-based REST API simulator. It exposes an in-memory database as a fully functional REST API, supporting CRUD operations, schema validation, relational expansion, rich query filtering, sorting, and two pagination strategies. No backend infrastructure is required — everything runs in the browser.

The simulator applies a small middleware stack to every request:

- **Logger middleware** — records the method, path, response status, and elapsed time to the console.
- **Error handler middleware** — catches unhandled exceptions and returns a `500 Internal Server Error` response with a structured JSON body.
- **Delay middleware** — introduces a simulated network latency of 100–300 ms per request to mimic real-world conditions.

---

## Base URL and Route Prefix

All routes are mounted under the `/api` prefix by default. Throughout this document, paths are shown relative to that prefix (e.g., `GET /users` means `GET /api/users`).

---

## Root Endpoint

### `GET /`

Returns a list of all collection names currently registered in the in-memory database.

**Response**

```
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "collections": ["users", "posts", "comments"]
}
```

---

## Schema Introspection Endpoints

### `GET /_schemas`

Returns all schemas registered with the schema registry, keyed by collection name.

**Response**

```
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "users": { ... },
  "posts":  { ... }
}
```

---

### `GET /_schemas/:collection`

Returns the schema for a single collection.

| Parameter    | Location | Type   | Description                        |
|-------------|----------|--------|------------------------------------|
| `collection` | path     | string | Name of the collection to inspect. |

**Success response**

```
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "fields": {
    "id":    { "type": "number" },
    "name":  { "type": "string", "required": true },
    "email": { "type": "string", "required": true }
  }
}
```

**Error response — collection schema not found**

```
HTTP/1.1 404 Not Found
Content-Type: application/json
```

```json
{
  "error": "No se encontró esquema para la colección users"
}
```

---

## Collection CRUD Endpoints

### `GET /:collection`

Lists all items in a collection. Accepts query parameters for filtering, sorting, pagination, search, and relation expansion (see [Query Parameters](#query-parameters)).

**Success response**

```
HTTP/1.1 200 OK
Content-Type: application/json
X-Total-Count: 42
X-Page: 1
X-Total-Pages: 5
X-Has-More: true
```

The body is a JSON array of items:

```json
[
  { "id": 1, "name": "Alice" },
  { "id": 2, "name": "Bob" }
]
```

---

### `GET /:collection/:id`

Retrieves a single item by its identifier. The `id` segment is coerced to a number when it is numeric; otherwise it is treated as a string.

| Parameter    | Location | Type          | Description                       |
|-------------|----------|---------------|-----------------------------------|
| `collection` | path     | string        | Name of the collection.           |
| `id`         | path     | string/number | Identifier of the item.           |
| `_expand`    | query    | boolean       | Set to `true` or `1` to expand relational references into full objects. |
| `_expandDepth` | query  | number        | Maximum depth for nested relation expansion. Defaults to `1`. |

**Success response**

```
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{ "id": 1, "name": "Alice", "email": "alice@example.com" }
```

**Error response — item not found**

```
HTTP/1.1 404 Not Found
Content-Type: application/json
```

```json
{ "error": "No se encontró el elemento con ID 99" }
```

---

### `POST /:collection`

Creates a new item in the collection. If a schema exists for the collection, the request body is first transformed (applying defaults and computed fields) and then validated before insertion.

**Request headers**

```
Content-Type: application/json
```

**Request body** — a JSON object representing the new item. The `id` field is generated automatically; any submitted value is ignored.

**Success response**

```
HTTP/1.1 201 Created
Content-Type: application/json
Location: /users/3
```

```json
{ "id": 3, "name": "Carol", "email": "carol@example.com" }
```

**Error response — invalid body**

```
HTTP/1.1 400 Bad Request
Content-Type: application/json
```

```json
{ "error": "Cuerpo de la solicitud inválido" }
```

**Error response — schema validation failure**

```
HTTP/1.1 400 Bad Request
Content-Type: application/json
```

```json
{
  "error": "Error de validación",
  "details": [
    { "field": "email", "message": "required" }
  ]
}
```

---

### `PUT /:collection/:id`

Replaces an existing item with the supplied body. The `id` in the URL takes precedence — any `id` field in the body is overridden by the path parameter. If a schema exists, transformations and full validation are applied before the update is persisted.

Cascade updates are triggered automatically when the schema includes relational constraints and the item's ID is changed.

**Request headers**

```
Content-Type: application/json
```

**Request body** — a complete JSON object representing the new state of the resource.

**Success response**

```
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{ "id": 1, "name": "Alice Updated", "email": "alice-new@example.com" }
```

**Error responses** — same structure as `POST` (400 invalid body, 400 validation failure, 404 not found).

---

### `PATCH /:collection/:id`

Applies a partial update. The submitted fields are merged with the existing item's data before transformation and validation, so only the fields that must change need to be sent. The `id` field is locked to the path parameter and cannot be overridden by the body.

Cascade updates are triggered automatically when relational constraints exist and the `id` field is included in the patch payload.

**Request headers**

```
Content-Type: application/json
```

**Request body** — a partial JSON object with only the fields to change.

**Success response**

```
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{ "id": 1, "name": "Alice", "email": "alice-patched@example.com" }
```

**Error responses** — same structure as `POST` (400 invalid body, 400 validation failure, 404 not found).

---

### `DELETE /:collection/:id`

Deletes the specified item. Before deletion, referential integrity is checked: if another item references this one and the schema does not permit cascade deletion, the operation is refused. When cascade deletion is configured, dependent items are removed first.

**Success response**

```
HTTP/1.1 204 No Content
```

The response body is `null`.

**Error response — item not found**

```
HTTP/1.1 404 Not Found
Content-Type: application/json
```

```json
{ "error": "No se encontró el elemento con ID 99" }
```

**Error response — referential integrity violation**

```
HTTP/1.1 409 Conflict
Content-Type: application/json
```

```json
{ "error": "No se puede eliminar el elemento porque está siendo referenciado" }
```

---

## Query Parameters

Query parameters are parsed from the URL on every `GET /:collection` request by `QueryParser.parseQueryParams`.

### Filtering

Filters are expressed as field-operator-value triplets encoded in the query string. Multiple filters are combined with a logical AND by default.

#### Syntax

```
?<field>[<operator>]=<value>
```

When no operator suffix is provided, equality (`eq`) is assumed.

#### Supported operators

| Operator | Suffix     | Description                                       | Example                          |
|----------|-----------|---------------------------------------------------|----------------------------------|
| `eq`     | (none)     | Strict equality                                   | `?status=active`                 |
| `ne`     | `[ne]`     | Not equal                                         | `?status[ne]=archived`           |
| `gt`     | `[gt]`     | Greater than                                      | `?age[gt]=18`                    |
| `gte`    | `[gte]`    | Greater than or equal to                          | `?age[gte]=18`                   |
| `lt`     | `[lt]`     | Less than                                         | `?price[lt]=100`                 |
| `lte`    | `[lte]`    | Less than or equal to                             | `?price[lte]=100`                |
| `like`   | `[like]`   | Case-insensitive substring match (pattern match)  | `?name[like]=alice`              |
| `in`     | `[in]`     | Value is one of a comma-separated list            | `?role[in]=admin,editor`         |
| `nin`    | `[nin]`    | Value is none of a comma-separated list           | `?role[nin]=guest,banned`        |

#### Logical grouping

The underlying filter model (`FilterGroup`) supports `and`, `or`, and `not` logical operators, allowing complex nested conditions to be constructed programmatically via the SDK. URL-level syntax maps to flat AND groups; nested logic requires direct use of the `QueryOptions` API.

---

### Sorting

| Parameter | Type   | Default | Description                                         |
|-----------|--------|---------|-----------------------------------------------------|
| `_sort`   | string | —       | Comma-separated list of field names to sort by.     |
| `_order`  | string | `asc`   | Comma-separated list of directions (`asc`, `desc`). The nth direction applies to the nth sort field. |

**Example**

```
GET /posts?_sort=createdAt,title&_order=desc,asc
```

Sorts first by `createdAt` descending, then by `title` ascending.

---

### Offset-based pagination

Divides results into fixed-size pages addressed by page number.

| Parameter | Type   | Default | Description                                         |
|-----------|--------|---------|-----------------------------------------------------|
| `_page`   | number | `1`     | Page number to return (1-indexed).                  |
| `_limit`  | number | —       | Number of items per page.                           |

When offset pagination is active, the response includes the following headers:

- `X-Total-Count` — total number of matching items.
- `X-Page` — current page number.
- `X-Total-Pages` — total number of pages.
- `X-Has-More` — `true` if more pages follow; `false` otherwise.

**Example**

```
GET /users?_page=2&_limit=10
```

---

### Cursor-based pagination

Stateless pagination using an opaque cursor token returned by the previous response. Suitable for real-time data where the dataset may change between requests.

| Parameter | Type   | Default | Description                                              |
|-----------|--------|---------|----------------------------------------------------------|
| `_cursor` | string | —       | Opaque cursor value from the previous page's `X-Next-Cursor` header. Omit for the first page. |
| `_limit`  | number | —       | Number of items per page.                                |

When cursor pagination is active, the response includes:

- `X-Total-Count` — total number of matching items.
- `X-Has-More` — `true` if more items follow the current cursor position; `false` otherwise.
- `X-Next-Cursor` — opaque token to supply as `_cursor` in the next request. Present only when `X-Has-More` is `true`.

**Example — first page**

```
GET /posts?_limit=5
```

**Example — subsequent page**

```
GET /posts?_limit=5&_cursor=eyJpZCI6NX0=
```

> **Note:** Cursor pagination and offset pagination are mutually exclusive. If `_cursor` is present, the `_page` parameter is ignored.

---

### Full-text search

Performs a case-insensitive substring search across one or more fields.

| Parameter | Type   | Default         | Description                                                       |
|-----------|--------|-----------------|-------------------------------------------------------------------|
| `_q`      | string | —               | Search term. Returns only items where at least one target field contains this value. |
| `_fields` | string | all text fields | Comma-separated list of field names to restrict the search to.   |

**Example**

```
GET /articles?_q=javascript&_fields=title,body
```

---

### Relation expansion

Resolves foreign-key references into full embedded objects.

| Parameter      | Location | Type    | Default | Description                                                                   |
|---------------|----------|---------|---------|-------------------------------------------------------------------------------|
| `_expand`      | query    | boolean | `false` | Set to `true` or `1` to replace foreign-key fields with their referenced objects. Applies to both collection list and single-item endpoints. |
| `_expandDepth` | query    | number  | `1`     | Maximum depth for recursive expansion of nested relations. Only valid when `_expand` is enabled. |

**Example**

```
GET /posts?_expand=true&_expandDepth=2
```

Returns each post with its `author` object embedded, and each author with their related objects embedded up to two levels deep.

---

## Response Headers

| Header           | Endpoints                        | Description                                                                          |
|-----------------|----------------------------------|--------------------------------------------------------------------------------------|
| `Content-Type`   | All                              | Always `application/json`.                                                           |
| `Location`       | `POST /:collection`              | URL of the newly created resource, e.g., `/users/3`.                                 |
| `X-Total-Count`  | `GET /:collection` (paginated)   | Total number of items matching the current filter, regardless of page size.          |
| `X-Page`         | Offset pagination only           | Current page number (1-indexed).                                                     |
| `X-Total-Pages`  | Offset pagination only           | Total number of pages given the current `_limit`.                                    |
| `X-Has-More`     | `GET /:collection` (paginated)   | `"true"` if additional items exist beyond the current page; `"false"` otherwise.     |
| `X-Next-Cursor`  | Cursor pagination only           | Opaque token for retrieving the next page. Absent when `X-Has-More` is `"false"`.   |

---

## Error Responses

All error responses use `Content-Type: application/json` and return a JSON body.

| HTTP Status | Meaning                   | When it occurs                                                                          |
|------------|---------------------------|-----------------------------------------------------------------------------------------|
| `400`      | Bad Request               | The request body is missing, is not a JSON object, or fails schema validation.          |
| `404`      | Not Found                 | The requested collection item or schema does not exist.                                 |
| `409`      | Conflict                  | A DELETE was attempted on an item that is referenced by another item and cascade deletion is not permitted. |
| `500`      | Internal Server Error     | An unexpected exception was thrown inside a route handler or middleware.                |

### 400 — Invalid body

```json
{ "error": "Cuerpo de la solicitud inválido" }
```

### 400 — Validation failure

```json
{
  "error": "Error de validación",
  "details": [
    { "field": "email", "message": "required" }
  ]
}
```

### 404 — Item not found

```json
{ "error": "No se encontró el elemento con ID 99" }
```

### 404 — Schema not found

```json
{ "error": "No se encontró esquema para la colección unknownCollection" }
```

### 409 — Referential integrity violation

```json
{ "error": "No se puede eliminar el elemento porque está siendo referenciado" }
```

### 500 — Internal server error

```json
{
  "error": "Error interno del servidor",
  "message": "Detailed error message here"
}
```

---

## Request and Response Examples

### List all collections

```
GET /api/
```

```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "collections": ["users", "posts", "comments"]
}
```

---

### Fetch all users with offset pagination

```
GET /api/users?_page=1&_limit=2
```

```
HTTP/1.1 200 OK
Content-Type: application/json
X-Total-Count: 10
X-Page: 1
X-Total-Pages: 5
X-Has-More: true
```

```json
[
  { "id": 1, "name": "Alice", "email": "alice@example.com" },
  { "id": 2, "name": "Bob",   "email": "bob@example.com" }
]
```

---

### Filter and sort

```
GET /api/posts?status=published&_sort=createdAt&_order=desc&_limit=5
```

Returns the five most recent published posts.

---

### Full-text search

```
GET /api/articles?_q=typescript&_fields=title,summary
```

Returns all articles whose `title` or `summary` contains the substring "typescript".

---

### Cursor-based pagination — first page

```
GET /api/posts?_limit=3
```

```
HTTP/1.1 200 OK
Content-Type: application/json
X-Total-Count: 25
X-Has-More: true
X-Next-Cursor: eyJpZCI6M30=
```

```json
[
  { "id": 1, "title": "First Post"  },
  { "id": 2, "title": "Second Post" },
  { "id": 3, "title": "Third Post"  }
]
```

---

### Cursor-based pagination — next page

```
GET /api/posts?_limit=3&_cursor=eyJpZCI6M30=
```

---

### Get a single item with relation expansion

```
GET /api/posts/5?_expand=true&_expandDepth=1
```

```json
{
  "id": 5,
  "title": "Hello World",
  "authorId": 1,
  "author": {
    "id": 1,
    "name": "Alice",
    "email": "alice@example.com"
  }
}
```

---

### Create a new item

```
POST /api/users
Content-Type: application/json

{
  "name": "Carol",
  "email": "carol@example.com"
}
```

```
HTTP/1.1 201 Created
Content-Type: application/json
Location: /users/3

{
  "id": 3,
  "name": "Carol",
  "email": "carol@example.com"
}
```

---

### Replace an item (full update)

```
PUT /api/users/3
Content-Type: application/json

{
  "name": "Carol Smith",
  "email": "carol.smith@example.com"
}
```

```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": 3,
  "name": "Carol Smith",
  "email": "carol.smith@example.com"
}
```

---

### Partial update

```
PATCH /api/users/3
Content-Type: application/json

{
  "email": "carol.new@example.com"
}
```

```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": 3,
  "name": "Carol Smith",
  "email": "carol.new@example.com"
}
```

---

### Delete an item

```
DELETE /api/users/3
```

```
HTTP/1.1 204 No Content
```

---

### Delete — referential integrity violation

```
DELETE /api/users/1
```

```
HTTP/1.1 409 Conflict
Content-Type: application/json

{
  "error": "No se puede eliminar el elemento porque está siendo referenciado"
}
```
