from google import genai
from google.genai.errors import ClientError

from app.core.config import GEMINI_API_KEY


def get_gemini_client():
    if not GEMINI_API_KEY:
        return None

    return genai.Client(api_key=GEMINI_API_KEY)


def detect_topic(question: str):
    """
    Detect subject/topic locally first.

    Gemini is used only when the local classifier
    cannot identify the topic.

    This function does NOT determine mastery.
    """

    q = question.lower().strip()

    # -----------------------------
    # Computer Science
    # -----------------------------

    cs_topics = {
        "dsa": [
            "data structure",
            "data structures",
            "algorithm",
            "algorithms",
            "array",
            "linked list",
            "stack",
            "queue",
            "tree",
            "graph",
            "binary search",
            "sorting",
            "recursion",
            "dfs",
            "bfs",
            "dynamic programming"
        ],

        "python": [
            "python",
            "list comprehension",
            "tuple",
            "dictionary",
            "set",
            "lambda",
            "decorator"
        ],

        "java": [
            "java",
            "class",
            "object",
            "inheritance",
            "polymorphism",
            "interface",
            "constructor"
        ],

        "database": [
            "sql",
            "database",
            "postgresql",
            "mysql",
            "query",
            "normalization",
            "primary key",
            "foreign key"
        ],

        "cybersecurity": [
            "cybersecurity",
            "cyber security",
            "hacking",
            "penetration testing",
            "pentesting",
            "malware",
            "virus",
            "worm",
            "firewall",
            "phishing",
            "encryption",
            "cia triad",
            "vulnerability",
            "network security"
        ],

        "computer networks": [
            "network",
            "tcp",
            "udp",
            "ip address",
            "dns",
            "http",
            "https",
            "router",
            "switch",
            "osi model",
            "subnet"
        ]
    }

    for topic, keywords in cs_topics.items():

        for keyword in keywords:

            if keyword in q:

                subject = "Computer Science"

                if topic == "cybersecurity":
                    subject = "Cybersecurity"

                elif topic == "computer networks":
                    subject = "Computer Networks"

                elif topic == "database":
                    subject = "Database Systems"

                return {
                    "subject": subject,
                    "topic": topic.title()
                }

    # -----------------------------
    # Mathematics
    # -----------------------------

    math_topics = {
        "probability": [
            "probability",
            "random variable",
            "conditional probability",
            "bayes"
        ],

        "statistics": [
            "statistics",
            "mean",
            "median",
            "mode",
            "variance",
            "standard deviation"
        ],

        "algebra": [
            "algebra",
            "equation",
            "quadratic",
            "polynomial"
        ],

        "calculus": [
            "calculus",
            "derivative",
            "differentiation",
            "integral",
            "integration",
            "limit"
        ]
    }

    for topic, keywords in math_topics.items():

        for keyword in keywords:

            if keyword in q:

                return {
                    "subject": "Mathematics",
                    "topic": topic.title()
                }

    # -----------------------------
    # Physics
    # -----------------------------

    physics_topics = {
        "mechanics": [
            "force",
            "motion",
            "velocity",
            "acceleration",
            "newton law",
            "momentum"
        ],

        "electricity": [
            "voltage",
            "current",
            "resistance",
            "ohm",
            "circuit",
            "electricity"
        ],

        "optics": [
            "light",
            "reflection",
            "refraction",
            "lens",
            "mirror"
        ]
    }

    for topic, keywords in physics_topics.items():

        for keyword in keywords:

            if keyword in q:

                return {
                    "subject": "Physics",
                    "topic": topic.title()
                }

    # -----------------------------
    # Chemistry
    # -----------------------------

    chemistry_topics = {
        "organic chemistry": [
            "organic chemistry",
            "hydrocarbon",
            "alkane",
            "alkene",
            "alkyne"
        ],

        "chemical bonding": [
            "chemical bond",
            "ionic bond",
            "covalent bond",
            "bonding"
        ],

        "atomic structure": [
            "atom",
            "electron",
            "proton",
            "neutron",
            "atomic structure"
        ]
    }

    for topic, keywords in chemistry_topics.items():

        for keyword in keywords:

            if keyword in q:

                return {
                    "subject": "Chemistry",
                    "topic": topic.title()
                }

    # -----------------------------
    # Biology
    # -----------------------------

    biology_topics = {
        "human anatomy": [
            "human body",
            "organ",
            "heart",
            "brain",
            "lung",
            "kidney",
            "anatomy"
        ],

        "cell biology": [
            "cell",
            "mitochondria",
            "nucleus",
            "cell membrane"
        ],

        "genetics": [
            "genetics",
            "dna",
            "rna",
            "gene",
            "chromosome"
        ]
    }

    for topic, keywords in biology_topics.items():

        for keyword in keywords:

            if keyword in q:

                return {
                    "subject": "Biology",
                    "topic": topic.title()
                }

    # -----------------------------
    # Gemini fallback
    # -----------------------------

    client = get_gemini_client()

    if client is None:

        return {
            "subject": "General",
            "topic": "General"
        }

    prompt = f"""
You are the topic classifier for SmartLearn.

Analyze the student's question and identify the most likely
academic subject and topic.

Student question:
{question}

Return ONLY:

SUBJECT: <subject>
TOPIC: <topic>

Do not answer the question.
"""

    try:

        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt
        )

        text = response.text.strip()

    except ClientError as e:

        if getattr(e, "code", None) == 429:

            print(
                "Gemini quota exceeded during topic detection. "
                "Using General topic."
            )

            return {
                "subject": "General",
                "topic": "General"
            }

        raise

    subject = "General"
    topic = "General"

    for line in text.splitlines():

        line = line.strip()

        if line.upper().startswith("SUBJECT:"):

            subject = line.split(
                ":",
                1
            )[1].strip()

        elif line.upper().startswith("TOPIC:"):

            topic = line.split(
                ":",
                1
            )[1].strip()

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