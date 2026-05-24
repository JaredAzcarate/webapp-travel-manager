# 🔌 API Routes

## Estructura

- Todas las rutas API en `/app/api`
- Siguen la estructura de Next.js App Router
- Route handlers: `route.ts`

## Convenciones

### Métodos HTTP

- `GET` - Lectura de datos
- `POST` - Creación/mutaciones
- `PUT` - Actualización completa
- `PATCH` - Actualización parcial
- `DELETE` - Eliminación

### Respuestas

- Formato estándar usando `ApiResponse<T>`
- Códigos HTTP apropiados
- Mensajes de error claros

```typescript
// Ejemplo de respuesta
return NextResponse.json<ApiResponse>(
  {
    success: true,
    data: result,
  },
  { status: 200 }
);
```

### Autenticación en API Routes

- **No** hay middlewares globales con nombres fijos como `verifyAuth()` o `getUserFromRequest()` en el repositorio: cada `route.ts` implementa lo que necesita.
- Muchas rutas bajo `/api/registrations`, `/api/caravans`, GDPR, etc. son **públicas** (formulario de inscripción, consultas por teléfono, etc.).
- Donde haga falta acceso privilegiado al almacén, suele usarse **Firebase Admin SDK** en el servidor, no el token de Firebase Auth del usuario final del panel.
- Para el login del panel, el flujo pasa por **NextAuth** (`/api/auth/[...nextauth]`), no por verificación manual en cada API de admin de forma uniforme.

Ver [Implementación actual](./current-implementation.md) y el código de `app/api/`.

---

**Ver también**: [Firebase y Firestore](./11-firebase.md) | [Índice](./development.md)

