def get_adaptive_recommendation(mastery: float):

    if mastery < 0.40:

        return {
            "difficulty": "easy",
            "action": "learn",
            "reason": (
                "Your mastery is low. "
                "Start with foundational concepts."
            )
        }

    elif mastery < 0.70:

        return {
            "difficulty": "medium",
            "action": "practice",
            "reason": (
                "You have partial understanding. "
                "Practice more to strengthen this topic."
            )
        }

    else:

        return {
            "difficulty": "hard",
            "action": "challenge",
            "reason": (
                "You have good mastery. "
                "Try challenging questions."
            )
        }