# 📚 API Reference - Documentación para Frontend

**Base URL:** `http://localhost:3001/api`
**Producción:** `https://api.tuapp.com/api`

---

## 📖 Tabla de Contenidos

1. [Autenticación](#-autenticación)
2. [Usuarios](#-usuarios)
3. [Tiendas](#-tiendas)
4. [Productos](#-productos)
5. [Variantes](#-variantes-de-productos)
6. [Categorías](#-categorías)
7. [Storefront Público](#-storefront-público-sin-auth)
8. [Órdenes](#-órdenes)
9. [Flujos Comunes](#-flujos-comunes)

---

## 🔐 Autenticación

Todos los endpoints (excepto Auth y Public) requieren un token JWT en el header:

```bash
Authorization: Bearer <access_token>
```

### POST /api/auth/register
**Registrar nuevo usuario**

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

**Request Body:**
```json
{
  "email": "user@example.com",      // Requerido
  "password": "password123",         // Requerido, mínimo 8 caracteres
  "name": "John Doe"                 // Opcional
}
```

**Response (201):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clxxx123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Errores:**
- `409` - Email ya existe

---

### POST /api/auth/login
**Iniciar sesión**

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clxxx123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Errores:**
- `401` - Credenciales inválidas

**💡 Guardar en localStorage/sessionStorage:**
```javascript
localStorage.setItem('accessToken', response.accessToken);
localStorage.setItem('refreshToken', response.refreshToken);
```

---

### POST /api/auth/refresh
**Refrescar access token**

Usar cuando el `accessToken` expire (cada 15 minutos).

```bash
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**💡 Implementar refresh automático:**
```javascript
// Interceptor para axios
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      const { data } = await axios.post('/api/auth/refresh', { refreshToken });
      localStorage.setItem('accessToken', data.accessToken);
      // Reintentar request original
      return axios(error.config);
    }
    return Promise.reject(error);
  }
);
```

---

## 👤 Usuarios

### GET /api/users/me
**Obtener perfil del usuario actual**

```bash
curl -X GET http://localhost:3001/api/users/me \
  -H "Authorization: Bearer <access_token>"
```

**Response (200):**
```json
{
  "id": "clxxx123",
  "email": "user@example.com",
  "name": "John Doe",
  "avatar": "https://example.com/avatar.jpg",
  "emailVerified": "2024-01-10T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-10T00:00:00.000Z"
}
```

---

### PATCH /api/users/me
**Actualizar perfil del usuario**

```bash
curl -X PATCH http://localhost:3001/api/users/me \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "avatar": "https://example.com/new-avatar.jpg"
  }'
```

**Request Body:**
```json
{
  "name": "Jane Doe",                      // Opcional
  "avatar": "https://example.com/avatar.jpg"  // Opcional
}
```

**Response (200):** Mismo formato que GET /users/me

---

## 🏪 Tiendas

### POST /api/stores
**Crear nueva tienda**

```bash
curl -X POST http://localhost:3001/api/stores \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mi Tienda Increíble",
    "description": "Tienda de ropa y accesorios",
    "whatsappNumbers": ["+1234567890"],
    "instagramHandle": "@mitienda"
  }'
```

**Request Body:**
```json
{
  "name": "Mi Tienda Increíble",              // Requerido
  "description": "Tienda de ropa y accesorios", // Opcional
  "whatsappNumbers": ["+1234567890"],         // Requerido (array)
  "instagramHandle": "@mitienda"              // Opcional
}
```

**Response (201):**
```json
{
  "id": "store123",
  "slug": "mi-tienda-increible",
  "name": "Mi Tienda Increíble",
  "description": "Tienda de ropa y accesorios",
  "logo": null,
  "favicon": null,
  "banner": null,
  "primaryColor": "#3b82f6",
  "secondaryColor": "#64748b",
  "backgroundColor": "#ffffff",
  "textColor": "#0f172a",
  "font": "Inter",
  "template": "minimal",
  "whatsappNumbers": ["+1234567890"],
  "instagramHandle": "@mitienda",
  "facebookUrl": null,
  "tiktokUrl": null,
  "email": null,
  "address": null,
  "businessHours": null,
  "checkoutConfig": null,
  "currencyConfig": null,
  "stockEnabled": false,
  "showBranding": true,
  "customDomain": null,
  "domainVerified": false,
  "ownerId": "user123",
  "subscription": {
    "plan": "FREE",
    "status": "ACTIVE"
  },
  "createdAt": "2024-01-10T00:00:00.000Z",
  "updatedAt": "2024-01-10T00:00:00.000Z"
}
```

**💡 Nota:** El `slug` se genera automáticamente a partir del `name`.

---

### GET /api/stores
**Listar tiendas del usuario (con paginación)**

```bash
curl -X GET "http://localhost:3001/api/stores?page=1&limit=10" \
  -H "Authorization: Bearer <access_token>"
```

**Query Params:**
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `sortBy` (string, default: "createdAt")
- `sortOrder` ("asc" | "desc", default: "desc")

**Response (200):**
```json
{
  "data": [
    {
      "id": "store123",
      "slug": "mi-tienda",
      "name": "Mi Tienda",
      // ... resto de campos
    }
  ],
  "meta": {
    "total": 15,
    "page": 1,
    "limit": 10,
    "totalPages": 2,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

### GET /api/stores/:storeId
**Obtener detalles de una tienda**

```bash
curl -X GET http://localhost:3001/api/stores/store123 \
  -H "Authorization: Bearer <access_token>"
```

**Response (200):** Mismo formato que POST /stores

**Errores:**
- `404` - Tienda no encontrada
- `403` - No eres el dueño de esta tienda

---

### PATCH /api/stores/:storeId
**Actualizar tienda**

```bash
curl -X PATCH http://localhost:3001/api/stores/store123 \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nuevo Nombre",
    "logo": "https://example.com/logo.png",
    "primaryColor": "#ff0000",
    "template": "modern",
    "showBranding": false
  }'
```

**Request Body (todos opcionales):**
```json
{
  "name": "Nuevo Nombre",
  "description": "Nueva descripción",
  "logo": "https://example.com/logo.png",
  "favicon": "https://example.com/favicon.ico",
  "banner": "https://example.com/banner.jpg",
  "primaryColor": "#ff0000",
  "secondaryColor": "#00ff00",
  "backgroundColor": "#ffffff",
  "textColor": "#000000",
  "font": "Roboto",
  "template": "modern",
  "whatsappNumbers": ["+9876543210"],
  "instagramHandle": "@newhandle",
  "facebookUrl": "https://facebook.com/page",
  "tiktokUrl": "https://tiktok.com/@user",
  "email": "tienda@example.com",
  "address": "Calle 123, Ciudad",
  "stockEnabled": true,
  "showBranding": false
}
```

**Response (200):** Mismo formato que POST /stores

---

### DELETE /api/stores/:storeId
**Eliminar tienda**

```bash
curl -X DELETE http://localhost:3001/api/stores/store123 \
  -H "Authorization: Bearer <access_token>"
```

**Response (204):** Sin contenido

⚠️ **Advertencia:** Esta acción es irreversible y eliminará todos los productos, categorías y órdenes asociadas.

---

## 📦 Productos

### POST /api/stores/:storeId/products
**Crear nuevo producto**

```bash
curl -X POST http://localhost:3001/api/stores/store123/products \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Camiseta Básica",
    "description": "Camiseta de algodón 100%",
    "basePrice": 19.99,
    "compareAtPrice": 29.99,
    "images": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
    "stock": 100,
    "sku": "SHIRT-001",
    "isVisible": true,
    "isFeatured": false,
    "isOnSale": true,
    "attributes": [
      {
        "name": "Talla",
        "options": ["S", "M", "L", "XL"],
        "sortOrder": 1
      },
      {
        "name": "Color",
        "options": ["Negro", "Blanco", "Azul"],
        "sortOrder": 2
      }
    ],
    "categoryIds": ["cat123", "cat456"]
  }'
```

**Request Body:**
```json
{
  "name": "Camiseta Básica",                 // Requerido
  "description": "Camiseta de algodón 100%",  // Opcional
  "basePrice": 19.99,                         // Requerido
  "compareAtPrice": 29.99,                    // Opcional (precio antes del descuento)
  "images": ["url1", "url2"],                 // Opcional (array de URLs)
  "videos": ["url1"],                         // Opcional (array de URLs)
  "stock": 100,                               // Opcional (cantidad en inventario)
  "sku": "SHIRT-001",                         // Opcional (código único)
  "isVisible": true,                          // Opcional (default: true)
  "isFeatured": false,                        // Opcional (default: false)
  "isOnSale": true,                           // Opcional (default: false)
  "attributes": [                             // Opcional (para variantes)
    {
      "name": "Talla",
      "options": ["S", "M", "L", "XL"],
      "sortOrder": 1
    }
  ],
  "categoryIds": ["cat123", "cat456"]         // Opcional (array de IDs)
}
```

**Response (201):**
```json
{
  "id": "prod123",
  "storeId": "store123",
  "name": "Camiseta Básica",
  "slug": "camiseta-basica",
  "description": "Camiseta de algodón 100%",
  "basePrice": 19.99,
  "compareAtPrice": 29.99,
  "prices": null,
  "images": ["https://example.com/image1.jpg"],
  "videos": [],
  "stock": 100,
  "sku": "SHIRT-001",
  "isVisible": true,
  "isFeatured": false,
  "isOnSale": true,
  "sortOrder": 0,
  "attributes": [
    {
      "id": "attr123",
      "name": "Talla",
      "options": ["S", "M", "L", "XL"],
      "sortOrder": 1
    }
  ],
  "variants": [],
  "categoryIds": ["cat123", "cat456"],
  "createdAt": "2024-01-10T00:00:00.000Z",
  "updatedAt": "2024-01-10T00:00:00.000Z"
}
```

**💡 Notas:**
- El `slug` se genera automáticamente
- `attributes` define las opciones para crear variantes
- Si defines atributos, puedes crear variantes después

---

### GET /api/stores/:storeId/products
**Listar productos de una tienda**

```bash
curl -X GET "http://localhost:3001/api/stores/store123/products?page=1&limit=10&categoryId=cat123&search=camisa&isVisible=true&isFeatured=true&isOnSale=true" \
  -H "Authorization: Bearer <access_token>"
```

**Query Params (todos opcionales):**
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `categoryId` (string) - Filtrar por categoría
- `isVisible` (boolean) - Filtrar por visibilidad
- `isFeatured` (boolean) - Solo destacados
- `isOnSale` (boolean) - Solo en oferta
- `search` (string) - Buscar por nombre, descripción o SKU
- `sortBy` (string, default: "sortOrder")
- `sortOrder` ("asc" | "desc", default: "asc")

**Response (200):**
```json
{
  "data": [
    {
      "id": "prod123",
      "name": "Camiseta Básica",
      // ... resto de campos
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

**💡 Ejemplo de búsqueda:**
```javascript
const searchProducts = async (storeId, searchTerm) => {
  const params = new URLSearchParams({
    search: searchTerm,
    isVisible: 'true',
    page: '1',
    limit: '20'
  });

  const response = await fetch(
    `http://localhost:3001/api/stores/${storeId}/products?${params}`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );

  return response.json();
};
```

---

### GET /api/stores/:storeId/products/:productId
**Obtener detalles de un producto**

```bash
curl -X GET http://localhost:3001/api/stores/store123/products/prod123 \
  -H "Authorization: Bearer <access_token>"
```

**Response (200):** Mismo formato que POST /products

---

### PATCH /api/stores/:storeId/products/:productId
**Actualizar producto**

```bash
curl -X PATCH http://localhost:3001/api/stores/store123/products/prod123 \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Camiseta Premium",
    "basePrice": 24.99,
    "isVisible": false
  }'
```

**Request Body (todos opcionales):**
```json
{
  "name": "Camiseta Premium",
  "description": "Nueva descripción",
  "basePrice": 24.99,
  "compareAtPrice": 34.99,
  "images": ["url1", "url2"],
  "videos": ["url1"],
  "stock": 50,
  "sku": "SHIRT-002",
  "isVisible": false,
  "isFeatured": true,
  "isOnSale": false,
  "categoryIds": ["cat123"]
}
```

**Response (200):** Mismo formato que POST /products

⚠️ **Nota:** No puedes editar `attributes` después de crear el producto. Solo puedes modificar las variantes.

---

### DELETE /api/stores/:storeId/products/:productId
**Eliminar producto**

```bash
curl -X DELETE http://localhost:3001/api/stores/store123/products/prod123 \
  -H "Authorization: Bearer <access_token>"
```

**Response (204):** Sin contenido

---

### POST /api/stores/:storeId/products/:productId/duplicate
**Duplicar producto**

Crea una copia del producto con:
- Nombre: "Nombre Original (Copy)"
- Slug único autogenerado
- SKU: "SKU-COPY"
- isVisible: false

```bash
curl -X POST http://localhost:3001/api/stores/store123/products/prod123/duplicate \
  -H "Authorization: Bearer <access_token>"
```

**Response (201):** Nuevo producto duplicado

**💡 Útil para:**
- Crear variantes de un producto existente
- Temporadas (Verano 2024 → Verano 2025)
- Testing sin afectar el original

---

## 🎨 Variantes de Productos

Las variantes se crean basadas en los `attributes` del producto.

**Ejemplo:**
- Producto tiene atributos: Talla [S, M, L] y Color [Rojo, Azul]
- Posibles variantes: S/Rojo, S/Azul, M/Rojo, M/Azul, L/Rojo, L/Azul

### POST /api/stores/:storeId/products/:productId/variants
**Crear variante**

```bash
curl -X POST http://localhost:3001/api/stores/store123/products/prod123/variants \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "combination": {
      "Talla": "M",
      "Color": "Rojo"
    },
    "sku": "SHIRT-M-RED",
    "priceAdjustment": 2.00,
    "stock": 25,
    "image": "https://example.com/shirt-m-red.jpg",
    "isAvailable": true
  }'
```

**Request Body:**
```json
{
  "combination": {                           // Requerido
    "Talla": "M",
    "Color": "Rojo"
  },
  "sku": "SHIRT-M-RED",                      // Opcional
  "priceAdjustment": 2.00,                   // Opcional (default: 0)
  "stock": 25,                               // Opcional
  "image": "https://example.com/image.jpg",  // Opcional
  "isAvailable": true                        // Opcional (default: true)
}
```

**Response (201):**
```json
{
  "id": "var123",
  "combination": {
    "Talla": "M",
    "Color": "Rojo"
  },
  "sku": "SHIRT-M-RED",
  "priceAdjustment": 2.00,
  "stock": 25,
  "image": "https://example.com/shirt-m-red.jpg",
  "isAvailable": true
}
```

**💡 Precio final = basePrice + priceAdjustment**
- basePrice: $19.99
- priceAdjustment: $2.00
- **Precio final: $21.99**

---

### PATCH /api/stores/:storeId/products/:productId/variants/:variantId
**Actualizar variante**

```bash
curl -X PATCH http://localhost:3001/api/stores/store123/products/prod123/variants/var123 \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "stock": 30,
    "priceAdjustment": 3.00,
    "isAvailable": false
  }'
```

**Request Body (todos opcionales):**
```json
{
  "combination": { "Talla": "L", "Color": "Azul" },
  "sku": "SHIRT-L-BLUE",
  "priceAdjustment": 3.00,
  "stock": 30,
  "image": "https://example.com/new-image.jpg",
  "isAvailable": false
}
```

**Response (200):** Mismo formato que POST /variants

---

### DELETE /api/stores/:storeId/products/:productId/variants/:variantId
**Eliminar variante**

```bash
curl -X DELETE http://localhost:3001/api/stores/store123/products/prod123/variants/var123 \
  -H "Authorization: Bearer <access_token>"
```

**Response (204):** Sin contenido

---

## 🏷️ Categorías

### POST /api/stores/:storeId/categories
**Crear categoría**

```bash
curl -X POST http://localhost:3001/api/stores/store123/categories \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ropa",
    "description": "Categoría de ropa y accesorios",
    "image": "https://example.com/category.jpg",
    "isVisible": true,
    "sortOrder": 1
  }'
```

**Request Body:**
```json
{
  "name": "Ropa",                                 // Requerido
  "description": "Categoría de ropa y accesorios", // Opcional
  "image": "https://example.com/category.jpg",     // Opcional
  "isVisible": true,                               // Opcional (default: true)
  "sortOrder": 1                                   // Opcional (default: 0)
}
```

**Response (201):**
```json
{
  "id": "cat123",
  "storeId": "store123",
  "name": "Ropa",
  "slug": "ropa",
  "description": "Categoría de ropa y accesorios",
  "image": "https://example.com/category.jpg",
  "isVisible": true,
  "sortOrder": 1,
  "productCount": 0,
  "createdAt": "2024-01-10T00:00:00.000Z",
  "updatedAt": "2024-01-10T00:00:00.000Z"
}
```

---

### GET /api/stores/:storeId/categories
**Listar categorías**

```bash
curl -X GET "http://localhost:3001/api/stores/store123/categories?page=1&limit=10" \
  -H "Authorization: Bearer <access_token>"
```

**Query Params:**
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `sortBy` (string, default: "sortOrder")
- `sortOrder` ("asc" | "desc", default: "asc")

**Response (200):**
```json
{
  "data": [
    {
      "id": "cat123",
      "name": "Ropa",
      "productCount": 15,
      // ... resto de campos
    }
  ],
  "meta": {
    "total": 10,
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

---

### GET /api/stores/:storeId/categories/:categoryId
**Obtener categoría**

```bash
curl -X GET http://localhost:3001/api/stores/store123/categories/cat123 \
  -H "Authorization: Bearer <access_token>"
```

**Response (200):** Mismo formato que POST /categories

---

### PATCH /api/stores/:storeId/categories/:categoryId
**Actualizar categoría**

```bash
curl -X PATCH http://localhost:3001/api/stores/store123/categories/cat123 \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ropa y Accesorios",
    "isVisible": false,
    "sortOrder": 2
  }'
```

**Request Body (todos opcionales):**
```json
{
  "name": "Ropa y Accesorios",
  "description": "Nueva descripción",
  "image": "https://example.com/new-image.jpg",
  "isVisible": false,
  "sortOrder": 2
}
```

**Response (200):** Mismo formato que POST /categories

---

### DELETE /api/stores/:storeId/categories/:categoryId
**Eliminar categoría**

```bash
curl -X DELETE http://localhost:3001/api/stores/store123/categories/cat123 \
  -H "Authorization: Bearer <access_token>"
```

**Response (204):** Sin contenido

⚠️ **Nota:** Los productos de esta categoría NO se eliminan, solo pierden la asociación.

---

## 🌍 Storefront Público (Sin Auth)

Estos endpoints NO requieren autenticación. Son para que los clientes finales vean el catálogo.

### GET /api/public/:slug
**Ver tienda pública**

```bash
curl -X GET http://localhost:3001/api/public/mi-tienda
```

**Response (200):**
```json
{
  "id": "store123",
  "slug": "mi-tienda",
  "name": "Mi Tienda",
  "description": "Tienda de ropa",
  "logo": "https://example.com/logo.png",
  "banner": "https://example.com/banner.jpg",
  "primaryColor": "#3b82f6",
  "secondaryColor": "#64748b",
  "backgroundColor": "#ffffff",
  "textColor": "#0f172a",
  "font": "Inter",
  "template": "minimal",
  "whatsappNumbers": ["+1234567890"],
  "instagramHandle": "@mitienda",
  "facebookUrl": null,
  "tiktokUrl": null,
  "email": "tienda@example.com",
  "address": "Calle 123, Ciudad",
  "businessHours": null,
  "showBranding": true
}
```

**💡 Usar esto para:**
- Renderizar header con logo y colores
- Mostrar información de contacto
- Footer con redes sociales

---

### GET /api/public/:slug/categories
**Obtener categorías públicas**

```bash
curl -X GET http://localhost:3001/api/public/mi-tienda/categories
```

**Response (200):**
```json
[
  {
    "id": "cat123",
    "name": "Ropa",
    "slug": "ropa",
    "description": "Categoría de ropa",
    "image": "https://example.com/category.jpg",
    "productCount": 15
  },
  {
    "id": "cat456",
    "name": "Accesorios",
    "slug": "accesorios",
    "description": "Categoría de accesorios",
    "image": "https://example.com/accesorios.jpg",
    "productCount": 8
  }
]
```

**💡 Usar esto para:**
- Menú de navegación
- Filtros de categorías
- Landing page con categorías destacadas

---

### GET /api/public/:slug/products
**Listar productos públicos**

Solo retorna productos con `isVisible: true`

```bash
curl -X GET "http://localhost:3001/api/public/mi-tienda/products?page=1&limit=12&categoryId=cat123&search=camisa&isFeatured=true&isOnSale=true"
```

**Query Params (todos opcionales):**
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `categoryId` (string) - Filtrar por categoría
- `isFeatured` (boolean) - Solo destacados
- `isOnSale` (boolean) - Solo en oferta
- `search` (string) - Buscar por nombre/descripción
- `sortBy` (string, default: "sortOrder")
- `sortOrder` ("asc" | "desc", default: "asc")

**Response (200):**
```json
{
  "data": [
    {
      "id": "prod123",
      "name": "Camiseta Básica",
      "slug": "camiseta-basica",
      "description": "Camiseta 100% algodón",
      "basePrice": 19.99,
      "compareAtPrice": 29.99,
      "images": ["https://example.com/image1.jpg"],
      "videos": [],
      "stock": null,  // null si stockEnabled = false en la tienda
      "isFeatured": true,
      "isOnSale": true,
      "attributes": [
        {
          "id": "attr123",
          "name": "Talla",
          "options": ["S", "M", "L", "XL"],
          "sortOrder": 1
        }
      ],
      "variants": [
        {
          "id": "var123",
          "combination": { "Talla": "M" },
          "sku": "SHIRT-M",
          "priceAdjustment": 0,
          "stock": null,
          "image": null,
          "isAvailable": true
        }
      ],
      "categories": [
        {
          "id": "cat123",
          "name": "Ropa",
          "slug": "ropa"
        }
      ]
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 12,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

**💡 Ejemplos de uso:**

```javascript
// Lista de productos
const getProducts = async (slug, page = 1) => {
  const response = await fetch(
    `http://localhost:3001/api/public/${slug}/products?page=${page}&limit=12`
  );
  return response.json();
};

// Productos destacados para homepage
const getFeaturedProducts = async (slug) => {
  const response = await fetch(
    `http://localhost:3001/api/public/${slug}/products?isFeatured=true&limit=8`
  );
  return response.json();
};

// Productos en oferta
const getSaleProducts = async (slug) => {
  const response = await fetch(
    `http://localhost:3001/api/public/${slug}/products?isOnSale=true`
  );
  return response.json();
};

// Buscar productos
const searchProducts = async (slug, searchTerm) => {
  const response = await fetch(
    `http://localhost:3001/api/public/${slug}/products?search=${searchTerm}`
  );
  return response.json();
};
```

---

### GET /api/public/:slug/products/:productSlug
**Ver detalle de producto público**

```bash
curl -X GET http://localhost:3001/api/public/mi-tienda/products/camiseta-basica
```

**Response (200):**
```json
{
  "id": "prod123",
  "name": "Camiseta Básica",
  "slug": "camiseta-basica",
  "description": "Camiseta de algodón 100%, perfecta para el día a día",
  "basePrice": 19.99,
  "compareAtPrice": 29.99,
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg",
    "https://example.com/image3.jpg"
  ],
  "videos": [],
  "stock": null,
  "isFeatured": true,
  "isOnSale": true,
  "attributes": [
    {
      "id": "attr123",
      "name": "Talla",
      "options": ["S", "M", "L", "XL"],
      "sortOrder": 1
    },
    {
      "id": "attr456",
      "name": "Color",
      "options": ["Negro", "Blanco", "Azul"],
      "sortOrder": 2
    }
  ],
  "variants": [
    {
      "id": "var123",
      "combination": { "Talla": "M", "Color": "Negro" },
      "sku": "SHIRT-M-BLACK",
      "priceAdjustment": 0,
      "stock": null,
      "image": "https://example.com/black-m.jpg",
      "isAvailable": true
    },
    {
      "id": "var124",
      "combination": { "Talla": "M", "Color": "Blanco" },
      "sku": "SHIRT-M-WHITE",
      "priceAdjustment": 0,
      "stock": null,
      "image": "https://example.com/white-m.jpg",
      "isAvailable": true
    }
  ],
  "categories": [
    {
      "id": "cat123",
      "name": "Ropa",
      "slug": "ropa"
    }
  ]
}
```

**💡 Usar esto para:**
- Página de detalle de producto
- Modal de vista rápida
- Selector de variantes (tallas, colores)

**Errores:**
- `404` - Tienda o producto no encontrado
- `404` - Producto existe pero no está visible

---

## 🛒 Órdenes

### POST /api/public/:slug/orders
**Crear orden desde storefront (NO requiere auth)**

Este es el endpoint más importante para el checkout. Convierte el carrito en un pedido y genera el mensaje para WhatsApp.

```bash
curl -X POST http://localhost:3001/api/public/mi-tienda/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": "prod123",
        "variantId": "var123",
        "quantity": 2
      },
      {
        "productId": "prod456",
        "quantity": 1
      }
    ],
    "currency": "USD",
    "customerName": "Juan Pérez",
    "customerPhone": "+1234567890",
    "customerEmail": "juan@example.com",
    "customerAddress": "Calle 123, Ciudad",
    "customerNotes": "Entregar entre 2pm y 5pm",
    "channel": "WHATSAPP",
    "whatsappNumber": "+1234567890"
  }'
