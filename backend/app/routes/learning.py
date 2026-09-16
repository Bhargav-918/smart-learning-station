from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import (
    User,
    Subject,
    Topic,
    StudentMastery,
    Attempt
)
from app.core.security import get_current_user_id
from app.ai.adaptive_engine import get_adaptive_recommendation


router = APIRouter(
    prefix="/learning",
    tags=["Learning"]
)


# ============================================================
# Student curriculum mapping
# ============================================================

SCHOOL_SUBJECTS = {
    "maths",
    "mathematics",
    "physics",
    "chemistry",
    "biology",
    "english",
    "social science",
    "social studies",
    "computer science"
}


COLLEGE_BRANCH_SUBJECTS = {

    "cse": {
        "data structures",
        "data structures and algorithms",
        "artificial intelligence",
        "machine learning",
        "computer networks",
        "cyber security",
        "python programming",
        "database management systems",
        "database management",
        "operating systems",
        "computer organization",
        "software engineering",
        "web development"
    },

    "ece": {
        "digital electronics",
        "analog electronics",
        "signals and systems",
        "communication systems",
        "microprocessors",
        "embedded systems",
        "control systems"
    },

    "eee": {
        "electrical circuits",
        "power systems",
        "power electronics",
        "control systems",
        "electrical machines",
        "digital electronics"
    },

    "mechanical": {
        "engineering mechanics",
        "thermodynamics",
        "fluid mechanics",
        "machine design",
        "manufacturing technology",
        "heat transfer"
    },

    "civil": {
        "engineering mechanics",
        "strength of materials",
        "structural analysis",
        "surveying",
        "geotechnical engineering",
        "concrete technology"
    }
}


# ============================================================
# Normalize text
# ============================================================

def normalize(value):
    if not value:
        return ""

    return value.strip().lower()


# ============================================================
# Get subjects applicable to a student
# ============================================================

def get_student_subjects(
    student,
    db
):

    education_level = normalize(
        student.education_level
    )

    degree = normalize(
        student.degree
    )

    branch = normalize(
        student.branch
    )

    subjects = db.query(Subject).all()

    eligible_subjects = []


    # ========================================================
    # SCHOOL STUDENT
    # ========================================================

    if education_level in {
        "school",
        "school student",
        "secondary school",
        "higher secondary"
    }:

        for subject in subjects:

            subject_name = normalize(
                subject.name
            )

            if subject_name in SCHOOL_SUBJECTS:

                eligible_subjects.append(subject)

        return eligible_subjects


    # ========================================================
    # B.TECH / ENGINEERING STUDENT
    # ========================================================

    is_btech = (
        "b.tech" in degree
        or "btech" in degree
        or "engineering" in degree
        or degree == "b.e"
        or degree == "be"
    )


    if is_btech:

        # ----------------------------------------------------
        # Normalize common branch names
        # ----------------------------------------------------

        if (
            branch in {
                "cse",
                "computer science",
                "computer science and engineering",
                "computer science & engineering"
            }
        ):

            branch_key = "cse"

        elif (
            branch in {
                "ece",
                "electronics and communication engineering",
                "electronics & communication engineering"
            }
        ):

            branch_key = "ece"

        elif (
            branch in {
                "eee",
                "electrical and electronics engineering",
                "electrical & electronics engineering"
            }
        ):

            branch_key = "eee"

        elif (
            branch in {
                "mechanical",
                "mechanical engineering"
            }
        ):

            branch_key = "mechanical"

        elif (
            branch in {
                "civil",
                "civil engineering"
            }
        ):

            branch_key = "civil"

        else:

            branch_key = branch


        branch_subjects = (
            COLLEGE_BRANCH_SUBJECTS.get(
                branch_key,
                set()
            )
        )


        for subject in subjects:

            subject_name = normalize(
                subject.name
            )

            if subject_name in branch_subjects:

                eligible_subjects.append(subject)


        return eligible_subjects


    # ========================================================
    # OTHER UNDERGRADUATE / COLLEGE STUDENTS
    # ========================================================

    if education_level in {
        "college",
        "undergraduate",
        "postgraduate",
        "university"
    }:

        for subject in subjects:

            subject_name = normalize(
                subject.name
            )

            if subject_name not in SCHOOL_SUBJECTS:

                eligible_subjects.append(subject)


        return eligible_subjects


    # ========================================================
    # FALLBACK
    # ========================================================

    return []


