from typing import List
from models import SlidingScaleOption
from .sqlalchemy_repository import SQLAlchemyRepository

class PaymentRepository(SQLAlchemyRepository[SlidingScaleOption]):
    """Repository for payment-related entities"""
    
    def __init__(self):
        super().__init__(SlidingScaleOption)
    
    def find_by_category(self, category: str) -> List[SlidingScaleOption]:
        """Find sliding scale options by category"""
        return self.find_by(category=category)
    
    def find_drop_in_options(self) -> List[SlidingScaleOption]:
        """Find drop-in sliding scale options"""
        return self.find_by_category('drop-in')
    
    def find_membership_options(self) -> List[SlidingScaleOption]:
        """Find membership sliding scale options"""
        return self.find_by_category('membership')
    
    def find_active_options(self) -> List[SlidingScaleOption]:
        """Find active sliding scale options"""
        return self.query().filter(SlidingScaleOption.is_active == True).all() 