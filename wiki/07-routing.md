# 🧭 Routing y Navegación

## Next.js App Router

- Todas las rutas están en `/app`
- Rutas dinámicas con `[id]` (ej: `/admin/caravans/[id]`)

## Protección de Rutas

### Rutas Públicas

- `/` — Home
- `/registration` — Registro (listado / selección de caravana)
- `/registration/[caravanId]` — Registro para una caravana concreta
- `/registration/success` — Confirmación de registro
- `/confirm-payment` — Confirmación de pago y cancelaciones (por teléfono)
- `/privacy-and-policy/*` — Privacidad y RGPD
- `/setup` — Configuración inicial (si aplica al despliegue)

### Rutas Protegidas (panel)

- Todas las rutas bajo `/admin/**` requieren sesión **NextAuth**
- **`app/admin/layout.tsx`** comprueba `useSession` y redirige a **`/auth/login`** si no hay sesión (no existe `AuthGuard` con ese nombre ni login en `/admin/login`)

### Otras rutas de autenticación

- `/auth/login` — Inicio de sesión del panel (NextAuth Credentials)

## Filtros y Búsquedas

**Los filtros se manejan mediante parámetros de URL (query params).**

### Ejemplo de Implementación

```typescript
import { useSearchParams } from "next/navigation";

export default function CaravansPage() {
  const searchParams = useSearchParams();
  const chapelId = searchParams.get("chapelId");
  const status = searchParams.get("status");

  // Usar los parámetros para filtrar
  const { data } = useQuery({
    queryKey: ["caravans", { chapelId, status }],
    queryFn: () => caravanRepository.getFiltered({ chapelId, status }),
  });
}
```

### Ventajas

- URLs compartibles y bookmarkeables
- Estado de filtros visible en la URL
- Navegación con botón "atrás" del navegador funciona correctamente
- Fácil de debuggear

### Convención de Nombres

- Parámetros en camelCase (ej: `?chapelId=123&status=active`)
- Valores múltiples con array (ej: `?busIds[]=1&busIds[]=2`)

---

**Ver también**: [UI y Estilos](./08-ui-estilos.md) | [Índice](./development.md)

