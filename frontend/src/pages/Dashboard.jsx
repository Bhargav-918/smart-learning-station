import { useEffect, useState } from "react";
import API from "../services/api";

const icons = ["🧠", "🛡️", "🌐", "🐍"];

function Dashboard({
                    onStartAssessment,
                    onOpenAITutor,
                    onStartAIPractice,
                    onOpenProfile,
                    onOpenKnowledgeProfile,
                    onLogout
                   })  {
 const [user, setUser] = useState(null);
 const [subjects, setSubjects] = useState([]);
 const [selectedSubject, setSelectedSubject] = useState(null);
 const [topics, setTopics] = useState([]);
 const [recommendation, setRecommendation] = useState(null);
 const [dashboardData, setDashboardData] = useState(null);
 const [progressData, setProgressData] = useState(null);
 const [activeNav, setActiveNav] = useState("Dashboard");

 useEffect(() => {
  loadUser();
  loadSubjects();
  loadRecommendation();
  loadDashboardData();
  loadProgress();
 }, []);

 const loadUser = async () => {
  try {
   const r = await API.get("/auth/me");
   setUser(r.data);
  } catch (e) {
   if (e.response?.status === 401) {
    onLogout();
   }
  }
 };

 const loadSubjects = async () => {
  try {
   const r = await API.get("/learning/subjects");
   setSubjects(r.data);
  } catch (e) {
   console.error(e);
  }
 };

 const loadTopics = async (id) => {
  try {
   const r = await API.get(`/learning/subjects/${id}/topics`);
   setTopics(r.data);
  } catch (e) {
   console.error(e);
  }
 };

 const loadRecommendation = async () => {
  try {
   const r = await API.get("/learning/recommendation");
   setRecommendation(r.data);
  } catch (e) {
   console.error("Recommendation error:", e);
  }
 };

 const loadDashboardData = async () => {
  try {
   const r = await API.get("/learning/dashboard");
   setDashboardData(r.data);
  } catch (e) {
   console.error("Dashboard error:", e);
  }
 };

 const loadProgress = async () => {
  try {
   const r = await API.get("/learning/progress");
   setProgressData(r.data);
  } catch (e) {
   console.error("Progress error:", e);
  }
 };

 const selectSubject = (s) => {
  setSelectedSubject(s);
  loadTopics(s.id);
  setActiveNav("Subjects");
 };

 const selectSubjectForAssessment = (s) => {
  setSelectedSubject(s);
  loadTopics(s.id);
  setActiveNav("Assessment");
 };

 const nav = [
  ["⌂", "Dashboard"],
  ["▣", "Subjects"],
  ["✓", "Assessment"],
  ["◔", "Progress"],
  ["✦", "AI Tutor"],
  ["👤", "Profile"]
 ];

 return (
     <div className="app-shell">
      <div className="app-layout">

       {/* SIDEBAR */}
       <aside className="sidebar">

        <div className="brand">
         <div className="brand-mark">✦</div>
         <span>SmartLearn</span>
        </div>

        <nav className="nav">
         {nav.map(([icon, name]) => (
             <button
                 key={name}
                 className={`nav-item ${
                     activeNav === name ? "active" : ""
                 }`}
                 onClick={() => {
                  if (name === "AI Tutor") {
                   onOpenAITutor();
                   return;
                  }

                  if (name === "Profile") {
                   onOpenProfile();
                   return;
                  }

                  setActiveNav(name);

                  if (
                      name === "Subjects" &&
                      subjects[0]
                  ) {
                   selectSubject(subjects[0]);
                  }
                 }}
             >
              <span className="nav-icon">{icon}</span>
              <span>{name}</span>
             </button>
         ))}
        </nav>

        <div className="sidebar-bottom">

         <button onClick={onOpenKnowledgeProfile}>
          🧠 Knowledge Profile
         </button>

         <button
             className="nav-item"
             onClick={onLogout}
         >
          <span className="nav-icon">↪</span>
          <span>Sign out</span>
         </button>

         <div className="profile-mini">
          <div className="avatar">
           {(user?.full_name || "S")[0].toUpperCase()}
          </div>

          <div>
           <strong>
            {user?.full_name || "Student"}
           </strong>

           <span>Student account</span>
          </div>
         </div>

        </div>
       </aside>

       {/* MAIN */}
       <main className="main">

        <header className="topbar">

         <div className="topbar-title">
          {activeNav}
         </div>

         <div className="topbar-actions">

          <button className="icon-btn">
           🔔
          </button>

          <div className="top-profile">

           <div className="avatar">
            {(user?.full_name || "S")[0].toUpperCase()}
           </div>

           <strong style={{ fontSize: 13 }}>
            {user?.full_name || "Student"}
           </strong>

          </div>

         </div>

        </header>

        <div className="page">

         {/* ================= DASHBOARD ================= */}

         {activeNav === "Dashboard" && (
             <>

              {/* HERO */}
              <div className="hero">

               <div>

                <div className="eyebrow">
                 Personal learning space
                </div>

                <h1>
                 Good morning,{" "}
                 {user?.full_name?.split(" ")[0] ||
                     "Student"}{" "}
                 👋
                </h1>

                <p>
                 Your learning path changes as you
                 learn. Let's make progress today.
                </p>

               </div>

               <button
                   className="hero-action"
                   onClick={() =>
                       subjects[0] &&
                       selectSubject(subjects[0])
                   }
               >
                Explore subjects →
               </button>

              </div>

              {/* STATS */}
              <div className="stats-grid">

               <Stat
                   icon="📚"
                   label="Subjects"
                   value={subjects.length}
                   note="Available to learn"
               />

               <Stat
                   icon="◔"
                   label="Current mastery"
                   value={
                    recommendation
                        ? `${Math.round(
                            recommendation.mastery_percentage ??
                            ((recommendation.mastery ?? 0) * 100)
                        )}%`
                        : "0%"
                   }
                   note={
                    recommendation
                        ? recommendation.topic
                        : "Complete an assessment"
                   }
               />

               <Stat
                   icon="🔥"
                   label="Learning streak"
                   value={`${dashboardData?.learning_streak || 0} days`}
                   note={
                    dashboardData?.learning_streak > 0
                        ? "Keep going"
                        : "Start today"
                   }
               />

               <Stat
                   icon="✓"
                   label="Questions"
                   value={dashboardData?.assessments_completed || 0}
                   note="Answered"
               />

              </div>

              {/* MAIN CONTENT */}
              <div className="content-grid">

               {/* SUBJECTS */}
               <section className="panel">

                <div className="panel-head">

                 <div>
                  <h2>Your subjects</h2>

                  <p>
                   Choose a subject to explore
                   its topics.
                  </p>
                 </div>

                 <button className="text-btn">
                  View all
                 </button>

                </div>

                <div className="subject-list">

                 {subjects.map((s, i) => (

                     <button
                         className="subject-row"
                         key={s.id}
                         onClick={() =>
                             selectSubject(s)
                         }
                     >

                      <div className="subject-icon">
                       {icons[
                       i % icons.length
                           ]}
                      </div>

                      <div className="subject-info">

                       <h3>{s.name}</h3>

                       <p>
                        {s.description ||
                            "Explore concepts and build mastery."}
                       </p>

                       <div className="progress-line">
                             <span
                                 style={{
                                  width: `${
                                      dashboardData?.subject_progress?.find(
                                          (item) =>
                                              item.subject_id === s.id
                                      )?.mastery_percentage || 0
                                  }%`
                                 }}
                             />
                       </div>

                      </div>

                      <div className="subject-percent">
                       {
                           dashboardData?.subject_progress?.find(
                               (item) =>
                                   item.subject_id === s.id
                           )?.mastery_percentage || 0
                       }%
                      </div>

                      <span
                          style={{
                           color: "#a1a8b7"
                          }}
                      >
                                                        ›
                                                    </span>

                     </button>

                 ))}

                </div>

               </section>

               {/* ADAPTIVE RECOMMENDATION */}
               <aside className="ai-panel">

                <div className="ai-badge">
                 ✦ AI LEARNING INSIGHT
                </div>

                {recommendation?.topic ? (
                    <>
                     <h2>
                      Your personalized next step
                     </h2>

                     <p>
                      SmartLearn analyzed your recent
                      performance and identified the
                      learning area that needs the most
                      attention.
                     </p>

                     <div className="insight">

                      <div
                          style={{
                           display: "flex",
                           justifyContent: "space-between",
                           alignItems: "center",
                           gap: 12
                          }}
                      >
                       <strong>
                        ⚠ Weak Topic Detected
                       </strong>

                       <span
                           style={{
                            fontSize: 12,
                            fontWeight: 600,
                            padding: "5px 9px",
                            borderRadius: 20,
                            background: "#eef2ff",
                            color: "#4f46e5"
                           }}
                       >
                        AI Recommended
                    </span>
                      </div>

                      <div
                          style={{
                           fontSize: 22,
                           fontWeight: 700,
                           marginTop: 10
                          }}
                      >
                       {recommendation.topic}
                      </div>

                      {/* MASTERY */}

                      <div style={{ marginTop: 18 }}>

                       <div
                           style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 7,
                            fontSize: 13
                           }}
                       >
                        <strong>
                         Current mastery
                        </strong>

                        <strong>
                         {Math.round(
                             recommendation.mastery_percentage ??
                             ((recommendation.mastery ?? 0) * 100)
                         )}%
                        </strong>
                       </div>

                       <div className="progress-line">

                        <span
                            style={{
                             width: `${Math.min(
                                 recommendation.mastery_percentage ??
                                 ((recommendation.mastery ?? 0) * 100),
                                 100
                             )}%`
                            }}
                        />

                       </div>

                      </div>

                      {/* ADAPTIVE DECISION */}

                      <div
                          style={{
                           display: "grid",
                           gridTemplateColumns:
                               "repeat(2, minmax(0, 1fr))",
                           gap: 12,
                           marginTop: 18
                          }}
                      >

                       <div
                           style={{
                            padding: 12,
                            borderRadius: 12,
                            background: "#f8fafc"
                           }}
                       >
                        <div
                            style={{
                             fontSize: 11,
                             color: "#718096",
                             textTransform: "uppercase",
                             letterSpacing: 0.5
                            }}
                        >
                         Recommended level
                        </div>

                        <strong
                            style={{
                             display: "block",
                             marginTop: 4,
                             textTransform: "capitalize"
                            }}
                        >
                         {recommendation.difficulty}
                        </strong>
                       </div>

                       <div
                           style={{
                            padding: 12,
                            borderRadius: 12,
                            background: "#f8fafc"
                           }}
                       >
                        <div
                            style={{
                             fontSize: 11,
                             color: "#718096",
                             textTransform: "uppercase",
                             letterSpacing: 0.5
                            }}
                        >
                         Next action
                        </div>

                        <strong
                            style={{
                             display: "block",
                             marginTop: 4,
                             textTransform: "capitalize"
                            }}
                        >
                         {recommendation.action}
                        </strong>
                       </div>

                      </div>

                      {/* REASON */}

                      <div
                          style={{
                           marginTop: 18,
                           padding: 14,
                           borderRadius: 12,
                           background: "#f8fafc"
                          }}
                      >

                       <strong
                           style={{
                            fontSize: 13
                           }}
                       >
                        Why this recommendation?
                       </strong>

                       <p
                           style={{
                            marginTop: 7,
                            marginBottom: 0,
                            fontSize: 13
                           }}
                       >
                        {recommendation.reason}
                       </p>

                      </div>

                      {/* ADAPTIVE LEARNING PATH */}

                      <div style={{ marginTop: 18 }}>

                       <strong
                           style={{
                            fontSize: 13
                           }}
                       >
                        Adaptive learning path
                       </strong>

                       <div
                           style={{
                            display: "flex",
                            flexWrap: "wrap",
                            alignItems: "center",
                            gap: 7,
                            marginTop: 10
                           }}
                       >

                        {[
                         "Learn",
                         "Practice",
                         "Reassess",
                         "Improve"
                        ].map((step, index) => (
                            <span
                                key={step}
                                style={{
                                 display: "flex",
                                 alignItems: "center",
                                 gap: 7
                                }}
                            >

                                <span
                                    style={{
                                     padding:
                                         "6px 10px",
                                     borderRadius: 8,
                                     background:
                                         "#eef2ff",
                                     color:
                                         "#4f46e5",
                                     fontSize: 11,
                                     fontWeight: 600
                                    }}
                                >
                                    {step}
                                </span>

                             {index < 3 && (
                                 <span
                                     style={{
                                      color:
                                          "#a1a8b7"
                                     }}
                                 >
                                        →
                                    </span>
                             )}

                            </span>
                        ))}

                       </div>

                      </div>

                      {/* ACTION BUTTON */}

                      <button
                          className="hero-action"
                          style={{
                           marginTop: 20,
                           width: "100%"
                          }}
                          onClick={() => {
                           if (
                               recommendation?.topic_id &&
                               recommendation?.topic
                           ) {
                            onStartAIPractice(
                                recommendation.topic_id,
                                recommendation.topic
                            );
                           } else {
                            setActiveNav("Subjects");
                           }
                          }}
                      >
                       ✦ Start AI Practice
                      </button>
                     </div>
                    </>
                ) : (
                    <>
                     <h2>
                      Your adaptive journey starts here.
                     </h2>

                     <p>
                      Complete an assessment and SmartLearn
                      will begin building your topic-level
                      knowledge profile.
                     </p>

                     <div className="insight">

                      <strong>
                       Next step
                      </strong>

                      <p style={{ marginTop: 8 }}>
                       Choose a subject → open a topic →
                       take an assessment.
                      </p>

                      <p style={{ marginBottom: 0 }}>
                       Your performance will drive future
                       recommendations and difficulty
                       adjustments.
                      </p>

                     </div>
                    </>
                )}

               </aside>
              </div>

              {/* ADAPTIVE FLOW */}
              <section className="panel flow-panel">

               <div className="panel-head">

                <div>
                 <h2>
                  How SmartLearn adapts
                 </h2>

                 <p>
                  The intelligence loop behind
                  your learning experience.
                 </p>
                </div>

               </div>

               <div className="flow">

                {[
                 "Learn",
                 "Assess",
                 "Analyze",
                 "Adapt",
                 "Practice",
                 "Reassess",
                 "Improve"
                ].map((x, i) => (

                    <span
                        key={x}
                        style={{
                         display: "contents"
                        }}
                    >

                                                <div
                                                    className={`flow-step ${
                                                        i === 0
                                                            ? "active"
                                                            : ""
                                                    }`}
                                                >
                                                    {x}
                                                </div>

                     {i < 6 && (
                         <span className="flow-arrow">
                                                        →
                                                    </span>
                     )}

                                            </span>

                ))}

               </div>

              </section>

             </>
         )}

         {/* ================= SUBJECTS ================= */}

         {activeNav === "Subjects" && (
             <>

              <div className="hero">

               <div>

                <div className="eyebrow">
                 Learning library
                </div>

                <h1>
                 Explore subjects
                </h1>

                <p>
                 Select a subject to see its topics
                 and start an assessment.
                </p>

               </div>

              </div>

              <div className="content-grid">

               <section className="panel">

                <div className="panel-head">

                 <div>
                  <h2>Subjects</h2>

                  <p>
                   {subjects.length} learning
                   areas available.
                  </p>
                 </div>

                </div>

                <div className="subject-list">

                 {subjects.map((s, i) => (

                     <button
                         className="subject-row"
                         key={s.id}
                         onClick={() =>
                             selectSubject(s)
                         }
                     >

                      <div className="subject-icon">
                       {icons[
                       i % icons.length
                           ]}
                      </div>

                      <div className="subject-info">

                       <h3>{s.name}</h3>

                       <p>
                        {s.description}
                       </p>

                      </div>

                      <span>›</span>

                     </button>

                 ))}

                </div>

               </section>

               <section className="panel">

                <div className="panel-head">

                 <div>
                  <h2>
                   {selectedSubject?.name ||
                       "Select a subject"}
                  </h2>

                  <p>
                   Topics available for
                   assessment.
                  </p>
                 </div>

                </div>

                <div className="topics-grid">

                 {selectedSubject
                     ? topics.map((t) => (

                         <div
                             className="topic-card"
                             key={t.id}
                         >

                          <h3>{t.name}</h3>

                          <p>
                           {t.description ||
                               "Build understanding through adaptive practice."}
                          </p>

                          <div className="topic-meta">

                                                              <span className="topic-level">
                                                                  Assessment
                                                              </span>

                           <button
                               onClick={() =>
                                   onStartAssessment(
                                       t.id,
                                       t.name
                                   )
                               }
                           >
                            Start →
                           </button>

                          </div>

                         </div>

                     ))
                     : (
                         <p
                             style={{
                              padding:
                                  "0 20px 20px",
                              color: "#718096",
                              fontSize: 13
                             }}
                         >
                          Choose a subject to
                          view topics.
                         </p>
                     )}

                </div>

               </section>

              </div>

             </>
         )}

         {/* ================= PROGRESS ================= */}

         {activeNav === "Progress" && (
             <>
              <div className="hero">
               <div>
                <div className="eyebrow">
                 Learning analytics
                </div>

                <h1>Your progress</h1>

                <p>
                 Track your learning performance and
                 see how your knowledge is improving.
                </p>
               </div>
              </div>


              {/* OVERALL STATS */}

              <div className="stats-grid">

               <Stat
                   icon="◔"
                   label="Overall mastery"
                   value={`${progressData?.overall_mastery || 0}%`}
                   note="Across learned topics"
               />

               <Stat
                   icon="✓"
                   label="Questions"
                   value={progressData?.questions_answered || 0}
                   note="Answered"
               />

               <Stat
                   icon="🎯"
                   label="Accuracy"
                   value={`${progressData?.accuracy || 0}%`}
                   note="Correct answers"
               />

               <Stat
                   icon="🔥"
                   label="Learning streak"
                   value={`${progressData?.learning_streak || 0} days`}
                   note={
                    progressData?.learning_streak > 0
                        ? "Keep going"
                        : "Start today"
                   }
               />

              </div>


              {/* SUBJECT PROGRESS */}

              <section
                  className="panel"
                  style={{ marginTop: 24 }}
              >

               <div className="panel-head">

                <div>
                 <h2>Subject mastery</h2>

                 <p>
                  Your current mastery across each
                  learning area.
                 </p>
                </div>

               </div>


               <div className="subject-list">

                {progressData?.subject_progress?.map(
                    (subject) => (

                        <div
                            className="subject-row"
                            key={subject.subject_id}
                            style={{
                             cursor: "default"
                            }}
                        >

                         <div className="subject-info">

                          <h3>
                           {subject.subject_name}
                          </h3>

                          <div className="progress-line">

                  <span
                      style={{
                       width: `${subject.mastery_percentage}%`
                      }}
                  />

                          </div>

                         </div>


                         <div className="subject-percent">

                          {subject.mastery_percentage}%

                         </div>

                        </div>

                    )
                )}

               </div>

              </section>


              {/* TOPIC MASTERY */}

              <section
                  className="panel"
                  style={{ marginTop: 24 }}
              >

               <div className="panel-head">

                <div>
                 <h2>Topic mastery</h2>

                 <p>
                  Detailed knowledge profile generated
                  from your learning activity.
                 </p>
                </div>

               </div>


               {progressData?.topic_progress?.length > 0 ? (

                   <div className="topics-grid">

                    {progressData.topic_progress.map(
                        (topic) => (

                            <div
                                className="topic-card"
                                key={topic.topic_id}
                            >

                             <h3>
                              {topic.topic_name}
                             </h3>

                             <p>
                              {topic.subject_name}
                             </p>


                             <div
                                 style={{
                                  marginTop: 16,
                                  fontSize: 24,
                                  fontWeight: 700
                                 }}
                             >
                              {topic.mastery_percentage}%
                             </div>


                             <div
                                 className="progress-line"
                                 style={{
                                  marginTop: 10
                                 }}
                             >

                  <span
                      style={{
                       width: `${topic.mastery_percentage}%`
                      }}
                  />

                             </div>

                            </div>

                        )
                    )}

                   </div>

               ) : (

                   <p
                       style={{
                        padding: "0 20px 20px",
                        color: "#718096"
                       }}
                   >
                    Complete an assessment to start
                    building your topic mastery profile.
                   </p>

               )}

              </section>

             </>
         )}

         {/* ================= ASSESSMENT ================= */}

         {activeNav === "Assessment" && (
             <>
              <div className="hero">
               <div>
                <div className="eyebrow">
                 Adaptive assessment
                </div>

                <h1>Choose your assessment</h1>

                <p>
                 Select a subject and topic to begin
                 your personalized assessment.
                </p>
               </div>
              </div>

              <div className="content-grid">

               {/* SUBJECT SELECTION */}

               <section className="panel">

                <div className="panel-head">

                 <div>
                  <h2>Select subject</h2>

                  <p>
                   Choose the learning area you
                   want to assess.
                  </p>
                 </div>

                </div>

                <div className="subject-list">

                 {subjects.map((s, i) => (

                     <button
                         className="subject-row"
                         key={s.id}
                         onClick={() =>
                             selectSubjectForAssessment(s)
                         }
                         style={{
                          border:
                              selectedSubject?.id === s.id
                                  ? "2px solid #4f46e5"
                                  : undefined
                         }}
                     >

                      <div className="subject-icon">
                       {icons[
                       i % icons.length
                           ]}
                      </div>

                      <div className="subject-info">

                       <h3>
                        {s.name}
                       </h3>

                       <p>
                        {s.description ||
                            "Assess your understanding of this subject."}
                       </p>

                      </div>

                      <span>›</span>

                     </button>

                 ))}

                </div>

               </section>


               {/* TOPIC SELECTION */}

               <section className="panel">

                <div className="panel-head">

                 <div>
                  <h2>
                   {selectedSubject?.name ||
                       "Select a subject"}
                  </h2>

                  <p>
                   Choose a topic to start
                   assessment.
                  </p>
                 </div>

                </div>

                {selectedSubject ? (

                    <div className="topics-grid">

                     {topics.length > 0 ? (

                         topics.map((topic) => (

                             <div
                                 className="topic-card"
                                 key={topic.id}
                             >

                              <h3>
                               {topic.name}
                              </h3>

                              <p>
                               {topic.description ||
                                   "Test your understanding and build mastery."}
                              </p>

                              <div
                                  className="topic-meta"
                                  style={{
                                   marginTop: 16
                                  }}
                              >

                                        <span className="topic-level">
                                            Adaptive
                                        </span>

                               <button
                                   onClick={() =>
                                       onStartAssessment(
                                           topic.id,
                                           topic.name
                                       )
                                   }
                               >
                                Start Assessment →
                               </button>

                              </div>

                             </div>

                         ))

                     ) : (

                         <p
                             style={{
                              padding: "20px",
                              color: "#718096"
                             }}
                         >
                          No topics available for
                          this subject.
                         </p>

                     )}

                    </div>

                ) : (

                    <p
                        style={{
                         padding: "20px",
                         color: "#718096"
                        }}
                    >
                     Select a subject to view its
                     available topics.
                    </p>

                )}

               </section>

              </div>


              {/* ASSESSMENT EXPLANATION */}

              <section
                  className="panel"
                  style={{
                   marginTop: 24
                  }}
              >

               <div className="panel-head">

                <div>

                 <h2>
                  How your assessment works
                 </h2>

                 <p>
                  SmartLearn uses your answers to
                  understand your current knowledge.
                 </p>

                </div>

               </div>

               <div className="flow">

                {[
                 "Choose Topic",
                 "Answer Questions",
                 "Analyze Performance",
                 "Calculate Mastery",
                 "Adapt Difficulty"
                ].map((step, i) => (

                    <span
                        key={step}
                        style={{
                         display: "contents"
                        }}
                    >

                        <div
                            className={`flow-step ${
                                i === 0
                                    ? "active"
                                    : ""
                            }`}
                        >
                            {step}
                        </div>

                     {i < 4 && (
                         <span className="flow-arrow">
                                →
                            </span>
                     )}

                    </span>

                ))}

               </div>

              </section>

             </>
         )}

         {/* ================= OTHER MODULES ================= */}

         {activeNav !== "Dashboard" &&
             activeNav !== "Subjects" &&
             activeNav !== "Progress" && (

                 <div
                     className="panel"
                     style={{
                      padding: 40,
                      textAlign: "center"
                     }}
                 >
                 </div>

             )}

        </div>
       </main>
      </div>
     </div>
 );
}


function Stat({ icon, label, value, note }) {
 return (
     <div className="stat-card">

      <div className="stat-top">

                <span className="stat-label">
                    {label}
                </span>

       <span className="stat-icon">
                    {icon}
                </span>

      </div>

      <div className="stat-value">
       {value}
      </div>

      <div className="stat-note">
       {note}
      </div>

     </div>
 );
}


export default Dashboard;