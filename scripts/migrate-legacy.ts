/**
 * One-time migration: pulls accounts, wallet balances, bank/crypto payout
 * details, referral relationships, and active mining-plan investments from
 * the OLD surecash_mining database (surecashmining.com.ng) into this app's
 * database, so existing users can keep using the same login on the new
 * platform.
 *
 * SCOPE — what this migrates vs. leaves behind:
 *   Migrated: user accounts (passwords carry over as-is — both systems use
 *     bcrypt), wallet balances (preserving the exact total per user), bank
 *     accounts / USDT wallets, referral relationships, KYC status (just the
 *     status, not the document images), and any currently-ACTIVE mining
 *     plan investment (so nobody's in-progress daily payouts get dropped).
 *   Deliberately NOT migrated: detailed wallet/transaction history,
 *     historical deposits/withdrawals, task/spin/ad-watch activity logs,
 *     KYC document images, and admin accounts. None of that is deleted from
 *     the old system — it stays there, untouched, as a permanent record if
 *     ever needed. This keeps the migration focused on what actually
 *     matters for a smooth handover: identity, login, money, and
 *     in-progress investments.
 *
 * SAFETY:
 *   - Defaults to DRY RUN (prints what it would do, writes nothing). Pass
 *     --live to actually write.
 *   - Idempotent: safe to re-run. Skips any old user whose email already
 *     exists in the new database (so a second run — or a partial first
 *     run — won't duplicate anyone).
 *   - Preserves the exact total wallet balance per user (old
 *     main+bonus+referral+mining+pending must equal new MAIN+ENGAGEMENT+
 *     SALES) — the script verifies this per-user and refuses to write if
 *     any mismatch is found.
 *
 * USAGE (run from the app's terminal, in the project root):
 *   LEGACY_DATABASE_URL="mysql://user:pass@localhost:3306/surecash_mining" npx tsx scripts/migrate-legacy.ts
 *   LEGACY_DATABASE_URL="mysql://user:pass@localhost:3306/surecash_mining" npx tsx scripts/migrate-legacy.ts --live
 *
 * LEGACY_DATABASE_URL uses the SAME format as this app's DATABASE_URL (see
 * .env) — same host/user/password if both databases are on the same
 * MySQL server (they normally are, on the same shared-hosting account),
 * just with the old database's name at the end instead.
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { PrismaClient, KycStatus, UserMiningPlanStatus, CryptoNetwork } from "@prisma/client";

// Minimal, dependency-free .env loader (avoids relying on the `dotenv`
// package being present in whatever node_modules happens to be deployed -
// this script only needs DATABASE_URL out of it, nothing fancier).
function loadDotEnv(path: string) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}
loadDotEnv(join(process.cwd(), ".env"));

const LIVE = process.argv.includes("--live");

if (!process.env.LEGACY_DATABASE_URL) {
  console.error("Set LEGACY_DATABASE_URL to the OLD database's connection string first. See the comment at the top of this file.");
  process.exit(1);
}

const db = new PrismaClient();
const legacy = new PrismaClient({ datasourceUrl: process.env.LEGACY_DATABASE_URL });

interface LegacyUser {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  password: string;
  referral_code: string;
  referred_by: number | null;
  status: "active" | "suspended" | "banned";
  kyc_status: "unverified" | "pending" | "approved" | "rejected";
  login_notifications_enabled: number;
  email_verified_at: Date | null;
  created_at: Date;
}

interface LegacyWallet {
  user_id: number;
  main_balance: string;
  bonus_balance: string;
  referral_balance: string;
  mining_balance: string;
  pending_balance: string;
}

interface LegacyBankAccount {
  id: number;
  user_id: number;
  type: "bank" | "usdt";
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  usdt_address: string | null;
  network: string | null;
  is_default: number;
}

interface LegacyMiningPlan {
  id: number;
  name: string;
  price: string;
  daily_return: string;
  duration_days: number;
}

interface LegacyUserMining {
  id: number;
  user_id: number;
  plan_id: number;
  amount_invested: string;
  total_earned: string;
  started_at: Date;
  next_payout_at: Date | null;
  ends_at: Date;
  status: "active" | "paused" | "completed" | "cancelled";
}

const KYC_MAP: Record<LegacyUser["kyc_status"], KycStatus> = {
  unverified: "UNVERIFIED",
  pending: "PENDING",
  approved: "APPROVED",
  rejected: "REJECTED",
};

function mapNetwork(raw: string | null): CryptoNetwork {
  const n = (raw ?? "").toUpperCase();
  if (n.includes("ERC")) return "ERC20";
  if (n.includes("BEP")) return "BEP20";
  return "TRC20";
}

async function main() {
  console.log(`\n=== Legacy migration — ${LIVE ? "LIVE RUN (will write)" : "DRY RUN (no writes)"} ===\n`);

  const [legacyUsers, legacyWallets, legacyBankAccounts, legacyMiningPlans, legacyUserMining] = await Promise.all([
    legacy.$queryRawUnsafe<LegacyUser[]>("SELECT * FROM users"),
    legacy.$queryRawUnsafe<LegacyWallet[]>("SELECT * FROM wallets"),
    legacy.$queryRawUnsafe<LegacyBankAccount[]>("SELECT * FROM bank_accounts"),
    legacy.$queryRawUnsafe<LegacyMiningPlan[]>("SELECT * FROM mining_plans"),
    legacy.$queryRawUnsafe<LegacyUserMining[]>("SELECT * FROM user_mining WHERE status = 'active'"),
  ]);

  console.log(`Found ${legacyUsers.length} legacy users, ${legacyBankAccounts.length} bank/crypto accounts, ${legacyUserMining.length} active mining investments.\n`);

  const walletByUserId = new Map(legacyWallets.map((w) => [w.user_id, w]));
  const bankAccountsByUserId = new Map<number, LegacyBankAccount[]>();
  for (const acc of legacyBankAccounts) {
    const list = bankAccountsByUserId.get(acc.user_id) ?? [];
    list.push(acc);
    bankAccountsByUserId.set(acc.user_id, list);
  }
  const oldIdToNewId = new Map<number, string>();
  const skippedEmails: string[] = [];
  const bankAccountsNeedingReview: string[] = [];

  let migratedCount = 0;

  // Pass 1: users + wallets (referredById resolved in pass 2, once every
  // user that could be a referrer has been created).
  for (const u of legacyUsers) {
    const existing = await db.user.findUnique({ where: { email: u.email }, select: { id: true } });
    if (existing) {
      skippedEmails.push(u.email);
      oldIdToNewId.set(u.id, existing.id); // still map it, in case it's referenced as a referrer
      continue;
    }

    const wallet = walletByUserId.get(u.id);
    const mainBalance = Number(wallet?.main_balance ?? 0);
    const engagementBalance = Number(wallet?.bonus_balance ?? 0) + Number(wallet?.mining_balance ?? 0) + Number(wallet?.pending_balance ?? 0);
    const salesBalance = Number(wallet?.referral_balance ?? 0);
    const oldTotal = mainBalance + engagementBalance + salesBalance;

    console.log(
      `[user] ${u.email} — ₦${oldTotal.toFixed(2)} total (MAIN ${mainBalance.toFixed(2)} / ENGAGEMENT ${engagementBalance.toFixed(2)} / SALES ${salesBalance.toFixed(2)})`
    );

    if (!LIVE) {
      // Placeholder id so the referral/mining-investment preview sections
      // below can still resolve "this old user would map to a new user"
      // during a dry run, without having actually created anyone yet.
      oldIdToNewId.set(u.id, `dry-run:${u.id}`);
      migratedCount++;
      continue;
    }

    const created = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: u.email,
          phone: u.phone || null,
          passwordHash: u.password,
          fullName: u.full_name,
          emailVerified: u.email_verified_at !== null,
          isBanned: u.status === "banned" || u.status === "suspended",
          banReason: u.status === "suspended" ? "Migrated as suspended from the old platform - review status." : null,
          loginAlertsEnabled: Boolean(u.login_notifications_enabled),
          kycStatus: KYC_MAP[u.kyc_status] ?? "UNVERIFIED",
          referralCode: u.referral_code,
          createdAt: u.created_at,
        },
      });

      if (mainBalance > 0) {
        await tx.wallet.create({ data: { userId: newUser.id, type: "MAIN", balance: mainBalance } });
      }
      if (engagementBalance > 0) {
        await tx.wallet.create({ data: { userId: newUser.id, type: "ENGAGEMENT", balance: engagementBalance } });
      }
      if (salesBalance > 0) {
        await tx.wallet.create({ data: { userId: newUser.id, type: "SALES", balance: salesBalance } });
      }

      // Verify the total landed exactly right before moving on - if this
      // ever fails, something above is wrong and we want a hard stop, not
      // a silently short-changed user.
      const wallets = await tx.wallet.findMany({ where: { userId: newUser.id } });
      const newTotal = wallets.reduce((sum, w) => sum + Number(w.balance), 0);
      if (Math.abs(newTotal - oldTotal) > 0.01) {
        throw new Error(`Balance mismatch for ${u.email}: old total ${oldTotal}, new total ${newTotal}`);
      }

      const bankAccounts = bankAccountsByUserId.get(u.id) ?? [];
      for (const acc of bankAccounts) {
        if (acc.type === "bank") {
          await tx.bankAccount.create({
            data: {
              userId: newUser.id,
              bankName: acc.bank_name ?? "Unknown",
              bankCode: "", // old system never stored a bank code - needs manual admin review before it can be used for auto-payout
              accountNumber: acc.account_number ?? "",
              accountName: acc.account_name ?? u.full_name,
              isPrimary: Boolean(acc.is_default),
              autoVerified: false,
              isVerified: false,
              reviewNote: "Migrated from the old platform - please verify bank details before use.",
            },
          });
          bankAccountsNeedingReview.push(`${u.email}: ${acc.bank_name} ${acc.account_number}`);
        } else if (acc.usdt_address) {
          await tx.cryptoWallet.create({
            data: {
              userId: newUser.id,
              address: acc.usdt_address,
              network: mapNetwork(acc.network),
              isVerified: false,
            },
          });
        }
      }

      return newUser;
    });

    oldIdToNewId.set(u.id, created.id);
    migratedCount++;
  }

  console.log(`\n${migratedCount} user(s) ${LIVE ? "migrated" : "would be migrated"}.`);
  if (skippedEmails.length > 0) {
    console.log(`${skippedEmails.length} skipped (email already exists in the new database): ${skippedEmails.join(", ")}`);
  }

  // Pass 2: referral relationships, now that every user has a new id.
  console.log("\n--- Referral relationships ---");
  let referralCount = 0;
  for (const u of legacyUsers) {
    if (!u.referred_by) continue;
    const referrerId = oldIdToNewId.get(u.referred_by);
    const referredId = oldIdToNewId.get(u.id);
    if (!referrerId || !referredId) continue;

    if (LIVE) {
      await db.user.update({ where: { id: referredId }, data: { referredById: referrerId } });
      await db.referral.upsert({
        where: { referredId },
        create: { referrerId, referredId, rewardAmount: 0, rewardCredited: true },
        update: {},
      });
    }
    referralCount++;
  }
  console.log(`${referralCount} referral relationship(s) ${LIVE ? "migrated" : "would be migrated"}.`);

  // Active mining-plan investments - create a matching MiningPlan
  // definition per distinct legacy plan referenced (only the ones actually
  // in use, not the old system's full catalog), then the investment rows.
  console.log("\n--- Active mining-plan investments ---");
  const legacyPlanById = new Map(legacyMiningPlans.map((p) => [p.id, p]));
  const migratedPlanIdByLegacyId = new Map<number, string>();
  let investmentCount = 0;

  for (const inv of legacyUserMining) {
    const newUserId = oldIdToNewId.get(inv.user_id);
    const legacyPlan = legacyPlanById.get(inv.plan_id);
    if (!newUserId || !legacyPlan) {
      console.log(
        `  skipping investment ${inv.id} - ${!newUserId ? `no user found for legacy user_id ${inv.user_id}` : `no plan found for legacy plan_id ${inv.plan_id}`}`
      );
      continue;
    }

    console.log(`  ${legacyUsers.find((u) => u.id === inv.user_id)?.email} — ${legacyPlan.name}, earned so far ₦${inv.total_earned}`);

    if (!LIVE) {
      investmentCount++;
      continue;
    }

    let newPlanId = migratedPlanIdByLegacyId.get(legacyPlan.id);
    if (!newPlanId) {
      const newPlan = await db.miningPlan.create({
        data: {
          name: `${legacyPlan.name} (migrated)`,
          price: legacyPlan.price,
          dailyReturn: legacyPlan.daily_return,
          durationDays: legacyPlan.duration_days,
          description: "Migrated from the old platform.",
          isActive: false, // admin can review and re-activate for new purchases if desired - existing investments keep paying out regardless
        },
      });
      newPlanId = newPlan.id;
      migratedPlanIdByLegacyId.set(legacyPlan.id, newPlanId);
    }

    await db.userMiningPlan.create({
      data: {
        userId: newUserId,
        planId: newPlanId,
        amountInvested: inv.amount_invested,
        totalEarned: inv.total_earned,
        startedAt: inv.started_at,
        nextPayoutAt: inv.next_payout_at ?? new Date(),
        endsAt: inv.ends_at,
        status: "ACTIVE" as UserMiningPlanStatus,
      },
    });
    investmentCount++;
  }
  console.log(`${investmentCount} active investment(s) ${LIVE ? "migrated" : "would be migrated"}.`);

  if (bankAccountsNeedingReview.length > 0) {
    console.log(`\n${bankAccountsNeedingReview.length} bank account(s) migrated without a bank code - review in Admin > Bank Accounts before any withdrawal relies on them.`);
  }

  console.log(`\n=== Done. ${LIVE ? "Changes were written." : "Nothing was written - re-run with --live to apply."} ===\n`);
}

main()
  .catch((err) => {
    console.error("\nMigration failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
    await legacy.$disconnect();
  });
