import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import loginBg from '../utils/images/login.png';
import server_api from "../config/api";

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        rememberMe: false,
    });
    console.log("Server API URL:", server_api);

    const showMessage = (msg, type) => {
        const event = new CustomEvent("showMessage", {
            detail: { msg, msgType: type },
        });
        window.dispatchEvent(event);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(
                `${server_api}/api/v1/users/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: formData.email,
                        password: formData.password,
                    }),
                }
            );

            const result = await response.json();

            if (response.ok) {
                showMessage(
                    "✓ Login successful! Redirecting to dashboard...",
                    "success"
                );

                // Use AuthContext to store token and user
                login(result.token, result.user);

                setTimeout(() => {
                    navigate("/dashboard");
                }, 2000);
            } else {
                showMessage(
                    result.message || "Login failed. Please check your credentials.",
                    "error"
                );
            }
        } catch (err) {
            showMessage("Server error. Please try again later.", "error");
            console.error("Login error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-black">
            {/* Left Side - Promotional Content */}
            <div
                className="hidden lg:flex lg:w-1/2 bg-cover bg-center relative"
                style={{ backgroundImage: `url(${loginBg})` }}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-600 to-red-700 opacity-80"></div>

                <div className="relative z-10 flex flex-col justify-center items-center text-white px-12 w-full">
                    <div className="max-w-lg">
                        <h1 className="text-5xl font-bold mb-6">
                            Welcome Back to <br />
                            <span className="text-orange-300">VideoCaller Pro</span>
                        </h1>
                        <p className="text-xl mb-8 text-gray-200">
                            Continue connecting with people who matter. Access your account
                            to make crystal-clear video calls.
                        </p>

                        <div className="space-y-4">
                            <div className="flex items-start">
                                <svg
                                    className="w-6 h-6 mr-3 text-orange-300 flex-shrink-0 mt-1"
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
                                    <h3 className="font-semibold text-lg">Instant Access</h3>
                                    <p className="text-gray-300">
                                        Start calling in seconds after login
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <svg
                                    className="w-6 h-6 mr-3 text-orange-300 flex-shrink-0 mt-1"
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
                                    <h3 className="font-semibold text-lg">Your Call History</h3>
                                    <p className="text-gray-300">
                                        All your contacts and history in one place
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <svg
                                    className="w-6 h-6 mr-3 text-orange-300 flex-shrink-0 mt-1"
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
                                    <h3 className="font-semibold text-lg">24/7 Availability</h3>
                                    <p className="text-gray-300">
                                        Access your account anytime, anywhere
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 grid grid-cols-3 gap-4 pt-8 border-t border-orange-400 border-opacity-30">
                            <div>
                                <p className="text-3xl font-bold text-orange-300">10M+</p>
                                <p className="text-gray-300 text-sm">Active Users</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-orange-300">99.9%</p>
                                <p className="text-gray-300 text-sm">Uptime</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-orange-300">190+</p>
                                <p className="text-gray-300 text-sm">Countries</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
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
                            Welcome Back
                        </h2>
                        <p className="text-gray-400">
                            Login to your VideoCaller Pro account
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-gray-300 mb-2 font-medium text-sm">
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-gray-300 font-medium text-sm">
                                    Password
                                </label>
                                <a
                                    href="#forgot"
                                    className="text-orange-500 hover:text-orange-400 text-sm font-medium"
                                >
                                    Forgot Password?
                                </a>
                            </div>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                name="rememberMe"
                                checked={formData.rememberMe}
                                onChange={handleChange}
                                className="w-4 h-4 mr-3 rounded"
                            />
                            <label className="text-gray-400 text-sm">
                                Remember me on this device
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Logging in..." : "Login to Account"}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-gray-400">
                            Don't have an account?{" "}
                            <button
                                onClick={() => navigate("/signup")}
                                className="text-orange-500 hover:text-orange-400 font-semibold"
                            >
                                Sign up here
                            </button>
                        </p>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-800">
                        <p className="text-gray-500 text-xs text-center">
                            By logging in, you agree to our Terms of Service and Privacy
                            Policy
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
