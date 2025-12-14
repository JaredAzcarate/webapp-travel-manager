---
name: "Feature 02: Autenticación y Protección de Rutas"
overview: ""
todos: []
---

# Feature 02: Autenticación y Protección de Rutas

## Objetivo

Implementar sistema completo de autenticación usando Firebase Auth para roles ADMIN y CHAPEL, protección de rutas del área admin, middleware de verificación, hooks personalizados y componentes de protección siguiendo principios SOLID.

## Estructura de Carpetas

```
/hooks
  /auth
    useAuth.ts             # Hook principal de autenticación
    useAuthState.ts        # Hook para estado de auth
    useRoleCheck.ts        # Hook para verificación de roles
/components
  /auth
    ProtectedRoute.tsx     # Componente wrapper para rutas protegidas
    RequireRole.tsx        # Componente para requerir rol específico
    AuthProvider.tsx       # Context provider de autenticación
  /admin
    AdminLayout.tsx        # Layout del área admin con navegación
/types
  /auth
    auth.types.ts          # Tipos de autenticación y roles
/app
  /admin
    /login
      page.tsx             # Página de login
    layout.tsx             # Layout protegido del admin
  /api
    /auth
      /login
        route.ts           # API endpoint para login
      /logout
        route.ts           # API endpoint para logout
      /session
        route.ts           # API endpoint para verificar sesión
/utils
  /auth
    auth.service.ts        # Servicio de autenticación (Single Responsibility)
    role.validator.ts      # Validador de roles (Single Responsibility)
    token.manager.ts       # Gestor de tokens (si aplica)
/lib
  /middleware
    auth.middleware.ts     # Middleware para Next.js
```

## Tareas

### 1. Tipos de Autenticación (types/auth)

- **auth.types.ts**: 
  - `UserRole` enum: "ADMIN" | "CHAPEL"
  - `AuthUser` interface: usuario autenticado con rol
  - `LoginCredentials` interface
  - `AuthState` interface
  - `AuthContextType` interface

### 2. Servicios de Autenticación (utils/auth)

- **auth.service.ts**: 
  - Clase o funciones puras para: login, logout, getCurrentUser
  - Métodos: `login(email, password)`, `logout()`, `getCurrentUser()`, `getUserRole()`
  - Single Responsibility: solo lógica de autenticación
- **role.validator.ts**: 
  - Funciones para validar roles
  - `hasRole(user, role)`, `canAccess(user, requiredRole)`
  - Single Responsibility: solo validación de roles

### 3. Hooks Personalizados (hooks/auth)

- **useAuth.ts**: 
  - Hook principal que expone: user, loading, error, login, logout
  - Usa AuthContext
- **useAuthState.ts**: 
  - Hook para estado reactivo de autenticación
  - Retorna estado actual del usuario
- **useRoleCheck.ts**: 
  - Hook para verificar roles específicos
  - `useRoleCheck(requiredRole)` retorna boolean

### 4. Componentes de Autenticación (components/auth)

- **AuthProvider.tsx**: 
  - Context Provider que envuelve la app
  - Gestiona estado de autenticación
  - Open/Closed: extensible sin modificar
- **ProtectedRoute.tsx**: 
  - Componente wrapper que verifica autenticación
  - Redirige a /admin/login si no autenticado
  - Dependency Inversion: recibe children
- **RequireRole.tsx**: 
  - Componente que verifica rol específico
  - Solo ADMIN o solo CHAPEL según props
  - Liskov Substitution: puede reemplazar ProtectedRoute

### 5. Layout Admin (components/admin)

- **AdminLayout.tsx**: 
  - Layout con sidebar, header, navegación
  - Integra ProtectedRoute
  - Muestra menú según rol del usuario
  - Usa Ant Design: Layout, Menu, Avatar

### 6. Página de Login (app/admin/login)

- **page.tsx**: 
  - Formulario de login con react-hook-form
  - Integración con Ant Design: Form, Input, Button
  - Manejo de errores de Firebase Auth
  - Redirección después de login exitoso

### 7. Layout Protegido (app/admin/layout.tsx)

- **layout.tsx**: 
  - Layout que aplica protección de rutas
  - Usa ProtectedRoute como wrapper
  - Incluye AdminLayout

### 8. API Routes (app/api/auth)

- **/login/route.ts**: 
  - POST: recibe credentials, valida, retorna token/sesión
  - Single Responsibility: solo login
  - Manejo de errores apropiado
- **/logout/route.ts**: 
  - POST: cierra sesión del usuario
  - Limpia tokens/cookies
- **/session/route.ts**: 
  - GET: verifica sesión actual
  - Retorna usuario autenticado y rol

### 9. Middleware (lib/middleware)

- **auth.middleware.ts**: 
  - Middleware de Next.js para proteger rutas /admin/**
  - Verifica token de Firebase
  - Redirige a /admin/login si no autenticado
  - Dependency Inversion: configurable

## Principios SOLID Aplicados

- **Single Responsibility**: 
  - auth.service.ts solo autenticación
  - role.validator.ts solo validación de roles
  - Cada API route tiene una responsabilidad única
- **Open/Closed**: 
  - AuthProvider extensible sin modificar
  - Validadores extensibles
- **Liskov Substitution**: 
  - RequireRole puede usarse donde se usa ProtectedRoute
- **Interface Segregation**: 
  - Hooks específicos para casos de uso específicos
  - Tipos separados para diferentes contextos
- **Dependency Inversion**: 
  - Componentes dependen de abstracciones (hooks, context)
  - Servicios inyectables

## Flujo de Autenticación

1. Usuario accede a /admin/login
2. Ingresa email/password
3. Frontend llama a /api/auth/login
4. Backend valida con Firebase Auth
5. Retorna sesión/token
6. Frontend guarda en contexto/estado
7. Redirige a /admin
8. ProtectedRoute verifica autenticación
9. Middleware protege todas las rutas /admin/**

## Archivos a Crear

- `/types/auth/auth.types.ts`
- `/utils/auth/auth.service.ts`
- `/utils/auth/role.validator.ts`
- `/hooks/auth/useAuth.ts`
- `/hooks/auth/useAuthState.ts`
- `/hooks/auth/useRoleCheck.ts`
- `/components/auth/AuthProvider.tsx`
- `/components/auth/ProtectedRoute.tsx`
- `/components/auth/RequireRole.tsx`
- `/components/admin/AdminLayout.tsx`
- `/app/admin/login/page.tsx`
- `/app/admin/layout.tsx`
- `/app/api/auth/login/route.ts`
- `/app/api/auth/logout/route.ts`
- `/app/api/auth/session/route.ts`
- `/lib/middleware/auth.middleware.ts` (opcional para Next.js middleware)