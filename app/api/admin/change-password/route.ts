import { adminRepositoryServer } from "@/features/auth/repositories/admin.repository.server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { username, newPassword } = await request.json();

    if (!username || !newPassword) {
      return NextResponse.json(
        { message: "Username e nova password são obrigatórios" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: "A senha deve ter no mínimo 8 caracteres" },
        { status: 400 }
      );
    }

    // Find admin by username
    const admin = await adminRepositoryServer.getByUsername(username);
    if (!admin) {
      return NextResponse.json(
        { message: "Admin não encontrado" },
        { status: 404 }
      );
    }

    // Update password
    await adminRepositoryServer.updatePassword(admin.id, newPassword);

    return NextResponse.json(
      {
        message: "Password atualizada com sucesso",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating password:", error);
    return NextResponse.json(
      { message: "Erro ao atualizar password" },
      { status: 500 }
    );
  }
}
