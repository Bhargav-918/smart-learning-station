import { useRef, useState } from "react";
import API from "../services/api";

function FaceEnrollment({ onBack }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const [cameraStarted, setCameraStarted] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

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

            videoRef.current.srcObject = stream;

            setCameraStarted(true);
        } catch (err) {
            console.error(err);

            setError(
                "Camera access failed. Please allow camera permission."
            );
        }
    };

    const captureAndEnroll = async () => {
        if (!videoRef.current) {
            return;
        }

        setLoading(true);
        setMessage("");
        setError("");

        try {
            const video = videoRef.current;
            const canvas = canvasRef.current;

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

            const blob = await new Promise((resolve) => {
                canvas.toBlob(
                    resolve,
                    "image/jpeg",
                    0.9
                );
            });

            const formData = new FormData();

            formData.append(
                "file",
                blob,
                "face.jpg"
            );

            const response = await API.post(
                "/auth/face-enroll",
                formData
            );

            setMessage(
                response.data.message
            );
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.detail ||
                "Face enrollment failed."
            );
        } finally {
            setLoading(false);
        }
    };

    const stopCamera = () => {
        const stream =
            videoRef.current?.srcObject;

        if (stream) {
            stream
                .getTracks()
                .forEach((track) => track.stop());
        }
    };

    const handleBack = () => {
        stopCamera();
        onBack();
    };

    return (
        <div className="face-page">

            <div className="face-card">

                <button
                    onClick={handleBack}
                    className="back-button"
                >
                    ← Back
                </button>

                <h1>
                    Face Enrollment
                </h1>

                <p>
                    Register your face for
                    optional quick login.
                </p>

                <div className="camera-container">

                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="camera-preview"
                    />

                    {!cameraStarted && (
                        <div className="camera-placeholder">
                            📷
                            <span>
                                Camera not started
                            </span>
                        </div>
                    )}

                </div>

                <canvas
                    ref={canvasRef}
                    style={{
                        display: "none"
                    }}
                />

                {!cameraStarted ? (
                    <button
                        onClick={startCamera}
                        className="primary-button"
                    >
                        Start Camera
                    </button>
                ) : (
                    <button
                        onClick={captureAndEnroll}
                        disabled={loading}
                        className="primary-button"
                    >
                        {loading
                            ? "Enrolling..."
                            : "Capture & Enroll Face"}
                    </button>
                )}

                {message && (
                    <div className="success-message">
                        ✓ {message}
                    </div>
                )}

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <div className="face-tips">
                    <h3>
                        For best results
                    </h3>

                    <ul>
                        <li>
                            Look directly at the camera
                        </li>
                        <li>
                            Keep your face clearly visible
                        </li>
                        <li>
                            Use good lighting
                        </li>
                        <li>
                            Remove anything covering your face
                        </li>
                    </ul>
                </div>

            </div>

        </div>
    );
}

export default FaceEnrollment;