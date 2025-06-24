# Chrome Grove

This repository contains the full-stack Chrome Grove application, including both the frontend (Next.js) and backend (Flask) components.

## Project Overview

Chrome Grove is a web application featuring a modern frontend built with Next.js and Tailwind CSS, and a backend API developed with Flask and SQLAlchemy. User authentication is managed via Clerk.

---

## Prerequisites

- [Node.js](https://nodejs.org/) (version 16 or higher recommended)
- [Python 3.9+](https://www.python.org/downloads/)
- npm (comes with Node.js)

---

## Setup Instructions

### 1. Backend Setup

1. Navigate to the backend directory:
   ```sh
   cd backend
   ```
2. (Optional) Create and activate a virtual environment:
   ```sh
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```sh
   pip install -r requirements.txt
   # or, if requirements.txt is not present:
   pip install Flask Flask-SQLAlchemy Flask-Cors
   ```
4. Run the backend server:
   ```sh
   flask --app app run
   ```
   The backend will be available at `http://127.0.0.1:5000`.

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```sh
   cd frontend
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Configure environment variables:
   - Create a file named `.env.local` in the `frontend` directory and add:
     ```env
     NEXT_PUBLIC_API_URL=http://127.0.0.1:5000
     NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key-here
     ```
4. Run the frontend development server:
   ```sh
   npm run dev
   ```
   The frontend will be available at [http://localhost:3000](http://localhost:3000).

---

## Additional Notes

- The homepage includes navigation links for user sign in and sign up.
- For further customization or troubleshooting, refer to the official documentation for [Next.js](https://nextjs.org/docs), [Tailwind CSS](https://tailwindcss.com/docs), and [Flask](https://flask.palletsprojects.com/).
