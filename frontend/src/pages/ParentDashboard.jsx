import { useEffect, useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

function ParentDashboard({ onLogout }) {
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);

    const [progress, setProgress] = useState(null);
    const [knowledgeProfile, setKnowledgeProfile] = useState(null);
    const [activity, setActivity] = useState(null);

    const [loadingStudents, setLoadingStudents] = useState(true);
    const [loadingData, setLoadingData] = useState(false);
    const [error, setError] = useState("");

    const token = localStorage.getItem("parentToken");

    useEffect(() => {
        loadStudents();
    }, []);

    useEffect(() => {
        if (selectedStudent) {
            loadStudentData(selectedStudent.student_id);
        }
    }, [selectedStudent]);

    async function loadStudents() {
        try {
            setLoadingStudents(true);
            setError("");

            const response = await fetch(
                `${API_BASE}/parent/students`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Failed to load students");
            }

            const data = await response.json();

            setStudents(data.students || []);

            if (data.students && data.students.length > 0) {
                setSelectedStudent(data.students[0]);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingStudents(false);
        }
    }

    async function loadStudentData(studentId) {
        try {
            setLoadingData(true);
            setError("");

            const headers = {
                Authorization: `Bearer ${token}`,
            };

            const [
                progressResponse,
                knowledgeResponse,
                activityResponse,
            ] = await Promise.all([
                fetch(
                    `${API_BASE}/parent/student/${studentId}/progress`,
                    { headers }
                ),

                fetch(
                    `${API_BASE}/parent/student/${studentId}/knowledge-profile`,
                    { headers }
                ),

                fetch(
                    `${API_BASE}/parent/student/${studentId}/activity`,
                    { headers }
                ),
            ]);

            if (!progressResponse.ok) {
                throw new Error("Failed to load student progress");
            }

            if (!knowledgeResponse.ok) {
                throw new Error("Failed to load knowledge profile");
            }

            if (!activityResponse.ok) {
                throw new Error("Failed to load student activity");
            }

            const progressData = await progressResponse.json();
            const knowledgeData = await knowledgeResponse.json();
            const activityData = await activityResponse.json();

            setProgress(progressData);
            setKnowledgeProfile(knowledgeData);
            setActivity(activityData);
        } catch (err) {
            setError(err.message);
            setProgress(null);
            setKnowledgeProfile(null);
            setActivity(null);
        } finally {
            setLoadingData(false);
        }
    }

    function handleLogout() {
        localStorage.removeItem("parentToken");

        if (onLogout) {
            onLogout();
        }
    }

    function getMasteryClass(value) {
        if (value >= 70) return "strong";
        if (value >= 40) return "developing";
        return "weak";
    }

    function formatDate(dateString) {
        if (!dateString) return "-";

        return new Date(dateString).toLocaleString();
    }

    if (loadingStudents) {
        return (
            <div className="parent-page">
                <div className="loading-card">
                    Loading parent dashboard...
                </div>
            </div>
        );
    }

    if (error && students.length === 0) {
        return (
            <div className="parent-page">
                <div className="parent-header">
                    <div>
                        <h1>Parent Dashboard</h1>
                        <p>Monitor your student's learning progress</p>
                    </div>

                    <button
                        className="logout-btn"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>

                <div className="error-card">
                    {error}
                </div>
            </div>
        );
    }

    if (students.length === 0) {
        return (
            <div className="parent-page">
                <div className="parent-header">
                    <div>
                        <h1>Parent Dashboard</h1>
                        <p>No students linked yet</p>
                    </div>

                    <button
                        className="logout-btn"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>

                <div className="empty-card">
                    <div className="empty-icon">👨‍👩‍👧</div>
                    <h2>No Student Linked</h2>
                    <p>
                        Link a student account to start monitoring
                        learning progress.
                    </p>
                </div>
            </div>
        );
    }

    const summary = knowledgeProfile?.knowledge_summary;
    const subjectProgress =
        knowledgeProfile?.subject_progress || [];

    const strongestTopics =
        knowledgeProfile?.strongest_topics || [];

    const developingTopics =
        knowledgeProfile?.developing_topics || [];

    const weakTopics =
        knowledgeProfile?.weak_topics || [];

    const recentActivities =
        activity?.activities || [];

    return (
        <div className="parent-page">

            {/* HEADER */}
            <header className="parent-header">

                <div>
                    <h1>Parent Dashboard</h1>
                    <p>
                        Monitor and understand your student's
                        learning journey
                    </p>
                </div>

                <button
                    className="logout-btn"
                    onClick={handleLogout}
                >
                    Logout
                </button>

            </header>

            {/* STUDENT SELECTOR */}
            <section className="student-selector-card">

                <div>
                    <span className="section-label">
                        SELECT STUDENT
                    </span>

                    <h2>
                        {selectedStudent?.full_name}
                    </h2>

                    <p>
                        {selectedStudent?.email}
                    </p>
                </div>

                {students.length > 1 && (
                    <select
                        value={selectedStudent?.student_id || ""}
                        onChange={(e) => {
                            const student =
                                students.find(
                                    (item) =>
                                        item.student_id ===
                                        Number(e.target.value)
                                );

                            setSelectedStudent(student);
                        }}
                    >
                        {students.map((student) => (
                            <option
                                key={student.student_id}
                                value={student.student_id}
                            >
                                {student.full_name}
                            </option>
                        ))}
                    </select>
                )}

            </section>

            {loadingData ? (
                <div className="loading-card">
                    Loading student data...
                </div>
            ) : (
                <>
                    {error && (
                        <div className="error-card">
                            {error}
                        </div>
                    )}

                    {/* STUDENT PROFILE */}
                    <section className="profile-card">

                        <div className="profile-avatar">
                            {selectedStudent?.full_name
                                ?.charAt(0)
                                ?.toUpperCase()}
                        </div>

                        <div className="profile-info">

                            <h2>
                                {knowledgeProfile?.student?.name ||
                                    selectedStudent?.full_name}
                            </h2>

                            <p>
                                {knowledgeProfile?.student?.degree ||
                                    "Education details not available"}
                                {" "}
                                {knowledgeProfile?.student?.branch &&
                                    `• ${knowledgeProfile.student.branch}`}
                            </p>

                            <div className="profile-details">
                                <span>
                                    Level:{" "}
                                    {knowledgeProfile?.student
                                        ?.education_level || "-"}
                                </span>

                                <span>
                                    Year:{" "}
                                    {knowledgeProfile?.student
                                        ?.current_year || "-"}
                                </span>

                                <span>
                                    Semester:{" "}
                                    {knowledgeProfile?.student
                                        ?.semester || "-"}
                                </span>
                            </div>

                        </div>

                    </section>

                    {/* SUMMARY CARDS */}
                    <section className="stats-grid">

                        <div className="stat-card">
                            <span className="stat-icon">🎯</span>
                            <div>
                                <p>Overall Mastery</p>
                                <h2>
                                    {summary?.overall_mastery ?? 0}%
                                </h2>
                            </div>
                        </div>

                        <div className="stat-card">
                            <span className="stat-icon">📈</span>
                            <div>
                                <p>Learning Level</p>
                                <h2>
                                    {summary?.learning_level || "-"}
                                </h2>
                            </div>
                        </div>

                        <div className="stat-card">
                            <span className="stat-icon">📝</span>
                            <div>
                                <p>Questions Answered</p>
                                <h2>
                                    {summary?.questions_answered ?? 0}
                                </h2>
                            </div>
                        </div>

                        <div className="stat-card">
                            <span className="stat-icon">✅</span>
                            <div>
                                <p>Accuracy</p>
                                <h2>
                                    {summary?.accuracy ?? 0}%
                                </h2>
                            </div>
                        </div>

                    </section>

                    {/* SUBJECT PROGRESS */}
                    <section className="dashboard-section">

                        <div className="section-heading">
                            <div>
                                <h2>Subject Progress</h2>
                                <p>
                                    Current mastery across subjects
                                </p>
                            </div>
                        </div>

                        <div className="subject-list">

                            {subjectProgress.length === 0 ? (
                                <p className="muted">
                                    No subject progress available.
                                </p>
                            ) : (
                                subjectProgress.map((subject) => (
                                    <div
                                        className="subject-row"
                                        key={subject.subject_id}
                                    >

                                        <div className="subject-name">
                                            <strong>
                                                {subject.subject}
                                            </strong>

                                            <span>
                                                {subject.mastery_percentage}%
                                            </span>
                                        </div>

                                        <div className="progress-bar">
                                            <div
                                                className={`progress-fill ${getMasteryClass(
                                                    subject.mastery_percentage
                                                )}`}
                                                style={{
                                                    width: `${Math.min(
                                                        subject.mastery_percentage,
                                                        100
                                                    )}%`,
                                                }}
                                            />
                                        </div>

                                    </div>
                                ))
                            )}

                        </div>

                    </section>

                    {/* TOPIC ANALYSIS */}
                    <section className="topic-grid">

                        {/* WEAK */}
                        <div className="topic-card weak-card">

                            <div className="topic-card-header">
                                <span>⚠️</span>
                                <div>
                                    <h2>Needs Improvement</h2>
                                    <p>
                                        Topics requiring more practice
                                    </p>
                                </div>
                            </div>

                            {weakTopics.length === 0 ? (
                                <p className="muted">
                                    No weak topics found.
                                </p>
                            ) : (
                                weakTopics.map((topic) => (
                                    <div
                                        className="topic-item"
                                        key={topic.topic_id}
                                    >
                                        <div>
                                            <strong>
                                                {topic.topic}
                                            </strong>
                                            <small>
                                                {topic.subject}
                                            </small>
                                        </div>

                                        <span>
                                            {topic.mastery_percentage}%
                                        </span>
                                    </div>
                                ))
                            )}

                        </div>

                        {/* DEVELOPING */}
                        <div className="topic-card developing-card">

                            <div className="topic-card-header">
                                <span>📚</span>
                                <div>
                                    <h2>Developing</h2>
                                    <p>
                                        Topics still being strengthened
                                    </p>
                                </div>
                            </div>

                            {developingTopics.length === 0 ? (
                                <p className="muted">
                                    No developing topics found.
                                </p>
                            ) : (
                                developingTopics.map((topic) => (
                                    <div
                                        className="topic-item"
                                        key={topic.topic_id}
                                    >
                                        <div>
                                            <strong>
                                                {topic.topic}
                                            </strong>
                                            <small>
                                                {topic.subject}
                                            </small>
                                        </div>

                                        <span>
                                            {topic.mastery_percentage}%
                                        </span>
                                    </div>
                                ))
                            )}

                        </div>

                        {/* STRONG */}
                        <div className="topic-card strong-card">

                            <div className="topic-card-header">
                                <span>⭐</span>
                                <div>
                                    <h2>Strong Topics</h2>
                                    <p>
                                        Topics with good mastery
                                    </p>
                                </div>
                            </div>

                            {strongestTopics.length === 0 ? (
                                <p className="muted">
                                    No strong topics found.
                                </p>
                            ) : (
                                strongestTopics.map((topic) => (
                                    <div
                                        className="topic-item"
                                        key={topic.topic_id}
                                    >
                                        <div>
                                            <strong>
                                                {topic.topic}
                                            </strong>
                                            <small>
                                                {topic.subject}
                                            </small>
                                        </div>

                                        <span>
                                            {topic.mastery_percentage}%
                                        </span>
                                    </div>
                                ))
                            )}

                        </div>

                    </section>

                    {/* RECOMMENDED FOCUS */}
                    {knowledgeProfile?.recommended_focus && (
                        <section className="recommendation-card">

                            <div className="recommendation-icon">
                                🎯
                            </div>

                            <div>
                                <span className="section-label">
                                    RECOMMENDED FOCUS
                                </span>

                                <h2>
                                    {
                                        knowledgeProfile
                                            .recommended_focus
                                            .topic
                                    }
                                </h2>

                                <p>
                                    This topic currently has a mastery
                                    of{" "}
                                    {
                                        knowledgeProfile
                                            .recommended_focus
                                            .mastery_percentage
                                    }
                                    %. More practice may help improve
                                    the student's understanding.
                                </p>
                            </div>

                        </section>
                    )}

                    {/* RECENT ACTIVITY */}
                    <section className="dashboard-section">

                        <div className="section-heading">
                            <div>
                                <h2>Recent Learning Activity</h2>
                                <p>
                                    Latest questions attempted by the
                                    student
                                </p>
                            </div>

                            <span className="activity-count">
                                {activity?.total_activities || 0} recent
                            </span>
                        </div>

                        <div className="activity-list">

                            {recentActivities.length === 0 ? (
                                <p className="muted">
                                    No learning activity available.
                                </p>
                            ) : (
                                recentActivities.map((item) => (
                                    <div
                                        className="activity-item"
                                        key={item.attempt_id}
                                    >

                                        <div
                                            className={`activity-status ${
                                                item.correct
                                                    ? "correct"
                                                    : "incorrect"
                                            }`}
                                        >
                                            {item.correct ? "✓" : "✕"}
                                        </div>

                                        <div className="activity-content">

                                            <strong>
                                                {item.question ||
                                                    "Question"}
                                            </strong>

                                            <div className="activity-meta">
                                                <span>
                                                    {item.subject ||
                                                        "Unknown subject"}
                                                </span>

                                                <span>•</span>

                                                <span>
                                                    {item.topic ||
                                                        "Unknown topic"}
                                                </span>

                                                <span>•</span>

                                                <span>
                                                    {formatDate(
                                                        item.created_at
                                                    )}
                                                </span>
                                            </div>

                                        </div>

                                        <div className="activity-result">

                                            <span
                                                className={
                                                    item.correct
                                                        ? "result-correct"
                                                        : "result-incorrect"
                                                }
                                            >
                                                {item.correct
                                                    ? "Correct"
                                                    : "Incorrect"}
                                            </span>

                                            {item.response_time !==
                                                null &&
                                                item.response_time !==
                                                undefined && (
                                                    <small>
                                                        {
                                                            item.response_time
                                                        }
                                                        s
                                                    </small>
                                                )}

                                        </div>

                                    </div>
                                ))
                            )}

                        </div>

                    </section>

                </>
            )}

            {/* FOOTER */}
            <footer className="parent-footer">
                <p>
                    AI-Powered Adaptive Smart Learning Station
                </p>

                <span>
                    Personalized learning • Continuous improvement
                </span>
            </footer>

            <style>{`
                * {
                    box-sizing: border-box;
                }

                .parent-page {
                    min-height: 100vh;
                    background: #f6f8fc;
                    color: #172033;
                    padding: 28px;
                    font-family: Inter, Arial, sans-serif;
                }

                .parent-header {
                    max-width: 1250px;
                    margin: 0 auto 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .parent-header h1 {
                    margin: 0;
                    font-size: 30px;
                }

                .parent-header p {
                    margin: 7px 0 0;
                    color: #6b7280;
                }

                .logout-btn {
                    border: none;
                    background: #172033;
                    color: white;
                    padding: 11px 20px;
                    border-radius: 10px;
                    cursor: pointer;
                    font-weight: 600;
                }

                .student-selector-card,
                .profile-card,
                .dashboard-section,
                .recommendation-card,
                .loading-card,
                .error-card,
                .empty-card {
                    max-width: 1250px;
                    margin-left: auto;
                    margin-right: auto;
                }

                .student-selector-card {
                    background: white;
                    border: 1px solid #e5e9f2;
                    border-radius: 18px;
                    padding: 22px 26px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    box-shadow: 0 5px 20px rgba(30, 45, 80, 0.05);
                }

                .section-label {
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: 1px;
                    color: #64748b;
                }

                .student-selector-card h2 {
                    margin: 6px 0 3px;
                }

                .student-selector-card p {
                    margin: 0;
                    color: #64748b;
                }

                .student-selector-card select {
                    min-width: 220px;
                    padding: 11px 14px;
                    border: 1px solid #d9dfeb;
                    border-radius: 10px;
                    background: white;
                    font-size: 14px;
                }

                .profile-card {
                    background: white;
                    border: 1px solid #e5e9f2;
                    border-radius: 18px;
                    padding: 25px;
                    display: flex;
                    gap: 20px;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .profile-avatar {
                    width: 72px;
                    height: 72px;
                    border-radius: 50%;
                    background: #e8efff;
                    color: #2855c5;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 28px;
                    font-weight: 800;
                }

                .profile-info h2 {
                    margin: 0 0 5px;
                }

                .profile-info p {
                    margin: 0;
                    color: #64748b;
                }

                .profile-details {
                    display: flex;
                    gap: 18px;
                    margin-top: 13px;
                    flex-wrap: wrap;
                    font-size: 13px;
                    color: #475569;
                }

                .stats-grid {
                    max-width: 1250px;
                    margin: 0 auto 20px;
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 16px;
                }

                .stat-card {
                    background: white;
                    border: 1px solid #e5e9f2;
                    border-radius: 17px;
                    padding: 21px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }

                .stat-icon {
                    font-size: 27px;
                }

                .stat-card p {
                    margin: 0 0 5px;
                    color: #64748b;
                    font-size: 13px;
                }

                .stat-card h2 {
                    margin: 0;
                    font-size: 24px;
                }

                .dashboard-section {
                    background: white;
                    border: 1px solid #e5e9f2;
                    border-radius: 18px;
                    padding: 25px;
                    margin-bottom: 20px;
                }

                .section-heading {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 22px;
                }

                .section-heading h2 {
                    margin: 0 0 5px;
                    font-size: 20px;
                }

                .section-heading p {
                    margin: 0;
                    color: #64748b;
                    font-size: 13px;
                }

                .subject-row {
                    margin-bottom: 19px;
                }

                .subject-name {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    font-size: 14px;
                }

                .subject-name span {
                    color: #64748b;
                }

                .progress-bar {
                    height: 10px;
                    background: #edf0f5;
                    border-radius: 20px;
                    overflow: hidden;
                }

                .progress-fill {
                    height: 100%;
                    border-radius: 20px;
                    transition: width 0.5s ease;
                }

                .progress-fill.strong {
                    background: #22a06b;
                }

                .progress-fill.developing {
                    background: #e5a11a;
                }

                .progress-fill.weak {
                    background: #dc5360;
                }

                .topic-grid {
                    max-width: 1250px;
                    margin: 0 auto 20px;
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 18px;
                }

                .topic-card {
                    background: white;
                    border: 1px solid #e5e9f2;
                    border-radius: 18px;
                    padding: 22px;
                }

                .topic-card-header {
                    display: flex;
                    gap: 12px;
                    align-items: flex-start;
                    margin-bottom: 17px;
                }

                .topic-card-header > span {
                    font-size: 22px;
                }

                .topic-card-header h2 {
                    margin: 0 0 4px;
                    font-size: 17px;
                }

                .topic-card-header p {
                    margin: 0;
                    font-size: 12px;
                    color: #64748b;
                }

                .topic-item {
                    border-top: 1px solid #edf0f5;
                    padding: 13px 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 12px;
                }

                .topic-item strong {
                    display: block;
                    font-size: 13px;
                }

                .topic-item small {
                    display: block;
                    color: #64748b;
                    margin-top: 4px;
                    font-size: 11px;
                }

                .topic-item > span {
                    font-weight: 800;
                    font-size: 13px;
                }

                .weak-card .topic-item > span {
                    color: #d34b59;
                }

                .developing-card .topic-item > span {
                    color: #c48608;
                }

                .strong-card .topic-item > span {
                    color: #17865a;
                }

                .recommendation-card {
                    background: #edf4ff;
                    border: 1px solid #d4e3ff;
                    border-radius: 18px;
                    padding: 24px;
                    display: flex;
                    align-items: center;
                    gap: 18px;
                    margin-bottom: 20px;
                }

                .recommendation-icon {
                    font-size: 30px;
                }

                .recommendation-card h2 {
                    margin: 5px 0;
                    font-size: 19px;
                }

                .recommendation-card p {
                    margin: 0;
                    color: #52627a;
                    font-size: 13px;
                    line-height: 1.5;
                }

                .activity-count {
                    background: #eef2f8;
                    padding: 7px 11px;
                    border-radius: 8px;
                    font-size: 12px;
                    color: #475569;
                }

                .activity-item {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    padding: 15px 0;
                    border-top: 1px solid #edf0f5;
                }

                .activity-status {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 800;
                }

                .activity-status.correct {
                    background: #e7f7ef;
                    color: #168557;
                }

                .activity-status.incorrect {
                    background: #fdebed;
                    color: #ce4654;
                }

                .activity-content {
                    flex: 1;
                    min-width: 0;
                }

                .activity-content strong {
                    display: block;
                    font-size: 13px;
                    line-height: 1.45;
                }

                .activity-meta {
                    display: flex;
                    gap: 7px;
                    flex-wrap: wrap;
                    margin-top: 6px;
                    color: #64748b;
                    font-size: 11px;
                }

                .activity-result {
                    min-width: 75px;
                    text-align: right;
                }

                .result-correct {
                    color: #168557;
                    font-size: 12px;
                    font-weight: 800;
                }

                .result-incorrect {
                    color: #ce4654;
                    font-size: 12px;
                    font-weight: 800;
                }

                .activity-result small {
                    display: block;
                    color: #64748b;
                    margin-top: 3px;
                }

                .loading-card,
                .error-card,
                .empty-card {
                    background: white;
                    border-radius: 18px;
                    padding: 40px;
                    text-align: center;
                    border: 1px solid #e5e9f2;
                }

                .error-card {
                    color: #c83f4d;
                    background: #fff5f6;
                    border-color: #ffd9dd;
                }

                .empty-icon {
                    font-size: 45px;
                }

                .empty-card h2 {
                    margin-bottom: 8px;
                }

                .empty-card p {
                    color: #64748b;
                }

                .muted {
                    color: #94a3b8;
                    font-size: 13px;
                }

                .parent-footer {
                    max-width: 1250px;
                    margin: 35px auto 0;
                    padding: 20px 0;
                    text-align: center;
                    border-top: 1px solid #e5e9f2;
                    color: #64748b;
                    font-size: 12px;
                }

                .parent-footer p {
                    margin: 0 0 5px;
                    font-weight: 700;
                    color: #334155;
                }

                @media (max-width: 900px) {
                    .stats-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .topic-grid {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-width: 600px) {
                    .parent-page {
                        padding: 15px;
                    }

                    .parent-header {
                        align-items: flex-start;
                        gap: 15px;
                    }

                    .student-selector-card {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .student-selector-card select {
                        width: 100%;
                    }

                    .stats-grid {
                        grid-template-columns: 1fr;
                    }

                    .profile-card {
                        align-items: flex-start;
                    }

                    .profile-details {
                        flex-direction: column;
                        gap: 7px;
                    }

                    .activity-item {
                        align-items: flex-start;
                    }

                    .activity-result {
                        min-width: auto;
                    }
                }
            `}</style>
        </div>
    );
}

export default ParentDashboard;