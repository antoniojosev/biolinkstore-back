# 🎉 API Completa - 33 Endpoints

## Resumen por Módulo

| Módulo | Endpoints | Auth Requerido |
|--------|-----------|----------------|
| 🔐 Auth | 3 | ❌ No |
| 👤 Users | 2 | ✅ Sí |
| 🏪 Stores | 5 | ✅ Sí |
| 📦 Products | 7 | ✅ Sí |
| 🎨 Variants | 3 | ✅ Sí |
| 🏷️ Categories | 5 | ✅ Sí |
| 🌍 Public | 4 | ❌ No (público) |
| 🛒 Orders | 2 | 1 público, 1 privado |
| **TOTAL** | **31** | - |

---

## 🌍 Public Endpoints (No requieren autenticación)

Estos son los endpoints que los **clientes finales** usan para ver el catálogo público.

### GET /api/public/:slug
**Obtener información de la tienda pública**

```bash
GET /api/public/mi-tienda
```

**Response:**
```json
{
  "id": "store-id",
  "slug": "mi-tienda",
  "name": "Mi Tienda",
  "description": "Descripción de la tienda",
  "logo": "https://...",
  "banner": "https://...",
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
  "address": "Calle 123",
  "businessHours": null,
  "showBranding": true
}
```

---

### GET /api/public/:slug/categories
**Obtener categorías públicas de la tienda**

```bash
GET /api/public/mi-tienda/categories
```

**Response:**
```json
[
  {
    "id": "cat-id",
    "name": "Ropa",
    "slug": "ropa",
    "description": "Categoría de ropa",
    "image": "https://...",
    "productCount": 15
  }
]
```

---

### GET /api/public/:slug/products
**Listar productos públicos (solo visibles)**

```bash
GET /api/public/mi-tienda/products?page=1&limit=10&categoryId=cat-id&search=camisa
```

**Query Params:**
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `categoryId` (string, opcional) - Filtrar por categoría
- `isFeatured` (boolean, opcional) - Solo destacados
- `isOnSale` (boolean, opcional) - Solo en oferta
- `search` (string, opcional) - Buscar por nombre/descripción
- `sortBy` (string, default: "sortOrder")
- `sortOrder` ("asc" | "desc", default: "asc")

