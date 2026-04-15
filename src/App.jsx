import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./login/Login";
import Bill from "./bill/Bill";

import './index.css';
const PrivateRoute = ({ children }) => {
  const user = sessionStorage.getItem("user");
  return user ? children : <Navigate to="/login" replace />;
};

/** Renders nothing; exists so nested routes match and Bill’s <Outlet /> stays active. */
function BillRouteStub() {
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Login Page */}
        <Route path="/login" element={<Login />} />

        {/* Dashboard shell: one Bill instance for all section paths */}
        <Route
          element={
            <PrivateRoute>
              <Bill />
            </PrivateRoute>
          }
        >
          <Route path="dashboard" element={<BillRouteStub />} />
          <Route path="applicants" element={<BillRouteStub />} />
          <Route path="blogs" element={<BillRouteStub />} />
          <Route path="gallery" element={<BillRouteStub />} />
          <Route path="job" element={<BillRouteStub />} />
          <Route path="access" element={<BillRouteStub />} />
          <Route path="invoice" element={<BillRouteStub />} />
          <Route path="quotation" element={<BillRouteStub />} />
          <Route path="enquiries" element={<BillRouteStub />} />
        </Route>

        {/* Default Route */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
