import {
  buildChapelFinanceRows,
  aggregateRegistrationsByChapel,
  allocateChapelTransferCredit,
  creditFromBalance,
  getChapelCreditBalance,
  pendingFromBalance,
  type ChapelFinanceRow,
} from "@/common/utils/caravanFinancial.utils";
import {
  getEffectiveFinancialStatus,
  resolveCaravanPricing,
  roundEuroAmount,
} from "@/common/utils/tripPrice.utils";
import { caravanRepositoryServer } from "@/features/caravans/repositories/caravans.repository.server";
import type { CaravanWithId } from "@/features/caravans/models/caravans.model";
import { chapelRepositoryServer } from "@/features/chapels/repositories/chapels.repository.server";
import { registrationRepositoryServer } from "@/features/registrations/repositories/registrations.repository.server";
import { Timestamp } from "firebase-admin/firestore";
import type { ChapelTransferWithId } from "../models/chapelTransfers.model";
import { chapelTransferRepositoryServer } from "../repositories/chapelTransfers.repository.server";

export interface CaravanFinanceSummary {
  caravanId: string;
  caravanName: string;
  financialStatus: "OPEN" | "CLOSED";
  rows: ChapelFinanceRow[];
  totals: {
    adults: number;
    youth: number;
    children: number;
    firstTimeConvert: number;
    totalDue: number;
    totalPaid: number;
    balance: number;
    pendingBalance: number;
    creditBalance: number;
  };
}

export interface ChapelOverviewCaravanBalance {
  caravanId: string;
  caravanName: string;
  balance: number;
  pendingBalance: number;
  creditBalance: number;
  financialStatus: "OPEN" | "CLOSED";
}

export interface ChapelOverviewRow {
  chapelId: string;
  chapelName: string;
  /** @deprecated Use pendingBalance. Kept for compatibility during transition. */
  openBalance: number;
  pendingBalance: number;
  creditBalance: number;
  caravans: ChapelOverviewCaravanBalance[];
}

function sumTransfersByChapel(
  transfers: Array<{ chapelId: string; amount: number }>
): Map<string, number> {
  const map = new Map<string, number>();
  for (const transfer of transfers) {
    const current = map.get(transfer.chapelId) ?? 0;
    map.set(transfer.chapelId, roundEuroAmount(current + transfer.amount));
  }
  return map;
}

function sumRows(rows: ChapelFinanceRow[]): CaravanFinanceSummary["totals"] {
  return rows.reduce(
    (acc, row) => ({
      adults: acc.adults + row.adults,
      youth: acc.youth + row.youth,
      children: acc.children + row.children,
      firstTimeConvert: acc.firstTimeConvert + row.firstTimeConvert,
      totalDue: roundEuroAmount(acc.totalDue + row.totalDue),
      totalPaid: roundEuroAmount(acc.totalPaid + row.totalPaid),
      balance: roundEuroAmount(acc.balance + row.balance),
      pendingBalance: roundEuroAmount(
        acc.pendingBalance + pendingFromBalance(row.balance)
      ),
      creditBalance: roundEuroAmount(
        acc.creditBalance + creditFromBalance(row.balance)
      ),
    }),
    {
      adults: 0,
      youth: 0,
      children: 0,
      firstTimeConvert: 0,
      totalDue: 0,
      totalPaid: 0,
      balance: 0,
      pendingBalance: 0,
      creditBalance: 0,
    }
  );
}

export async function getCaravanFinanceSummary(
  caravanId: string
): Promise<CaravanFinanceSummary> {
  const [caravan, chapels, registrations, transfers] = await Promise.all([
    caravanRepositoryServer.getById(caravanId),
    chapelRepositoryServer.getAll(),
    registrationRepositoryServer.getFiltered(caravanId, {
      participationStatus: "ACTIVE",
    }),
    chapelTransferRepositoryServer.getByCaravanId(caravanId),
  ]);

  const pricing = resolveCaravanPricing(caravan);
  const registrationAggregates = aggregateRegistrationsByChapel(
    registrations,
    pricing
  );
  const transfersByChapel = sumTransfersByChapel(transfers);
  const rows = buildChapelFinanceRows(
    chapels,
    registrationAggregates,
    transfersByChapel
  );

  const financialStatus = getEffectiveFinancialStatus(caravan);

  return {
    caravanId: caravan.id,
    caravanName: caravan.name,
    financialStatus,
    rows,
    totals: sumRows(rows),
  };
}

