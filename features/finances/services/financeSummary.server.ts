import {
  buildChapelFinanceRows,
  aggregateRegistrationsByChapel,
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
  };
}

export interface ChapelOverviewRow {
  chapelId: string;
  chapelName: string;
  openBalance: number;
  caravans: Array<{
    caravanId: string;
    caravanName: string;
    balance: number;
    financialStatus: "OPEN" | "CLOSED";
  }>;
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
    }),
    {
      adults: 0,
      youth: 0,
      children: 0,
      firstTimeConvert: 0,
      totalDue: 0,
      totalPaid: 0,
      balance: 0,
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
      const caravanBalances = openCaravans.map((caravan) => ({
        caravanId: caravan.id,
        caravanName: caravan.name,
        balance:
          balanceByChapelCaravan.get(`${chapel.id}:${caravan.id}`) ?? 0,
        financialStatus: getEffectiveFinancialStatus(caravan),
      }));

      const openBalance = roundEuroAmount(
        caravanBalances.reduce((sum, item) => sum + item.balance, 0)
      );

      return {
        chapelId: chapel.id,
        chapelName: chapel.name,
        openBalance,
        caravans: caravanBalances,
      };
    })
    .sort((a, b) => a.chapelName.localeCompare(b.chapelName, "pt"));
}

export async function closeCaravanFinances(
  caravanId: string
): Promise<CaravanWithId> {
  return caravanRepositoryServer.update(caravanId, {
    financialStatus: "CLOSED",
    financialClosedAt: Timestamp.now() as unknown as CaravanWithId["financialClosedAt"],
  });
}
