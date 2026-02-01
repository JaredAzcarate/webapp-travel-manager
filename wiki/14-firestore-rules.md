# 🔒 Firestore Security Rules

## Configuración

Las reglas de seguridad de Firestore están definidas en `firestore.rules` en la raíz del proyecto.

## Reglas Básicas

### Autenticación

- Todas las operaciones requieren autenticación (excepto creación de registros públicos)
- Los usuarios ADMIN tienen acceso completo
- Los usuarios CHAPEL solo pueden ver/editar registros de su propia capilla

### Colecciones

#### `admin` collection

**Permisos CRUD:**

- **Create**: Solo desde API route autenticado (no desde cliente)
  - Las creaciones de admin deben hacerse a través de `/api/admin/create`
  - El cliente NO puede crear admins directamente
- **Read**: Solo ADMIN autenticado
  - Solo usuarios con rol ADMIN pueden leer la colección admin
- **Update**: Solo ADMIN autenticado
  - Solo usuarios con rol ADMIN pueden actualizar admins
- **Delete**: Solo ADMIN autenticado
  - Solo usuarios con rol ADMIN pueden eliminar admins

**Ejemplo de regla:**
```javascript
match /admin/{adminId} {
  allow read: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN';
  allow write: if false; // Solo desde API route
}
```

#### `chapels` collection

**Permisos CRUD:**

- **Create**: Solo ADMIN autenticado
  - Solo usuarios con rol ADMIN pueden crear capelas
- **Read**: Usuarios autenticados (ADMIN y CHAPEL)
  - Todos los usuarios autenticados pueden leer capelas
- **Update**: Solo ADMIN autenticado
  - Solo usuarios con rol ADMIN pueden actualizar capelas
- **Delete**: Solo ADMIN autenticado
  - Solo usuarios con rol ADMIN pueden eliminar capelas

**Ejemplo de regla:**
```javascript
match /chapels/{chapelId} {
  allow read: if request.auth != null;
  allow create, update, delete: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN';
}
```

#### `caravans` collection

**Permisos CRUD:**

- **Create**: Solo ADMIN autenticado
  - Solo usuarios con rol ADMIN pueden crear viagems
- **Read**: Usuarios autenticados (ADMIN y CHAPEL)
  - Todos los usuarios autenticados pueden leer viagems
- **Update**: Solo ADMIN autenticado
  - Solo usuarios con rol ADMIN pueden actualizar viagems
- **Delete**: Solo ADMIN autenticado
  - Solo usuarios con rol ADMIN pueden eliminar viagems

**Ejemplo de regla:**
```javascript
match /caravans/{caravanId} {
  allow read: if request.auth != null;
  allow create, update, delete: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN';
}
```

#### `buses` collection

**Permisos CRUD:**

- **Create**: Solo ADMIN autenticado
  - Solo usuarios con rol ADMIN pueden crear autocarros
- **Read**: Usuarios autenticados (ADMIN y CHAPEL)
  - Todos los usuarios autenticados pueden leer autocarros
- **Update**: Solo ADMIN autenticado
  - Solo usuarios con rol ADMIN pueden actualizar autocarros
- **Delete**: Solo ADMIN autenticado (con validación de que no esté en uso)
  - Solo usuarios con rol ADMIN pueden eliminar autocarros
  - Debe validarse que el autocarro no esté asociado a ninguna viagem activa

**Ejemplo de regla:**
```javascript
match /buses/{busId} {
  allow read: if request.auth != null;
  allow create, update: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN';
  allow delete: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN' &&
    // Validar que no esté en uso (verificar en caravans)
    !exists(/databases/$(database)/documents/caravans/$(caravanId)) where 
      busId in get(/databases/$(database)/documents/caravans/$(caravanId)).data.busIds;
}
```

#### `busStops` collection

**Permisos CRUD:**

- **Create**: Solo ADMIN autenticado
  - Solo usuarios con rol ADMIN pueden crear paradas de autocarro
- **Read**: Usuarios autenticados (ADMIN y CHAPEL)
  - Todos los usuarios autenticados pueden leer paradas
- **Update**: Solo ADMIN autenticado
  - Solo usuarios con rol ADMIN pueden actualizar paradas
- **Delete**: Solo ADMIN autenticado
  - Solo usuarios con rol ADMIN pueden eliminar paradas

**Ejemplo de regla:**
```javascript
match /busStops/{busStopId} {
  allow read: if request.auth != null;
  allow create, update, delete: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN';
}
```

#### `registrations` collection

**Permisos CRUD:**

- **Create**: Público (sin autenticación) - para registro público
  - Los usuarios públicos pueden crear registraciones sin autenticación
  - Esto permite el formulario de inscripción público
- **Read**: 
  - ADMIN: Todas las registraciones
  - CHAPEL: Solo registraciones donde `chapelId == request.auth.token.chapelId`
  - Público: Solo su propia registración (por teléfono)
- **Update**:
  - ADMIN: Cualquier registración
  - CHAPEL: Solo registraciones de su capela (`chapelId == request.auth.token.chapelId`)
  - Público: Solo su propia registración (por teléfono)
- **Delete**: Solo ADMIN autenticado
  - Solo usuarios con rol ADMIN pueden eliminar registraciones

**Ejemplo de regla:**
```javascript
match /registrations/{registrationId} {
  // Create: público
  allow create: if true;
  
  // Read: ADMIN ve todo, CHAPEL solo su capela, público solo su registro
  allow read: if request.auth == null || 
    (request.auth != null && 
      (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN' ||
       (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'CHAPEL' &&
        resource.data.chapelId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.chapelId) ||
       resource.data.phone == request.resource.data.phone));
  
  // Update: ADMIN todo, CHAPEL su capela, público su registro
  allow update: if request.auth != null && 
    (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN' ||
     (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'CHAPEL' &&
      resource.data.chapelId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.chapelId) ||
     resource.data.phone == request.resource.data.phone);
  
  // Delete: solo ADMIN
  allow delete: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN';
}
```

#### `users` collection

**Permisos CRUD:**

- **Create**: Solo ADMIN autenticado
  - Solo usuarios con rol ADMIN pueden crear usuarios
- **Read**: Usuarios autenticados pueden leer
  - Todos los usuarios autenticados pueden leer usuarios
- **Update**: Solo ADMIN o el propio usuario
  - ADMIN puede actualizar cualquier usuario
  - Usuarios pueden actualizar solo su propio perfil
- **Delete**: Solo ADMIN autenticado
  - Solo usuarios con rol ADMIN pueden eliminar usuarios

**Ejemplo de regla:**
```javascript
match /users/{userId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN';
  allow update: if request.auth != null && 
    (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN' ||
     request.auth.uid == userId);
  allow delete: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN';
}
```

## Desarrollo

Para desarrollo, puedes usar reglas más permisivas temporalmente:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // Solo para desarrollo
    }
  }
}
```

**⚠️ IMPORTANTE**: Nunca uses reglas permisivas en producción.

## Despliegue

Para desplegar las reglas a Firebase:

```bash
firebase deploy --only firestore:rules
```

O desde Firebase Console:
1. Ve a Firestore Database
2. Pestaña "Rules"
3. Copia y pega el contenido de `firestore.rules`
4. Haz clic en "Publish"

---

**Ver también**: [Firebase y Firestore](./11-firebase.md) | [Índice](./development.md)

