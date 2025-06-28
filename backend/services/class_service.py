from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from models import StudioClass, ClassInstance, User
from repositories.class_repository import StudioClassRepository, ClassInstanceRepository
from repositories.user_repository import UserRepository
import calendar

class ClassService:
    """Service layer for class-related business logic"""
    
    def __init__(self):
        self.studio_class_repository = StudioClassRepository()
        self.class_instance_repository = ClassInstanceRepository()
        self.user_repository = UserRepository()
    
    def get_all_classes(self) -> List[StudioClass]:
        """Get all active studio classes"""
        return self.studio_class_repository.find_active_classes()
    
    def get_class_by_id(self, class_id: int) -> Optional[StudioClass]:
        """Get studio class by ID"""
        return self.studio_class_repository.get_by_id(class_id)
    
    def get_instances_by_template(self, template_id: int) -> List[ClassInstance]:
        """Get all instances for a template class"""
        return self.class_instance_repository.find_by_template(template_id)
    
    def get_future_instances(self) -> List[ClassInstance]:
        """Get all future class instances"""
        return self.class_instance_repository.find_future_instances()
    
    def get_instance_by_id(self, instance_id: str) -> Optional[ClassInstance]:
        """Get class instance by instance_id"""
        return self.class_instance_repository.find_by_instance_id(instance_id)
    
    def create_studio_class(self, class_data: Dict[str, Any]) -> StudioClass:
        """Create a new studio class with instances"""
        # Get instructor
        instructor = self.user_repository.get_by_id(class_data['instructor_id'])
        if not instructor:
            raise ValueError("Instructor not found")
        
        # Convert start_time to datetime
        start_time_str = class_data['start_time']
        if isinstance(start_time_str, str):
            try:
                start_time = datetime.strptime(start_time_str, "%Y-%m-%dT%H:%M:%S")
            except ValueError:
                start_time = datetime.strptime(start_time_str, "%Y-%m-%dT%H:%M")
        else:
            start_time = start_time_str
        
        # Create studio class
        studio_class = StudioClass(
            class_name=class_data['class_name'],
            description=class_data.get('description', ''),
            start_time=start_time,
            duration=class_data['duration'],
            max_capacity=class_data['max_capacity'],
            instructor_id=class_data['instructor_id'],
            requirements=class_data.get('requirements', ''),
            recommended_attire=class_data.get('recommended_attire', ''),
            recurrence_pattern=class_data.get('recurrence_pattern', 'one-time')
        )
        
        # Save to database
        studio_class = self.studio_class_repository.create(studio_class)
        
        # Create class instances
        self._create_class_instances(studio_class)
        
        return studio_class
    
    def update_studio_class(self, studio_class: StudioClass) -> StudioClass:
        """Update a studio class"""
        return self.studio_class_repository.update(studio_class)
    
    def delete_studio_class(self, studio_class: StudioClass) -> bool:
        """Delete a studio class (soft delete)"""
        studio_class.deleted_at = datetime.now()
        return self.studio_class_repository.update(studio_class) is not None
    
    def get_classes_by_instructor(self, instructor_id: int) -> List[StudioClass]:
        """Get classes by instructor"""
        return self.studio_class_repository.find_by_instructor(instructor_id)
    
    def get_available_instances(self) -> List[ClassInstance]:
        """Get instances that are not full"""
        return self.class_instance_repository.find_available_instances()
    
    def get_upcoming_classes(self) -> List[ClassInstance]:
        """Get all upcoming class instances"""
        return self.class_instance_repository.find_future_instances()
    
    def get_class_templates(self) -> List[StudioClass]:
        """Get all studio class templates"""
        return self.studio_class_repository.get_all()
    
    def book_class(self, student_id: int, instance_id: str, payment_id: Optional[int] = None) -> bool:
        """Book a class for a student"""
        try:
            instance = self.get_instance_by_id(instance_id)
            if not instance:
                raise ValueError("Class instance not found")
            
            if instance.is_full:
                raise ValueError("Class is full")
            
            # Check if student is already enrolled
            from models import ClassEnrollment
            existing_enrollment = ClassEnrollment.query.filter_by(
                student_id=student_id,
                instance_id=instance_id,
                status='enrolled'
            ).first()
            
            if existing_enrollment:
                raise ValueError("Student already enrolled")
            
            # Add student to class
            instance.add_student(student_id, payment_id)
            return True
        except Exception as e:
            from models import db
            db.session.rollback()
            raise e
    
    def cancel_enrollment(self, student_id: int, instance_id: str) -> bool:
        """Cancel a student's enrollment"""
        try:
            from models import ClassEnrollment
            enrollment = ClassEnrollment.query.filter_by(
                student_id=student_id,
                instance_id=instance_id,
                status='enrolled'
            ).first()
            
            if not enrollment:
                raise ValueError("Enrollment not found")
            
            enrollment.status = 'cancelled'
            enrollment.cancelled_at = datetime.now()
            from models import db
            db.session.commit()
            return True
        except Exception as e:
            from models import db
            db.session.rollback()
            raise e
    
    def get_student_enrollments(self, student_id: int) -> List:
        """Get all enrollments for a student"""
        from models import ClassEnrollment
        return ClassEnrollment.query.filter_by(
            student_id=student_id,
            status='enrolled'
        ).all()
    
    def add_staff_to_class(self, class_id: int, staff_id: int) -> bool:
        """Add a staff member to a class"""
        try:
            studio_class = self.get_class_by_id(class_id)
            if not studio_class:
                raise ValueError("Class not found")
            
            staff_member = self.user_repository.get_by_id(staff_id)
            if not staff_member or staff_member.discriminator != 'staff':
                raise ValueError("Staff member not found")
            
            studio_class.add_staff_member(staff_member)
            return True
        except Exception as e:
            raise e
    
    def remove_staff_from_class(self, class_id: int, staff_id: int) -> bool:
        """Remove a staff member from a class"""
        try:
            studio_class = self.get_class_by_id(class_id)
            if not studio_class:
                raise ValueError("Class not found")
            
            staff_member = self.user_repository.get_by_id(staff_id)
            if not staff_member:
                raise ValueError("Staff member not found")
            
            studio_class.remove_staff_member(staff_member)
            return True
        except Exception as e:
            raise e
    
    def change_class_instructor(self, class_id: int, new_instructor_id: int) -> bool:
        """Change the instructor for a class"""
        try:
            studio_class = self.get_class_by_id(class_id)
            if not studio_class:
                raise ValueError("Class not found")
            
            instructor = self.user_repository.get_by_id(new_instructor_id)
            if not instructor or instructor.discriminator != 'staff':
                raise ValueError("Instructor not found")
            
            studio_class.instructor_id = new_instructor_id
            self.studio_class_repository.update(studio_class)
            return True
        except Exception as e:
            raise e
    
    @staticmethod
    def _create_class_instances(studio_class: StudioClass):
        """Create class instances for a studio class based on recurrence pattern"""
        now = datetime.now()
        three_months_later = now + timedelta(days=90)
        
        start = studio_class.start_time
        recurrence = (studio_class.recurrence_pattern or '').lower()
        print(f"[DEBUG] Creating instances for class_id={studio_class.id}, recurrence={recurrence}, start={start}, until={three_months_later}")
        
        if recurrence == 'weekly':
            # Weekly classes
            current_time = start
            while current_time <= three_months_later:
                print(f"[DEBUG] Creating weekly instance at {current_time}")
                ClassService._create_single_instance(studio_class, current_time)
                current_time += timedelta(weeks=1)
        elif recurrence == 'bi-weekly':
            # Bi-weekly classes
            current_time = start
            while current_time <= three_months_later:
                print(f"[DEBUG] Creating bi-weekly instance at {current_time}")
                ClassService._create_single_instance(studio_class, current_time)
                current_time += timedelta(weeks=2)
        elif recurrence == 'monthly':
            # Monthly classes
            current_time = start
            while current_time <= three_months_later:
                print(f"[DEBUG] Creating monthly instance at {current_time}")
                ClassService._create_single_instance(studio_class, current_time)
                current_time = ClassService.add_months(current_time, 1)
        else:
            # One-time classes
            print(f"[DEBUG] Creating one-time instance at {start}")
            ClassService._create_single_instance(studio_class, start)
    
    @staticmethod
    def _create_single_instance(studio_class: StudioClass, start_time: datetime):
        """Create a single class instance"""
        # Create instance_id
        instance_id = f"{studio_class.id}_{start_time.strftime('%Y%m%d%H%M')}"
        
        # Calculate end_time
        end_time = start_time + timedelta(minutes=studio_class.duration)
        
        # Create class instance
        class_instance = ClassInstance(
            instance_id=instance_id,
            class_id=studio_class.id,
            start_time=start_time,
            end_time=end_time,
            max_capacity=studio_class.max_capacity
        )
        
        # Save to database
        from models import db
        db.session.add(class_instance)
        db.session.commit()

    @staticmethod
    def add_months(dt, months):
        month = dt.month - 1 + months
        year = dt.year + month // 12
        month = month % 12 + 1
        day = min(dt.day, calendar.monthrange(year, month)[1])
        return dt.replace(year=year, month=month, day=day)


# Import at the end to avoid circular imports
from services.user_service import UserService 