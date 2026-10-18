# SmartCare Hospital Portal
### Shri Gajanan Multispeciality Hospital & Research Center

SmartCare Hospital Portal is a modern, responsive, full-stack hospital web application designed for patients, clinical specialists, and hospital administrators. It provides seamless OPD appointment booking with real-time slot-conflict protection, complete reschedule and cancellation workflows, an official directory of Government Healthcare Schemes (including **Ayushman Bharat PM-JAY** and **Maharashtra MJPJAY**), and a comprehensive hospital administrative back-office.

---

## 🌟 Key Features

### 1. Patient Portal & Booking Engine
- **Multi-Step Booking Wizard**:
  - Step 1: Select Medical Department (Cardiology, Orthopaedics, Neurology, Gynaecology, Paediatrics, Oncology, Nephrology, etc.).
  - Step 2: Select Specialist Consultant with qualifications, experience, rating, and OPD fee.
  - Step 3: Choose Consultation Date with automatic past-date blocking and doctor leave date validation.
  - Step 4: Real-time Slot Picker (validates doctor OPD hours, slot duration, and blocks double-booking).
  - Step 5: Patient Details (Full name, phone, email, reason for visit, first-visit vs follow-up).
  - Step 6: Review & Final Confirmation generating a unique reference number (e.g. `SGH-202610-8492`) and celebration confetti.
- **Reschedule & Cancel Workflows**:
  - Request rescheduling to a new date/slot with automatic audit trail and administrative approval.
  - Slot release upon approved rescheduling or patient cancellation.
- **Patient Dashboard**:
  - View Upcoming, Pending, and Past appointments.
  - View & Print official hospital consultation slips.
  - In-app notification center for booking approvals and status updates.
  - Edit patient profile (Name, phone, email, DOB, gender, address).

### 2. Government Health Schemes Directory
- Dedicated information hub covering verified Central and Maharashtra state healthcare initiatives:
  - **Ayushman Bharat PM-JAY** (₹5,00,000 cashless coverage per family per year).
  - **Mahatma Jyotirao Phule Jan Arogya Yojana (MJPJAY)** (₹5 Lakh cover for yellow/orange ration card holders).
  - **Central Government Health Scheme (CGHS)**.
  - **Employees' State Insurance Scheme (ESIC)**.
  - **Rashtriya Arogya Nidhi (RAN)** (Grant up to ₹15 Lakh for BPL patients).
- For each scheme:
  - Official eligibility criteria and coverage limits.
  - Required documents checklist (Aadhaar, Ration card, Income certificate).
  - Verified hospital empanelment status.
  - Official portal links (`beneficiary.nha.gov.in`, `jeevandayee.gov.in`, etc.) and toll-free helplines.
  - 24/7 Arogya Mitra Helpdesk guidance.

### 3. Administrator Operations Portal (Protected)
- **KPI Metrics Dashboard**:
  - Total Bookings, Pending Action queue, Approved count, Today's OPD schedule, Active Doctors, and Published Schemes.
- **Appointment Management Queue**:
  - Searchable, filterable table by date, doctor, speciality, and status.
  - One-click **Approve** or **Decline** (with rejection reason modal recorded for the patient).
  - Review and process rescheduling requests (approving automatically moves the appointment to the requested date/time).
  - Mark appointments as **Completed**.
- **Doctor Roster Management**:
  - Add new doctors, edit profiles, update consultation fees, adjust slot duration, and toggle availability status (`Available`, `Not Available`, `On Leave`).
- **Government Schemes Management**:
  - Update empanelment status (`Accepted`, `Under Verification`, `Not Empanelled`), update last verified date, and manage listings.
- **Hospital Settings**:
  - Manage 24/7 Emergency hotline, OPD desk numbers, operating hours, slot duration, and cancellation window rules.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite.
- **Styling**: Tailwind CSS with custom healthcare palette (Teal, Sky, Emerald accents).
- **Icons**: Lucide React.
- **Database & Backend**: Supabase (PostgreSQL with Row Level Security and conflict-safe transactions).
- **Architecture**: Dual-mode engine supporting direct Supabase cloud connectivity with graceful, persistent local fallback for offline/demo evaluation.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18 or higher)
- npm or pnpm

### 2. Installation
```bash
# Clone the repository and navigate into the project directory
cd Shri_Gajanan_Hospital

# Install dependencies
npm install
```

### 3. Running Locally
```bash
# Start the Vite development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🗄️ Supabase PostgreSQL Setup & Migrations

To connect your own Supabase project:

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase Dashboard.
3. Open the migration file located at:
   `supabase/migrations/20261019_init_hospital.sql`
4. Copy and execute the SQL script in the Supabase SQL editor. It will:
   - Create all 11 tables (`profiles`, `user_roles`, `specialities`, `doctors`, `doctor_schedules`, `doctor_leave_dates`, `appointments`, `appointment_history`, `health_schemes`, `notifications`, `hospital_settings`).
   - Create safe database functions (`book_appointment_safe`) preventing simultaneous double-booking.
   - Enforce Row Level Security (RLS) policies on all tables.
5. In your project root, copy `.env.example` to `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
6. Restart the development server (`npm run dev`). The portal will automatically detect your Supabase credentials and transition to cloud database mode.

---

## 🔐 Creating the First Administrator Account

1. In Supabase Dashboard, go to **Authentication** -> **Users** -> **Add User** and create an administrator user with email `admin@smartcarehospital.org`.
2. In the **SQL Editor**, grant the administrator role:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE email = 'admin@smartcarehospital.org';
   ```
3. Alternatively, when testing locally, use the top bar **Role Switcher** ("Patient" / "Admin") or click "Admin Demo" in the Sign-In modal to instantly experience the Administrator Portal with pre-loaded data!

---

## 🚢 Production Build & Deployment

### Build for Production
```bash
npm run build
```
The optimized production bundle will be generated in `dist/`.

### Deploying to Vercel
1. Push this repository to GitHub or GitLab.
2. Go to [vercel.com](https://vercel.com) and click **Add New** -> **Project**.
3. Select this repository.
4. In the **Environment Variables** section, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Deploy**.

---

## 🏥 Hospital Information
- **Institution**: SmartCare Hospital - Shri Gajanan Multispeciality Hospital & Research Center
- **Address**: Plot No. 42, Station Road, Near Gajanan Maharaj Mandir, Borivali West, Mumbai, Maharashtra 400092
- **24/7 Emergency Line**: +91 22 2845 9999
- **OPD Consultation Desk**: +91 22 2845 6789
- **Email**: contact@smartcarehospital.org