```

**Request Body:**
```json
{
  "items": [                              // Requerido (array, mínimo 1)
    {
      "productId": "prod123",             // Requerido
      "variantId": "var123",              // Opcional (si el producto tiene variantes)
      "quantity": 2                       // Requerido (mínimo 1)
    }
  ],
  "currency": "USD",                      // Opcional (default: "USD")
  "customerName": "Juan Pérez",           // Opcional
  "customerPhone": "+1234567890",         // Opcional
  "customerEmail": "juan@example.com",    // Opcional
  "customerAddress": "Calle 123, Ciudad", // Opcional
  "customerNotes": "Entregar entre 2pm y 5pm", // Opcional
  "channel": "WHATSAPP",                  // Requerido ("WHATSAPP" o "INSTAGRAM")
  "whatsappNumber": "+1234567890"         // Opcional (usa el de la tienda si no se provee)
}
```

**Response (201):**
```json
{
  "id": "order123",
  "storeId": "store123",
  "items": [
    {
      "id": "item123",
      "productId": "prod123",
      "variantId": "var123",
      "productName": "Camiseta Básica",
      "variantName": "M / Negro",
      "unitPrice": 19.99,
      "quantity": 2
    },
    {
      "id": "item124",
      "productId": "prod456",
      "variantId": null,
      "productName": "Gorra Snapback",
      "variantName": null,
      "unitPrice": 15.99,
      "quantity": 1
    }
  ],
  "subtotal": 55.97,
  "total": 55.97,
  "currency": "USD",
  "customerName": "Juan Pérez",
  "customerPhone": "+1234567890",
  "customerEmail": "juan@example.com",
  "customerAddress": "Calle 123, Ciudad",
  "customerNotes": "Entregar entre 2pm y 5pm",
  "channel": "WHATSAPP",
  "whatsappNumber": "+1234567890",
  "messageGenerated": "🛍️ *Nuevo Pedido - Mi Tienda*\n\n📦 *Productos:*\n1. Camiseta Básica (M / Negro)\n   Cantidad: 2\n   Precio: $19.99\n   Subtotal: $39.98\n\n2. Gorra Snapback\n   Cantidad: 1\n   Precio: $15.99\n   Subtotal: $15.99\n\n💰 *Total: $55.97*\n\n👤 *Datos del Cliente:*\nNombre: Juan Pérez\nTeléfono: +1234567890\nEmail: juan@example.com\nDirección: Calle 123, Ciudad\n\n📝 *Notas:*\nEntregar entre 2pm y 5pm\n\n_Pedido generado desde el catálogo web_",
  "whatsappUrl": "https://wa.me/1234567890?text=%F0%9F%9B%8D%EF%B8%8F%20*Nuevo%20Pedido...",
  "createdAt": "2024-01-10T15:30:00.000Z"
}
```

**💡 Implementación en frontend:**

```javascript
// Función para crear orden
const createOrder = async (slug, orderData) => {
  const response = await fetch(
    `http://localhost:3001/api/public/${slug}/orders`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    }
  );

  if (!response.ok) {
    throw new Error('Error al crear orden');
  }

  return response.json();
};

