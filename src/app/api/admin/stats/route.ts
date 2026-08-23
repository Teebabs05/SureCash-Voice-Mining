import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

export async function GET() {
  try {
    await requireAdmin();

    const [
      totalUsers,
      verifiedUsers,
      pendingDeposits,
      pendingWithdrawals,
      openFraudReports,
      totalDepositsApproved,
      totalWithdrawalsPaid,
      voiceRecordingsToday,
      last7DaysSignups,
      bankAccountsNeedingReview,
      pendingTaskProofReview,
      pendingKycReview,
      openSupportTickets,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { emailVerified: true } }),
      prisma.deposit.count({ where: { status: "PENDING" } }),
      prisma.withdrawal.count({ where: { status: "PENDING" } }),
      prisma.fraudReport.count({ where: { status: "OPEN" } }),
      prisma.deposit.aggregate({ where: { status: "APPROVED" }, _sum: { amount: true } }),
      prisma.withdrawal.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
      prisma.voiceRecording.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
      prisma.$queryRaw<{ day: Date; count: bigint }[]>`
        SELECT DATE(\`createdAt\`) as day, COUNT(*) as count
        FROM \`User\`
        WHERE \`createdAt\` > NOW() - INTERVAL 7 DAY
        GROUP BY 1 ORDER BY 1
      `,
      prisma.bankAccount.count({ where: { autoVerified: false, reviewedAt: null } }),
      prisma.userTaskCompletion.count({ where: { status: "PENDING_REVIEW" } }),
      prisma.kycDocument.count({ where: { status: "PENDING" } }),
      prisma.supportTicket.count({ where: { status: "OPEN" } }),
    ]);

    return NextResponse.json({
      totalUsers,
      verifiedUsers,
      pendingDeposits,
      pendingWithdrawals,
      openFraudReports,
      totalDepositsApproved: Number(totalDepositsApproved._sum.amount ?? 0),
      totalWithdrawalsPaid: Number(totalWithdrawalsPaid._sum.amount ?? 0),
      voiceRecordingsToday,
      signupTrend: last7DaysSignups.map((r) => ({ day: r.day, count: Number(r.count) })),
      bankAccountsNeedingReview,
      pendingTaskProofReview,
      pendingKycReview,
      openSupportTickets,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
