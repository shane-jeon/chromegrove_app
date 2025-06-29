from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from models import StudioClass, ClassInstance, User, db
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
    
    def book_class_for_staff(self, staff_id: int, instance_id: str) -> bool:
        """Book a class for a staff member (no payment required)"""
        try:
            instance = self.get_instance_by_id(instance_id)
            if not instance:
                raise ValueError("Class instance not found")
            
            if instance.is_full:
                raise ValueError("Class is full")
            
            # Check if staff is already enrolled
            from models import ClassEnrollment
            existing_enrollment = ClassEnrollment.query.filter_by(
                student_id=staff_id,
                instance_id=instance_id,
                status='enrolled'
            ).first()
            
            if existing_enrollment:
                raise ValueError("Staff member already enrolled")
            
            # Check if staff is instructing this class
            studio_class = self.get_class_by_id(instance.class_id)
            if studio_class and studio_class.instructor_id == staff_id:
                raise ValueError("Staff member cannot book a class they are instructing")
            
            # Add staff member to class (no payment required)
            instance.add_student(staff_id, None)
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
        print(f"[DEBUG] Creating instances for class_id={studio_class.id}, recurrence='{recurrence}', start={start}, until={three_months_later}")
        print(f"[DEBUG] Recurrence pattern type: {type(recurrence)}, length: {len(recurrence)}")
        
        instances_created = []
        
        if recurrence == 'weekly':
            # Weekly classes
            current_time = start
            while current_time <= three_months_later:
                print(f"[DEBUG] Creating weekly instance at {current_time}")
                instance = ClassService._create_single_instance(studio_class, current_time)
                instances_created.append(instance)
                current_time += timedelta(weeks=1)
        elif recurrence == 'bi-weekly':
            # Bi-weekly classes
            current_time = start
            while current_time <= three_months_later:
                print(f"[DEBUG] Creating bi-weekly instance at {current_time}")
                instance = ClassService._create_single_instance(studio_class, current_time)
                instances_created.append(instance)
                current_time += timedelta(weeks=2)
        elif recurrence == 'monthly':
            # Monthly classes - same day of week each month
            current_time = start
            instance_count = 0
            
            # Get the day of week (0=Monday, 6=Sunday) and week number in month
            original_weekday = current_time.weekday()  # 0=Monday, 6=Sunday
            original_day = current_time.day
            week_number = (original_day - 1) // 7 + 1  # Which week of the month (1-5)
            
            print(f"[DEBUG] Monthly: Original date {current_time}, weekday={original_weekday}, week_number={week_number}")
            
            while current_time <= three_months_later:
                print(f"[DEBUG] Creating monthly instance {instance_count + 1} at {current_time}")
                instance = ClassService._create_single_instance(studio_class, current_time)
                instances_created.append(instance)
                
                # Move to next month, same week and day of week
                current_time = ClassService.add_months_same_weekday(current_time, 1, original_weekday, week_number)
                instance_count += 1
            print(f"[DEBUG] Monthly: Created {instance_count} instances")
        elif recurrence == 'pop-up':
            # Pop-up events (one-time)
            print(f"[DEBUG] Creating pop-up event instance at {start}")
            instance = ClassService._create_single_instance(studio_class, start)
            instances_created.append(instance)
        else:
            # One-time classes (default)
            print(f"[DEBUG] Creating one-time instance at {start} (recurrence: '{recurrence}')")
            instance = ClassService._create_single_instance(studio_class, start)
            instances_created.append(instance)
        
        # Commit all instances at once
        if instances_created:
            from models import db
            db.session.commit()
            print(f"[DEBUG] Successfully created {len(instances_created)} instances")
        else:
            print(f"[DEBUG] No instances were created!")
    
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
        
        # Add to session but don't commit yet
        from models import db
        db.session.add(class_instance)
        
        return class_instance

    @staticmethod
    def add_months(dt, months):
        month = dt.month - 1 + months
        year = dt.year + month // 12
        month = month % 12 + 1
        day = min(dt.day, calendar.monthrange(year, month)[1])
        return dt.replace(year=year, month=month, day=day)

    @staticmethod
    def add_months_same_weekday(dt, months, weekday, week_number):
        """Add months while preserving the same day of week and week number in month"""
        # Calculate target year and month
        month = dt.month - 1 + months
        year = dt.year + month // 12
        month = month % 12 + 1
        
        # Calculate the target day based on week number and weekday
        # week_number: 1=first week, 2=second week, etc.
        # weekday: 0=Monday, 1=Tuesday, ..., 6=Sunday
        
        # Start with the first day of the target month
        target_date = dt.replace(year=year, month=month, day=1)
        
        # Find the first occurrence of the target weekday in the month
        while target_date.weekday() != weekday:
            target_date = target_date + timedelta(days=1)
        
        # Add weeks to get to the desired week number
        target_date = target_date + timedelta(weeks=week_number - 1)
        
        # Check if the resulting date is still in the same month
        if target_date.month != month:
            # If we went too far, go back one week
            target_date = target_date - timedelta(weeks=1)
        
        return target_date

    def cancel_single_instance(self, instance_id: str) -> bool:
        """Cancel a single class instance"""
        try:
            # Get the class instance
            instance = ClassInstance.query.get(instance_id)
            if not instance:
                raise ValueError("Class instance not found")
            
            # Check if the class has already started
            if instance.start_time <= datetime.utcnow():
                raise ValueError("Cannot cancel a class that has already started")
            
            # Mark the instance as cancelled
            instance.is_cancelled = True
            
            # Cancel all enrollments for this instance
            from models import ClassEnrollment
            enrollments = ClassEnrollment.query.filter_by(
                instance_id=instance_id,
                status='enrolled'
            ).all()
            
            for enrollment in enrollments:
                enrollment.status = 'cancelled'
                enrollment.cancelled_at = datetime.utcnow()
            
            db.session.commit()
            return True
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    def cancel_future_instances(self, instance_id: str) -> bool:
        """Cancel this instance and all future instances of the same class"""
        try:
            # Get the current instance
            current_instance = ClassInstance.query.get(instance_id)
            if not current_instance:
                raise ValueError("Class instance not found")
            
            # Get the studio class
            studio_class = StudioClass.query.get(current_instance.class_id)
            if not studio_class:
                raise ValueError("Studio class not found")
            
            # Get all future instances of this class (including the current one)
            future_instances = ClassInstance.query.filter(
                ClassInstance.class_id == current_instance.class_id,
                ClassInstance.start_time >= current_instance.start_time,
                ClassInstance.is_cancelled == False
            ).all()
            
            # Cancel each future instance
            for instance in future_instances:
                # Mark the instance as cancelled
                instance.is_cancelled = True
                
                # Cancel all enrollments for this instance
                from models import ClassEnrollment
                enrollments = ClassEnrollment.query.filter_by(
                    instance_id=instance.instance_id,
                    status='enrolled'
                ).all()
                
                for enrollment in enrollments:
                    enrollment.status = 'cancelled'
                    enrollment.cancelled_at = datetime.utcnow()
            
            db.session.commit()
            return True
            
        except Exception as e:
            db.session.rollback()
            raise e


# Import at the end to avoid circular imports
from services.user_service import UserService 