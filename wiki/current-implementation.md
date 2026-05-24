# 📌 Implementación actual (fuente de verdad técnica)

Este documento describe **cómo está construido el repositorio hoy**. Complementa [project.md](./project.md), que sigue siendo la especificación funcional y puede incluir objetivos aún no implementados.

**Última revisión:** marzo 2026.

---

## Stack

- **Next.js 16** (App Router), **React 19**, **TypeScript** (strict).
- **Ant Design 6**, **Tailwind CSS 4**, **React Query 5**.
- **Firestore** (datos) y **Firebase Admin SDK** (rutas API y servidor).
- **NextAuth v5** (beta) con proveedor **Credentials** para el panel (no Firebase Auth en el flujo de login del admin).
- Utilidades: **date-fns**, **dayjs**, **libphonenumber-js**, **bcryptjs** (hash de contraseñas de panel), **pdfkit** / **jspdf** / **exceljs** según pantallas y exportaciones.

---

## Autenticación del panel

- Los usuarios del panel viven en la colección Firestore **`admin`**: `username`, `password` (hash con bcrypt), `createdAt`, `updatedAt`.
- **NextAuth** (`lib/auth/config.ts`) valida usuario/contraseña contra esa colección (vía `adminRepositoryServer`).
- La sesión es **JWT**; el objeto de sesión expone al menos **`username`** (y el `id` interno de NextAuth). **No** hay hoy rol `CHAPEL` ni `chapelId` en la sesión: quien inicia sesión tiene acceso al menú completo del admin según la UI actual.
- **Login:** ruta **`/auth/login`** (no `/admin/login`).
- **Protección de `/admin/**`:** el layout **`app/admin/layout.tsx`** usa `useSession` de NextAuth y redirige a `/auth/login` si no hay sesión.
- Existe **`proxy.ts`** con lógica equivalente a middleware (auth en rutas `/admin`), pero **no hay `middleware.ts`** en la raíz enlazado a Next.js; la protección efectiva en cliente es la del layout.
- API **`/api/auth/[...nextauth]`** para el handler de NextAuth.

---

## Rutas relevantes (`app/`)

### Públicas (sin login de panel)

- `/` — Inicio.
- `/registration` — Registro (selección de caravana si aplica).
- `/registration/[caravanId]` — Registro para una caravana concreta.
- `/registration/success` — Éxito.
- `/confirm-payment` — Confirmación de pago / cancelación por teléfono.
- `/privacy-and-policy/*` — RGPD / privacidad.
- `/setup` — Flujo de configuración inicial (si se usa en despliegue).

### Panel (`/admin/**`, sesión NextAuth)

- `/admin/caravans` — Lista de viajes (caravanas).
- `/admin/caravans/new`, `/admin/caravans/edit/[id]` — Crear / editar caravana (fechas, nombre, `busIds`).
- `/admin/caravans/distribution` — Distribución / inscripciones (vista principal operativa; suele usar `Suspense` y query params).
- `/admin/chapels`, `/admin/buses`, `/admin/ordinances` — CRUD de configuración (con subrutas `new` / `edit/[id]` donde existan).
- `/admin/managers` — Gestión de usuarios del panel (colección `admin`), no la ruta `/admin/users` del spec antiguo.

---

## Colecciones Firestore en uso

Nombres en **inglés**, tal como en código:

| Colección | Uso |
|-----------|-----|
| `admin` | Credenciales del panel (NextAuth Credentials). |
| `chapels` | Unidades / capelas. |
| `caravans` | Viajes; incluye `busIds`, y en muchos documentos `ordinanceCapacityLimits` / `ordinanceCapacityCounts` generados al crear la caravana desde plantillas `ordinances`. |
| `buses` | Plantillas de autocarros (capacidad, nombre). |
| `busStops` | Paradas / orden de ruta por `busId`. |
| `ordinances` | Plantillas de ordenanzas y sesiones (slots, cupos, género). |
| `registrations` | Inscripciones. |
| `roles` | Roles (repositorio/hooks presentes; no son el eje del login actual). |
| `dataAccessLogs` | Logs de acceso a datos (RGPD / auditoría según implementación). |

### `users` (colección)

Existe **`features/auth/repositories/user.repository.ts`** apuntando a `users`, pero **no está integrado** en el flujo de login ni referenciado por el resto de la app. Tratar como **reservado / legado** hasta que se conecte.

---

## Modelo de datos (resumen frente al spec)

### `Registration` (implementado)

- `ordinances`: **array** de `{ ordinanceId, slot, isPersonal? }` (varias ordenanzas por inscripción).
- `ageCategory`: `CHILD` | `YOUTH` | `ADULT` (no solo “adulto/joven” del spec antiguo).
- `participationStatus` incluye **`WAITLIST`** además de `ACTIVE` / `CANCELLED`.
- Campos RGPD: `privacyPolicyAccepted`, `privacyPolicyAcceptedAt`, `gdprUuid`, `consentWithdrawnAt`, etc.

### `Caravan` (implementado)

- Además de fechas y `busIds`, **`ordinanceCapacityLimits`** y **`ordinanceCapacityCounts`** alineados con la colección `ordinances` al crear la caravana (lógica en `CaravanRepository.create`).

### Panel `Admin` (implementado)

- Modelo en `features/auth/models/admin.model.ts`: no incluye `roleId` ni `chapelId` (a diferencia del modelo `User` en `user.model.ts`).

---

## API Routes

- Ubicación: **`app/api/**`** con `route.ts`.
- **No** existen helpers globales documentados antiguamente como `verifyAuth()` / `getUserFromRequest()`; cada ruta valida según necesidad (muchas rutas son **públicas** para registro, conteos, GDPR, etc.).
- Operaciones sensibles o administrativas suelen usar **Firebase Admin SDK** (`lib/firebase-admin.ts`) en el servidor.

---

## Cliente Firebase (browser)

- Inicialización: **`common/lib/firebase.js`** (export de `db`, etc.).
- Servidor Admin: **`lib/firebase-admin.ts`**.

---

## Reglas de seguridad Firestore

El archivo **`wiki/14-firestore-rules.md`** contiene **ejemplos orientativos** pensados en Firebase Auth + documento `users` con rol. El panel real usa **NextAuth** y la colección **`admin`**. La fuente de verdad desplegada es **`firestore.rules`** en la raíz del repo: revisar siempre ese archivo antes de asumir permisos en cliente.

---

## Documentos relacionados

- [Índice de la wiki](./development.md)
- [Especificación funcional](./project.md)
- [Stack tecnológico](./01-stack-tecnologico.md)
- [Routing](./07-routing.md)
- [Firebase y Firestore](./11-firebase.md)
