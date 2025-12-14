---
name: Preparar backend collections y endpoints
overview: "Crear la estructura completa del backend siguiendo la organización por features: modelos en cada feature (models/), repositories en cada feature (repositories/), hooks que llaman directamente a repositories para todas las operaciones CRUD y especiales."
todos:
  - id: create-helper-types
    content: Crear helper types compartidos en common/models/index.ts
    status: pending
  - id: create-feature-models
    content: Crear modelos TypeScript en cada feature (features/[feature]/models/)
    status: pending
  - id: create-feature-repositories
    content: Crear repositories en cada feature (features/[feature]/repositories/)
    status: pending
  - id: create-feature-hooks
    content: Crear hooks en cada feature que usen repositories directamente (features/[feature]/hooks/)
    status: pending
  - id: implement-business-rules
    content: Implementar validaciones de reglas de negocio en repositories
    status: pending
---

# Preparar backend collections y endpoints

## Objetivo

Preparar toda la infraestructura del backend siguiendo la estructura por features: definir modelos en cada feature (models/), crear repositories en cada feature (repositories/), y hooks que llaman directamente a repositories para todas las operaciones CRUD y especiales según los flujos de negocio especificados en `wiki/project.md`.

## Estructura a crear

```
features/
  chapels/
    models/
      chapels.model.ts
    repositories/
      chapels.repository.ts
    hooks/
      chapels.hooks.ts
  caravans/
    models/
      caravans.model.ts
    repositories/
      caravans.repository.ts
    hooks/
      caravans.hooks.ts
  buses/
    models/
      buses.model.ts
      busStops.model.ts
    repositories/
      buses.repository.ts
      busStops.repository.ts
    hooks/
      buses.hooks.ts
      busStops.hooks.ts
  registrations/
    models/
      registrations.model.ts
    repositories/
      registrations.repository.ts
    hooks/
      registrations.hooks.ts

common/
  models/
    index.ts  # Helper types compartidos (WithId, CreateInput, UpdateInput)
```

## 1. Modelos por Feature

Los modelos van en cada feature correspondiente, siguiendo la estructura de `features/auth/models/` y `features/chapels/models/`.

### 1.1 `features/chapels/models/chapels.model.ts`

```typescript
import { Timestamp } from "firebase/firestore";
import { CreateInput, UpdateInput, WithId } from "@/common/models/index";

export interface Chapel {
  name: string;
  whatsappPhone?: string;
  email?: string;
  address?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type CreateChapelInput = CreateInput<Chapel>;
export type UpdateChapelInput = UpdateInput<Chapel>;
export type ChapelWithId = WithId<Chapel>;
```

### 1.2 `features/auth/models/user.model.ts`

Nota: Ya existe parcialmente. Completar con todos los campos según la especificación:

```typescript
import { Timestamp } from "firebase/firestore";
import { CreateInput, UpdateInput, WithId } from "@/common/models/index";

export type UserRole = "ADMIN" | "CHAPEL";

export interface User {
  name: string;
  email: string;
  roleId: string; // reference to roles.id (mantener como está actualmente)
  chapelId?: string; // if role === "CHAPEL", link to chapels.id
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  [key: string]: unknown;
}

export type CreateUserInput = CreateInput<User>;
export type UpdateUserInput = UpdateInput<User>;
export type UserWithId = WithId<User>;
```

### 1.3 `features/caravans/models/caravans.model.ts`

```typescript
import { Timestamp } from "firebase/firestore";
import { CreateInput, UpdateInput, WithId } from "@/common/models/index";

export interface Caravan {
  name: string;
  templeName?: string;
  departureAt: Timestamp;
  returnAt: Timestamp;
  formOpenAt: Timestamp;
  formCloseAt: Timestamp;
  isActive: boolean;
  busIds: string[]; // references to buses.id
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type CreateCaravanInput = CreateInput<Caravan>;
export type UpdateCaravanInput = UpdateInput<Caravan>;
export type CaravanWithId = WithId<Caravan>;
```

### 1.4 `features/buses/models/buses.model.ts`

```typescript
import { Timestamp } from "firebase/firestore";
import { CreateInput, UpdateInput, WithId } from "@/common/models/index";

export interface Bus {
  name: string;
  capacity: number; // max ACTIVE registrations per caravan for this bus
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type CreateBusInput = CreateInput<Bus>;
export type UpdateBusInput = UpdateInput<Bus>;
export type BusWithId = WithId<Bus>;
```

### 1.5 `features/buses/models/busStops.model.ts`

