from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.ai.question_generator import generate_adaptive_questions
from app.db.database import get_db
from app.db.models import (
    Question,
    Topic,
    Attempt,
    StudentMastery
)
from app.core.security import get_current_user_id
from app.ai.bkt import update_mastery
from app.ai.adaptive_engine import get_adaptive_recommendation

router = APIRouter(
    prefix="/assessment",
    tags=["Assessment"]
)


class AnswerSubmission(BaseModel):
    question_id: int
    selected_answer: str
    response_time: int | None = None
    hints_used: int = 0


@router.get("/topics/{topic_id}/questions")
def get_questions(
    topic_id: int,
    db: Session = Depends(get_db)
):
    questions = (
        db.query(Question)
        .filter(Question.topic_id == topic_id)
        .all()
    )

    if not questions:
        raise HTTPException(
            status_code=404,
            detail="No questions found for this topic"
        )

    # Do not send correct answers to the frontend
    return [
        {
            "id": question.id,
            "topic_id": question.topic_id,
            "question_text": question.question_text,
            "option_a": question.option_a,
            "option_b": question.option_b,
            "option_c": question.option_c,
            "option_d": question.option_d,
            "difficulty": question.difficulty
        }
        for question in questions
    ]


@router.post("/submit")
def submit_answer(
    answer: AnswerSubmission,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):

    # --------------------------------
    # 1. Find the question
    # --------------------------------

    question = (
        db.query(Question)
        .filter(Question.id == answer.question_id)
        .first()
    )

    if not question:
        raise HTTPException(
            status_code=404,
            detail="Question not found"
        )

    # --------------------------------
    # 2. Check the student's answer
    # --------------------------------

    is_correct = (
        answer.selected_answer.upper()
        == question.correct_answer.upper()
    )

    # --------------------------------
    # 3. Save the attempt
    # --------------------------------

    previous_attempts = (
        db.query(Attempt)
        .filter(
            Attempt.student_id == user_id,
            Attempt.question_id == answer.question_id
        )
        .count()
    )

    attempt_number = previous_attempts + 1


    attempt = Attempt(
        student_id=user_id,
        question_id=answer.question_id,
        selected_answer=answer.selected_answer.upper(),
        is_correct=is_correct,
        response_time=answer.response_time,
        hints_used=answer.hints_used,
        attempt_number=attempt_number
    )

    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    # --------------------------------
    # 4. Find existing mastery record
    # --------------------------------

    mastery_record = (
        db.query(StudentMastery)
        .filter(
            StudentMastery.student_id == user_id,
            StudentMastery.topic_id == question.topic_id
        )
        .first()
    )

    # --------------------------------
    # 5. Calculate new BKT mastery
    # --------------------------------

    if mastery_record is None:

        current_mastery = 0.20

        new_mastery = update_mastery(
            current_mastery,
            is_correct
        )

        mastery_record = StudentMastery(
            student_id=user_id,
            topic_id=question.topic_id,
            mastery_probability=new_mastery
        )

        db.add(mastery_record)

    else:

        new_mastery = update_mastery(
            mastery_record.mastery_probability,
            is_correct
        )

        mastery_record.mastery_probability = new_mastery

    # --------------------------------
    # 6. Save mastery
    # --------------------------------

    db.commit()
    db.refresh(mastery_record)

    # --------------------------------
    # 7. Return result
    # --------------------------------

    return {
        "attempt_id": attempt.id,
        "question_id": question.id,
        "correct": is_correct,
        "score": 1 if is_correct else 0,
        "correct_answer": question.correct_answer,
        "explanation": question.explanation,
        "mastery_probability": round(
            mastery_record.mastery_probability,
            3
        )
    }
