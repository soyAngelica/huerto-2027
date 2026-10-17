# Huerto de Angelica

Sitio estático para llevar el seguimiento del huerto. Muestra cada cama como un plano; al tocar una planta aparece su ficha.

## Archivos

- `index.html`: la página.
- `styles.css`: colores y tipografía (tema claro y oscuro).
- `app.js`: lee el JSON y dibuja las camas.
- `data/huerto.json`: toda la información. Es el único archivo que hay que editar.

## Cómo editar `data/huerto.json`

- **especies**: una entrada por planta (`zanahoria`, `jalapeno`, `marigold`). `color` puede ser `carrot`, `leaf` o `marigold`.
- **camas**: medidas en cm. `plantas` son plantas sueltas (`x`, `y` y `radio` en cm desde la esquina de arriba a la izquierda). `filas` son hileras de siembra (`y`, `desde`, `hasta`, `cada`).
- **bitacora**: notas con fecha (`AAAA-MM-DD`), la cama y lo que pasó. Aparecen de la más nueva a la más vieja.

## Probar en tu computadora

El navegador no deja leer el JSON si abres `index.html` con doble clic. Usa un servidor sencillo desde esta carpeta:

```
python3 -m http.server 8000
```

y abre http://localhost:8000

## Publicar en Vercel

1. Sube esta carpeta a un repositorio de GitHub.
2. En Vercel, elige "Add New → Project", importa el repositorio y deja el framework en "Other". No necesita comando de build.
3. Cada cambio que subas a GitHub se publica solo.
