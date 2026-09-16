import { useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

function ParentLogin({ onLogin, onBackToStudentLogin }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();

        setError("");

        if (!email || !password) {
            setError("Please enter email and password.");
            return;
        }

        try {
            setLoading(true);

            const formData = new FormData();
            formData.append("email", email);
            formData.append("password", password);

            const response = await fetch(
                `${API_BASE}/auth/parent/login`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail || "Invalid parent email or password."
                );
            }

            // Save parent authentication token
            localStorage.setItem(
                "parentToken",
                data.access_token
            );

            // Make sure student session does not remain active
            localStorage.removeItem("token");

            // Tell App.jsx that parent login succeeded
            if (onLogin) {
                onLogin(data.parent);
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="parent-login-page">

            <div className="parent-login-card">

                <div className="logo">
                    🎓
                </div>

                <h1>Parent Login</h1>

                <p className="subtitle">
                    Monitor your student's learning journey
                </p>

                <form onSubmit={handleSubmit}>

                    <div className="input-group">
                        <label>Email Address</label>

                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            disabled={loading}
                        />
                    </div>

                    <div className="input-group">
                        <label>Password</label>

                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            disabled={loading}
                        />
                    </div>

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >
                        {loading
                            ? "Logging in..."
                            : "Login as Parent"}
                    </button>

                </form>

                <div className="divider">
                    <span>OR</span>
                </div>

                <button
                    className="student-login-button"
                    onClick={onBackToStudentLogin}
                    disabled={loading}
                >
                    Login as Student
                </button>

                <p className="footer-text">
                    AI-Powered Adaptive Smart Learning Station
                </p>

            </div>

            <style>{`

                * {
                    box-sizing: border-box;
                }

                .parent-login-page {
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 25px;
                    background: #f6f8fc;
                    font-family:
                        Inter,
                        Arial,
                        sans-serif;
                }

                .parent-login-card {
                    width: 100%;
                    max-width: 430px;
                    background: white;
                    border: 1px solid #e5e9f2;
                    border-radius: 22px;
                    padding: 38px;
                    box-shadow:
                        0 15px 45px
                        rgba(30, 45, 80, 0.08);
                }

                .logo {
                    width: 65px;
                    height: 65px;
                    margin: 0 auto 18px;
                    border-radius: 18px;
                    background: #eaf1ff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 32px;
                }

                h1 {
                    text-align: center;
                    margin: 0;
                    color: #172033;
                    font-size: 28px;
                }

                .subtitle {
                    text-align: center;
                    color: #64748b;
                    font-size: 14px;
                    margin: 9px 0 30px;
                }

                form {
                    width: 100%;
                }

                .input-group {
                    margin-bottom: 18px;
                }

                .input-group label {
                    display: block;
                    margin-bottom: 7px;
                    color: #334155;
                    font-size: 13px;
                    font-weight: 700;
                }

                .input-group input {
                    width: 100%;
                    padding: 13px 14px;
                    border: 1px solid #d9dfeb;
                    border-radius: 11px;
                    outline: none;
                    font-size: 14px;
                    color: #172033;
                    background: white;
                    transition: 0.2s;
                }

                .input-group input:focus {
                    border-color: #3867d6;
                    box-shadow:
                        0 0 0 3px
                        rgba(56, 103, 214, 0.10);
                }

                .login-button {
                    width: 100%;
                    padding: 13px;
                    border: none;
                    border-radius: 11px;
                    background: #2855c5;
                    color: white;
                    font-size: 14px;
                    font-weight: 700;
                    cursor: pointer;
                    margin-top: 5px;
                }

                .login-button:hover {
                    background: #2048ad;
                }

                .login-button:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .error-message {
                    background: #fff1f2;
                    border: 1px solid #ffd5da;
                    color: #c83f4d;
                    padding: 11px 13px;
                    border-radius: 10px;
                    font-size: 13px;
                    margin-bottom: 15px;
                }

                .divider {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin: 25px 0;
                    color: #94a3b8;
                    font-size: 11px;
                    font-weight: 700;
                }

                .divider::before,
                .divider::after {
                    content: "";
                    flex: 1;
                    height: 1px;
                    background: #e5e9f2;
                }

                .student-login-button {
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #d9dfeb;
                    border-radius: 11px;
                    background: white;
                    color: #334155;
                    font-size: 14px;
                    font-weight: 700;
                    cursor: pointer;
                }

                .student-login-button:hover {
                    background: #f8fafc;
                }

                .footer-text {
                    text-align: center;
                    margin: 25px 0 0;
                    color: #94a3b8;
                    font-size: 11px;
                }

                @media (max-width: 500px) {

                    .parent-login-page {
                        padding: 15px;
                    }

                    .parent-login-card {
                        padding: 28px 22px;
                    }

                    h1 {
                        font-size: 25px;
                    }
                }

            `}</style>

        </div>
    );
}

export default ParentLogin;