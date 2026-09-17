import { useState } from "react";

const API_BASE = "https://smart-learning-station.onrender.com";

function ParentRegister({
                            onRegister,
                            onBackToLogin
                        }) {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!fullName || !email || !password) {
            setError("Please fill in all required fields.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        try {
            setLoading(true);

            const formData = new FormData();

            formData.append("full_name", fullName);
            formData.append("email", email);
            formData.append("phone_number", phone);
            formData.append("password", password);

            const response = await fetch(
                `${API_BASE}/auth/parent/register`,
                {
                    method: "POST",
                    body: formData
                }
            );

            const data = await response.json();

            console.log("Registration response:", data);

            if (!response.ok) {
                let errorMessage = "Unable to create parent account.";

                if (typeof data.detail === "string") {
                    errorMessage = data.detail;
                }
                else if (Array.isArray(data.detail)) {
                    errorMessage = data.detail
                        .map(error => error.msg || "Invalid input")
                        .join(", ");
                }
                else if (data.message) {
                    errorMessage = data.message;
                }

                throw new Error(errorMessage);
            }

            setSuccess(
                "Parent account created successfully!"
            );

            setTimeout(() => {
                if (onRegister) {
                    onRegister();
                }
            }, 1200);

        } catch (err) {
            console.error("Parent registration error:", err);

            setError(
                err.message ||
                "Unable to create parent account."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="parent-register-page">

            <div className="parent-register-card">

                <div className="logo">
                    👨‍👩‍👧
                </div>

                <h1>Parent Registration</h1>

                <p className="subtitle">
                    Create an account to monitor your student's
                    learning journey
                </p>

                <form onSubmit={handleSubmit}>

                    <div className="input-group">
                        <label>
                            Full Name
                        </label>

                        <input
                            type="text"
                            placeholder="Enter your full name"
                            value={fullName}
                            onChange={(e) =>
                                setFullName(e.target.value)
                            }
                            disabled={loading}
                        />
                    </div>

                    <div className="input-group">
                        <label>
                            Email Address
                        </label>

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
                        <label>
                            Phone Number
                        </label>

                        <input
                            type="tel"
                            placeholder="Enter phone number"
                            value={phone}
                            onChange={(e) =>
                                setPhone(e.target.value)
                            }
                            disabled={loading}
                        />
                    </div>

                    <div className="input-group">
                        <label>
                            Password
                        </label>

                        <input
                            type="password"
                            placeholder="Create a password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            disabled={loading}
                        />
                    </div>

                    <div className="input-group">
                        <label>
                            Confirm Password
                        </label>

                        <input
                            type="password"
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(e) =>
                                setConfirmPassword(e.target.value)
                            }
                            disabled={loading}
                        />
                    </div>

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="success-message">
                            {success}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="register-button"
                        disabled={loading}
                    >
                        {loading
                            ? "Creating Account..."
                            : "Create Parent Account"}
                    </button>

                </form>

                <div className="divider">
                    <span>OR</span>
                </div>

                <button
                    className="login-button"
                    onClick={onBackToLogin}
                    disabled={loading}
                >
                    Already have an account? Login
                </button>

                <p className="footer-text">
                    AI-Powered Adaptive Smart Learning Station
                </p>

            </div>

            <style>{`

                * {
                    box-sizing: border-box;
                }

                .parent-register-page {
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

                .parent-register-card {
                    width: 100%;
                    max-width: 460px;
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
                    font-size: 27px;
                }

                .subtitle {
                    text-align: center;
                    color: #64748b;
                    font-size: 14px;
                    line-height: 1.5;
                    margin: 9px 0 28px;
                }

                .input-group {
                    margin-bottom: 16px;
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
                }

                .input-group input:focus {
                    border-color: #3867d6;
                    box-shadow:
                        0 0 0 3px
                        rgba(56, 103, 214, 0.10);
                }

                .register-button {
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

                .register-button:hover {
                    background: #2048ad;
                }

                .register-button:disabled {
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

                .success-message {
                    background: #ecfdf5;
                    border: 1px solid #bbf7d0;
                    color: #15803d;
                    padding: 11px 13px;
                    border-radius: 10px;
                    font-size: 13px;
                    margin-bottom: 15px;
                }

                .divider {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin: 24px 0;
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

                .login-button {
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

                .login-button:hover {
                    background: #f8fafc;
                }

                .footer-text {
                    text-align: center;
                    margin: 24px 0 0;
                    color: #94a3b8;
                    font-size: 11px;
                }

                @media (max-width: 500px) {
                    .parent-register-page {
                        padding: 15px;
                    }

                    .parent-register-card {
                        padding: 28px 22px;
                    }

                    h1 {
                        font-size: 24px;
                    }
                }

            `}</style>

        </div>
    );
}

export default ParentRegister;