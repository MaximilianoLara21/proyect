# Boloyaco: frontend React

El frontend está construido con React y Vite. La interfaz mantiene los estilos e
imágenes originales, ubicados en `src/style.css` y `public/assets/img/`; obtiene
el catálogo desde `/api/productos` y ofrece el
pedido mediante WhatsApp.

Las páginas y scripts estáticos previos se conservaron en `legacy/` como
referencia; la aplicación activa es la de React.

## Desarrollo

1. Inicia el servidor Node.js desde la carpeta del proyecto con `npm start`.
   Este servidor carga la configuración privada desde `back/.env` y conecta
   con MongoDB Atlas.
2. En otra terminal, inicia Vite con `npm run dev` desde `frontend`.
   Vite envía `/api` y `/assets` al servidor local en el puerto 3000.

## Producción

Desde la carpeta del proyecto, ejecuta `npm run build` y luego `npm start`.
El servidor existente entrega `frontend/dist` y mantiene disponibles la API
de productos y las imágenes originales.
