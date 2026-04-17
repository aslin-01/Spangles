import React, { useState, useEffect } from "react";
import { FaEye, FaEdit, FaTrash, FaPlus, FaSearch, FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function Client({ showToast }) {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/clients");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const total = data.length;
      const clientsWithIds = data.map((c, index) => {
        if (c.clientId) return c;
        // Fallback: Assign CL001 to the oldest record and increment for newer ones
        const num = String(total - index).padStart(3, "0");
        return { ...c, clientId: `CL${num}` };
      });
      setClients(clientsWithIds);
    } catch (error) {
      console.error("Error fetching clients:", error);
      if (showToast) showToast("Error fetching clients");
    }
  };
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(50);
  const [jumpPage, setJumpPage] = useState("");
  const [rowsInput, setRowsInput] = useState(50);
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ 
    name: "", email: "", phone: "", address: "",
    businessName: "", businessEmail: "", businessPhone: "", businessAddress: ""
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  
  const [viewMode, setViewMode] = useState(null); // 'view' or 'edit'
  const [selectedClient, setSelectedClient] = useState(null);

  /* Filtering */
  const filtered = clients.filter(c => {
    const q = searchTerm.toLowerCase();
    return (
      (c.name || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q)
    );
  });

  const indexOfLast = currentPage * recordsPerPage;
  const current = filtered.slice(indexOfLast - recordsPerPage, indexOfLast);
  const totalPages = Math.max(1, Math.ceil(filtered.length / recordsPerPage));

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) pages.push(i);
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

  const isGmail = (email) => /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(email);

  const getNextClientId = (records = []) => {
    const prefix = "CL";
    const last =
      records
        .map((c) => {
          const cid = String(c.clientId || "");
          const idMatch = cid.match(/CL(\d+)/) || cid.match(/^(\d+)$/);
          return idMatch ? parseInt(idMatch[1] || idMatch[0], 10) : NaN;
        })
        .filter((n) => !isNaN(n))
        .sort((a, b) => b - a)[0] || 0;
    return prefix + (last + 1).toString().padStart(3, "0");
  };

  const onlyDigitsMax = (value, maxLen) => {
    const digits = (value || "").replace(/\D/g, "");
    return digits.slice(0, maxLen);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const { name, email, phone, address } = formData;
    if (!name.trim() || !email.trim() || !phone.trim() || !address.trim()) {
      if (showToast) showToast("Name, Gmail, Phone, and Address are required");
      return;
    }
    if (!isGmail(email)) {
      if (showToast) showToast("Please enter a valid Gmail address");
      return;
    }

    try {
      const payload = {
        ...formData,
        clientId: getNextClientId(clients)
      };
      const res = await fetch("http://localhost:5000/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to add client");
      const data = await res.json();
      const returnedClient = {
        ...data,
        clientId: data.clientId || getNextClientId(clients)
      };
      setClients([returnedClient, ...clients]);
      setShowModal(false);
      setFormData({ 
        name: "", email: "", phone: "", address: "",
        businessName: "", businessEmail: "", businessPhone: "", businessAddress: ""
      });
      if (showToast) showToast("Client added successfully");
    } catch (error) {
      console.error("Error adding client:", error);
      if (showToast) showToast("Error adding client");
    }
  };

  const confirmDeleteClient = (id) => {
    setDeleteTarget(id);
    setShowDeleteModal(true);
  };

  const deleteClient = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`http://localhost:5000/api/clients/${deleteTarget}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete client");
      setClients(clients.filter(c => c._id !== deleteTarget));
      if (showToast) showToast("Client deleted successfully");
    } catch (error) {
      console.error("Error deleting client:", error);
      if (showToast) showToast("Error deleting client");
    } finally {
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (viewMode === 'view' || !selectedClient) return;

    try {
      const res = await fetch(`http://localhost:5000/api/clients/${selectedClient._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedClient)
      });

      if (!res.ok) throw new Error("Failed to update client");

      setClients(clients.map(c => c._id === selectedClient._id ? selectedClient : c));
      if (showToast) showToast("Client updated successfully");
      setViewMode('view');
    } catch (error) {
      console.error("Error updating client:", error);
      if (showToast) showToast("Error updating client");
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Clients</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search clients..."
              className="pl-10 pr-4 py-2 border rounded-md bg-white w-64"
            />
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#345261] text-white rounded-lg hover:bg-[#2a424e] transition-colors"
          >
            <FaPlus />
            Add Client
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-[#345261] text-white">
            <tr>
              <th className="py-4 px-6 text-left w-16 whitespace-nowrap">Sl No</th>
              <th className="py-4 px-6 text-left whitespace-nowrap">Client ID</th>
              <th className="py-4 px-6 text-left whitespace-nowrap">Client Name</th>
              <th className="py-4 px-6 text-left whitespace-nowrap">Business Name</th>
              <th className="py-4 px-6 text-left whitespace-nowrap">Phone</th>
              <th className="py-4 px-6 text-left whitespace-nowrap">Address</th>
              <th className="py-4 px-6 text-center w-32 whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {current.length > 0 ? (
              current.map((client, index) => (
                <tr key={client._id} className="hover:bg-gray-50 text-left transition-colors">
                  <td className="px-6 py-4">{indexOfLast - recordsPerPage + index + 1}</td>
                  <td className="px-6 py-4 font-medium text-gray-800">{client.clientId || "—"}</td>
                  <td className="px-6 py-4 font-medium text-gray-800">{client.name}</td>
                  <td className="px-6 py-4 text-gray-600">{client.businessName || "—"}</td>
                  <td className="px-6 py-4">{client.phone || "—"}</td>
                  <td className="px-6 py-4">
                    <span className="truncate max-w-[150px] inline-block" title={client.address || "—"}>
                      {client.address || "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => { setSelectedClient(client); setViewMode('view'); }}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors inline-flex justify-center"
                        title="View/Edit"
                      >
                         <FaEye size={16} />
                      </button>
                      <button
                        onClick={() => confirmDeleteClient(client._id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors inline-flex justify-center"
                        title="Delete"
                      >
                        <FaTrash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                  <p className="text-lg">No clients found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {filtered.length >= 10 && (
          <div className="flex items-center justify-between p-4 bg-white border-t border-gray-100 text-[#345261]">
            <div className="flex items-center gap-3 bg-[#f8fafc] px-4 py-2 rounded-xl border border-gray-100">
              <span className="text-sm font-medium text-gray-500 whitespace-nowrap">No. of Rows</span>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={rowsInput}
                  onChange={handleRowsChange}
                  className="w-16 px-3 py-1.5 border rounded-lg outline-none text-sm text-center bg-white border-gray-200 focus:border-[#345261]"
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
              >
                <FaChevronLeft size={12} />
              </button>

              <div className="flex items-center gap-2">
                {getPageNumbers().map((num) => (
                  <button
                    key={num}
                    onClick={() => setCurrentPage(num)}
                    className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-semibold transition-all ${
                      num === currentPage
                        ? "bg-[#345261] text-white shadow-md"
                        : "hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
              >
                <FaChevronRight size={12} />
              </button>
            </div>
            
            <div className="flex items-center gap-3 bg-[#f8fafc] px-4 py-2 rounded-xl border border-gray-100">
              <span className="text-sm font-medium text-gray-500 whitespace-nowrap">Jump to Page</span>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={jumpPage}
                  onChange={(e) => setJumpPage(e.target.value)}
                  onKeyDown={handleJumpPage}
                  placeholder={`1-${totalPages}`}
                  className="w-24 px-3 py-1.5 border rounded-lg outline-none text-sm text-center bg-white border-gray-200 focus:border-[#345261]"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#345261] p-6 text-white flex justify-between items-center">
              <h2 className="text-xl font-semibold">Add New Client</h2>
              <button type="button" onClick={() => setShowModal(false)} className="text-2xl hover:text-gray-200">&times;</button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700 border-b pb-2">Client Details</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white transition duration-150 ease-in-out focus:outline-none focus:border-[#345261]"
                      placeholder="Client Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gmail *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white transition duration-150 ease-in-out focus:outline-none focus:border-[#345261]"
                      placeholder="name@gmail.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: onlyDigitsMax(e.target.value, 10) })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white transition duration-150 ease-in-out focus:outline-none focus:border-[#345261]"
                      placeholder="Phone Number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                    <textarea
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white transition duration-150 ease-in-out focus:outline-none focus:border-[#345261]"
                      placeholder="Client Address"
                      rows="3"
                    ></textarea>
                  </div>
                </div>

                {/* Business Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700 border-b pb-2">Business Details</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white transition duration-150 ease-in-out focus:outline-none focus:border-[#345261]"
                      placeholder="Business Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Email</label>
                    <input
                      type="email"
                      value={formData.businessEmail}
                      onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white transition duration-150 ease-in-out focus:outline-none focus:border-[#345261]"
                      placeholder="business@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Phone</label>
                    <input
                      type="tel"
                      value={formData.businessPhone}
                      onChange={(e) => setFormData({ ...formData, businessPhone: onlyDigitsMax(e.target.value, 10) })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white transition duration-150 ease-in-out focus:outline-none focus:border-[#345261]"
                      placeholder="Business Phone Number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
                    <textarea
                      value={formData.businessAddress}
                      onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white transition duration-150 ease-in-out focus:outline-none focus:border-[#345261]"
                      placeholder="Business Address"
                      rows="3"
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#345261] text-white rounded-lg hover:bg-[#2a424e] transition-colors"
                >
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* View/Edit Client Modal */}
      {viewMode && selectedClient && (
        <div className="fixed inset-0 bg-black/30 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#345261] p-6 text-white flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {viewMode === 'view' ? 'View Client' : 'Edit Client'}
              </h2>
              <div className="flex items-center gap-4">
                {viewMode === 'view' && (
                  <button 
                    onClick={() => setViewMode('edit')}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors font-medium border border-white/30"
                  >
                    <FaEdit size={14} /> Edit
                  </button>
                )}
                <button type="button" onClick={() => { setViewMode(null); setSelectedClient(null); }} className="text-2xl hover:text-gray-200 leading-none">&times;</button>
              </div>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 w-full max-h-[85vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700 border-b pb-2">Client Details</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
                    <input
                      type="text"
                      readOnly
                      value={selectedClient.clientId || ''}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      required
                      readOnly={viewMode === 'view'}
                      value={selectedClient.name || ''}
                      onChange={(e) => setSelectedClient({ ...selectedClient, name: e.target.value })}
                      className={`w-full px-4 py-2 border border-gray-200 rounded-lg transition duration-150 ease-in-out ${viewMode === 'view' ? 'bg-gray-50 text-gray-600 outline-none' : 'bg-white focus:outline-none focus:border-[#345261]'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      readOnly={viewMode === 'view'}
                      value={selectedClient.email || ''}
                      onChange={(e) => setSelectedClient({ ...selectedClient, email: e.target.value })}
                      className={`w-full px-4 py-2 border border-gray-200 rounded-lg transition duration-150 ease-in-out ${viewMode === 'view' ? 'bg-gray-50 text-gray-600 outline-none' : 'bg-white focus:outline-none focus:border-[#345261]'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      readOnly={viewMode === 'view'}
                      value={selectedClient.phone || ''}
                      onChange={(e) => setSelectedClient({ ...selectedClient, phone: onlyDigitsMax(e.target.value, 10) })}
                      className={`w-full px-4 py-2 border border-gray-200 rounded-lg transition duration-150 ease-in-out ${viewMode === 'view' ? 'bg-gray-50 text-gray-600 outline-none' : 'bg-white focus:outline-none focus:border-[#345261]'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      readOnly={viewMode === 'view'}
                      value={selectedClient.address || ''}
                      onChange={(e) => setSelectedClient({ ...selectedClient, address: e.target.value })}
                      className={`w-full px-4 py-2 border border-gray-200 rounded-lg transition duration-150 ease-in-out ${viewMode === 'view' ? 'bg-gray-50 text-gray-600 outline-none resize-none' : 'bg-white focus:outline-none focus:border-[#345261]'}`}
                      rows="3"
                    ></textarea>
                  </div>
                </div>

                {/* Business Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700 border-b pb-2">Business Details</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                    <input
                      type="text"
                      readOnly={viewMode === 'view'}
                      value={selectedClient.businessName || ''}
                      onChange={(e) => setSelectedClient({ ...selectedClient, businessName: e.target.value })}
                      className={`w-full px-4 py-2 border border-gray-200 rounded-lg transition duration-150 ease-in-out ${viewMode === 'view' ? 'bg-gray-50 text-gray-600 outline-none' : 'bg-white focus:outline-none focus:border-[#345261]'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Email</label>
                    <input
                      type="email"
                      readOnly={viewMode === 'view'}
                      value={selectedClient.businessEmail || ''}
                      onChange={(e) => setSelectedClient({ ...selectedClient, businessEmail: e.target.value })}
                      className={`w-full px-4 py-2 border border-gray-200 rounded-lg transition duration-150 ease-in-out ${viewMode === 'view' ? 'bg-gray-50 text-gray-600 outline-none' : 'bg-white focus:outline-none focus:border-[#345261]'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Phone</label>
                    <input
                      type="tel"
                      readOnly={viewMode === 'view'}
                      value={selectedClient.businessPhone || ''}
                      onChange={(e) => setSelectedClient({ ...selectedClient, businessPhone: onlyDigitsMax(e.target.value, 10) })}
                      className={`w-full px-4 py-2 border border-gray-200 rounded-lg transition duration-150 ease-in-out ${viewMode === 'view' ? 'bg-gray-50 text-gray-600 outline-none' : 'bg-white focus:outline-none focus:border-[#345261]'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
                    <textarea
                      readOnly={viewMode === 'view'}
                      value={selectedClient.businessAddress || ''}
                      onChange={(e) => setSelectedClient({ ...selectedClient, businessAddress: e.target.value })}
                      className={`w-full px-4 py-2 border border-gray-200 rounded-lg transition duration-150 ease-in-out ${viewMode === 'view' ? 'bg-gray-50 text-gray-600 outline-none resize-none' : 'bg-white focus:outline-none focus:border-[#345261]'}`}
                      rows="3"
                    ></textarea>
                  </div>
                </div>
              </div>

              {viewMode === 'edit' && (
                <div className="mt-8 flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => { setViewMode('view'); setSelectedClient(clients.find(c => c._id === selectedClient._id)); }}
                    className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#345261] text-white rounded-lg hover:bg-[#2a424e] transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/30 z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-[#345261] p-6 text-white text-center">
              <h3 className="text-xl font-semibold mb-2">Confirm Delete</h3>
              <p className="text-sm text-white/80">This action will permanently remove the selected client. Are you sure?</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-sm text-gray-700">
                You can cancel to keep the client or confirm to delete it immediately.
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={cancelDelete}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  No, keep it
                </button>
                <button
                  type="button"
                  onClick={deleteClient}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  Yes, delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
