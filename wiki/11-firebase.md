# 🔥 Firebase y Firestore

## Configuración

- Cliente (browser): **`common/lib/firebase.js`** — inicialización del SDK cliente y `db`
- Admin SDK (servidor): **`lib/firebase-admin.ts`**
- Variables de entorno: `.env.local` (y credenciales del Admin según [15-configuracion-firebase-admin.md](./15-configuracion-firebase-admin.md))

## Collections (Firestore)

- Nombres en inglés, plural, camelCase
- En uso principal: **`admin`**, **`chapels`**, **`caravans`**, **`buses`**, **`busStops`**, **`ordinances`**, **`registrations`**, **`roles`**, **`dataAccessLogs`**
- **`users`**: existe repositorio en código pero **no** está conectado al login actual; ver [Implementación actual](./current-implementation.md)

## Repository Pattern

**Todas las operaciones de Firestore pasan por repositorios**

- Ubicación: `features/[feature]/repositories/` o `common/repositories/`
- Métodos estándar: `getAll()`, `getById()`, `create()`, `update()`, `delete()`
- Los hooks llaman directamente a los repositories (sin capa de servicios)

### Ejemplo

```typescript
// features/chapels/repositories/chapels.repository.ts
export class ChapelRepository {
  private collectionName = "chapels";

  async getAll(): Promise<ChapelWithId[]> {
    const snap = await getDocs(collection(db, this.collectionName));
    return snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ChapelWithId[];
  }

  async getById(id: string): Promise<ChapelWithId> {
    // Implementación con Firestore
  }

  async create(input: CreateChapelInput): Promise<ChapelWithId> {
    // Implementación con Firestore
  }
}
```

## Tipos TypeScript

- Modelos completos en `features/[feature]/models/[feature].model.ts`
- Helper types genéricos en `common/models/index.ts`: `WithId<T>`, `CreateInput<T>`, `UpdateInput<T>`
- Cada modelo exporta: `[Model]`, `Create[Model]Input`, `Update[Model]Input`, `[Model]WithId`
- Uso de `Timestamp` de Firestore para fechas (`createdAt`, `updatedAt`)

## Errores

- Clases de error personalizadas en **`utils/firestore/errors.ts`** (raíz del repo)
- `FirestoreNotFoundError`, `FirestoreValidationError`, etc.

---

**Ver también**: [Testing y Validación](./12-testing.md) | [Índice](./development.md)
