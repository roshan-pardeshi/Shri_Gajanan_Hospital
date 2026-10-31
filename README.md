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
- **Backend & API**: Node.js, Express, TypeScript (`tsx`), JWT authentication, bcryptjs password hashing.
- **Database**: Local MySQL 8.0 with InnoDB transaction safety, foreign key constraints, virtual slot keys, and connection pooling (`mysql2`).

---

## 🚀 Getting Started with Local MySQL

### 1. Prerequisites
- Node.js (v18 or higher)
- Local MySQL Server 8.0 installed and running on port 3306

### 2. Configure Environment Variables
Open or create `.env` in the root folder:
```env
# Database Configuration (Local MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=smart_care_hospital

# Server & Auth Configuration
PORT=5000
JWT_SECRET=your_secure_jwt_secret_key_here

# Frontend Configuration
VITE_API_URL=http://localhost:5000/api
```

### 3. Run Database Migrations & Seeds
Run the automated migration runner to create the `smart_care_hospital` database, all required tables, constraints, and initial seed data:
```bash
npm run migrate
```
*(On Windows PowerShell with script restriction: `npm.cmd run migrate`)*

This script automatically verifies:
- `profiles` & `user_roles` (creates default admin & demo patient)
- `specialities` (8 medical departments)
- `doctors` (8 specialist consultants)
- `health_schemes` (Ayushman Bharat, MJPJAY, CGHS, ESIC, RAN)
- `laboratory_tests` & `laboratory_settings` (14 accredited diagnostic tests)
- `hospital_settings` & `notifications`

### 4. Start the Application
To run both the backend API server (port 5000) and the Vite frontend (port 5173) simultaneously:
```bash
npm run dev:all
```
Or run them in separate terminals:
```bash
# Terminal 1: Backend Express API
npm run server

# Terminal 2: Frontend Vite
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔐 Default Credentials (Pre-seeded in MySQL)

| Account Type | Email | Password | Role |
| :--- | :--- | :--- | :--- |
| **Medical Superintendent (Admin)** | `admin@smartcarehospital.org` | `admin123` | `admin` (Strictly verified) |
| **Demo Patient** | `suresh.patil@example.com` | `patient123` | `patient` |

---

## 🚢 Security & Production Deployment Guide

> [!WARNING]
> **Laptop MySQL Database Security Notice**
> Your local MySQL database is intended exclusively for local development on your machine.
> **NEVER expose MySQL port 3306 directly to the internet or port-forward your router.**

### How to Deploy Securely to Production:
1. **Managed Cloud Database**:
   - Provision a secure cloud MySQL instance (e.g., AWS RDS Aurora MySQL, Google Cloud SQL, PlanetScale, or DigitalOcean Managed MySQL).
   - Require SSL/TLS connections (`ssl: { rejectUnauthorized: true }`).
   - Place the database inside a Private Subnet / VPC inaccessible from the public internet.
2. **Backend API Server**:
   - Deploy the Express API to a container platform (e.g., Render, Railway, AWS ECS, or DigitalOcean App Platform).
   - Store `DB_PASSWORD` and `JWT_SECRET` in encrypted platform environment variable vaults, never in source code.
   - Restrict incoming traffic to the backend using a reverse proxy (Nginx or Cloudflare) with rate limiting and CORS restricted to your official hospital domain.
3. **Frontend Application**:
   - Deploy the Vite static build (`npm run build` generates `dist/`) to a global CDN (e.g., Vercel, Cloudflare Pages, Netlify).
   - Point `VITE_API_URL` to your production backend domain (e.g. `https://api.smartcarehospital.org/api`).

---

## 🏥 Hospital Information
- **Institution**: SmartCare Hospital - Shri Gajanan Multispeciality Hospital & Research Center
- **Address**: Plot No. 42, Station Road, Near Gajanan Maharaj Mandir, Borivali West, Mumbai, Maharashtra 400092
- **24/7 Emergency Line**: +91 22 2845 9999
- **OPD Consultation Desk**: +91 22 2845 6789
- **Email**: contact@smartcarehospital.org
