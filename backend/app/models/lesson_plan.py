from .database import db, BaseModel
from datetime import datetime
from typing import Optional, Dict, Any
from uuid import uuid4

class LessonPlan(BaseModel):
    __tablename__ = 'lesson_plans'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    grade_level = db.Column(db.String(50), nullable=False)
    subject = db.Column(db.String(100), nullable=False)
    
    # Foreign key to user
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    user = db.relationship('User', back_populates='lesson_plans')
    
    # Metadata stored as JSON
    plan_metadata = db.Column(db.JSON, default=dict)

    def __repr__(self):
        return f'<LessonPlan {self.title}>'

    def to_dict(self):
        """Convert model to dictionary with formatted dates"""
        data = super().to_dict()
        # Convert datetime objects to ISO format strings
        data['created_at'] = self.created_at.isoformat() if self.created_at else None
        data['updated_at'] = self.updated_at.isoformat() if self.updated_at else None
        # Rename plan_metadata to metadata in the output for API consistency
        data['metadata'] = data.pop('plan_metadata', {})
        return data

    def __init__(
        self,
        title: str,
        content: str,
        grade_level: str,
        subject: str,
        user_id: int,
        id: Optional[int] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        super().__init__()
        if id is not None:
            self.id = id
        self.title = title
        self.content = content
        self.grade_level = grade_level
        self.subject = subject
        self.user_id = user_id
        if created_at:
            self.created_at = created_at
        if updated_at:
            self.updated_at = updated_at
        self.plan_metadata = metadata or {}

    @staticmethod
    def from_dict(data: dict) -> 'LessonPlan':
        return LessonPlan(
            id=data.get('id'),
            title=data.get('title'),
            content=data.get('content'),
            grade_level=data.get('grade_level'),
            subject=data.get('subject'),
            user_id=data.get('user_id'),
            created_at=datetime.fromisoformat(data.get('created_at')) if data.get('created_at') else None,
            updated_at=datetime.fromisoformat(data.get('updated_at')) if data.get('updated_at') else None,
            metadata=data.get('metadata', {})
        ) 