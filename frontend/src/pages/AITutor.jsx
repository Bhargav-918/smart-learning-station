import { useState } from "react";
import API from "../services/api";
import ReactMarkdown from "react-markdown";

function AITutor({ onBack }) {
    const [question, setQuestion] = useState("");
    const [messages, setMessages] = useState([]);
    const [isListening, setIsListening] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [mastery, setMastery] = useState(20);

    const [adaptiveInfo, setAdaptiveInfo] = useState({
        level: "Beginner",
        difficulty: "easy",
        action: "learn",
        reason:
            "Ask a question and SmartLearn will adapt the explanation to your level."
    });

    const [detectedTopic, setDetectedTopic] = useState("");
    const [detectedSubject, setDetectedSubject] = useState("");
    const [detectedTopicId, setDetectedTopicId] = useState(null);

    const [practiceQuestion, setPracticeQuestion] = useState(null);
    const [practiceLoading, setPracticeLoading] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState("");
    const [practiceResult, setPracticeResult] = useState(null);
    const [practiceSubmitting, setPracticeSubmitting] = useState(false);

    const suggestedQuestions = [
        {
            icon: "✦",
            text: "Explain this concept simply"
        },
        {
            icon: "◉",
            text: "Give me a real-world example"
        },
        {
            icon: "◆",
            text: "What are the important points?"
        },
        {
            icon: "⚡",
            text: "Quiz me on this concept"
        }
    ];

    const askTutor = async (text = question) => {
        const trimmedQuestion = text.trim();

        if (!trimmedQuestion) {
            return;
        }

        setError("");

        setMessages((previous) => [
            ...previous,
            {
                role: "student",
                text: trimmedQuestion
            }
        ]);

        setQuestion("");
        setLoading(true);

        try {
            const history = messages.map((message) => ({
                role: message.role,
                text: message.text
            }));

            const response = await API.post(
                "/ai-tutor/chat",
                {
                    question: trimmedQuestion,
                    history
                }
            );

            const data = response.data;

            setMessages((previous) => [
                ...previous,
                {
                    role: "tutor",
                    text: data.answer,
                    detectedTopic:
                    data.detected_topic,
                    detectedSubject:
                    data.detected_subject,
                    level: data.level
                }
            ]);
            speakAnswer(data.answer);
            setDetectedTopic(
                data.detected_topic || ""
            );

            setDetectedSubject(
                data.detected_subject || ""
            );

            setDetectedTopicId(
                data.topic_id || null
            );

            if (
                data.mastery_percentage !==
                undefined
            ) {
                setMastery(
                    Number(
                        data.mastery_percentage
                    )
                );
            }

            setAdaptiveInfo({
                level:
                    data.level ||
                    "Beginner",

                difficulty:
                    data.difficulty ||
                    "easy",

                action:
                    data.action ||
                    "learn",

                reason:
                    data.reason ||
                    "Your learning path is being adapted to your performance."
            });

        } catch (e) {
            console.error(
                "AI Tutor error:",
                e
            );

            if (
                e.response?.status === 401
            ) {
                setError(
                    "Your session expired. Please login again."
                );
            } else {
                setError(
                    e.response?.data?.detail ||
                    "Unable to connect to SmartLearn AI."
                );
            }
        } finally {
            setLoading(false);
        }
    };
    const startVoiceInput = () => {
        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setError("Voice input is not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();

        recognition.lang = "en-IN";
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            setIsListening(true);
            setError("");
        };

        recognition.onresult = (event) => {
            const transcript =
                event.results[0][0].transcript.trim();

            if (transcript) {
                setQuestion(transcript);

                setTimeout(() => {
                    askTutor(transcript);
                }, 100);
            }
        };

        recognition.onerror = () => {
            setError("Could not understand your voice. Please try again.");
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };
    const speakAnswer = (text) => {
        if (!("speechSynthesis" in window)) {
            setError("Voice output is not supported in this browser.");
            return;
        }

        window.speechSynthesis.cancel();

        const cleanText = text
            .replace(/[*_#`]/g, "")
            .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
            .replace(/\n+/g, ". ");

        const utterance = new SpeechSynthesisUtterance(cleanText);

        utterance.lang = "en-IN";
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

        window.speechSynthesis.speak(utterance);
    };

    const startPracticeQuestion = async () => {
        if (!detectedTopicId) {
            setError(
                "Practice is not available yet because this topic is not in your learning database."
            );
            return;
        }

        setPracticeLoading(true);
        setPracticeResult(null);
        setSelectedAnswer("");
        setError("");

        try {
            const response = await API.get(
                `/assessment/ai-generated/${detectedTopicId}`
            );

            const questions =
                response.data?.questions;

            if (
                !Array.isArray(questions) ||
                questions.length === 0
            ) {
                throw new Error(
                    "No practice question generated."
                );
            }

            setPracticeQuestion(
                questions[0]
            );

            if (
                response.data
                    ?.mastery_percentage !==
                undefined
            ) {
                setMastery(
                    response.data
                        .mastery_percentage
                );
            }

            setAdaptiveInfo({
                level:
                    response.data.level ||
                    adaptiveInfo.level,

                difficulty:
                    response.data.difficulty ||
                    adaptiveInfo.difficulty,

                action:
                    response.data.action ||
                    adaptiveInfo.action,

                reason:
                    response.data.reason ||
                    adaptiveInfo.reason
            });

        } catch (err) {
            console.error(
                "Practice error:",
                err
            );

            setError(
                "Unable to generate a practice question."
            );
        } finally {
            setPracticeLoading(false);
        }
    };

    const submitPracticeAnswer = async () => {
        if (!practiceQuestion) {
            return;
        }

        if (!selectedAnswer) {
            setError(
                "Please select an answer."
            );
            return;
        }

        setPracticeSubmitting(true);
        setError("");

        try {
            const response =
                await API.post(
                    "/assessment/submit",
                    {
                        question_id:
                        practiceQuestion.id,

                        selected_answer:
                        selectedAnswer,

                        response_time:
                            null,

                        hints_used: 0
                    }
                );

            const result =
                response.data;

            setPracticeResult(
                result
            );

            if (
                result.mastery_probability !==
                undefined
            ) {
                const newMastery =
                    result.mastery_probability *
                    100;

                setMastery(
                    Math.round(
                        newMastery
                    )
                );

                let level;
                let difficulty;
                let action;
                let reason;

                if (
                    newMastery < 40
                ) {
                    level =
                        "Beginner";
                    difficulty =
                        "easy";
                    action =
                        "learn";
                    reason =
                        "Your mastery is low. Start with foundational concepts.";
                } else if (
                    newMastery < 70
                ) {
                    level =
                        "Intermediate";
                    difficulty =
                        "medium";
                    action =
                        "practice";
                    reason =
                        "You have partial understanding. Practice more to strengthen this topic.";
                } else {
                    level =
                        "Advanced";
                    difficulty =
                        "hard";
                    action =
                        "challenge";
                    reason =
                        "You have good mastery. Try challenging questions.";
                }

                setAdaptiveInfo({
                    level,
                    difficulty,
                    action,
                    reason
                });
            }

        } catch (err) {
            console.error(
                "Practice submission error:",
                err
            );

            setError(
                "Unable to evaluate your answer."
            );
        } finally {
            setPracticeSubmitting(
                false
            );
        }
    };

    const clearChat = () => {
        setMessages([]);
        setError("");
        setDetectedTopic("");
        setDetectedSubject("");
        setDetectedTopicId(null);
        setPracticeQuestion(null);
        setPracticeResult(null);
        setSelectedAnswer("");
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                background:
                    "linear-gradient(135deg, #f8fbff 0%, #ffffff 55%, #f5f9ff 100%)",
                padding: "28px"
            }}
        >

            {/* HEADER */}

            <div
                style={{
                    maxWidth: 1180,
                    margin: "0 auto 22px",
                    display: "flex",
                    justifyContent:
                        "space-between",
                    alignItems: "center",
                    gap: 20
                }}
            >

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14
                    }}
                >

                    <div
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: 15,
                            background:
                                "linear-gradient(135deg,#315b9b,#4f83cc)",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 24,
                            boxShadow:
                                "0 8px 22px rgba(49,91,155,.20)"
                        }}
                    >
                        ✦
                    </div>

                    <div>
                        <div
                            style={{
                                fontSize: 13,
                                color: "#315b9b",
                                fontWeight: 800,
                                letterSpacing:
                                    "0.08em"
                            }}
                        >
                            SMARTLEARN
                        </div>

                        <h1
                            style={{
                                margin:
                                    "2px 0 0",
                                fontSize: 27,
                                color: "#172033"
                            }}
                        >
                            AI Tutor
                        </h1>
                    </div>
                </div>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12
                    }}
                >

                    <div
                        style={{
                            padding:
                                "8px 13px",
                            borderRadius: 30,
                            background:
                                "#effaf3",
                            color: "#16834b",
                            fontSize: 12,
                            fontWeight: 700
                        }}
                    >
                        ● Adaptive
                    </div>

                    <button
                        onClick={onBack}
                        style={secondaryButton}
                    >
                        ← Dashboard
                    </button>

                </div>
            </div>


            {/* MAIN */}

            <div
                style={{
                    maxWidth: 1180,
                    margin: "0 auto",
                    display: "grid",
                    gridTemplateColumns:
                        "1fr 300px",
                    gap: 22
                }}
            >

                {/* CHAT CARD */}

                <section
                    style={chatCard}
                >

                    {/* CHAT HEADER */}

                    <div
                        style={{
                            padding:
                                "22px 24px",
                            borderBottom:
                                "1px solid #edf1f6",
                            display: "flex",
                            justifyContent:
                                "space-between",
                            alignItems:
                                "center"
                        }}
                    >

                        <div>

                            <div
                                style={{
                                    fontSize: 18,
                                    fontWeight: 800,
                                    color: "#172033"
                                }}
                            >
                                Your personal learning companion
                            </div>

                            <div
                                style={{
                                    marginTop: 5,
                                    fontSize: 13,
                                    color: "#718096"
                                }}
                            >
                                Ask anything. SmartLearn automatically
                                adapts to your understanding level.
                            </div>

                        </div>

                        {messages.length >
                            0 && (
                                <button
                                    onClick={
                                        clearChat
                                    }
                                    style={{
                                        border:
                                            "none",
                                        background:
                                            "transparent",
                                        color:
                                            "#64748b",
                                        fontWeight:
                                            700,
                                        cursor:
                                            "pointer"
                                    }}
                                >
                                    Clear
                                </button>
                            )}

                    </div>


                    {/* DETECTED TOPIC */}

                    {detectedTopic && (
                        <div
                            style={{
                                margin:
                                    "18px 22px 0",
                                padding:
                                    "12px 15px",
                                borderRadius:
                                    14,
                                background:
                                    "linear-gradient(135deg,#f0f6ff,#f8fbff)",
                                border:
                                    "1px solid #dceaff",
                                display:
                                    "flex",
                                alignItems:
                                    "center",
                                justifyContent:
                                    "space-between",
                                gap: 15,
                                flexWrap:
                                    "wrap"
                            }}
                        >

                            <div>

                                <div
                                    style={{
                                        fontSize: 10,
                                        fontWeight: 800,
                                        color:
                                            "#6b7c93",
                                        letterSpacing:
                                            "0.08em"
                                    }}
                                >
                                    DETECTED TOPIC
                                </div>

                                <div
                                    style={{
                                        marginTop: 3,
                                        fontSize: 14,
                                        fontWeight: 800,
                                        color:
                                            "#254f89"
                                    }}
                                >
                                    {detectedSubject
                                        ? `${detectedSubject} → `
                                        : ""}
                                    {detectedTopic}
                                </div>

                            </div>

                            <div
                                style={{
                                    padding:
                                        "7px 11px",
                                    borderRadius:
                                        20,
                                    background:
                                        "#ffffff",
                                    border:
                                        "1px solid #dceaff",
                                    color:
                                        "#315b9b",
                                    fontSize: 11,
                                    fontWeight:
                                        800
                                }}
                            >
                                {adaptiveInfo.level}
                            </div>

                        </div>
                    )}


                    {/* MESSAGES */}

                    <div
                        style={{
                            minHeight: 430,
                            maxHeight: 560,
                            overflowY:
                                "auto",
                            padding:
                                "24px"
                        }}
                    >

                        {messages.length ===
                            0 && (
                                <div
                                    style={{
                                        minHeight:
                                            380,
                                        display:
                                            "flex",
                                        flexDirection:
                                            "column",
                                        alignItems:
                                            "center",
                                        justifyContent:
                                            "center",
                                        textAlign:
                                            "center"
                                    }}
                                >

                                    <div
                                        style={{
                                            width: 74,
                                            height: 74,
                                            borderRadius:
                                                24,
                                            background:
                                                "linear-gradient(135deg,#edf5ff,#f7fbff)",
                                            display:
                                                "flex",
                                            alignItems:
                                                "center",
                                            justifyContent:
                                                "center",
                                            fontSize: 38,
                                            color:
                                                "#315b9b",
                                            marginBottom:
                                                18
                                        }}
                                    >
                                        ✦
                                    </div>

                                    <h2
                                        style={{
                                            margin:
                                                0,
                                            color:
                                                "#172033",
                                            fontSize:
                                                24
                                        }}
                                    >
                                        What would you like to learn?
                                    </h2>

                                    <p
                                        style={{
                                            maxWidth:
                                                500,
                                            lineHeight:
                                                1.6,
                                            color:
                                                "#718096",
                                            fontSize:
                                                14
                                        }}
                                    >
                                        Ask a question from any subject.
                                        You don't need to select a topic.
                                        SmartLearn will detect it automatically
                                        and adapt the explanation to you.
                                    </p>

                                    <div
                                        style={{
                                            display:
                                                "grid",
                                            gridTemplateColumns:
                                                "repeat(2, 1fr)",
                                            gap: 10,
                                            width:
                                                "100%",
                                            maxWidth:
                                                600,
                                            marginTop:
                                                14
                                        }}
                                    >

                                        {suggestedQuestions.map(
                                            (item) => (
                                                <button
                                                    key={
                                                        item.text
                                                    }
                                                    onClick={() =>
                                                        askTutor(
                                                            item.text
                                                        )
                                                    }
                                                    disabled={
                                                        loading
                                                    }
                                                    style={
                                                        suggestionCard
                                                    }
                                                >
                                                <span
                                                    style={{
                                                        fontSize:
                                                            17
                                                    }}
                                                >
                                                    {
                                                        item.icon
                                                    }
                                                </span>

                                                    {
                                                        item.text
                                                    }
                                                </button>
                                            )
                                        )}

                                    </div>

                                </div>
                            )}


                        {messages.map(
                            (
                                message,
                                index
                            ) => (
                                <div
                                    key={
                                        index
                                    }
                                    style={{
                                        display:
                                            "flex",
                                        justifyContent:
                                            message.role ===
                                            "student"
                                                ? "flex-end"
                                                : "flex-start",
                                        marginBottom:
                                            20
                                    }}
                                >

                                    <div
                                        style={{
                                            maxWidth:
                                                message.role ===
                                                "student"
                                                    ? "75%"
                                                    : "86%",
                                            padding:
                                                "15px 18px",
                                            borderRadius:
                                                message.role ===
                                                "student"
                                                    ? "18px 18px 5px 18px"
                                                    : "18px 18px 18px 5px",
                                            background:
                                                message.role ===
                                                "student"
                                                    ? "#315b9b"
                                                    : "#f7f9fc",
                                            color:
                                                message.role ===
                                                "student"
                                                    ? "#ffffff"
                                                    : "#1e293b",
                                            border:
                                                message.role ===
                                                "student"
                                                    ? "none"
                                                    : "1px solid #e5eaf1",
                                            boxShadow:
                                                "0 5px 18px rgba(15,23,42,.05)",
                                            lineHeight:
                                                1.65
                                        }}
                                    >

                                        {message.role ===
                                            "tutor" &&
                                            message.detectedTopic && (
                                                <div
                                                    style={{
                                                        marginBottom:
                                                            10,
                                                        paddingBottom:
                                                            9,
                                                        borderBottom:
                                                            "1px solid #e5eaf1",
                                                        fontSize:
                                                            11,
                                                        color:
                                                            "#55729a",
                                                        fontWeight:
                                                            700
                                                    }}
                                                >
                                                    ✦ Personalized for{" "}
                                                    {
                                                        message.level
                                                    }
                                                    {" · "}
                                                    {
                                                        message.detectedTopic
                                                    }
                                                </div>
                                            )}

                                        <div
                                            style={{
                                                fontSize:
                                                    11,
                                                fontWeight:
                                                    800,
                                                color:
                                                    message.role ===
                                                    "student"
                                                        ? "rgba(255,255,255,.75)"
                                                        : "#718096",
                                                marginBottom:
                                                    7,
                                                letterSpacing:
                                                    "0.04em"
                                            }}
                                        >
                                            {message.role ===
                                            "student"
                                                ? "YOU"
                                                : "SMARTLEARN AI"}
                                        </div>

                                        {message.role === "student" ? (
                                            message.text
                                        ) : (
                                            <>
                                                <ReactMarkdown>
                                                    {message.text}
                                                </ReactMarkdown>

                                                <button
                                                    type="button"
                                                    onClick={() => speakAnswer(message.text)}
                                                    title="Listen to this answer"
                                                    style={{
                                                        marginTop: 12,
                                                        padding: "7px 11px",
                                                        borderRadius: 9,
                                                        border: "1px solid #dbe5f2",
                                                        background: "#ffffff",
                                                        color: "#315b9b",
                                                        fontSize: 12,
                                                        fontWeight: 700,
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    🔊 Listen
                                                </button>
                                            </>
                                        )}

                                    </div>

                                </div>
                            )
                        )}

                        {loading && (
                            <div
                                style={{
                                    display:
                                        "flex",
                                    gap: 8,
                                    alignItems:
                                        "center",
                                    color:
                                        "#718096",
                                    fontSize:
                                        13,
                                    padding:
                                        "8px 0"
                                }}
                            >
                                <span
                                    style={{
                                        fontSize:
                                            20,
                                        color:
                                            "#315b9b"
                                    }}
                                >
                                    ✦
                                </span>

                                SmartLearn is thinking...
                            </div>
                        )}

                    </div>


                    {/* ERROR */}

                    {error && (
                        <div
                            style={{
                                margin:
                                    "0 22px 12px",
                                padding:
                                    "11px 14px",
                                borderRadius:
                                    11,
                                background:
                                    "#fff5f5",
                                border:
                                    "1px solid #fed7d7",
                                color:
                                    "#c53030",
                                fontSize:
                                    13
                            }}
                        >
                            {error}
                        </div>
                    )}


                    {/* INPUT */}

                    <div
                        style={{
                            padding:
                                "16px 20px 20px",
                            borderTop:
                                "1px solid #edf1f6"
                        }}
                    >

                        <div
                            style={{
                                display:
                                    "flex",
                                gap: 10,
                                alignItems:
                                    "center",
                                padding:
                                    "8px 8px 8px 16px",
                                border:
                                    "1px solid #dce3ec",
                                borderRadius:
                                    18,
                                background:
                                    "#ffffff",
                                boxShadow:
                                    "0 5px 20px rgba(15,23,42,.04)"
                            }}
                        >

                            <input
                                value={
                                    question
                                }
                                onChange={(
                                    e
                                ) =>
                                    setQuestion(
                                        e.target.value
                                    )
                                }
                                onKeyDown={(
                                    e
                                ) => {
                                    if (
                                        e.key ===
                                        "Enter"
                                    ) {
                                        askTutor();
                                    }
                                }}
                                disabled={
                                    loading
                                }
                                placeholder="Ask anything you're learning..."
                                style={{
                                    flex: 1,
                                    border:
                                        "none",
                                    outline:
                                        "none",
                                    fontSize:
                                        14,
                                    color:
                                        "#172033",
                                    background:
                                        "transparent"
                                }}
                            />
                            <button
                                type="button"
                                onClick={startVoiceInput}
                                disabled={loading}
                                title="Speak your question"
                                style={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: 13,
                                    border: "none",
                                    background: isListening
                                        ? "#dc2626"
                                        : "#eef4ff",
                                    color: isListening
                                        ? "#ffffff"
                                        : "#315b9b",
                                    fontSize: 18,
                                    cursor: loading
                                        ? "not-allowed"
                                        : "pointer",
                                    transition: "all .2s ease"
                                }}
                            >
                                {isListening ? "●" : "🎤"}
                            </button>
                            <button
                                type="button"
                                style={{
                                    width:
                                        42,
                                    height:
                                        42,
                                    borderRadius:
                                        13,
                                    border:
                                        "none",
                                    background:
                                        "#315b9b",
                                    color:
                                        "#ffffff",
                                    fontSize:
                                        18,
                                    cursor:
                                        loading
                                            ? "not-allowed"
                                            : "pointer",
                                    opacity:
                                        loading
                                            ? 0.6
                                            : 1
                                }}
                                onClick={() =>
                                    askTutor()
                                }
                                disabled={
                                    loading
                                }
                            >
                                →
                            </button>

                        </div>

                        <div
                            style={{
                                marginTop:
                                    8,
                                textAlign:
                                    "center",
                                fontSize:
                                    11,
                                color:
                                    "#94a3b8"
                            }}
                        >
                            SmartLearn adapts explanations to your
                            demonstrated learning level.
                        </div>

                    </div>

                </section>


                {/* RIGHT PANEL */}

                <aside>

                    {/* ADAPTIVE PROFILE */}

                    <div
                        style={{
                            ...sideCard,
                            marginBottom:
                                16
                        }}
                    >

                        <div
                            style={{
                                fontSize:
                                    11,
                                fontWeight:
                                    800,
                                color:
                                    "#315b9b",
                                letterSpacing:
                                    "0.08em"
                            }}
                        >
                            ✦ ADAPTIVE PROFILE
                        </div>

                        <div
                            style={{
                                marginTop:
                                    12,
                                fontSize:
                                    16,
                                fontWeight:
                                    800,
                                color:
                                    "#172033"
                            }}
                        >
                            Your learning level
                        </div>

                        <div
                            style={{
                                display:
                                    "flex",
                                alignItems:
                                    "baseline",
                                gap: 6,
                                marginTop:
                                    14
                            }}
                        >

                            <span
                                style={{
                                    fontSize:
                                        39,
                                    fontWeight:
                                        900,
                                    color:
                                        "#315b9b"
                                }}
                            >
                                {Math.round(
                                    mastery
                                )}
                            </span>

                            <span
                                style={{
                                    color:
                                        "#64748b",
                                    fontWeight:
                                        700
                                }}
                            >
                                % mastery
                            </span>

                        </div>

                        <div
                            style={{
                                height: 8,
                                borderRadius:
                                    10,
                                background:
                                    "#edf1f7",
                                marginTop:
                                    10,
                                overflow:
                                    "hidden"
                            }}
                        >
                            <div
                                style={{
                                    width: `${Math.min(
                                        100,
                                        Math.max(
                                            0,
                                            mastery
                                        )
                                    )}%`,
                                    height:
                                        "100%",
                                    background:
                                        "#315b9b",
                                    borderRadius:
                                        10,
                                    transition:
                                        "width .4s ease"
                                }}
                            />
                        </div>

                        <div
                            style={{
                                display:
                                    "flex",
                                gap: 7,
                                flexWrap:
                                    "wrap",
                                marginTop:
                                    15
                            }}
                        >

                            <span
                                style={
                                    adaptiveBadge
                                }
                            >
                                {
                                    adaptiveInfo.level
                                }
                            </span>

                            <span
                                style={
                                    adaptiveBadge
                                }
                            >
                                {
                                    adaptiveInfo.difficulty
                                }
                            </span>

                        </div>

                        <p
                            style={{
                                margin:
                                    "14px 0 0",
                                color:
                                    "#64748b",
                                fontSize:
                                    12,
                                lineHeight:
                                    1.6
                            }}
                        >
                            {
                                adaptiveInfo.reason
                            }
                        </p>

                    </div>


                    {/* PRACTICE */}

                    <div
                        style={
                            sideCard
                        }
                    >

                        <div
                            style={{
                                fontSize:
                                    11,
                                fontWeight:
                                    800,
                                color:
                                    "#315b9b",
                                letterSpacing:
                                    "0.08em"
                            }}
                        >
                            ⚡ PRACTICE
                        </div>

                        <h3
                            style={{
                                margin:
                                    "10px 0 6px",
                                color:
                                    "#172033"
                            }}
                        >
                            Test your understanding
                        </h3>

                        <p
                            style={{
                                fontSize:
                                    12,
                                lineHeight:
                                    1.6,
                                color:
                                    "#64748b"
                            }}
                        >
                            Ask a question first. If SmartLearn
                            identifies a topic from your learning
                            database, you can practice it here.
                        </p>

                        <button
                            onClick={
                                startPracticeQuestion
                            }
                            disabled={
                                practiceLoading ||
                                !detectedTopicId
                            }
                            style={{
                                width:
                                    "100%",
                                padding:
                                    "11px",
                                borderRadius:
                                    11,
                                border:
                                    "none",
                                background:
                                    detectedTopicId
                                        ? "#315b9b"
                                        : "#e2e8f0",
                                color:
                                    detectedTopicId
                                        ? "#fff"
                                        : "#94a3b8",
                                fontWeight:
                                    800,
                                cursor:
                                    detectedTopicId
                                        ? "pointer"
                                        : "not-allowed"
                            }}
                        >
                            {practiceLoading
                                ? "Generating..."
                                : "Give Me a Question"}
                        </button>

                        {practiceQuestion && (
                            <div
                                style={{
                                    marginTop:
                                        16,
                                    padding:
                                        14,
                                    borderRadius:
                                        12,
                                    background:
                                        "#f8fafc",
                                    border:
                                        "1px solid #e2e8f0"
                                }}
                            >

                                <div
                                    style={{
                                        fontSize:
                                            11,
                                        fontWeight:
                                            800,
                                        color:
                                            "#64748b"
                                    }}
                                >
                                    {
                                        practiceQuestion.difficulty?.toUpperCase()
                                    }
                                </div>

                                <div
                                    style={{
                                        marginTop:
                                            8,
                                        fontWeight:
                                            700,
                                        fontSize:
                                            13,
                                        lineHeight:
                                            1.5
                                    }}
                                >
                                    {
                                        practiceQuestion.question_text
                                    }
                                </div>

                                <div
                                    style={{
                                        display:
                                            "grid",
                                        gap: 7,
                                        marginTop:
                                            12
                                    }}
                                >
                                    {[
                                        [
                                            "A",
                                            practiceQuestion.option_a
                                        ],
                                        [
                                            "B",
                                            practiceQuestion.option_b
                                        ],
                                        [
                                            "C",
                                            practiceQuestion.option_c
                                        ],
                                        [
                                            "D",
                                            practiceQuestion.option_d
                                        ]
                                    ].map(
                                        ([
                                             letter,
                                             text
                                         ]) => (
                                            <button
                                                key={
                                                    letter
                                                }
                                                type="button"
                                                disabled={
                                                    practiceSubmitting ||
                                                    practiceResult !==
                                                    null
                                                }
                                                onClick={() =>
                                                    setSelectedAnswer(
                                                        letter
                                                    )
                                                }
                                                style={{
                                                    textAlign:
                                                        "left",
                                                    padding:
                                                        "10px",
                                                    borderRadius:
                                                        8,
                                                    border:
                                                        selectedAnswer ===
                                                        letter
                                                            ? "2px solid #315b9b"
                                                            : "1px solid #dbe3ec",
                                                    background:
                                                        selectedAnswer ===
                                                        letter
                                                            ? "#edf4ff"
                                                            : "#fff",
                                                    cursor:
                                                        "pointer",
                                                    fontSize:
                                                        12
                                                }}
                                            >
                                                <strong>
                                                    {
                                                        letter
                                                    }
                                                    .
                                                </strong>{" "}
                                                {
                                                    text
                                                }
                                            </button>
                                        )
                                    )}
                                </div>

                                {!practiceResult && (
                                    <button
                                        onClick={
                                            submitPracticeAnswer
                                        }
                                        disabled={
                                            !selectedAnswer ||
                                            practiceSubmitting
                                        }
                                        style={{
                                            width:
                                                "100%",
                                            marginTop:
                                                12,
                                            padding:
                                                10,
                                            borderRadius:
                                                9,
                                            border:
                                                "none",
                                            background:
                                                "#111827",
                                            color:
                                                "#fff",
                                            fontWeight:
                                                800,
                                            opacity:
                                                !selectedAnswer ||
                                                practiceSubmitting
                                                    ? 0.5
                                                    : 1
                                        }}
                                    >
                                        {practiceSubmitting
                                            ? "Evaluating..."
                                            : "Submit"}
                                    </button>
                                )}

                                {practiceResult && (
                                    <div
                                        style={{
                                            marginTop:
                                                12,
                                            padding:
                                                11,
                                            borderRadius:
                                                9,
                                            background:
                                                practiceResult.correct
                                                    ? "#f0fdf4"
                                                    : "#fef2f2",
                                            fontSize:
                                                12
                                        }}
                                    >
                                        <strong>
                                            {practiceResult.correct
                                                ? "✓ Correct!"
                                                : "✗ Not quite"}
                                        </strong>

                                        <div
                                            style={{
                                                marginTop:
                                                    5
                                            }}
                                        >
                                            Correct answer:{" "}
                                            <strong>
                                                {
                                                    practiceResult.correct_answer
                                                }
                                            </strong>
                                        </div>

                                        {practiceResult.mastery_probability !==
                                            undefined && (
                                                <div
                                                    style={{
                                                        marginTop:
                                                            6,
                                                        fontWeight:
                                                            700
                                                    }}
                                                >
                                                    Updated mastery:{" "}
                                                    {Math.round(
                                                        practiceResult.mastery_probability *
                                                        100
                                                    )}
                                                    %
                                                </div>
                                            )}

                                        <button
                                            onClick={() => {
                                                setPracticeQuestion(
                                                    null
                                                );
                                                setPracticeResult(
                                                    null
                                                );
                                                setSelectedAnswer(
                                                    ""
                                                );
                                                startPracticeQuestion();
                                            }}
                                            style={{
                                                marginTop:
                                                    10,
                                                width:
                                                    "100%",
                                                padding:
                                                    8,
                                                borderRadius:
                                                    8,
                                                border:
                                                    "1px solid #cbd5e1",
                                                background:
                                                    "#fff",
                                                fontWeight:
                                                    700
                                            }}
                                        >
                                            Next Question
                                        </button>

                                    </div>
                                )}

                            </div>
                        )}

                    </div>

                </aside>

            </div>

        </div>
    );
}


const chatCard = {
    background: "#ffffff",
    border: "1px solid #e5eaf1",
    borderRadius: 22,
    overflow: "hidden",
    boxShadow:
        "0 12px 40px rgba(15,23,42,.06)"
};

const sideCard = {
    background: "#ffffff",
    border: "1px solid #e5eaf1",
    borderRadius: 18,
    padding: 20,
    boxShadow:
        "0 10px 30px rgba(15,23,42,.05)"
};

const secondaryButton = {
    padding: "10px 14px",
    borderRadius: 11,
    border: "1px solid #dbe3ec",
    background: "#ffffff",
    color: "#334155",
    fontWeight: 700,
    cursor: "pointer"
};

const suggestionCard = {
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #e1e8f1",
    background: "#ffffff",
    color: "#475569",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    textAlign: "left"
};

const adaptiveBadge = {
    padding: "6px 10px",
    borderRadius: 20,
    background: "#edf4ff",
    border: "1px solid #d7e6ff",
    color: "#315b9b",
    fontSize: 11,
    fontWeight: 800
};

export default AITutor;