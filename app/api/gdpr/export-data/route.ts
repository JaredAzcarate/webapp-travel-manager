import { dataAccessLogsRepository } from "@/common/lib/repositories/dataAccessLogs.repository";
import { registrationRepository } from "@/features/registrations/repositories/registrations.repository";
import { CaravanRepository } from "@/features/caravans/repositories/caravans.repository";
import { ChapelRepository } from "@/features/chapels/repositories/chapels.repository";
import { ordinanceRepository } from "@/features/ordinances/repositories/ordinances.repository";

const caravanRepository = new CaravanRepository();
const chapelRepository = new ChapelRepository();
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

    // Get related data
    const [caravan, chapel] = await Promise.all([
      caravanRepository.getById(registration.caravanId).catch(() => null),
      chapelRepository.getById(registration.chapelId).catch(() => null),
    ]);

    // Get ordinance details
    const ordinancesWithDetails = await Promise.all(
      registration.ordinances.map(async (ord) => {
        const ordinance = await ordinanceRepository.getById(ord.ordinanceId);
        return {
          ...ord,
          ordinanceName: ordinance?.name || "Desconhecida",
        };
      })
    );

    // Get access logs
    const accessLogs = await dataAccessLogsRepository.getByRegistrationId(
      registration.id
    );

    // Build export data
    const exportData = {
      registration: {
        id: registration.id,
        phone: registration.phone,
        fullName: registration.fullName,
        ageCategory: registration.ageCategory,
        gender: registration.gender,
        isOfficiator: registration.isOfficiator,
        legalGuardianName: registration.legalGuardianName,
        legalGuardianEmail: registration.legalGuardianEmail,
        legalGuardianPhone: registration.legalGuardianPhone,
        ordinances: ordinancesWithDetails,
        isFirstTimeConvert: registration.isFirstTimeConvert,
        paymentStatus: registration.paymentStatus,
        paymentConfirmedAt: registration.paymentConfirmedAt?.toDate().toISOString(),
        userReportedPaymentAt: registration.userReportedPaymentAt?.toDate().toISOString(),
        participationStatus: registration.participationStatus,
        cancellationReason: registration.cancellationReason,
        cancelledAt: registration.cancelledAt?.toDate().toISOString(),
        privacyPolicyAccepted: registration.privacyPolicyAccepted,
        privacyPolicyAcceptedAt: registration.privacyPolicyAcceptedAt?.toDate().toISOString(),
        consentWithdrawnAt: registration.consentWithdrawnAt?.toDate().toISOString(),
        createdAt: registration.createdAt.toDate().toISOString(),
        updatedAt: registration.updatedAt.toDate().toISOString(),
      },
      caravan: caravan
        ? {
            id: caravan.id,
            name: caravan.name,
            departureAt: caravan.departureAt?.toDate().toISOString(),
            returnAt: caravan.returnAt?.toDate().toISOString(),
          }
        : null,
      chapel: chapel
        ? {
            id: chapel.id,
            name: chapel.name,
          }
        : null,
      accessLogs: accessLogs.map((log) => ({
        action: log.action,
        accessedBy: log.accessedBy,
        accessedAt: log.accessedAt.toDate().toISOString(),
      })),
      exportedAt: new Date().toISOString(),
    };

    // Log the export
    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for") || 
                     headersList.get("x-real-ip") || 
                     "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    await dataAccessLogsRepository.create({
      registrationId: registration.id,
      action: "EXPORT",
      accessedBy: "USER",
      accessedAt: Timestamp.now(),
      ipAddress,
      userAgent,
    });

    // Return as JSON file
    const jsonString = JSON.stringify(exportData, null, 2);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `meus-dados-${timestamp}.json`;

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting data:", error);
    return NextResponse.json(
      { message: "Erro ao exportar dados" },
      { status: 500 }
    );
  }
}
