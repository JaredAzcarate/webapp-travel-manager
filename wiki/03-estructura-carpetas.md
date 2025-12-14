# 📁 Estructura de Carpetas

## Organización por Features

El proyecto está organizado siguiendo un patrón de **features** donde cada feature agrupa todo su código relacionado (models, repositories, hooks, components). El código compartido entre features se encuentra en `common/`.

```
/
├── app/                          # Next.js App Router
│   ├── (public)/                 # Rutas públicas
│   │   ├── page.tsx             # Home
│   │   ├── registration/        # Registro público
│   │   └── confirm-payment/     # Confirmación de pago
│   ├── admin/                   # Área admin (protegida)
│   │   ├── layout.tsx          # Layout con protección
│   │   ├── login/              # Login
│   │   ├── caravans/           # Gestión de caravanas
│   │   ├── chapels/            # Gestión de capillas
│   │   ├── users/              # Gestión de usuarios
│   │   └── buses/              # Gestión de buses
│   └── api/                     # API Routes (server-side)
│       └── auth/               # Endpoints de autenticación
│
├── features/                     # Features de la aplicación
│   ├── auth/                    # Feature de autenticación
│   │   ├── models/             # Modelos específicos (user.model.ts)
│   │   ├── repositories/       # Repositorios específicos (user.repository.ts)
│   │   ├── hooks/              # Hooks específicos (user.hooks.ts)
│   │   └── components/         # Componentes específicos (opcional)
│   ├── caravans/               # Feature de caravanas
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── hooks/
│   │   └── components/
│   ├── chapels/                # Feature de capillas
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── hooks/
│   │   └── components/
│   └── [otras-features]/       # Otras features siguiendo el mismo patrón
│
├── common/                      # Código compartido entre features
│   ├── models/                 # Modelos compartidos y helpers genéricos
│   │   ├── index.ts            # Helper types genéricos (WithId, CreateInput, UpdateInput)
│   │   └── roles.model.ts      # Modelo de roles
│   ├── repositories/           # Repositorios compartidos
│   │   └── roles.repository.ts # Repository de roles
│   ├── hooks/                  # Hooks compartidos
│   │   └── roles.hooks.ts      # useRoles
│   ├── components/             # Componentes reutilizables globales
│   │   ├── layout/             # Componentes de layout
│   │   └── shared/             # Componentes compartidos genéricos
│   ├── providers/              # Providers de React (Ant Design, React Query)
│   │   ├── antd-provider.tsx
│   │   └── query-provider.tsx
│   ├── lib/                    # Configuración y utilidades base
│   │   └── firebase.js         # Configuración de Firebase
│   └── utils/                  # Utilidades generales
│       └── firestore/          # Utilidades de Firestore
│
└── wiki/                        # Documentación
    ├── project.md              # Especificación funcional
    └── development.md          # Índice de desarrollo
```

## Principios de Organización

### Cuándo usar `features/`

- Código específico de una feature de negocio (auth, caravans, chapels, users, buses)
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
  │   └── user.model.ts          # User, CreateUserInput, UpdateUserInput, UserWithId
  ├── repositories/
  │   └── user.repository.ts     # UserRepository con métodos CRUD
  ├── hooks/
  │   └── user.hooks.ts          # useCreateUser, etc. (usan repository directamente)
  └── components/                 # Componentes específicos de auth (opcional)
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
// 1. Modelo
export interface User {
  /* ... */
}
export type CreateUserInput = CreateInput<User>;

// 2. Repository
export class UserRepository {
  async create(input: CreateUserInput): Promise<UserWithId> {
    /* ... */
  }
}

// 3. Hook
export const useCreateUser = () => {
  const repository = new UserRepository();
  return useMutation({
    mutationFn: (input: CreateUserInput) => repository.create(input),
  });
};

// 4. Componente
const { createUser } = useCreateUser();
```

## Beneficios de esta Estructura

- **Cohesión**: Todo el código de una feature está junto, facilitando el mantenimiento
- **Mantenibilidad**: Fácil encontrar y modificar código relacionado
- **Escalabilidad**: Fácil agregar nuevas features siguiendo el mismo patrón
- **Reutilización**: `common/` para código compartido, `features/` para específico
- **Claridad**: Estructura predecible y fácil de navegar

---

**Ver también**: [Convenciones de Código](./04-convenciones-codigo.md) | [Índice](./development.md)
