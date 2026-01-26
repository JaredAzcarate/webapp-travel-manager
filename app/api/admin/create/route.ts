import { adminRepositoryServer } from "@/features/auth/repositories/admin.repository.server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: "Username e password são obrigatórios" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "A senha deve ter no mínimo 8 caracteres" },
        { status: 400 }
      );
    }

    // Check if admin already exists
    const existing = await adminRepositoryServer.getByUsername(username);
    if (existing) {
      return NextResponse.json(
        { message: "Usuário já existe" },
        { status: 409 }
      );
    }

    // Create admin
    const admin = await adminRepositoryServer.create({ username, password });

    return NextResponse.json(
      {
        message: "Admin criado com sucesso",
        adminId: admin.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating admin:", error);
    return NextResponse.json(
      { message: "Erro ao criar admin" },
      { status: 500 }
    );
  }
}
