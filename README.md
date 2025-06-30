# Chrome Grove - Dance Studio Management System

A modern, full-stack web application for managing dance studio operations including class scheduling, student enrollment, attendance tracking, and payment processing.

## 🎯 What is Chrome Grove?

Chrome Grove is a comprehensive dance studio management platform that helps studio owners and staff manage their business operations efficiently. The system handles everything from class scheduling and student registration to attendance tracking and payment processing.

### Key Features

- **Multi-role User System**: Students, Staff, and Management roles with different permissions
- **Class Management**: Create, schedule, and manage dance classes
- **Student Enrollment**: Easy registration and enrollment system
- **Attendance Tracking**: Monitor student attendance for classes
- **Payment Processing**: Integrated payment system with Stripe
- **Credit System**: Flexible credit-based payment options
- **Announcements**: Communication system for studio updates
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🏗️ Architecture Overview

### Frontend (Next.js + TypeScript)

- **Framework**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS for modern, responsive design
- **Authentication**: Clerk for secure user authentication
- **State Management**: React hooks and context
- **UI Components**: Custom components with modern design patterns

### Backend (Flask + SQLAlchemy)

- **Framework**: Flask with Python
- **Database**: SQLite with SQLAlchemy ORM
- **API**: RESTful API endpoints
- **Authentication**: JWT tokens with Clerk integration
- **Payment Processing**: Stripe integration

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 16 or higher) - [Download here](https://nodejs.org/)
- **Python 3.9+** - [Download here](https://www.python.org/downloads/)
- **Git** - [Download here](https://git-scm.com/)

### Installation Steps

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd projectX
```

#### 2. Backend Setup

Navigate to the backend directory and set up the Python environment:

```bash
cd backend

# Create a virtual environment (recommended)
python3 -m venv venv

# Activate the virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Initialize the database
python create_db.py

# Seed the database with initial data (optional)
python seed_data.py

# Start the backend server
flask --app app run
```

The backend API will be running at `http://127.0.0.1:5000`

#### 3. Frontend Setup

In a new terminal, navigate to the frontend directory:

```bash
cd frontend

# Install Node.js dependencies
npm install

# Create environment configuration
cp .env.example .env.local
```

Edit `.env.local` and add your configuration:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:5000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key-here
```

Start the frontend development server:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## 👥 User Roles & Permissions

### Student

- View available classes and schedules
- Enroll in classes
- View personal attendance history
- Manage payment information
- View announcements

### Staff

- View class schedules
- Mark student attendance
- View student information
- Access staff-specific features

### Management

- Full system access
- Create and manage classes
- Manage student enrollments
- Process payments
- Create announcements
- View analytics and reports

## 📁 Project Structure

```
projectX/
├── backend/                 # Flask backend application
│   ├── app.py              # Main Flask application
│   ├── models.py           # Database models
│   ├── controllers/        # API route controllers
│   ├── services/           # Business logic services
│   ├── repositories/       # Data access layer
│   ├── migrations/         # Database migrations
│   └── instance/           # Database files
├── frontend/               # Next.js frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Next.js pages
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Utility functions
│   │   └── styles/         # Global styles
│   ├── public/             # Static assets
│   └── package.json        # Node.js dependencies
└── README.md               # This file
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)

```env
FLASK_ENV=development
DATABASE_URL=sqlite:///instance/db.sqlite3
STRIPE_SECRET_KEY=your-stripe-secret-key
CLERK_SECRET_KEY=your-clerk-secret-key
```

#### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:5000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
```

### Database Setup

The application uses SQLite by default. To set up the database:

```bash
cd backend
python create_db.py
python seed_data.py  # Optional: adds sample data
```

## 🛠️ Development

### Running in Development Mode

1. **Backend**: `flask --app app run` (runs on port 5000)
2. **Frontend**: `npm run dev` (runs on port 3000)

### Available Scripts

#### Frontend

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

#### Backend

```bash
flask --app app run  # Start development server
python create_db.py  # Initialize database
python seed_data.py  # Seed with sample data
```

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/signin` - User sign in
- `POST /api/auth/signup` - User registration

### Classes

- `GET /api/classes` - Get all classes
- `POST /api/classes` - Create new class
- `PUT /api/classes/:id` - Update class
- `DELETE /api/classes/:id` - Delete class

### Users

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user

### Payments

- `POST /api/payments` - Process payment
- `GET /api/payments` - Get payment history

## 🧪 Testing

### Frontend Testing

```bash
cd frontend
npm test
```

### Backend Testing

```bash
cd backend
python -m pytest
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Note**: This project is still a work in progress. Come back later for future contributions and updates.

**Built with ❤️ for dance studios everywhere**
