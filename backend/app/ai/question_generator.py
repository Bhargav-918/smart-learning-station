from google import genai
from google.genai.errors import ClientError

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

    # Important:
    # Keep Gemini generation small to reduce quota usage.
    count = min(count, 1)

    prompt = f"""
You are the question-generation engine inside SmartLearn,
an AI-powered adaptive learning system.

Generate {count} multiple-choice question for:

Topic: {topic}

Student mastery: {mastery_percentage:.1f}%

Student level: {learning_level}

Required difficulty: {difficulty}

Rules:
1. Question must directly relate to the selected topic.
2. Match the requested difficulty.
3. Do not make the question unnecessarily complicated.
4. The question must have exactly four options.
5. Only one option must be correct.
6. Include a short explanation for the correct answer.
7. Do not use ambiguous questions.
8. Test understanding, not only memorization.
9. Do not mention the student's mastery percentage.
10. Return ONLY valid JSON.

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

    try:

        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt
        )

    except ClientError as e:

        if getattr(e, "code", None) == 429:

            print(
                "Gemini quota exceeded. "
                "AI question generation unavailable."
            )

            # Return an empty result so the calling
            # assessment system can use its PostgreSQL fallback.
            return {
                "questions": []
            }

        raise

    text = response.text.strip()

    # Remove accidental Markdown code fences
    if text.startswith("```"):

        text = text.replace(
            "```json",
            ""
        )

        text = text.replace(
            "```",
            ""
        )

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