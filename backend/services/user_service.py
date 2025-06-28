from models import db, User, Student, Staff, Management
from sqlalchemy.exc import IntegrityError
from typing import Optional, Dict, Any


class UserService:
    """Service class for user-related business logic"""
    
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
    
    @staticmethod
    def get_user_by_id(user_id: int) -> Optional[User]:
        """Get user by ID"""
        return db.session.get(User, user_id)
    
    @staticmethod
    def get_all_users() -> list[User]:
        """Get all users"""
        return User.query.all()
    
    @staticmethod
    def search_instructors(query: str) -> list[User]:
        """Search for staff members who can be instructors"""
        q = User.query.filter(User.discriminator == 'staff')
        if query:
            q = q.filter(
                (User.name.ilike(f"%{query}%")) |
                (User.email.ilike(f"%{query}%"))
            )
        return q.all()
    
    @staticmethod
    def get_user_profile(user: User) -> Dict[str, Any]:
        """Get user profile data"""
        return user.get_user_profile() | {"type": user.discriminator} 