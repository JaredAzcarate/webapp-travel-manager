Aquí va el **markdown completo**, ya corregido con:

- Nombres de colecciones/modelos en **inglés**
- Rutas en **inglés**
- **Tailwind CSS** (no CSS Modules)
- **Next.js 16 + Firestore + TypeScript + Ant Design** (ver nota de implementación abajo)
- Buses **reutilizables** entre caravans (sin compartir participantes)

Listo para pegar en un archivo de contexto en Cursor.

---

# ✅ SPEC – Temple Caravan Management System

**Stack (especificación):** Next.js · TypeScript · Firestore · Ant Design · React Query · Tailwind CSS

> **Implementation note (March 2026):** The codebase runs **Next.js 16** with **NextAuth v5 (Credentials)** and Firestore collection **`admin`** for panel users—not Firebase Auth for ADMIN/CHAPEL as described in the sections below. **CHAPEL-scoped sessions and role-based UI are not implemented** in the current app; all logged-in panel users share the same admin experience until that changes. For routes, collections, and models as implemented, see **[current-implementation.md](./current-implementation.md)** (Spanish, technical source of truth).

---

## 📌 Table of Contents

1. [Goal](#goal)
2. [User Roles](#user-roles)
3. [Tech Stack & Architecture](#tech-stack--architecture)
4. [Data Model (Firestore)](#data-model-firestore)
5. [Business Rules](#business-rules)
6. [Core Flows](#core-flows)
7. [Pages & Routes](#pages--routes)
8. [Registration Form Behavior](#registration-form-behavior)
9. [Notifications to Chapels](#notifications-to-chapels)
10. [PDF Export](#pdf-export)
11. [Project Structure](#project-structure)
12. [Final Prompt for Cursor](#final-prompt-for-cursor)

---

## 🎯 Goal

Build a system to manage **caravans (bus trips)** from chapels in the north of Portugal to the LDS Temple in Lisbon.

The system must:

- Open/close a **public registration form** for specific caravans (approx. 6 times per year).
- Allow members to register for a caravan and choose:

  - Their **chapel of departure**.
  - Temple **ordinance** and **time slot**.

- Use **phone number** as the main identifier of the participant for a caravan.
- Automatically assign a **bus** according to the chapel and the defined bus routes.
- Handle:

  - **Payment** (pending / paid / free for newly converted first-timers).
  - **Cancellations** by the user.

- Manage:

  - Caravans, buses, and chapel routes.
  - Chapels and chapel accounts.

- Export the data to **PDF** (full list, pending payments, per bus, per chapel).
- Notify the **chapel account** when a participant indicates they have paid.

There is **no public login**.
Only **ADMIN** and **CHAPEL** users log in to the admin area.

---

## 🧑‍💼 User Roles

### 1. ADMIN

Can:

- Manage all **caravans**, **buses**, **chapels**, and **users**.
- Configure:

  - How many buses a caravan uses.
  - Which buses are associated with each caravan.

- Define **bus routes** (which chapels each bus passes through and in which order).
- Set **bus capacity**.
- See all **registrations** across all caravans.
- Change **payment status** and **participation status** for any registration.
- Export **PDFs** for:

  - Whole caravan.
  - Per bus.
  - Per chapel.
  - Pending payments.

### 2. CHAPEL

A chapel account (one per chapel, or more if needed) with **email + password** login.

Can:

- See only **registrations of its own chapel**.
- See payment and participation status of those registrations.
- Change payment status for participants of its chapel.
- Export PDFs only for its own chapel (and related buses).
- Receive notifications when a participant **marks that they have paid**.

### 3. Public user (member)

Without login, can:

- Register for a caravan.
- Indicate that they **already paid**.
- Indicate that they **will not attend** (cancel their participation).

---

## 🏗 Tech Stack & Architecture

### Frontend

- **Next.js 16** with **App Router** (`app/` directory).
- **TypeScript**.
- **Ant Design** for UI components.
- **Tailwind CSS** for styling (no CSS Modules).

### Backend

- **Panel authentication (implemented):** **NextAuth (Credentials)** with user records in Firestore collection **`admin`** (see [current-implementation.md](./current-implementation.md)).

- **Firebase Auth** (optional / future)

  - The spec originally targeted ADMIN and CHAPEL via Firebase Auth; that split is **not** the current panel login.

- **Firestore**

  - As the main database.

- **Firebase Cloud Functions** (optional)

  - For sending notifications (WhatsApp/email) in the future.
  - For heavy PDF generation if needed.

### Other

- Server-side PDF generation (e.g. `pdfkit` or similar) in API routes or server actions.

---

## 🗄 Data Model (Firestore)

All **collection names and field names are in English**.

### Collections overview

- `chapels`
- `users` (spec / future Firebase Auth users; not wired to panel login today)
- `admin` (**panel users** for NextAuth Credentials in the current app)
- `caravans`
- `buses`
- `busStops`
- `ordinances` (templates: sessions, slots, capacities)
- `registrations`
- `roles`, `dataAccessLogs` (supporting collections in the codebase)

> Buses are **reusable templates**, and can be associated with multiple caravans.
> Registrations always reference **one caravan** and **one bus**, so participants never “carry over” between caravans.

---

### `chapels` collection

```ts
// Collection: chapels
{
  id: string,           // Firestore doc ID
  name: string,         // e.g. "Viana do Castelo"
  whatsappPhone?: string,
  email?: string,
  address?: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

### `users` collection

```ts
// Collection: users
{
  id: string,           // Firestore doc ID (same as Firebase Auth uid is recommended)
  name: string,
  email: string,
  role: "ADMIN" | "CHAPEL",
  chapelId?: string,    // if role === "CHAPEL", link to chapels.id
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

- Only `ADMIN` and `CHAPEL` users exist.

---

### `admin` collection (current panel login)

```ts
// Collection: admin — used by NextAuth Credentials in the implemented app
{
  id: string,
  username: string,
  password: string, // bcrypt hash
  createdAt: Timestamp,
  updatedAt?: Timestamp
}
```

---

### `caravans` collection

```ts
// Collection: caravans
{
  id: string,
  name: string,          // e.g. "Lisbon Temple Trip – March 2026"
  templeName?: string,   // e.g. "Lisbon Portugal Temple"
  departureAt: Timestamp,
  returnAt: Timestamp,
  formOpenAt: Timestamp,
  formCloseAt: Timestamp,
  isActive: boolean,
  busIds: string[],      // references to buses.id (reusable buses)
  ordinanceCapacityLimits?: Record<string, Record<string, number | { M: number; F: number }>>,
  ordinanceCapacityCounts?: Record<string, Record<string, number | { M: number; F: number }>>,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

- **Note:** `busIds` defines which buses are used for this caravan. **`ordinanceCapacityLimits` / `ordinanceCapacityCounts`** are populated when creating a caravan from **`ordinances`** templates in the current implementation.

---

### `buses` collection

```ts
// Collection: buses
{
  id: string,
  name: string,          // e.g. "Bus 1"
  capacity: number,      // max number of ACTIVE registrations per caravan for this bus
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

- Buses are **reusable across caravans**.
- Capacity is applied **per caravan**, by counting registrations per `(caravanId, busId)`.

---

### `busStops` collection

```ts
// Collection: busStops
{
  id: string,
  busId: string,         // references buses.id
  chapelId: string,      // references chapels.id
  order: number,         // route order (1,2,3…)
  pickupTime?: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

- Defines the **route of a bus** (which chapels it passes and in which order).
- The same bus + route can be used for multiple caravans.

---

### `registrations` collection

```ts
// Collection: registrations
{
  id: string,
  caravanId: string,      // references caravans.id
  chapelId: string,       // chapel of departure
  busId: string,          // assigned bus (based on chapel & bus route)

  phone: string,          // main identifier for this caravan
  fullName: string,
  isAdult: boolean,       // true = adult, false = youth
  gender: "M" | "F",
  isOfficiator: boolean,

  legalGuardianName?: string,
  legalGuardianEmail?: string,
  legalGuardianPhone?: string,

  ordinanceType: "BAPTISTRY" | "INITIATORY" | "ENDOWMENT" | "SEALING",
  ordinanceSlot: string,  // e.g. "9:30-10:00"

  isFirstTimeConvert: boolean,
  paymentStatus: "PENDING" | "PAID" | "FREE" | "CANCELLED",
  paymentConfirmedAt?: Timestamp,
  userReportedPaymentAt?: Timestamp,

  participationStatus: "ACTIVE" | "CANCELLED",
  cancellationReason?: string,
  cancelledAt?: Timestamp,

  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Important rules:**

- If `isFirstTimeConvert === true` ⇒

  - `paymentStatus = "FREE"` at creation.

- Phone uniqueness per caravan:

  - Logically: there must not be more than one registration with the same `phone` for the same `caravanId`.

---

## 📏 Business Rules

1. **Phone uniqueness per caravan**

   - A phone number can only register **once per caravan**.

2. **First-time convert (free trip)**

   - The form asks:

     - “É a sua primeira vez no templo como recém-converso?”

   - If “Yes”:

     - `isFirstTimeConvert = true`
     - `paymentStatus = "FREE"`
     - No payment checkbox is shown.
     - The user is **not listed as pending payment**.

3. **Capacity per bus**

   - For a given `(caravanId, busId)`:

     - Count `registrations` with `participationStatus = "ACTIVE"`.
     - If count >= `bus.capacity` → no more registrations for that bus.

   - When a user **cancels**:

     - `participationStatus = "CANCELLED"`
     - Place is freed.

4. **Form availability**

   - Form is only open if:

     - `caravan.isActive === true`
     - Current time between `formOpenAt` and `formCloseAt`
     - At least one bus of `caravan.busIds` has available capacity.

5. **Cancel participation**

   - User can indicate they won’t attend:

     - `participationStatus = "CANCELLED"`
     - `cancelledAt = now()`

   - The registration is kept for history but no longer counted in capacity.

6. **Mark payment as done (public)**

   - On the public “confirm payment” page:

     - When the user clicks “I have already paid”, the system:

       - Sets `userReportedPaymentAt = now()`
       - (Option A): keep `paymentStatus` as `"PENDING"` until a CHAPEL/ADMIN confirms.
       - Triggers a notification to the **chapel**.

7. **CHAPEL role limitations**

   - Can only see registrations with its own `chapelId`.
   - Can change paymentStatus for those registrations.
   - Cannot manage caravans, buses, or other chapels.

---

## 🔄 Core Flows

### 1. Registration Flow

1. User opens `/registration`.
2. Backend finds the **active caravan** with open form and available capacity.
3. User selects their **chapel of departure**.
4. System finds **which bus** passes through that chapel:

   - Look for `busStops` where `busId` in `caravan.busIds` and `chapelId = selected chapel`.
   - Choose the appropriate bus (in order).

5. System checks capacity:

   - Count `registrations` with `caravanId` & `busId` and `participationStatus = "ACTIVE"`.
   - If full → show error (no seats available from that chapel).

6. User fills:

   - Personal info.
   - Youth guardian info (if youth).
   - Temple ordinance + time slot.
   - “First time as newly converted?” (yes/no).

7. If **first time convert = yes**:

   - Automatically set `paymentStatus = "FREE"`.
   - Do not show payment commitment checkbox.

8. If **not first time convert**:

   - Show text about **25 euros** and the bus schedule.
   - Require a checkbox to accept.
   - Set `paymentStatus = "PENDING"`.

9. Create registration document.
10. Show success page (`/registration/success`), with text and instructions.

---

### 2. Public Confirm Payment Flow

1. User opens `/confirm-payment`.
2. Enters their **phone number**.
3. System fetches registrations matching that phone for:

   - The current active caravan, or
   - The most recent caravan (depending on spec).

4. Shows a list:

   - Name, caravan, chapel, ordinance, time, paymentStatus, participationStatus.

5. For each registration with `paymentStatus !== "FREE"` and `participationStatus = "ACTIVE"`:

   - Show “I have already paid” button.

6. On click:

   - Set `userReportedPaymentAt = now()`.
   - (Optional) keep `paymentStatus` as `"PENDING"`.
   - Call `notifyChapelOnPayment()` with that registration.

Also allow:

- “I will not attend”:

  - Sets `participationStatus = "CANCELLED"`.
  - Sets `cancelledAt = now()`.

---

### 3. Admin/Chapel Panel Flow

#### ADMIN

- `/admin/caravans`:

  - See all caravans.
  - Create/edit caravans.
  - Select **which buses (from reusable buses)** are used in each caravan (`busIds`).

- `/admin/caravans/[id]`:

  - Summary tab:

    - Caravan info, dates, form status (open/closed), total registrations.

  - Buses & routes tab:

    - List buses used in this caravan.
    - For each bus:

      - Show route (chapels via `busStops`).
      - Show capacity and current count.

  - Registrations tab:

    - Filter by chapel, bus, ordinance, paymentStatus, participationStatus.
    - Edit `paymentStatus` and `participationStatus`.
    - Export PDFs:

      - All registrations.
      - Only pending payment.
      - Per bus.
      - Per chapel.

#### CHAPEL

- Same admin URL structure but with **role-based filtering**:

  - Sees only:

    - Registrations where `chapelId = chapel.id`.
    - Caravan data relevant to those registrations.

  - Cannot:

    - Create or edit caravans.
    - Create or edit buses or chapels.

- Can:

  - Confirm payment (`paymentStatus` from `"PENDING"` to `"PAID"`).
  - Export PDF of registrations for its own chapel.

---

## 🌐 Pages & Routes

All routes in **English**.

### Public routes

- `/`

  - Show information of the next active caravan (if any).
  - Link to `/registration` if form is open.

- `/registration`

  - Main registration flow (and/or caravan selection).

- `/registration/[caravanId]`

  - Registration for a specific caravan.

- `/registration/success`

  - Thank-you and instructions page.

- `/confirm-payment`

  - Phone-based payment confirmation and cancellation.

- `/privacy-and-policy/*`, `/setup`

  - Privacy / GDPR and optional setup flows (see codebase).

### Protected (panel) routes

Protected by **NextAuth** session; layout under `/admin` redirects unauthenticated users to **`/auth/login`**. Role-based CHAPEL filtering is **target behavior** in this spec, not fully implemented in the current app (see [current-implementation.md](./current-implementation.md)).

- `/auth/login`

  - Username/password login (Credentials); users stored in Firestore **`admin`**.

- `/admin`

  - Dashboard / entry to admin area (as implemented).

- `/admin/caravans`

  - List and management of caravans.

- `/admin/caravans/new`, `/admin/caravans/edit/[id]`

  - Create and edit caravan (dates, name, `busIds`).

- `/admin/caravans/distribution`

  - Operational view: registrations distribution / lists (uses URL params where applicable).

- `/admin/chapels`

  - CRUD of chapels.

- `/admin/managers`

  - Manage **`admin`** users (panel accounts), not `/admin/users`.

- `/admin/buses`

  - CRUD for reusable bus templates (name, capacity) and related **`busStops`**.

- `/admin/ordinances`

  - CRUD for ordinance templates (sessions, slots, capacities).

---

## 📝 Registration Form Behavior

Form UI language can remain in **Portuguese**, but field names and code in English.

### Sections

1. **Personal Information**

   - Nome completo
   - És adulto ou jovem?
   - Número de telefone
   - Sexo (M/F)
   - És oficiante?

2. **Chapel of departure**

   - Select chapel from `chapels` collection.

3. **Legal guardian (youth)**

   - Only shown if “youth” selected.

4. **Temple ordinance**

   - Fields (fixed options):

     - Ordinances:

       - Batistério
       - Iniciatória
       - Investidura
       - Selamento

     - Time slots per ordinance (as provided originally):

       - Iniciatória mulheres – (9:30-10:00; 10:00-10:30; 10:30-11:00; 14:00-14:30; 14:30-15:00; 15:00-15:30; 15:30-16:00)
       - Iniciatória homens – (same slots)
       - Batistério – (9:30-11:00; 11:00-12:30; 14:00-15:30)
       - Investidura – (9:00-10:00; 10:00-11:00; 11:00-12:00; 14:00-15:00; 15:00-16:00; 16:00-17:00)
       - Selamento – (10:00-11:00; 11:00-12:00; 15:00-16:00; 16:00-17:00)

5. **First-time convert question**

   - “É a sua primeira vez no templo como recém-converso?”
   - If YES:

     - `isFirstTimeConvert = true`
     - `paymentStatus = "FREE"`
     - Do **not** show payment agreement text.

6. **Payment agreement (only if NOT first time)**

   - Checkbox with text (in Portuguese):

> "O valor da viagem será de 25 euros e deve ser pago através da papeleta de doações na coluna outros em sua unidade. Ao aceitar este item compromete-se a realizar o pagamento de 25 euros. Ao aceitar este item confirma que está ciente que a inscrição será para o autocarro que sairá da capela de Viana do Castelo às 04:00h e passará pelo centro de estaca às 05:00h, com retorno previsto a sair do Templo às 18:30h."

---

## 📣 Notifications to Chapels

When a user clicks “I have already paid”:

- System loads:

  - The registration
  - Its `chapelId`
  - The chapel document (with whatsappPhone/email)
  - The caravan document for context (name, date)

- Generates message like:

> "O participante {fullName} (telefone {phone}) indicou que efetuou o pagamento para a viagem {caravan.name}."

Implementation:

- Create a helper function: `notifyChapelOnPayment(registrationId: string)` as a **stub**.
- Later can be implemented via:

  - Firebase Cloud Function calling WhatsApp Cloud API or Twilio.
  - SendGrid / nodemailer for email.

---

## 📄 PDF Export

From admin tables, the system must generate PDFs:

- For a **whole caravan**
- For a **specific bus** (within a caravan)
- For a **specific chapel**
- For **pending payments** only

Each row should include at least:

- Full name
- Phone
- Chapel name
- Bus name
- Ordinance + time slot
- Payment status (`PENDING`, `PAID`, `FREE`, `CANCELLED`)
- Participation status (`ACTIVE`, `CANCELLED`)

Implementation notes:

- Use a server-side function (API route or server action).
- Generate PDF via a Node-compatible library (e.g. `pdfkit`).
- Respond with `Content-Type: application/pdf` and trigger download in the browser.

---

## 📁 Project Structure

Recommended structure for Next.js 16 + Firestore + Tailwind + Ant Design:

```bash
/app
  /page.tsx                # Home
  /registration
    /page.tsx
    /success
      /page.tsx
  /confirm-payment
    /page.tsx
  /admin
    /layout.tsx
    /page.tsx              # Dashboard
    /login
      /page.tsx
    /caravans
      /page.tsx
      /[id]
        /page.tsx
    /chapels
      /page.tsx
    /users
      /page.tsx
    /buses
      /page.tsx
/components
  /layout
  /forms
  /tables
  /pdf
  /shared
/firebase
  client.ts                # Firebase client initialization
  admin.ts                 # Admin SDK (if needed)
  auth.ts                  # Auth helpers
  firestore.ts             # Firestore queries/helpers
/lib
  buses.ts                 # bus + busStops helpers
  caravans.ts
  registrations.ts
  notifications.ts         # notifyChapelOnPayment stub
  pdf.ts
  validation.ts
/styles
  globals.css              # Tailwind base + Ant Design reset if needed
  tailwind.config.ts
/types
  models.ts                # TypeScript interfaces for Firestore docs
```

---

## 🤖 Final Prompt for Cursor

Copy-paste this into Cursor as the high-level instruction:

```text
Act as a senior fullstack developer expert in Next.js 16, TypeScript, Firestore, NextAuth, Tailwind CSS and Ant Design.

We are building a complete "Temple Caravan Management System" based on the specification in this Markdown file.

### TECH REQUIREMENTS

- Next.js 16 with App Router.
- TypeScript.
- Tailwind CSS (NO CSS Modules).
- Ant Design as the primary component library.
- Firebase:
  - Firebase Auth for ADMIN and CHAPEL users.
  - Firestore for all data (no SQL).
  - Optional Firebase Cloud Functions for notifications.
- Server-side PDF generation for exports.

### BUSINESS REQUIREMENTS (SHORT SUMMARY)

- Manage LDS temple caravans (bus trips) from chapels in the north of Portugal to the Lisbon Temple.
- There are two authenticated roles: ADMIN and CHAPEL.
- Public users (members) do NOT have accounts; they only:
  - Register for a caravan.
  - Confirm they have paid.
  - Cancel their participation.
- ADMIN:
  - Manages caravans, chapels, users, and reusable buses.
  - Associates buses with caravans.
  - Defines routes for buses via busStops (which chapels each bus passes).
  - Views all registrations and exports PDFs.
- CHAPEL:
  - Has one or more users linked to a `chapelId`.
  - Sees only registrations from its own chapel.
  - Confirms payments and exports its own PDFs.
- Registration:
  - Uses phone number as main identifier per caravan (unique per caravan).
  - Includes personal data, chapel selection, ordinance and time slot.
  - Asks if this is the first time going to the temple as a newly converted member.
    - If yes → trip is FREE, `paymentStatus = "FREE"`.
    - If no → trip costs 25€, show mandatory checkbox with the provided Portuguese text.
- Buses:
  - Stored as reusable templates in the `buses` collection.
  - Each bus has a capacity and a route defined via `busStops`.
  - Caravans reference which buses they use via `caravans.busIds`.
  - Registrations assign a bus based on the selected chapel and the bus routes.
  - Capacity is enforced per (caravan, bus) pair.
- When a user clicks "I have already paid" on the public confirm-payment page:
  - The system sets `userReportedPaymentAt`.
  - The system calls a stub helper `notifyChapelOnPayment()` that will later send WhatsApp or email to the chapel.

### WHAT YOU SHOULD DO NOW

1. Scaffold the Next.js 16 project with Tailwind CSS and Ant Design properly integrated.
2. Configure Firebase (client SDK and, if needed, admin SDK).
3. Implement Firestore data models and TypeScript interfaces matching the specification:
   - chapels
   - users
   - caravans
   - buses
   - busStops
   - registrations
4. Implement **NextAuth** protection for `/admin/**` and (optionally) Firebase Auth + role-based access for CHAPEL users as a future step.
5. Create the public pages:
   - `/` (home)
   - `/registration`, `/registration/[caravanId]`
   - `/registration/success`
   - `/confirm-payment`
   including all form logic, first-time-convert handling, bus assignment and capacity checks.
6. Create the admin area:
   - `/auth/login`
   - `/admin` (dashboard)
   - `/admin/caravans`, `/admin/caravans/distribution`, new/edit caravan routes
   - `/admin/chapels`
   - `/admin/managers` (admin users)
   - `/admin/buses`, `/admin/ordinances`
   with Ant Design tables/forms and Tailwind where needed.
7. Implement filtering and PDF export from the registrations tables (server-side).
8. Implement a `notifyChapelOnPayment()` stub helper, and call it when a user marks that they have paid.
9. Keep all collection names, fields, routes and roles EXACTLY as described in the spec.
```

---

Listo 😊
Con este markdown ya tienes TODO lo desarrollado, nombres en inglés, Tailwind, y buses reutilizables entre caravans para pegar directamente en Cursor.
