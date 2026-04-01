import { adminDb } from "@/lib/firebase-admin";
import { requirePanelSession } from "@/lib/auth/panel-session.server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePanelSession();
    if (!auth.ok) {
      return auth.response;
    }

    const searchParams = request.nextUrl.searchParams;
    const caravanId = searchParams.get("caravanId");
    const busId = searchParams.get("busId");

    if (!caravanId || !busId) {
      return NextResponse.json(
        { message: "caravanId e busId são obrigatórios" },
        { status: 400 }
      );
    }

    if (auth.user.role === "SECRETARY" && !auth.user.chapelId) {
      return NextResponse.json(
        { message: "Conta de secretário sem capela" },
        { status: 403 }
      );
    }

    let queryRef = adminDb
      .collection("registrations")
      .where("caravanId", "==", caravanId)
      .where("busId", "==", busId)
      .where("participationStatus", "==", "CANCELLED");

    if (auth.user.role === "SECRETARY" && auth.user.chapelId) {
      queryRef = queryRef.where("chapelId", "==", auth.user.chapelId);
    }

    const snapshot = await queryRef.get();

    const count = snapshot.size;

    return NextResponse.json({ count }, { status: 200 });
  } catch (error) {
    console.error("Error counting cancelled registrations:", error);
    return NextResponse.json(
      { message: "Erro ao contar inscrições canceladas" },
      { status: 500 }
    );
  }
}