**Response:**
```json
{
  "data": [
    {
      "id": "prod-id",
      "name": "Camiseta",
      "slug": "camiseta-basica",
      "description": "Camiseta 100% algodón",
      "basePrice": 19.99,
      "compareAtPrice": 29.99,
      "images": ["https://..."],
      "videos": [],
      "stock": null, // null si stockEnabled = false
      "isFeatured": true,
      "isOnSale": true,
      "attributes": [
        {
          "id": "attr-id",
          "name": "Talla",
          "options": ["S", "M", "L", "XL"],
          "sortOrder": 1
        }
      ],
      "variants": [
        {
          "id": "var-id",
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
          "id": "cat-id",
          "name": "Ropa",
          "slug": "ropa"
        }
      ]
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

---

### GET /api/public/:slug/products/:productSlug
**Ver detalles de un producto público**

```bash
GET /api/public/mi-tienda/products/camiseta-basica
```

**Response:** Mismo formato que un producto individual del endpoint anterior

---

## 🛒 Orders (Intenciones de Pedido)

### POST /api/public/:slug/orders ❌ Público
**Crear orden desde el storefront público**

Este endpoint es el **corazón de la funcionalidad de checkout**. Convierte el carrito en un pedido y genera el mensaje para WhatsApp.

```bash
POST /api/public/mi-tienda/orders
```

**Body:**
```json
{
  "items": [
    {
      "productId": "prod-id-1",
      "variantId": "var-id-1",  // opcional
      "quantity": 2
    },
    {
      "productId": "prod-id-2",
      "quantity": 1
    }
  ],
  "currency": "USD",  // opcional, default: USD
  "customerName": "Juan Pérez",  // opcional
  "customerPhone": "+1234567890",  // opcional
  "customerEmail": "juan@example.com",  // opcional
  "customerAddress": "Calle 123, Ciudad",  // opcional
  "customerNotes": "Entregar entre 2pm y 5pm",  // opcional
  "channel": "WHATSAPP",  // o "INSTAGRAM"
  "whatsappNumber": "+1234567890"  // opcional, usa el de la tienda si no se provee
}
```

**Response:**
```json
{
  "id": "order-id",
  "storeId": "store-id",
  "items": [
    {
      "id": "item-id",
      "productId": "prod-id",
      "variantId": "var-id",
      "productName": "Camiseta Básica",
      "variantName": "M / Rojo",
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
  "customerAddress": "Calle 123",
  "customerNotes": "Entregar entre 2pm y 5pm",
  "channel": "WHATSAPP",
  "whatsappNumber": "+1234567890",
  "messageGenerated": "🛍️ *Nuevo Pedido - Mi Tienda*\n\n📦 *Productos:*\n1. Camiseta Básica (M / Rojo)\n   Cantidad: 2\n   Precio: $19.99\n   Subtotal: $39.98\n\n💰 *Total: $39.98*\n\n👤 *Datos del Cliente:*\nNombre: Juan Pérez\nTeléfono: +1234567890\nEmail: juan@example.com\nDirección: Calle 123\n\n📝 *Notas:*\nEntregar entre 2pm y 5pm\n\n_Pedido generado desde el catálogo web_",
  "whatsappUrl": "https://wa.me/1234567890?text=...",
  "createdAt": "2024-01-10T00:00:00.000Z"
}
```

**El frontend puede usar `whatsappUrl` para abrir WhatsApp con el mensaje pre-llenado!**

---

### GET /api/stores/:storeId/orders ✅ Privado
**Listar órdenes de una tienda (admin)**

```bash
GET /api/stores/store-id/orders?page=1&limit=20
Authorization: Bearer <token>
```

**Query Params:**
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `sortBy` (string, default: "createdAt")
- `sortOrder` ("asc" | "desc", default: "desc")

**Response:**
```json
{
  "data": [/* array of orders */],
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

---

## 🚀 Flujo Completo de Usuario Final

### 1. Cliente visita la tienda
```bash
GET /api/public/mi-tienda
# Obtiene logo, colores, información de contacto
```

### 2. Cliente ve las categorías
```bash
GET /api/public/mi-tienda/categories
# Muestra menú de categorías
```

### 3. Cliente navega productos
```bash
GET /api/public/mi-tienda/products?categoryId=ropa&page=1
# Lista productos de esa categoría
```

### 4. Cliente ve detalles de un producto
```bash
GET /api/public/mi-tienda/products/camiseta-basica
# Ve descripción, imágenes, variantes, precios
```

### 5. Cliente hace checkout (carrito → WhatsApp)
```bash
POST /api/public/mi-tienda/orders
{
  "items": [
    { "productId": "...", "variantId": "...", "quantity": 2 }
  ],
  "customerName": "Juan",
  "customerPhone": "+123456",
  "channel": "WHATSAPP"
}

# Backend:
# 1. Valida productos y variantes
# 2. Calcula totales
# 3. Genera mensaje formateado para WhatsApp
# 4. Guarda order intent en BD
# 5. Retorna whatsappUrl pre-llenada
```

### 6. Frontend abre WhatsApp
```javascript
window.open(response.whatsappUrl, '_blank');
// Abre WhatsApp con el mensaje completo del pedido
```

### 7. Tienda recibe el pedido por WhatsApp
El dueño de la tienda recibe un mensaje formateado:
```
🛍️ *Nuevo Pedido - Mi Tienda*

📦 *Productos:*
1. Camiseta Básica (M / Rojo)
   Cantidad: 2
   Precio: $19.99
   Subtotal: $39.98

💰 *Total: $39.98*

👤 *Datos del Cliente:*
Nombre: Juan Pérez
Teléfono: +1234567890
Email: juan@example.com

_Pedido generado desde el catálogo web_
```

### 8. Admin revisa órdenes en el dashboard
```bash
GET /api/stores/store-id/orders
Authorization: Bearer <token>
# Ve historial de todas las órdenes
```

---

## 🎯 Casos de Uso Reales

### Caso 1: Tienda de Ropa
- Cliente busca "vestido rojo"
- Ve productos en oferta
- Selecciona talla y color (variante)
- Hace pedido con envío a domicilio
- WhatsApp se abre con todo el detalle

### Caso 2: Tienda de Comida
- Cliente ve categorías (Pizzas, Bebidas, Postres)
- Arma combo: 2 pizzas + 2 bebidas
- Especifica dirección de entrega
- Notas: "Sin cebolla, extra queso"
- Envía pedido por WhatsApp

### Caso 3: Tienda de Tecnología
- Productos con múltiples variantes (Color, Almacenamiento)
- Stock visible si está habilitado
- Cliente consulta disponibilidad
- Hace pedido de varios productos
- Coordina pago y entrega por WhatsApp

---

## 📊 Total de Endpoints

### Desglose Final

**Autenticados (requieren JWT):**
- Users: 2
- Stores: 5
- Products: 7
- Variants: 3
- Categories: 5
- Orders (admin): 1
**Subtotal autenticados:** 23

**Públicos (no requieren auth):**
- Auth: 3
- Public: 4 (tienda, categorías, productos, detalle producto)
- Orders (checkout): 1
**Subtotal públicos:** 8

**TOTAL: 31 endpoints**

---

## 🌟 Características Destacadas

### ✅ Sistema de Variantes Completo
- Atributos dinámicos (Talla, Color, etc.)
- Combinaciones automáticas
- Precio ajustable por variante
- Stock independiente

### ✅ WhatsApp Integration
- Mensaje formateado automáticamente
- URL pre-llenada lista para abrir
- Incluye todos los detalles del pedido
- Información del cliente

### ✅ Multi-tenant
- Cada tienda tiene su slug único
- Aislamiento completo de datos
- Configuración independiente

### ✅ Clean Architecture
- Separation of concerns
- Testeable
- Mantenible
- Escalable

---

## 🔗 Swagger Documentation

Todos estos endpoints están documentados en:
**http://localhost:3001/api/docs**

---

¿Quieres que cree ejemplos de uso con curl o Postman?
