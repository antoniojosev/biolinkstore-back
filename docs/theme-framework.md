# ByLink Theme Framework — Manual del diseñador de temas

> Fuente de verdad de autoría: `prisma/seeds/page-builder.seed.ts` (backend).
> Renderer base: `frontend/components/storefront-v2/template/template-renderer.tsx`.
> Registry de renderers custom: `frontend/components/storefront-v2/themes/registry.tsx`.
> Última revisión: 2026-07-16 (iteración "galería 11 temas").

## La idea en una frase

Un tema es un **kit de pizza**: viene armado con una receta default (`defaultTokens` + árbol de secciones), trae ingredientes sueltos (todo lo que el vendedor puede editar libremente), y puede traer compartimientos con **recetas alternativas completas** (`stylePresets`) curadas por el diseñador. El vendedor nunca puede romper la estética siguiendo las recetas — y aún así conserva la libertad total si quiere cocinar la suya.

## Los dos niveles de autoría

| Nivel | Cuándo | Qué se escribe | Ejemplos |
|---|---|---|---|
| **1. Componer** (el 90% de los temas) | El diseño se expresa con el catálogo de secciones | Solo configuración en el seed: tokens + schema + demo data. **Cero código de render.** | vitrina, luxora, noir, atelier, rosier, menu, poster, servicios, inmuebles, estate |
| **2. Renderer custom** (excepcional) | El diseño necesita layouts o interacciones que el catálogo no tiene (tabs, feeds, estructuras propias) | Lo del nivel 1 **más** un componente React registrado en `themes/registry.tsx` que cumple el contrato completo (ver §Renderers custom) | persona |

**Regla madre: el diseñador compone, no programa.** Si un layout nuevo le serviría a varios temas, se implementa primero como variante en el renderer base (nivel plataforma) — el renderer custom es para identidad única de UN tema, no para esquivar el catálogo.

## Anatomía de un tema (nivel 1)

Cada tema es un objeto `TemplateSeed` en el seed:

```ts
{
  key: 'mi-tema',            // único, inmutable, va en URLs internas
  name: 'Mi Tema',           // visible en la galería
  niche: TemplateNiche.X,    // FASHION | RESTAURANT | REAL_ESTATE | SERVICES | GENERAL | PORTFOLIO
  planRequired: Plan.FREE,   // FREE | PRO | BUSINESS — gate de la galería
  sortOrder: 60,             // orden en la galería
  defaultTokens: { ... },    // la estética default (ver Tokens)
  sectionSchema: { ... },    // qué secciones trae y qué puede editar el vendedor
  demoDataJson: demoX(),     // tienda/productos/categorías de mentira para previews
  stylePresets: [ ... ],     // opcional: recetas alternativas (ver Recetas)
}
```

### Tokens (`defaultTokens`)

Set COMPLETO obligatorio — nunca parcial:

- `palette`: `preset` (nombre de la paleta base más cercana), `primary`, `secondary`, `accent`, `bg`, `surface`, `text`, `muted`, `border` (hex).
- `typography`: `headingFont`, `bodyFont` (**solo de la whitelist**: Inter, Playfair Display, Fraunces, Source Serif 4, Manrope, Space Grotesk, Poppins, Lora), `scale` (compact/normal/comfortable).
- `radius` (sm/md/lg/xl), `spacing` (compact/normal/comfortable), `buttonStyle` (solid/outline/ghost).

En el frontend estos llegan como variables CSS `--bl-*` (`--bl-primary`, `--bl-background`, `--bl-heading-font`, `--bl-radius`, …) vía `resolveTokens`.

### Schema de secciones (`sectionSchema`)

`{ defaultOrder: string[], sections: SectionDef[] }`. Cada `SectionDef`:

```ts
{
  type: 'hero',            // uno del catálogo (§Catálogo)
  key: 'hero_main',        // único dentro del tema
  removable: false,        // ¿el vendedor puede eliminarla?
  variants: ['split', 'compact', 'banner'],   // informativo; el layout real es la prop `layout`
  props: { /* PropDef por campo editable */ },
}
```

**Todo lo que el vendedor puede tocar DEBE ser una prop del schema** — el inspector del editor se auto-genera de ahí (tipos: text, string, enum, boolean, number, color, image, list con itemSchema). Lo que no está en el schema es diseño fijo e intocable.

Hay factories reutilizables en el seed para las secciones commodity: `aboutSection()`, `gallerySection()`, `socialsSection()`, `footerSection()`, `contactSection()`, `hoursSection()`, `ctaBannerSection()`, `statsSection()`, `faqSection()`, `testimonialsSection()`, `categoriesSection()`, `mapSection()`.

### Demo data (`demoDataJson`)