# ============================================================
# Get all subjects applicable to current student
# ============================================================

@router.get("/subjects")
def get_subjects(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):

    student = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not student:
        return []


    subjects = get_student_subjects(
        student,
        db
    )


    return subjects


# ============================================================
# Get topics for a subject
# ============================================================

@router.get("/subjects/{subject_id}/topics")
def get_topics(
    subject_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):

    student = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not student:
        return []


    # --------------------------------------------------------
    # Check whether subject belongs to student
    # --------------------------------------------------------

    allowed_subjects = get_student_subjects(
        student,
        db
    )

    allowed_subject_ids = {
        subject.id
        for subject in allowed_subjects
    }


    if subject_id not in allowed_subject_ids:

        return []


    topics = (
        db.query(Topic)
        .filter(
            Topic.subject_id == subject_id
        )
        .all()
    )


    return topics


# ============================================================
# Dashboard
# ============================================================

@router.get("/dashboard")
def get_dashboard(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):

    # --------------------------------------------------------
    # Get student
    # --------------------------------------------------------

    student = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not student:

        return {
            "message": "Student profile not found."
        }


    # --------------------------------------------------------
    # Get only student's subjects
    # --------------------------------------------------------

    subjects = get_student_subjects(
        student,
        db
    )

    subjects_count = len(subjects)


    # --------------------------------------------------------
    # Student mastery
    # --------------------------------------------------------

    mastery_records = (
        db.query(StudentMastery)
        .filter(
            StudentMastery.student_id == user_id
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
        )

    else:

        overall_mastery = 0.0


    # --------------------------------------------------------
    # Attempts
    # --------------------------------------------------------

    attempts = (
        db.query(Attempt)
        .filter(
            Attempt.student_id == user_id
        )
        .all()
    )

    questions_answered = len(attempts)


    # --------------------------------------------------------
    # Learning streak
    # --------------------------------------------------------

    learning_dates = set()

    for attempt in attempts:

        if attempt.created_at:

            learning_dates.add(
                attempt.created_at.date()
            )


    streak = 0

    current_day = date.today()

    while current_day in learning_dates:

        streak += 1

        current_day -= timedelta(days=1)


    # --------------------------------------------------------
    # Subject-wise mastery
    # --------------------------------------------------------

    subject_progress = []


    for subject in subjects:

        topics = (
            db.query(Topic)
            .filter(
                Topic.subject_id == subject.id
            )
            .all()
        )

        topic_mastery_values = []


        for topic in topics:

            mastery = (
                db.query(StudentMastery)
                .filter(
                    StudentMastery.student_id == user_id,
                    StudentMastery.topic_id == topic.id
                )
                .first()
            )

            if mastery:

                topic_mastery_values.append(
                    mastery.mastery_probability
                )


        if topic_mastery_values:

            mastery_percentage = (
                sum(topic_mastery_values)
                / len(topic_mastery_values)
            ) * 100

        else:

            mastery_percentage = 0.0


        subject_progress.append({

            "subject_id": subject.id,

            "subject_name": subject.name,

            "mastery_percentage": round(
                mastery_percentage,
                1
            )

        })


    # --------------------------------------------------------
    # Return dashboard
    # --------------------------------------------------------

    return {

        "student_name": student.full_name,

        "education_level": student.education_level,

        "degree": student.degree,

        "branch": student.branch,

        "current_year": student.current_year,

        "semester": student.semester,

        "subjects_count": subjects_count,

        "overall_mastery": round(
            overall_mastery * 100,
            1
        ),

        "assessments_completed": questions_answered,

        "learning_streak": streak,

        "subjects": [
            {
                "id": subject.id,
                "name": subject.name
            }
            for subject in subjects
        ],

        "subject_progress": subject_progress
    }


# ============================================================
# Student progress
# ============================================================

@router.get("/progress")
def get_progress(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):

    # --------------------------------------------------------
    # Attempts
    # --------------------------------------------------------

    attempts = (
        db.query(Attempt)
        .filter(
            Attempt.student_id == user_id
        )
        .order_by(
            Attempt.created_at.asc()
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
    # Mastery
    # --------------------------------------------------------

    mastery_records = (
        db.query(StudentMastery)
        .filter(
            StudentMastery.student_id == user_id
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

        overall_mastery = 0


    # --------------------------------------------------------
    # Learning streak
    # --------------------------------------------------------

    learning_dates = set()

    for attempt in attempts:

        if attempt.created_at:

            learning_dates.add(
                attempt.created_at.date()
            )


    streak = 0

    current_day = date.today()

    while current_day in learning_dates:

        streak += 1

        current_day -= timedelta(days=1)


    # --------------------------------------------------------
    # Student subjects
    # --------------------------------------------------------

    student = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    subjects = get_student_subjects(
        student,
        db
    )


    # --------------------------------------------------------
    # Subject progress
    # --------------------------------------------------------

    subject_progress = []


    for subject in subjects:

        topics = (
            db.query(Topic)
            .filter(
                Topic.subject_id == subject.id
            )
            .all()
        )

        topic_values = []


        for topic in topics:

            mastery = (
                db.query(StudentMastery)
                .filter(
                    StudentMastery.student_id == user_id,
                    StudentMastery.topic_id == topic.id
                )
                .first()
            )

            if mastery:

                topic_values.append(
                    mastery.mastery_probability
                )


        if topic_values:

            subject_mastery = (
                sum(topic_values)
                / len(topic_values)
            ) * 100

        else:

            subject_mastery = 0


        subject_progress.append({

            "subject_id": subject.id,

            "subject_name": subject.name,

            "mastery_percentage": round(
                subject_mastery,
                1
            )

        })


    # --------------------------------------------------------
    # Topic progress
    # --------------------------------------------------------

    topic_progress = []


    allowed_subject_ids = {
        subject.id
        for subject in subjects
    }


    for record in mastery_records:

        topic = (
            db.query(Topic)
            .filter(
                Topic.id == record.topic_id
            )
            .first()
        )

        if not topic:
            continue


        if topic.subject_id not in allowed_subject_ids:
            continue


        subject = (
            db.query(Subject)
            .filter(
                Subject.id == topic.subject_id
            )
            .first()
        )


        topic_progress.append({

            "topic_id": topic.id,

            "topic_name": topic.name,

            "subject_name": (
                subject.name
                if subject
                else "Unknown"
            ),

            "mastery_percentage": round(
                record.mastery_probability * 100,
                1
            )

        })


    # --------------------------------------------------------
    # Return progress
    # --------------------------------------------------------

    return {

        "overall_mastery": round(
            overall_mastery,
            1
        ),

        "questions_answered": total_questions,

        "correct_answers": correct_answers,

        "accuracy": round(
            accuracy,
            1
        ),

        "learning_streak": streak,

        "subject_progress": subject_progress,

        "topic_progress": topic_progress

    }


# ============================================================
# Adaptive recommendation
# ============================================================

@router.get("/recommendation")
def get_recommendation(

    user_id: int = Depends(
        get_current_user_id
    ),

    db: Session = Depends(get_db)

):

    # --------------------------------------------------------
    # Get student
    # --------------------------------------------------------

    student = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )


    if not student:

        return {
            "message": "Student profile not found."
        }


    # --------------------------------------------------------
    # Get only applicable subjects
    # --------------------------------------------------------

    subjects = get_student_subjects(
        student,
        db
    )


    if not subjects:

        return {
            "message": (
                "No subjects are available "
                "for your current education profile."
            )
        }


    allowed_subject_ids = {
        subject.id
        for subject in subjects
    }


    # --------------------------------------------------------
    # Get only applicable topics
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


    if not topics:

        return {
            "message": (
                "No learning topics are available "
                "for your subjects yet."
            )
        }


    # --------------------------------------------------------
    # Find mastery
    # --------------------------------------------------------

    topic_data = []


    for topic in topics:

        mastery_record = (
            db.query(StudentMastery)
            .filter(
                StudentMastery.student_id == user_id,

                StudentMastery.topic_id == topic.id
            )
            .first()
        )


        # New topic starts with BKT prior of 20%

        if mastery_record:

            mastery = (
                mastery_record.mastery_probability
            )

            attempted = True

        else:

            mastery = 0.20

            attempted = False


        topic_data.append({

            "topic": topic,

            "mastery": mastery,

            "attempted": attempted

        })


    # --------------------------------------------------------
    # Select weakest topic
    # --------------------------------------------------------

    weakest = min(

        topic_data,

        key=lambda item: item["mastery"]

    )


    topic = weakest["topic"]

    mastery = weakest["mastery"]


    # --------------------------------------------------------
    # Adaptive engine
    # --------------------------------------------------------

    recommendation = (
        get_adaptive_recommendation(
            mastery
        )
    )


    # --------------------------------------------------------
    # Subject
    # --------------------------------------------------------

    subject = (
        db.query(Subject)
        .filter(
            Subject.id == topic.subject_id
        )
        .first()
    )


    # --------------------------------------------------------
    # Return recommendation
    # --------------------------------------------------------

    return {

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

        "difficulty": (
            recommendation["difficulty"]
        ),

        "action": (
            recommendation["action"]
        ),

        "reason": (
            recommendation["reason"]
        ),

        "attempted": weakest["attempted"]

    }
# ============================================================
# Student Knowledge Profile
# ============================================================

@router.get("/knowledge-profile")
def get_knowledge_profile(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):

    # --------------------------------------------------------
    # Get student
    # --------------------------------------------------------

    student = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not student:

        return {
            "message": "Student profile not found."
        }


    # --------------------------------------------------------
    # Get student's applicable subjects
    # --------------------------------------------------------

    subjects = get_student_subjects(
        student,
        db
    )

    if not subjects:

        return {
            "message": (
                "No subjects are available "
                "for your current education profile."
            )
        }


    allowed_subject_ids = {
        subject.id
        for subject in subjects
    }


    # --------------------------------------------------------
    # Get attempts
    # --------------------------------------------------------

    attempts = (
        db.query(Attempt)
        .filter(
            Attempt.student_id == user_id
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
    # Get applicable topics
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
    # Get mastery records
    # --------------------------------------------------------

    mastery_records = (
        db.query(StudentMastery)
        .filter(
            StudentMastery.student_id == user_id,

            StudentMastery.topic_id.in_(
                topic_ids
            )
        )
        .all()
    )


    mastery_map = {
        record.topic_id: record.mastery_probability
        for record in mastery_records
    }


    # --------------------------------------------------------
    # Topic-wise knowledge profile
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
    # Sort topics by mastery
    # --------------------------------------------------------

    # --------------------------------------------------------
    # Classify topics by mastery
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


    # Sort each group by mastery

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
    # Subject-wise knowledge profile
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
    # Overall mastery
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
    # Learning level
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
    # Recommended focus
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
    # Return knowledge profile
    # --------------------------------------------------------

    return {

        "student": {

            "id": student.id,

            "name": student.full_name,

            "education_level": (
                student.education_level
            ),

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

            "questions_answered": (
                total_questions
            ),

            "correct_answers": (
                correct_answers
            ),

            "accuracy": round(
                accuracy,
                1
            ),

            "topics_evaluated": (
                len(topic_progress)
            )

        },


        "strongest_topics": strongest_topics,

        "developing_topics": developing_topics,

        "weak_topics": weak_topics,


        "recommended_focus": (
            recommended_focus
        ),


        "subject_progress": (
            subject_progress
        ),


        "topic_progress": (
            topic_progress
        )

    }