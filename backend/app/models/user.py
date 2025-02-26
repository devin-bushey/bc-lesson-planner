from .database import db, BaseModel

class User(BaseModel):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    auth0_id = db.Column(db.String(128), unique=True, nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    name = db.Column(db.String(255))
    
    # Relationship with lesson plans
    lesson_plans = db.relationship('LessonPlan', back_populates='user', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<User {self.email}>' 