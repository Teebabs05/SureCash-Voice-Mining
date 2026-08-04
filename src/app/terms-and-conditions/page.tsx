import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { getSetting } from "@/lib/server/settings";

export const metadata: Metadata = {
  title: "Terms and Conditions — SureCash Mining",
};

const UPDATED = "August 2026";

export default async function TermsPage() {
  const companyRcNumber = await getSetting("company_rc_number", "");
  const companyOfficeAddress = await getSetting("company_office_address", "NO. 23, UDOEDEHE STREET, UYO.");

  return (
    <LegalPage
      title="Terms and Conditions"
      updated={UPDATED}
      intro="These Terms and Conditions govern your use of SureCash Mining. By registering for an account, you agree to be bound by them."
    >
      <LegalSection title="1. Eligibility">
        <p>
          You must be at least 18 years old and hold a valid Nigerian bank account or supported USDT wallet to withdraw earnings.
          Each person may hold only one account — duplicate or fraudulently created accounts will be suspended and any balance
          forfeited.
        </p>
      </LegalSection>

      <LegalSection title="2. Your account">
        <p>
          You are responsible for keeping your login credentials secure and for all activity on your account. Notify us
          immediately through Support if you suspect unauthorized access. We may require identity verification (KYC) before
          allowing withdrawals or continued use of certain features.
        </p>
      </LegalSection>

      <LegalSection title="3. Wallets and earnings">
        <p>Earnings are tracked across separate wallets — Main, Engagement, and Sales — funded through:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Voice AI Tasks — reading prompts aloud, validated by automated checks for authenticity.</li>
          <li>Daily Mining — a free daily claim.</li>
          <li>The Task Center and Sponsored Posts — completing tasks or sharing sponsored content.</li>
          <li>The Referral Program — commission earned from people you invite.</li>
          <li>The Lucky Spin, subject to your plan&apos;s daily cap.</li>
        </ul>
        <p>We may adjust reward amounts, daily limits, and eligibility rules at any time to keep the platform sustainable.</p>
      </LegalSection>

      <LegalSection title="4. Mining Plans">
        <p>
          Mining Plans are optional, investment-style purchases with a stated buy-in amount, daily payout, and duration.
          Purchasing a plan is a discretionary decision — payouts accrue daily for the plan&apos;s duration and are not
          guaranteed beyond what is displayed at the time of purchase. Mining Plan purchases are final; see our{" "}
          <Link href="/refund-policy" className="font-medium text-brand-primary">
            Refund Policy
          </Link>{" "}
          for exceptions.
        </p>
      </LegalSection>

      <LegalSection title="5. Deposits and withdrawals">
        <ul className="list-disc space-y-1 pl-5">
          <li>Deposits are processed through our payment partners or, where enabled, manual bank transfer.</li>
          <li>Withdrawals may require KYC verification and go to a verified bank account or USDT wallet.</li>
          <li>Withdrawal fees vary by membership tier and are shown before you confirm a withdrawal.</li>
          <li>Withdrawals may be processed automatically or reviewed manually, and may be delayed or declined if we suspect fraud, a policy violation, or a payout-detail mismatch.</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Prohibited conduct">
        <p>You agree not to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Create multiple accounts or use another person&apos;s identity or payout details.</li>
          <li>Use bots, scripts, replayed audio, or synthesized voices to complete Voice AI Tasks.</li>
          <li>Generate fake referrals or manipulate the Task Center, Sponsored Posts, or Lucky Spin.</li>
          <li>Attempt to interfere with, reverse-engineer, or abuse the platform or its payment systems.</li>
        </ul>
        <p>Violations may result in suspension, forfeiture of the associated balance, and withheld withdrawals.</p>
      </LegalSection>

      <LegalSection title="7. Suspension and termination">
        <p>
          We may suspend or terminate an account that violates these Terms, is linked to fraud, or is required to be closed by
          law. You may stop using the platform at any time; verified, legitimately earned balances remain withdrawable subject
          to standard KYC and processing checks.
        </p>
      </LegalSection>

      <LegalSection title="8. Limitation of liability">
        <p>
          SureCash Mining is provided on an &quot;as is&quot; basis. We are not liable for losses arising from your failure to
          secure your account, incorrect payout details you provide, third-party payment provider outages, or events outside our
          reasonable control.
        </p>
      </LegalSection>

      <LegalSection title="9. Governing law">
        <p>These Terms are governed by the laws of the Federal Republic of Nigeria.</p>
      </LegalSection>

      <LegalSection title="10. Changes to these terms">
        <p>
          We may update these Terms from time to time. Material changes will be reflected by an updated &quot;Last updated&quot;
          date above. Continued use of the platform after a change means you accept the revised Terms.
        </p>
      </LegalSection>

      <LegalSection title="11. Contact us">
        <p>
          Questions about these Terms can be sent through the{" "}
          <Link href="/support" className="font-medium text-brand-primary">
            Support
          </Link>{" "}
          section of your account.
        </p>
        <p className="text-xs text-foreground/50">
          SureCash Digital Technologies Ltd{companyRcNumber ? ` · RC ${companyRcNumber}` : ""}
          <br />
          {companyOfficeAddress}
        </p>
      </LegalSection>
    </LegalPage>
  );
}
