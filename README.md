# Chrome Grove - Dance Studio Management System

Chrome Grove is a full-stack web application built as a part of my Object Oriented Analysis & Design project, which is also designed to support a nonprofit dance studio that's currently in the works—a project led by friends whose mission I truly believe in. The app helps lay the foundation for running the studio smoothly, from class scheduling and student sign-ups to tracking attendance, handling payments, and managing memberships. The goal is to make sure the tech side is taken care of, so the studio can stay focused on building an inclusive space for movement and community.

## Features

- Rose-based access for Students, Staff, and Management
- Tools for creating, scheduling, and managing classes
- Easy student sign-ups (through Clerk) and attendance tracking
- Secure payment processing with Stripe
- Credit system for handling class cancellations and makeups
- Announcement board for studio-wide updates and communication

## Technology Stack

- **Frontend:** Next.js (TypeScript), Tailwind CSS, Clerk authentication
- **Backend:** Flask (Python), SQLAlchemy ORM, SQLite database, Stripe integration

## Getting Started

### Prerequisites

- Node.js (16+)
- Python 3.9+
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/shane-jeon/chromegrove_app
   cd projectX
   ```

2. **Backend setup**

   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python create_db.py
   python seed_data.py  # optional
   flask --app app run
   ```

   The backend runs at http://127.0.0.1:5000

3. **Frontend setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local
   # Edit .env.local as needed
   npm run dev
   ```
   The frontend runs at http://localhost:3000

## Project Structure

```
projectX/
├── backend/
│   ├── app.py
│   ├── models.py
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── migrations/
│   ├── migration_files/
│   ├── fix_files/
│   ├── tests/
│   └── instance/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── styles/
│   ├── public/
│   └── package.json
└── README.md
```

## User Roles

- **Student:** Enroll in classes, view attendance, receive announcements
- **Staff:** View schedules, mark attendance
- **Management:** Manage classes, enrollments, payments, and announcements

## Environment Variables

### Backend (.env)

```
FLASK_ENV=development
DATABASE_URL=sqlite:///instance/db.sqlite3
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
CLERK_SECRET_KEY=your-clerk-secret-key
```

### Frontend (.env.local)

```
NEXT_PUBLIC_API_URL=http://127.0.0.1:5000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
```

## Stripe Setup & Testing

### Initial Stripe Setup

1. **Create a Stripe Account**

   - Go to [stripe.com](https://stripe.com) and create an account
   - Make sure you're in **Test Mode** (toggle in the dashboard)

2. **Get Your API Keys**

   - Go to **Developers → API keys** in your Stripe Dashboard
   - Copy your **Publishable key** (starts with `pk_test_`)
   - Copy your **Secret key** (starts with `sk_test_`)
   - Add the secret key to your backend `.env` file

3. **Install Stripe CLI**

   ```bash
   # macOS (using Homebrew)
   brew install stripe/stripe-cli/stripe

   # Or download from: https://github.com/stripe/stripe-cli/releases
   ```

### Setting Up Webhooks for Local Development

1. **Login to Stripe CLI**

   ```bash
   stripe login
   ```

   This will open your browser to authenticate with your Stripe account.

2. **Start Webhook Forwarding**

   ```bash
   stripe listen --forward-to localhost:5000/webhook/stripe
   ```

   You should see output like:

   ```
   > Ready! Your webhook signing secret is whsec_1234567890abcdef...
   ```

   **Copy this webhook secret** and add it to your backend `.env` file as `STRIPE_WEBHOOK_SECRET`.

3. **Keep the webhook listener running** in a separate terminal while testing.

### Testing Stripe Integration

1. **Test Webhook Events**
   In a new terminal, you can trigger test events:

   ```bash
   # Test a successful checkout session
   stripe trigger checkout.session.completed

   # Test a failed payment
   stripe trigger payment_intent.payment_failed

   # Test other events as needed
   stripe trigger invoice.payment_succeeded
   ```

2. **Monitor Webhook Events**
   The `stripe listen` command will show you:
   - Incoming webhook events
   - Success/failure status
   - Request/response details

### Troubleshooting Stripe Issues

1. **API Key Expired Error**

   ```
   Error while authenticating with Stripe: Authorization failed, status=401
   ```

   **Solution**: Get a new API key from Stripe Dashboard → Developers → API keys

2. **Webhook Not Receiving Events**

   - Make sure `stripe listen` is running
   - Check that your backend is running on port 5000
   - Verify the webhook endpoint URL is correct

3. **Webhook Secret Issues**
   - If you get a new webhook secret, update your `.env` file
   - Restart your Flask backend after changing environment variables

### Production Webhook Setup

For production, you'll need to:

1. **Create a Webhook Endpoint** in Stripe Dashboard

   - Go to **Developers → Webhooks**
   - Click **"Add endpoint"**
   - Set URL to your production domain: `https://yourdomain.com/webhook/stripe`
   - Select events: `checkout.session.completed`
   - Copy the signing secret for production

