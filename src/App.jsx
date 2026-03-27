import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./login/Login";
import Bill from "./bill/Bill";
import Applicants from "./applicants/Applicants";
import BlogEditor from "./blogs/Blogs";
import Gallery from "./gallery/Gallery";
import JobPost from "./job/JobPost";
import UserAccess from "./useraccess/UserAccess";

import './index.css';
const PrivateRoute = ({ children }) => {
  const user = localStorage.getItem("user");
  return user ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Login Page */}
        <Route path="/login" element={<Login />} />

        {/* ADMIN PAGES */}
        <Route
          path="/dashboard"
          element={  
            <PrivateRoute>
              
              <Bill />
            </PrivateRoute>
          }
        />

        <Route
          path="/applicants"
          element={
            <PrivateRoute>
              <Applicants />
            </PrivateRoute>
          }
        />

        <Route
          path="/blogs"
          element={
            <PrivateRoute>
              <BlogEditor />
            </PrivateRoute>
          }
        />

        <Route
          path="/gallery"
          element={
            <PrivateRoute>
              <Gallery />
            </PrivateRoute>
          }
        />

        <Route
          path="/job"
          element={
            <PrivateRoute>
              <JobPost />
            </PrivateRoute>
          }
        />

        <Route
          path="/access"
          element={
            <PrivateRoute>
              <UserAccess />
            </PrivateRoute>
          }
        />

        {/* Default Route */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
