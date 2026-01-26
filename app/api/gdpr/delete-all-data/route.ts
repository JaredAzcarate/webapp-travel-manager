import { dataAccessLogsRepository } from "@/common/lib/repositories/dataAccessLogs.repository";
import { registrationRepository } from "@/features/registrations/repositories/registrations.repository";
import { Timestamp } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { uuid } = await request.json();

    if (!uuid) {
      return NextResponse.json(
        { message: "UUID é obrigatório" },
        { status: 400 }
      );
    }

    const registration = await registrationRepository.getByUuid(uuid);

    if (!registration) {
      return NextResponse.json(
        { message: "Registo não encontrado" },
        { status: 404 }
      );
    }

    // Log the deletion before deleting (for audit purposes)
    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for") || 
                     headersList.get("x-real-ip") || 
                     "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    await dataAccessLogsRepository.create({
      registrationId: registration.id,
      action: "DELETE",
      accessedBy: "USER",
      accessedAt: Timestamp.now(),
      ipAddress,
      userAgent,
    });

    // Delete the registration
    await registrationRepository.delete(registration.id);

    return NextResponse.json(
      { message: "Todos os dados foram eliminados com sucesso" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting data:", error);
    return NextResponse.json(
      { message: "Erro ao eliminar dados" },
      { status: 500 }
    );
  }
}
