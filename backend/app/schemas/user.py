from pydantic import BaseModel, EmailStr
from datetime import date


class UserRegister(BaseModel):
    # Basic information
    full_name: str
    date_of_birth: date | None = None
    phone_number: str | None = None
    email: EmailStr
    password: str

    # Education
    college: str | None = None
    education_level: str | None = None
    degree: str | None = None
    branch: str | None = None
    current_year: str | None = None
    semester: str | None = None

    # Learning profile
    preferred_language: str | None = None
    learning_style: str | None = None
    academic_interests: str | None = None
    learning_goal: str | None = None
    daily_learning_time: str | None = None

class ParentRegister(BaseModel):
    full_name: str
    phone_number: str | None = None
    email: EmailStr
    password: str
    relationship: str | None = None

class ParentStudentLink(BaseModel):
    student_email: EmailStr
    relationship: str | None = None