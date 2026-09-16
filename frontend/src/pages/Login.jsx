import { useEffect, useRef, useState } from "react";
import API from "../services/api";

function Login({ onLogin, onRegister,onParentLogin }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [faceLoading, setFaceLoading] = useState(false);

    const [error, setError] = useState("");
    const [faceMode, setFaceMode] = useState(false);

    const videoRef = useRef(null);
    const streamRef = useRef(null);

    // -----------------------------------------
    // Start camera
    // -----------------------------------------
    const startCamera = async () => {
        setError("");

        try {
            const stream =
                await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        facingMode: "user"
                    },
                    audio: false
                });

            // IMPORTANT:
            // Store stream BEFORE enabling face mode.
            // This ensures the useEffect below can attach it.
            streamRef.current = stream;

            setFaceMode(true);

        } catch (err) {
            console.error("Camera error:", err);

            setFaceMode(false);

            setError(
                "Unable to access camera. Please allow camera permission and try again."
            );
        }
    };

    // -----------------------------------------
    // Attach stream when camera UI appears
    // -----------------------------------------
    useEffect(() => {
        if (!faceMode) {
            return;
        }

        const video = videoRef.current;
        const stream = streamRef.current;

        if (!video || !stream) {
            return;
        }

        video.srcObject = stream;

        const startVideo = async () => {
            try {
                await video.play();
            } catch (err) {
                console.error(
                    "Video playback error:",
                    err
                );
            }
        };

        startVideo();

    }, [faceMode]);

    // -----------------------------------------
    // Stop camera
    // -----------------------------------------
    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current
                .getTracks()
                .forEach((track) => {
                    track.stop();
                });

            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setFaceMode(false);
    };

    // -----------------------------------------
    // Cleanup camera on component unmount
    // -----------------------------------------
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current
                    .getTracks()
                    .forEach((track) => {
                        track.stop();
                    });

                streamRef.current = null;
            }
        };
    }, []);

    // -----------------------------------------
    // Normal email/password login
    // -----------------------------------------
    const handleLogin = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const formData = new URLSearchParams();

            formData.append(
                "username",
                email
            );

            formData.append(
                "password",
                password
            );

            const response = await API.post(
                "/auth/login",
                formData,
                {
                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded"
                    }
                }
            );

            localStorage.setItem(
                "token",
                response.data.access_token
            );
            localStorage.removeItem("parentToken");
            stopCamera();

            onLogin();

        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Unable to sign in. Check your email and password."
            );

        } finally {
            setLoading(false);
        }
    };

    // -----------------------------------------
    // Face login
    // -----------------------------------------
    const handleFaceLogin = async () => {
        setError("");
        setFaceLoading(true);

        try {
            const video = videoRef.current;

            if (!video) {
                throw new Error(
                    "Camera is not available."
                );
            }

            // Make sure camera has actual video data
            if (
                video.readyState <
                HTMLMediaElement.HAVE_CURRENT_DATA ||
                video.videoWidth === 0 ||
                video.videoHeight === 0
            ) {
                throw new Error(
                    "Camera is still starting. Please wait 1–2 seconds and try again."
                );
            }

            // -----------------------------------------
            // Capture camera frame
            // -----------------------------------------

            const canvas =
                document.createElement("canvas");

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const context =
                canvas.getContext("2d");

            context.drawImage(
                video,
                0,
                0,
                canvas.width,
                canvas.height
            );

            // -----------------------------------------
            // Convert captured frame to JPEG
            // -----------------------------------------

            const blob =
                await new Promise((resolve) => {
                    canvas.toBlob(
                        resolve,
                        "image/jpeg",
                        0.9
                    );
                });

            if (!blob) {
                throw new Error(
                    "Unable to capture face image."
                );
            }

            // -----------------------------------------
            // Send image to FastAPI
            // -----------------------------------------

            const formData =
                new FormData();

            formData.append(
                "face",
                blob,
                "face-login.jpg"
            );

            const response =
                await API.post(
                    "/auth/face-login",
                    formData
                );

            // -----------------------------------------
            // Save JWT
            // -----------------------------------------

            localStorage.setItem(
                "token",
                response.data.access_token
            );
            localStorage.removeItem("parentToken");
            // Stop camera
            stopCamera();

            // Login successful
            onLogin();

        } catch (err) {
            console.error(
                "Face login error:",
                err
            );

            setError(
                err.response?.data?.detail ||
                err.message ||
                "Face verification failed. Please try again."
            );

        } finally {
            setFaceLoading(false);
        }
    };

    return (
        <div className="auth-page">

            {/* ===================================== */}
            {/* LEFT SIDE */}
            {/* ===================================== */}

            <section className="auth-visual">

                <div className="brand">

                    <div className="brand-mark">
                        ✦
                    </div>

                    <span>
                        SmartLearn
                    </span>

                </div>

                <div className="auth-copy">

                    <div className="eyebrow">
                        AI-powered adaptive learning
                    </div>

                    <h1>
                        Learn at your pace.
                        <br />
                        Grow with intelligence.
                    </h1>

                    <p>
                        SmartLearn continuously understands
                        your learning performance and helps you
                        focus on the concepts that matter most.
                    </p>

                </div>

                <div className="auth-art" />

                <small
                    style={{
                        color: "#8992a5",
                        position: "relative",
                        zIndex: 2
                    }}
                >
                    Smart Learning Station • Student Edition
                </small>

            </section>

            {/* ===================================== */}
            {/* RIGHT SIDE */}
            {/* ===================================== */}

            <section className="auth-form-wrap">

                <div className="auth-card">

                    <div
                        className="brand"
                        style={{
                            marginBottom: 32
                        }}
                    >

                        <div className="brand-mark">
                            ✦
                        </div>

                        <span>
                            SmartLearn
                        </span>

                    </div>

                    <h2>
                        Welcome back
                    </h2>

                    <p className="auth-subtitle">
                        Sign in to continue your learning journey.
                    </p>

                    {/* ================================= */}
                    {/* NORMAL LOGIN */}
                    {/* ================================= */}

                    {!faceMode && (

                        <form onSubmit={handleLogin}>

                            {/* EMAIL */}

                            <div className="form-group">

                                <label>
                                    Email address
                                </label>

                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(
                                            e.target.value
                                        )
                                    }
                                    required
                                />

                            </div>

                            {/* PASSWORD */}

                            <div className="form-group">

                                <label>
                                    Password
                                </label>

                                <input
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(
                                            e.target.value
                                        )
                                    }
                                    required
                                />

                            </div>

                            {/* ERROR */}

                            {error && (

                                <div
                                    style={{
                                        color: "#c24141",
                                        background: "#fff1f1",
                                        border:
                                            "1px solid #ffd6d6",
                                        padding: "11px 12px",
                                        borderRadius: 10,
                                        fontSize: 12,
                                        marginBottom: 15
                                    }}
                                >
                                    {error}
                                </div>

                            )}

                            {/* LOGIN */}

                            <button
                                type="submit"
                                className="primary-btn full"
                                disabled={loading}
                            >
                                {loading
                                    ? "Signing in..."
                                    : "Sign in →"}
                            </button>
                            <button type="button" onClick={onParentLogin} className="parent-login-link" > Login as Parent </button>
                            {/* DIVIDER */}

                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    margin: "18px 0",
                                    color: "#9aa3b2",
                                    fontSize: "12px"
                                }}
                            >

                                <div
                                    style={{
                                        flex: 1,
                                        height: "1px",
                                        background:
                                            "#e5e9ef"
                                    }}
                                />

                                OR

                                <div
                                    style={{
                                        flex: 1,
                                        height: "1px",
                                        background:
                                            "#e5e9ef"
                                    }}
                                />

                            </div>

                            {/* FACE LOGIN */}

                            <button
                                type="button"
                                onClick={startCamera}
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    borderRadius: "10px",
                                    border:
                                        "1px solid #315b9b",
                                    background: "#f7faff",
                                    color: "#315b9b",
                                    fontWeight: "700",
                                    cursor: "pointer"
                                }}
                            >
                                📷 Login with Face
                            </button>

                            {/* REGISTER */}

                            <button
                                type="button"
                                onClick={onRegister}
                                style={{
                                    width: "100%",
                                    marginTop: "12px",
                                    padding: "12px",
                                    borderRadius: "10px",
                                    border:
                                        "1px solid #dbe3ec",
                                    background: "#ffffff",
                                    color: "#315b9b",
                                    fontWeight: "700",
                                    cursor: "pointer"
                                }}
                            >
                                Create New Account
                            </button>

                        </form>

                    )}

                    {/* ================================= */}
                    {/* FACE LOGIN */}
                    {/* ================================= */}

                    {faceMode && (

                        <div>

                            <div
                                style={{
                                    background:
                                        "#f5f8fc",
                                    borderRadius:
                                        "14px",
                                    padding: "12px",
                                    border:
                                        "1px solid #e1e7ef"
                                }}
                            >

                                <div
                                    style={{
                                        position:
                                            "relative",
                                        width: "100%",
                                        aspectRatio:
                                            "4 / 3",
                                        overflow:
                                            "hidden",
                                        borderRadius:
                                            "10px",
                                        background:
                                            "#101827"
                                    }}
                                >

                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        onLoadedMetadata={(
                                            e
                                        ) => {
                                            e.currentTarget
                                                .play()
                                                .catch(
                                                    (
                                                        err
                                                    ) => {
                                                        console.error(
                                                            "Camera playback error:",
                                                            err
                                                        );
                                                    }
                                                );
                                        }}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit:
                                                "cover",
                                            transform:
                                                "scaleX(-1)"
                                        }}
                                    />

                                    {/* FACE GUIDE */}

                                    <div
                                        style={{
                                            position:
                                                "absolute",
                                            left: "50%",
                                            top: "50%",
                                            transform:
                                                "translate(-50%, -50%)",
                                            width: "52%",
                                            height: "68%",
                                            border:
                                                "2px solid rgba(255,255,255,0.85)",
                                            borderRadius:
                                                "50%",
                                            pointerEvents:
                                                "none"
                                        }}
                                    />

                                </div>

                                <p
                                    style={{
                                        textAlign:
                                            "center",
                                        margin:
                                            "12px 0 4px",
                                        fontSize:
                                            "13px",
                                        color:
                                            "#526071"
                                    }}
                                >
                                    Position your face inside the frame
                                </p>

                            </div>

                            {/* ERROR */}

                            {error && (

                                <div
                                    style={{
                                        color:
                                            "#c24141",
                                        background:
                                            "#fff1f1",
                                        border:
                                            "1px solid #ffd6d6",
                                        padding:
                                            "11px 12px",
                                        borderRadius:
                                            10,
                                        fontSize:
                                            12,
                                        marginTop:
                                            15
                                    }}
                                >
                                    {error}
                                </div>

                            )}

                            {/* VERIFY */}

                            <button
                                type="button"
                                onClick={
                                    handleFaceLogin
                                }
                                disabled={
                                    faceLoading
                                }
                                className="primary-btn full"
                                style={{
                                    marginTop:
                                        "15px"
                                }}
                            >
                                {faceLoading
                                    ? "Verifying face..."
                                    : "✓ Verify & Login"}
                            </button>

                            {/* CANCEL */}

                            <button
                                type="button"
                                onClick={() => {
                                    stopCamera();
                                    setError("");
                                }}
                                disabled={
                                    faceLoading
                                }
                                style={{
                                    width: "100%",
                                    marginTop:
                                        "10px",
                                    padding:
                                        "12px",
                                    borderRadius:
                                        "10px",
                                    border:
                                        "1px solid #dbe3ec",
                                    background:
                                        "#ffffff",
                                    color:
                                        "#526071",
                                    fontWeight:
                                        "700",
                                    cursor:
                                        "pointer"
                                }}
                            >
                                ← Back to Password Login
                            </button>

                        </div>

                    )}

                </div>

            </section>

        </div>
    );
}

export default Login;