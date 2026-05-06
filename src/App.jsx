import { BrowserRouter, Routes, Route, Navigate, useOutletContext } from "react-router-dom";
import React, { useEffect } from "react";

import Login from "./login/Login";
import DashboardLayout from "./layout/DashboardLayout";

// Components
import JobPost from "./job/JobPost";
import Applicants from "./applicants/Applicants";
import Gallery from "./gallery/Gallery";
import Blogs from "./blogs/Blogs";
import UserAccess from "./useraccess/UserAccess";
import Enquiries from "./enquiries/Enquiries";
import Client from "./client/Client";
import Invoice from "./Invoice/Invoice";
import Quotations from "./Quotations/Quotations";

import './index.css';

const PrivateRoute = ({ children }) => {
  const user = sessionStorage.getItem("user");
  return user ? children : <Navigate to="/login" replace />;
};

/** Wrapper for components that need showToast */
const WithToast = ({ Component }) => {
  const { showToast } = useOutletContext();
  return <Component showToast={showToast} />;
};

export default function App() {
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const percentage = (scrolled / height) * 100;
      document.documentElement.style.setProperty('--scroll-percent', `${percentage}%`);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Login Page */}
        <Route path="/login" element={<Login />} />

        {/* Protected Dashboard Routes */}
        <Route
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          {/* Default dashboard redirect handled in DashboardLayout */}
          <Route path="dashboard" element={null} />

          <Route path="applicants" element={<WithToast Component={Applicants} />} />
          <Route path="enquiries" element={<WithToast Component={Enquiries} />} />
          <Route path="job" element={<JobPost />} />
          <Route path="blogs" element={<Blogs />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="quotation" element={<WithToast Component={Quotations} />} />
          <Route path="invoice" element={<WithToast Component={Invoice} />} />
          <Route path="client" element={<WithToast Component={Client} />} />
          <Route path="access" element={<UserAccess />} />
        </Route>

        {/* Default Route */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
