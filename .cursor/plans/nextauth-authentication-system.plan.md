# Plan: Sistema de Autenticación con NextAuth

## Objetivo

Implementar autenticación con NextAuth (Credentials Provider) para un único usuario admin, con credenciales almacenadas en la collection "admin" de Firestore y protección completa de todas las rutas `/admin/**`.

## Cambios Principales

### 1. Dependencias

- Instalar `next-auth` (v5 para Next.js 16)
- Instalar `bcryptjs` y `@types/bcryptjs` para hash de contraseñas

### 2. Modelo Admin

**Archivo: `/features/auth/models/admin.model.ts`**

- Interface `Admin` con campos:
- `username: string` (nombre de usuario único)
- `password: string` (contraseña hasheada)
- `createdAt: Timestamp`
- `updatedAt?: Timestamp`
- Tipos derivados: `CreateAdminInput`, `UpdateAdminInput`, `AdminWithId`

### 3. Repositorio Admin

**Archivo: `/features/auth/repositories/admin.repository.ts`**

- Método `getByUsername(username)` para buscar admin por username
- Método `create(input)` para crear admin (hashear password antes de guardar)
- Método `verifyPassword(plainPassword, hashedPassword)` para validar contraseña
- Usar bcrypt para hash y comparación de contraseñas

### 4. Utilidades de Contraseña

**Archivo: `/lib/auth/password.utils.ts`**

- Función `hashPassword(password)` para crear hash con bcrypt
- Función `comparePassword(plain, hashed)` para comparar contraseñas
- Salt rounds: 10-12

### 5. Configuración NextAuth

**Archivo: `/lib/auth/config.ts`**

- Configuración centralizada de NextAuth
- Credentials Provider que valida contra Firestore collection "admin"
- Callbacks para personalizar sesión
- Opciones de sesión (JWT strategy)

### 6. API Route NextAuth

**Archivo: `/app/api/auth/[...nextauth]/route.ts`**

- Handler de NextAuth con Credentials Provider
- Validar username y password contra collection "admin" en Firestore
- Comparar password hasheado con bcrypt
- Retornar sesión con datos del admin (sin password)

### 7. Middleware de Protección

**Archivo: `/middleware.ts` (raíz del proyecto)**

- Middleware de Next.js para proteger todas las rutas `/admin/**`
- Verificar sesión con `getServerSession`
- Redirigir a `/admin/login` si no autenticado
- Permitir acceso a `/admin/login` sin autenticación

### 8. Página de Login

**Archivo: `/app/admin/login/page.tsx`**

- Formulario con Ant Design (username y password)
- Usar `signIn` de `next-auth/react`
- Manejo de errores y mensajes en portugués
- Redirección a `/admin` después de login exitoso
- Validación de campos con Ant Design Form

### 9. Layout Admin Protegido

**Archivo: `/app/admin/layout.tsx`**

- Verificar sesión con `getServerSession`
- Redirigir a login si no autenticado
- Mostrar información del usuario en el layout (opcional)
- Mantener estructura actual (AdminSidebar, Content)

### 10. Hooks de Autenticación

**Archivo: `/features/auth/hooks/auth.hooks.ts`**

- Hook `useSession()` para obtener sesión en cliente
- Hook `useSignIn()` para función de login
- Hook `useSignOut()` para función de logout

### 11. Script de Inicialización (Opcional)

**Archivo: `/scripts/create-admin.ts`**

- Script para crear el usuario admin inicial en collection "admin"
- Hash de contraseña antes de guardar en Firestore
- Solo ejecutar una vez para crear el usuario

## Estructura de Archivos

```javascript
/app
  /api
    /auth
      /[...nextauth]
        route.ts              # NextAuth API route
  /admin
    /login
      page.tsx                # Página de login
    layout.tsx                # Layout protegido (actualizado)

/features
  /auth
    /models
      admin.model.ts          # Nuevo: modelo Admin
    /repositories
      admin.repository.ts     # Nuevo: AdminRepository
    /hooks
      auth.hooks.ts           # Nuevo: hooks de autenticación

/lib
  /auth
    config.ts                 # Configuración NextAuth
    password.utils.ts         # Utilidades de contraseña

/middleware.ts                # Middleware de protección

/scripts
  create-admin.ts             # Script opcional para crear admin
```



## Estructura de la Collection "admin"

```typescript
// Collection: admin (solo un documento)
{
  id: string,                 // Firestore doc ID
  username: string,           // Nombre de usuario único
  password: string,           // Contraseña hasheada con bcrypt
  createdAt: Timestamp,
  updatedAt?: Timestamp
}
```



## Flujo de Autenticación

1. Usuario accede a `/admin/**`
2. Middleware verifica sesión
3. Si no autenticado → redirige a `/admin/login`
4. Usuario ingresa username/password en formulario
5. NextAuth valida credenciales contra collection "admin" en Firestore
6. Compara password hasheado con bcrypt
7. Si válido → crea sesión JWT
8. Redirige a `/admin`
9. Rutas protegidas verifican sesión automáticamente

## Consideraciones

- Las contraseñas se almacenan hasheadas en Firestore (nunca en texto plano)
- Usar bcrypt con salt rounds apropiados (10-12)
- NextAuth maneja las sesiones con JWT
- El middleware protege todas las rutas `/admin/**` automáticamente
- Solo existe un documento en la collection "admin"
- El admin debe crearse manualmente la primera vez (script o manualmente en Firestore)
- El username es único (solo un documento en la collection)

## Variables de Entorno

Agregar a `.env.local`:

```javascript
NEXTAUTH_SECRET=<secret-generado>
NEXTAUTH_URL=http://localhost:3000
```

Para generar NEXTAUTH_SECRET:

```bash
openssl rand -base64 32
```



## Seguridad

- Passwords hasheados con bcrypt
- NextAuth maneja tokens JWT de forma segura
- Middleware verifica sesión en cada request
- No exponer información sensible (password) en el cliente
- El password nunca se retorna en la sesión

## Tipos TypeScript

**Sesión NextAuth:**

```typescript
// Tipos extendidos para NextAuth
declare module "next-auth" {
  interface Session {
    user: {
      username: string;
    };
  }

  interface User {
    username: string;
  }
}

```