`{ store, products[], categories[] }` — **el demo data es parte del diseño del tema, no un fixture técnico**. Un tema se entrega "vestido": cuando se diseña desde cero se piensa hasta cómo se verá todo, y se presenta con datos para que se vea exactamente cómo puede quedar. Es lo que el vendedor ve en la carátula de la galería, el modal de preview, el probador y el canvas del editor (fallback sin productos) — un tema con placeholders se ve muerto y no se acepta.

Reglas:
- **Fotos reales, nunca placeholders.** Helper `uns(id, w, h)` (Unsplash, mismo origen que usaba prod). Verificar cada ID con HTTP 200 antes de entregar. Pendiente post-deploy: migrar a R2.
- **Nombre y descripción corresponden a la foto** (si la foto es un bolso, el producto no se llama "Falda"). Precios y textos creíbles en es-VE para el nicho.
- La tienda demo también viste `logo` y `banner` con fotos reales.

Funciones existentes: `demoFashion(key, name)`, `demoRestaurant(key, name)`, `demoServices()`, `demoRealEstate()`, `demoPortfolio()`, `demoGeneral()`.

## Catálogo de secciones (16 tipos, renderer base)

| type | Variantes de layout implementadas (prop `layout`) | Props típicas |
|---|---|---|
| `hero` | `split` · `compact` · `banner` | image, kicker, headline, subheadline, ctaLabel, ctaType (whatsapp/scroll/external) |
| `product_grid` | `grid-2` · `grid-3` · `grid-4` · `list` + `groupBy` (category/none) | title, filterByCategory, showPrice, showSku |
| `featured_products` | `grid` · `carousel` · `spotlight` | title, kicker, productIds (list) |
| `categories` | `pills` · `cards` · `sidebar` | title, showCount* |
| `about` | `split-left` · `split-right` · `centered` | title, body, image |
| `gallery` | `grid` · `masonry` · `carousel` | title, items (image+caption) |
| `text_block` | `editorial` · `centered-quote` · `two-column` | kicker, headline, body, align |
| `testimonials` | `cards` · `carousel` | title, items (author/role/quote/avatar) |
| `cta_banner` | — | headline, subline, ctaLabel, ctaType, backgroundColor |
| `faq` | — | title, items (question/answer) |
| `stats` | — | items (value/label) |
| `contact` | — | title, phone, email, address, showWhatsappCta |
| `hours` | — | (horarios de la tienda) |
| `socials` | — | items (fallback; las redes REALES de la tienda tienen prioridad — BE-124) |
| `map` | — | latitude, longitude, zoom, title |
| `footer` | — | tagline, showBranding |

\* `showCount` declarado pero aún sin datos plumbeados — no prometerlo visualmente.

**Regla: el schema nunca promete lo que el renderer no dibuja.** Si declarás una opción en `layout.options` que no existe como rama en el renderer, el vendedor verá un selector que no hace nada. Antes de declarar una variante nueva: o ya existe en el renderer, o se implementa primero.

## Recetas (`stylePresets`)

Cada receta es un **set COMPLETO de tokens** (mismo shape que `defaultTokens`) + `sectionOverrides` opcionales:

```ts
{
  key: 'noir-calido',
  name: 'Noir Cálido',
  description: 'El mismo negro, pero con bronce y ámbar.',
  tokens: { /* palette + typography + radius + spacing + buttonStyle COMPLETOS */ },
  sectionOverrides: [        // opcional — solo pisa lo que declara
    { key: 'hero_main', props: { layout: 'banner' } },
    { key: 'gallery_main', visible: false },
  ],
}
```

Reglas de recetas:
- **Nunca tocan contenido del vendedor**: los overrides solo pisan `visible` y las props exactas que declaran (típicamente `layout`); textos/fotos/orden quedan intactos.
- La receta **"Original" no se autora**: el frontend la deriva de `defaultTokens` — es el reset estético sin perder contenido.
- Tokens siempre completos (el frontend aplica con merge profundo; un set parcial dejaría restos de la estética anterior).
- Mismas restricciones que los defaults: fuentes de la whitelist, contraste AA.

## Renderers custom (nivel 2, `themes/registry.tsx`)

Un tema entra al registry (`{ [templateKey]: Componente }`) cuando su identidad requiere lo que las secciones no dan. El componente recibe `TemplateRendererProps` y **debe cumplir el contrato completo** — `PersonaRenderer` (`themes/persona/index.tsx`) es el ejemplo canónico:

