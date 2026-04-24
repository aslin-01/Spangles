import { useEffect, useState, useRef } from "react";
import { FaEye, FaTrash, FaChevronDown, FaArrowLeft, FaSearch, FaChevronLeft, FaChevronRight } from "react-icons/fa";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

/* -------------------------------------------------------------
   DATE FORMAT
------------------------------------------------------------- */
const formatDateDisplay = (dateString) => {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
};

/* -------------------------------------------------------------
   ENQUIRY DETAIL MODAL
------------------------------------------------------------- */
function EnquiryDetailModal({ enquiry, onClose, onDelete, showToast }) {
  const isQuote = enquiry.type === "quote";

  return (
    <div className="fixed inset-0 bg-black/30 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-[#345261] p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
              title="Back"
            >
              <FaArrowLeft size={20} />
            </button>
            <h2 className="text-xl font-semibold">
              {isQuote ? "Quote Details" : "Enquiry Details"}
            </h2>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <label className="text-xs uppercase tracking-wider text-gray-500 font-bold block mb-1">Name</label>
              <p className="text-lg font-medium text-gray-800">{enquiry.name || enquiry.yourName || "—"}</p>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-gray-500 font-bold block mb-1">Date</label>
              <p className="text-lg font-medium text-gray-800">{formatDateDisplay(enquiry.createdAt || enquiry.date)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <label className="text-xs uppercase tracking-wider text-gray-500 font-bold block mb-1">Email</label>
              <p className="font-medium text-[#345261]">{enquiry.email || enquiry.yourEmail || "—"}</p>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-gray-500 font-bold block mb-1">Phone</label>
              <p className="font-medium text-gray-800">{enquiry.phone || enquiry.mobileNumber || "—"}</p>
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-gray-500 font-bold block mb-1">Subject</label>
            <p className="text-gray-800 font-medium">{enquiry.subject || "No Subject"}</p>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-gray-500 font-bold block mb-1">Message</label>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mt-2">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{enquiry.message || "No message content."}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

/* -------------------------------------------------------------
   MAIN ENQUIRIES PAGE
------------------------------------------------------------- */
export default function Enquiries({ showToast }) {
  const [enquiries, setEnquiries] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [jumpPage, setJumpPage] = useState("");
  const [rowsInput, setRowsInput] = useState(10);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);

  /* Fetch Enquiries */
  useEffect(() => {
    fetchEnquiries();
  }, []);

  /* Click Outside Logic for Filter */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/contact`);

      if (!res.ok) throw new Error();
      const data = await res.json();
      setEnquiries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch error:", err);
      if (showToast) showToast("Failed to load enquiries");
      // Fallback/Mock data if needed for testing
      setEnquiries([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteEnquiry = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/contact/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      setEnquiries(prev => prev.filter(e => e._id !== id));
      if (showToast) showToast("Enquiry deleted successfully");
    } catch {
      if (showToast) showToast("Failed to delete enquiry");
    }
  };

  /* Filtering */
  const filtered = enquiries.filter(e => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = (
      (e.name || e.yourName || "").toLowerCase().includes(q) ||
      (e.email || e.yourEmail || "").toLowerCase().includes(q) ||
      (e.subject || "").toLowerCase().includes(q)
    );

    const matchesType = filterType === "all" || 
      (filterType === "quote" && e.type === "quote") ||
      (filterType === "enquiry" && e.type !== "quote");

    return matchesSearch && matchesType;
  });

  const indexOfLast = currentPage * recordsPerPage;
  const current = filtered.slice(indexOfLast - recordsPerPage, indexOfLast);
  const totalPages = Math.ceil(filtered.length / recordsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 4) pages.push("...");

      let start = Math.max(2, currentPage - 2);
      let end = Math.min(totalPages - 1, currentPage + 2);

      if (currentPage <= 4) end = 5;
      if (currentPage >= totalPages - 3) start = totalPages - 4;

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (currentPage < totalPages - 3) pages.push("...");
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  const handleJumpPage = (e) => {
    if (e.key === "Enter") {
      const p = parseInt(jumpPage);
      if (p >= 1 && p <= totalPages) {
        setCurrentPage(p);
        setJumpPage("");
      }
    }
  };

  const handleRowsChange = (e) => {
    const val = e.target.value;
    setRowsInput(val);
    if (!val) return;
    const n = parseInt(val);
    if (n > 0) {
      setRecordsPerPage(n);
      setCurrentPage(1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-b-2 border-[#345261] rounded-full mx-auto"></div>
          <p className="mt-4 text-[#395563]">Loading enquiries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 text-[#345261]">
          <h1 className="text-2xl font-bold">Enquiry List</h1>

          <div className="flex items-center gap-4">
            {/* Filter */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`px-4 py-2 border rounded-lg focus:outline-none bg-white transition-all shadow-sm text-sm font-medium flex items-center gap-3 min-w-[140px] justify-between ${
                  filterType === "all" ? "text-gray-400" : "text-[#345261]"
                }`}
              >
                <span>{filterType === "all" ? "All Types" : filterType === "quote" ? "Quotes" : "Enquiries"}</span>
                <FaChevronDown size={10} className={`transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
              </button>

              {isFilterOpen && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    onClick={() => { setFilterType("all"); setIsFilterOpen(false); setCurrentPage(1); }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-gray-400 font-medium transition-colors"
                  >
                    All Types
                  </button>
                  <button
                    onClick={() => { setFilterType("enquiry"); setIsFilterOpen(false); setCurrentPage(1); }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-[#345261] font-medium transition-colors"
                  >
                    Enquiries
                  </button>
                  <button
                    onClick={() => { setFilterType("quote"); setIsFilterOpen(false); setCurrentPage(1); }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-[#345261] font-medium transition-colors"
                  >
                    Quotes
                  </button>
                </div>
              )}
            </div>

            {/* Search */}
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, email or subject..."
              className="px-4 py-2 border rounded-lg w-80 focus:ring-2 focus:ring-[#345261] focus:outline-none bg-white transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y">
            <thead className="bg-[#345261] text-white text-xs uppercase">
              <tr>
                <th className="px-6 py-3">SI No</th>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-left">Subject</th>
                <th className="px-6 py-3 text-left">Type</th>
                <th className="px-6 py-3">Action</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-100">
              {current.length > 0 ? (
                current.map((enquiry, index) => (
                  <tr
                    key={enquiry._id}
                    className="hover:bg-gray-50 text-center cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-2">{indexOfLast - recordsPerPage + index + 1}</td>
                    <td className="px-6 py-2 text-left font-medium text-gray-800">
                      {enquiry.name || enquiry.yourName}
                    </td>
                    <td className="px-6 py-2 text-left">
                      {formatDateDisplay(enquiry.createdAt || enquiry.date)}
                    </td>
                    <td className="px-6 py-2 text-left max-w-xs truncate">
                      {enquiry.subject || "—"}
                    </td>
                    <td className="px-6 py-2 text-left text-gray-600 font-medium">
                      {enquiry.type === "quote" ? "Quote" : "Enquiry"}
                    </td>
 
                    <td className="px-6 py-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedEnquiry(enquiry)}
                        className="p-2 text-[#345261] hover:bg-gray-100 rounded-full transition-colors inline-flex items-center justify-center"
                        title="View Details"
                      >
                        <FaEye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-500 border-none">
                    <p className="text-lg">No enquiries found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
 
          {/* Pagination Section - Now Inside Table Container */}
          {filtered.length >= 10 && (
            <div className="flex items-center justify-between p-4 bg-white border-t border-gray-100 text-[#345261]">
              {/* No. of Rows */}
              <div className="flex items-center gap-3 bg-[#f8fafc] px-4 py-2 rounded-xl border border-gray-100">
                <span className="text-sm font-medium text-gray-500 whitespace-nowrap">No. of Rows</span>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={rowsInput}
                    onChange={handleRowsChange}
                    className="w-16 px-3 py-1.5 border rounded-lg outline-none text-sm text-center bg-white border-gray-200 focus:border-[#345261] transition-all font-medium"
                  />
                  <FaSearch className="absolute right-2 text-gray-300 pointer-events-none" size={10} />
                </div>
              </div>
 
              {/* Pagination Controls */}
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-all"
                >
                  <FaChevronLeft size={12} />
                </button>
 
                <div className="flex items-center gap-2">
                  {getPageNumbers().map((num, idx) => (
                    <button
                      key={idx}
                      onClick={() => typeof num === "number" && setCurrentPage(num)}
                      disabled={typeof num !== "number"}
                      className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-semibold transition-all ${
                        num === currentPage
                          ? "bg-[#345261] text-white shadow-md transform scale-105"
                          : num === "..."
                          ? "cursor-default text-gray-400"
                          : "hover:bg-gray-50 text-gray-600 active:bg-gray-100"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
 
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-all font-medium"
                >
                  <FaChevronRight size={12} />
                </button>
              </div>
 
              {/* Jump to Page */}
              <div className="flex items-center gap-3 bg-[#f8fafc] px-4 py-2 rounded-xl border border-gray-100">
                <span className="text-sm font-medium text-gray-500 whitespace-nowrap">Jump to Page</span>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={jumpPage}
                    onChange={(e) => setJumpPage(e.target.value)}
                    onKeyDown={handleJumpPage}
                    placeholder={`1-${totalPages}`}
                    className="w-24 px-3 py-1.5 border rounded-lg outline-none text-sm text-center bg-white border-gray-200 focus:border-[#345261] transition-all font-medium"
                  />
                  <FaSearch className="absolute right-2 text-gray-300 pointer-events-none" size={10} />
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Details Modal */}
      {selectedEnquiry && (
        <EnquiryDetailModal
          enquiry={selectedEnquiry}
          onClose={() => setSelectedEnquiry(null)}
          onDelete={deleteEnquiry}
          showToast={showToast}
        />
      )}
    </div>
  );
}
