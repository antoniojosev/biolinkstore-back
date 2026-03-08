import {
  PrismaClient,
  Plan,
  SubscriptionStatus,
  EventType,
  OrderStatus,
  OrderChannel,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── Helpers ────────────────────────────────────────────────
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(Math.floor(Math.random() * 14) + 8, Math.floor(Math.random() * 60));
  return d;
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ─── Image URLs (Unsplash via picsum & direct unsplash source) ──
const IMAGES = {
  // Store branding
  storeLogo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&h=200&fit=crop',
  storeBanner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop',
  // Categories
  catRopa: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&h=400&fit=crop',
  catCalzado: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
  catAccesorios: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400&h=400&fit=crop',
  catBolsos: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop',
  catDeportivo: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop',
  catTecno: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
};

// Products — each with multiple images
const PRODUCT_DATA = [
  // ─── Ropa ───
  {
    name: 'Remera Oversize Premium',
    desc: 'Remera oversize de algodón peinado 24/1. Corte relajado, ideal para looks urbanos. Costuras reforzadas.',
    price: 18500,
    compare: 24000,
    cat: 'Ropa',
    featured: true,
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&h=600&fit=crop',
    ],
    attrs: [
      { name: 'Talla', type: 'text', options: ['S', 'M', 'L', 'XL', 'XXL'] },
      {
        name: 'Color',
        type: 'color',
        options: ['Negro', 'Blanco', 'Gris', 'Beige'],
        optionsMeta: {
          Negro: { hex: '#1A1A1A' },
          Blanco: { hex: '#FAFAFA' },
          Gris: { hex: '#9CA3AF' },
          Beige: { hex: '#D4C5A9' },
        },
      },
    ],
    stock: 120,
  },
  {
    name: 'Hoodie Essential',
    desc: 'Buzo con capucha de frisa premium. Interior suave y cálido. Bolsillo canguro. Ideal para temporada de frío.',
    price: 35000,
    compare: 42000,
    cat: 'Ropa',
    featured: true,
    images: [
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1578768079470-0a4f6d7f3657?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&h=600&fit=crop',
    ],
    attrs: [
      { name: 'Talla', type: 'text', options: ['S', 'M', 'L', 'XL'] },
      {
        name: 'Color',
        type: 'color',
        options: ['Negro', 'Gris Melange', 'Azul Marino'],
        optionsMeta: {
          Negro: { hex: '#111111' },
          'Gris Melange': { hex: '#B0B0B0' },
          'Azul Marino': { hex: '#1E3A5F' },
        },
      },
    ],
    stock: 80,
  },
  {
    name: 'Jogger Cargo Relaxed',
    desc: 'Pantalón jogger cargo con bolsillos laterales. Tela gabardina stretch. Puño en el tobillo.',
    price: 28000,
    cat: 'Ropa',
    images: [
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&h=600&fit=crop',
    ],
    attrs: [
      { name: 'Talla', type: 'text', options: ['S', 'M', 'L', 'XL'] },
      {
        name: 'Color',
        type: 'color',
        options: ['Negro', 'Verde Militar', 'Beige'],
        optionsMeta: {
          Negro: { hex: '#1A1A1A' },
          'Verde Militar': { hex: '#4B5320' },
          Beige: { hex: '#C8B88A' },
        },
      },
    ],
    stock: 65,
  },
  {
    name: 'Campera Puffer Liviana',
    desc: 'Campera inflable ultraliviana con relleno térmico. Resistente al agua. Se guarda en su propio bolsillo.',
    price: 52000,
    compare: 68000,
    cat: 'Ropa',
    featured: true,
    images: [
      'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=600&fit=crop',
    ],
    attrs: [
      { name: 'Talla', type: 'text', options: ['S', 'M', 'L', 'XL'] },
      {
        name: 'Color',
        type: 'color',
        options: ['Negro', 'Rojo', 'Azul'],
        optionsMeta: {
          Negro: { hex: '#111111' },
          Rojo: { hex: '#DC2626' },
          Azul: { hex: '#2563EB' },
        },
      },
    ],
    stock: 40,
  },
  {
    name: 'Bermuda Lino Natural',
    desc: 'Bermuda de lino puro con cintura elástica. Fresca y cómoda para verano. Secado rápido.',
    price: 22000,
    cat: 'Ropa',
    images: [
      'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=600&h=600&fit=crop',
    ],
    attrs: [
      { name: 'Talla', type: 'text', options: ['S', 'M', 'L', 'XL'] },
      {
        name: 'Color',
        type: 'color',
        options: ['Natural', 'Celeste', 'Arena'],
        optionsMeta: {
          Natural: { hex: '#E8DCC8' },
          Celeste: { hex: '#87CEEB' },
          Arena: { hex: '#C2B280' },
        },
      },
    ],
    stock: 55,
  },
  {
    name: 'Musculosa Gym Pro',
    desc: 'Musculosa deportiva de tela dry-fit. Ultra transpirable. Perfecta para entrenar.',
    price: 12000,
    cat: 'Ropa',
    images: [
      'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=600&fit=crop',
    ],
    attrs: [
      { name: 'Talla', type: 'text', options: ['S', 'M', 'L', 'XL'] },
      {
        name: 'Color',
        type: 'color',
        options: ['Negro', 'Blanco', 'Gris'],
        optionsMeta: {
          Negro: { hex: '#111' },
          Blanco: { hex: '#FFF' },
          Gris: { hex: '#888' },
        },
      },
    ],
    stock: 90,
  },
  // ─── Calzado ───
  {
    name: 'Zapatillas Urban Runner',
    desc: 'Zapatillas urbanas con suela de goma antideslizante. Capellada de mesh transpirable. Muy livianas.',
    price: 45000,
    compare: 55000,
    cat: 'Calzado',
    featured: true,
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600&h=600&fit=crop',
    ],
    attrs: [
      { name: 'Talle', type: 'text', options: ['38', '39', '40', '41', '42', '43', '44'] },
      {
        name: 'Color',
        type: 'color',
        options: ['Negro/Blanco', 'Blanco Total', 'Gris/Verde'],
        optionsMeta: {
          'Negro/Blanco': { hex: '#1A1A1A' },
          'Blanco Total': { hex: '#F5F5F5' },
          'Gris/Verde': { hex: '#6B8E6B' },
        },
      },
    ],
    stock: 35,
  },
  {
    name: 'Borcegos Chelsea',
    desc: 'Borcegos estilo Chelsea en cuero sintético premium. Elástico lateral. Suela track. Unisex.',
    price: 58000,
    cat: 'Calzado',
    images: [
      'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1605812860427-4024433a70fd?w=600&h=600&fit=crop',
    ],
    attrs: [
      { name: 'Talle', type: 'text', options: ['37', '38', '39', '40', '41', '42', '43'] },
      {
        name: 'Color',
        type: 'color',
        options: ['Negro', 'Marrón'],
        optionsMeta: {
          Negro: { hex: '#1A1A1A' },
          Marrón: { hex: '#6B3A2A' },
        },
      },
    ],
    stock: 25,
  },
  {
    name: 'Ojotas Slide Comfort',
    desc: 'Ojotas slide con plantilla anatómica de EVA. Super cómodas y livianas. Logo en relieve.',
    price: 15000,
    cat: 'Calzado',
    images: [
      'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=600&h=600&fit=crop',
    ],
    attrs: [
      { name: 'Talle', type: 'text', options: ['38', '39', '40', '41', '42', '43'] },
      {
        name: 'Color',
        type: 'color',
        options: ['Negro', 'Blanco'],
        optionsMeta: {
          Negro: { hex: '#111' },
          Blanco: { hex: '#F0F0F0' },
        },
      },
    ],
    stock: 60,
  },
  // ─── Accesorios ───
  {
    name: 'Gorra Dad Hat Classic',
    desc: 'Gorra desestructurada de algodón lavado. Cierre con hebilla metálica. Logo bordado al frente.',
    price: 9500,
    cat: 'Accesorios',
    images: [
      'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?w=600&h=600&fit=crop',
    ],
    attrs: [
      {
        name: 'Color',
        type: 'color',
        options: ['Negro', 'Beige', 'Verde Oliva'],
        optionsMeta: {
          Negro: { hex: '#1A1A1A' },
          Beige: { hex: '#D4C5A9' },
          'Verde Oliva': { hex: '#556B2F' },
        },
      },
    ],
    stock: 100,
  },
  {
    name: 'Riñonera Crossbody',
    desc: 'Riñonera tipo crossbody de nylon resistente al agua. Varios compartimientos. Correa ajustable.',
    price: 16000,
    compare: 21000,
    cat: 'Accesorios',
    featured: true,
    images: [
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop',
    ],
    attrs: [
      {
        name: 'Color',
        type: 'color',
        options: ['Negro', 'Militar', 'Azul'],
        optionsMeta: {
          Negro: { hex: '#1A1A1A' },
          Militar: { hex: '#4B5320' },
          Azul: { hex: '#1E40AF' },
        },
      },
    ],
    stock: 45,
  },
  {
    name: 'Lentes de Sol Retro',
    desc: 'Lentes de sol con montura acetato estilo retro. Protección UV400. Incluye estuche rígido.',
    price: 14000,
    cat: 'Accesorios',
    images: [
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&h=600&fit=crop',
    ],
    attrs: [
      {
        name: 'Color',
        type: 'color',
        options: ['Negro Mate', 'Carey', 'Transparente'],
        optionsMeta: {
          'Negro Mate': { hex: '#2D2D2D' },
          Carey: { hex: '#8B6914' },
          Transparente: { hex: '#E0E0E0' },
        },
      },
    ],
    stock: 70,
  },
  {
    name: 'Cinturón Trenzado',
    desc: 'Cinturón trenzado elástico con hebilla plateada. Se adapta a cualquier talle. Unisex.',
    price: 8500,
    cat: 'Accesorios',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop',
    ],
    attrs: [
      {
        name: 'Color',
        type: 'color',
        options: ['Negro', 'Marrón', 'Azul Marino'],
        optionsMeta: {
          Negro: { hex: '#111' },
          Marrón: { hex: '#8B4513' },
          'Azul Marino': { hex: '#1E3A5F' },
        },
      },
    ],
    stock: 80,
  },
  // ─── Bolsos ───
  {
    name: 'Mochila Urban 25L',
    desc: 'Mochila urbana de 25 litros con compartimiento para laptop 15". Tela repelente al agua. Espalda acolchada.',
    price: 32000,
    compare: 40000,
    cat: 'Bolsos',
    featured: true,
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1622560480654-d96214fdc887?w=600&h=600&fit=crop',
    ],
    attrs: [
      {
        name: 'Color',
        type: 'color',
        options: ['Negro', 'Gris Oscuro', 'Azul'],
        optionsMeta: {
          Negro: { hex: '#1A1A1A' },
          'Gris Oscuro': { hex: '#4A4A4A' },
          Azul: { hex: '#2563EB' },
        },
      },
    ],
    stock: 30,
  },
  {
    name: 'Tote Bag Canvas',
    desc: 'Bolso tote de lona gruesa con estampa serigrafiada. Asas largas para hombro. Cierre con botón magnético.',
    price: 11000,
    cat: 'Bolsos',
    images: [
      'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600&h=600&fit=crop',
    ],
    attrs: [
      {
        name: 'Color',
        type: 'color',
        options: ['Natural', 'Negro'],
        optionsMeta: {
          Natural: { hex: '#E8DCC8' },
          Negro: { hex: '#1A1A1A' },
        },
      },
    ],
    stock: 50,
  },
  // ─── Deportivo ───
  {
    name: 'Shorts Running Dry',
    desc: 'Short de running con calza interna. Tela dry-fit ultra liviana. Bolsillo trasero con cierre.',
    price: 16500,
    cat: 'Deportivo',
    images: [
      'https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&h=600&fit=crop',
    ],
    attrs: [
      { name: 'Talla', type: 'text', options: ['S', 'M', 'L', 'XL'] },
      {
        name: 'Color',
        type: 'color',
        options: ['Negro', 'Azul', 'Gris'],
        optionsMeta: {
          Negro: { hex: '#111' },
          Azul: { hex: '#3B82F6' },
          Gris: { hex: '#9CA3AF' },
        },
      },
    ],
    stock: 70,
  },
  {
    name: 'Remera Compression Fit',
    desc: 'Remera de compresión para entrenamiento. Tela elástica 4 vías. Costuras planas anti-roce.',
    price: 14000,
    cat: 'Deportivo',
    images: [
      'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=600&h=600&fit=crop',
    ],
    attrs: [
      { name: 'Talla', type: 'text', options: ['S', 'M', 'L', 'XL'] },
      {
        name: 'Color',
        type: 'color',
        options: ['Negro', 'Blanco'],
        optionsMeta: {
          Negro: { hex: '#111' },
          Blanco: { hex: '#F5F5F5' },
        },
      },
    ],
    stock: 55,
  },
  {
    name: 'Medias Pack x3 Training',
    desc: 'Pack de 3 pares de medias deportivas. Caña media con refuerzo en talón y punta. Algodón con elastano.',
    price: 6500,
    cat: 'Deportivo',
    images: [
      'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=600&h=600&fit=crop',
    ],
    attrs: [
      { name: 'Talle', type: 'text', options: ['35-38', '39-42', '43-46'] },
    ],
    stock: 150,
  },
  // ─── Tecnología ───
  {
    name: 'Auriculares Bluetooth Pro',
    desc: 'Auriculares TWS con cancelación de ruido activa. 30hs de batería con estuche. Resistentes al agua IPX5.',
    price: 38000,
    compare: 48000,
    cat: 'Tecnología',
    featured: true,
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&h=600&fit=crop',
    ],
    attrs: [
      {
        name: 'Color',
        type: 'color',
        options: ['Negro', 'Blanco'],
        optionsMeta: {
          Negro: { hex: '#1A1A1A' },
          Blanco: { hex: '#F5F5F5' },
        },
      },
    ],
    stock: 20,
  },
  {
    name: 'Smartwatch FitBand',
    desc: 'Reloj inteligente con monitor cardíaco, SpO2, GPS y 20+ modos deportivos. Pantalla AMOLED 1.4".',
    price: 42000,
    cat: 'Tecnología',
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=600&h=600&fit=crop',
    ],
    attrs: [
      {
        name: 'Color',
        type: 'color',
        options: ['Negro', 'Rose Gold', 'Plateado'],
        optionsMeta: {
          Negro: { hex: '#1A1A1A' },
          'Rose Gold': { hex: '#B76E79' },
          Plateado: { hex: '#C0C0C0' },
        },
      },
    ],
    stock: 15,
  },
  {
    name: 'Parlante Portátil 10W',
    desc: 'Parlante bluetooth portátil de 10W. Batería de 12hs. Resistente al agua IPX6. Conexión TWS para estéreo.',
    price: 25000,
    cat: 'Tecnología',
    images: [
      'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1589003077984-894e133dabab?w=600&h=600&fit=crop',
    ],
    attrs: [
      {
        name: 'Color',
        type: 'color',
        options: ['Negro', 'Azul', 'Rojo'],
        optionsMeta: {
          Negro: { hex: '#1A1A1A' },
          Azul: { hex: '#2563EB' },
          Rojo: { hex: '#DC2626' },
        },
      },
    ],
    stock: 35,
  },
  {
    name: 'Cargador Inalámbrico Pad',
    desc: 'Cargador inalámbrico Qi de 15W. Compatible con iPhone y Android. LED indicador. Base antideslizante.',
    price: 12000,
    cat: 'Tecnología',
    images: [
      'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&h=600&fit=crop',
    ],
    attrs: [
      {
        name: 'Color',
        type: 'color',
        options: ['Negro', 'Blanco'],
        optionsMeta: {
          Negro: { hex: '#1A1A1A' },
          Blanco: { hex: '#F5F5F5' },
        },
      },
    ],
    stock: 40,
  },
];

