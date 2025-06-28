from typing import List, Optional
from models import User
from .sqlalchemy_repository import SQLAlchemyRepository

class UserRepository(SQLAlchemyRepository[User]):
    """Repository for User entities with domain-specific methods"""
    
    def __init__(self):
        super().__init__(User)
    
    def find_by_email(self, email: str) -> Optional[User]:
        """Find user by email"""
        return self.find_one_by(email=email)
    
    def find_staff_members(self) -> List[User]:
        """Find all staff members"""
        return self.find_by(discriminator='staff')
    
    def find_students(self) -> List[User]:
        """Find all students"""
        return self.find_by(discriminator='student')
    
    def find_managers(self) -> List[User]:
        """Find all managers"""
        return self.find_by(discriminator='manager')
    
    def search_staff_by_name_or_email(self, query: str) -> List[User]:
        """Search staff members by name or email"""
        return self.query().filter(
            User.discriminator == 'staff',
            (User.name.ilike(f"%{query}%")) | (User.email.ilike(f"%{query}%"))
        ).all()
    
    def find_by_role(self, role: str) -> List[User]:
        """Find users by role"""
        return self.find_by(discriminator=role) 