1. **Tokens, no colores propios**: todo color/tipografía sale de `resolveTokens(theme.tokens)` (vars `--bl-*`) — así el tema sigue siendo editable desde la tab Diseño y las recetas le funcionan.
2. **El árbol de secciones manda**: respetar orden, `visible` y `props` de `theme.tree.sections`. Sus secciones distintivas las dibuja él; las commodity las **delega** al catálogo importando `SectionRenderer` del renderer base — no reimplementar un footer.
3. **Selección del editor**: envolver cada sección renderizada con el wrapper clickeable (`editorSelectedKey`/`onSectionClick`, outline + etiqueta de tipo) — mismo patrón del base. Si el tema tiene UI con estados (tabs), seleccionar una sección en el editor debe llevar la UI a donde esa sección se ve.
4. **Navegación de producto**: cards/celdas usan `productHref(p)` como `<a href>` (página de producto con OG); `onOpenProduct` como fallback. Nunca checkout directo desde la card.
5. **Responsive por container query** (`containerType: 'inline-size'` en el root + `@container`), **nunca `@media`** — los previews del editor/galería renderizan en frames angostos y un `@media` los haría mentir.
6. **Fuentes** vía `googleFontsHref` como el base.
7. **Carrito**: exponer acceso si `cartCount > 0` (`onOpenCart`).

Qué NO hace un renderer custom:
- **No dibuja la página de producto**: la provee la plataforma (`product-page-client.tsx`), estilizada por los tokens del tema. (Extensión futura del contrato: vista de detalle por tema.)
- **No inyecta meta tags/OG**: el OG es 100% de plataforma, server-rendered a nivel de ruta — ningún tema puede romperlo ni necesita implementarlo.

## Reglas del framework (resumen ejecutivo)

1. El diseñador **compone, no programa** (nivel 1 por defecto; nivel 2 es excepcional y con contrato).
2. Todo lo editable es una **prop del schema**; lo demás es diseño fijo.
3. El **schema nunca promete** lo que el renderer no dibuja.
4. Responsive por **container query / auto-fit — nunca `@media`**.
5. **Página de producto obligatoria** en todo tema (la base la provee; quien la reemplace a futuro cubre el contrato completo).
6. **OG y metadata son de plataforma** — ningún tema los toca.
7. Fuentes **solo de la whitelist**; contraste **AA** en toda paleta entregada (defaults y recetas).
8. Receta default obligatoria; recetas alternativas opcionales, con tokens completos y sin tocar contenido.
9. Redes sociales: la sección `socials` lee las **redes reales de la tienda** primero; los props del tema son solo fallback.
10. Demo data **vestido**: fotos reales verificadas (nunca placeholders), nombre/descripción correspondiendo a cada foto, es-VE, precios creíbles. El demo data es parte del diseño (§Demo data).

## Checklist de entrega de un tema nuevo

- [ ] `TemplateSeed` completo (key/name/niche/plan/sortOrder/tokens/schema/demo) agregado a `TEMPLATES[]`.
- [ ] Demo data vestido: todas las imágenes son fotos reales (`uns()`, IDs verificados HTTP 200); cero placeholders; la carátula de la galería (mini-render en marco de teléfono) se ve vendedora.
- [ ] Cada `variants`/`layout.options` declarado existe como rama en el renderer.
- [ ] Fuentes de la whitelist; contraste AA verificado (texto sobre bg y sobre surface).
- [ ] `pnpm ts-node prisma/seeds/page-builder.seed.ts` corre limpio (idempotente, upsert por key).
- [ ] Galería: aparece con su niche correcto; preview modal se ve bien en 🖥 y 📱 (frame 390px — el container query debe apilar lo que corresponda).
- [ ] Probador "Mi tienda" con catálogo real: nada se rompe con productos reales (nombres largos, sin imagen, precios grandes).
- [ ] Aplicar el tema → editor: todas las secciones seleccionables/editables; agregar/quitar/reordenar no rompe.
- [ ] Tienda pública a 360px real y 1440px.
- [ ] Página de producto: abre desde las cards, se ve coherente con los tokens del tema.
- [ ] Si trae recetas: aplicarlas no pisa textos/fotos del vendedor; "Original" restaura.
- [ ] (Nivel 2) Contrato completo del §Renderers custom + registrado en `registry.tsx`.

## Cómo probar en local

```bash
# backend (aplica el seed — idempotente)
cd igsotre-back && npx ts-node prisma/seeds/page-builder.seed.ts

# verificar por API
curl -s localhost:3001/api/templates | jq '.[].key'
curl -s localhost:3001/api/templates/mi-tema | jq '.sectionSchema.defaultOrder'
curl -s localhost:3001/api/public/templates/mi-tema/preview -o /dev/null -w '%{http_code}\n'
```

Después: dashboard → tab **Temas** → chip del niche → Vista previa (🖥/📱, Ejemplo/Mi tienda, ⛶ pantalla completa) → Aplicar → editar en **Diseño**.
