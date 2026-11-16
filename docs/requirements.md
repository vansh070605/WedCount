# Requirements

| | |
|---|---|
| Purpose | What WedCount must do, for whom, and under which constraints |
| Read when | Before adding a feature or changing behaviour users can see |

## The problem

Indian weddings run over several functions (Haldi, Mehendi, Sangeet, Wedding, Reception), each with a different crowd of a few dozen to several hundred people. Guest counts are still collected on WhatsApp and estimated by feel. Nearly everyone says they will come, a large share do not, and the caterer is paid for the difference. A typical case: 400 invited, 400 said yes, 280 came, 120 plates wasted.

## Users

| User | Goal | Context |
|---|---|---|
| **Planner** (wedding planner or a family member running the guest list) | One reliable number per function for the caterer, days before the event | Laptop or phone, manages one or several weddings, already coordinates on WhatsApp |
| **Guest** | Tell the family whether they are coming, with how many people | Opens a link from WhatsApp on any phone, often a slow one, never wants to install or sign up |
| **Caterer** (indirect) | Plates per function, split veg and non-veg | Receives a CSV and opens it in Excel |

## Functional requirements

### Planner

- **R1** Create an account with email and password, log in and out.
- **R2** Create weddings with a name, city and RSVP deadline. See only their own weddings.
- **R3** Add, edit and delete functions (name, date and time, venue).
- **R4** Add, edit and delete guests (name, phone, side, relation), one at a time or by CSV import.
- **R5** Send each guest a personal invite through WhatsApp from the planner's own number, with one tap.
- **R6** See live counts per function: Coming, Maybe, Can't come, No reply, people, veg and non-veg.
- **R7** See an expected turnout per function with a likely range, not only the sum of "Coming".
- **R8** See who is due a reminder and send it in one tap, naming only the functions still unanswered.
- **R9** Download a caterer CSV for a wedding.
- **R10** Record how many people actually came, so future predictions calibrate.

### Guest

- **R11** Open a private link with no login and no app.
- **R12** Answer Coming, Maybe or Can't come for each function separately, with veg and non-veg counts and an arrival time.
- **R13** Change the answer until the RSVP deadline. After it, see the answer read only.

## Non-functional requirements

| Id | Requirement | How it is met today |
|---|---|---|
| N1 | **Privacy.** A guest sees only their own invite. A planner sees only their own weddings. | 128-bit random invite tokens; every query scoped by planner (`lib/owned.ts`), tested in `lib/owned.dbtest.ts` |
| N2 | **Security.** Credentials and sessions survive a database leak. | scrypt password hashes, only `sha256(session token)` stored, login lockout after 5 failures |
| N3 | **Works on slow phones.** Forms submit before JavaScript loads. | Server actions with a plain form fallback |
| N4 | **Correct under concurrency.** Two saves at once never corrupt counts. | Transactions, unique constraints, duplicate-key errors turned into clear messages |
| N5 | **Indian time.** Dates and deadlines are in IST. | `Asia/Kolkata` everywhere; a deadline means the end of that day in India |
| N6 | **Accessible.** Keyboard and screen-reader usable, readable contrast, reduced motion respected. | Semantic HTML, visible focus, light theme tokens with AA contrast, motion off under `prefers-reduced-motion` |
| N7 | **Cheap to run.** No paid messaging API needed. | WhatsApp `wa.me` deep links; Vercel and Neon free tiers |
| N8 | **Honest numbers.** Predictions show their assumptions and their error. | Show rates documented as assumptions; predicted vs actual shown per recorded function |

## Out of scope (for now)

- Sending WhatsApp messages automatically (needs the paid Cloud API and Meta approval).
- Password reset by email (needs an email provider).
- Teams with several planners per wedding.
- Seating, budgets, vendors, payments.
- Languages other than English on the guest page.

## Acceptance

A release is acceptable when R1 to R13 work end to end on a phone-sized screen and a desktop, all checks in the [Playbook](playbook.md) pass, and no hard rule in the [Agent guide](agents.md) is broken.
