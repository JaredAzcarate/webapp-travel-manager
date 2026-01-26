import { adminRepository } from "@/features/auth/repositories/admin.repository";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { adminId, newPassword } = await request.json();

    if (!adminId || !newPassword) {
      return NextResponse.json(
        { message: "AdminId e nova password são obrigatórios" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: "A senha deve ter no mínimo 8 caracteres" },
        { status: 400 }
      );
    }

    // Update password
    await adminRepository.updatePassword(adminId, newPassword);

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
