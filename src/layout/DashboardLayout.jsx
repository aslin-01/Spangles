import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import Sidebar from "../sidebar/Sidebar";

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

function pathnameToSection(pathname) {
  const found = Object.entries(SECTION_PATH).find(([, p]) => p === pathname);
  return found ? found[0] : null;
}

function canAccessPage(u, name) {
  if (!u || !name) return false;
  if (u.role === "admin") return true;
  if (name === "user-access") return false;
  const a = u.access || {};
  const map = {
    applicants: a.applicants,
    blogs: a.blogs,
    gallery: a.gallery,
    invoice: a.invoice,
    job: a.job,
    quotation: a.quotation,
    enquiries: a.enquiries,
    client: a.client,
  };
  return !!map[name];
}

function getFirstAllowedPage(user) {
  if (!user) return null;
  if (user.role === "admin") return "applicants";

  const a = user.access;
  if (!a) return null;

  if (a.applicants) return "applicants";
  if (a.blogs) return "blogs";
  if (a.gallery) return "gallery";
  if (a.job) return "job";
  if (a.invoice) return "invoice";
  if (a.quotation) return "quotation";
  if (a.client) return "client";

  return null;
}

const TOAST_DURATION = 3000;

export default function DashboardLayout() {
  const [toastMsg, setToastMsg] = useState(null);
  const toastTimerRef = useRef(null);
  const user = JSON.parse(sessionStorage.getItem("user"));
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) {
        navigate("/login", { replace: true });
        return;
    }

    if (location.pathname === "/dashboard") {
      const first = getFirstAllowedPage(user);
      if (first) {
        navigate(SECTION_PATH[first], { replace: true });
      }
      return;
    }

    const section = pathnameToSection(location.pathname);
    if (section && !canAccessPage(user, section)) {
      const first = getFirstAllowedPage(user);
      if (first) navigate(SECTION_PATH[first], { replace: true });
    }
  }, [user, location.pathname, navigate]);

  useEffect(() => {
    const style = document.createElement("style");
    style.id = "dashboard-toast-style";
    style.innerHTML = `
      @keyframes toast-progress { from { transform: scaleX(1); } to { transform: scaleX(0); } }
      .toast-progress { transform-origin: left; animation: toast-progress ${TOAST_DURATION}ms linear forwards; }
    `;
    if (!document.getElementById("dashboard-toast-style")) {
      document.head.appendChild(style);
    }
    return () => {
      const el = document.getElementById("dashboard-toast-style");
      if (el) el.remove();
    };
  }, []);

  const showToast = (message, duration = TOAST_DURATION) => {
    setToastMsg(null);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setTimeout(() => {
      setToastMsg(message);
      toastTimerRef.current = setTimeout(() => setToastMsg(null), duration);
    }, 40);
  };

  const Toast = () =>
    toastMsg && (
      <div className="fixed top-4 right-4 z-[9999] w-[320px]">
        <div
          className="bg-white text-black border rounded-lg shadow-lg overflow-hidden"
          style={{ borderColor: "#dfe8ee" }}
        >
          <div className="px-4 py-3 text-sm">{toastMsg}</div>
          <div className="h-1 bg-white">
            <div
              className="h-1 toast-progress"
              style={{ backgroundColor: "#345261" }}
            />
          </div>
        </div>
      </div>
    );

  return (
    <div className="flex bg-[#f4f7f9] min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-56 p-8 min-h-screen relative overflow-hidden">
        <Toast />
        <Outlet context={{ showToast }} />
      </main>
    </div>
  );
}