export async function getFinanceOverview(): Promise<ChapelOverviewRow[]> {
  const [caravans, chapels] = await Promise.all([
    caravanRepositoryServer.getAll(),
    chapelRepositoryServer.getAll(),
  ]);

  const openCaravans = caravans.filter(
    (c) => getEffectiveFinancialStatus(c) === "OPEN"
  );

  const summaries = await Promise.all(
    openCaravans.map((caravan) => getCaravanFinanceSummary(caravan.id))
  );

  const balanceByChapelCaravan = new Map<string, number>();
  for (const summary of summaries) {
    for (const row of summary.rows) {
      balanceByChapelCaravan.set(
        `${row.chapelId}:${summary.caravanId}`,
        row.balance
      );
    }
  }

  return chapels
    .map((chapel) => {
      const caravanBalances: ChapelOverviewCaravanBalance[] = openCaravans.map(
        (caravan) => {
          const balance =
            balanceByChapelCaravan.get(`${chapel.id}:${caravan.id}`) ?? 0;
          return {
            caravanId: caravan.id,
            caravanName: caravan.name,
            balance,
            pendingBalance: pendingFromBalance(balance),
            creditBalance: 0,
            financialStatus: getEffectiveFinancialStatus(caravan),
          };
        }
      );

      const pendingBalance = roundEuroAmount(
        caravanBalances.reduce((sum, item) => sum + item.pendingBalance, 0)
      );
      const creditBalance = getChapelCreditBalance(chapel);

      return {
        chapelId: chapel.id,
        chapelName: chapel.name,
        openBalance: pendingBalance,
        pendingBalance,
        creditBalance,
        caravans: caravanBalances,
      };
    })
    .sort((a, b) => a.chapelName.localeCompare(b.chapelName, "pt"));
}

export async function createChapelTransferWithCreditBox(params: {
  caravanId: string;
  chapelId: string;
  amount: number;
  transferredAt: Timestamp;
  registeredBy: string;
  notes?: string;
  applyCreditAmount?: number;
}): Promise<{
  transfer: ChapelTransferWithId;
  creditUsed: number;
  creditGenerated: number;
  chapelCreditBalance: number;
}> {
  const amount = roundEuroAmount(params.amount);
  if (amount <= 0) {
    throw new Error("O montante deve ser superior a zero");
  }

  const [summary, chapel, chapelTransfers] = await Promise.all([
    getCaravanFinanceSummary(params.caravanId),
    chapelRepositoryServer.getById(params.chapelId),
    chapelTransferRepositoryServer.getByChapelId(params.chapelId),
  ]);

  const row = summary.rows.find((item) => item.chapelId === params.chapelId);
  const pendingBalance = pendingFromBalance(row?.balance ?? 0);
  const chapelCreditBalance = getChapelCreditBalance(chapel);

  const allocation = allocateChapelTransferCredit({
    amount,
    pendingBalance,
    chapelCreditBalance,
    applyCreditAmount: params.applyCreditAmount,
  });

  const creditAllocations: Array<{ transferId: string; amount: number }> = [];

  if (allocation.creditUsed > 0) {
    const sources = [...chapelTransfers]
      .filter((item) => {
        const remaining = roundEuroAmount(
          item.creditRemaining ?? item.creditGenerated ?? 0
        );
        return remaining > 0;
      })
      .sort((a, b) => {
        const aTime = a.transferredAt?.toMillis?.() ?? 0;
        const bTime = b.transferredAt?.toMillis?.() ?? 0;
        return aTime - bTime;
      });

    let remainingToConsume = allocation.creditUsed;
    for (const source of sources) {
      if (remainingToConsume <= 0) break;
      const available = roundEuroAmount(
        source.creditRemaining ?? source.creditGenerated ?? 0
      );
      if (available <= 0) continue;

      const consume = roundEuroAmount(Math.min(available, remainingToConsume));
      const nextRemaining = roundEuroAmount(available - consume);
      await chapelTransferRepositoryServer.update(source.id, {
        creditRemaining: nextRemaining,
      });
      creditAllocations.push({ transferId: source.id, amount: consume });
      remainingToConsume = roundEuroAmount(remainingToConsume - consume);
    }

    if (remainingToConsume > 0) {
      throw new Error(
        "Saldo a favor insuficiente para aplicar o montante solicitado"
      );
    }
  }

  const creditNote =
    allocation.creditUsed > 0
      ? `Pagamento com saldo a favor da unidade (${allocation.creditUsed.toFixed(2)} €)`
      : "";
  const trimmedNotes = params.notes?.trim() ?? "";
  const finalNotes = [trimmedNotes, creditNote].filter(Boolean).join(" — ");

  const transfer = await chapelTransferRepositoryServer.create({
    caravanId: params.caravanId,
    chapelId: params.chapelId,
    amount,
    transferredAt: params.transferredAt,
    registeredBy: params.registeredBy,
    ...(finalNotes ? { notes: finalNotes } : {}),
    ...(allocation.creditGenerated > 0
      ? {
          creditGenerated: allocation.creditGenerated,
          creditRemaining: allocation.creditGenerated,
        }
      : {}),
    ...(allocation.creditUsed > 0 ? { creditUsed: allocation.creditUsed } : {}),
    ...(creditAllocations.length > 0 ? { creditAllocations } : {}),
  });

  await chapelRepositoryServer.setCreditBalance(
    params.chapelId,
    allocation.creditBalanceAfter
  );

  return {
    transfer,
    creditUsed: allocation.creditUsed,
    creditGenerated: allocation.creditGenerated,
    chapelCreditBalance: allocation.creditBalanceAfter,
  };
}

