import type { Metadata } from "next";
import { LegalPage } from "@/app/ui/brand";

export const metadata: Metadata = { title: "Terms of service · WedCount" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of service" updated="16 November 2026">
      <p>
        These terms apply when you use WedCount, either as a planner with an account or as a guest answering an invite. By using
        the service you agree to them.
      </p>

      <h2>The service</h2>
      <p>
        WedCount lets planners keep a guest list, send personal invite links through their own WhatsApp, collect answers for
        each function, and see an expected headcount. The service is in beta and is free to use. Features may change.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>Give a real email address and keep your password private.</li>
        <li>You are responsible for what happens under your account.</li>
        <li>One person per account. Do not share logins.</li>
      </ul>

      <h2>Guest data</h2>
      <ul>
        <li>Add only guests you are actually inviting, with details the family has given you.</li>
        <li>Use guest phone numbers only to invite and remind them about the wedding.</li>
        <li>Remove a guest&apos;s details when they ask you to.</li>
      </ul>

      <h2>Acceptable use</h2>
      <p>Do not use WedCount to:</p>
      <ul>
        <li>send messages to people who are not invited, or send bulk promotional messages;</li>
        <li>try to access another planner&apos;s weddings or another guest&apos;s invite;</li>
        <li>overload, probe or disrupt the service, or work around its limits.</li>
      </ul>
      <p>We may suspend accounts that break these rules.</p>

      <h2>Expected headcount</h2>
      <p>
        The expected turnout and its range are estimates based on guests&apos; answers and typical attendance patterns. They are
        not a guarantee. Final catering and venue decisions remain yours.
      </p>

      <h2>WhatsApp</h2>
      <p>
        WedCount opens WhatsApp with a message ready to send; you send it from your own account and must follow WhatsApp&apos;s
        own terms. WedCount is not affiliated with WhatsApp or Meta.
      </p>

      <h2>Availability and liability</h2>
      <p>
        We work to keep WedCount available and your data safe, but the service is provided as it is, without warranties. To the
        extent the law allows, WedCount is not liable for indirect losses, including food or venue costs, arising from use of
        the service.
      </p>

      <h2>Ending use</h2>
      <p>
        You can stop using WedCount at any time. Guests and functions can be deleted in the app; to delete a whole wedding or your account, use the contact below. We may end the service with reasonable
        notice.
      </p>

      <h2>Law</h2>
      <p>These terms are governed by the laws of India.</p>
    </LegalPage>
  );
}
