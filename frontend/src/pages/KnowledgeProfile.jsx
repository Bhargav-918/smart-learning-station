import React, { useEffect, useState } from "react";
import API from "../services/api";

function KnowledgeProfile({ onBack }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await API.get(
                "/learning/knowledge-profile"
            );

            setProfile(response.data);

        } catch (err) {
            console.error(
                "Knowledge profile error:",
                err
            );

            setError(
                err.response?.data?.detail ||
                "Unable to load knowledge profile."
            );

        } finally {
            setLoading(false);
        }
    };


    if (loading) {
        return (
            <div style={styles.page}>
                <div style={styles.loading}>
                    Loading your knowledge profile...
                </div>
            </div>
        );
    }


    if (error) {
        return (
            <div style={styles.page}>
                <div style={styles.error}>
                    {error}
                </div>

                <button
                    style={styles.backButton}
                    onClick={onBack}
                >
                    ← Back
                </button>
            </div>
        );
    }


    if (!profile) {
        return null;
    }


    const summary =
        profile.knowledge_summary;


    const getMasteryClass = (percentage) => {

        if (percentage >= 70) {
            return styles.progressStrong;
        }

        if (percentage >= 40) {
            return styles.progressDeveloping;
        }

        return styles.progressWeak;
    };


    const getLevelBadge = (level) => {

        if (level === "Strong") {
            return styles.badgeStrong;
        }

        if (level === "Developing") {
            return styles.badgeDeveloping;
        }

        return styles.badgeWeak;
    };


    return (
        <div style={styles.page}>

            {/* Header */}

            <div style={styles.header}>

                <div>

                    <button
                        style={styles.backButton}
                        onClick={onBack}
                    >
                        ← Back
                    </button>

                    <h1 style={styles.title}>
                        🧠 My Knowledge Profile
                    </h1>

                    <p style={styles.subtitle}>
                        Understand your learning progress
                        and discover what to focus on next.
                    </p>

                </div>

            </div>


            {/* Student Info */}

            <div style={styles.profileCard}>

                <div style={styles.avatar}>
                    {profile.student.name
                        ?.charAt(0)
                        ?.toUpperCase()}
                </div>

                <div>

                    <h2 style={styles.studentName}>
                        {profile.student.name}
                    </h2>

                    <p style={styles.studentDetails}>
                        {profile.student.degree}
                        {" • "}
                        {profile.student.branch}
                    </p>

                    <p style={styles.studentDetails}>
                        {profile.student.current_year}
                        {" • "}
                        {profile.student.semester}
                    </p>

                </div>

            </div>


            {/* Summary Cards */}

            <div style={styles.summaryGrid}>

                <div style={styles.summaryCard}>

                    <div style={styles.cardIcon}>
                        🧠
                    </div>

                    <div>
                        <p style={styles.cardLabel}>
                            Overall Mastery
                        </p>

                        <h2 style={styles.cardValue}>
                            {summary.overall_mastery}%
                        </h2>
                    </div>

                </div>


                <div style={styles.summaryCard}>

                    <div style={styles.cardIcon}>
                        🎓
                    </div>

                    <div>
                        <p style={styles.cardLabel}>
                            Learning Level
                        </p>

                        <h2 style={styles.cardValueSmall}>
                            {summary.learning_level}
                        </h2>
                    </div>

                </div>


                <div style={styles.summaryCard}>

                    <div style={styles.cardIcon}>
                        📝
                    </div>

                    <div>
                        <p style={styles.cardLabel}>
                            Questions Answered
                        </p>

                        <h2 style={styles.cardValue}>
                            {summary.questions_answered}
                        </h2>
                    </div>

                </div>


                <div style={styles.summaryCard}>

                    <div style={styles.cardIcon}>
                        🎯
                    </div>

                    <div>
                        <p style={styles.cardLabel}>
                            Accuracy
                        </p>

                        <h2 style={styles.cardValue}>
                            {summary.accuracy}%
                        </h2>
                    </div>

                </div>

            </div>


            {/* Recommended Focus */}

            {profile.recommended_focus && (

                <div style={styles.focusCard}>

                    <div style={styles.focusIcon}>
                        🎯
                    </div>

                    <div style={styles.focusContent}>

                        <p style={styles.focusLabel}>
                            Recommended Focus
                        </p>

                        <h2 style={styles.focusTitle}>
                            {profile.recommended_focus.topic}
                        </h2>

                        <p style={styles.focusSubject}>
                            {profile.recommended_focus.subject}
                        </p>

                        <p style={styles.focusReason}>
                            Current mastery:
                            {" "}
                            <strong>
                                {
                                    profile
                                        .recommended_focus
                                        .mastery_percentage
                                }%
                            </strong>
                            {" "}
                            — start with foundational
                            learning and easy practice.
                        </p>

                    </div>

                </div>

            )}


            {/* Subject Progress */}

            <div style={styles.section}>

                <h2 style={styles.sectionTitle}>
                    📚 Subject Progress
                </h2>

                <div style={styles.subjectGrid}>

                    {profile.subject_progress.map(
                        (subject) => (

                            <div
                                key={subject.subject_id}
                                style={styles.subjectCard}
                            >

                                <div
                                    style={
                                        styles.subjectHeader
                                    }
                                >

                                    <span
                                        style={
                                            styles.subjectName
                                        }
                                    >
                                        {subject.subject}
                                    </span>

                                    <span
                                        style={
                                            styles.percentage
                                        }
                                    >
                                        {
                                            subject
                                                .mastery_percentage
                                        }%
                                    </span>

                                </div>


                                <div
                                    style={
                                        styles.progressBackground
                                    }
                                >

                                    <div
                                        style={{
                                            ...styles.progressBar,
                                            width: `${Math.min(
                                                subject.mastery_percentage,
                                                100
                                            )}%`,
                                            ...getMasteryClass(
                                                subject.mastery_percentage
                                            )
                                        }}
                                    />

                                </div>

                            </div>

                        )
                    )}

                </div>

            </div>


            {/* Weak Topics */}

            <div style={styles.section}>

                <h2 style={styles.sectionTitle}>
                    ⚠️ Topics Needing Improvement
                </h2>

                {profile.weak_topics.length === 0 ? (

                    <div style={styles.emptyCard}>
                        No weak topics currently identified.
                    </div>

                ) : (

                    <div style={styles.topicGrid}>

                        {profile.weak_topics.map(
                            (topic) => (

                                <div
                                    key={topic.topic_id}
                                    style={styles.topicCard}
                                >

                                    <div
                                        style={
                                            styles.topicTop
                                        }
                                    >

                                        <div>

                                            <h3
                                                style={
                                                    styles.topicName
                                                }
                                            >
                                                {topic.topic}
                                            </h3>

                                            <p
                                                style={
                                                    styles.topicSubject
                                                }
                                            >
                                                {topic.subject}
                                            </p>

                                        </div>

                                        <span
                                            style={
                                                getLevelBadge(
                                                    topic.level
                                                )
                                            }
                                        >
                                            {topic.level}
                                        </span>

                                    </div>


                                    <div
                                        style={
                                            styles.progressBackground
                                        }
                                    >

                                        <div
                                            style={{
                                                ...styles.progressBar,
                                                width: `${topic.mastery_percentage}%`,
                                                ...getMasteryClass(
                                                    topic.mastery_percentage
                                                )
                                            }}
                                        />

                                    </div>


                                    <p
                                        style={
                                            styles.masteryText
                                        }
                                    >
                                        Mastery:{" "}
                                        {
                                            topic
                                                .mastery_percentage
                                        }%
                                    </p>

                                </div>

                            )
                        )}

                    </div>

                )}

            </div>


            {/* Developing Topics */}

            <div style={styles.section}>

                <h2 style={styles.sectionTitle}>
                    📈 Developing Topics
                </h2>

                {profile.developing_topics.length === 0 ? (

                    <div style={styles.emptyCard}>
                        You haven't reached the developing
                        stage in any topic yet. Keep learning!
                    </div>

                ) : (

                    <div style={styles.topicGrid}>

                        {profile.developing_topics.map(
                            (topic) => (

                                <div
                                    key={topic.topic_id}
                                    style={styles.topicCard}
                                >

                                    <h3
                                        style={
                                            styles.topicName
                                        }
                                    >
                                        {topic.topic}
                                    </h3>

                                    <p
                                        style={
                                            styles.topicSubject
                                        }
                                    >
                                        {topic.subject}
                                    </p>

                                    <p
                                        style={
                                            styles.masteryText
                                        }
                                    >
                                        Mastery:{" "}
                                        {
                                            topic
                                                .mastery_percentage
                                        }%
                                    </p>

                                </div>

                            )
                        )}

                    </div>

                )}

            </div>


            {/* Strong Topics */}

            <div style={styles.section}>

                <h2 style={styles.sectionTitle}>
                    💪 Strong Topics
                </h2>

                {profile.strongest_topics.length === 0 ? (

                    <div style={styles.emptyCard}>
                        No strong topics yet. Complete
                        assessments to build your knowledge profile.
                    </div>

                ) : (

                    <div style={styles.topicGrid}>

                        {profile.strongest_topics.map(
                            (topic) => (

                                <div
                                    key={topic.topic_id}
                                    style={styles.topicCard}
                                >

                                    <h3
                                        style={
                                            styles.topicName
                                        }
                                    >
                                        {topic.topic}
                                    </h3>

                                    <p
                                        style={
                                            styles.topicSubject
                                        }
                                    >
                                        {topic.subject}
                                    </p>

                                    <p
                                        style={
                                            styles.masteryText
                                        }
                                    >
                                        Mastery:{" "}
                                        {
                                            topic
                                                .mastery_percentage
                                        }%
                                    </p>

                                </div>

                            )
                        )}

                    </div>

                )}

            </div>

        </div>
    );
}


