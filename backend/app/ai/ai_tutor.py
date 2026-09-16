from google import genai
from app.core.config import GEMINI_API_KEY


def detect_topic(question: str):
    """
    Detect the most relevant learning subject/topic from
    the student's free-form question.

    This is only topic classification.
    It does NOT determine student mastery.
    """

    if not GEMINI_API_KEY:
        raise RuntimeError(
            "GEMINI_API_KEY is not configured in the .env file."
        )

    client = genai.Client(api_key=GEMINI_API_KEY)

    prompt = f"""
You are the topic classifier for SmartLearn, an adaptive learning system.

Analyze the student's question and identify the most likely
academic subject and topic.

Student question:
{question}

Return ONLY this format:

SUBJECT: <subject>
TOPIC: <topic>

Rules:
- Use a common academic subject name.
- Use a concise topic name.
- Do not explain anything.
- Do not answer the question.
- If the question is about programming, identify the programming
  concept or data structure/algorithm when possible.
- If the question is mathematical, identify the mathematical topic.
"""

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt
    )

    text = response.text.strip()

    subject = "General"
    topic = "General"

    for line in text.splitlines():
        line = line.strip()

        if line.upper().startswith("SUBJECT:"):
            subject = line.split(":", 1)[1].strip()

        elif line.upper().startswith("TOPIC:"):
            topic = line.split(":", 1)[1].strip()

    return {
        "subject": subject,
        "topic": topic
    }


def generate_tutor_response(
    question: str,
    topic: str,
    mastery_percentage: float,
    difficulty: str,
    action: str,
    reason: str,
    history: list | None = None
):
    if history is None:
        history = []

    if not GEMINI_API_KEY:
        raise RuntimeError(
            "GEMINI_API_KEY is not configured in the .env file."
        )

    client = genai.Client(api_key=GEMINI_API_KEY)

    if mastery_percentage < 40:

        learning_level = "beginner"

        teaching_style = """
Teach from the fundamentals.

Use very simple language.
Avoid unnecessary technical jargon.
Use real-world analogies.
Use small examples.
Break concepts into short steps.
Check whether the student understands before moving
to advanced concepts.
"""

    elif mastery_percentage < 70:

        learning_level = "intermediate"

        teaching_style = """
Assume the student understands the basic idea.

Strengthen conceptual understanding.
Use practical examples.
Use step-by-step reasoning.
Point out common mistakes.
Connect the concept to related concepts.
"""

    else:

        learning_level = "advanced"

        teaching_style = """
Assume the student has strong fundamentals.

Focus on deeper reasoning.
Discuss edge cases when useful.
Use technical terminology appropriately.
Connect the concept to real applications.
Challenge the student's understanding.
"""
    conversation_text = ""

    if history:
        conversation_lines = []

        for message in history[-10:]:
            role = (
                "Student"
                if message["role"] == "student"
                else "SmartLearn AI"
            )

            conversation_lines.append(
                f"{role}: {message['text']}"
            )

        conversation_text = "\n".join(
            conversation_lines
        )
    prompt = f"""
You are SmartLearn AI Tutor.

You are NOT a generic chatbot.

Your job is to act as a personalized academic tutor.

The SmartLearn learning system has already estimated
the student's current knowledge level.

Detected topic:
{topic}

Student mastery:
{mastery_percentage:.1f}%

Learning level:
{learning_level}

Recommended difficulty:
{difficulty}

Recommended learning action:
{action}

Adaptive reason:
{reason}

Teaching strategy:
{teaching_style}

Recent conversation:
{conversation_text}

Use this conversation only to understand follow-up questions
and maintain context.

Student question:
{question}


IMPORTANT ADAPTIVE RULES
========================

1. The mastery percentage comes from SmartLearn's
   knowledge-tracking system.

2. NEVER change, invent or estimate the mastery percentage.

3. Adapt the explanation to the student's current level.

4. If mastery is low:
   - start from fundamentals
   - use simple language
   - use analogies
   - use small examples

5. If mastery is intermediate:
   - strengthen understanding
   - provide examples
   - explain common mistakes
   - provide guided reasoning

6. If mastery is advanced:
   - go deeper
   - discuss edge cases
   - use technical terminology
   - provide challenging applications

7. If the student asks for a simpler explanation,
   explain the SAME concept using a simpler approach.

8. If the student asks for an example,
   provide a relevant example.

9. If the student asks for a practice question,
   provide ONE question appropriate for the student's level.

10. If the student asks a programming question,
    provide a clear explanation and a small useful example.

11. If the student asks a mathematical question,
    show the reasoning step-by-step when appropriate.

12. Do not claim that the student's mastery changed
    simply because they asked a question.

13. The AI Tutor explains and teaches.
    It does NOT determine mastery.

14. Keep the response concise enough for an interactive
    learning device.

15. Use Markdown where useful.

16. Stay focused on the detected topic.

17. If the question is ambiguous, explain the most likely
    interpretation and mention the interpretation briefly.

Return ONLY the tutor response.
"""

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt
    )

    return response.text