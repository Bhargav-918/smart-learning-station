import { useEffect, useState } from "react";
import API from "../services/api";

function Profile({ onBack }) {
    const [profile, setProfile] = useState({
        full_name: "",
        date_of_birth: "",
        phone_number: "",
        email: "",

        college: "",
        education_level: "",
        degree: "",
        branch: "",
        current_year: "",
        semester: "",

        preferred_language: "",
        learning_style: "",
        academic_interests: "",
        learning_goal: "",
        daily_learning_time: ""
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const response = await API.get("/auth/profile");

            setProfile({
                full_name: response.data.full_name || "",
                date_of_birth:
                    response.data.date_of_birth || "",
                phone_number:
                    response.data.phone_number || "",
                email: response.data.email || "",

                college: response.data.college || "",
                education_level:
                    response.data.education_level || "",
                degree: response.data.degree || "",
                branch: response.data.branch || "",
                current_year:
                    response.data.current_year || "",
                semester:
                    response.data.semester || "",

                preferred_language:
                    response.data.preferred_language || "",
                learning_style:
                    response.data.learning_style || "",
                academic_interests:
                    response.data.academic_interests || "",
                learning_goal:
                    response.data.learning_goal || "",
                daily_learning_time:
                    response.data.daily_learning_time || ""
            });

        } catch (err) {
            console.error(
                "Profile loading error:",
                err
            );

            setError(
                err.response?.data?.detail ||
                "Unable to load profile."
            );

        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setProfile((previous) => ({
            ...previous,
            [name]: value
        }));

        setMessage("");
        setError("");
    };

    const handleSave = async (e) => {
        e.preventDefault();

        setSaving(true);
        setMessage("");
        setError("");

        try {
            await API.put(
                "/auth/profile",
                {
                    full_name:
                        profile.full_name || null,

                    date_of_birth:
                        profile.date_of_birth || null,

                    phone_number:
                        profile.phone_number || null,

                    college:
                        profile.college || null,

                    education_level:
                        profile.education_level || null,

                    degree:
                        profile.degree || null,

                    branch:
                        profile.branch || null,

                    current_year:
                        profile.current_year || null,

                    semester:
                        profile.semester || null,

                    preferred_language:
                        profile.preferred_language || null,

                    learning_style:
                        profile.learning_style || null,

                    academic_interests:
                        profile.academic_interests || null,

                    learning_goal:
                        profile.learning_goal || null,

                    daily_learning_time:
                        profile.daily_learning_time || null
                }
            );

            setMessage(
                "Profile updated successfully."
            );

        } catch (err) {
            console.error(
                "Profile update error:",
                err
            );

            setError(
                err.response?.data?.detail ||
                "Unable to update profile."
            );

        } finally {
            setSaving(false);
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
        marginTop: "30px",
        marginBottom: "18px"
    };

    if (loading) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#64748b"
                }}
            >
                Loading profile...
            </div>
        );
    }

    return (
        <div
            style={{
                minHeight: "100vh",
                background:
                    "linear-gradient(135deg, #f8fbff, #eef5ff)",
                padding: "35px 20px",
                boxSizing: "border-box"
            }}
        >
            <div
                style={{
                    maxWidth: "950px",
                    margin: "0 auto",
                    background: "#ffffff",
                    borderRadius: "22px",
                    padding: "35px",
                    boxShadow:
                        "0 15px 45px rgba(15, 23, 42, 0.08)"
                }}
            >

                {/* HEADER */}

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "20px",
                        marginBottom: "30px",
                        flexWrap: "wrap"
                    }}
                >
                    <div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px"
                            }}
                        >
                            <div
                                style={{
                                    width: "48px",
                                    height: "48px",
                                    borderRadius: "14px",
                                    background: "#315b9b",
                                    color: "#ffffff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "22px",
                                    fontWeight: "800"
                                }}
                            >
                                {profile.full_name
                                    ? profile.full_name
                                        .charAt(0)
                                        .toUpperCase()
                                    : "S"}
                            </div>

                            <div>
                                <h1
                                    style={{
                                        margin: 0,
                                        color: "#0f172a",
                                        fontSize: "27px"
                                    }}
                                >
                                    Student Profile
                                </h1>

                                <p
                                    style={{
                                        margin:
                                            "5px 0 0",
                                        color: "#64748b"
                                    }}
                                >
                                    Manage your learning
                                    information
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onBack}
                        style={{
                            padding: "11px 18px",
                            borderRadius: "10px",
                            border:
                                "1px solid #dbe3ec",
                            background: "#ffffff",
                            color: "#334155",
                            fontWeight: "600",
                            cursor: "pointer"
                        }}
                    >
                        ← Back to Dashboard
                    </button>
                </div>

                {/* SUCCESS */}

                {message && (
                    <div
                        style={{
                            padding: "12px 15px",
                            background: "#f0fdf4",
                            border:
                                "1px solid #bbf7d0",
                            color: "#15803d",
                            borderRadius: "10px",
                            marginBottom: "18px",
                            fontSize: "14px"
                        }}
                    >
                        ✓ {message}
                    </div>
                )}

                {/* ERROR */}

                {error && (
                    <div
                        style={{
                            padding: "12px 15px",
                            background: "#fff1f2",
                            border:
                                "1px solid #fecdd3",
                            color: "#be123c",
                            borderRadius: "10px",
                            marginBottom: "18px",
                            fontSize: "14px"
                        }}
                    >
                        {error}
                    </div>
                )}

                <form onSubmit={handleSave}>

                    {/* PERSONAL */}

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
                            Your basic account information.
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
                                Full Name
                            </label>

                            <input
                                name="full_name"
                                value={profile.full_name}
                                onChange={handleChange}
                                style={inputStyle}
                                required
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>
                                Date of Birth
                            </label>

                            <input
                                type="date"
                                name="date_of_birth"
                                value={profile.date_of_birth}
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
                                value={profile.phone_number}
                                onChange={handleChange}
                                style={inputStyle}
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>
                                Email
                            </label>

                            <input
                                type="email"
                                value={profile.email}
                                style={{
                                    ...inputStyle,
                                    background: "#f8fafc",
                                    color: "#64748b"
                                }}
                                disabled
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
                            Your current academic information.
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
                                value={profile.college}
                                onChange={handleChange}
                                style={inputStyle}
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>
                                Education Level
                            </label>

                            <select
                                name="education_level"
                                value={
                                    profile.education_level
                                }
                                onChange={handleChange}
                                style={inputStyle}
                            >
                                <option value="">
                                    Select level
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
                                value={profile.degree}
                                onChange={handleChange}
                                style={inputStyle}
                                placeholder="e.g. B.Tech"
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>
                                Branch / Specialization
                            </label>

                            <input
                                name="branch"
                                value={profile.branch}
                                onChange={handleChange}
                                style={inputStyle}
                                placeholder="e.g. CSE"
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>
                                Current Year
                            </label>

                            <select
                                name="current_year"
                                value={profile.current_year}
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
                                value={profile.semester}
                                onChange={handleChange}
                                style={inputStyle}
                                placeholder="e.g. 5th Semester"
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
                            Preferences used to personalize
                            your learning experience.
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
                                value={
                                    profile.preferred_language
                                }
                                onChange={handleChange}
                                style={inputStyle}
                            >
                                <option value="">
                                    Select language
                                </option>

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
                                Learning Style
                            </label>

                            <select
                                name="learning_style"
                                value={
                                    profile.learning_style
                                }
                                onChange={handleChange}
                                style={inputStyle}
                            >
                                <option value="">
                                    Select style
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
                                Daily Learning Time
                            </label>

                            <select
                                name="daily_learning_time"
                                value={
                                    profile.daily_learning_time
                                }
                                onChange={handleChange}
                                style={inputStyle}
                            >
                                <option value="">
                                    Select time
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
                                Academic Interests
                            </label>

                            <input
                                name="academic_interests"
                                value={
                                    profile.academic_interests
                                }
                                onChange={handleChange}
                                style={inputStyle}
                                placeholder="e.g. AI, Cybersecurity, Mathematics"
                            />
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
                                value={
                                    profile.learning_goal
                                }
                                onChange={handleChange}
                                rows={4}
                                style={{
                                    ...inputStyle,
                                    resize: "vertical"
                                }}
                                placeholder="What do you want to achieve through SmartLearn?"
                            />
                        </div>

                    </div>

                    {/* SAVE */}

                    <div
                        style={{
                            marginTop: "32px",
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: "12px"
                        }}
                    >

                        <button
                            type="button"
                            onClick={onBack}
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
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
                            style={{
                                padding: "12px 25px",
                                borderRadius: "10px",
                                border: "none",
                                background: "#315b9b",
                                color: "#ffffff",
                                fontWeight: "700",
                                cursor: saving
                                    ? "default"
                                    : "pointer",
                                opacity: saving ? 0.7 : 1
                            }}
                        >
                            {saving
                                ? "Saving..."
                                : "Save Changes"}
                        </button>

                    </div>

                </form>

            </div>
        </div>
    );
}

export default Profile;