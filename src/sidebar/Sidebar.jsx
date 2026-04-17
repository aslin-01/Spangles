import React, { useState } from "react";
import { FaSignOutAlt } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
    const user = JSON.parse(sessionStorage.getItem("user"));
    const navigate = useNavigate();
    const location = useLocation();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogout = () => {
        sessionStorage.removeItem("user");
        navigate("/login", { replace: true });
    };

    const SECTION_PATH = {
        applicants: "/applicants",
        blogs: "/blogs",
        gallery: "/gallery",
        invoice: "/invoice",
        job: "/job",
        quotation: "/quotation",
        enquiries: "/enquiries",
        "user-access": "/access",
        client: "/client",
    };

    const pathnameToSection = (pathname) => {
        const found = Object.entries(SECTION_PATH).find(([, p]) => p === pathname);
        return found ? found[0] : null;
    };

    const page = pathnameToSection(location.pathname);

    const btn = (name) =>
        `w-full text-left px-4 py-3 rounded mb-2 ${
            page === name ? "bg-[#23414a]" : "hover:bg-[#24343b]"
        }`;

    const goToSection = (name) => {
        const path = SECTION_PATH[name];
        if (path) navigate(path);
    };

    return (
        <>
            {/* Sidebar */}
            <aside className="w-56 bg-[#344955] text-white p-6 fixed left-0 top-0 bottom-0 flex flex-col overflow-hidden">
                {/* NAV ITEMS */}
                <div className="flex-1 min-h-0 overflow-y-auto pr-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {/* Brand Text inside scrollable area */}
                    <div className="mb-10 flex flex-col items-center select-none pt-4">
                        <img
                            src="/side-logo.png"
                            alt="Logo"
                            className="w-40 h-auto object-contain"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://placehold.co/200x50/344955/ffffff?text=Logo";
                            }}
                        />
                    </div>

                    {/* ✅ ADMIN */}
                    {user?.role === "admin" && (
                        <>
                            {/* RECRUITMENT group */}
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] uppercase tracking-widest text-white whitespace-nowrap">Recruitment</span>
                                <div className="flex-1 h-px bg-white/30"></div>
                            </div>
                            <button onClick={() => goToSection("applicants")} className={btn("applicants")}>Applicants</button>
                            <button onClick={() => goToSection("enquiries")} className={btn("enquiries")}>Enquiries</button>
                            <button onClick={() => goToSection("job")} className={btn("job")}>Job Post</button>

                            {/* POST group */}
                            <div className="flex items-center gap-2 mt-4 mb-2">
                                <span className="text-[10px] uppercase tracking-widest text-white whitespace-nowrap">Post</span>
                                <div className="flex-1 h-px bg-white/30"></div>
                            </div>
                            <button onClick={() => goToSection("blogs")} className={btn("blogs")}>Blogs</button>
                            <button onClick={() => goToSection("gallery")} className={btn("gallery")}>Gallery</button>

                            {/* BILLING group */}
                            <div className="flex items-center gap-2 mt-4 mb-2">
                                <span className="text-[10px] uppercase tracking-widest text-white whitespace-nowrap">Billing</span>
                                <div className="flex-1 h-px bg-white/30"></div>
                            </div>
                            <button onClick={() => goToSection("quotation")} className={btn("quotation")}>Quotation</button>
                            <button onClick={() => goToSection("invoice")} className={btn("invoice")}>Invoice</button>
                            <button onClick={() => goToSection("client")} className={btn("client")}>Client</button>

                            {/* SETTINGS group */}
                            <div className="flex items-center gap-2 mt-4 mb-2">
                                <span className="text-[10px] uppercase tracking-widest text-white whitespace-nowrap">Settings</span>
                                <div className="flex-1 h-px bg-white/30"></div>
                            </div>
                            <button onClick={() => goToSection("user-access")} className={btn("user-access")}>
                                User Access
                            </button>
                        </>
                    )}

                    {/* ✅ USER */}
                    {user?.role === "user" && (
                        <>
                            {/* RECRUITMENT group */}
                            {(user.access?.applicants || user.access?.enquiries || user.access?.job) && (
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] uppercase tracking-widest text-white whitespace-nowrap">Recruitment</span>
                                    <div className="flex-1 h-px bg-white/30"></div>
                                </div>
                            )}
                            {user.access?.applicants && (
                                <button onClick={() => goToSection("applicants")} className={btn("applicants")}>Applicants</button>
                            )}
                            {user.access?.enquiries && (
                                <button onClick={() => goToSection("enquiries")} className={btn("enquiries")}>Enquiries</button>
                            )}
                            {user.access?.job && (
                                <button onClick={() => goToSection("job")} className={btn("job")}>Job Post</button>
                            )}

                            {/* POST group */}
                            {(user.access?.blogs || user.access?.gallery) && (
                                <div className="flex items-center gap-2 mt-4 mb-2">
                                    <span className="text-[10px] uppercase tracking-widest text-white whitespace-nowrap">Post</span>
                                    <div className="flex-1 h-px bg-white/30"></div>
                                </div>
                            )}
                            {user.access?.blogs && (
                                <button onClick={() => goToSection("blogs")} className={btn("blogs")}>Blogs</button>
                            )}
                            {user.access?.gallery && (
                                <button onClick={() => goToSection("gallery")} className={btn("gallery")}>Gallery</button>
                            )}

                            {/* BILLING group */}
                            {(user.access?.invoice || user.access?.quotation || user.access?.client) && (
                                <div className="flex items-center gap-2 mt-4 mb-2">
                                    <span className="text-[10px] uppercase tracking-widest text-white whitespace-nowrap">Billing</span>
                                    <div className="flex-1 h-px bg-white/30"></div>
                                </div>
                            )}
                            {user.access?.invoice && (
                                <button onClick={() => goToSection("invoice")} className={btn("invoice")}>Invoice</button>
                            )}
                            {user.access?.quotation && (
                                <button onClick={() => goToSection("quotation")} className={btn("quotation")}>Quotation</button>
                            )}
                            {user.access?.client && (
                                <button onClick={() => goToSection("client")} className={btn("client")}>Client</button>
                            )}
                        </>
                    )}

                    {/* ✅ LOGOUT → BOTTOM OF LIST */}
                    <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="w-full mt-8 flex items-center gap-3 px-4 py-3 rounded text-left
                       hover:bg-[#24343b] text-white-300 hover:text-white-400"
                    >
                        <FaSignOutAlt />
                        Logout
                    </button>
                </div>
            </aside>

            {/* LOGOUT CONFIRMATION MODAL */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-xl w-[400px] p-6 shadow-lg text-center">
                        <h3 className="text-lg font-semibold mb-2">
                            Are you sure you want to logout?
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">
                            You will be redirected to the login page.
                        </p>

                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="px-6 py-2 rounded bg-gray-200 hover:bg-gray-300"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleLogout}
                                className="px-6 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
