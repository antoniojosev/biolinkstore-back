# API Endpoints - Complete List

## 🔐 Authentication (`/api/auth`)

### POST /api/auth/register
Registrar un nuevo usuario

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe" // opcional
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "clxxx",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

---

### POST /api/auth/login
Login con email y password

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "clxxx",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

---

### POST /api/auth/refresh
Refrescar access token

**Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

---

## 👤 Users (`/api/users`)

**🔒 Todos requieren autenticación**

### GET /api/users/me
Obtener perfil del usuario actual

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "id": "clxxx",
  "email": "user@example.com",
  "name": "John Doe",
  "avatar": "https://...",
  "emailVerified": "2024-01-10T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-10T00:00:00.000Z"
}
```

---

### PATCH /api/users/me
Actualizar perfil del usuario actual

**Headers:**
```
Authorization: Bearer <access_token>
```

**Body:**
```json
{
  "name": "Jane Doe",
  "avatar": "https://example.com/avatar.jpg"
}
```

**Response:** Mismo formato que GET /api/users/me

---

## 🏪 Stores (`/api/stores`)

**🔒 Todos requieren autenticación**

### POST /api/stores
Crear nueva tienda

**Body:**
```json
{
  "name": "Mi Tienda",
  "description": "Tienda de ropa y accesorios",
  "whatsappNumbers": ["+1234567890"],
  "instagramHandle": "@mitienda"
}
```

**Response:**
```json
{
  "id": "clxxx",
  "slug": "mi-tienda",
  "name": "Mi Tienda",
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
  "ownerId": "clxxx",
  "subscription": {
    "plan": "FREE",
    "status": "ACTIVE"
  },
  "createdAt": "2024-01-10T00:00:00.000Z",
  "updatedAt": "2024-01-10T00:00:00.000Z"
}
```

---

### GET /api/stores
Listar tiendas del usuario (con paginación)

**Query Params:**
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `sortBy` (string, default: "createdAt")
- `sortOrder` ("asc" | "desc", default: "desc")

**Response:**
```json
{
  "data": [/* array of stores */],
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
Obtener detalles de una tienda

**Response:** Mismo formato que POST /api/stores

---

### PATCH /api/stores/:storeId
Actualizar tienda

**Body:**
```json
{
  "name": "Nuevo Nombre",
  "logo": "https://example.com/logo.png",
  "primaryColor": "#ff0000",
  "template": "modern",
  "showBranding": false
}
```

**Response:** Mismo formato que POST /api/stores

---

### DELETE /api/stores/:storeId
Eliminar tienda

**Response:** 204 No Content

---

## 📦 Products (`/api/stores/:storeId/products`)

**🔒 Todos requieren autenticación + ownership de la tienda**

### POST /api/stores/:storeId/products
Crear nuevo producto

**Body:**
```json
{
  "name": "Camiseta Básica",
  "description": "Camiseta de algodón 100%",
  "basePrice": 19.99,
  "compareAtPrice": 29.99,
  "images": ["https://example.com/image1.jpg"],
  "videos": [],
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
  "categoryIds": ["cat-id-1", "cat-id-2"]
}
```

**Response:**
```json
{
  "id": "clxxx",
  "storeId": "store-id",
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
      "id": "attr-id",
      "name": "Talla",
      "options": ["S", "M", "L", "XL"],
      "sortOrder": 1
    }
  ],
  "variants": [],
  "categoryIds": ["cat-id-1", "cat-id-2"],
  "createdAt": "2024-01-10T00:00:00.000Z",
  "updatedAt": "2024-01-10T00:00:00.000Z"
}
```

---

### GET /api/stores/:storeId/products
Listar productos de una tienda

**Query Params:**
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `categoryId` (string, opcional) - Filtrar por categoría
- `isVisible` (boolean, opcional) - Filtrar por visibilidad
- `isFeatured` (boolean, opcional) - Filtrar destacados
- `isOnSale` (boolean, opcional) - Filtrar en oferta
- `search` (string, opcional) - Buscar por nombre, descripción o SKU
- `sortBy` (string, default: "sortOrder")
- `sortOrder` ("asc" | "desc", default: "asc")

**Response:**
```json
{
  "data": [/* array of products */],
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

---

### GET /api/stores/:storeId/products/:productId
Obtener detalles de un producto

**Response:** Mismo formato que POST products

---

### PATCH /api/stores/:storeId/products/:productId
Actualizar producto

**Body:**
```json
{
  "name": "Camiseta Premium",
  "basePrice": 24.99,
  "isVisible": false,
  "categoryIds": ["cat-id-1"]
}
```

**Response:** Mismo formato que POST products

---

### DELETE /api/stores/:storeId/products/:productId
Eliminar producto

**Response:** 204 No Content

---

### POST /api/stores/:storeId/products/:productId/duplicate
Duplicar producto

Crea una copia del producto con:
- Nombre: "Nombre Original (Copy)"
- Slug único autogenerado
- SKU: "SKU-COPY"
- isVisible: false (empieza oculto)

**Response:** Mismo formato que POST products

---

## 🎨 Product Variants (`/api/stores/:storeId/products/:productId/variants`)

**🔒 Todos requieren autenticación + ownership de la tienda**

### POST /api/stores/:storeId/products/:productId/variants
Crear variante de producto

**Body:**
```json
{
  "combination": {
    "Talla": "M",
    "Color": "Rojo"
  },
  "sku": "SHIRT-M-RED",
  "priceAdjustment": 2.00,
  "stock": 25,
  "image": "https://example.com/variant.jpg",
  "isAvailable": true
}
```

**Response:**
```json
{
  "id": "variant-id",
  "combination": {
    "Talla": "M",
    "Color": "Rojo"
  },
  "sku": "SHIRT-M-RED",
  "priceAdjustment": 2.00,
  "stock": 25,
  "image": "https://example.com/variant.jpg",
  "isAvailable": true
}
```

---

### PATCH /api/stores/:storeId/products/:productId/variants/:variantId
Actualizar variante

**Body:**
```json
{
  "stock": 30,
  "priceAdjustment": 3.00,
  "isAvailable": false
}
```

**Response:** Mismo formato que POST variant

---

### DELETE /api/stores/:storeId/products/:productId/variants/:variantId
Eliminar variante

**Response:** 204 No Content

---

## 🏷️ Categories (`/api/stores/:storeId/categories`)

**🔒 Todos requieren autenticación + ownership de la tienda**

### POST /api/stores/:storeId/categories
Crear nueva categoría

**Body:**
```json
{
  "name": "Ropa",
  "description": "Categoría de ropa y accesorios",
  "image": "https://example.com/category.jpg",
  "isVisible": true,
  "sortOrder": 1
}
```

**Response:**
```json
{
  "id": "cat-id",
  "storeId": "store-id",
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
Listar categorías de una tienda

**Query Params:**
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `sortBy` (string, default: "sortOrder")
- `sortOrder` ("asc" | "desc", default: "asc")

**Response:**
```json
{
  "data": [/* array of categories */],
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
Obtener detalles de una categoría

**Response:** Mismo formato que POST category

---

### PATCH /api/stores/:storeId/categories/:categoryId
Actualizar categoría

**Body:**
```json
{
  "name": "Ropa y Accesorios",
  "isVisible": false,
  "sortOrder": 2
}
```

**Response:** Mismo formato que POST category

---

### DELETE /api/stores/:storeId/categories/:categoryId
Eliminar categoría

**Response:** 204 No Content

---

## 📊 Resumen de Endpoints

### Total: **27 endpoints**

| Módulo | Endpoints |
|--------|-----------|
| Auth | 3 |
| Users | 2 |
| Stores | 5 |
| Products | 6 |
| Variants | 3 |
| Categories | 5 |
| **TOTAL** | **24** |

---

## 🔑 Autenticación

Todos los endpoints excepto Auth requieren el header:

```
Authorization: Bearer <access_token>
```

Para obtener el token:
1. Registrarse: `POST /api/auth/register`
2. O hacer login: `POST /api/auth/login`
3. Usar el `accessToken` en el header

Cuando el access token expire (15 minutos):
1. Usar el `refreshToken` en `POST /api/auth/refresh`
2. Obtendrás un nuevo par de tokens

---

## 🛡️ Guards Implementados

1. **JwtAuthGuard** - Valida JWT en todos los endpoints (excepto `@Public`)
2. **StoreOwnerGuard** - Valida que el usuario sea dueño de la tienda
3. **PlanFeatureGuard** - Valida features según el plan (para futuro)
4. **ThrottlerGuard** - Rate limiting (100 req/min)

---

## 📖 Testing con Swagger

Todos estos endpoints están documentados en Swagger:

**http://localhost:3001/api/docs**

### Para probar:
1. Abre Swagger
2. Haz clic en "Authorize" (icono de candado)
3. Ingresa: `Bearer <tu_access_token>`
4. Ya puedes probar todos los endpoints

---

## 🎯 Flujo Típico

### 1. Crear cuenta y tienda
```bash
# 1. Registrarse
POST /api/auth/register
{
  "email": "test@example.com",
  "password": "password123"
}

# 2. Crear tienda
POST /api/stores
{
  "name": "Mi Tienda",
  "whatsappNumbers": ["+1234567890"]
}
```

### 2. Crear categorías
```bash
POST /api/stores/{storeId}/categories
{
  "name": "Ropa"
}
```

### 3. Crear productos
```bash
POST /api/stores/{storeId}/products
{
  "name": "Camiseta",
  "basePrice": 19.99,
  "categoryIds": ["{categoryId}"],
  "attributes": [
    {
      "name": "Talla",
      "options": ["S", "M", "L"]
    }
  ]
}
```

### 4. Crear variantes
```bash
POST /api/stores/{storeId}/products/{productId}/variants
{
  "combination": { "Talla": "M" },
  "stock": 50
}
```

---

## 🚀 Próximos Endpoints (Phase 3)

- **Public Module** - Endpoints públicos (sin auth)
  - `GET /api/public/:slug` - Ver tienda pública
  - `GET /api/public/:slug/products` - Productos públicos

- **Orders Module** - Intenciones de pedido
  - `POST /api/stores/:storeId/orders` - Crear order intent
  - `GET /api/stores/:storeId/orders` - Listar orders

---

¿Necesitas ejemplos de algún endpoint específico?