@router.get("/practice/{topic_id}")
def get_practice_questions(
    topic_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    # Check that the topic exists
    topic = (
        db.query(Topic)
        .filter(Topic.id == topic_id)
        .first()
    )

    if not topic:
        raise HTTPException(
            status_code=404,
            detail="Topic not found"
        )

    # Get student's current mastery
    mastery_record = (
        db.query(StudentMastery)
        .filter(
            StudentMastery.student_id == user_id,
            StudentMastery.topic_id == topic_id
        )
        .first()
    )

    mastery = (
        mastery_record.mastery_probability
        if mastery_record
        else 0.20
    )

    # Adaptive decision
    recommendation = get_adaptive_recommendation(
        mastery
    )

    difficulty = recommendation["difficulty"]
    action = recommendation["action"]

    # First try the recommended difficulty
    questions = (
        db.query(Question)
        .filter(
            Question.topic_id == topic_id,
            Question.difficulty == difficulty
        )
        .limit(5)
        .all()
    )

    # If there are not enough questions,
    # use questions from other difficulties.
    if not questions:
        questions = (
            db.query(Question)
            .filter(
                Question.topic_id == topic_id
            )
            .limit(5)
            .all()
        )

    # Still no questions = topic has no questions
    if not questions:
        raise HTTPException(
            status_code=404,
            detail="No questions found for this topic"
        )

    return {
        "topic_id": topic_id,
        "topic": topic.name,
        "mastery": round(mastery, 3),
        "mastery_percentage": round(
            mastery * 100,
            1
        ),
        "difficulty": difficulty,
        "action": action,
        "questions": [
            {
                "id": q.id,
                "topic_id": q.topic_id,
                "question_text": q.question_text,
                "option_a": q.option_a,
                "option_b": q.option_b,
                "option_c": q.option_c,
                "option_d": q.option_d,
                "difficulty": q.difficulty
            }
            for q in questions
        ]
    }
@router.get("/reassessment/{topic_id}")
def get_reassessment_questions(
    topic_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    # Find topic
    topic = (
        db.query(Topic)
        .filter(Topic.id == topic_id)
        .first()
    )

    if not topic:
        raise HTTPException(
            status_code=404,
            detail="Topic not found"
        )

    # Get current mastery
    mastery_record = (
        db.query(StudentMastery)
        .filter(
            StudentMastery.student_id == user_id,
            StudentMastery.topic_id == topic_id
        )
        .first()
    )

    mastery = (
        mastery_record.mastery_probability
        if mastery_record
        else 0.20
    )

    # Decide next difficulty
    recommendation = get_adaptive_recommendation(
        mastery
    )

    difficulty = recommendation["difficulty"]

    # Find questions the student has already attempted
    attempted_question_ids = [
        row.question_id
        for row in (
            db.query(Attempt.question_id)
            .join(
                Question,
                Question.id == Attempt.question_id
            )
            .filter(
                Attempt.student_id == user_id,
                Question.topic_id == topic_id
            )
            .all()
        )
    ]

    # Try to get fresh questions at recommended difficulty
    query = (
        db.query(Question)
        .filter(
            Question.topic_id == topic_id,
            Question.difficulty == difficulty
        )
    )

    if attempted_question_ids:
        query = query.filter(
            ~Question.id.in_(attempted_question_ids)
        )

    questions = query.limit(5).all()

    # If there aren't enough fresh questions,
    # use questions at the recommended difficulty
    if len(questions) < 3:
        questions = (
            db.query(Question)
            .filter(
                Question.topic_id == topic_id,
                Question.difficulty == difficulty
            )
            .limit(5)
            .all()
        )

    # Final fallback
    if not questions:
        questions = (
            db.query(Question)
            .filter(
                Question.topic_id == topic_id
            )
            .limit(5)
            .all()
        )

    if not questions:
        raise HTTPException(
            status_code=404,
            detail="No questions available for reassessment"
        )

    return {
        "topic_id": topic_id,
        "topic": topic.name,
        "mastery": round(mastery, 3),
        "mastery_percentage": round(
            mastery * 100,
            1
        ),
        "difficulty": difficulty,
        "action": "reassess",
        "questions": [
            {
                "id": q.id,
                "topic_id": q.topic_id,
                "question_text": q.question_text,
                "option_a": q.option_a,
                "option_b": q.option_b,
                "option_c": q.option_c,
                "option_d": q.option_d,
                "difficulty": q.difficulty
            }
            for q in questions
        ]
    }
@router.get("/ai-generated/{topic_id}")
def get_ai_generated_questions(
    topic_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    # --------------------------------
    # 1. Find topic
    # --------------------------------

    topic = (
        db.query(Topic)
        .filter(Topic.id == topic_id)
        .first()
    )

    if not topic:
        raise HTTPException(
            status_code=404,
            detail="Topic not found"
        )

    # --------------------------------
    # 2. Get student's current mastery
    # --------------------------------

    mastery_record = (
        db.query(StudentMastery)
        .filter(
            StudentMastery.student_id == user_id,
            StudentMastery.topic_id == topic_id
        )
        .first()
    )

    if mastery_record:
        mastery_percentage = (
            mastery_record.mastery_probability * 100
        )
    else:
        mastery_percentage = 20.0

    # --------------------------------
    # 3. Adaptive Engine
    # --------------------------------

    recommendation = get_adaptive_recommendation(
        mastery_percentage / 100
    )

    difficulty = recommendation["difficulty"]

    # --------------------------------
    # 4. Generate questions using Gemini
    # --------------------------------

    try:
        generated = generate_adaptive_questions(
            topic=topic.name,
            mastery_percentage=mastery_percentage,
            difficulty=difficulty,
            count=1
        )

    except Exception as e:
        print("GEMINI QUESTION GENERATION ERROR:", e)

        # Gemini unavailable — use an existing PostgreSQL question
        fallback_question = (
            db.query(Question)
            .filter(
                Question.topic_id == topic_id,
                Question.difficulty == difficulty
            )
            .order_by(Question.id.desc())
            .first()
        )

        # If no question exists at the recommended difficulty,
        # use any question from this topic.
        if not fallback_question:
            fallback_question = (
                db.query(Question)
                .filter(
                    Question.topic_id == topic_id
                )
                .order_by(Question.id.desc())
                .first()
            )

        if not fallback_question:
            raise HTTPException(
                status_code=500,
                detail="No practice questions are available for this topic."
            )

        return {
            "topic_id": topic_id,
            "topic": topic.name,
            "mastery_percentage": round(
                mastery_percentage,
                1
            ),
            "difficulty": fallback_question.difficulty,
            "action": recommendation["action"],
            "reason": (
                "AI generation is temporarily unavailable. "
                "Continuing with an existing adaptive question."
            ),
            "source": "postgresql_fallback",
            "questions": [
                {
                    "id": fallback_question.id,
                    "topic_id": fallback_question.topic_id,
                    "question_text": fallback_question.question_text,
                    "option_a": fallback_question.option_a,
                    "option_b": fallback_question.option_b,
                    "option_c": fallback_question.option_c,
                    "option_d": fallback_question.option_d,
                    "difficulty": fallback_question.difficulty
                }
            ]
        }

        raise HTTPException(
            status_code=500,
            detail="Unable to generate AI questions."
        )

    generated_questions = generated.get("questions", [])

    if not generated_questions:
        raise HTTPException(
            status_code=500,
            detail="Gemini did not return any questions."
        )

    # --------------------------------
    # 5. Save Gemini questions
    #    into PostgreSQL
    # --------------------------------

    saved_questions = []

    try:

        for item in generated_questions:

            question = Question(
                topic_id=topic_id,

                question_text=item["question"],

                option_a=item["option_a"],
                option_b=item["option_b"],
                option_c=item["option_c"],
                option_d=item["option_d"],

                correct_answer=item["correct_answer"].upper(),

                difficulty=item.get(
                    "difficulty",
                    difficulty
                ),

                explanation=item.get(
                    "explanation",
                    ""
                )
            )

            db.add(question)

            # Flush gives us the PostgreSQL-generated ID
            # before committing the transaction.
            db.flush()

            saved_questions.append(question)

        # Commit all generated questions together
        db.commit()

        # Refresh objects so all database values are available
        for question in saved_questions:
            db.refresh(question)

    except Exception as e:

        db.rollback()

        print(
            "DATABASE ERROR WHILE SAVING AI QUESTIONS:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to save AI-generated questions."
        )

    # --------------------------------
    # 6. Return database-backed questions
    # --------------------------------

    return {
        "topic_id": topic_id,

        "topic": topic.name,

        "mastery_percentage": round(
            mastery_percentage,
            1
        ),

        "difficulty": difficulty,

        "action": recommendation["action"],

        "reason": recommendation["reason"],

        "questions": [
            {
                "id": question.id,

                "topic_id": question.topic_id,

                "question_text": question.question_text,

                "option_a": question.option_a,

                "option_b": question.option_b,

                "option_c": question.option_c,

                "option_d": question.option_d,

                "difficulty": question.difficulty
            }

            for question in saved_questions
        ]
    }