```typescript
import { Timestamp } from "firebase/firestore";
import { CreateInput, UpdateInput, WithId } from "@/common/models/index";

export interface BusStop {
  busId: string; // references buses.id
  chapelId: string; // references chapels.id
  order: number; // route order (1,2,3…)
  pickupTime?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type CreateBusStopInput = CreateInput<BusStop>;
export type UpdateBusStopInput = UpdateInput<BusStop>;
export type BusStopWithId = WithId<BusStop>;
```

### 1.6 `features/registrations/models/registrations.model.ts`

```typescript
import { Timestamp } from "firebase/firestore";
import { CreateInput, UpdateInput, WithId } from "@/common/models/index";

export type OrdinanceType =
  | "BAPTISTRY"
  | "INITIATORY"
  | "ENDOWMENT"
  | "SEALING";
export type PaymentStatus = "PENDING" | "PAID" | "FREE" | "CANCELLED";
export type ParticipationStatus = "ACTIVE" | "CANCELLED";

export interface Registration {
  caravanId: string; // references caravans.id
  chapelId: string; // chapel of departure
  busId: string; // assigned bus

  phone: string; // main identifier for this caravan (unique per caravanId)
  fullName: string;
  isAdult: boolean; // true = adult, false = youth
  gender: "M" | "F";
  isOfficiator: boolean;

  legalGuardianName?: string;
  legalGuardianEmail?: string;
  legalGuardianPhone?: string;

  ordinanceType: OrdinanceType;
  ordinanceSlot: string; // e.g. "9:30-10:00"

  isFirstTimeConvert: boolean;
  paymentStatus: PaymentStatus;
  paymentConfirmedAt?: Timestamp;
  userReportedPaymentAt?: Timestamp;

  participationStatus: ParticipationStatus;
  cancellationReason?: string;
  cancelledAt?: Timestamp;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type CreateRegistrationInput = CreateInput<Registration>;
export type UpdateRegistrationInput = UpdateInput<Registration>;
export type RegistrationWithId = WithId<Registration>;
```

### 1.7 `common/models/index.ts`

Helper types compartidos que pueden ser usados por todas las features:

```typescript
export type WithId<T> = T & { id: string };

export type CreateInput<T> = Omit<T, "createdAt" | "updatedAt" | "id">;

export type UpdateInput<T> = Partial<CreateInput<T>>;
```

## 2. Repositories por Feature

Cada feature tendrá su propio repository en `features/[feature]/repositories/`, siguiendo el patrón de `features/chapels/repositories/` y `features/auth/repositories/`.

### 2.1 `features/chapels/repositories/chapels.repository.ts`

Ya existe. Verificar que tenga todos los métodos necesarios.

### 2.2 `features/caravans/repositories/caravans.repository.ts`

```typescript
import { db } from "@/common/lib/firebase";
import /* ... */ "firebase/firestore";
import {
  CaravanWithId,
  CreateCaravanInput,
  UpdateCaravanInput,
} from "../models/caravans.model";

export class CaravanRepository {
  private collectionName = "caravans";

  async getAll(): Promise<CaravanWithId[]> {
    /* ... */
  }
  async getById(id: string): Promise<CaravanWithId> {
    /* ... */
  }
  async create(input: CreateCaravanInput): Promise<CaravanWithId> {
    /* ... */
  }
  async update(id: string, input: UpdateCaravanInput): Promise<CaravanWithId> {
    /* ... */
  }
  async delete(id: string): Promise<void> {
    /* ... */
  }
  async getActive(): Promise<CaravanWithId[]> {
    /* ... */
  }
}
```

### 2.3 Features restantes

Aplicar el mismo patrón para:

- `features/buses/repositories/buses.repository.ts`
- `features/buses/repositories/busStops.repository.ts`
- `features/registrations/repositories/registrations.repository.ts` (con métodos especiales)

## 3. Hooks por Feature

Cada feature tendrá hooks que llaman directamente a los repositories, siguiendo el patrón de `features/auth/hooks/` y `features/chapels/hooks/`:

### 3.1 `features/chapels/hooks/chapels.hooks.ts`

Ya existe. Verificar que use el repository directamente.

### 3.2 `features/caravans/hooks/caravans.hooks.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CaravanRepository } from "../repositories/caravans.repository";
import {
  CreateCaravanInput,
  UpdateCaravanInput,
} from "../models/caravans.model";

const repository = new CaravanRepository();

export const useCaravans = () => {
  return useQuery({
    queryKey: ["caravans"],
    queryFn: () => repository.getAll(),
  });
};

export const useCaravan = (id: string) => {
  return useQuery({
    queryKey: ["caravans", id],
    queryFn: () => repository.getById(id),
    enabled: !!id,
  });
};

export const useCreateCaravan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCaravanInput) => repository.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caravans"] });
    },
  });
};

