from flask_sqlalchemy import SQLAlchemy
from datetime import datetime


db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    clerk_user_id = db.Column(db.String(128), unique=True, nullable=False)
    email = db.Column(db.String(255))
    role = db.Column(db.String(32), nullable=False)  # 'student', 'staff', 'management'
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<User id={self.id} clerk_user_id={self.clerk_user_id} email={self.email} role={self.role}>"
