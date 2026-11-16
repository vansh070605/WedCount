import type { Metadata } from "next";
import { LegalPage } from "@/app/ui/brand";

export const metadata: Metadata = { title: "Privacy policy · WedCount" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated="16 November 2026">
      <p>
        WedCount helps wedding planners collect RSVPs and estimate how many guests will attend each function. This page explains
        what we store, why, who can see it, and how to remove it. We collect only what the product needs to work.
      </p>

      <h2>Who this covers</h2>
      <ul>
        <li>
          <strong>Planners</strong>: people who create a WedCount account to manage a wedding.
        </li>
        <li>
          <strong>Guests</strong>: people a planner adds to a guest list and who receive a personal invite link.
        </li>
      </ul>
      <p>
        For guest data, the planner decides whom to invite and why. WedCount processes that data on the planner&apos;s behalf
        and only to run the RSVP for that wedding.
      </p>

      <h2>What we store</h2>
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Whose</th>
            <th>Why</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Name and email address</td>
            <td>Planner</td>
            <td>To create the account and log in</td>
          </tr>
          <tr>
            <td>Password, stored only as a one-way scrypt hash</td>
            <td>Planner</td>
            <td>To check the password at login. We cannot read it</td>
          </tr>
          <tr>
            <td>Wedding name, city, functions, dates and venues</td>
            <td>Planner</td>
            <td>To show guests what they are invited to</td>
          </tr>
          <tr>
            <td>Name, phone number, side and relation</td>
            <td>Guest, entered by the planner</td>
            <td>To build the invite link and the WhatsApp message, and to estimate turnout</td>
          </tr>
          <tr>
            <td>RSVP answers: attending or not, party size, veg and non-veg counts, arrival time</td>
            <td>Guest</td>
            <td>To give the planner and caterer a headcount</td>
          </tr>
          <tr>
            <td>When an invite or reminder was opened in WhatsApp by the planner</td>
            <td>Planner</td>
            <td>To show who still needs an invite or a reminder</td>
          </tr>
        </tbody>
      </table>

      <h2>What we do not do</h2>
      <ul>
        <li>We do not send messages ourselves. Invites are sent by the planner from their own WhatsApp.</li>
        <li>We do not sell or share data with advertisers, and we do not use advertising or tracking cookies.</li>
        <li>We do not use guest data for anything other than the wedding it was collected for.</li>
      </ul>

      <h2>Cookies</h2>
      <p>
        We set one cookie, <code>wc_session</code>, when a planner logs in. It keeps them logged in for up to 30 days and is
        required for the service to work. Guests get no cookies.
      </p>

      <h2>Who can see what</h2>
      <ul>
        <li>A planner sees only the weddings they created and the guests and answers inside them.</li>
        <li>A guest sees only their own invite, through a private link with a random 128-bit code.</li>
        <li>
          Our hosting and database providers (Vercel and Neon) store the data on our behalf and cannot use it for their own
          purposes.
        </li>
      </ul>

      <h2>Security</h2>
      <p>
        Data is sent over HTTPS. Passwords are hashed with scrypt, sessions are stored as hashes, and repeated wrong passwords
        pause logins for 15 minutes. Every request is checked so that one planner can never read another planner&apos;s data.
      </p>

      <h2>How long we keep it</h2>
      <p>
        Data stays until it is deleted. Deleting a guest removes their answers. Deleting a function removes its
        answers. Expired login sessions are removed automatically.
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask to see, correct or delete your data. Guests should first ask the planner who invited them, who can edit or
        delete their entry at any time. Planners can edit or delete guests, functions and whole weddings in the app, and delete their account (with everything in it) from the Account page.
      </p>

      <h2>Changes</h2>
      <p>If we change how we use data, we will update this page and the date at the top.</p>
    </LegalPage>
  );
}
