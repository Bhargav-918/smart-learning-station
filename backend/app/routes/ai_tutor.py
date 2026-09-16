from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import StudentMastery, Topic
from app.core.security import get_current_user_id
from app.ai.ai_tutor import (
    detect_topic,
    generate_tutor_response
)
from app.ai.adaptive_engine import get_adaptive_recommendation


router = APIRouter(
    prefix="/ai-tutor",
    tags=["AI Tutor"]
)


class TutorMessage(BaseModel):
    role: str
    text: str


class TutorRequest(BaseModel):
    question: str
    history: list[TutorMessage] = []


@router.post("/chat")
def tutor_chat(
    request: TutorRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):

    question = request.question.strip()
    history = [
        {
            "role": message.role,
            "text": message.text
        }
        for message in request.history[-10:]
    ]

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty."
        )

    # --------------------------------------------------------
    # 1. Automatically detect subject and topic
    # --------------------------------------------------------

    detected = detect_topic(question)

    detected_subject = detected["subject"]
    detected_topic_name = detected["topic"]


    # --------------------------------------------------------
    # 2. Find matching topic in PostgreSQL
    # --------------------------------------------------------

    topic = (
        db.query(Topic)
        .filter(
            Topic.name.ilike(
                detected_topic_name
            )
        )
        .first()
    )


    # --------------------------------------------------------
    # 3. If exact topic is not found, search partial match
    # --------------------------------------------------------

    if not topic:

        topic = (
            db.query(Topic)
            .filter(
                Topic.name.ilike(
                    f"%{detected_topic_name}%"
                )
            )
            .first()
        )


    # --------------------------------------------------------
    # 4. If topic exists, get student's BKT mastery
    # --------------------------------------------------------

    if topic:

        mastery_record = (
            db.query(StudentMastery)
            .filter(
                StudentMastery.student_id == user_id,
                StudentMastery.topic_id == topic.id
            )
            .first()
        )

        if mastery_record:

            mastery_percentage = (
                mastery_record.mastery_probability * 100
            )

        else:

            mastery_percentage = 20.0

        matched_topic_name = topic.name

    else:

        # New / unknown topic
        # We do not invent a mastery score.
        mastery_percentage = 20.0

        matched_topic_name = detected_topic_name


    # --------------------------------------------------------
    # 5. Adaptive Learning Engine
    # --------------------------------------------------------

    recommendation = get_adaptive_recommendation(
        mastery_percentage / 100
    )

    difficulty = recommendation["difficulty"]
    action = recommendation["action"]
    reason = recommendation["reason"]


    # --------------------------------------------------------
    # 6. Determine learning level
    # --------------------------------------------------------

    if mastery_percentage < 40:

        level = "Beginner"

    elif mastery_percentage < 70:

        level = "Intermediate"

    else:

        level = "Advanced"


    # --------------------------------------------------------
    # 7. Generate personalized response
    # --------------------------------------------------------

    answer = generate_tutor_response(
        question=question,
        topic=matched_topic_name,
        mastery_percentage=mastery_percentage,
        difficulty=difficulty,
        action=action,
        reason=reason,
        history=history
    )


    # --------------------------------------------------------
    # 8. Return adaptive information
    # --------------------------------------------------------

    return {
        "answer": answer,

        "detected_subject": detected_subject,

        "detected_topic": matched_topic_name,

        "topic_id": topic.id if topic else None,

        "mastery_percentage": round(
            mastery_percentage,
            1
        ),

        "level": level,

        "difficulty": difficulty,

        "action": action,

        "reason": reason
    }