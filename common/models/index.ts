// Helper types genéricos compartidos
export type WithId<T> = T & { id: string };

export type CreateInput<T> = Omit<T, "createdAt" | "updatedAt" | "id">;

export type UpdateInput<T> = Partial<CreateInput<T>>;
