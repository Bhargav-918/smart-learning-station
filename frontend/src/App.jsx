import { useState } from "react";
import ParentLogin from "./pages/ParentLogin";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Assessment from "./pages/Assessment";
import AITutor from "./pages/AITutor";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import KnowledgeProfile from "./pages/KnowledgeProfile";
import ParentDashboard from "./pages/ParentDashboard";

function App() {

    // --------------------------------
    // Authentication
    // --------------------------------

    const [loggedIn, setLoggedIn] = useState(
        !!localStorage.getItem("token")
    );

    const [parentLoggedIn, setParentLoggedIn] = useState(
        !!localStorage.getItem("parentToken")
    );

    // --------------------------------
    // Student states
    // --------------------------------

    const [dashboardRefreshKey, setDashboardRefreshKey] =
        useState(0);
    const [showParentLogin, setShowParentLogin] = useState(false);
    const [assessment, setAssessment] =
        useState(null);

    const [showRegister, setShowRegister] =
        useState(false);

    const [aiTutor, setAiTutor] =
        useState(false);

    const [profile, setProfile] =
        useState(false);

    const [aiTutorTopic, setAiTutorTopic] =
        useState(null);

    const [knowledgeProfile, setKnowledgeProfile] =
        useState(false);


    // --------------------------------
    // Student Logout
    // --------------------------------

    const logout = () => {

        localStorage.removeItem("token");

        setLoggedIn(false);

        setAssessment(null);

        setAiTutor(false);

        setAiTutorTopic(null);

        setProfile(false);

        setKnowledgeProfile(false);

        setShowRegister(false);
    };


    // --------------------------------
    // Parent Logout
    // --------------------------------

    const parentLogout = () => {

        localStorage.removeItem("parentToken");

        setParentLoggedIn(false);
    };


    // --------------------------------
    // Parent Dashboard
    // --------------------------------

    if (parentLoggedIn) {

        return (
            <ParentDashboard
                onLogout={parentLogout}
            />
        );
    }


    // --------------------------------
    // Student Login / Registration
    // --------------------------------

    if (!loggedIn && !parentLoggedIn) {

        if (showParentLogin) {
            return (
                <ParentLogin
                    onLogin={() => {
                        localStorage.removeItem("token");
                        setParentLoggedIn(true);
                    }}
                    onBackToStudentLogin={() => {
                        setShowParentLogin(false);
                    }}
                />
            );
        }

        if (showRegister) {
            return (
                <Register
                    onRegister={() => {
                        setShowRegister(false);
                    }}
                    onBackToLogin={() => {
                        setShowRegister(false);
                    }}
                />
            );
        }

        return (
            <Login
                onLogin={() => {
                    localStorage.removeItem("parentToken");
                    setLoggedIn(true);
                }}
                onRegister={() => {
                    setShowRegister(true);
                }}
                onParentLogin={() => {
                    setShowParentLogin(true);
                }}
            />
        );
    }


    // --------------------------------
    // Student Profile
    // --------------------------------

    if (profile) {

        return (
            <Profile
                onBack={() => {
                    setProfile(false);
                }}
            />
        );
    }


    // --------------------------------
    // Knowledge Profile
    // --------------------------------

    if (knowledgeProfile) {

        return (
            <KnowledgeProfile

                onBack={() => {
                    setKnowledgeProfile(false);
                }}

            />
        );
    }


    // --------------------------------
    // AI Tutor
    // --------------------------------

    if (aiTutor) {

        return (
            <AITutor

                topicId={
                    aiTutorTopic?.topicId
                }

                topicName={
                    aiTutorTopic?.topicName
                }

                onBack={() => {
                    setAiTutor(false);
                }}

            />
        );
    }


    // --------------------------------
    // Assessment
    // --------------------------------

    if (assessment) {

        return (
            <Assessment

                key={
                    assessment.sessionId
                }

                topicId={
                    assessment.topicId
                }

                topicName={
                    assessment.topicName
                }

                aiPracticeMode={
                    assessment.aiPracticeMode
                }

                practiceMode={
                    assessment.practiceMode
                }

                reassessmentMode={
                    assessment.reassessmentMode
                }


                // -----------------------------
                // Back
                // -----------------------------

                onBack={() => {

                    setAssessment(null);

                    setDashboardRefreshKey(
                        (key) => key + 1
                    );

                }}


                // -----------------------------
                // Continue Learning
                // -----------------------------

                onContinueLearning={
                    (topicId, topicName) => {

                        setAssessment({

                            topicId,

                            topicName,

                            practiceMode: true,

                            aiPracticeMode: false,

                            reassessmentMode: false,

                            sessionId: Date.now()

                        });

                    }
                }


                // -----------------------------
                // AI Tutor
                // -----------------------------

                onOpenAITutor={
                    (topicId, topicName) => {

                        setAiTutorTopic({

                            topicId,

                            topicName

                        });

                        setAiTutor(true);

                    }
                }


                // -----------------------------
                // Reassessment
                // -----------------------------

                onStartReassessment={
                    (topicId, topicName) => {

                        setAssessment({

                            topicId,

                            topicName,

                            practiceMode: false,

                            aiPracticeMode: false,

                            reassessmentMode: true,

                            sessionId: Date.now()

                        });

                    }
                }

            />
        );
    }


    // --------------------------------
    // Student Dashboard
    // --------------------------------

    return (
        <Dashboard

            key={
                dashboardRefreshKey
            }


            // -----------------------------
            // Normal Assessment
            // -----------------------------

            onStartAssessment={
                (
                    topicId,
                    topicName,
                    practiceMode = false
                ) => {

                    setAssessment({

                        topicId,

                        topicName,

                        practiceMode,

                        aiPracticeMode: false,

                        reassessmentMode: false,

                        sessionId: Date.now()

                    });

                }
            }


            // -----------------------------
            // AI Practice
            // -----------------------------

            onStartAIPractice={
                (topicId, topicName) => {

                    setAssessment({

                        topicId,

                        topicName,

                        practiceMode: false,

                        aiPracticeMode: true,

                        reassessmentMode: false,

                        sessionId: Date.now()

                    });

                }
            }


            // -----------------------------
            // AI Tutor
            // -----------------------------

            onOpenAITutor={() => {

                setAiTutorTopic(null);

                setAiTutor(true);

            }}


            // -----------------------------
            // Student Profile
            // -----------------------------

            onOpenProfile={() => {

                setProfile(true);

            }}


            // -----------------------------
            // Knowledge Profile
            // -----------------------------

            onOpenKnowledgeProfile={() => {

                setKnowledgeProfile(true);

            }}


            // -----------------------------
            // Logout
            // -----------------------------

            onLogout={logout}

        />
    );
}

export default App;
