from models import db, User, Student, Staff, Management
from sqlalchemy.exc import IntegrityError
from typing import Optional, Dict, Any, List
from repositories.user_repository import UserRepository


class UserService:
    """Service layer for user-related business logic"""
    
    def __init__(self):
        self.user_repository = UserRepository()
    
    @staticmethod
    def create_user(user_data: Dict[str, Any]) -> User:
        """Create a new user with the specified role"""
        clerk_user_id = user_data.get('clerk_user_id')
        email = user_data.get('email')
        role = user_data.get('role')
        name = user_data.get('name')
        
        if not clerk_user_id or not role:
            raise ValueError("Missing required fields: clerk_user_id and role")
        
        if role not in ('student', 'staff', 'management'):
            raise ValueError("Invalid role. Must be 'student', 'staff', or 'management'.")
        
        try:
            user = User.create_account(clerk_user_id, email, role, name)
            return user
        except IntegrityError as e:
            db.session.rollback()
            raise e
    
    @staticmethod
    def get_user_by_clerk_id(clerk_user_id: str) -> Optional[User]:
        """Get user by Clerk user ID"""
        return User.query.filter_by(clerk_user_id=clerk_user_id).first()
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return self.user_repository.get_by_id(user_id)
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        return self.user_repository.find_by_email(email)
    
    def get_user_by_clerk_id(self, clerk_user_id: str) -> Optional[User]:
        """Get user by Clerk user ID"""
        return User.query.filter_by(clerk_user_id=clerk_user_id).first()
    
    def get_all_staff(self) -> List[User]:
        """Get all staff members"""
        return self.user_repository.find_staff_members()
    
    def get_all_students(self) -> List[User]:
        """Get all students"""
        return self.user_repository.find_students()
    
    def get_all_managers(self) -> List[User]:
        """Get all managers"""
        return self.user_repository.find_managers()
    
    def search_instructors(self, query: str) -> List[User]:
        """Search for staff members who can be instructors"""
        if query:
            return self.user_repository.search_staff_by_name_or_email(query)
        else:
            return self.user_repository.find_staff_members()
    
    def get_user_profile(self, user: User) -> Dict[str, Any]:
        """Get user profile data"""
        return user.get_user_profile() | {"type": user.discriminator}
    
    def create_user(self, user_data: dict) -> User:
        """Create a new user"""
        user = User.create_account(**user_data)
        return self.user_repository.create(user)
    
    def update_user(self, user: User) -> User:
        """Update an existing user"""
        return self.user_repository.update(user)
    
    def delete_user(self, user: User) -> bool:
        """Delete a user"""
        return self.user_repository.delete(user)
    
    def get_users_by_role(self, role: str) -> List[User]:
        """Get users by role"""
        return self.user_repository.find_by_role(role)
    
    def get_all_users(self) -> List[User]:
        """Get all users"""
        return self.user_repository.get_all() 