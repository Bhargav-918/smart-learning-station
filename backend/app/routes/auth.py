from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    File,
    UploadFile,
    Form
)
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import date
from pathlib import Path
import shutil

import cv2
import numpy as np

from app.db.database import get_db

from app.schemas.user import (
    UserRegister,
    ParentStudentLink
)

from app.db.models import (
    User,
    FaceEmbedding,
    ParentStudent
)

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user_id
)

from app.services.face_service import (
    create_embedding,
    embedding_to_bytes,
    bytes_to_embedding,
    compare_embeddings
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# =========================================================
# STUDENT REGISTRATION
# =========================================================

@router.post("/register")
def register(
    user: UserRegister,
    db: Session = Depends(get_db)
):
    existing_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    new_user = User(
        # Basic information
        full_name=user.full_name,
        date_of_birth=user.date_of_birth,
        phone_number=user.phone_number,
        email=user.email,
        password_hash=hash_password(user.password),

        # Education
        college=user.college,
        education_level=user.education_level,
        degree=user.degree,
        branch=user.branch,
        current_year=user.current_year,
        semester=user.semester,

        # Learning profile
        preferred_language=user.preferred_language,
        learning_style=user.learning_style,
        academic_interests=user.academic_interests,
        learning_goal=user.learning_goal,
        daily_learning_time=user.daily_learning_time,

        role="student"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "Registration successful",
        "user_id": new_user.id
    }


# =========================================================
# STUDENT LOGIN
# =========================================================

@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    db_user = (
        db.query(User)
        .filter(
            User.email == form_data.username,
            User.role == "student"
        )
        .first()
    )

    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        form_data.password,
        db_user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not db_user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Student account is inactive"
        )

    token = create_access_token(
        {
            "sub": str(db_user.id)
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }


# =========================================================
# DEBUG USER
# =========================================================

@router.get("/debug-user")
def debug_user(
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.email == "kb4765558@gmail.com")
        .first()
    )

    if not user:
        return {
            "found": False
        }

    return {
        "found": True,
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "active": user.is_active
    }


# =========================================================
# CURRENT USER
# =========================================================

@router.get("/me")
def get_current_user(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role
    }


# =========================================================
# PROFILE UPDATE MODEL
# =========================================================

class ProfileUpdate(BaseModel):

    # Personal Information
    full_name: str | None = None
    date_of_birth: date | None = None
    phone_number: str | None = None

    # Education
    college: str | None = None
    education_level: str | None = None
    degree: str | None = None
    branch: str | None = None
    current_year: str | None = None
    semester: str | None = None

    # Learning Profile
    preferred_language: str | None = None
    learning_style: str | None = None
    academic_interests: str | None = None
    learning_goal: str | None = None
    daily_learning_time: str | None = None


# =========================================================
# GET PROFILE
# =========================================================

