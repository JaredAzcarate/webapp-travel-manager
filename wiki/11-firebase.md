# 🔥 Firebase y Firestore

## Configuración

- Cliente Firebase: `/firebase/client.ts` (singleton)
- Admin SDK: `/firebase/admin.ts` (para server-side)
- Configuración en variables de entorno (`.env.local`)

## Collections (Firestore)

- Nombres en inglés, plural, camelCase
- `chapels`, `users`, `caravans`, `buses`, `busStops`, `registrations`

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

- Clases de error personalizadas en `/utils/firestore/errors.ts`
- `FirestoreNotFoundError`, `FirestoreValidationError`, etc.

---

**Ver también**: [Testing y Validación](./12-testing.md) | [Índice](./development.md)
