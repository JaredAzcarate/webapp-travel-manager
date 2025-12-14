# 📝 Convenciones de Código

## Nombres de Archivos

- **Componentes React**: PascalCase (ej: `UserCard.tsx`)
- **Hooks**: camelCase con prefijo `use` (ej: `useAuth.tsx`)
- **Repositorios**: camelCase con sufijo `.repository.ts` (ej: `user.repository.ts`)
- **Modelos**: camelCase con sufijo `.model.ts` (ej: `user.model.ts`)
- **Constantes**: UPPER_SNAKE_CASE (ej: `API_ENDPOINTS.ts`)

## Nombres de Variables y Funciones

- **Variables**: camelCase (ej: `userName`, `isLoading`)
- **Funciones**: camelCase (ej: `getUserById`, `handleSubmit`)
- **Constantes**: UPPER_SNAKE_CASE (ej: `MAX_CAPACITY`)
- **Interfaces/Types**: PascalCase (ej: `User`, `AuthState`)

## Nombres de Colecciones y Campos

- **Todo en inglés** (según especificación)
- Colecciones: plural, camelCase (ej: `chapels`, `busStops`)
- Campos: camelCase (ej: `fullName`, `isAdult`, `paymentStatus`)

## Imports

Orden de imports:

1. React y Next.js
2. Librerías externas (Ant Design, React Query, etc.)
3. Imports internos con alias `@/`
4. Tipos (al final con `type`)

```typescript
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Form, Input, Button } from "antd";
import { useQuery } from "@tanstack/react-query";
import { UserRepository } from "@/features/auth/repositories/user.repository";
import { User } from "@/features/auth/models/user.model";
import type { FormProps } from "antd";
```

## Tipos TypeScript

- **Siempre tipar** funciones, props y estados
- Usar `interface` para objetos, `type` para uniones y alias
- Preferir tipos explícitos sobre `any`

```typescript
// ✅ Correcto
interface UserCardProps {
  user: User;
  onEdit: (id: string) => void;
}

// ❌ Incorrecto
function UserCard({ user, onEdit }: any) {
  // ...
}
```

## Convenciones de Idioma

### Comentarios

**⚠️ IMPORTANTE: Todos los comentarios en el código DEBEN estar en inglés.**

```typescript
// ✅ Correcto - Comentario en inglés
// Get user by ID from Firestore
const user = await userRepository.getById(userId);

// ❌ Incorrecto - Comentario en portugués
// Obter usuário por ID do Firestore
const user = await userRepository.getById(userId);
```

### UI y Feedback al Usuario

**⚠️ IMPORTANTE: Todo el texto de la UI y feedback al usuario DEBE estar en portugués de Portugal.**

Esto incluye:

- Labels de formularios
- Mensajes de notificación
- Mensajes de error
- Textos de botones
- Placeholders
- Títulos y descripciones

```typescript
// ✅ Correcto - UI en portugués
<Form.Item label="Nome Completo" name="name">
  <Input placeholder="João Silva" />
</Form.Item>;

notification.success({
  title: "Sucesso",
  description: "O utilizador foi criado com sucesso",
});

// ❌ Incorrecto - UI en inglés
<Form.Item label="Full Name" name="name">
  <Input placeholder="John Doe" />
</Form.Item>;

notification.success({
  title: "Success",
  description: "User created successfully",
});
```

### Código

- **Nombres de variables, funciones, tipos**: Siempre en inglés
- **Nombres de colecciones y campos**: Siempre en inglés (según especificación)
- **Rutas**: Siempre en inglés (según especificación)

```typescript
// ✅ Correcto
const userName = "João";
const getUserById = (id: string) => {
  /* ... */
};
interface UserCardProps {
  /* ... */
}

// ❌ Incorrecto
const nomeUtilizador = "João";
const obterUtilizadorPorId = (id: string) => {
  /* ... */
};
interface PropsCartaoUtilizador {
  /* ... */
}
```

---

**Ver también**: [Manejo de Estado](./05-estado-datos.md) | [Feedback al Usuario](./09-feedback-usuario.md) | [Índice](./development.md)
