from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from sqlalchemy.exc import IntegrityError


db = SQLAlchemy()

# Association table for many-to-many relationship between StudioClass and User (enrolled students)
enrollments = db.Table(
    'enrollments',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('class_id', db.Integer, db.ForeignKey('studio_classes.id'), primary_key=True)
)

# Association table for many-to-many relationship between Staff and StudioClass (assigned classes)
staff_assignments = db.Table(
    'staff_assignments',
    db.Column('staff_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('class_id', db.Integer, db.ForeignKey('studio_classes.id'), primary_key=True)
)

# Association table for many-to-many relationship between Management and StudioClass (managed classes)
management_assignments = db.Table(
    'management_assignments',
    db.Column('management_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('class_id', db.Integer, db.ForeignKey('studio_classes.id'), primary_key=True)
)

# Rename enrollments to student_classes for clarity (keep the old name for migration compatibility)
student_classes = enrollments

class StudioClass(db.Model):
    __tablename__ = 'studio_classes'

    id = db.Column(db.Integer, primary_key=True)
    class_name = db.Column(db.String(128), nullable=False)
    description = db.Column(db.Text, nullable=True)
    start_time = db.Column(db.DateTime, nullable=False)
    duration = db.Column(db.Integer, nullable=False)  # Duration in minutes
    instructor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    instructor = db.relationship('User', foreign_keys=[instructor_id])
    max_capacity = db.Column(db.Integer, nullable=False)
    requirements = db.Column(db.Text, nullable=True)
    recommended_attire = db.Column(db.String(255), nullable=True)
    recurrence_pattern = db.Column(db.String(64), nullable=True)

    enrolled_students = db.relationship(
        'User',
        secondary=student_classes,
        backref=db.backref('enrolled_classes', lazy='dynamic'),
        lazy='dynamic'
    )
    assigned_staff = db.relationship(
        'User',
        secondary=staff_assignments,
        backref=db.backref('assigned_classes', lazy='dynamic'),
        lazy='dynamic'
    )
    managers = db.relationship(
        'User',
        secondary=management_assignments,
        backref=db.backref('classes_managed', lazy='dynamic'),
        lazy='dynamic'
    )

    def __repr__(self):
        return f"<StudioClass id={self.id} class_name={self.class_name} instructor_id={self.instructor_id} start_time={self.start_time}>"

    def add_student(self, student):
        """Add a student to the class if not already enrolled."""
        if student not in self.enrolled_students:
            self.enrolled_students.append(student)
            db.session.commit()

    def remove_student(self, student):
        """Remove a student from the class if enrolled."""
        if student in self.enrolled_students:
            self.enrolled_students.remove(student)
            db.session.commit()

    def get_roster(self):
        """Return a list of enrolled students."""
        return list(self.enrolled_students)

    def get_class_profile(self):
        """Return a dictionary of class details and roster."""
        return {
            'id': self.id,
            'class_name': self.class_name,
            'description': self.description,
            'start_time': self.start_time,
            'duration': self.duration,
            'instructor_id': self.instructor_id,
            'max_capacity': self.max_capacity,
            'requirements': self.requirements,
            'recommended_attire': self.recommended_attire,
            'recurrence_pattern': self.recurrence_pattern,
            'enrolled_students': [s.get_user_profile() for s in self.enrolled_students]
        }

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

    def get_user_id(self):
        return self.id

    def get_user_profile(self):
        return {
            "id": self.id,
            "clerk_user_id": self.clerk_user_id,
            "email": self.email,
            "name": self.name,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    @classmethod
    def create_account(cls, clerk_user_id, email, role, name=None, **kwargs):
        if role not in ('student', 'staff', 'management'):
            raise ValueError("Invalid role. Must be 'student', 'staff', or 'management'.")

        if role == 'student':
            user = Student(clerk_user_id=clerk_user_id, email=email, name=name, role=role, **kwargs)
        elif role == 'staff':
            user = Staff(clerk_user_id=clerk_user_id, email=email, name=name, role=role, **kwargs)
        elif role == 'management':
            user = Management(clerk_user_id=clerk_user_id, email=email, name=name, role=role, **kwargs)
        db.session.add(user)
        try:
            db.session.commit()
        except IntegrityError as e:
            db.session.rollback()
            raise e
        return user

class Membership(db.Model):
    __tablename__ = 'memberships'
    id = db.Column(db.Integer, primary_key=True)
    membership_type = db.Column(db.String(64), nullable=False)  # e.g., 'monthly', 'annual', etc.
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=True)

    def is_active(self):
        from datetime import datetime
        now = datetime.utcnow()
        return self.start_date <= now and (self.end_date is None or self.end_date >= now)

    def get_membership_id(self):
        return self.id

    def get_eligibility_dates(self):
        return {
            'start_date': self.start_date,
            'end_date': self.end_date
        }

class Student(User):
    __mapper_args__ = {'polymorphic_identity': 'student'}
    membership_id = db.Column(db.Integer, db.ForeignKey('memberships.id'), nullable=True)
    membership = db.relationship('Membership', backref='students')

    def __repr__(self):
        return f"<Student id={self.id} clerk_user_id={self.clerk_user_id} email={self.email} name={self.name} role={self.role} membership_id={self.membership_id}>"

    @property
    def has_membership(self):
        return self.membership is not None and self.membership.is_active()

    @property
    def membership_type(self):
        return self.membership.membership_type if self.membership else None

    @property
    def upcoming_classes(self):
        from datetime import datetime
        now = datetime.utcnow()
        return [c for c in self.enrolled_classes if c.start_time > now]

    @property
    def past_classes(self):
        from datetime import datetime
        now = datetime.utcnow()
        return [c for c in self.enrolled_classes if c.start_time <= now]

class Staff(User):
    __mapper_args__ = {'polymorphic_identity': 'staff'}
    staff_type = db.Column(db.String(64), nullable=True)  # e.g., 'instructor', 'admin', 'management'
    # assigned_classes relationship via staff_assignments

    def __repr__(self):
        return f"<Staff id={self.id} clerk_user_id={self.clerk_user_id} email={self.email} name={self.name} role={self.role} staff_type={self.staff_type}>"

class Management(User):
    __mapper_args__ = {'polymorphic_identity': 'management'}
    # classes_managed relationship via management_assignments

    def __repr__(self):
        return f"<Management id={self.id} clerk_user_id={self.clerk_user_id} email={self.email} name={self.name} role={self.role}>"

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

class BulletinBoard(db.Model):
    __tablename__ = 'bulletin_boards'
    id = db.Column(db.Integer, primary_key=True)
    board_type = db.Column(db.String(32), nullable=False)  # 'student' or 'staff'
    announcements = db.relationship('Announcement', backref='bulletin_board', lazy='dynamic')

    def get_announcements(self):
        return self.announcements.order_by(Announcement.date_created.desc()).all()

class Announcement(db.Model):
    __tablename__ = 'announcements'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    body = db.Column(db.Text, nullable=False)
    date_created = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)  # Management user
    board_id = db.Column(db.Integer, db.ForeignKey('bulletin_boards.id'), nullable=False)

    def post_announcement(self):
        db.session.add(self)
        db.session.commit()

    def get_info(self):
        return {
            'id': self.id,
            'title': self.title,
            'body': self.body,
            'date_created': self.date_created,
            'author_id': self.author_id,
            'board_id': self.board_id
        }

class SlidingScaleOption(db.Model):
    __tablename__ = 'sliding_scale_options'
    id = db.Column(db.Integer, primary_key=True)
    tier_name = db.Column(db.String(64), nullable=False)
    price_min = db.Column(db.Float, nullable=False)
    price_max = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text, nullable=True)
    payments = db.relationship('Payment', backref='sliding_scale_option', lazy='dynamic')

    def get_tier_name(self):
        return self.tier_name

    def get_price_min(self):
        return self.price_min

    def get_price_max(self):
        return self.price_max

    def get_description(self):
        return self.description

class Payment(db.Model):
    __tablename__ = 'payments'
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    status = db.Column(db.String(32), nullable=False, default='pending')
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    sliding_scale_option_id = db.Column(db.Integer, db.ForeignKey('sliding_scale_options.id'), nullable=False)

    student = db.relationship('Student', backref='payments')

    def get_payment_id(self):
        return self.id

    def get_payment_info(self):
        return {
            'id': self.id,
            'amount': self.amount,
            'date': self.date,
            'status': self.status,
            'student_id': self.student_id,
            'sliding_scale_option_id': self.sliding_scale_option_id
        }
