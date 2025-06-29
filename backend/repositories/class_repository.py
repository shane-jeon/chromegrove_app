from typing import List, Optional
from datetime import datetime
from models import StudioClass, ClassInstance
from .sqlalchemy_repository import SQLAlchemyRepository

class StudioClassRepository(SQLAlchemyRepository[StudioClass]):
    """Repository for StudioClass entities with domain-specific methods"""
    
    def __init__(self):
        super().__init__(StudioClass)
    
    def find_by_instructor(self, instructor_id: int) -> List[StudioClass]:
        """Find classes by instructor"""
        return self.find_by(instructor_id=instructor_id)
    
    def find_active_classes(self) -> List[StudioClass]:
        """Find active classes (not deleted)"""
        return self.query().filter(StudioClass.deleted_at.is_(None)).all()
    
    def find_by_recurrence_pattern(self, pattern: str) -> List[StudioClass]:
        """Find classes by recurrence pattern"""
        return self.find_by(recurrence_pattern=pattern)

class ClassInstanceRepository(SQLAlchemyRepository[ClassInstance]):
    """Repository for ClassInstance entities with domain-specific methods"""
    
    def __init__(self):
        super().__init__(ClassInstance)
    
    def find_by_template(self, template_id: int) -> List[ClassInstance]:
        """Find instances by template class"""
        return self.find_by(template_id=template_id)
    
    def find_future_instances(self) -> List[ClassInstance]:
        """Find future class instances that are not cancelled"""
        now = datetime.now()
        return self.query().filter(
            ClassInstance.start_time > now,
            ClassInstance.is_cancelled == False
        ).all()
    
    def find_instances_by_date_range(self, start_date: datetime, end_date: datetime) -> List[ClassInstance]:
        """Find instances within a date range"""
        return self.query().filter(
            ClassInstance.start_time >= start_date,
            ClassInstance.start_time <= end_date
        ).all()
    
    def find_by_instance_id(self, instance_id: str) -> Optional[ClassInstance]:
        """Find instance by instance_id string"""
        return self.find_one_by(instance_id=instance_id)
    
    def find_available_instances(self) -> List[ClassInstance]:
        """Find instances that are not full"""
        # This method needs to be implemented differently since enrolled_count is a property
        # We'll get all instances and filter them in Python
        all_instances = self.query().all()
        available_instances = []
        
        for instance in all_instances:
            if instance.enrolled_count < instance.max_capacity:
                available_instances.append(instance)
        
        return available_instances 