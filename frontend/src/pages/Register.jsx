import { useEffect, useRef, useState } from "react";
import API from "../services/api";

function Register({ onRegister, onBackToLogin }) {
    const [form, setForm] = useState({
        full_name: "",
        date_of_birth: "",
        phone_number: "",
        email: "",
        password: "",
        confirm_password: "",

        college: "",
        education_level: "",
        degree: "",
        branch: "",
        current_year: "",
        semester: "",

        preferred_language: "English",
        learning_style: "",
        academic_interests: "",
        learning_goal: "",
        daily_learning_time: ""
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Face enrollment states
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const [cameraStarted, setCameraStarted] = useState(false);
    const [faceCaptured, setFaceCaptured] = useState(false);
    const [faceBlob, setFaceBlob] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    // Start camera
    const startCamera = async () => {
        try {
            setError("");

            const stream =
                await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: "user",
                        width: 640,
                        height: 480
                    },
                    audio: false
                });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            setCameraStarted(true);
        } catch (err) {
            console.error("Camera error:", err);

            setError(
                "Unable to access camera. Please allow camera permission and try again."
            );
        }
    };

    // Capture face image
    const captureFace = () => {
        if (!videoRef.current || !canvasRef.current) {
            setError("Camera is not ready.");
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (
            video.videoWidth === 0 ||
            video.videoHeight === 0
        ) {
            setError(
                "Camera is still starting. Please wait a moment and try again."
            );
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const context = canvas.getContext("2d");

        context.drawImage(
            video,
            0,
            0,
            canvas.width,
            canvas.height
        );

        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    setError("Unable to capture face image.");
                    return;
                }

                setFaceBlob(blob);
                setFaceCaptured(true);
                setError("");
            },
            "image/jpeg",
            0.9
        );
    };

    // Retake face
    const retakeFace = () => {
        setFaceBlob(null);
        setFaceCaptured(false);
        setError("");
    };

    // Stop camera
    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current
                .getTracks()
                .forEach((track) => track.stop());

            streamRef.current = null;
        }

        setCameraStarted(false);
    };

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current
                    .getTracks()
                    .forEach((track) => track.stop());
            }
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (form.password !== form.confirm_password) {
            setError("Passwords do not match.");
            return;
        }

        if (form.password.length < 6) {
            setError(
                "Password must contain at least 6 characters."
            );
            return;
        }

        // Face is mandatory during registration
        if (!faceBlob) {
            setError(
                "Please capture your face before creating the account."
            );
            return;
        }

        setLoading(true);

        try {
            const payload = {
                full_name: form.full_name,

                date_of_birth:
                    form.date_of_birth || null,

                phone_number:
                    form.phone_number || null,

                email: form.email,

                password: form.password,

                college:
                    form.college || null,

                education_level:
                    form.education_level || null,

                degree:
                    form.degree || null,

                branch:
                    form.branch || null,

                current_year:
                    form.current_year || null,

                semester:
                    form.semester || null,

                preferred_language:
                    form.preferred_language || null,

                learning_style:
                    form.learning_style || null,

                academic_interests:
                    form.academic_interests || null,

                learning_goal:
                    form.learning_goal || null,

                daily_learning_time:
                    form.daily_learning_time || null
            };

            // Send student details + face together
            const formData = new FormData();

            formData.append(
                "data",
                JSON.stringify(payload)
            );

            formData.append(
                "face",
                faceBlob,
                "student_face.jpg"
            );

            await API.post(
                "/auth/register-with-face",
                formData
            );

            setSuccess(
                "Registration and face enrollment successful! You can now login."
            );

            stopCamera();

            setTimeout(() => {
                onRegister();
            }, 1500);

        } catch (err) {
            console.error(
                "Registration error:",
                err
            );

            setError(
                err.response?.data?.detail ||
                "Unable to complete registration."
            );
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: "100%",
        padding: "12px 14px",
        border: "1px solid #dbe3ec",
        borderRadius: "10px",
        fontSize: "14px",
        outline: "none",
        boxSizing: "border-box",
        background: "#ffffff"
    };

    const labelStyle = {
        display: "block",
        fontSize: "13px",
        fontWeight: "600",
        color: "#334155",
        marginBottom: "7px"
    };

    const sectionStyle = {
        marginTop: "28px",
        marginBottom: "18px"
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                background:
                    "linear-gradient(135deg, #f8fbff, #eef5ff)",
                padding: "40px 20px",
                boxSizing: "border-box"
            }}
        >
            <div
                style={{
                    maxWidth: "900px",
                    margin: "0 auto",
                    background: "#ffffff",
                    borderRadius: "22px",
                    padding: "35px",
                    boxShadow:
                        "0 15px 45px rgba(15, 23, 42, 0.08)"
                }}
            >
                {/* Header */}

                <div
                    style={{
                        textAlign: "center",
                        marginBottom: "30px"
                    }}
                >
                    <div
                        style={{
                            width: "52px",
                            height: "52px",
                            borderRadius: "14px",
                            background: "#315b9b",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 14px",
                            fontSize: "24px",
                            fontWeight: "800"
                        }}
                    >
                        S
                    </div>

                    <h1
                        style={{
                            margin: 0,
                            color: "#0f172a",
                            fontSize: "28px"
                        }}
                    >
                        Create Your SmartLearn Account
                    </h1>

                    <p
                        style={{
                            color: "#64748b",
                            marginTop: "8px"
                        }}
                    >
                        Tell us about yourself so SmartLearn
                        can personalize your learning experience.
                    </p>
                </div>

                {/* Error */}

                {error && (
                    <div
                        style={{
                            padding: "12px 15px",
                            background: "#fff1f2",
                            border: "1px solid #fecdd3",
                            color: "#be123c",
                            borderRadius: "10px",
                            marginBottom: "18px",
                            fontSize: "14px"
                        }}
                    >
                        {error}
                    </div>
                )}

                {/* Success */}

                {success && (
                    <div
                        style={{
                            padding: "12px 15px",
                            background: "#f0fdf4",
                            border: "1px solid #bbf7d0",
                            color: "#15803d",
                            borderRadius: "10px",
                            marginBottom: "18px",
                            fontSize: "14px"
                        }}
                    >
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    {/* PERSONAL INFORMATION */}

                    <div style={sectionStyle}>
                        <h2
                            style={{
                                fontSize: "18px",
                                color: "#0f172a",
                                marginBottom: "5px"
                            }}
                        >
                            Personal Information
                        </h2>

                        <p
                            style={{
                                fontSize: "13px",
                                color: "#64748b"
                            }}
                        >
                            Basic information about the student.
                        </p>
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(250px, 1fr))",
                            gap: "18px"
                        }}
                    >
                        <div>
                            <label style={labelStyle}>
                                Full Name *
                            </label>

                            <input
                                name="full_name"
                                value={form.full_name}
                                onChange={handleChange}
                                placeholder="Enter your full name"
                                required
                                style={inputStyle}
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>
                                Date of Birth
                            </label>

                            <input
                                type="date"
                                name="date_of_birth"
                                value={form.date_of_birth}
                                onChange={handleChange}
                                style={inputStyle}
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>
                                Phone Number
                            </label>

                            <input
                                type="tel"
                                name="phone_number"
                                value={form.phone_number}
                                onChange={handleChange}
                                placeholder="Enter phone number"
                                style={inputStyle}
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>
                                Email *
                            </label>

                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="student@example.com"
                                required
                                style={inputStyle}
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>
                                Password *
                            </label>

                            <input
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Minimum 6 characters"
                                required
                                style={inputStyle}
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>
                                Confirm Password *
                            </label>

                            <input
                                type="password"
                                name="confirm_password"
                                value={form.confirm_password}
                                onChange={handleChange}
                                placeholder="Confirm password"
                                required
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    {/* EDUCATION */}

                    <div style={sectionStyle}>
                        <h2
                            style={{
                                fontSize: "18px",
                                color: "#0f172a",
                                marginBottom: "5px"
                            }}
                        >
                            Education Information
                        </h2>

                        <p
                            style={{
                                fontSize: "13px",
                                color: "#64748b"
                            }}
                        >
                            This helps SmartLearn understand your
                            current academic level.
                        </p>
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(250px, 1fr))",
                            gap: "18px"
                        }}
                    >
                        <div
                            style={{
                                gridColumn: "1 / -1"
                            }}
                        >
                            <label style={labelStyle}>
                                College / Institution
                            </label>

                            <input
                                name="college"
                                value={form.college}
                                onChange={handleChange}
                                placeholder="Enter college or institution"
                                style={inputStyle}
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>
                                Current Education Level
                            </label>

                            <select
                                name="education_level"
                                value={form.education_level}
                                onChange={handleChange}
                                style={inputStyle}
                            >
                                <option value="">
                                    Select education level
                                </option>

                                <option value="School">
                                    School
                                </option>

                                <option value="Diploma">
                                    Diploma
                                </option>

                                <option value="Undergraduate">
                                    Undergraduate
                                </option>

                                <option value="Postgraduate">
                                    Postgraduate
                                </option>

                                <option value="Other">
                                    Other
                                </option>
                            </select>
                        </div>

                        <div>
                            <label style={labelStyle}>
                                Degree / Course
                            </label>

                            <input
                                name="degree"
                                value={form.degree}
                                onChange={handleChange}
                                placeholder="e.g. B.Tech"
                                style={inputStyle}
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>
                                Branch / Specialization
                            </label>

                            <input
                                name="branch"
                                value={form.branch}
                                onChange={handleChange}
                                placeholder="e.g. Computer Science"
                                style={inputStyle}
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>
                                Current Year
                            </label>

                            <select
                                name="current_year"
                                value={form.current_year}
                                onChange={handleChange}
                                style={inputStyle}
                            >
                                <option value="">
                                    Select year
                                </option>

                                <option value="1st Year">
                                    1st Year
                                </option>

                                <option value="2nd Year">
                                    2nd Year
                                </option>

                                <option value="3rd Year">
                                    3rd Year
                                </option>

                                <option value="4th Year">
                                    4th Year
                                </option>

                                <option value="Other">
                                    Other
                                </option>
                            </select>
                        </div>

                        <div>
                            <label style={labelStyle}>
                                Semester
                            </label>

                            <input
                                name="semester"
                                value={form.semester}
                                onChange={handleChange}
                                placeholder="e.g. 5th Semester"
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    {/* LEARNING PROFILE */}

                    <div style={sectionStyle}>
                        <h2
                            style={{
                                fontSize: "18px",
                                color: "#0f172a",
                                marginBottom: "5px"
                            }}
                        >
                            Learning Profile
                        </h2>

                        <p
                            style={{
                                fontSize: "13px",
                                color: "#64748b"
                            }}
                        >
                            These preferences help personalize your
                            learning experience.
                        </p>
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(250px, 1fr))",
                            gap: "18px"
                        }}
                    >
                        <div>
                            <label style={labelStyle}>
                                Preferred Language
                            </label>

                            <select
                                name="preferred_language"
                                value={form.preferred_language}
                                onChange={handleChange}
                                style={inputStyle}
                            >
                                <option value="English">
                                    English
                                </option>

                                <option value="Telugu">
                                    Telugu
                                </option>

                                <option value="Hindi">
                                    Hindi
                                </option>
                            </select>
                        </div>

                        <div>
                            <label style={labelStyle}>
                                Preferred Learning Style
                            </label>

                            <select
                                name="learning_style"
                                value={form.learning_style}
                                onChange={handleChange}
                                style={inputStyle}
                            >
                                <option value="">
                                    Select learning style
                                </option>

                                <option value="Visual">
                                    Visual
                                </option>

                                <option value="Text-based">
                                    Text-based
                                </option>

                                <option value="Examples">
                                    Examples
                                </option>

                                <option value="Interactive">
                                    Interactive
                                </option>
                            </select>
                        </div>

                        <div>
                            <label style={labelStyle}>
                                Academic Interests
                            </label>

                            <input
                                name="academic_interests"
                                value={form.academic_interests}
                                onChange={handleChange}
                                placeholder="e.g. AI, Cybersecurity, Mathematics"
                                style={inputStyle}
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>
                                Daily Learning Time
                            </label>

                            <select
                                name="daily_learning_time"
                                value={form.daily_learning_time}
                                onChange={handleChange}
                                style={inputStyle}
                            >
                                <option value="">
                                    Select available time
                                </option>

                                <option value="15 minutes">
                                    15 minutes
                                </option>

                                <option value="30 minutes">
                                    30 minutes
                                </option>

                                <option value="1 hour">
                                    1 hour
                                </option>

                                <option value="2 hours">
                                    2 hours
                                </option>

                                <option value="More than 2 hours">
                                    More than 2 hours
                                </option>
                            </select>
                        </div>

                        <div
                            style={{
                                gridColumn: "1 / -1"
                            }}
                        >
                            <label style={labelStyle}>
                                Learning / Career Goal
                            </label>

                            <textarea
                                name="learning_goal"
                                value={form.learning_goal}
                                onChange={handleChange}
                                placeholder="What do you want to achieve through SmartLearn?"
                                rows={4}
                                style={{
                                    ...inputStyle,
                                    resize: "vertical"
                                }}
                            />
                        </div>
                    </div>

                    {/* FACE ENROLLMENT */}

                    <div style={sectionStyle}>
                        <h2
                            style={{
                                fontSize: "18px",
                                color: "#0f172a",
                                marginBottom: "5px"
                            }}
                        >
                            Face Enrollment
                        </h2>

                        <p
                            style={{
                                fontSize: "13px",
                                color: "#64748b"
                            }}
                        >
                            Register your face for secure face-based
                            login to SmartLearn.
                        </p>
                    </div>

                    <div
                        style={{
                            border: "1px solid #dbe3ec",
                            borderRadius: "16px",
                            padding: "20px",
                            background: "#f8fbff"
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                marginBottom: "18px"
                            }}
                        >
                            <div
                                style={{
                                    width: "100%",
                                    maxWidth: "520px",
                                    height: "330px",
                                    borderRadius: "14px",
                                    overflow: "hidden",
                                    background: "#0f172a",
                                    position: "relative",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}
                            >
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display:
                                            cameraStarted
                                                ? "block"
                                                : "none"
                                    }}
                                />

                                {!cameraStarted && (
                                    <div
                                        style={{
                                            color: "#cbd5e1",
                                            textAlign: "center"
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: "45px",
                                                marginBottom: "10px"
                                            }}
                                        >
                                            📷
                                        </div>

                                        <div>
                                            Camera not started
                                        </div>
                                    </div>
                                )}

                                {cameraStarted && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: "35px",
                                            border:
                                                "2px dashed rgba(255,255,255,0.8)",
                                            borderRadius: "45%"
                                        }}
                                    />
                                )}
                            </div>
                        </div>

                        <canvas
                            ref={canvasRef}
                            style={{
                                display: "none"
                            }}
                        />

                        <div
                            style={{
                                textAlign: "center"
                            }}
                        >
                            {!cameraStarted && !faceCaptured && (
                                <button
                                    type="button"
                                    onClick={startCamera}
                                    style={{
                                        padding: "12px 24px",
                                        border: "none",
                                        borderRadius: "10px",
                                        background: "#315b9b",
                                        color: "#ffffff",
                                        fontWeight: "700",
                                        cursor: "pointer"
                                    }}
                                >
                                    📷 Start Camera
                                </button>
                            )}

                            {cameraStarted && !faceCaptured && (
                                <button
                                    type="button"
                                    onClick={captureFace}
                                    style={{
                                        padding: "12px 24px",
                                        border: "none",
                                        borderRadius: "10px",
                                        background: "#315b9b",
                                        color: "#ffffff",
                                        fontWeight: "700",
                                        cursor: "pointer"
                                    }}
                                >
                                    📸 Capture Face
                                </button>
                            )}

                            {faceCaptured && (
                                <div>
                                    <div
                                        style={{
                                            color: "#15803d",
                                            fontWeight: "700",
                                            marginBottom: "12px"
                                        }}
                                    >
                                        ✓ Face captured successfully
                                    </div>

                                    <button
                                        type="button"
                                        onClick={retakeFace}
                                        style={{
                                            padding: "10px 20px",
                                            border:
                                                "1px solid #dbe3ec",
                                            borderRadius: "10px",
                                            background: "#ffffff",
                                            color: "#334155",
                                            fontWeight: "600",
                                            cursor: "pointer"
                                        }}
                                    >
                                        Retake Face
                                    </button>
                                </div>
                            )}
                        </div>

                        <div
                            style={{
                                marginTop: "18px",
                                fontSize: "13px",
                                color: "#64748b",
                                textAlign: "center"
                            }}
                        >
                            Look directly at the camera and make sure
                            your face is clearly visible.
                        </div>
                    </div>

                    {/* BUTTONS */}

                    <div
                        style={{
                            marginTop: "30px",
                            display: "flex",
                            gap: "12px",
                            justifyContent: "flex-end",
                            flexWrap: "wrap"
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => {
                                stopCamera();
                                onBackToLogin();
                            }}
                            style={{
                                padding: "12px 22px",
                                borderRadius: "10px",
                                border:
                                    "1px solid #dbe3ec",
                                background: "#ffffff",
                                color: "#334155",
                                fontWeight: "600",
                                cursor: "pointer"
                            }}
                        >
                            Back to Login
                        </button>

                        <button
                            type="submit"
                            disabled={
                                loading ||
                                !faceCaptured
                            }
                            style={{
                                padding: "12px 25px",
                                borderRadius: "10px",
                                border: "none",
                                background:
                                    loading ||
                                    !faceCaptured
                                        ? "#94a3b8"
                                        : "#315b9b",
                                color: "#ffffff",
                                fontWeight: "700",
                                cursor:
                                    loading ||
                                    !faceCaptured
                                        ? "default"
                                        : "pointer",
                                opacity:
                                    loading ? 0.7 : 1
                            }}
                        >
                            {loading
                                ? "Creating Account..."
                                : "Create SmartLearn Account"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Register;