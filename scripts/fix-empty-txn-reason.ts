/**
 * One-time data repair: some WalletTransaction rows in production have
 * reason = '' (empty string), which isn't a valid TxnReason enum member.
 * MySQL's native ENUM silently stores '' for any value that doesn't match
 * one of the declared labels (rather than rejecting the write) unless the
 * connection is in strict SQL mode — these rows almost certainly predate
 * the current app/schema and slipped in through a path outside today's
 * codebase (no current code writes reason as anything but a literal
 * TxnReason value). Prisma's generated client can't hydrate '' into the
 * TxnReason union at all, so any query that selects `reason` on one of
 * these rows throws "Value '' not found in enum 'TxnReason'" - that broke
 * the /wallet page's `walletTransaction.findMany()` (which selects every
 * column), while /api/dashboard kept working because it only ever calls
 * `.aggregate()`/`.groupBy()` on this table, which don't need to hydrate
 * `reason` into the client at all.
 *
 * This reclassifies every affected row to ADMIN_ADJUSTMENT (the closest
 * "unclassified but real" bucket) without touching amount, balanceAfter,
 * or description, so the row - and the balance it already contributed to -
 * stays exactly as it was. Safe to re-run: the second run just finds 0 rows.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.$queryRaw<
    { id: string; userId: string; type: string; amount: string; description: string | null; createdAt: Date }[]
  >`SELECT id, userId, type, amount, description, createdAt FROM WalletTransaction WHERE reason = ''`;

  console.log(`Found ${rows.length} WalletTransaction row(s) with an empty reason.`);
  if (rows.length > 0) console.table(rows);

  if (rows.length > 0) {
    const updated = await prisma.$executeRaw`UPDATE WalletTransaction SET reason = 'ADMIN_ADJUSTMENT' WHERE reason = ''`;
    console.log(`Fixed ${updated} row(s) - reason set to ADMIN_ADJUSTMENT. Amount/balance/description were left untouched.`);
  } else {
    console.log("Nothing to fix.");
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