@router.get("/profile")
def get_profile(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {
        "id": user.id,

        # Personal Information
        "full_name": user.full_name,
        "date_of_birth": user.date_of_birth,
        "phone_number": user.phone_number,
        "email": user.email,

        # Education
        "college": user.college,
        "education_level": user.education_level,
        "degree": user.degree,
        "branch": user.branch,
        "current_year": user.current_year,
        "semester": user.semester,

        # Learning Profile
        "preferred_language": user.preferred_language,
        "learning_style": user.learning_style,
        "academic_interests": user.academic_interests,
        "learning_goal": user.learning_goal,
        "daily_learning_time": user.daily_learning_time,

        "role": user.role
    }


# =========================================================
# UPDATE PROFILE
# =========================================================

@router.put("/profile")
def update_profile(
    profile: ProfileUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    update_data = profile.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)

    return {
        "message": "Profile updated successfully"
    }


# =========================================================
# FACE ENROLLMENT
# =========================================================

@router.post("/face-enroll")
def enroll_face(
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Validate file type
    allowed_types = {
        "image/jpeg",
        "image/png",
        "image/webp"
    }

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG or WEBP images are allowed"
        )

    # Create face storage directory
    face_dir = Path("uploads/faces")

    face_dir.mkdir(
        parents=True,
        exist_ok=True
    )

    # One face image per student
    face_path = face_dir / f"{user_id}.jpg"

    # Save uploaded image
    with open(face_path, "wb") as buffer:
        shutil.copyfileobj(
            file.file,
            buffer
        )

    # Mark enrollment complete
    user.face_enrolled = True

    db.commit()

    return {
        "message": "Face enrolled successfully",
        "user_id": user.id,
        "face_enrolled": True
    }


# =========================================================
# STUDENT REGISTRATION WITH FACE
# =========================================================

@router.post("/register-with-face")
async def register_with_face(
    data: str = Form(...),
    face: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    # Parse registration JSON
    try:
        user_data = UserRegister.model_validate_json(data)

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid registration data"
        )

    # Check email
    existing_user = (
        db.query(User)
        .filter(User.email == user_data.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Validate face file
    allowed_types = {
        "image/jpeg",
        "image/png",
        "image/webp"
    }

    if face.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Face image must be JPG, PNG or WEBP"
        )

    # -----------------------------------------
    # Read uploaded image
    # -----------------------------------------

    image_bytes = await face.read()

    image_array = np.frombuffer(
        image_bytes,
        dtype=np.uint8
    )

    image = cv2.imdecode(
        image_array,
        cv2.IMREAD_COLOR
    )

    if image is None:
        raise HTTPException(
            status_code=400,
            detail="Unable to read face image"
        )

    # -----------------------------------------
    # Detect face + create SFace embedding
    # -----------------------------------------

    try:
        embedding = create_embedding(image)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Face processing failed: {str(e)}"
        )

    if embedding is None:
        raise HTTPException(
            status_code=400,
            detail=(
                "No clear face detected. "
                "Please look directly at the camera "
                "and capture again."
            )
        )

    # Convert embedding to PostgreSQL BYTEA
    embedding_bytes = embedding_to_bytes(
        embedding
    )

    # -----------------------------------------
    # Create student
    # -----------------------------------------

    new_user = User(
        full_name=user_data.full_name,
        date_of_birth=user_data.date_of_birth,
        phone_number=user_data.phone_number,
        email=user_data.email,

        password_hash=hash_password(
            user_data.password
        ),

        college=user_data.college,
        education_level=user_data.education_level,
        degree=user_data.degree,
        branch=user_data.branch,
        current_year=user_data.current_year,
        semester=user_data.semester,

        preferred_language=user_data.preferred_language,
        learning_style=user_data.learning_style,
        academic_interests=user_data.academic_interests,
        learning_goal=user_data.learning_goal,
        daily_learning_time=user_data.daily_learning_time,

        role="student",
        face_enrolled=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # -----------------------------------------
    # Save face embedding
    # -----------------------------------------

    face_record = FaceEmbedding(
        student_id=new_user.id,
        embedding=embedding_bytes
    )

    db.add(face_record)

    # -----------------------------------------
    # Save original face image
    # -----------------------------------------

    face_dir = Path("uploads/faces")

    face_dir.mkdir(
        parents=True,
        exist_ok=True
    )

    face_path = face_dir / f"{new_user.id}.jpg"

    try:

        with open(face_path, "wb") as buffer:
            buffer.write(image_bytes)

    except Exception:

        db.rollback()

        db.delete(new_user)
        db.commit()

        raise HTTPException(
            status_code=500,
            detail="Unable to save face data"
        )

    db.commit()

    return {
        "message": (
            "Registration and face enrollment successful"
        ),
        "user_id": new_user.id,
        "face_enrolled": True
    }


# =========================================================
# FACE LOGIN
# =========================================================

@router.post("/face-login")
async def face_login(
    face: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    # -----------------------------------------
    # 1. Validate image
    # -----------------------------------------

    allowed_types = {
        "image/jpeg",
        "image/png",
        "image/webp"
    }

    if face.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Face image must be JPG, PNG or WEBP"
        )

    # -----------------------------------------
    # 2. Read uploaded image
    # -----------------------------------------

    image_bytes = await face.read()

    image_array = np.frombuffer(
        image_bytes,
        dtype=np.uint8
    )

    image = cv2.imdecode(
        image_array,
        cv2.IMREAD_COLOR
    )

    if image is None:
        raise HTTPException(
            status_code=400,
            detail="Unable to read face image"
        )

    # -----------------------------------------
    # 3. Generate live face embedding
    # -----------------------------------------

    try:

        live_embedding = create_embedding(
            image
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Face processing failed: {str(e)}"
        )

    if live_embedding is None:

        raise HTTPException(
            status_code=400,
            detail=(
                "No clear face detected. "
                "Please look directly at the camera "
                "and try again."
            )
        )

    # -----------------------------------------
    # 4. Get all enrolled face embeddings
    # -----------------------------------------

    enrolled_faces = (
        db.query(FaceEmbedding)
        .all()
    )

    if not enrolled_faces:

        raise HTTPException(
            status_code=404,
            detail="No face-enrolled students found."
        )

    # -----------------------------------------
    # 5. Compare live face with enrolled faces
    # -----------------------------------------

    best_match = None
    best_similarity = -1.0

    for record in enrolled_faces:

        try:

            enrolled_embedding = bytes_to_embedding(
                record.embedding
            )

            similarity = compare_embeddings(
                enrolled_embedding,
                live_embedding
            )

            print(
                "FACE SIMILARITY:",
                similarity
            )

            if similarity > best_similarity:

                best_similarity = similarity
                best_match = record

        except Exception as e:

            print(
                "FACE COMPARISON ERROR:",
                e
            )

            continue

    # -----------------------------------------
    # 6. Verification threshold
    # -----------------------------------------

    FACE_THRESHOLD = 0.363

    print(
        "BEST FACE SIMILARITY:",
        best_similarity
    )

    print(
        "FACE THRESHOLD:",
        FACE_THRESHOLD
    )

    if (
        best_match is None
        or best_similarity < FACE_THRESHOLD
    ):

        raise HTTPException(
            status_code=401,
            detail=(
                "Face not recognized. "
                "Please use email and password."
            )
        )

    # -----------------------------------------
    # 7. Get matched student
    # -----------------------------------------

    student = (
        db.query(User)
        .filter(
            User.id == best_match.student_id
        )
        .first()
    )

    if not student:

        raise HTTPException(
            status_code=404,
            detail="Student account not found."
        )

    if not student.is_active:

        raise HTTPException(
            status_code=403,
            detail="Student account is inactive."
        )

    # -----------------------------------------
    # 8. Create JWT
    # -----------------------------------------

    token = create_access_token(
        {
            "sub": str(student.id)
        }
    )

    return {
        "message": "Face verification successful",
        "access_token": token,
        "token_type": "bearer",
        "user_id": student.id,
        "full_name": student.full_name,
        "similarity": round(
            best_similarity,
            4
        )
    }


# =========================================================
# PARENT REGISTRATION
# =========================================================
#
# IMPORTANT:
# This endpoint accepts multipart/form-data because
# ParentRegister.jsx sends FormData.
#
# There must be ONLY ONE /parent/register endpoint.
# =========================================================

@router.post("/parent/register")
def parent_register(
    full_name: str = Form(...),
    email: str = Form(...),
    phone_number: str = Form(None),
    password: str = Form(...),
    db: Session = Depends(get_db)
):

    # -----------------------------------------
    # 1. Check whether email already exists
    # -----------------------------------------

    existing_user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if existing_user:

        raise HTTPException(
            status_code=400,
            detail=(
                "An account with this email already exists"
            )
        )

    # -----------------------------------------
    # 2. Validate password
    # -----------------------------------------

    if len(password) < 6:

        raise HTTPException(
            status_code=400,
            detail="Password must be at least 6 characters"
        )

    # -----------------------------------------
    # 3. Create parent
    # -----------------------------------------

    parent = User(
        full_name=full_name,
        email=email,
        phone_number=phone_number,
        password_hash=hash_password(password),
        role="parent",
        is_active=True
    )

    # -----------------------------------------
    # 4. Save parent
    # -----------------------------------------

    db.add(parent)
    db.commit()
    db.refresh(parent)

    # -----------------------------------------
    # 5. Return response
    # -----------------------------------------

    return {
        "message": "Parent registration successful",
        "parent": {
            "id": parent.id,
            "full_name": parent.full_name,
            "email": parent.email,
            "role": parent.role
        }
    }


# =========================================================
# PARENT LOGIN
# =========================================================

@router.post("/parent/login")
def parent_login(
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):

    parent = (
        db.query(User)
        .filter(
            User.email == email,
            User.role == "parent"
        )
        .first()
    )

    if not parent:

        raise HTTPException(
            status_code=401,
            detail="Invalid parent email or password"
        )

    if not verify_password(
        password,
        parent.password_hash
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid parent email or password"
        )

    if not parent.is_active:

        raise HTTPException(
            status_code=403,
            detail="Parent account is inactive"
        )

    access_token = create_access_token(
        {
            "sub": str(parent.id),
            "role": "parent"
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "parent": {
            "id": parent.id,
            "full_name": parent.full_name,
            "email": parent.email,
            "role": parent.role
        }
    }


# =========================================================
# LINK STUDENT TO PARENT
# =========================================================

@router.post("/parent/link-student")
def link_student_to_parent(
    data: ParentStudentLink,
    db: Session = Depends(get_db),
    parent_id: int = Depends(get_current_user_id)
):

    # -----------------------------------------
    # 1. Verify logged-in user is a parent
    # -----------------------------------------

    parent = (
        db.query(User)
        .filter(
            User.id == parent_id,
            User.role == "parent"
        )
        .first()
    )

    if not parent:

        raise HTTPException(
            status_code=403,
            detail="Only parents can link students"
        )

    # -----------------------------------------
    # 2. Find student
    # -----------------------------------------

    student = (
        db.query(User)
        .filter(
            User.email == data.student_email,
            User.role == "student"
        )
        .first()
    )

    if not student:

        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    # -----------------------------------------
    # 3. Check whether already linked
    # -----------------------------------------

    existing_link = (
        db.query(ParentStudent)
        .filter(
            ParentStudent.parent_id == parent_id,
            ParentStudent.student_id == student.id
        )
        .first()
    )

    if existing_link:

        raise HTTPException(
            status_code=400,
            detail="Student is already linked to this parent"
        )

    # -----------------------------------------
    # 4. Create relationship
    # -----------------------------------------

    link = ParentStudent(
        parent_id=parent_id,
        student_id=student.id,
        relationship=data.relationship
    )

    db.add(link)
    db.commit()
    db.refresh(link)

    return {
        "message": "Student linked successfully",
        "student": {
            "id": student.id,
            "full_name": student.full_name,
            "email": student.email
        },
        "relationship": link.relationship
    }