import { adminDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const caravanId = searchParams.get("caravanId");
    const busId = searchParams.get("busId");

    if (!caravanId || !busId) {
      return NextResponse.json(
        { message: "caravanId e busId são obrigatórios" },
        { status: 400 }
      );
    }

    const snapshot = await adminDb
      .collection("registrations")
      .where("caravanId", "==", caravanId)
      .where("busId", "==", busId)
      .where("participationStatus", "==", "ACTIVE")
      .get();

    const count = snapshot.size;

    return NextResponse.json({ count }, { status: 200 });
  } catch (error) {
    console.error("Error counting active registrations:", error);
    return NextResponse.json(
      { message: "Erro ao contar inscrições ativas" },
      { status: 500 }
    );
  }
}
