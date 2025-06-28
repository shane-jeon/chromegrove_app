from typing import Dict, Any, List, Optional
from models import StudioClass, ClassInstance, ClassEnrollment
from datetime import datetime


class StudioClassDTO:
    """Data Transfer Object for StudioClass data"""
    
    def __init__(self, studio_class: StudioClass):
        self.id = studio_class.id
        self.class_name = studio_class.class_name
        self.description = studio_class.description
        self.start_time = studio_class.start_time.isoformat() if studio_class.start_time else None
        self.duration = studio_class.duration
        self.instructor_id = studio_class.instructor_id
        self.max_capacity = studio_class.max_capacity
        self.requirements = studio_class.requirements
        self.recommended_attire = studio_class.recommended_attire
        self.recurrence_pattern = studio_class.recurrence_pattern
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "id": self.id,
            "class_name": self.class_name,
            "description": self.description,
            "start_time": self.start_time,
            "duration": self.duration,
            "instructor_id": self.instructor_id,
            "max_capacity": self.max_capacity,
            "requirements": self.requirements,
            "recommended_attire": self.recommended_attire,
            "recurrence_pattern": self.recurrence_pattern
        }
    
    @classmethod
    def from_studio_class(cls, studio_class: StudioClass) -> 'StudioClassDTO':
        """Create DTO from StudioClass model"""
        return cls(studio_class)
    
    @classmethod
    def from_studio_class_list(cls, studio_classes: List[StudioClass]) -> List['StudioClassDTO']:
        """Create list of DTOs from StudioClass models"""
        return [cls(studio_class) for studio_class in studio_classes]


class ClassInstanceDTO:
    """Data Transfer Object for ClassInstance data"""
    
    def __init__(self, instance: ClassInstance, studio_class: Optional[StudioClass] = None, is_enrolled: bool = False, enrollment_id: Optional[int] = None):
        self.instance_id = instance.instance_id
        self.class_id = instance.class_id
        self.start_time = instance.start_time.isoformat() if instance.start_time else None
        self.end_time = instance.end_time.isoformat() if instance.end_time else None
        self.max_capacity = instance.max_capacity
        self.is_cancelled = instance.is_cancelled
        self.enrolled_count = instance.enrolled_count
        self.is_full = instance.is_full
        self.is_enrolled = is_enrolled
        self.enrollment_id = enrollment_id
        
        # Studio class details if provided
        if studio_class:
            self.class_name = studio_class.class_name
            self.description = studio_class.description
            self.requirements = studio_class.requirements
            self.recommended_attire = studio_class.recommended_attire
            self.recurrence_pattern = studio_class.recurrence_pattern
            self.instructor_id = studio_class.instructor_id
            self.instructor_name = studio_class.instructor.name if studio_class.instructor else str(studio_class.instructor_id)
        else:
            self.class_name = None
            self.description = None
            self.requirements = None
            self.recommended_attire = None
            self.recurrence_pattern = None
            self.instructor_id = None
            self.instructor_name = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "instance_id": self.instance_id,
            "class_id": self.class_id,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "max_capacity": self.max_capacity,
            "is_cancelled": self.is_cancelled,
            "enrolled_count": self.enrolled_count,
            "is_full": self.is_full,
            "is_enrolled": self.is_enrolled,
            "enrollment_id": self.enrollment_id,
            "class_name": self.class_name,
            "description": self.description,
            "requirements": self.requirements,
            "recommended_attire": self.recommended_attire,
            "recurrence_pattern": self.recurrence_pattern,
            "instructor_id": self.instructor_id,
            "instructor_name": self.instructor_name
        }
    
    @classmethod
    def from_instance(cls, instance: ClassInstance, studio_class: Optional[StudioClass] = None, is_enrolled: bool = False, enrollment_id: Optional[int] = None) -> 'ClassInstanceDTO':
        """Create DTO from ClassInstance model"""
        return cls(instance, studio_class, is_enrolled, enrollment_id)
    
    @classmethod
    def from_instance_list(cls, instances: List[ClassInstance], studio_classes: Optional[Dict[int, StudioClass]] = None, enrollments: Optional[Dict[str, ClassEnrollment]] = None) -> List['ClassInstanceDTO']:
        """Create list of DTOs from ClassInstance models"""
        dtos = []
        for instance in instances:
            studio_class = studio_classes.get(instance.class_id) if studio_classes else None
            enrollment = enrollments.get(instance.instance_id) if enrollments else None
            is_enrolled = enrollment is not None
            enrollment_id = enrollment.id if enrollment else None
            
            dto = cls(instance, studio_class, is_enrolled, enrollment_id)
            dtos.append(dto)
        return dtos 