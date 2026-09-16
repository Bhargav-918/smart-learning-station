from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import (
    User,
    ParentStudent,
    Subject,
    Topic,
    Question,
    StudentMastery,
    Attempt
)
from app.core.security import get_current_user_id


router = APIRouter(
    prefix="/parent",
    tags=["Parent"]
)


@router.get("/students")
def get_linked_students(
    parent_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
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
            detail="Only parents can access this endpoint"
        )

    # -----------------------------------------
    # 2. Get linked students
    # -----------------------------------------

    links = (
        db.query(ParentStudent)
        .filter(
            ParentStudent.parent_id == parent_id
        )
        .all()
    )

    # -----------------------------------------
    # 3. Build student response
    # -----------------------------------------

    students = []

    for link in links:

        student = (
            db.query(User)
            .filter(
                User.id == link.student_id,
                User.role == "student"
            )
            .first()
        )

        if not student:
            continue

        students.append({
            "student_id": student.id,
            "full_name": student.full_name,
            "email": student.email,
            "relationship": link.relationship,
            "education_level": student.education_level,
            "degree": student.degree,
            "branch": student.branch,
            "current_year": student.current_year,
            "semester": student.semester
        })

    # -----------------------------------------
    # 4. Return response
    # -----------------------------------------

    return {
        "parent": {
            "id": parent.id,
            "full_name": parent.full_name,
            "email": parent.email
        },
        "students": students,
        "total_students": len(students)
    }