// Ejemplo de uso
const handleCheckout = async () => {
  const cart = [
    { productId: 'prod123', variantId: 'var123', quantity: 2 },
    { productId: 'prod456', quantity: 1 }
  ];

  const customerData = {
    customerName: formData.name,
    customerPhone: formData.phone,
    customerEmail: formData.email,
    customerAddress: formData.address,
    customerNotes: formData.notes
  };

  try {
    const order = await createOrder('mi-tienda', {
      items: cart,
      ...customerData,
      channel: 'WHATSAPP'
    });

    // Abrir WhatsApp con el mensaje pre-llenado
    window.open(order.whatsappUrl, '_blank');

    // Limpiar carrito
    clearCart();

    // Mostrar confirmación
    showSuccessMessage('¡Pedido enviado!');

  } catch (error) {
    showErrorMessage('Error al procesar el pedido');
  }
};
```

**Errores:**
- `404` - Tienda no encontrada
- `404` - Producto no encontrado
- `400` - Producto no visible o variante no disponible
- `400` - Items vacío
- `400` - Tienda sin números de WhatsApp (si channel es WHATSAPP)

**💡 Validaciones que hace el backend:**
1. ✅ Verifica que la tienda exista
2. ✅ Valida que cada producto exista
3. ✅ Verifica que los productos estén visibles
4. ✅ Si hay variantId, valida que exista y esté disponible
5. ✅ Calcula precios correctos (basePrice + priceAdjustment)
6. ✅ Calcula totales automáticamente
7. ✅ Genera mensaje formateado para WhatsApp
8. ✅ Crea URL de WhatsApp con mensaje pre-llenado
9. ✅ Guarda el pedido en la base de datos

---

### GET /api/stores/:storeId/orders
**Listar órdenes de una tienda (requiere auth)**

Este endpoint es para el admin dashboard.

```bash
curl -X GET "http://localhost:3001/api/stores/store123/orders?page=1&limit=20" \
  -H "Authorization: Bearer <access_token>"