// Similar para update y delete
```

### 3.3 Features restantes

Aplicar el mismo patrón para:

- `features/buses/hooks/buses.hooks.ts`
- `features/buses/hooks/busStops.hooks.ts`
- `features/registrations/hooks/registrations.hooks.ts` (con hooks especiales)

## 4. Repositories - Métodos Especiales

Cada repository puede tener métodos adicionales según las necesidades de la feature:

### 4.1 `features/auth/repositories/user.repository.ts`

Métodos estándar CRUD + `getByEmail(email: string)`.

### 4.2 `features/caravans/repositories/caravans.repository.ts`

Métodos estándar CRUD + `getActive()` para obtener caravanas activas con capacidad disponible.

### 4.3 `features/buses/repositories/busStops.repository.ts`

Métodos estándar CRUD + `getByBusId(busId: string)` para obtener todas las paradas de un bus ordenadas por `order`.

### 4.4 `features/registrations/repositories/registrations.repository.ts`

Métodos estándar CRUD + métodos especiales:

- `getByPhone(phone: string, caravanId?: string)`: Buscar por teléfono
- `getByCaravanId(caravanId: string)`: Todas las registraciones de una caravana
- `getByChapelId(chapelId: string, caravanId?: string)`: Por capilla
- `getByBusId(busId: string, caravanId: string)`: Por bus en una caravana
- `countActiveByBus(caravanId: string, busId: string)`: Contar activas por bus
- `checkPhoneUniqueness(phone: string, caravanId: string)`: Verificar unicidad

## 5. Relaciones entre Collections

### Diagrama de relaciones

```
users
  └─ chapelId → chapels.id (opcional, si role === "CHAPEL")

caravans
  └─ busIds[] → buses.id (múltiples buses)

busStops
  ├─ busId → buses.id
  └─ chapelId → chapels.id

registrations
  ├─ caravanId → caravans.id
  ├─ chapelId → chapels.id
  └─ busId → buses.id
```

### Validaciones de relaciones

- Al crear `registration`: verificar que `caravanId`, `chapelId`, `busId` existen
- Al crear `busStop`: verificar que `busId` y `chapelId` existen
- Al crear `user` con `role === "CHAPEL"`: verificar que `chapelId` existe
- Al actualizar `caravan.busIds`: verificar que todos los `busIds` existen

## 6. Reglas de negocio a implementar

### 6.1 Unicidad de teléfono por caravana

- Al crear registro: verificar que no existe otro registro con mismo `phone` y `caravanId`
- Implementar en `registrations.repository.ts` método `checkPhoneUniqueness()`

### 6.2 Capacidad de bus

- Al crear registro: verificar capacidad disponible para `(caravanId, busId)`
- Contar solo registros con `participationStatus === "ACTIVE"`
- Implementar en `registrations.repository.ts` método `countActiveByBus()`

### 6.3 Asignación automática de bus

- Al crear registro: buscar bus que pasa por la capilla seleccionada
- Buscar en `busStops` donde `busId` está en `caravan.busIds` y `chapelId` coincide
- Si hay múltiples, elegir el primero disponible con capacidad

### 6.4 First-time convert

- Si `isFirstTimeConvert === true`, establecer `paymentStatus = "FREE"` automáticamente
- Validar en el repository al crear

### 7.5 Formulario abierto

- Verificar: `caravan.isActive === true`
- Verificar: fecha actual entre `formOpenAt` y `formCloseAt`
- Verificar: al menos un bus tiene capacidad disponible

## 7. Orden de implementación sugerido

1. Helper types compartidos en `common/models/index.ts`
2. Modelos en cada feature (`features/[feature]/models/`)
3. Repositories básicos en cada feature (`features/[feature]/repositories/`) con CRUD estándar
4. Repositories con métodos especiales (registrations)
5. Hooks en cada feature (`features/[feature]/hooks/`) que usan repositories directamente
6. Implementar validaciones de reglas de negocio en repositories

## 8. Consideraciones adicionales

### 8.1 Índices de Firestore

Crear índices compuestos para queries frecuentes:

- `registrations`: `(caravanId, busId, participationStatus)`
- `registrations`: `(caravanId, phone)`
- `registrations`: `(chapelId, caravanId)`
- `busStops`: `(busId, order)`

### 8.2 Validación de datos

- Validar tipos y formatos en los repositories
- Validar relaciones entre collections
- Validar reglas de negocio antes de crear/actualizar

### 8.3 Manejo de errores

- Usar clases de error personalizadas (`common/utils/firestore/errors.ts`)
- Retornar mensajes claros en portugués para el usuario
- Logs en inglés para debugging
