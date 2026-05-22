import re
from textblob import TextBlob

def evaluate_answer(
    question,
    answer,
    metrics=None
):

    if metrics is None:
        metrics = {}

    text = answer.lower()

    words = text.split()

    word_count = len(words)

    unique_words = len(set(words))

    confidence = 35
    communication = 35
    technical = 15

    feedback = []

    typing_speed = metrics.get(
        "typingSpeed",
        0
    )

    hesitation = metrics.get(
        "hesitationTime",
        0
    )

    backspaces = metrics.get(
        "backspaces",
        0
    )

    total_time = metrics.get(
        "totalTime",
        0
    )

    # SENTIMENT

    sentiment = TextBlob(
        answer
    ).sentiment.polarity

    if sentiment > 0.3:

        confidence += 15

        feedback.append(
            "Positive and confident tone detected."
        )

    elif sentiment < -0.2:

        confidence -= 10

        feedback.append(
            "Response tone appears slightly negative."
        )

    # ANSWER LENGTH

    if word_count > 30:

        confidence += 15
        communication += 20

        feedback.append(
            "Detailed answer with strong explanation."
        )

    elif word_count > 15:

        confidence += 10
        communication += 10

        feedback.append(
            "Good answer structure detected."
        )

    else:

        confidence -= 5

        feedback.append(
            "Answer could include more detail."
        )

    # VOCABULARY

    if unique_words > 20:

        communication += 15

        feedback.append(
            "Strong vocabulary usage detected."
        )

    elif unique_words > 10:

        communication += 8

    # CONFIDENCE WORDS

    confidence_words = [

        "developed",
        "managed",
        "led",
        "achieved",
        "improved",
        "created",
        "solved",
        "successfully"

    ]

    confidence_matches = 0

    for word in confidence_words:

        if word in text:

            confidence += 4
            confidence_matches += 1

    if confidence_matches >= 2:

        feedback.append(
            "Confident action-oriented language identified."
        )

    # TECHNICAL KEYWORDS

    tech_words = [

        "python",
        "react",
        "api",
        "database",
        "machine learning",
        "sql",
        "javascript",
        "backend",
        "frontend",
        "ai"

    ]

    tech_matches = 0

    for word in tech_words:

        if word in text:

            tech_matches += 1

    technical += tech_matches * 10

    if tech_matches >= 2:

        feedback.append(
            "Relevant technical concepts detected."
        )

    # FILLER WORDS

    fillers = [

        "umm",
        "uh",
        "like",
        "basically",
        "actually"

    ]

    filler_count = 0

    for word in fillers:

        filler_count += text.count(word)

    communication -= filler_count * 4

    if filler_count >= 3:

        feedback.append(
            "Frequent filler words reduce communication clarity."
        )

    # SENTENCE STRUCTURE

    sentences = re.split(
        r'[.!?]',
        answer
    )

    if len(sentences) >= 3:

        communication += 10

        feedback.append(
            "Well-structured sentence flow detected."
        )

    # TYPING SPEED ANALYSIS

    if typing_speed > 45:

        feedback.append(
            "Typing speed is very fast and confident."
        )

        confidence += 5

    elif typing_speed < 15:

        feedback.append(
            "Slow typing speed may indicate uncertainty."
        )

    # HESITATION ANALYSIS

    if hesitation >= 3:

        feedback.append(
            "Multiple hesitation pauses detected during answering."
        )

        confidence -= 5

    elif hesitation == 0:

        feedback.append(
            "Answer flow appears smooth with minimal hesitation."
        )

    # BACKSPACE ANALYSIS

    if backspaces > 25:

        feedback.append(
            "Frequent corrections suggest overthinking or uncertainty."
        )

        confidence -= 5

    elif backspaces < 5:

        feedback.append(
            "Low correction rate indicates confident answering."
        )

    # RESPONSE TIME

    if total_time > 120:

        feedback.append(
            "Long response time indicates deep thinking and analysis."
        )

    elif total_time < 20:

        feedback.append(
            "Very quick response detected."
        )

    # LIMITS

    confidence = max(
        0,
        min(confidence, 100)
    )

    communication = max(
        0,
        min(communication, 100)
    )

    technical = max(
        0,
        min(technical, 100)
    )

    # FINAL SUMMARY

    if confidence >= 75:

        feedback.append(
            "Overall confidence level is excellent."
        )

    elif confidence < 45:

        feedback.append(
            "Confidence level could be improved further."
        )

    if communication >= 75:

        feedback.append(
            "Communication quality is strong."
        )

    return {

        "confidence": confidence,

        "communication": communication,

        "technical": technical,

        "feedback": " ".join(feedback)

    }