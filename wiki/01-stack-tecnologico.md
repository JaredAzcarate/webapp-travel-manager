# 🛠 Stack Tecnológico

## Frontend

- **Next.js 16** con **App Router** (`app/` directory)
- **TypeScript** (modo strict)
- **React 19**
- **Ant Design 6** - Biblioteca de componentes UI principal
- **Tailwind CSS 4** - Utilidades de estilos (NO CSS Modules)
- **@tanstack/react-query** - Manejo de estado servidor y cache

## Backend

- **NextAuth v5** (Credentials) — Autenticación del panel; credenciales almacenadas en Firestore (`admin`), contraseñas con **bcryptjs**
- **Firestore** — Base de datos NoSQL
- **Firebase Admin SDK** — Rutas API y operaciones servidor (`lib/firebase-admin.ts`)

## Utilidades

- **date-fns** / **dayjs** — Manejo de fechas
- **libphonenumber-js** — Validación de números telefónicos internacionales
- **pdfkit**, **jspdf**, **exceljs** — Exportación PDF / Excel según pantalla

Para el detalle de auth, rutas y colecciones, ver [Implementación actual](./current-implementation.md).

---

**Ver también**: [Arquitectura y Principios](./02-arquitectura.md) | [Índice](./development.md)

