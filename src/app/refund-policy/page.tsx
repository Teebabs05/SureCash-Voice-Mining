import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { getSetting } from "@/lib/server/settings";

export const metadata: Metadata = {
  title: "Refund Policy — SureCash Mining",
};

const UPDATED = "August 2026";

export default async function RefundPolicyPage() {
  const companyRcNumber = await getSetting("company_rc_number", "");
  const companyOfficeAddress = await getSetting("company_office_address", "NO. 23, UDOEDEHE STREET, UYO.");

  return (
    <LegalPage
      title="Refund Policy"
      updated={UPDATED}
      intro="This policy explains when funds moved on SureCash Mining can and cannot be refunded."
    >
      <LegalSection title="1. Wallet deposits">
        <p>
          Deposits are credited to your wallet as soon as payment is confirmed and are generally non-refundable once
          successfully credited, since they immediately become spendable/withdrawable wallet balance. Refunds are only
          considered for:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>A duplicate charge for the same deposit.</li>
          <li>A payment that was debited from you but never credited to your wallet (a verified gateway error).</li>
        </ul>
        <p>In both cases, contact Support with your transaction reference within 14 days of the payment.</p>
      </LegalSection>

      <LegalSection title="2. Mining Plan purchases">
        <p>
          Mining Plan buy-ins are final once the plan is activated on your account — daily payouts have already begun accruing
          against that purchase. We only refund a Mining Plan purchase if it was charged in error on our end (e.g. duplicate
          purchase caused by a technical fault) and no payouts have yet been received against it.
        </p>
      </LegalSection>

      <LegalSection title="3. Withdrawals">
        <p>
          If a withdrawal fails after your wallet has already been debited — for example the receiving bank rejects the
          transfer — the amount is returned to your wallet. It is not paid out as cash a second time through a separate
          channel; you can simply request the withdrawal again once your payout details are corrected.
        </p>
      </LegalSection>

      <LegalSection title="4. Earned rewards">
        <p>
          Rewards from Voice AI Tasks, Daily Mining, the Task Center, referrals, and the Lucky Spin are not purchases and are
          therefore not eligible for &quot;refund&quot; — they may, however, be reversed if we determine they were earned
          through fraud, bot activity, or a violation of our{" "}
          <Link href="/terms-and-conditions" className="font-medium text-brand-primary">
            Terms and Conditions
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="5. How to request a refund">
        <p>
          Open a ticket through the{" "}
          <Link href="/support" className="font-medium text-brand-primary">
            Support
          </Link>{" "}
          section of your account with your transaction reference, the amount, and a short description of what happened. We
          review each request individually and will let you know the outcome through the same ticket.
        </p>
      </LegalSection>

      <LegalSection title="6. Processing time">
        <p>
          Approved refunds are credited back to your wallet, or reversed to your original payment method where the gateway
          supports it, typically within 3–7 business days of approval.
        </p>
      </LegalSection>

      <LegalSection title="7. Contact us">
        <p className="text-xs text-foreground/50">
          SureCash Digital Technologies Ltd{companyRcNumber ? ` · RC ${companyRcNumber}` : ""}
          <br />
          {companyOfficeAddress}
        </p>
      </LegalSection>
    </LegalPage>
  );
}
