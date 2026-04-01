import { feedbackTicketsRepositoryServer } from "@/features/feedback/repositories/feedbackTickets.repository.server";
import type { FeedbackTicketType } from "@/features/feedback/models/feedbackTickets.model";
import { requireAdminRole } from "@/lib/auth/panel-session.server";
import { NextRequest, NextResponse } from "next/server";

const MAX_MESSAGE_LENGTH = 4000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const type = body.type as FeedbackTicketType | undefined;
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const pageUrl =
      typeof body.pageUrl === "string" ? body.pageUrl.slice(0, 2000) : undefined;

    if (type !== "ERROR" && type !== "SUGGESTION") {
      return NextResponse.json(
        { message: "Tipo inválido" },
        { status: 400 }
      );
    }

    if (!message || message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        {
          message: `A mensagem é obrigatória e deve ter no máximo ${MAX_MESSAGE_LENGTH} caracteres`,
        },
        { status: 400 }
      );
    }

    const userAgent = request.headers.get("user-agent")?.slice(0, 500);

    const ticket = await feedbackTicketsRepositoryServer.create({
      type,
      message,
      pageUrl,
      userAgent,
      status: "OPEN",
    });

    return NextResponse.json(
      { id: ticket.id, message: "Obrigado pelo seu feedback." },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST feedback-tickets:", error);
    return NextResponse.json(
      { message: "Erro ao enviar feedback" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const authResult = await requireAdminRole();
  if (!authResult.ok) {
    return authResult.response;
  }

  try {
    const tickets = await feedbackTicketsRepositoryServer.getAll();
    return NextResponse.json({ tickets }, { status: 200 });
  } catch (error) {
    console.error("GET feedback-tickets:", error);
    return NextResponse.json(
      { message: "Erro ao listar feedback" },
      { status: 500 }
    );
  }
}
