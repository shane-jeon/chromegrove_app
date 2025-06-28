from typing import List, Optional, TypeVar, Generic
from sqlalchemy.orm import Query
from models import db
from .base_repository import BaseRepository

T = TypeVar('T')

class SQLAlchemyRepository(BaseRepository[T]):
    """SQLAlchemy implementation of the base repository"""
    
    def __init__(self, model_class):
        super().__init__(model_class)
    
    def get_by_id(self, id: int) -> Optional[T]:
        """Get entity by ID"""
        return db.session.get(self.model_class, id)
    
    def get_all(self) -> List[T]:
        """Get all entities"""
        return self.model_class.query.all()
    
    def create(self, entity: T) -> T:
        """Create a new entity"""
        db.session.add(entity)
        db.session.commit()
        return entity
    
    def update(self, entity: T) -> T:
        """Update an existing entity"""
        db.session.commit()
        return entity
    
    def delete(self, entity: T) -> bool:
        """Delete an entity"""
        try:
            db.session.delete(entity)
            db.session.commit()
            return True
        except Exception:
            db.session.rollback()
            return False
    
    def find_by(self, **kwargs) -> List[T]:
        """Find entities by criteria"""
        return self.model_class.query.filter_by(**kwargs).all()
    
    def find_one_by(self, **kwargs) -> Optional[T]:
        """Find one entity by criteria"""
        return self.model_class.query.filter_by(**kwargs).first()
    
    def query(self) -> Query:
        """Get a query object for complex queries"""
        return self.model_class.query 