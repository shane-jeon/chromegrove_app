from abc import ABC, abstractmethod
from typing import List, Optional, TypeVar, Generic, Dict, Any
from models import db

T = TypeVar('T')

class BaseRepository(ABC, Generic[T]):
    """Base repository interface for common CRUD operations"""
    
    def __init__(self, model_class):
        self.model_class = model_class
    
    @abstractmethod
    def get_by_id(self, id: int) -> Optional[T]:
        """Get entity by ID"""
        pass
    
    @abstractmethod
    def get_all(self) -> List[T]:
        """Get all entities"""
        pass
    
    @abstractmethod
    def create(self, entity: T) -> T:
        """Create a new entity"""
        pass
    
    @abstractmethod
    def update(self, entity: T) -> T:
        """Update an existing entity"""
        pass
    
    @abstractmethod
    def delete(self, entity: T) -> bool:
        """Delete an entity"""
        pass
    
    @abstractmethod
    def find_by(self, **kwargs) -> List[T]:
        """Find entities by criteria"""
        pass
    
    @abstractmethod
    def find_one_by(self, **kwargs) -> Optional[T]:
        """Find one entity by criteria"""
        pass 