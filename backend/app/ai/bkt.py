def update_mastery(
    current_mastery: float,
    is_correct: bool,
    learn_rate: float = 0.02,
    guess: float = 0.20,
    slip: float = 0.10,
    observation_weight: float = 0.35
):
    """
    Calibrated Bayesian Knowledge Tracing.

    The observation_weight prevents a single question
    from causing an unrealistic jump in mastery.
    """

    current_mastery = max(
        0.0,
        min(1.0, current_mastery)
    )

    # -----------------------------
    # Step 1: Bayesian observation
    # -----------------------------

    if is_correct:

        numerator = (
            current_mastery * (1 - slip)
        )

        denominator = (
            current_mastery * (1 - slip)
            + (1 - current_mastery) * guess
        )

    else:

        numerator = (
            current_mastery * slip
        )

        denominator = (
            current_mastery * slip
            + (1 - current_mastery) * (1 - guess)
        )

    if denominator == 0:
        return current_mastery

    posterior = numerator / denominator

    # -----------------------------------
    # Step 2: Calibrate the update
    # -----------------------------------

    # Instead of immediately accepting
    # the entire Bayesian jump, use only
    # part of the evidence.

    new_mastery = (
        current_mastery
        + observation_weight
        * (posterior - current_mastery)
    )

    # -----------------------------------
    # Step 3: Small learning transition
    # -----------------------------------

    new_mastery = (
        new_mastery
        + (1 - new_mastery) * learn_rate
    )

    # -----------------------------------
    # Step 4: Keep between 0 and 1
    # -----------------------------------

    return max(
        0.0,
        min(1.0, new_mastery)
    )