from models import db, StudioClass, ClassInstance, ClassEnrollment, User
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.exc import IntegrityError


class ClassService:
    """Service class for class-related business logic"""
    
    @staticmethod
    def create_studio_class(class_data: Dict[str, Any]) -> StudioClass:
        """Create a new studio class with instances"""
        try:
            # Parse start_time
            start_time = datetime.fromisoformat(class_data['start_time'])
            
            studio_class = StudioClass(
                class_name=class_data['class_name'],
                description=class_data.get('description'),
                start_time=start_time,
                duration=class_data['duration'],
                instructor_id=class_data['instructor_id'],
                max_capacity=class_data['max_capacity'],
                requirements=class_data.get('requirements'),
                recommended_attire=class_data.get('recommended_attire'),
                recurrence_pattern=class_data.get('recurrence_pattern'),
            )
            db.session.add(studio_class)
            db.session.commit()
            
            # Add instructor as assigned staff
            instructor = db.session.get(User, class_data['instructor_id'])
            if instructor and instructor.discriminator == 'staff':
                studio_class.add_staff_member(instructor)
            
            # Add creator as manager if provided
            creator_id = class_data.get('creator_id')
            if creator_id:
                creator = db.session.get(User, creator_id)
                if creator and creator.discriminator == 'management':
                    studio_class.add_manager(creator)
            
            # Create class instances
            ClassService._create_class_instances(studio_class)
            
            return studio_class
        except Exception as e:
            db.session.rollback()
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
            current_time = start
            while current_time <= three_months_later:
                print(f"[DEBUG] Creating weekly instance at {current_time}")
                ClassService._create_single_instance(studio_class, current_time)
                current_time += timedelta(weeks=1)
        elif recurrence == 'bi-weekly':
            current_time = start
            while current_time <= three_months_later:
                print(f"[DEBUG] Creating bi-weekly instance at {current_time}")
                ClassService._create_single_instance(studio_class, current_time)
                current_time += timedelta(weeks=2)
        elif recurrence == 'monthly':
            def add_month(dt):
                month = dt.month + 1
                year = dt.year
                if month > 12:
                    month = 1
                    year += 1
                day = min(dt.day, [31,29 if year%4==0 and (year%100!=0 or year%400==0) else 28,31,30,31,30,31,31,30,31,30,31][month-1])
                return dt.replace(year=year, month=month, day=day)
            current_time = start
            while current_time <= three_months_later:
                print(f"[DEBUG] Creating monthly instance at {current_time}")
                ClassService._create_single_instance(studio_class, current_time)
                try:
                    current_time = add_month(current_time)
                except Exception:
                    break
        else:
            print(f"[DEBUG] Creating one-time instance at {start}")
            ClassService._create_single_instance(studio_class, start)
        
        db.session.commit()
    
    @staticmethod
    def _create_single_instance(studio_class: StudioClass, start_time: datetime):
        """Create a single class instance"""
        instance_id = f"{studio_class.id}_{start_time.strftime('%Y%m%d%H%M')}"
        end_time = start_time + timedelta(minutes=studio_class.duration)
        
        class_instance = ClassInstance(
            instance_id=instance_id,
            class_id=studio_class.id,
            start_time=start_time,
            end_time=end_time,
            max_capacity=studio_class.max_capacity
        )
        db.session.add(class_instance)
    
    @staticmethod
    def get_upcoming_classes() -> List[ClassInstance]:
        """Get all upcoming class instances"""
        return ClassInstance.query.filter(
            ClassInstance.start_time >= datetime.now()
        ).order_by(ClassInstance.start_time).all()
    
    @staticmethod
    def get_class_templates() -> List[StudioClass]:
        """Get all studio class templates"""
        return StudioClass.query.all()
    
    @staticmethod
    def get_class_by_id(class_id: int) -> Optional[StudioClass]:
        """Get studio class by ID"""
        return db.session.get(StudioClass, class_id)
    
    @staticmethod
    def get_instance_by_id(instance_id: str) -> Optional[ClassInstance]:
        """Get class instance by ID"""
        return ClassInstance.query.filter_by(instance_id=instance_id).first()
    
    @staticmethod
    def book_class(student_id: int, instance_id: str, payment_id: Optional[int] = None) -> bool:
        """Book a class for a student"""
        try:
            instance = ClassService.get_instance_by_id(instance_id)
            if not instance:
                raise ValueError("Class instance not found")
            
            if instance.is_full:
                raise ValueError("Class is full")
            
            if instance.is_student_enrolled(student_id):
                raise ValueError("Student already enrolled")
            
            instance.add_student(student_id, payment_id)
            return True
        except Exception as e:
            db.session.rollback()
            raise e
    
    @staticmethod
    def cancel_enrollment(student_id: int, instance_id: str) -> bool:
        """Cancel a student's enrollment"""
        try:
            enrollment = ClassEnrollment.query.filter_by(
                student_id=student_id,
                instance_id=instance_id,
                status='enrolled'
            ).first()
            
            if not enrollment:
                raise ValueError("Enrollment not found")
            
            enrollment.status = 'cancelled'
            enrollment.cancelled_at = datetime.now()
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise e
    
    @staticmethod
    def get_student_enrollments(student_id: int) -> List[ClassEnrollment]:
        """Get all enrollments for a student"""
        return ClassEnrollment.query.filter_by(
            student_id=student_id,
            status='enrolled'
        ).all()
    
    @staticmethod
    def add_staff_to_class(class_id: int, staff_id: int) -> bool:
        """Add a staff member to a class"""
        try:
            studio_class = ClassService.get_class_by_id(class_id)
            if not studio_class:
                raise ValueError("Class not found")
            
            staff_member = UserService.get_user_by_id(staff_id)
            if not staff_member or staff_member.discriminator != 'staff':
                raise ValueError("Staff member not found")
            
            studio_class.add_staff_member(staff_member)
            return True
        except Exception as e:
            raise e
    
    @staticmethod
    def remove_staff_from_class(class_id: int, staff_id: int) -> bool:
        """Remove a staff member from a class"""
        try:
            studio_class = ClassService.get_class_by_id(class_id)
            if not studio_class:
                raise ValueError("Class not found")
            
            staff_member = UserService.get_user_by_id(staff_id)
            if not staff_member:
                raise ValueError("Staff member not found")
            
            studio_class.remove_staff_member(staff_member)
            return True
        except Exception as e:
            raise e
    
    @staticmethod
    def change_class_instructor(class_id: int, new_instructor_id: int) -> bool:
        """Change the instructor for a class"""
        try:
            studio_class = ClassService.get_class_by_id(class_id)
            if not studio_class:
                raise ValueError("Class not found")
            
            instructor = UserService.get_user_by_id(new_instructor_id)
            if not instructor or instructor.discriminator != 'staff':
                raise ValueError("Instructor not found")
            
            studio_class.change_instructor(new_instructor_id)
            return True
        except Exception as e:
            raise e


# Import at the end to avoid circular imports
from services.user_service import UserService 