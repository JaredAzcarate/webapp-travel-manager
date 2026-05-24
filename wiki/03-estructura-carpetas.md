# 📁 Estructura de Carpetas

## Organización por Features

El proyecto está organizado siguiendo un patrón de **features** donde cada feature agrupa todo su código relacionado (models, repositories, hooks, components). El código compartido entre features se encuentra en `common/`.

```
/
├── app/                              # Next.js App Router
│   ├── page.tsx                      # Home
│   ├── layout.tsx
│   ├── auth/login/                   # Login del panel (NextAuth)
│   ├── registration/                 # Registro público (+ [caravanId], success)
│   ├── confirm-payment/
│   ├── privacy-and-policy/           # RGPD / privacidad
│   ├── setup/
│   ├── admin/                        # Panel (layout con sesión NextAuth)
│   │   ├── layout.tsx
│   │   ├── caravans/                 # Lista, new, edit, distribution
│   │   ├── chapels/
│   │   ├── buses/
│   │   ├── ordinances/
│   │   └── managers/                 # Usuarios admin (colección admin)
│   └── api/                          # Route handlers (route.ts)
│       ├── auth/[...nextauth]/       # NextAuth
│       ├── admin/                    # CRUD / contraseñas admin
│       ├── caravans/, chapels/, buses/, bus-stops/, ordinances/
│       ├── registrations/
│       └── gdpr/
│
├── features/                         # Dominio por feature
│   ├── auth/                         # admin.model, admin.repository, hooks, componentes gestores
│   ├── caravans/
│   ├── chapels/
│   ├── buses/
│   ├── ordinances/
│   └── registrations/
│
├── common/                           # Compartido
│   ├── models/
│   ├── repositories/                 # ej. roles.repository
│   ├── hooks/
│   ├── components/
│   ├── lib/firebase.js               # Cliente Firestore (browser)
│   └── utils/
│
├── lib/                              # Auth y servidor
│   ├── auth/config.ts                # NextAuth
│   └── firebase-admin.ts             # Admin SDK
│
├── providers/                        # SessionProvider (NextAuth), etc.
├── utils/firestore/errors.ts         # Errores Firestore (raíz)
├── proxy.ts                          # Lógica tipo middleware (no sustituye middleware.ts)
└── wiki/
    ├── development.md
    ├── current-implementation.md     # Fuente de verdad técnica
    └── project.md
```

## Principios de Organización

### Cuándo usar `features/`

- Código específico de una feature de negocio (auth, caravans, chapels, buses, ordinances, registrations)
- Models, repositories, hooks y components que solo se usan en esa feature
- Ejemplo: `features/auth/` contiene todo lo relacionado con autenticación

**Estructura estándar de una feature:**

```
features/[feature]/
  ├── models/          # Modelos específicos de la feature
  ├── repositories/    # Repositorios específicos de la feature
  ├── hooks/           # Hooks específicos de la feature
  └── components/      # Componentes específicos de la feature (opcional)
```

### Cuándo usar `common/`

- Código compartido entre múltiples features
- Modelos y helpers genéricos (tipos helper como `WithId`, `CreateInput`, etc.)
- Repositorios compartidos (ej: roles)
- Hooks compartidos (ej: useRoles)
- Componentes reutilizables globales (layout, shared)
- Providers de React (Ant Design, React Query)
- Configuración base (Firebase)
- Utilidades generales (firestore helpers, etc.)

**Ejemplos:**

- `common/models/index.ts` - Helper types genéricos compartidos
- `common/models/roles.model.ts` - Modelo de roles compartido
- `common/repositories/roles.repository.ts` - Repository de roles
- `common/hooks/roles.hooks.ts` - Hook de roles compartido
- `common/components/layout/` - Componentes de layout compartidos
- `common/providers/` - Providers globales de React
- `common/lib/firebase.js` - Configuración de Firebase
- `common/utils/` - Utilidades generales de Firestore

## Ejemplos Concretos

### Feature: `features/auth/`

```
features/auth/
  ├── models/
  │   ├── admin.model.ts         # Credenciales del panel (NextAuth)
  │   └── user.model.ts          # Modelo User (colección users; reservado / no usado en login actual)
  ├── repositories/
  │   ├── admin.repository.ts
  │   └── admin.repository.server.ts
  ├── hooks/
  │   └── auth.hooks.ts          # useSession, signOut (NextAuth)
  └── components/                # Gestores, drawers de admin, etc.
```

### Feature: `features/chapels/`

```
features/chapels/
  ├── models/
  │   └── chapels.model.ts       # Chapel, CreateChapelInput, UpdateChapelInput, ChapelWithId
  ├── repositories/
  │   └── chapels.repository.ts  # ChapelRepository con métodos CRUD
  ├── hooks/
  │   └── chapels.hooks.ts       # useChapels, useCreateChapel, etc. (usan repository directamente)
  └── components/                # Componentes específicos de chapels (opcional)
```

### Código Compartido: `common/`

```
common/
  ├── models/
  │   ├── index.ts               # Helper types: WithId<T>, CreateInput<T>, UpdateInput<T>
  │   └── roles.model.ts         # Role, CreateRoleInput, UpdateRoleInput, RoleWithId
  ├── repositories/
  │   └── roles.repository.ts    # RoleRepository
  └── hooks/
      └── roles.hooks.ts         # useRoles (usa repository directamente)
```

## Flujo de Datos

1. **Modelo** (`models/[feature].model.ts`): Define la interfaz y tipos derivados
2. **Repository** (`repositories/[feature].repository.ts`): Implementa operaciones CRUD con Firestore
3. **Hook** (`hooks/[feature].hooks.ts`): Expone la funcionalidad usando React Query, llamando al repository
4. **Componente**: Usa el hook para obtener datos y realizar mutaciones

**Ejemplo de flujo:**

```typescript
// 1. Modelo (ejemplo genérico)
export interface Chapel {
  /* ... */
}
export type CreateChapelInput = CreateInput<Chapel>;

// 2. Repository
export class ChapelRepository {
  async create(input: CreateChapelInput): Promise<ChapelWithId> {
    /* ... */
  }
}

// 3. Hook
export const useCreateChapel = () => {
  const repository = new ChapelRepository();
  return useMutation({
    mutationFn: (input: CreateChapelInput) => repository.create(input),
  });
};

// 4. Componente
const { mutate: createChapel } = useCreateChapel();
```

## Beneficios de esta Estructura

- **Cohesión**: Todo el código de una feature está junto, facilitando el mantenimiento
- **Mantenibilidad**: Fácil encontrar y modificar código relacionado
- **Escalabilidad**: Fácil agregar nuevas features siguiendo el mismo patrón
- **Reutilización**: `common/` para código compartido, `features/` para específico
- **Claridad**: Estructura predecible y fácil de navegar

---

**Ver también**: [Implementación actual](./current-implementation.md) | [Convenciones de Código](./04-convenciones-codigo.md) | [Índice](./development.md)
