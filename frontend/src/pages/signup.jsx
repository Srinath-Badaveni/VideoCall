import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import signupBg from '../utils/images/signup.png';
import server_api from "../config/api";

const Signup = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const showMessage = (msg, type) => {
        const event = new CustomEvent("showMessage", {
            detail: { msg, msgType: type },
        });
        window.dispatchEvent(event);
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            showMessage("Passwords do not match!", "error");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                `${server_api}/api/v1/users/register`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: formData.fullName,
                        email: formData.email,
                        password: formData.password,
                    }),
                }
            );

            const result = await response.json();

            if (response.ok) {
                showMessage(
                    "✓ Signup successful! Redirecting to dashboard...",
                    "success"
                );

                // Use AuthContext to store token and user
                login(result.token, result.user);

                setTimeout(() => {
                    navigate("/dashboard");
                }, 2000);
            } else {
                showMessage(
                    result.message || "Signup failed. Please try again.",
                    "error"
                );
            }
        } catch (err) {
            showMessage("Server error. Please try again later.", "error");
            console.error("Signup error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-black">
            {/* Left Side - Promotional Content */}
            <div
                className="hidden lg:flex lg:w-1/2 bg-cover bg-center relative"
                style={{ backgroundImage: `url(${signupBg})` }}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-700 opacity-80"></div>

                <div className="relative z-10 flex flex-col justify-center items-center text-white px-12 w-full">
                    <div className="max-w-lg">
                        <h1 className="text-5xl font-bold mb-6">
                            Welcome to <br />
                            <span className="text-blue-300">VideoCaller Pro</span>
                        </h1>
                        <p className="text-xl mb-8 text-gray-200">
                            Connect with anyone, anywhere. Experience crystal-clear video
                            calls with our secure platform.
                        </p>

                        <div className="space-y-4">
                            <div className="flex items-start">
                                <svg
                                    className="w-6 h-6 mr-3 text-blue-300 flex-shrink-0 mt-1"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <div>
                                    <h3 className="font-semibold text-lg">HD Video Quality</h3>
                                    <p className="text-gray-300">
                                        Crystal clear video and audio for all your calls
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <svg
                                    className="w-6 h-6 mr-3 text-blue-300 flex-shrink-0 mt-1"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <div>
                                    <h3 className="font-semibold text-lg">Secure & Private</h3>
                                    <p className="text-gray-300">
                                        End-to-end encryption for all conversations
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <svg
                                    className="w-6 h-6 mr-3 text-blue-300 flex-shrink-0 mt-1"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <div>
                                    <h3 className="font-semibold text-lg">Cross-Platform</h3>
                                    <p className="text-gray-300">
                                        Works seamlessly on all devices
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Signup Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-950 px-6 py-12">
                <div className="w-full max-w-md">
                    <div className="mb-8">
                        <button
                            onClick={() => navigate("/")}
                            className="text-gray-400 hover:text-white text-sm mb-6 flex items-center"
                        >
                            <svg
                                className="w-4 h-4 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                            Back to Home
                        </button>

                        <h2 className="text-4xl font-bold text-white mb-2">
                            Create Account
                        </h2>
                        <p className="text-gray-400">
                            Join VideoCaller Pro today and start connecting
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-gray-300 mb-2 font-medium text-sm">
                                Full Name
                            </label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                placeholder="Enter your full name"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-300 mb-2 font-medium text-sm">
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-300 mb-2 font-medium text-sm">
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                placeholder="Create a strong password"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-300 mb-2 font-medium text-sm">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                placeholder="Confirm your password"
                                required
                            />
                        </div>

                        <div className="flex items-start">
                            <input type="checkbox" className="mt-1 mr-3 w-4 h-4" required />
                            <label className="text-sm text-gray-400">
                                I agree to the{" "}
                                <a
                                    href="#terms"
                                    className="text-blue-500 hover:text-blue-400 underline"
                                >
                                    Terms of Service
                                </a>{" "}
                                and{" "}
                                <a
                                    href="#privacy"
                                    className="text-blue-500 hover:text-blue-400 underline"
                                >
                                    Privacy Policy
                                </a>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Creating Account..." : "Create Account"}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-gray-400">
                            Already have an account?{" "}
                            <button
                                onClick={() => navigate("/login")}
                                className="text-blue-500 hover:text-blue-400 font-semibold"
                            >
                                Login here
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
