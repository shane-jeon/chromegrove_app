from typing import Dict, Any, Optional
from models import User


class UserDTO:
    """Data Transfer Object for User data"""
    
    def __init__(self, user: User):
        self.id = user.id
        self.clerk_user_id = user.clerk_user_id
        self.email = user.email
        self.name = user.name
        self.role = user.role
        self.type = user.discriminator
        self.created_at = user.created_at.isoformat() if user.created_at else None
        self.updated_at = user.updated_at.isoformat() if user.updated_at else None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "id": self.id,
            "clerk_user_id": self.clerk_user_id,
            "email": self.email,
            "name": self.name,
            "role": self.role,
            "type": self.type,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }
    
    @classmethod
    def from_user(cls, user: User) -> 'UserDTO':
        """Create DTO from User model"""
        return cls(user)
    
    @classmethod
    def from_user_list(cls, users: list[User]) -> list['UserDTO']:
        """Create list of DTOs from User models"""
        return [cls(user) for user in users] 