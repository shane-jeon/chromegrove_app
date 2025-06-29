from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from sqlalchemy.exc import IntegrityError


db = SQLAlchemy()

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

    def get_class_profile(self):
        """Return a dictionary of class details."""
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
        }

    def add_staff_member(self, staff_member):
        """Add a staff member to this class."""
        if staff_member not in self.assigned_staff:
            self.assigned_staff.append(staff_member)
            db.session.commit()

    def remove_staff_member(self, staff_member):
        """Remove a staff member from this class."""
        if staff_member in self.assigned_staff:
            self.assigned_staff.remove(staff_member)
            db.session.commit()

    def add_manager(self, manager):
        """Add a manager to this class."""
        if manager not in self.managers:
            self.managers.append(manager)
            db.session.commit()

    def remove_manager(self, manager):
        """Remove a manager from this class."""
        if manager in self.managers:
            self.managers.remove(manager)
            db.session.commit()

    def change_instructor(self, new_instructor_id):
        """Change the instructor for this class."""
        self.instructor_id = new_instructor_id
        db.session.commit()

    def get_assigned_staff_list(self):
        """Return a list of assigned staff members."""
        return list(self.assigned_staff)

    def get_managers_list(self):
        """Return a list of managers for this class."""
        return list(self.managers)

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

    # Relationships - no backrefs to avoid conflicts
    payments = db.relationship('Payment', backref='user', lazy='dynamic')
    class_enrollments = db.relationship('ClassEnrollment', backref='user', lazy='dynamic')

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

    # Relationships - no backrefs to avoid conflicts
    students = db.relationship('Student', backref='membership')

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
        # Get upcoming class instances where student is enrolled
        upcoming_enrollments = self.class_enrollments.filter(
            ClassEnrollment.status == 'enrolled',
            ClassEnrollment.class_instance.has(start_time > now)
        ).all()
        return [enrollment.class_instance for enrollment in upcoming_enrollments]

    @property
    def past_classes(self):
        from datetime import datetime
        now = datetime.utcnow()
        # Get past class instances where student is enrolled
        past_enrollments = self.class_enrollments.filter(
            ClassEnrollment.status == 'enrolled',
            ClassEnrollment.class_instance.has(start_time <= now)
        ).all()
        return [enrollment.class_instance for enrollment in past_enrollments]

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

    # Add relationship to get author information
    author = db.relationship('User', foreign_keys=[author_id])

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
            'author_name': self.author.name if self.author else 'Unknown',
            'author_role': self.author.role if self.author else 'Unknown',
            'board_id': self.board_id
        }

class SlidingScaleOption(db.Model):
    __tablename__ = 'sliding_scale_options'
    id = db.Column(db.Integer, primary_key=True)
    tier_name = db.Column(db.String(64), nullable=False)
    price_min = db.Column(db.Float, nullable=False)
    price_max = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(64), nullable=False)
    stripe_price_id = db.Column(db.String(255), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

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
    instance_id = db.Column(db.String(50), db.ForeignKey('class_instances.instance_id'), nullable=True)
    class_name = db.Column(db.String(255), nullable=True)  # Store class name for reference

    # Relationships - no backrefs to avoid conflicts
    sliding_scale_option = db.relationship('SlidingScaleOption')
    class_instance = db.relationship('ClassInstance', backref='payments')

    def __repr__(self):
        return f"<Payment id={self.id} amount={self.amount} status={self.status} student_id={self.student_id}>"

    def get_payment_id(self):
        return self.id

    def get_payment_info(self):
        return {
            'id': self.id,
            'amount': self.amount,
            'date': self.date,
            'status': self.status,
            'student_id': self.student_id,
            'sliding_scale_option_id': self.sliding_scale_option_id,
            'instance_id': self.instance_id,
            'class_name': self.class_name
        }

class ClassInstance(db.Model):
    __tablename__ = 'class_instances'
    
    instance_id = db.Column(db.String(50), primary_key=True)  # Format: {class_id}_{YYYYMMDDHHMM}
    class_id = db.Column(db.Integer, db.ForeignKey('studio_classes.id'), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    max_capacity = db.Column(db.Integer, nullable=False)
    is_cancelled = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    studio_class = db.relationship('StudioClass', backref='instances')
    enrollments = db.relationship('ClassEnrollment', backref='class_instance', lazy='dynamic')
    
    def __repr__(self):
        return f"<ClassInstance instance_id={self.instance_id} class_id={self.class_id} start_time={self.start_time}>"
    
    @property
    def enrolled_count(self):
        """Get the number of enrolled students for this instance."""
        return self.enrollments.filter_by(status='enrolled').count()
    
    @property
    def is_full(self):
        """Check if this class instance is at full capacity."""
        return self.enrolled_count >= self.max_capacity
    
    def is_student_enrolled(self, student_id):
        """Check if a specific student is enrolled in this instance."""
        return self.enrollments.filter_by(
            student_id=student_id, 
            status='enrolled'
        ).first() is not None
    
    def add_student(self, student_id, payment_id=None):
        """Add a student to this class instance if not already enrolled and not full."""
        if self.is_full:
            raise ValueError("Class instance is at full capacity")
        
        if self.is_student_enrolled(student_id):
            raise ValueError("Student is already enrolled in this class instance")
        
        enrollment = ClassEnrollment(
            student_id=student_id,
            instance_id=self.instance_id,
            payment_id=payment_id,
            status='enrolled'
        )
        db.session.add(enrollment)
        db.session.commit()
        return enrollment
    
    def remove_student(self, student_id):
        """Remove a student from this class instance."""
        enrollment = self.enrollments.filter_by(
            student_id=student_id, 
            status='enrolled'
        ).first()
        
        if enrollment:
            enrollment.status = 'cancelled'
            db.session.commit()
            return True
        return False

class ClassEnrollment(db.Model):
    __tablename__ = 'class_enrollments'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    instance_id = db.Column(db.String(50), db.ForeignKey('class_instances.instance_id'), nullable=False)
    payment_id = db.Column(db.Integer, db.ForeignKey('payments.id'), nullable=True)
    status = db.Column(db.String(32), nullable=False, default='enrolled')  # 'enrolled', 'cancelled', 'attended'
    enrolled_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    cancelled_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships - no backrefs to avoid conflicts
    payment = db.relationship('Payment', backref='enrollments')

    def __repr__(self):
        return f"<ClassEnrollment id={self.id} student_id={self.student_id} instance_id={self.instance_id} status={self.status}>"
    
    @property
    def is_active(self):
        """Check if this enrollment is active (enrolled and not cancelled)."""
        return self.status == 'enrolled'
