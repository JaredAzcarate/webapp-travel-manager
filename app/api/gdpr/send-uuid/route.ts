import { dataAccessLogsRepositoryServer } from "@/common/lib/repositories/dataAccessLogs.repository.server";
import { registrationRepositoryServer } from "@/features/registrations/repositories/registrations.repository.server";
import { sendWhatsAppMessage } from "@/features/registrations/utils/whatsapp.utils";
import { generateGdprUuid } from "@/common/utils/uuid.utils";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { phone, fullName } = await request.json();

    if (!phone || !fullName) {
      return NextResponse.json(
        { message: "Telefone e nome completo são obrigatórios" },
        { status: 400 }
      );
    }

    // Search for registrations matching phone and fullName
    const registrations = await registrationRepositoryServer.getByPhoneAndName(
      phone,
      fullName
    );

    if (registrations.length === 0) {
      // Don't reveal if data exists or not for security
      return NextResponse.json(
        {
          message:
            "Se os seus dados foram encontrados, receberá um link por WhatsApp.",
        },
        { status: 200 }
      );
    }

    // Get or generate UUID for the first matching registration
    const registration = registrations[0];
    let uuid = registration.gdprUuid;

    if (!uuid) {
      // Generate UUID if it doesn't exist (for old registrations)
      uuid = generateGdprUuid();
      await registrationRepositoryServer.update(registration.id, {
        gdprUuid: uuid,
      });
    }

    // Get base URL
    const headersList = await headers();
    const host = headersList.get("host");
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const baseUrl = `${protocol}://${host}`;
    const dataUrl = `${baseUrl}/privacy-and-policy/my-data?uuid=${uuid}`;

    // Send WhatsApp message
    const message = `Olá ${fullName}. Para aceder aos seus dados, utilize este link: ${dataUrl}`;
    await sendWhatsAppMessage(phone, message);

    // Log the access request
    const ipAddress = request.headers.get("x-forwarded-for") || 
                     request.headers.get("x-real-ip") || 
                     "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    await dataAccessLogsRepositoryServer.create({
      registrationId: registration.id,
      action: "VIEW",
      accessedBy: "USER",
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      {
        message:
          "Se os seus dados foram encontrados, receberá um link por WhatsApp.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending UUID:", error);
    return NextResponse.json(
      { message: "Erro ao processar solicitação" },
      { status: 500 }
    );
  }
}