export async function deleteChapelTransferWithCreditBox(
  transferId: string
): Promise<void> {
  const transfer = await chapelTransferRepositoryServer.getById(transferId);
  const chapel = await chapelRepositoryServer.getById(transfer.chapelId);
  const currentCredit = getChapelCreditBalance(chapel);
  const creditGenerated = roundEuroAmount(transfer.creditGenerated ?? 0);
  const creditUsed = roundEuroAmount(transfer.creditUsed ?? 0);
  const creditRemaining = roundEuroAmount(
    transfer.creditRemaining ?? creditGenerated
  );

  if (creditGenerated > 0 && creditRemaining < creditGenerated) {
    const usedFromThis = roundEuroAmount(creditGenerated - creditRemaining);
    throw new Error(
      `Não é possível eliminar: este pagamento gerou ${formatCreditEuros(creditGenerated)} de saldo a favor, dos quais ${formatCreditEuros(usedFromThis)} já foram usados noutra viagem. Anule primeiro os pagamentos feitos com saldo a favor.`
    );
  }

  if (creditUsed > 0 && transfer.creditAllocations?.length) {
    for (const allocation of transfer.creditAllocations) {
      const source = await chapelTransferRepositoryServer.getById(
        allocation.transferId
      );
      const sourceGenerated = roundEuroAmount(source.creditGenerated ?? 0);
      const sourceRemaining = roundEuroAmount(
        source.creditRemaining ?? sourceGenerated
      );
      const restored = roundEuroAmount(
        Math.min(sourceGenerated, sourceRemaining + allocation.amount)
      );
      await chapelTransferRepositoryServer.update(source.id, {
        creditRemaining: restored,
      });
    }
  }

  const nextCredit = roundEuroAmount(
    Math.max(currentCredit - creditGenerated + creditUsed, 0)
  );

  await chapelTransferRepositoryServer.delete(transferId);
  await chapelRepositoryServer.setCreditBalance(transfer.chapelId, nextCredit);
}

function formatCreditEuros(amount: number): string {
  return `${amount.toFixed(2).replace(".", ",")} €`;
}

export async function closeCaravanFinances(
  caravanId: string
): Promise<CaravanWithId> {
  return caravanRepositoryServer.update(caravanId, {
    financialStatus: "CLOSED",
    financialClosedAt: Timestamp.now() as unknown as CaravanWithId["financialClosedAt"],
  });
}

export async function reopenCaravanFinances(
  caravanId: string
): Promise<CaravanWithId> {
  return caravanRepositoryServer.update(caravanId, {
    financialStatus: "OPEN",
  });
}