2. **Update Environment Variables**
   - Use production API keys (`sk_live_` instead of `sk_test_`)
   - Use the production webhook secret

### Common Stripe CLI Commands

```bash
# Login to Stripe
stripe login

# Listen for webhooks (development)
stripe listen --forward-to localhost:5000/webhook/stripe

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed

# View webhook events
stripe events list

# Get help
stripe help
```

### Stripe Test Cards

Use these test card numbers for testing payments:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

Any future expiry date and any 3-digit CVC will work.

## Testing

- **Frontend:**
  ```bash
  cd frontend
  npm test
  ```
- **Backend:**
  ```bash
  cd backend
  python -m pytest
  ```

## Use of Generative AI

I used generative AI as a supportive tool throughout the project--mainly to get quick feedback or second opinions on certain tasks, like:

- Double-checking that my code structure followed GRASP principles
- Getting styling tips and UI suggestions to improve the frontend experience
- Helping refine documentation to make sure everything was clear and technically accurate

All use cases (brief and full dressed) and Architecture, UML, & Sequence Diagrams were developed by myself.

## API Documentation

The backend serves a RESTful API handling everything from users and classes to payments and memberships. Endpoints are grouped under /api/, with the server running on port 5000 by default.

| Endpoint                                | Method | Description                                 |
| --------------------------------------- | ------ | ------------------------------------------- |
| `/api/ping`                             | GET    | Health check (returns `pong`)               |
| `/api/users/create`                     | POST   | Create a new user                           |
| `/api/users/by-clerk-id`                | GET    | Get user by Clerk ID                        |
| `/api/users`                            | GET    | Get all users                               |
| `/api/instructors/search`               | GET    | Search for instructors                      |
| `/api/studio-classes/create`            | POST   | Create a new class instance                 |
| `/api/studio-classes/list`              | GET    | List all upcoming class instances           |
| `/api/studio-classes/templates`         | GET    | List all class templates                    |
| `/api/studio-classes/book`              | POST   | Book a class as a student                   |
| `/api/studio-classes/book-staff`        | POST   | Book a class as a staff member              |
| `/api/studio-classes/check-eligibility` | POST   | Check if a user is eligible to book a class |
| `/api/students/enrolled-classes`        | GET    | Get classes a student is enrolled in        |
| `/api/students/cancel-enrollment`       | POST   | Cancel a student's enrollment               |
| `/api/staff/cancel-booking`             | POST   | Cancel a staff member's booking             |
| `/api/studio-classes/<id>/staff`        | GET    | Get staff assigned to a class               |
| `/api/studio-classes/<id>/staff`        | POST   | Assign staff to a class                     |
| `/api/studio-classes/<id>/staff/<id>`   | DELETE | Remove staff from a class                   |
| `/api/studio-classes/<id>/instructor`   | PUT    | Change the instructor for a class           |
| `/api/studio-classes/cancel`            | POST   | Cancel a class instance                     |
| `/api/studio-classes/book-with-credit`  | POST   | Book a class using credits                  |
| `/api/staff/assigned-classes`           | GET    | Get classes assigned to a staff member      |
| `/api/staff/booked-classes`             | GET    | Get classes booked by a staff member        |
| `/api/attendance/mark`                  | POST   | Mark attendance for a student               |
| `/api/attendance/roster/<instance_id>`  | GET    | Get the roster for a class instance         |
| `/api/sliding-scale-options`            | GET    | Get sliding scale payment options           |
| `/api/sliding-scale-options/all`        | GET    | Get all sliding scale options               |
| `/api/sliding-scale-options`            | POST   | Create a new sliding scale option           |
| `/api/membership/status`                | POST   | Get a user's membership status              |
| `/api/membership/create`                | POST   | Create a new membership                     |
| `/api/membership/cancel`                | POST   | Cancel a membership                         |
| `/api/membership/options`               | GET    | Get available membership options            |
| `/api/announcements`                    | GET    | Get announcements for bulletin boards       |
| `/api/announcements`                    | POST   | Create a new announcement                   |
| `/api/credits/student`                  | GET    | Get a student's available credits           |
| `/api/credits/history`                  | GET    | Get a student's credit usage history        |
| `/api/credits/use`                      | POST   | Use a credit to book a class                |
