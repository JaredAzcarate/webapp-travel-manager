export interface CreateUserInput {
  name: string;
  email: string;
  roleId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  roleId: string;
  createdAt: string;
  [key: string]: unknown;
}
