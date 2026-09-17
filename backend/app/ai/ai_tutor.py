from google import genai
from google.genai.errors import ClientError

from app.core.config import GEMINI_API_KEY


def get_gemini_client():
    if not GEMINI_API_KEY:
        return None

    return genai.Client(api_key=GEMINI_API_KEY)


def detect_topic(question: str):
    """
    Local topic classifier.

    This function intentionally does NOT call Gemini.
    This prevents topic detection from consuming Gemini quota.
    """

    q = question.lower().strip()

    topic_keywords = {
        "Cybersecurity": [
            "cybersecurity",
            "cyber security",
            "cia triad",
            "confidentiality",
            "integrity",
            "availability",
            "malware",
            "virus",
            "worm",
            "phishing",
            "firewall",
            "encryption",
            "hacking",
            "penetration testing",
            "pentesting",
            "vulnerability",
            "network security"
        ],

        "Data Structures and Algorithms": [
            "data structure",
            "data structures",
            "algorithm",
            "algorithms",
            "array",
            "linked list",
            "stack",
            "queue",
            "tree",
            "binary tree",
            "graph",
            "dfs",
            "bfs",
            "sorting",
            "searching",
            "recursion",
            "dynamic programming"
        ],

        "Python Programming": [
            "python",
            "list comprehension",
            "dictionary",
            "tuple",
            "lambda",
            "decorator"
        ],

        "Java Programming": [
            "java",
            "inheritance",
            "polymorphism",
            "interface",
            "constructor",
            "encapsulation"
        ],

        "Database Systems": [
            "sql",
            "database",
            "postgresql",
            "mysql",
            "query",
            "normalization",
            "primary key",
            "foreign key"
        ],

        "Computer Networks": [
            "tcp",
            "udp",
            "ip address",
            "dns",
            "http",
            "https",
            "router",
            "switch",
            "osi model",
            "subnet",
            "computer network"
        ],

        "Probability": [
            "probability",
            "conditional probability",
            "random variable",
            "bayes theorem"
        ],

        "Statistics": [
            "statistics",
            "mean",
            "median",
            "mode",
            "variance",
            "standard deviation"
        ],

        "Algebra": [
            "algebra",
            "equation",
            "quadratic",
            "polynomial"
        ],

        "Calculus": [
            "calculus",
            "derivative",
            "differentiation",
            "integral",
            "integration",
            "limit"
        ],

        "Physics": [
            "physics",
            "force",
            "motion",
            "velocity",
            "acceleration",
            "momentum",
            "newton"
        ],

        "Chemistry": [
            "chemistry",
            "atom",
            "electron",
            "proton",
            "neutron",
            "molecule",
            "chemical bond",
            "ionic bond",
            "covalent bond"
        ],

        "Biology": [
            "biology",
            "cell",
            "dna",
            "rna",
            "gene",
            "chromosome",
            "heart",
            "brain",
            "kidney",
            "human anatomy"
        ]
    }

    for topic, keywords in topic_keywords.items():

        for keyword in keywords:

            if keyword in q:

                if topic == "Cybersecurity":
                    subject = "Cybersecurity"

                elif topic in [
                    "Probability",
                    "Statistics",
                    "Algebra",
                    "Calculus"
                ]:
                    subject = "Mathematics"

                elif topic == "Physics":
                    subject = "Physics"

                elif topic == "Chemistry":
                    subject = "Chemistry"

                elif topic == "Biology":
                    subject = "Biology"

                elif topic == "Database Systems":
                    subject = "Database Systems"

                elif topic == "Computer Networks":
                    subject = "Computer Networks"

                else:
                    subject = "Computer Science"

                print(
                    f"LOCAL TOPIC DETECTION: "
                    f"{subject} → {topic}"
                )

                return {
                    "subject": subject,
                    "topic": topic
                }

    print(
        "LOCAL TOPIC DETECTION: "
        "No matching topic → General"
    )

    return {
        "subject": "General",
        "topic": "General"
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

    client = get_gemini_client()

    if client is None:

        return (
            "AI Tutor is currently unavailable. "
            "Please continue with the available learning activities."
        )

    # -----------------------------
    # Learning level
    # -----------------------------

    if mastery_percentage < 40:

        learning_level = "beginner"

        teaching_style = """
Teach from the fundamentals.
Use very simple language.
Avoid unnecessary technical jargon.
Use real-world analogies.
Use small examples.
Break concepts into short steps.
"""

    elif mastery_percentage < 70:

        learning_level = "intermediate"

        teaching_style = """
Strengthen conceptual understanding.
Use practical examples.
Use step-by-step reasoning.
Point out common mistakes.
Connect related concepts.
"""

    else:

        learning_level = "advanced"

        teaching_style = """
Focus on deeper reasoning.
Discuss edge cases when useful.
Use technical terminology appropriately.
Connect the concept to real applications.
Challenge the student's understanding.
"""

    # -----------------------------
    # Conversation history
    # -----------------------------

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

    # -----------------------------
    # Tutor prompt
    # -----------------------------

    prompt = f"""
You are SmartLearn AI Tutor.

You are NOT a generic chatbot.

Your job is to act as a personalized academic tutor.

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

Student question:
{question}

IMPORTANT RULES

1. The mastery percentage comes from SmartLearn's
   knowledge-tracking system.

2. NEVER change or invent the mastery percentage.

3. Adapt the explanation to the student's level.

4. If mastery is low, teach fundamentals first.

5. If mastery is intermediate, strengthen understanding.

6. If mastery is advanced, provide deeper reasoning.

7. If the student asks for a simpler explanation,
   explain the same concept more simply.

8. If the student asks for an example,
   provide a relevant example.

9. If the student asks for a practice question,
   provide ONE suitable question.

10. Programming questions should include useful examples.

11. Mathematical questions should show reasoning when useful.

12. Asking questions does NOT change mastery.

13. AI Tutor explains and teaches.
    It does NOT determine mastery.

14. Keep the answer concise enough for an interactive
    learning device.

15. Use Markdown where useful.

16. Stay focused on the detected topic.

Return ONLY the tutor response.
"""

    try:

        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt
        )

        return response.text

    except ClientError as e:

        if getattr(e, "code", None) == 429:

            print(
                "Gemini quota exceeded during AI Tutor response."
            )

            return (
                "The AI Tutor has temporarily reached "
                "its daily AI request limit.\n\n"
                "Your learning progress is safe. "
                "Please continue with the available "
                "practice activities and try the AI Tutor "
                "again after the quota resets."
            )

        raise