const styles = {

    page: {
        minHeight: "100vh",
        background: "#f7f9fc",
        padding: "32px 5%",
        color: "#172033",
        fontFamily:
            "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    },

    header: {
        marginBottom: "25px"
    },

    backButton: {
        border: "none",
        background: "transparent",
        color: "#2563eb",
        fontSize: "15px",
        fontWeight: "600",
        cursor: "pointer",
        padding: "5px 0",
        marginBottom: "10px"
    },

    title: {
        fontSize: "32px",
        margin: "5px 0"
    },

    subtitle: {
        color: "#64748b",
        fontSize: "15px",
        marginTop: "8px"
    },

    profileCard: {
        display: "flex",
        alignItems: "center",
        gap: "18px",
        background: "#ffffff",
        borderRadius: "18px",
        padding: "22px",
        marginBottom: "25px",
        boxShadow:
            "0 5px 20px rgba(15, 23, 42, 0.06)"
    },

    avatar: {
        width: "60px",
        height: "60px",
        borderRadius: "50%",
        background: "#e0ecff",
        color: "#2563eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "25px",
        fontWeight: "700"
    },

    studentName: {
        margin: 0,
        fontSize: "21px"
    },

    studentDetails: {
        margin: "5px 0 0",
        color: "#64748b",
        fontSize: "14px"
    },

    summaryGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(210px, 1fr))",
        gap: "18px",
        marginBottom: "25px"
    },

    summaryCard: {
        background: "#ffffff",
        borderRadius: "18px",
        padding: "20px",
        display: "flex",
        alignItems: "center",
        gap: "15px",
        boxShadow:
            "0 5px 20px rgba(15, 23, 42, 0.05)"
    },

    cardIcon: {
        fontSize: "27px"
    },

    cardLabel: {
        margin: 0,
        color: "#64748b",
        fontSize: "13px"
    },

    cardValue: {
        margin: "5px 0 0",
        fontSize: "27px"
    },

    cardValueSmall: {
        margin: "7px 0 0",
        fontSize: "20px"
    },

    focusCard: {
        display: "flex",
        gap: "18px",
        background: "#eef5ff",
        border: "1px solid #d7e6ff",
        borderRadius: "18px",
        padding: "24px",
        marginBottom: "30px"
    },

    focusIcon: {
        fontSize: "30px"
    },

    focusContent: {
        flex: 1
    },

    focusLabel: {
        margin: 0,
        color: "#2563eb",
        fontSize: "13px",
        fontWeight: "700",
        textTransform: "uppercase"
    },

    focusTitle: {
        margin: "6px 0 2px",
        fontSize: "22px"
    },

    focusSubject: {
        margin: 0,
        color: "#64748b"
    },

    focusReason: {
        marginTop: "12px",
        color: "#475569"
    },

    section: {
        marginBottom: "32px"
    },

    sectionTitle: {
        fontSize: "21px",
        marginBottom: "15px"
    },

    subjectGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "15px"
    },

    subjectCard: {
        background: "#ffffff",
        padding: "18px",
        borderRadius: "15px",
        boxShadow:
            "0 4px 15px rgba(15, 23, 42, 0.04)"
    },

    subjectHeader: {
        display: "flex",
        justifyContent: "space-between",
        gap: "10px",
        marginBottom: "12px"
    },

    subjectName: {
        fontWeight: "600",
        fontSize: "14px"
    },

    percentage: {
        fontWeight: "700",
        fontSize: "14px"
    },

    progressBackground: {
        height: "9px",
        background: "#e8edf4",
        borderRadius: "20px",
        overflow: "hidden"
    },

    progressBar: {
        height: "100%",
        borderRadius: "20px",
        transition: "width 0.5s ease"
    },

    progressStrong: {
        background: "#16a34a"
    },

    progressDeveloping: {
        background: "#f59e0b"
    },

    progressWeak: {
        background: "#ef4444"
    },

    topicGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "15px"
    },

    topicCard: {
        background: "#ffffff",
        borderRadius: "15px",
        padding: "18px",
        boxShadow:
            "0 4px 15px rgba(15, 23, 42, 0.04)"
    },

    topicTop: {
        display: "flex",
        justifyContent: "space-between",
        gap: "12px",
        marginBottom: "15px"
    },

    topicName: {
        margin: 0,
        fontSize: "16px"
    },

    topicSubject: {
        margin: "5px 0 0",
        color: "#64748b",
        fontSize: "13px"
    },

    masteryText: {
        color: "#64748b",
        fontSize: "13px",
        marginBottom: 0
    },

    badgeStrong: {
        background: "#dcfce7",
        color: "#166534",
        padding: "5px 9px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: "700",
        height: "fit-content"
    },

    badgeDeveloping: {
        background: "#fef3c7",
        color: "#92400e",
        padding: "5px 9px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: "700",
        height: "fit-content"
    },

    badgeWeak: {
        background: "#fee2e2",
        color: "#991b1b",
        padding: "5px 9px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: "700",
        height: "fit-content"
    },

    emptyCard: {
        background: "#ffffff",
        borderRadius: "15px",
        padding: "20px",
        color: "#64748b"
    },

    loading: {
        textAlign: "center",
        paddingTop: "100px",
        color: "#64748b"
    },

    error: {
        background: "#fee2e2",
        color: "#991b1b",
        padding: "20px",
        borderRadius: "12px",
        marginBottom: "15px"
    }
};


export default KnowledgeProfile;