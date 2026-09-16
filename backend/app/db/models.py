from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float
from sqlalchemy.sql import func
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    Date,
    DateTime,
    Float,
    LargeBinary,
    ForeignKey
)
from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    # Basic information
    full_name = Column(String(100), nullable=False)
    date_of_birth = Column(Date, nullable=True)
    phone_number = Column(String(20), nullable=True)

    # Account
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="student", nullable=False)

    # Education
    college = Column(String(200), nullable=True)
    education_level = Column(String(50), nullable=True)
    degree = Column(String(100), nullable=True)
    branch = Column(String(100), nullable=True)
    current_year = Column(String(30), nullable=True)
    semester = Column(String(30), nullable=True)

    # Learning preferences
    preferred_language = Column(String(50), nullable=True)
    learning_style = Column(String(50), nullable=True)
    academic_interests = Column(String(500), nullable=True)
    learning_goal = Column(String(500), nullable=True)
    daily_learning_time = Column(String(50), nullable=True)

    # Account status
    is_active = Column(Boolean, default=True)
    face_enrolled = Column(Boolean, default=False, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String(500), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )


class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(
        Integer,
        nullable=False
    )
    name = Column(String(150), nullable=False)
    description = Column(String(500), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)

    topic_id = Column(
        Integer,
        nullable=False
    )

    question_text = Column(
        String(1000),
        nullable=False
    )

    option_a = Column(
        String(500),
        nullable=False
    )

    option_b = Column(
        String(500),
        nullable=False
    )

    option_c = Column(
        String(500),
        nullable=False
    )

    option_d = Column(
        String(500),
        nullable=False
    )

    correct_answer = Column(
        String(1),
        nullable=False
    )

    difficulty = Column(
        String(20),
        default="medium",
        nullable=False
    )

    explanation = Column(
        String(1000),
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
class Attempt(Base):
    __tablename__ = "attempts"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    student_id = Column(
        Integer,
        nullable=False
    )

    question_id = Column(
        Integer,
        nullable=False
    )

    selected_answer = Column(
        String(1),
        nullable=False
    )

    is_correct = Column(
        Boolean,
        nullable=False
    )

    response_time = Column(
        Integer,
        nullable=True
    )

    hints_used = Column(
        Integer,
        default=0
    )

    attempt_number = Column(
        Integer,
        default=1
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
class StudentMastery(Base):
    __tablename__ = "student_mastery"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, nullable=False)
    topic_id = Column(Integer, nullable=False)

    mastery_probability = Column(
        Float,
        default=0.20,
        nullable=False
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
class FaceEmbedding(Base):
    __tablename__ = "face_embeddings"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    embedding = Column(LargeBinary, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
class ParentStudent(Base):
    __tablename__ = "parent_student"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    parent_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    student_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    relationship = Column(
        String(50),
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )