# Chrome Grove - Dance Studio Management System

Chrome Grove is a web application for managing dance studio operations, including class scheduling, student enrollment, attendance tracking, payment processing, and membership management.

## Features

- Multi-role user system: Students, Staff, and Management
- Class management: create, schedule, and manage classes
- Student enrollment and attendance tracking
- Payment processing with Stripe
- Credit system for class cancellations and makeups
- Announcements for studio communication

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
CLERK_SECRET_KEY=your-clerk-secret-key
```

### Frontend (.env.local)

```
NEXT_PUBLIC_API_URL=http://127.0.0.1:5000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
```

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

Generative AI tools were utilized during the development of this project as an aid to assist in specific technical areas, including:

- Ensuring adherence to GRASP (General Responsibility Assignment Software Patterns) principles in code structure and design decisions.
- Providing guidance and suggestions for CSS styling and user interface improvements.
- Assisting in revising project documentation to ensure technical accuracy and clarity.
