import { useEffect, useState } from "react";
import API from "../services/api";

function Assessment({
                     topicId,
                     topicName,
                     practiceMode = false,
                     onBack,
                     onContinueLearning,
                     aiPracticeMode = false,
                     onOpenAITutor,
                     reassessmentMode = false,
                     onStartReassessment
                    }) {
 const [questions, setQuestions] = useState([]);
 const [currentIndex, setCurrentIndex] = useState(0);
 const [selectedAnswer, setSelectedAnswer] = useState("");
 const [score, setScore] = useState(0);
 const [loading, setLoading] = useState(true);
 const [finished, setFinished] = useState(false);
 const [seconds, setSeconds] = useState(0);
 const [answered, setAnswered] = useState(0);
 const [mastery, setMastery] = useState(null);
 const [initialMastery, setInitialMastery] = useState(null);
 const [difficulty, setDifficulty] = useState(null);
 const [action, setAction] = useState(null);

 useEffect(() => {
  loadQuestions();
 }, [topicId, practiceMode, aiPracticeMode, reassessmentMode]);

 useEffect(() => {
  if (finished || loading) return;

  const id = setInterval(() => {
   setSeconds((s) => s + 1);
  }, 1000);

  return () => clearInterval(id);
 }, [finished, loading, currentIndex]);

 const loadQuestions = async () => {
  setLoading(true);

  try {
   if (!topicId) {
    throw new Error("No topic ID was provided.");
   }

   let response;

   if (reassessmentMode) {
    response = await API.get(
        `/assessment/reassessment/${topicId}`
    );

    console.log(
        "Reassessment API response:",
        response.data
    );

    const data = response.data;

    if (!data || !Array.isArray(data.questions)) {
     throw new Error(
         "Reassessment API returned an invalid questions format."
     );
    }

    setQuestions(data.questions);

    // IMPORTANT:
    // This is the mastery before reassessment starts.
    setMastery(data.mastery_percentage);
    setInitialMastery(data.mastery_percentage);

    setDifficulty(
        data.difficulty ?? "medium"
    );

    setAction("reassess");
   } else if (aiPracticeMode) {

    response = await API.get(
        `/assessment/ai-generated/${topicId}`
    );

    console.log(
        "AI Practice API response:",
        response.data
    );

    const data = response.data;

    if (!data || !Array.isArray(data.questions)) {
     throw new Error(
         "AI Practice API returned an invalid questions format."
     );
    }

    setQuestions(data.questions);

    setMastery(data.mastery_percentage);
    setInitialMastery(data.mastery_percentage);

    setDifficulty(
        data.difficulty ?? "easy"
    );

    setAction(
        data.action ?? "learn"
    );
   }



   else if (practiceMode) {
    response = await API.get(
        `/assessment/practice/${topicId}`
    );

    console.log(
        "Practice API response:",
        response.data
    );

    const data = response.data;

    if (!data || !Array.isArray(data.questions)) {
     throw new Error(
         "Practice API returned an invalid questions format."
     );
    }

    setQuestions(data.questions);

    setMastery(data.mastery_percentage);
    setInitialMastery(data.mastery_percentage);

    setDifficulty(
        data.difficulty ?? "easy"
    );

    setAction(
        data.action ?? "learn"
    );

   } else {
    response = await API.get(
        `/assessment/topics/${topicId}/questions`
    );

    console.log(
        "Assessment API response:",
        response.data
    );

    if (!Array.isArray(response.data)) {
     throw new Error(
         "Assessment API returned an invalid questions format."
     );
    }

    setQuestions(response.data);
   }

  } catch (error) {
   console.error(
       "QUESTION LOADING ERROR:",
       error
   );

   console.error(
       "Status:",
       error.response?.status
   );

   console.error(
       "Backend response:",
       error.response?.data
   );

   alert(
       error.response?.data?.detail ||
       error.message ||
       "Unable to load questions."
   );

   setQuestions([]);

  } finally {
   setLoading(false);
  }
 };

 const submit = async () => {
  if (!selectedAnswer) {
   alert("Please select an answer.");
   return;
  }

  const q = questions[currentIndex];

  try {
   const r = await API.post(
       "/assessment/submit",
       {
        question_id: q.id,
        selected_answer: selectedAnswer,
        response_time: seconds,
        hints_used: 0
       }
   );

   if (r.data.correct) {
    setScore((s) => s + 1);
   }

   setAnswered((a) => a + 1);
   setSeconds(0);

   if (currentIndex < questions.length - 1) {
    setCurrentIndex((i) => i + 1);
    setSelectedAnswer("");
   } else {
    setFinished(true);

    if (r.data.mastery_probability !== undefined) {
     setMastery(
         Math.round(
             r.data.mastery_probability * 1000
         ) / 10
     );
    }
   }
  } catch (e) {
   console.error(e);

   if (e.response?.status === 401) {
    alert("Session expired. Please login again.");
   } else {
    alert("Unable to submit answer.");
   }
  }
 };

 const fmt = (s) =>
     `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(
         s % 60
     ).padStart(2, "0")}`;

 if (loading) {
  return (
      <div className="loading-screen">
       Loading {
       aiPracticeMode
           ? "AI adaptive practice"
           : practiceMode
               ? "adaptive practice"
               : reassessmentMode
                   ? "reassessment"
                   : "assessment"
      }...
      </div>
  );
 }

 if (!questions.length) {
  return (
      <div className="assessment-page">
       <div className="result-card">

        <h1>No questions available</h1>

        <p>
         There are no questions available for this topic.
        </p>

        <button
            className="next-btn"
            style={{ marginTop: 22 }}
            onClick={onBack}
        >
         ← Back
        </button>

       </div>
      </div>
  );
 }

 if (finished) {

  const pct = Math.round(
      (score / questions.length) * 100
  );

  // Use mastery for adaptive learning status
  const currentMastery =
      mastery !== null ? mastery : 20;

  const previousMastery =
      initialMastery !== null
          ? initialMastery
          : currentMastery;

  const masteryChange =
      Math.round(currentMastery - previousMastery);

  let learningMessage = "";
  let nextDifficulty = "";

  if (currentMastery < 40) {
   learningMessage =
       "Your knowledge profile shows that the fundamentals need more attention. SmartLearn recommends easy foundational learning.";

   nextDifficulty = "Easy";
  } else if (currentMastery < 70) {
   learningMessage =
       "Good progress! Your knowledge profile shows partial understanding. SmartLearn recommends medium-level practice to strengthen this topic.";

   nextDifficulty = "Medium";
  } else {
   learningMessage =
       "Strong mastery detected! SmartLearn can move you toward more challenging learning activities.";

   nextDifficulty = "Hard";
  }

  if (currentMastery < 40) {
   learningMessage =
       "Your knowledge profile shows that the fundamentals need more attention. SmartLearn recommends easy foundational learning.";

   nextDifficulty = "Easy";
  } else if (currentMastery < 70) {
   learningMessage =
       "Good progress! Your knowledge profile shows partial understanding. SmartLearn recommends medium-level practice to strengthen this topic.";

   nextDifficulty = "Medium";
  } else {
   learningMessage =
       "Strong mastery detected! SmartLearn can move you toward more challenging learning activities.";

   nextDifficulty = "Hard";
  }

  return (
      <div className="assessment-page">

       <div className="result-card">

        <div className="result-icon">
         ✓
        </div>

        <h1>
         {reassessmentMode
             ? "Reassessment complete"
             : practiceMode
                 ? "Practice complete"
                 : "Assessment complete"}
        </h1>

        <p>
         {topicName} • Here's how you performed.
        </p>

        <div className="score">
         {score}/{questions.length}
        </div>

        <p>
         {pct}% accuracy
        </p>

        <div className="result-grid">

         <div className="result-stat">

          <span>
           Correct answers
          </span>

          <strong>
           {score}
          </strong>

         </div>

         <div className="result-stat">

          <span>
           Questions answered
          </span>

          <strong>
           {answered}
          </strong>

         </div>

        </div>

        {(practiceMode || reassessmentMode) && mastery !== null && (
            <div
                className="recommendation-box"
                style={{
                 marginTop: 18,
                 padding: 20
                }}
            >
             <small>✦ YOUR LEARNING PROGRESS</small>

             <div
                 style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 20,
                  marginTop: 16,
                  flexWrap: "wrap"
                 }}
             >
              <div>
                <span
                    style={{
                     display: "block",
                     fontSize: 13,
                     color: "#718096"
                    }}
                >
                    Previous Mastery
                </span>

               <strong
                   style={{
                    display: "block",
                    fontSize: 28,
                    marginTop: 5
                   }}
               >
                {Math.round(previousMastery)}%
               </strong>
              </div>

              <div
                  style={{
                   fontSize: 24,
                   color: "#718096"
                  }}
              >
               →
              </div>

              <div>
                <span
                    style={{
                     display: "block",
                     fontSize: 13,
                     color: "#718096"
                    }}
                >
                    New Mastery
                </span>

               <strong
                   style={{
                    display: "block",
                    fontSize: 28,
                    marginTop: 5
                   }}
               >
                {Math.round(currentMastery)}%
               </strong>
              </div>

              <div>
                <span
                    style={{
                     display: "block",
                     fontSize: 13,
                     color: "#718096"
                    }}
                >
                    {reassessmentMode ? "Mastery change" : "Improvement"}
                </span>

               <strong
                   style={{
                    display: "block",
                    fontSize: 28,
                    marginTop: 5
                   }}
               >
                {masteryChange > 0 ? "+" : ""}
                {masteryChange}%
               </strong>
              </div>
             </div>

             <div
                 style={{
                  marginTop: 18,
                  padding: 12,
                  borderRadius: 10,
                  background: "#ffffff"
                 }}
             >
              Next recommended difficulty:{" "}
              <strong>{nextDifficulty}</strong>
             </div>
            </div>
        )}

        <div className="recommendation-box">

         <small>
          ✦ SMARTLEARN
         </small>

         <p>
          {learningMessage}
         </p>

        </div>

        {/* AI TUTOR BUTTON */}

        {onOpenAITutor && (
            <button
                className="primary-btn"
                style={{
                 width: "100%",
                 marginTop: 14
                }}
                onClick={() => {
                 onOpenAITutor(
                     topicId,
                     topicName
                 );
                }}
            >
             ✦ Ask AI Tutor
            </button>
        )}

        {/* REASSESSMENT BUTTON */}

        {onStartReassessment && (
            <button
                className="next-btn"
                style={{
                 width: "100%",
                 marginTop: 12
                }}
                onClick={() => {
                 onStartReassessment(
                     topicId,
                     topicName
                 );
                }}
            >
             Start Reassessment →
            </button>
        )}

        {/* CONTINUE LEARNING */}

        <button
            className="primary-btn"
            style={{
             width: "100%",
             marginTop: 12
            }}
            onClick={() => {

             if (onContinueLearning) {

              onContinueLearning(
                  topicId,
                  topicName
              );

             } else {

              onBack();

             }

            }}
        >
         Continue learning →
        </button>

       </div>

      </div>
  );
 }

 const q = questions[currentIndex];

 const progress =
     ((currentIndex + 1) / questions.length) * 100;

 return (
     <div className="assessment-page">

      <div className="assessment-wrap">

       <div className="assessment-top">

        <div className="assessment-title">

         <button
             className="back-link"
             onClick={onBack}
         >
          ← Back to learning
         </button>

         <h1>
          {topicName}
         </h1>

          <p>
           {reassessmentMode
               ? "Adaptive reassessment"
               : aiPracticeMode
                   ? "AI adaptive practice"
                   : practiceMode
                       ? "Adaptive practice"
                       : "Adaptive assessment"}
          </p>

        </div>

        <div className="question-count">
         {String(currentIndex + 1).padStart(2, "0")}
         {" / "}
         {String(questions.length).padStart(2, "0")}
        </div>

       </div>

       <div className="progress-track">
                    <span
                        style={{
                         width: `${progress}%`
                        }}
                    />
       </div>

       {(practiceMode || aiPracticeMode) && (
           <div
               className="recommendation-box"
               style={{
                marginBottom: 18
               }}
           >

            <small>
             {aiPracticeMode
                 ? "✦ AI ADAPTIVE MODE"
                 : "✦ ADAPTIVE MODE"}
            </small>

            <p style={{ marginBottom: 4 }}>
             <strong>
              {aiPracticeMode
                  ? "Gemini-generated learning"
                  : action === "challenge"
                      ? "Challenge"
                      : action === "practice"
                          ? "Practice"
                          : "Learn"}
             </strong>

             {" • "}

             {difficulty}
            </p>

            <span
                style={{
                 fontSize: 13,
                 color: "#718096"
                }}
            >
                            Current mastery: {mastery}%
                        </span>

           </div>
       )}

       <div className="question-card">

        <div className="question-meta">

                        <span className="difficulty">
                            {q.difficulty || "medium"}
                        </span>

         <span className="timer">
                            ⏱ {fmt(seconds)}
                        </span>

        </div>

        <div className="question-text">
         {q.question_text}
        </div>

        <div className="options">

         {[
          ["A", q.option_a],
          ["B", q.option_b],
          ["C", q.option_c],
          ["D", q.option_d]
         ].map(([letter, text]) => (

             <button
                 key={letter}
                 className={`option-button ${
                     selectedAnswer === letter
                         ? "selected"
                         : ""
                 }`}
                 onClick={() =>
                     setSelectedAnswer(letter)
                 }
             >

                                <span className="option-letter">
                                    {letter}
                                </span>

              <span className="option-text">
                                    {text}
                                </span>

             </button>

         ))}

        </div>

        <div className="question-footer">

                        <span className="question-hint">
                            Select one answer. Your response time is
                            recorded for adaptive analysis.
                        </span>

         <button
             className="next-btn"
             onClick={submit}
         >
          {currentIndex === questions.length - 1
              ? "Finish"
              : "Next question →"}
         </button>

        </div>

       </div>

      </div>

     </div>
 );
}

export default Assessment;