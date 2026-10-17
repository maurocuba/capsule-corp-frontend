# 🐉 Capsule Corp — Frontend

Aplicación en **Next.js** para gestionar el inventario de objetos de Dragon Ball de la Capsule Corp: agregar, editar, buscar, filtrar por categoría, ajustar stock y eliminar productos.
Se publica como sitio estático en **Firebase Hosting** y consume la API Express + PostgreSQL alojada en **Render**.

- Página: https://capsule-corp-mc.web.app
- Backend: https://github.com/maurocuba/backendUpbtest

## Ejecutar localmente

1. `npm install`
2. Copia `.env.example` a `.env.local` (opcional: sin ella se usa la API pública de Render).
3. `npm run dev` y abre `http://localhost:3000`.

```dotenv
NEXT_PUBLIC_API_URL=https://capsule-corp-api-mc.onrender.com
```

`NEXT_PUBLIC_API_URL` se incrusta en el JavaScript del navegador durante el build, así que solo debe contener una URL pública, nunca contraseñas ni la cadena de conexión de PostgreSQL.

## Estructura

```
app/
├── layout.tsx   # Layout raíz y metadatos
├── page.tsx     # Interfaz: resumen, formulario, buscador, filtros y tarjetas de productos
└── globals.css  # Tailwind CSS 4
lib/
└── api.ts       # Cliente de la API (GET, POST, PUT y DELETE de /api/productos)
```

## Publicación

```bash
npm run build                # exportación estática en out/
firebase deploy --only hosting
```
