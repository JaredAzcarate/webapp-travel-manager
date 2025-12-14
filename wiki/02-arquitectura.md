# 🏗 Arquitectura y Principios

## Principios SOLID

El proyecto sigue los principios SOLID:

### Single Responsibility Principle (SRP)

- Cada módulo/clase tiene una única responsabilidad
- Ejemplo: `UserRepository` solo maneja operaciones CRUD de usuarios
- Ejemplo: `AuthService` solo maneja autenticación

### Open/Closed Principle (OCP)

- Componentes extensibles mediante props/interfaces
- No modificamos código existente, lo extendemos

### Liskov Substitution Principle (LSP)

- Los componentes pueden ser reemplazados por sus interfaces
- Ejemplo: `RequireRole` puede reemplazar `ProtectedRoute`

### Interface Segregation Principle (ISP)

- Interfaces específicas y pequeñas
- Hooks específicos para cada necesidad (`useAuth`, `useAuthState`)

### Dependency Inversion Principle (DIP)

- Repositorios dependen de abstracciones, no de implementaciones
- Inyección de dependencias mediante servicios

## Patrones de Diseño

### Repository Pattern

- Todos los accesos a Firestore se hacen a través de repositorios
- Ubicación: `features/[feature]/repositories/` o `common/repositories/`
- Cada feature tiene su propio repository (ej: `UserRepository`, `ChapelRepository`)
- Los hooks llaman directamente a los repositories (sin capa de servicios intermedia)
- Ejemplo: `features/auth/repositories/user.repository.ts`, `features/chapels/repositories/chapels.repository.ts`

### Model Pattern

- Cada feature tiene su modelo completo en `features/[feature]/models/[feature].model.ts`
- El modelo incluye la interfaz principal y tipos derivados (`CreateInput`, `UpdateInput`, `WithId`)
- Helper types genéricos en `common/models/index.ts` (`WithId<T>`, `CreateInput<T>`, `UpdateInput<T>`)
- Ejemplo: `features/auth/models/user.model.ts`, `features/chapels/models/chapels.model.ts`

### Custom Hooks

- Lógica reutilizable encapsulada en hooks
- Ubicación: `features/[feature]/hooks/` o `common/hooks/`
- Los hooks usan React Query y llaman directamente a los repositories
- Ejemplo: `useCreateUser`, `useChapels`, `useRoles`

### Context API + React Query

- Estado global de autenticación con Context API
- Estado del servidor con React Query
- Cache automático y sincronización

---

**Ver también**: [Estructura de Carpetas](./03-estructura-carpetas.md) | [Índice](./development.md)