```

**Query Params:**
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `sortBy` (string, default: "createdAt")
- `sortOrder` ("asc" | "desc", default: "desc")

**Response (200):**
```json
{
  "data": [
    {
      "id": "order123",
      "storeId": "store123",
      "items": [
        {
          "id": "item123",
          "productId": "prod123",
          "variantId": "var123",
          "productName": "Camiseta Básica",
          "variantName": "M / Negro",
          "unitPrice": 19.99,
          "quantity": 2
        }
      ],
      "subtotal": 39.98,
      "total": 39.98,
      "currency": "USD",
      "customerName": "Juan Pérez",
      "customerPhone": "+1234567890",
      "customerEmail": "juan@example.com",
      "customerAddress": "Calle 123, Ciudad",
      "customerNotes": "Entregar entre 2pm y 5pm",
      "channel": "WHATSAPP",
      "whatsappNumber": "+1234567890",
      "messageGenerated": "...",
      "whatsappUrl": "https://wa.me/1234567890?text=...",
      "createdAt": "2024-01-10T15:30:00.000Z"
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

**💡 Usar esto para:**
- Dashboard de órdenes del admin
- Historial de ventas
- Estadísticas de pedidos
- Re-enviar mensaje de WhatsApp (usando `whatsappUrl`)

---

## 🎯 Flujos Comunes

### Flujo 1: Registro y Creación de Tienda

```bash
# 1. Registrar usuario
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"John Doe"}'

# Respuesta: { "accessToken": "...", "refreshToken": "...", "user": {...} }
# Guardar tokens

# 2. Crear tienda
curl -X POST http://localhost:3001/api/stores \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Mi Tienda","whatsappNumbers":["+1234567890"]}'

# Respuesta: { "id": "store123", "slug": "mi-tienda", ... }
# Guardar storeId y slug
```

---

### Flujo 2: Setup Completo de Catálogo

```bash
# 1. Crear categorías
curl -X POST http://localhost:3001/api/stores/store123/categories \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Ropa","sortOrder":1}'

# 2. Crear producto con atributos
curl -X POST http://localhost:3001/api/stores/store123/products \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Camiseta",
    "basePrice":19.99,
    "categoryIds":["cat123"],
    "attributes":[{"name":"Talla","options":["S","M","L"]}]
  }'

# 3. Crear variantes
curl -X POST http://localhost:3001/api/stores/store123/products/prod123/variants \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"combination":{"Talla":"M"},"stock":50}'
```

---

### Flujo 3: Cliente Navega y Compra

```bash
# 1. Ver tienda
curl http://localhost:3001/api/public/mi-tienda

# 2. Ver categorías
curl http://localhost:3001/api/public/mi-tienda/categories

# 3. Ver productos
curl "http://localhost:3001/api/public/mi-tienda/products?categoryId=cat123"

# 4. Ver detalle de producto
curl http://localhost:3001/api/public/mi-tienda/products/camiseta-basica

# 5. Hacer checkout
curl -X POST http://localhost:3001/api/public/mi-tienda/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items":[{"productId":"prod123","variantId":"var123","quantity":2}],
    "customerName":"Juan",
    "channel":"WHATSAPP"
  }'

# Respuesta incluye whatsappUrl
# Frontend: window.open(response.whatsappUrl)
```

---

### Flujo 4: Admin Revisa Órdenes

```bash
# Listar órdenes
curl "http://localhost:3001/api/stores/store123/orders?page=1&limit=20" \
  -H "Authorization: Bearer <token>"

# Ver todas las órdenes recientes
# Filtrar por fecha, estado, etc.
```

---

## 📝 Notas Importantes

### Autenticación
- `accessToken` expira en **15 minutos**
- `refreshToken` expira en **7 días**
- Implementar refresh automático en interceptor

### Paginación
- Todos los listados soportan paginación
- Default: `page=1`, `limit=10`
- Máximo: `limit=100`

### Slugs
- Se generan automáticamente del `name`
- Son únicos por tienda
- Ejemplo: "Mi Tienda" → "mi-tienda"
- Si ya existe, se agrega número: "mi-tienda-2"

### Variantes
- Requieren `attributes` en el producto
- `priceAdjustment` se suma al `basePrice`
- Cada variante puede tener stock independiente
- `isAvailable` para pausar ventas temporalmente

### WhatsApp
- URL formato: `https://wa.me/{number}?text={message}`
- Mensaje está pre-encoded (URL encoded)
- Abre app de WhatsApp automáticamente
- Funciona en móvil y desktop

### Errores Comunes
- `401` - Token inválido o expirado → Refrescar token
- `403` - No eres dueño de este recurso
- `404` - Recurso no encontrado
- `409` - Conflicto (ej: email ya existe)
- `400` - Validación fallida → Ver detalles en response

---

## 🔗 Enlaces Útiles

- **Swagger UI:** http://localhost:3001/api/docs
- **Health Check:** http://localhost:3001/api/health (si está implementado)

---

## 💡 Tips para Frontend

### 1. Manejo de Tokens
```javascript
// axios interceptor
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Refresh automático
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      const { data } = await axios.post('/api/auth/refresh', { refreshToken });
      localStorage.setItem('accessToken', data.accessToken);
      error.config.headers.Authorization = `Bearer ${data.accessToken}`;
      return axios(error.config);
    }
    return Promise.reject(error);
  }
);
```

### 2. Carrito Local
```javascript
// Guardar carrito en localStorage
const cart = [
  { productId: 'prod123', variantId: 'var123', quantity: 2, name: 'Camiseta M', price: 19.99 }
];
localStorage.setItem('cart', JSON.stringify(cart));

// Convertir para API
const orderItems = cart.map(item => ({
  productId: item.productId,
  variantId: item.variantId,
  quantity: item.quantity
}));
```

### 3. Checkout con WhatsApp
```javascript
const handleCheckout = async (cart, customerData) => {
  const response = await fetch(`/api/public/${slug}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: cart,
      ...customerData,
      channel: 'WHATSAPP'
    })
  });

  const order = await response.json();

  // Abrir WhatsApp
  window.open(order.whatsappUrl, '_blank');

  // Limpiar carrito
  localStorage.removeItem('cart');
};
```

### 4. Selector de Variantes
```javascript
// Calcular precio con variante
const getVariantPrice = (product, selectedVariant) => {
  const variant = product.variants.find(v => v.id === selectedVariant);
  return product.basePrice + (variant?.priceAdjustment || 0);
};

// Generar combinaciones disponibles
const getAvailableVariants = (product) => {
  return product.variants
    .filter(v => v.isAvailable)
    .map(v => ({
      id: v.id,
      label: Object.values(v.combination).join(' / '),
      price: product.basePrice + v.priceAdjustment,
      stock: v.stock
    }));
};
```

---

¿Necesitas ejemplos adicionales o tienes preguntas sobre algún endpoint?