@router.get("/student/{student_id}/progress")
def get_student_progress(
    student_id: int,
    parent_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
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
            detail="Only parents can access this endpoint"
        )

    # -----------------------------------------
    # 2. Verify student is linked to this parent
    # -----------------------------------------

    link = (
        db.query(ParentStudent)
        .filter(
            ParentStudent.parent_id == parent_id,
            ParentStudent.student_id == student_id
        )
        .first()
    )

    if not link:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to view this student"
        )

    # -----------------------------------------
    # 3. Get student
    # -----------------------------------------

    student = (
        db.query(User)
        .filter(
            User.id == student_id,
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
    # 4. Get student's attempts
    # -----------------------------------------

    attempts = (
        db.query(Attempt)
        .filter(
            Attempt.student_id == student_id
        )
        .all()
    )

    total_questions = len(attempts)

    correct_answers = sum(
        1 for attempt in attempts
        if attempt.is_correct
    )

    accuracy = (
        (correct_answers / total_questions) * 100
        if total_questions > 0
        else 0
    )

    # -----------------------------------------
    # 5. Get mastery records
    # -----------------------------------------

    mastery_records = (
        db.query(StudentMastery)
        .filter(
            StudentMastery.student_id == student_id
        )
        .all()
    )

    if mastery_records:
        overall_mastery = (
            sum(
                record.mastery_probability
                for record in mastery_records
            )
            / len(mastery_records)
        ) * 100
    else:
        overall_mastery = 20.0

    # -----------------------------------------
    # 6. Determine learning level
    # -----------------------------------------

    if overall_mastery < 40:
        learning_level = "Beginner"
    elif overall_mastery < 70:
        learning_level = "Intermediate"
    else:
        learning_level = "Advanced"

    # -----------------------------------------
    # 7. Return progress
    # -----------------------------------------

    return {
        "student": {
            "id": student.id,
            "full_name": student.full_name,
            "email": student.email
        },
        "progress": {
            "overall_mastery": round(
                overall_mastery,
                2
            ),
            "learning_level": learning_level,
            "total_questions": total_questions,
            "correct_answers": correct_answers,
            "accuracy": round(
                accuracy,
                2
            )
        }
    }
@router.get("/student/{student_id}/knowledge-profile")
def get_student_knowledge_profile(
    student_id: int,
    parent_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    # --------------------------------------------------------
    # 1. Verify logged-in user is a parent
    # --------------------------------------------------------

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
            detail="Only parents can access this endpoint"
        )

    # --------------------------------------------------------
    # 2. Verify student is linked to this parent
    # --------------------------------------------------------

    link = (
        db.query(ParentStudent)
        .filter(
            ParentStudent.parent_id == parent_id,
            ParentStudent.student_id == student_id
        )
        .first()
    )

    if not link:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to view this student"
        )

    # --------------------------------------------------------
    # 3. Get student
    # --------------------------------------------------------

    student = (
        db.query(User)
        .filter(
            User.id == student_id,
            User.role == "student"
        )
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    # --------------------------------------------------------
    # 4. Get student's subjects
    #
    # Use the same curriculum logic as learning.py
    # --------------------------------------------------------

    from app.routes.learning import get_student_subjects

    subjects = get_student_subjects(
        student,
        db
    )

    if not subjects:
        return {
            "student": {
                "id": student.id,
                "name": student.full_name,
                "education_level": student.education_level,
                "degree": student.degree,
                "branch": student.branch,
                "current_year": student.current_year,
                "semester": student.semester
            },
            "message": "No subjects are available for this student."
        }

    allowed_subject_ids = {
        subject.id
        for subject in subjects
    }

    # --------------------------------------------------------
    # 5. Get attempts
    # --------------------------------------------------------

    attempts = (
        db.query(Attempt)
        .filter(
            Attempt.student_id == student_id
        )
        .all()
    )

    total_questions = len(attempts)

    correct_answers = sum(
        1
        for attempt in attempts
        if attempt.is_correct
    )

    accuracy = (
        (correct_answers / total_questions) * 100
        if total_questions > 0
        else 0
    )

    # --------------------------------------------------------
    # 6. Get applicable topics
    # --------------------------------------------------------

    topics = (
        db.query(Topic)
        .filter(
            Topic.subject_id.in_(
                allowed_subject_ids
            )
        )
        .all()
    )

    topic_ids = {
        topic.id
        for topic in topics
    }

    # --------------------------------------------------------
    # 7. Get mastery records
    # --------------------------------------------------------

    mastery_records = (
        db.query(StudentMastery)
        .filter(
            StudentMastery.student_id == student_id,
            StudentMastery.topic_id.in_(topic_ids)
        )
        .all()
    )

    mastery_map = {
        record.topic_id: record.mastery_probability
        for record in mastery_records
    }

    # --------------------------------------------------------
    # 8. Topic-wise knowledge profile
    # --------------------------------------------------------

    topic_progress = []

    for topic in topics:

        mastery = mastery_map.get(
            topic.id,
            0.20
        )

        if mastery < 0.40:
            level = "Needs Improvement"

        elif mastery < 0.70:
            level = "Developing"

        else:
            level = "Strong"

        subject = (
            db.query(Subject)
            .filter(
                Subject.id == topic.subject_id
            )
            .first()
        )

        topic_progress.append({
            "topic_id": topic.id,
            "topic": topic.name,
            "subject_id": topic.subject_id,
            "subject": (
                subject.name
                if subject
                else "Unknown"
            ),
            "mastery": round(
                mastery,
                3
            ),
            "mastery_percentage": round(
                mastery * 100,
                1
            ),
            "level": level
        })

    # --------------------------------------------------------
    # 9. Classify topics
    # --------------------------------------------------------

    strongest_topics = [
        item
        for item in topic_progress
        if item["mastery"] >= 0.70
    ]

    developing_topics = [
        item
        for item in topic_progress
        if 0.40 <= item["mastery"] < 0.70
    ]

    weak_topics = [
        item
        for item in topic_progress
        if item["mastery"] < 0.40
    ]

    # --------------------------------------------------------
    # 10. Sort topics
    # --------------------------------------------------------

    strongest_topics = sorted(
        strongest_topics,
        key=lambda item: item["mastery"],
        reverse=True
    )[:5]

    developing_topics = sorted(
        developing_topics,
        key=lambda item: item["mastery"],
        reverse=True
    )[:5]

    weak_topics = sorted(
        weak_topics,
        key=lambda item: item["mastery"]
    )[:5]

    # --------------------------------------------------------
    # 11. Subject-wise profile
    # --------------------------------------------------------

    subject_progress = []

    for subject in subjects:

        subject_topics = [
            item
            for item in topic_progress
            if item["subject_id"] == subject.id
        ]

        if subject_topics:

            subject_mastery = (
                sum(
                    item["mastery"]
                    for item in subject_topics
                )
                / len(subject_topics)
            )

        else:
            subject_mastery = 0.20

        subject_progress.append({
            "subject_id": subject.id,
            "subject": subject.name,
            "mastery": round(
                subject_mastery,
                3
            ),
            "mastery_percentage": round(
                subject_mastery * 100,
                1
            )
        })

    # --------------------------------------------------------
    # 12. Overall mastery
    # --------------------------------------------------------

    if topic_progress:

        overall_mastery = (
            sum(
                item["mastery"]
                for item in topic_progress
            )
            / len(topic_progress)
        )

    else:
        overall_mastery = 0.20

    # --------------------------------------------------------
    # 13. Learning level
    # --------------------------------------------------------

    if overall_mastery < 0.40:
        learning_level = "Beginner"

    elif overall_mastery < 0.70:
        learning_level = "Intermediate"

    elif overall_mastery < 0.85:
        learning_level = "Advanced"

    else:
        learning_level = "Expert"

    # --------------------------------------------------------
    # 14. Recommended focus
    # --------------------------------------------------------

    if weak_topics:
        recommended_focus = weak_topics[0]

    elif developing_topics:
        recommended_focus = developing_topics[0]

    elif strongest_topics:
        recommended_focus = strongest_topics[0]

    else:
        recommended_focus = None

    # --------------------------------------------------------
    # 15. Return parent knowledge profile
    # --------------------------------------------------------

    return {

        "student": {
            "id": student.id,
            "name": student.full_name,
            "education_level": student.education_level,
            "degree": student.degree,
            "branch": student.branch,
            "current_year": student.current_year,
            "semester": student.semester
        },

        "knowledge_summary": {

            "overall_mastery": round(
                overall_mastery * 100,
                1
            ),

            "learning_level": learning_level,

            "questions_answered": total_questions,

            "correct_answers": correct_answers,

            "accuracy": round(
                accuracy,
                1
            ),

            "topics_evaluated": len(
                topic_progress
            )
        },

        "strongest_topics": strongest_topics,

        "developing_topics": developing_topics,

        "weak_topics": weak_topics,

        "recommended_focus": recommended_focus,

        "subject_progress": subject_progress,

        "topic_progress": topic_progress
    }
@router.get("/student/{student_id}/activity")
def get_student_activity(
    student_id: int,
    parent_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    # Verify logged-in user is a parent
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
            detail="Only parents can access this endpoint"
        )

    # Verify student is linked to this parent
    link = (
        db.query(ParentStudent)
        .filter(
            ParentStudent.parent_id == parent_id,
            ParentStudent.student_id == student_id
        )
        .first()
    )

    if not link:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to view this student"
        )

    # Get student
    student = (
        db.query(User)
        .filter(
            User.id == student_id,
            User.role == "student"
        )
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    # Get recent attempts
    attempts = (
        db.query(Attempt)
        .filter(
            Attempt.student_id == student_id
        )
        .order_by(
            Attempt.created_at.desc()
        )
        .limit(20)
        .all()
    )

    activities = []

    for attempt in attempts:

        question = (
            db.query(Question)
            .filter(
                Question.id == attempt.question_id
            )
            .first()
        )

        topic = None
        subject = None

        if question:
            topic = (
                db.query(Topic)
                .filter(
                    Topic.id == question.topic_id
                )
                .first()
            )

            if topic:
                subject = (
                    db.query(Subject)
                    .filter(
                        Subject.id == topic.subject_id
                    )
                    .first()
                )

        activities.append({
            "attempt_id": attempt.id,
            "question_id": attempt.question_id,
            "question": question.question_text if question else None,
            "topic": topic.name if topic else None,
            "subject": subject.name if subject else None,
            "selected_answer": attempt.selected_answer,
            "correct": attempt.is_correct,
            "response_time": attempt.response_time,
            "hints_used": attempt.hints_used,
            "attempt_number": attempt.attempt_number,
            "created_at": attempt.created_at
        })

    return {
        "student": {
            "id": student.id,
            "name": student.full_name,
            "email": student.email
        },
        "total_activities": len(activities),
        "activities": activities
    }