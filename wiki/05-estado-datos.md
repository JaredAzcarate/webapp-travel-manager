# 🔄 Manejo de Estado y Datos

## React Query para Estado del Servidor

**Todas las operaciones de fetching y mutaciones usan React Query.**

### Queries (Lectura de datos)

```typescript
// En el hook (features/caravans/hooks/caravans.hooks.ts)
const repository = new CaravanRepository();
const { data, isLoading, error } = useQuery({
  queryKey: ["caravans"],
  queryFn: () => repository.getAll(),
});
```

### Mutations (Escritura de datos)

```typescript
// En el hook (features/caravans/hooks/caravans.hooks.ts)
const repository = new CaravanRepository();
const mutation = useMutation({
  mutationFn: (data: CreateCaravanInput) => repository.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["caravans"] });
  },
});
```

### Cache y Sincronización

- React Query maneja automáticamente el cache
- `staleTime`: 1 minuto (configurado en `QueryProvider`)
- `refetchOnWindowFocus`: deshabilitado

## Context API para Estado Global

- **Solo para autenticación**: `AuthProvider` con `useAuth` hook
- Otro estado global se maneja con React Query o estado local

## Estado Local

- Usar `useState` para UI state (modales, formularios, etc.)
- No usar para datos del servidor

---

**Ver también**: [Formularios](./06-formularios.md) | [Índice](./development.md)
