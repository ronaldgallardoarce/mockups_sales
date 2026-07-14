# Gestión de Rutas · Pre-Venta (Route Management)

Prototipo funcional de **frontend** para un microservicio de gestión de rutas de venta
(Pre-Venta / Route Management). Construido con datos _mock_, pero con una capa de datos
(`services` + `hooks`) preparada para conectarse a una API real sin tocar la UI.

Centrado en **Trinidad, Beni, Bolivia** (`-14.834, -64.901`).

![stack](https://img.shields.io/badge/React-18-149eca) ![stack](https://img.shields.io/badge/Vite-6-646cff) ![stack](https://img.shields.io/badge/TypeScript-5-3178c6) ![stack](https://img.shields.io/badge/Tailwind-3-38bdf8)

---

## ✨ Características

- **Dashboard** — tarjetas de resumen (rutas, rutas activas, clientes, manzanos), gráfico
  (Recharts) de clientes por canal y mini-mapa de cobertura.
- **Rutas** — tabla estilo _DataTable_ (shadcn) con búsqueda, filtro por estado, paginación,
  _skeleton loaders_, estados vacíos, badge de estado, swatch de color y acciones
  (ver / editar / duplicar / eliminar).
- **Crear / Editar ruta** — formulario validado con **zod + react-hook-form**, _color picker_,
  multi-select de **Canal de Venta** que carga dinámicamente sus **subcanales** (chips
  removibles con conteo de clientes) y **vista previa en vivo del mapa** que pinta solo los
  manzanos del canal seleccionado y los clientes agrupados en _clusters_ por canal.
- **Gestionar Mapa** — mapa interactivo con barra de dibujo (**Leaflet-Geoman**) para crear
  manzanos (sectores geográficos, solo polígono). Cada manzano muestra un **badge con la
  cantidad de clientes** que contiene según su ubicación (independiente de canal/subcanal). Al
  seleccionar un manzano se puede **editar su forma** o **eliminarlo**. Incluye detección y
  aviso de **solapamientos**, _clustering_ de clientes, toggle **mapa / satélite** y
  persistencia en **zustand** (localStorage).
- **Mercados / Clientes** — listado filtrable por canal y subcanal, con vista de lista y mapa.

### Toques de UX/UI

Command palette (**⌘K / Ctrl+K**), toasts (**sonner**), diálogos de confirmación para eliminar,
actualizaciones optimistas, tooltips en elementos del mapa, sidebar colapsable + drawer móvil,
modo **claro / oscuro** con toggle, animaciones sutiles, accesibilidad de teclado y
**codificación de color de canales consistente** en lista / formulario / mapa.

---

## 🧱 Stack

| Área | Librería |
|------|----------|
| Framework | React 18 + TypeScript + Vite |
| Estilos | TailwindCSS + shadcn/ui (Radix UI) + lucide-react |
| Estado global | zustand (tema, UI, manzanos) |
| Datos async / caché | @tanstack/react-query (servicios mock con promesas) |
| Ruteo | react-router-dom |
| Formularios / validación | react-hook-form + zod |
| Mapa | react-leaflet + Leaflet + OpenStreetMap / Esri |
| Dibujo de polígonos | @geoman-io/leaflet-geoman-free |
| Clustering | react-leaflet-cluster |
| Gráficos | recharts |
| Notificaciones | sonner |

---

## 🚀 Puesta en marcha

Requisitos: **Node 18+** y **pnpm**.

```bash
# instalar pnpm (si no lo tienes)
npm install -g pnpm

# instalar dependencias
pnpm install

# entorno de desarrollo
pnpm dev

# build de producción
pnpm build

# previsualizar el build
pnpm preview
```

La app queda disponible en `http://localhost:5173` (o el puerto que indique Vite).

> El mapa usa _tiles_ gratuitos de OpenStreetMap y Esri World Imagery — **no requiere API key**.

---

## 📁 Estructura de carpetas (por módulos)

```
src/
├── components/
│   ├── ui/              # Primitivos shadcn/ui (button, card, dialog, table, command…)
│   ├── common/          # Reutilizables (theme-toggle, confirm-dialog, empty-state,
│   │                    #   color-picker, channel-badge, command-palette, page-header)
│   └── layout/          # Shell: sidebar, header, breadcrumbs, user-menu, mobile-nav
├── features/            # Un módulo por dominio funcional
│   ├── dashboard/
│   │   ├── components/  # stat-card, clients-by-channel-chart
│   │   └── pages/       # dashboard-page
│   ├── routes/
│   │   ├── components/  # routes-table, route-actions, status-badge, channel-multiselect,
│   │   │                #   subcanal-selector, route-map-preview, route-detail-sheet
│   │   ├── pages/       # routes-list-page, route-form-page
│   │   └── route-schema.ts   # esquema zod
│   ├── map/
│   │   ├── components/  # base-map, block-polygons, blocks-editor (Geoman),
│   │   │                #   client-markers, fit-bounds, block-form-dialog
│   │   ├── lib/         # leaflet-setup (iconos)
│   │   └── pages/       # manage-map-page
│   └── clients/
│       └── pages/       # clients-page
├── hooks/               # use-routes, use-channels, use-clients, use-media-query
├── services/            # Capa de datos mock (swappable): routes/channels/clients-service
├── stores/              # zustand: theme-store, ui-store, blocks-store
├── data/                # Semilla determinista: channels, seed (clientes, manzanos, rutas)
├── lib/                 # utils (cn, delay, PRNG), geo (overlap), query-client
├── providers/           # app-providers, theme-provider
├── types/               # Tipos de dominio
├── config/              # nav
├── App.tsx              # Rutas
├── main.tsx             # Entry (imports de CSS de Leaflet)
└── index.css            # Variables de tema claro/oscuro + estilos de Leaflet
```

---

## 🔌 Cómo conectar una API real

La UI nunca llama a datos directamente: usa **hooks de React Query** que envuelven a los
**servicios** en `src/services/*`. Cada servicio hoy resuelve promesas sobre datos _mock_
(`src/data`) con un `delay()` que simula latencia.

Para usar un backend real, reemplaza el cuerpo de cada método del servicio por `fetch`/`axios`
manteniendo la **misma firma**. No hace falta tocar componentes ni hooks. Ejemplo:

```ts
// src/services/routes-service.ts
export const routesService = {
  list: () => fetch("/api/routes").then((r) => r.json()),
  create: (input: RouteInput) =>
    fetch("/api/routes", { method: "POST", body: JSON.stringify(input) }).then((r) => r.json()),
  // …
};
```

---

## 🎨 Modelo de datos (mock)

- **5 canales** (`TRADICIONAL`, `MODERNO`, `LIMPIEZA`, `FERIAS`, `PANADERIA`), cada uno con
  color fijo (fuente de verdad para la codificación de color).
- **11 subcanales** distribuidos entre los canales (`MAYORISTA`, `DETALLISTA`,
  `MAYORISTA-PARETO`, `MAYORISTA-LIMPIEZA`, `FERIAS ZONALES`, `PANADERIA ZONAL`, …).
- **~46 clientes** con coordenadas alrededor de Trinidad, asignados a un subcanal.
- **~40 manzanos** (polígonos) que son solo sectores geográficos, sin canal ni color; su valor
  es cuántos clientes caen dentro por ubicación.
- **15 rutas** con canales/subcanales, estado, fecha de inicio y conteo de clientes.

Los datos se generan con un PRNG _sembrado_ (`seededRandom`) → la semilla es estable entre
recargas. Los manzanos se persisten en `localStorage` (zustand) para conservar tus ediciones;
usa **Restablecer** en _Gestionar Mapa_ para volver a la semilla.

---

## ⌨️ Atajos

| Atajo | Acción |
|-------|--------|
| `⌘K` / `Ctrl+K` | Abrir command palette (buscar rutas, navegar, acciones) |

---

## 📝 Notas

- Prototipo **solo frontend**: no hay backend ni autenticación real (el usuario del header es
  _mock_).
- El modo oscuro invierte únicamente las _tiles_ de OpenStreetMap; la vista satélite se muestra
  sin filtros.
