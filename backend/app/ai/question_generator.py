from google import genai
from app.core.config import GEMINI_API_KEY
import json


def generate_adaptive_questions(
    topic: str,
    mastery_percentage: float,
    difficulty: str,
    count: int = 3
):
    if not GEMINI_API_KEY:
        raise RuntimeError(
            "GEMINI_API_KEY is not configured in the .env file."
        )

    client = genai.Client(
        api_key=GEMINI_API_KEY
    )

    if mastery_percentage < 40:
        learning_level = "beginner"
    elif mastery_percentage < 70:
        learning_level = "intermediate"
    else:
        learning_level = "advanced"

    prompt = f"""
You are the question-generation engine inside SmartLearn,
an AI-powered adaptive learning system.

Generate {count} multiple-choice questions for:

Topic: {topic}

Student mastery: {mastery_percentage:.1f}%

Student level: {learning_level}

Required difficulty: {difficulty}

Rules:
1. Questions must directly relate to the selected topic.
2. Match the requested difficulty.
3. Do not make questions unnecessarily complicated.
4. Each question must have exactly four options.
5. Only one option must be correct.
6. Include a short explanation for the correct answer.
7. Do not use ambiguous questions.
8. Do not repeat the same question.
9. Questions must test understanding, not only memorization.
10. Do not mention the student's mastery percentage in the questions.

Return ONLY valid JSON.

Use exactly this structure:

{{
    "questions": [
        {{
            "question": "Question text",
            "option_a": "Option A",
            "option_b": "Option B",
            "option_c": "Option C",
            "option_d": "Option D",
            "correct_answer": "A",
            "explanation": "Short explanation",
            "difficulty": "{difficulty}"
        }}
    ]
}}
"""

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt
    )

    text = response.text.strip()

    # Remove accidental Markdown code fences
    if text.startswith("```"):
        text = text.replace("```json", "")
        text = text.replace("```", "")
        text = text.strip()

    try:
        data = json.loads(text)
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            "Gemini returned invalid question JSON."
        ) from exc

    if "questions" not in data:
        raise RuntimeError(
            "Gemini response does not contain questions."
        )

    return data