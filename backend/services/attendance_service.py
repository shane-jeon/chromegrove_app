from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from models import db, ClassEnrollment, ClassInstance, User, StudioClass
from repositories.user_repository import UserRepository
from repositories.class_repository import StudioClassRepository, ClassInstanceRepository

class AttendanceService:
    """Service for managing class attendance"""
    
    def __init__(self):
        self.user_repository = UserRepository()
        self.studio_class_repository = StudioClassRepository()
        self.class_instance_repository = ClassInstanceRepository()
    
    def get_staff_assigned_classes(self, staff_id: int) -> List[Dict[str, Any]]:
        """Get upcoming classes assigned to a staff member (as instructor or assigned staff)"""
        try:
            # Get user to verify they are staff
            staff_user = self.user_repository.get_by_id(staff_id)
            if not staff_user or staff_user.discriminator != 'staff':
                raise ValueError("Staff member not found")
            
            # Get classes where staff is instructor
            instructor_classes = StudioClass.query.filter_by(instructor_id=staff_id).all()
            
            # Get classes where staff is assigned (not instructor)
            assigned_classes = []
            for studio_class in StudioClass.query.all():
                if staff_user in studio_class.assigned_staff:
                    assigned_classes.append(studio_class)
            
            # Combine and get upcoming instances
            all_classes = instructor_classes + assigned_classes
            upcoming_instances = []
            
            for studio_class in all_classes:
                # Get future instances for this class
                instances = ClassInstance.query.filter(
                    ClassInstance.class_id == studio_class.id,
                    ClassInstance.start_time > datetime.utcnow(),
                    ClassInstance.is_cancelled == False
                ).order_by(ClassInstance.start_time).all()
                
                for instance in instances:
                    # Get ALL students (enrolled, attended, and missed) - not just enrolled
                    enrollments = ClassEnrollment.query.filter(
                        ClassEnrollment.instance_id == instance.instance_id,
                        ClassEnrollment.status.in_(['enrolled', 'attended', 'missed'])
                    ).all()
                    
                    # Get student details
                    students = []
                    for enrollment in enrollments:
                        student = self.user_repository.get_by_id(enrollment.student_id)
                        if student:
                            students.append({
                                'id': student.id,
                                'name': student.name,
                                'email': student.email,
                                'enrollment_id': enrollment.id,
                                'status': enrollment.status,
                                'attendance_marked_at': enrollment.attendance_marked_at.isoformat() if enrollment.attendance_marked_at else None
                            })
                    
                    # Always include assigned classes for staff, even if no students
                    upcoming_instances.append({
                        'instance_id': instance.instance_id,
                        'class_id': studio_class.id,
                        'class_name': studio_class.class_name,
                        'description': studio_class.description,
                        'start_time': instance.start_time.isoformat(),
                        'end_time': instance.end_time.isoformat(),
                        'duration': studio_class.duration,
                        'max_capacity': instance.max_capacity,
                        'enrolled_count': len(students),
                        'students': students,
                        'is_instructor': studio_class.instructor_id == staff_id
                    })
            
            return upcoming_instances
            
        except Exception as e:
            raise e
    
    def get_staff_booked_classes(self, staff_id: int) -> List[Dict[str, Any]]:
        """Get classes that staff has booked for themselves (enrolled as student)"""
        try:
            # Get user to verify they are staff
            staff_user = self.user_repository.get_by_id(staff_id)
            if not staff_user or staff_user.discriminator != 'staff':
                raise ValueError("Staff member not found")
            
            # Get enrollments where staff is the student
            enrollments = ClassEnrollment.query.filter_by(
                student_id=staff_id,
                status='enrolled'
            ).all()
            
            booked_classes = []
            for enrollment in enrollments:
                # Get class instance
                instance = ClassInstance.query.get(enrollment.instance_id)
                if not instance:
                    continue
                
                # Get studio class
                studio_class = StudioClass.query.get(instance.class_id)
                if not studio_class:
                    continue
                
                # Get instructor name
                instructor = self.user_repository.get_by_id(studio_class.instructor_id)
                instructor_name = instructor.name if instructor else "Unknown"
                
                booked_classes.append({
                    'instance_id': instance.instance_id,
                    'class_id': studio_class.id,
                    'class_name': studio_class.class_name,
                    'description': studio_class.description,
                    'start_time': instance.start_time.isoformat(),
                    'end_time': instance.end_time.isoformat(),
                    'duration': studio_class.duration,
                    'max_capacity': instance.max_capacity,
                    'enrolled_count': instance.enrolled_count,
                    'instructor_id': studio_class.instructor_id,
                    'instructor_name': instructor_name,
                    'requirements': studio_class.requirements,
                    'recommended_attire': studio_class.recommended_attire,
                    'enrollment_id': enrollment.id,
                    'is_enrolled': True
                })
            
            return booked_classes
            
        except Exception as e:
            raise e
    
    def mark_student_attendance(self, enrollment_id: int, status: str, staff_id: int) -> bool:
        """Mark attendance for a student"""
        try:
            # Verify staff member
            staff_user = self.user_repository.get_by_id(staff_id)
            if not staff_user or staff_user.discriminator != 'staff':
                raise ValueError("Staff member not found")
            
            # Get enrollment
            enrollment = ClassEnrollment.query.get(enrollment_id)
            if not enrollment:
                raise ValueError("Enrollment not found")
            
            # Get class instance to check if staff is authorized
            instance = ClassInstance.query.get(enrollment.instance_id)
            if not instance:
                raise ValueError("Class instance not found")
            
            studio_class = StudioClass.query.get(instance.class_id)
            if not studio_class:
                raise ValueError("Studio class not found")
            
            # Check if staff is authorized (instructor or assigned staff)
            is_authorized = (
                studio_class.instructor_id == staff_id or 
                staff_user in studio_class.assigned_staff
            )
            
            if not is_authorized:
                raise ValueError("Staff member not authorized to mark attendance for this class")
            
            # Check if class has started (for "missed" status)
            if status == 'missed':
                class_start_time = instance.start_time
                current_time = datetime.utcnow()
                time_diff = current_time - class_start_time
                
                if time_diff < timedelta(minutes=15):
                    raise ValueError("Cannot mark as 'missed' until 15 minutes after class start time")
            
            # Mark attendance
            enrollment.mark_attendance(status, staff_id)
            return True
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    def get_class_roster(self, instance_id: str, staff_id: int) -> Dict[str, Any]:
        """Get roster for a specific class instance"""
        try:
            # Verify staff member
            staff_user = self.user_repository.get_by_id(staff_id)
            if not staff_user or staff_user.discriminator != 'staff':
                raise ValueError("Staff member not found")
            
            # Get class instance
            instance = ClassInstance.query.get(instance_id)
            if not instance:
                raise ValueError("Class instance not found")
            
            studio_class = StudioClass.query.get(instance.class_id)
            if not studio_class:
                raise ValueError("Studio class not found")
            
            # Check if staff is authorized
            is_authorized = (
                studio_class.instructor_id == staff_id or 
                staff_user in studio_class.assigned_staff
            )
            
            if not is_authorized:
                raise ValueError("Staff member not authorized to view this class roster")
            
            # Get enrollments
            enrollments = ClassEnrollment.query.filter(
                ClassEnrollment.instance_id == instance_id,
                ClassEnrollment.status.in_(['enrolled', 'attended', 'missed'])
            ).all()
            
            # Get student details
            students = []
            for enrollment in enrollments:
                student = self.user_repository.get_by_id(enrollment.student_id)
                if student:
                    students.append({
                        'id': student.id,
                        'name': student.name,
                        'email': student.email,
                        'enrollment_id': enrollment.id,
                        'status': enrollment.status,
                        'attendance_marked_at': enrollment.attendance_marked_at.isoformat() if enrollment.attendance_marked_at else None,
                        'marked_by_staff_id': enrollment.marked_by_staff_id
                    })
            
            return {
                'instance_id': instance_id,
                'class_name': studio_class.class_name,
                'start_time': instance.start_time.isoformat(),
                'end_time': instance.end_time.isoformat(),
                'students': students,
                'total_enrolled': len(students),
                'max_capacity': instance.max_capacity
            }
            
        except Exception as e:
            raise e 