// ─── Customer names for orders ──────────────────────────────
const CUSTOMERS = [
  { name: 'Valentina López', phone: '+5491155001234' },
  { name: 'Martín García', phone: '+5491144002345' },
  { name: 'Camila Rodriguez', phone: '+5491133003456' },
  { name: 'Santiago Fernández', phone: '+5491122004567' },
  { name: 'Lucía Martínez', phone: '+5491111005678' },
  { name: 'Mateo González', phone: '+5491166006789' },
  { name: 'Sofía Pérez', phone: '+5491177007890' },
  { name: 'Tomás Sánchez', phone: '+5491188008901' },
  { name: 'Isabella Díaz', phone: '+5491199009012' },
  { name: 'Benjamín Torres', phone: '+5491100010123' },
  { name: 'Florencia Ramírez', phone: '+5491111011234' },
  { name: 'Nicolás Morales', phone: '+5491122012345' },
];

// ─── Main ───────────────────────────────────────────────────
async function main() {
  console.log('🌱 Starting full demo seed...\n');

  // Clean existing demo data
  const existingUser = await prisma.user.findUnique({ where: { email: 'demo@example.com' } });
  if (existingUser) {
    const existingStores = await prisma.store.findMany({ where: { ownerId: existingUser.id } });
    for (const s of existingStores) {
      // Delete order items before orders (FK order_items → products)
      const orders = await prisma.orderIntent.findMany({ where: { storeId: s.id } });
      for (const o of orders) {
        await prisma.orderItem.deleteMany({ where: { orderId: o.id } });
      }
      await prisma.orderIntent.deleteMany({ where: { storeId: s.id } });
      await prisma.store.delete({ where: { id: s.id } });
    }
    await prisma.user.delete({ where: { id: existingUser.id } });
    console.log('🧹 Cleaned previous demo data');
  }

  // ─── 1. User ──────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'demo@example.com',
      passwordHash,
      name: 'María Demo',
      emailVerified: new Date(),
    },
  });
  console.log('✅ User: demo@example.com / password123');

  // ─── 2. Store ─────────────────────────────────────────────
  const store = await prisma.store.create({
    data: {
      slug: 'demo-store',
      username: 'demo-store',
      name: 'URBAN STYLE',
      description: 'Tu tienda de moda urbana. Envíos a todo el país. Calidad premium a precios accesibles.',
      logo: IMAGES.storeLogo,
      banner: IMAGES.storeBanner,
      primaryColor: '#1A1A1A',
      secondaryColor: '#C9A86C',
      template: 'luxora',
      whatsappNumbers: ['+5491155551234'],
      instagramHandle: 'urbanstyle.ar',
      email: 'hola@urbanstyle.com',
      currencyConfig: { code: 'ARS', symbol: '$', locale: 'es-AR' },
      stockEnabled: true,
      showBranding: true,
      ownerId: user.id,
    },
  });
  console.log(`✅ Store: "${store.name}" (/${store.slug}) — template: luxora`);

  // ─── 3. Subscription (PRO so dashboard has analytics) ─────
  await prisma.subscription.create({
    data: {
      storeId: store.id,
      plan: Plan.PRO,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: daysAgo(15),
      currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    },
  });
  console.log('✅ Subscription: PRO (active)');

  // ─── 4. Categories ────────────────────────────────────────
  const categoryMap: Record<string, string> = {};
  const categoriesData = [
    { name: 'Ropa', image: IMAGES.catRopa, order: 1 },
    { name: 'Calzado', image: IMAGES.catCalzado, order: 2 },
    { name: 'Accesorios', image: IMAGES.catAccesorios, order: 3 },
    { name: 'Bolsos', image: IMAGES.catBolsos, order: 4 },
    { name: 'Deportivo', image: IMAGES.catDeportivo, order: 5 },
    { name: 'Tecnología', image: IMAGES.catTecno, order: 6 },
  ];

  for (const c of categoriesData) {
    const cat = await prisma.category.create({
      data: {
        storeId: store.id,
        name: c.name,
        slug: slug(c.name),
        image: c.image,
        sortOrder: c.order,
      },
    });
    categoryMap[c.name] = cat.id;
  }
  console.log(`✅ Categories: ${categoriesData.length}`);

  // ─── 5. Products with attributes & variants ───────────────
  const productIds: string[] = [];

  for (let i = 0; i < PRODUCT_DATA.length; i++) {
    const p = PRODUCT_DATA[i];
    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        name: p.name,
        slug: slug(p.name),
        description: p.desc,
        basePrice: p.price,
        compareAtPrice: p.compare ?? null,
        images: p.images,
        stock: p.stock,
        sku: `SKU-${String(i + 1).padStart(3, '0')}`,
        isVisible: true,
        isFeatured: p.featured ?? false,
        isOnSale: !!p.compare,
        sortOrder: i,
        categories: {
          create: { categoryId: categoryMap[p.cat] },
        },
        attributes: {
          create: p.attrs.map((a, idx) => ({
            name: a.name,
            type: a.type,
            options: a.options,
            optionsMeta: a.optionsMeta ?? undefined,
            sortOrder: idx,
          })),
        },
      },
    });
    productIds.push(product.id);

    // Create a few variants with price adjustments for products with 2 attributes
    if (p.attrs.length >= 2) {
      const colorAttr = p.attrs.find((a) => a.type === 'color');
      const sizeAttr = p.attrs.find((a) => a.type === 'text');
      if (colorAttr && sizeAttr) {
        // Create variants for first 2 colors x first 3 sizes
        const colors = colorAttr.options.slice(0, 2);
        const sizes = sizeAttr.options.slice(0, 3);
        for (const color of colors) {
          for (const size of sizes) {
            const adj =
              size === sizeAttr.options[sizeAttr.options.length - 1]
                ? Math.round(p.price * 0.05) // XL/last size: +5%
                : 0;
            await prisma.productVariant.create({
              data: {
                productId: product.id,
                combination: { [colorAttr.name]: color, [sizeAttr.name]: size },
                priceAdjustment: adj,
                stock: randomBetween(3, 15),
                isAvailable: Math.random() > 0.1,
              },
            });
          }
        }
      }
    }
  }
  console.log(`✅ Products: ${PRODUCT_DATA.length} (with attributes & variants)`);

  // ─── 6. Visitors ──────────────────────────────────────────
  const visitorIds: string[] = [];
  const NUM_VISITORS = 85;

  for (let i = 0; i < NUM_VISITORS; i++) {
    const vid = `visitor_${String(i + 1).padStart(3, '0')}`;
    const visitor = await prisma.visitor.create({
      data: {
        storeId: store.id,
        visitorId: vid,
        userAgent: pick([
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Mobile/15E148',
          'Mozilla/5.0 (Linux; Android 14) Chrome/120.0',
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Safari/605.1',
        ]),
        country: pick(['AR', 'AR', 'AR', 'AR', 'UY', 'CL', 'MX']),
        city: pick([
          'Buenos Aires', 'Buenos Aires', 'Córdoba', 'Rosario',
          'Mendoza', 'La Plata', 'Tucumán', 'Mar del Plata',
        ]),
        visitCount: randomBetween(1, 8),
        firstVisit: daysAgo(randomBetween(1, 30)),
        lastVisit: daysAgo(randomBetween(0, 5)),
      },
    });
    visitorIds.push(visitor.id);
  }
  console.log(`✅ Visitors: ${NUM_VISITORS}`);

  // ─── 7. Analytics Events (realistic funnel) ───────────────
  const eventsToInsert: any[] = [];

  for (let day = 30; day >= 0; day--) {
    const baseVisits = day <= 7 ? randomBetween(15, 30) : randomBetween(5, 15);

    for (let v = 0; v < baseVisits; v++) {
      const visitorId = pick(visitorIds);
      const ts = daysAgo(day);

      eventsToInsert.push({ storeId: store.id, visitorId, type: EventType.PAGE_VIEW, createdAt: ts });

      if (Math.random() < 0.7) {
        const prodId = pick(productIds);
        const ts2 = new Date(ts.getTime() + randomBetween(5, 120) * 1000);
        eventsToInsert.push({ storeId: store.id, visitorId, productId: prodId, type: EventType.PRODUCT_VIEW, createdAt: ts2 });

        if (Math.random() < 0.35) {
          eventsToInsert.push({ storeId: store.id, visitorId, productId: prodId, type: EventType.ADD_TO_CART, createdAt: new Date(ts2.getTime() + randomBetween(10, 60) * 1000) });

          if (Math.random() < 0.5) {
            eventsToInsert.push({ storeId: store.id, visitorId, productId: prodId, type: EventType.CHECKOUT_START, createdAt: new Date(ts2.getTime() + randomBetween(30, 180) * 1000) });

            if (Math.random() < 0.6) {
              eventsToInsert.push({ storeId: store.id, visitorId, productId: prodId, type: EventType.CHECKOUT_COMPLETE, createdAt: new Date(ts2.getTime() + randomBetween(60, 300) * 1000) });
            }
          }
        }
      }

      if (Math.random() < 0.4) {
        eventsToInsert.push({ storeId: store.id, visitorId, type: EventType.CATEGORY_VIEW, metadata: { category: pick(categoriesData).name }, createdAt: new Date(ts.getTime() + randomBetween(2, 60) * 1000) });
      }

      if (Math.random() < 0.15) {
        eventsToInsert.push({ storeId: store.id, visitorId, type: EventType.SEARCH, metadata: { query: pick(['remera', 'zapatillas', 'hoodie', 'negro', 'auriculares', 'mochila', 'gorra', 'jogger', 'short', 'campera']) }, createdAt: new Date(ts.getTime() + randomBetween(3, 30) * 1000) });
      }
    }
  }

  // Insert in batches of 500 to avoid pgBouncer limits
  const BATCH = 500;
  for (let i = 0; i < eventsToInsert.length; i += BATCH) {
    await prisma.analyticsEvent.createMany({ data: eventsToInsert.slice(i, i + BATCH) });
  }
  console.log(`✅ Analytics events: ~${eventsToInsert.length}`);

  // ─── 8. Orders (quotes via WhatsApp) ──────────────────────
  const orderStatuses: OrderStatus[] = [
    OrderStatus.PENDING,
    OrderStatus.CONTACTED,
    OrderStatus.ACCEPTED,
    OrderStatus.ACCEPTED,
    OrderStatus.ACCEPTED,
    OrderStatus.REJECTED,
  ];

  let orderCount = 0;
  for (let day = 25; day >= 0; day--) {
    const ordersToday = day <= 7 ? randomBetween(1, 3) : Math.random() < 0.5 ? 1 : 0;

    for (let o = 0; o < ordersToday; o++) {
      const customer = pick(CUSTOMERS);
      const numItems = randomBetween(1, 4);
      const orderProducts: { idx: number; qty: number }[] = [];

      for (let it = 0; it < numItems; it++) {
        const pIdx = randomBetween(0, productIds.length - 1);
        // Avoid duplicate product in same order
        if (!orderProducts.find((op) => op.idx === pIdx)) {
          orderProducts.push({ idx: pIdx, qty: randomBetween(1, 3) });
        }
      }

      const items = orderProducts.map((op) => {
        const pData = PRODUCT_DATA[op.idx];
        return {
          productId: productIds[op.idx],
          productName: pData.name,
          unitPrice: pData.price,
          quantity: op.qty,
        };
      });

      const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
      const status = day <= 2 ? OrderStatus.PENDING : pick(orderStatuses);

      await prisma.orderIntent.create({
        data: {
          storeId: store.id,
          visitorId: pick(visitorIds),
          subtotal,
          total: subtotal,
          currency: 'ARS',
          customerName: customer.name,
          customerPhone: customer.phone,
          status,
          channel: OrderChannel.WHATSAPP,
          whatsappNumber: '+5491155551234',
          createdAt: daysAgo(day),
          items: {
            create: items,
          },
        },
      });
      orderCount++;
    }
  }
  console.log(`✅ Orders: ${orderCount}`);

  // ─── Done ─────────────────────────────────────────────────
  console.log('\n🎉 Demo seed complete!');
  console.log('─────────────────────────────────────');
  console.log(`   Login:     demo@example.com / password123`);
  console.log(`   Store:     /demo-store`);
  console.log(`   Dashboard: /dashboard`);
  console.log(`   Template:  luxora`);
  console.log(`   Plan:      PRO`);
  console.log(`   Products:  ${PRODUCT_DATA.length}`);
  console.log(`   Categories: ${categoriesData.length}`);
  console.log(`   Visitors:  ${NUM_VISITORS}`);
  console.log(`   Events:    ~${eventsToInsert.length}`);
  console.log(`   Orders:    ${orderCount}`);
  console.log('─────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
