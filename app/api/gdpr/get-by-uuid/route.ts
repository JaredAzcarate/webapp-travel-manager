import { dataAccessLogsRepository } from "@/common/lib/repositories/dataAccessLogs.repository";
import { registrationRepository } from "@/features/registrations/repositories/registrations.repository";
import { Timestamp } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const uuid = searchParams.get("uuid");

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

    // Log the access
    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for") || 
                     headersList.get("x-real-ip") || 
                     "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    await dataAccessLogsRepository.create({
      registrationId: registration.id,
      action: "VIEW",
      accessedBy: "USER",
      accessedAt: Timestamp.now(),
      ipAddress,
      userAgent,
    });

    return NextResponse.json(registration, { status: 200 });
  } catch (error) {
    console.error("Error getting registration by UUID:", error);
    return NextResponse.json(
      { message: "Erro ao obter dados" },
      { status: 500 }
    );
  }
}
