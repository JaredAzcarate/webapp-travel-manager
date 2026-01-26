import { dataAccessLogsRepositoryServer } from "@/common/lib/repositories/dataAccessLogs.repository.server";
import { registrationRepositoryServer } from "@/features/registrations/repositories/registrations.repository.server";
import { caravanRepositoryServer } from "@/features/caravans/repositories/caravans.repository.server";
import { chapelRepositoryServer } from "@/features/chapels/repositories/chapels.repository.server";
import { ordinanceRepositoryServer } from "@/features/ordinances/repositories/ordinances.repository.server";
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

    const registration = await registrationRepositoryServer.getByUuid(uuid);

    if (!registration) {
      return NextResponse.json(
        { message: "Registo não encontrado" },
        { status: 404 }
      );
    }

    // Get related data
    const [caravan, chapel] = await Promise.all([
      caravanRepositoryServer.getById(registration.caravanId).catch(() => null),
      chapelRepositoryServer.getById(registration.chapelId).catch(() => null),
    ]);

    // Get ordinance details
    const ordinancesWithDetails = await Promise.all(
      registration.ordinances.map(async (ord) => {
        const ordinance = await ordinanceRepositoryServer.getById(ord.ordinanceId);
        return {
          ...ord,
          ordinanceName: ordinance?.name || "Desconhecida",
        };
      })
    );

    // Get access logs
    const accessLogs = await dataAccessLogsRepositoryServer.getByRegistrationId(
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

    await dataAccessLogsRepositoryServer.create({
      registrationId: registration.id,
      action: "EXPORT",
      accessedBy: "USER",
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
