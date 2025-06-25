from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from sqlalchemy.exc import IntegrityError


db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    clerk_user_id = db.Column(db.String(128), unique=True, nullable=False)
    email = db.Column(db.String(255))
    name = db.Column(db.String(128))  # New field for user's name
    role = db.Column(db.String(32), nullable=False)  # 'student', 'staff', 'management'
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Discriminator column for inheritance
    discriminator = db.Column('type', db.String(50))
    __mapper_args__ = {'polymorphic_on': discriminator}

    def __repr__(self):
        return f"<User id={self.id} clerk_user_id={self.clerk_user_id} email={self.email} name={self.name} role={self.role}>"

class Student(User):
    __mapper_args__ = {'polymorphic_identity': 'student'}
    membership_status = db.Column(db.String(64), nullable=True)
    classes = db.Column(db.String(255), nullable=True)  # New field for classes (could be a comma-separated list or relationship later)

    def __repr__(self):
        return f"<Student id={self.id} clerk_user_id={self.clerk_user_id} email={self.email} name={self.name} role={self.role} membership_status={self.membership_status} classes={self.classes}>"

class Staff(User):
    __mapper_args__ = {'polymorphic_identity': 'staff'}
    staff_type = db.Column(db.String(64), nullable=True)  # e.g., 'instructor', 'admin', 'management'
    assigned_classes = db.Column(db.String(255), nullable=True)  # New field for assigned classes

    def __repr__(self):
        return f"<Staff id={self.id} clerk_user_id={self.clerk_user_id} email={self.email} name={self.name} role={self.role} staff_type={self.staff_type} assigned_classes={self.assigned_classes}>"

class Management(User):
    __mapper_args__ = {'polymorphic_identity': 'management'}
    classes_managed = db.Column(db.String(255), nullable=True)  # New field for classes managed (could be a comma-separated list or relationship later)

    def __repr__(self):
        return f"<Management id={self.id} clerk_user_id={self.clerk_user_id} email={self.email} name={self.name} role={self.role} classes_managed={self.classes_managed}>"

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

def create_user_in_db(clerk_user_id, email, role, name=None):
    """
    Adds a new User using inheritance.
    For Student: sets membership_status to 'active' by default.
    For Staff: staff_type is None unless role is 'management', then 'management'.
    """
    if role not in ('student', 'staff', 'management'):
        raise ValueError("Invalid role. Must be 'student', 'staff', or 'management'.")

    if role == 'student':
        user = Student(clerk_user_id=clerk_user_id, email=email, name=name, role=role, membership_status='active', classes=None)
    elif role == 'staff':
        user = Staff(clerk_user_id=clerk_user_id, email=email, name=name, role=role, staff_type=None, assigned_classes=None)
    elif role == 'management':
        user = Management(clerk_user_id=clerk_user_id, email=email, name=name, role=role, classes_managed=None)

    db.session.add(user)

    try:
        db.session.commit()
    except IntegrityError as e:
        db.session.rollback()
        raise e

    return user
