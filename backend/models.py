from flask_sqlalchemy import SQLAlchemy
from datetime import datetime


db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    clerk_user_id = db.Column(db.String(128), unique=True, nullable=False)
    email = db.Column(db.String(255))
    role = db.Column(db.String(32), nullable=False)  # 'student', 'staff', 'management'
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<User id={self.id} clerk_user_id={self.clerk_user_id} email={self.email} role={self.role}>"

# --- Subclass tables using joined table inheritance ---

class Student(db.Model):
    __tablename__ = 'students'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    membership_status = db.Column(db.String(64), nullable=False)

    user = db.relationship('User', backref=db.backref('student', uselist=False))

    def __repr__(self):
        return f"<Student user_id={self.user_id} membership_status={self.membership_status}>"

class Staff(db.Model):
    __tablename__ = 'staff'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    staff_type = db.Column(db.String(64), nullable=True)  # e.g., 'instructor', 'admin', 'management'

    user = db.relationship('User', backref=db.backref('staff', uselist=False))

    def __repr__(self):
        return f"<Staff user_id={self.user_id} staff_type={self.staff_type}>"

# --- Option 1: Management as a separate table ---
# Use this if Management has unique fields or logic not shared with Staff.
# class Management(db.Model):
#     __tablename__ = 'management'
#     id = db.Column(db.Integer, primary_key=True)
#     user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
#     # Add management-specific fields here
#
#     user = db.relationship('User', backref=db.backref('management', uselist=False))
#
#     def __repr__(self):
#         return f"<Management user_id={self.user_id}>"

# --- Option 2: Management as a staff_type value ---
# Use this if Management is just a special type of Staff, with no unique fields.
# Example: staff_type = 'management' in Staff table
