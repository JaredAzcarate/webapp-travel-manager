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

    // Update registration
    await registrationRepository.update(registration.id, {
      privacyPolicyAccepted: false,
      consentWithdrawnAt: Timestamp.now(),
    });

    // Log the action
    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for") || 
                     headersList.get("x-real-ip") || 
                     "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    await dataAccessLogsRepository.create({
      registrationId: registration.id,
      action: "WITHDRAW_CONSENT",
      accessedBy: "USER",
      accessedAt: Timestamp.now(),
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { message: "Consentimento retirado com sucesso" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error withdrawing consent:", error);
    return NextResponse.json(
      { message: "Erro ao retirar consentimento" },
      { status: 500 }
    );
  }
}
