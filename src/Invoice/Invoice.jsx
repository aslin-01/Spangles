import React, { useEffect, useRef, useState } from "react";
import { FaEye, FaEdit, FaTrash, FaDownload, FaPrint, FaPlus, FaSearch, FaChevronLeft, FaChevronRight, FaArrowLeft } from "react-icons/fa";
import jsPDF from "jspdf";
import ReactDOM from "react-dom/client";
import InvoiceTemplate from "./components/InvoiceTemplate";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

/* ------------------ Utilities ------------------ */
const currency = (value) => {
  const num = Number(value || 0);
  return "Rs. " + num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

function numberToWords(num) {
  if (num === undefined || num === null) return "Zero Only";
  num = Math.round(Number(num) || 0);
  if (num === 0) return "Zero Only";
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const b = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
  ];
  const inWords = (n) => {
    if (n < 20) return a[n];
    if (n < 100)
      return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    if (n < 1000)
      return (
        a[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 ? " " + inWords(n % 100) : "")
      );
    return "";
  };
  const parts = [];
  let crore = Math.floor(num / 10000000);
  if (crore) {
    parts.push(inWords(crore) + " Crore");
    num %= 10000000;
  }
  let lakh = Math.floor(num / 100000);
  if (lakh) {
    parts.push(inWords(lakh) + " Lakh");
    num %= 100000;
  }
  let thousand = Math.floor(num / 1000);
  if (thousand) {
    parts.push(inWords(thousand) + " Thousand");
    num %= 1000;
  }
  if (num) parts.push(inWords(num));
  return parts.join(" ") + " Only";
}

const computeItemTax = (amount, gstPercent) => {
  const amt = Number(amount || 0);
  const gstP = Number(gstPercent || 0);
  const gst = gstP ? (amt * gstP) / 100 : 0;
  const cgst = gst / 2;
  const sgst = gst / 2;
  const total = amt + gst;
  return { gst, cgst, sgst, total };
};

const subtotalItems = (items) =>
  (items || []).reduce((s, it) => s + (Number(it.amount || 0) || 0), 0);

const totalGST = (items) =>
  (items || []).reduce(
    (s, it) => s + computeItemTax(it.amount, it.gstPercent).gst,
    0
  );

const grandTotalCalc = (items, discountPercent = 0, roundOff = false) => {
  const amount = subtotalItems(items || []);
  const gst = totalGST(items || []);
  let total = amount + gst;
  const d = Number(discountPercent || 0);
  if (d) total = total - (total * d) / 100;
  if (roundOff) total = Math.round(total);
  return total;
};

const onlyDigitsMax = (value, maxLen) => {
  const digits = (value || "").replace(/\D/g, "");
  return digits.slice(0, maxLen);
};

const formatDateDisplay = (isoDate) => {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("en-GB");
};

const pdfNumber = (n) => {
  if (n === undefined || n === null || isNaN(n)) return "0.00";
  return Number(n).toFixed(2);
};

/* ------------------ Print Dialog Component ------------------ */

function PrintDialog({ record, onClose, onPrint }) {
  const [destination, setDestination] = useState("pdf");
  const [paperSize, setPaperSize] = useState("A4");
  const [layout, setLayout] = useState("portrait");
  const [colorMode, setColorMode] = useState("color");
  const [pagesPerSheet, setPagesPerSheet] = useState("1");
  const [margins, setMargins] = useState("default");
  const [scale, setScale] = useState("default");
  const [options, setOptions] = useState({
    headersAndFooters: true,
    backgroundGraphics: true
  });

  const handlePrint = () => {
    onPrint(record, destination, {
      paperSize,
      layout,
      colorMode,
      pagesPerSheet,
      margins,
      scale,
      options
    });
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex justify-end items-end">
        <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-gray-200 p-6 max-h-[90vh] overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">Print Document</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Destination</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="pdf"
                  checked={destination === "pdf"}
                  onChange={(e) => setDestination(e.target.value)}
                  className="mr-2"
                />
                Save as PDF
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="printer"
                  checked={destination === "printer"}
                  onChange={(e) => setDestination(e.target.value)}
                  className="mr-2"
                />
                Print
              </label>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Pages</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="all"
                  checked={true}
                  onChange={() => { }}
                  className="mr-2"
                />
                All
              </label>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Layout</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="portrait"
                  checked={layout === "portrait"}
                  onChange={(e) => setLayout(e.target.value)}
                  className="mr-2"
                />
                Portrait
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="landscape"
                  checked={layout === "landscape"}
                  onChange={(e) => setLayout(e.target.value)}
                  className="mr-2"
                />
                Landscape
              </label>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Paper Size</label>
            <select
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="A4">A4</option>
              <option value="Letter">Letter</option>
              <option value="Legal">Legal</option>
              <option value="A5">A5</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Pages per Sheet</label>
            <select
              value={pagesPerSheet}
              onChange={(e) => setPagesPerSheet(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="4">4</option>
              <option value="6">6</option>
              <option value="9">9</option>
              <option value="16">16</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Margins</label>
            <select
              value={margins}
              onChange={(e) => setMargins(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="default">Default</option>
              <option value="none">None</option>
              <option value="minimum">Minimum</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Scale</label>
            <select
              value={scale}
              onChange={(e) => setScale(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="default">Default</option>
              <option value="fit">Fit to Page</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Options</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.headersAndFooters}
                  onChange={(e) => setOptions(prev => ({ ...prev, headersAndFooters: e.target.checked }))}
                  className="mr-2"
                />
                Headers and footers
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.backgroundGraphics}
                  onChange={(e) => setOptions(prev => ({ ...prev, backgroundGraphics: e.target.checked }))}
                  className="mr-2"
                />
                Background graphics
              </label>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Color Mode</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="color"
                  checked={colorMode === "color"}
                  onChange={(e) => setColorMode(e.target.value)}
                  className="mr-2"
                />
                Color
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="bw"
                  checked={colorMode === "bw"}
                  onChange={(e) => setColorMode(e.target.value)}
                  className="mr-2"
                />
                Black & White
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#23414a] text-white rounded hover:bg-[#1a3139]"
            >
              {destination === "pdf" ? "Save PDF" : "Print"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

const Invoice = ({ showToast }) => {
  const [invoices, setInvoices] = useState([]);
  const [invoiceForm, setInvoiceForm] = useState(null);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewRecord, setPreviewRecord] = useState(null);
  const previewRef = useRef(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [clients, setClients] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(50);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredRecords, setFilteredRecords] = useState(null);
  const [jumpPage, setJumpPage] = useState("");
  const [rowsInput, setRowsInput] = useState(50);

  const user = JSON.parse(sessionStorage.getItem("user"));

  /* ---------- Data fetching ---------- */
  const fetchInvoices = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/invoices`);
      const data = await res.json();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn(e);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/clients`);
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchClients();
  }, []);

  useEffect(() => {
    if (!invoiceForm) setInvoiceForm(emptyRecord("invoice", invoices));
  }, [invoices]);

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (term.trim() === "") {
      setFilteredRecords(null);
      setCurrentPage(1);
      return;
    }

    const filtered = invoices.filter(record => {
      const slNo = String(invoices.indexOf(record) + 1).padStart(2, "0");
      const number = record.number?.toLowerCase() || '';
      const to = record.to || {};
      const customerName = (to.name || '').toLowerCase();
      const customerClientName = (to.clientName || '').toLowerCase();
      const customerEmail = (to.email || '').toLowerCase();
      const customerPhone = (to.phone || '').toLowerCase();
      const customerAddress = (to.address || '').toLowerCase();
      const date = formatDateDisplay(record.date)?.toLowerCase() || '';
      const searchTermLower = term.toLowerCase();

      return (
        slNo.includes(searchTermLower) ||
        number.toLowerCase().includes(searchTermLower) ||
        customerName.startsWith(searchTermLower) ||
        customerClientName.startsWith(searchTermLower) ||
        customerEmail.startsWith(searchTermLower) ||
        customerPhone.startsWith(searchTermLower) ||
        customerAddress.includes(searchTermLower) || // Address keeps 'includes' for utility
        date.includes(searchTermLower)
      );
    });

    setFilteredRecords(filtered);
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
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
    const n = parseInt(val);
    if (!isNaN(n) && n > 0) {
      setRecordsPerPage(n);
      setCurrentPage(1);
    }
  };

  const displayRecords = filteredRecords || invoices;
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = displayRecords.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.max(1, Math.ceil(displayRecords.length / recordsPerPage));

  const serial = (n) => String(n).padStart(2, "0");

  const getNextNumber = (type, records = []) => {
    const prefix = "IN";
    const last =
      records
        .map((r) => parseInt((r.number || "").replace(prefix, ""), 10))
        .filter((n) => !isNaN(n))
        .sort((a, b) => b - a)[0] || 0;
    return prefix + (last + 1).toString().padStart(3, "0");
  };

  const emptyRecord = (type, records = []) => ({
    type,
    _id: null,
    id: "local_" + Date.now(),
    number: getNextNumber(type, records),
    date: new Date().toISOString().slice(0, 10),
    logo: null,
    from: {
      name: "SPANGLES WEBX",
      email: "webxspangles@gmail.com",
      phone: "7708784111",
      address: "7-15C\n1st floor Puthuval vilai\nKattathurai post\nThiruvananthapuram main road \nOpposite packianath public school",
    },
    to: { name: "", email: "", phone: "", address: "" },
    items: [{ id: Date.now(), name: "", description: "", amount: 0, gstPercent: "" }],
    discountPercent: "",
    showDiscount: false,
    roundOff: false,
    showAdditionalInfo: false,
    additionalInfo: "",
  });

  const isEmpty = (v) =>
    v === undefined || v === null || String(v).trim().length === 0;

  const validateAllFields = (form) => {
    if (!form) return false;
    if (isEmpty(form.number) || isEmpty(form.date)) return false;
    const fromReq = ["name", "email", "phone", "address"];
    for (const f of fromReq) if (!form.from?.[f]) return false;
    const toReq = ["name", "email", "phone", "address"];
    for (const f of toReq) if (!form.to?.[f]) return false;
    if (!Array.isArray(form.items) || form.items.length === 0) return false;
    for (const it of form.items) {
      if (!it.name) return false;
      if (it.amount === "" || it.amount === null || it.amount === undefined)
        return false;
    }
    return true;
  };

  const addItemToForm = () => {
    const newItem = {
      id: Date.now(),
      name: "",
      description: "",
      amount: 0,
      gstPercent: "",
    };
    setInvoiceForm((p) => ({ ...p, items: [...(p?.items || []), newItem] }));
  };

  const updateItemInForm = (index, field, value) => {
    setInvoiceForm((prev) => {
      const items = [...(prev.items || [])];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  const removeItemFromForm = (index) => {
    setInvoiceForm((prev) => ({
      ...prev,
      items: (prev.items || []).filter((_, i) => i !== index),
    }));
  };

  const handleLogoFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const obj = { name: file.name, dataUrl: ev.target.result };
      setInvoiceForm((p) => ({ ...p, logo: obj }));
    };
    reader.readAsDataURL(file);
  };

  const validateForm = (form) => {
    const errors = [];
    if (form.from.email && !form.from.email.endsWith("@gmail.com"))
      errors.push("From Email must end with @gmail.com");
    if (form.to.email && !form.to.email.endsWith("@gmail.com"))
      errors.push("To Email must end with @gmail.com");
    if (form.from.phone && !/^\d{10}$/.test(form.from.phone))
      errors.push("From Phone must be 10 digits");
    if (form.to.phone && !/^\d{10}$/.test(form.to.phone))
      errors.push("To Phone must be 10 digits");
    if (errors.length) {
      showToast(errors.join(" | "));
      return false;
    }
    return true;
  };

  const saveRecord = async (form) => {
    if (!validateForm(form)) return;
    try {
      const toInsert = {
        ...form,
        showAdditionalInfo: (form.showAdditionalInfo || false),
        additionalInfo: (form.additionalInfo || "")
      };
      const payload = { ...toInsert };
      delete payload._id;
      delete payload.id;

      if (!form._id) {
        setInvoices((prev) => [{ ...toInsert }, ...prev]);
      } else {
        setInvoices((prev) =>
          prev.map((p) => (p._id === form._id ? form : p))
        );
      }

      const endpoint = `${API_BASE}/api/invoices${form._id ? `/${form._id}` : ''}`;
      const method = form._id ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(form._id ? "Update failed" : "Save failed");

      await fetchInvoices();
      setShowInvoiceForm(false);
      setInvoiceForm(emptyRecord("invoice", invoices));
      showToast("Invoice saved successfully");
    } catch (err) {
      console.error("Save error:", err);
      showToast(err.message || "Save failed");
    }
  };

  const deleteRecord = async (id) => {
    try {
      await fetch(`${API_BASE}/api/invoices/${id}`, { method: "DELETE" });
      fetchInvoices();
      showToast("Deleted successfully");
    } catch (e) {
      showToast("Delete failed");
    }
  };

  const generatePDF = async (record) => {
    try {
      showToast("Generating Premium PDF...");

      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.width = "800px"; // Match template width
      document.body.appendChild(container);

      const root = ReactDOM.createRoot(container);
      root.render(
        <InvoiceTemplate
          record={record}
          currency={currency}
          numberToWords={numberToWords}
          formatDateDisplay={formatDateDisplay}
          pdfNumber={pdfNumber}
          computeItemTax={computeItemTax}
          calculatedTotal={grandTotalCalc(record.items, record.discountPercent, record.roundOff)}
        />
      );

      // Wait for React to finish rendering
      await new Promise(resolve => setTimeout(resolve, 1000));
      const expectedPageCount =
        container.querySelectorAll('[data-invoice-page="true"]').length || 1;

      const doc = new jsPDF({
        orientation: 'p',
        unit: 'pt',
        format: 'a4',
      });

      // Use jsPDF's native html method
      await doc.html(container.firstChild, {
        callback: function (pdf) {
          while (pdf.getNumberOfPages() > expectedPageCount) {
            pdf.deletePage(pdf.getNumberOfPages());
          }
          pdf.save(`${record.number || "invoice"}.pdf`);
          root.unmount();
          document.body.removeChild(container);
          showToast("PDF Downloaded");
        },
        x: 0,
        y: 0,
        width: 595.28,
        windowWidth: 800,
        autoPaging: 'slice' // Prevent trailing blank page while keeping multipage output
      });
    } catch (err) {
      console.error("PDF Error:", err);
      showToast("Failed to generate PDF");
    }
  };


  const handleBackendPrint = (record, destination, options) => {
    if (destination === "pdf") {
      generatePDF(record);
    } else {
      showToast("Printing...");
      // For actual printing, we would ideally use a similar approach or window.print()
      // But for now, we'll focus on the user's request for PDF download consistency.
      generatePDF(record);
    }
  };

  const openAdd = () => {
    setInvoiceForm(emptyRecord("invoice", invoices));
    setShowInvoiceForm(true);
  };

  const openPreviewFor = (record) => {
    setPreviewRecord(record);
    setPreviewOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-800">Invoices</h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search..."
              className="pl-10 pr-4 border rounded-md bg-white w-32"
            />
          </div>

          {(user?.role === "admin" || user?.access?.invoice) && (
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 bg-[#345261] text-white rounded-lg"
            >
              <FaPlus /> Add Invoice
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-[#345261] text-white">
            <tr>
              <th className="py-4 px-6">Sl No</th>
              <th>No.</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {currentRecords.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-gray-500">No records</td>
              </tr>
            ) : (
              currentRecords.map((r, i) => (
                <tr key={r._id || i} className="border-t text-center">
                  <td>{serial(indexOfFirstRecord + i + 1)}</td>
                  <td>{r.number}</td>
                  <td>{formatDateDisplay(r.date)}</td>
                  <td>{r.to?.name}</td>
                  <td className="flex justify-center gap-3 py-3">
                    <button onClick={() => openPreviewFor(r)}><FaEye /></button>
                    {(user?.role === "admin" || user?.access?.invoice) && (
                      <button onClick={() => { setInvoiceForm({ ...r }); setShowInvoiceForm(true); }}><FaEdit /></button>
                    )}
                    {user?.role === "admin" && (
                      <button onClick={() => deleteRecord(r._id)} className="text-red-500 hover:text-red-700 transition-colors"><FaTrash /></button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {displayRecords.length >= 10 && (
          <div className="flex items-center justify-between p-4 bg-white border-t border-gray-100 text-[#345261]">
            <div className="flex items-center gap-3 bg-[#f8fafc] px-4 py-2 rounded-xl border border-gray-100">
              <span className="text-sm font-medium text-gray-500 whitespace-nowrap">No. of Rows</span>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={rowsInput}
                  onChange={handleRowsChange}
                  className="w-16 px-3 py-1.5 border rounded-lg outline-none text-sm text-center bg-white border-gray-200 focus:border-[#345261] transition-all font-medium"
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-all"
              >
                <FaChevronLeft size={12} />
              </button>

              <div className="flex items-center gap-2">
                {getPageNumbers().map((num, i) => (
                  <button
                    key={i}
                    onClick={() => typeof num === "number" && setCurrentPage(num)}
                    disabled={num === "..."}
                    className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-semibold transition-all ${currentPage === num ? "bg-[#345261] text-white shadow-md transform scale-105" : num === "..." ? "cursor-default text-gray-400" : "hover:bg-gray-50 text-gray-600 active:bg-gray-100"
                      }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-all font-medium"
              >
                <FaChevronRight size={12} />
              </button>
            </div>

            <div className="flex items-center gap-3 bg-[#f8fafc] px-4 py-2 rounded-xl border border-gray-100">
              <span className="text-sm font-medium text-gray-500 whitespace-nowrap">Jump to Page</span>
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder={`1-${totalPages}`}
                  value={jumpPage}
                  onChange={(e) => setJumpPage(e.target.value)}
                  onKeyDown={handleJumpPage}
                  className="w-24 px-3 py-1.5 border rounded-lg outline-none text-sm text-center bg-white border-gray-200 focus:border-[#345261] transition-all font-medium"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {showInvoiceForm && invoiceForm && (
        <FormModal
          title="Invoice"
          form={invoiceForm}
          setForm={setInvoiceForm}
          onClose={() => setShowInvoiceForm(false)}
          onSave={() => { if (validateAllFields(invoiceForm)) saveRecord(invoiceForm); else showToast("Please fill all fields"); }}
          addItem={addItemToForm}
          updateItem={updateItemInForm}
          removeItem={removeItemFromForm}
          handleLogo={handleLogoFile}
          showAdditionalInfo={true}
          clients={clients}
        />
      )}

      {previewOpen && previewRecord && (
        <PreviewModal
          refNode={previewRef}
          record={previewRecord}
          onClose={() => setPreviewOpen(false)}
          onEdit={() => { setPreviewOpen(false); setInvoiceForm({ ...previewRecord }); setShowInvoiceForm(true); }}
          onDownload={() => generatePDF(previewRecord)}
          onPrint={() => { setSelectedRecord(previewRecord); setShowPrintDialog(true); }}
        />
      )}

      {showPrintDialog && selectedRecord && (
        <PrintDialog
          record={selectedRecord}
          onClose={() => { setShowPrintDialog(false); setSelectedRecord(null); }}
          onPrint={handleBackendPrint}
        />
      )}
    </div>
  );
};

/* ========================= */
/*  Form Modal Component     */
/* ========================= */

function FormModal({ title, form, setForm, onClose, onSave, addItem, updateItem, removeItem, handleLogo, showAdditionalInfo = true, clients = [] }) {
  const fileRef = useRef(null);
  const [showClientList, setShowClientList] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowClientList(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex justify-center items-start pt-8 px-4">
        <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl border border-gray-200 my-6 p-6 max-h-[85vh] overflow-y-auto text-[13px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-[#23414a]">{title}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-black">✕</button>
          </div>
          <div className="grid grid-cols-12 gap-4 mb-4">
            <div className="col-span-8">
              <div className="mb-3">
                <label className="text-xs text-slate-600">{title} No.:</label>
                <input className="mt-1 w-1/2 border-b border-gray-300 py-1 px-1 text-sm" value={form.number} readOnly />
              </div>
              <div>
                <label className="text-xs text-slate-600">{title} Date</label>
                <input type="date" className="mt-1 w-1/2 border-b border-gray-300 py-1 px-1 text-sm" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
              </div>
            </div>
            <div className="col-span-4 p-2">
              <div onClick={() => fileRef.current?.click()} className="h-24 flex items-center justify-center cursor-pointer bg-white">
                <img src="/logo.png" alt="logo" className="h-full object-contain border rounded" style={{ padding: '15px' }} />
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleLogo(e.target.files?.[0])} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="border rounded-2xl p-4">
              <h3 className="text-[13px] font-semibold mb-2 text-[#23414a]">{title} From</h3>
              <input className="w-full border-b py-2 text-sm mb-2 px-1" placeholder="Your Business Name" value={form.from.name} onChange={(e) => setForm((p) => ({ ...p, from: { ...p.from, name: e.target.value } }))} />
              <input className="w-full border-b py-2 text-sm mb-2 px-1" placeholder="Your Email" value={form.from.email} onChange={(e) => setForm((p) => ({ ...p, from: { ...p.from, email: e.target.value } }))} />
              <input className="w-full border-b py-2 text-sm mb-2 px-1" placeholder="Your Phone Number" value={form.from.phone} onChange={(e) => setForm((p) => ({ ...p, from: { ...p.from, phone: onlyDigitsMax(e.target.value, 10) } }))} />
              <textarea className="w-full border-b py-2 text-sm mb-2 px-1 resize-none h-24 leading-tight" placeholder="Address" value={form.from.address} onChange={(e) => setForm((p) => ({ ...p, from: { ...p.from, address: e.target.value } }))} />
            </div>
            <div className="border rounded-2xl p-4">
              <h3 className="text-[13px] font-semibold mb-2 text-[#23414a]">{title} For</h3>
              <div className="relative" ref={dropdownRef}>
                <input
                  className="w-full border-b py-2 text-sm mb-2 px-1 focus:border-[#345261] outline-none"
                  placeholder="Client Business Name"
                  value={form.to.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm((p) => ({ ...p, to: { ...p.to, name: val } }));
                    setShowClientList(true);
                  }}
                />
                {showClientList && form.to.name.trim() && (
                  <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                    {(() => {
                      const filtered = clients.filter(c =>
                        (c.businessName || "").toLowerCase().startsWith(form.to.name.toLowerCase()) ||
                        (c.name || "").toLowerCase().startsWith(form.to.name.toLowerCase())
                      );
                      if (filtered.length === 0) {
                        return (
                          <div className="px-4 py-3 text-gray-400 text-xs text-center italic">
                            No matching clients found
                          </div>
                        );
                      }
                      return filtered.map((client, idx) => (
                        <div
                          key={client._id || idx}
                          className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm border-b last:border-0 border-gray-100 transition-colors"
                          onClick={() => {
                            setForm((p) => ({
                              ...p,
                              to: {
                                name: client.businessName || client.name,
                                clientName: client.name || "",
                                email: client.businessEmail || client.email || "",
                                phone: client.businessPhone || client.phone || "",
                                address: client.businessAddress || client.address || "",
                              }
                            }));
                            setShowClientList(false);
                          }}
                        >
                          <div className="font-medium text-gray-800">{client.businessName || client.name}</div>
                          <div className="text-xs text-gray-500">{client.email}</div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
              <input className="w-full border-b py-2 text-sm mb-2 px-1" placeholder="Client Email" value={form.to.email} onChange={(e) => setForm((p) => ({ ...p, to: { ...p.to, email: e.target.value } }))} />
              <input className="w-full border-b py-2 text-sm mb-2 px-1" placeholder="Client Phone Number" value={form.to.phone} onChange={(e) => setForm((p) => ({ ...p, to: { ...p.to, phone: onlyDigitsMax(e.target.value, 10) } }))} />
              <textarea className="w-full border-b py-2 text-sm mb-2 px-1 resize-none h-24 leading-tight" placeholder="Address" value={form.to.address} onChange={(e) => setForm((p) => ({ ...p, to: { ...p.to, address: e.target.value } }))} />
            </div>
          </div>
          <div className="border rounded-lg overflow-hidden mb-4 text-sm">
            <div className="bg-[#345261] text-white text-[12px] rounded-t-lg font-medium">
              <div className="grid grid-cols-12 gap-4 px-3 py-2">
                <div className="col-span-4">Item</div><div className="col-span-2">Amount</div><div className="col-span-1">GST%</div><div className="col-span-1">CGST</div><div className="col-span-1">SGST</div><div className="col-span-2">Total</div><div className="col-span-1 text-center">Action</div>
              </div>
            </div>
            <div className="p-3">
              {(form.items || []).map((it, idx) => {
                const t = computeItemTax(it.amount, it.gstPercent);
                return (
                  <div key={it.id || idx} className="grid grid-cols-12 gap-4 items-start py-2 border-b text-[12px]">
                    <div className="col-span-4">
                      <input value={it.name} onChange={(e) => updateItem(idx, "name", e.target.value)} className="w-full border-b py-1 px-1 text-[12px]" placeholder="Item name" />
                      <textarea value={it.description} onChange={(e) => updateItem(idx, "description", e.target.value)} placeholder="+ Add Description" className="mt-2 w-full border p-2 text-[12px] rounded" rows={2} />
                    </div>
                    <div className="col-span-2"><input type="number" value={it.amount} onChange={(e) => updateItem(idx, "amount", e.target.value)} className="w-full border-b py-1 px-1 text-[12px]" /></div>
                    <div className="col-span-1"><input type="number" value={it.gstPercent} onChange={(e) => updateItem(idx, "gstPercent", e.target.value)} className="w-full border-b py-1 px-1 text-[12px]" /></div>
                    <div className="col-span-1">{it.gstPercent ? currency(t.cgst) : ""}</div>
                    <div className="col-span-1">{it.gstPercent ? currency(t.sgst) : ""}</div>
                    <div className="col-span-2">{it.gstPercent ? currency(t.total) : currency(it.amount)}</div>
                    <div className="col-span-1 flex justify-center"><button onClick={() => removeItem(idx)} className="text-red-500">✕</button></div>
                  </div>
                );
              })}
              <div className="mt-2"><button onClick={addItem} className="text-sm text-slate-600">+ Add Next Item</button></div>
            </div>
          </div>
          <div className="grid grid-cols-12 gap-4 mb-4">
            <div className="col-span-7">
              <div className="text-xs text-slate-500">Total amount in words</div>
              <div className="text-sm font-semibold mt-2 text-black">{numberToWords(Math.round(grandTotalCalc(form.items || [], form.discountPercent, form.roundOff)))}</div>
            </div>
            <div className="col-span-5"><div className="bg-white border rounded p-3 text-[12px]">
              <div className="flex justify-between py-1"><span>Amount</span><span>{currency(subtotalItems(form.items || []))}</span></div>
              <div className="flex justify-between py-1"><span>CGST</span><span>{currency(totalGST(form.items || []) / 2)}</span></div>
              <div className="flex justify-between py-1"><span>SGST</span><span>{currency(totalGST(form.items || []) / 2)}</span></div>
              <div className="mt-2"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={!!form.showDiscount} onChange={(e) => setForm((prev) => ({ ...prev, showDiscount: e.target.checked }))} />+ Discount on total</label>
                {form.showDiscount && <div className="mt-2 flex items-center gap-2"><label className="text-xs">Discount (%)</label><input type="number" className="border py-1 px-2 text-[12px]" value={form.discountPercent} onChange={(e) => setForm((prev) => ({ ...prev, discountPercent: e.target.value }))} /></div>}</div>
              <div className="flex justify-between items-center py-2 mt-2"><span>Round Off</span><input type="checkbox" checked={!!form.roundOff} onChange={(e) => setForm((prev) => ({ ...prev, roundOff: e.target.checked }))} /></div>
              <div className="border-t mt-2 pt-2 text-right"><div className="text-xs">Total Amount</div><div className="text-base font-semibold">{currency(grandTotalCalc(form.items || [], form.discountPercent, form.roundOff))}</div></div>
            </div></div>
          </div>
          {showAdditionalInfo && (
            <div className="mt-6 border rounded-xl p-4">
              <div className="flex items-center justify-between"><label className="text-sm font-semibold text-[#345261]">Additional Info</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={!!form.showAdditionalInfo} onChange={(e) => setForm((prev) => ({ ...prev, showAdditionalInfo: e.target.checked, additionalInfo: e.target.checked ? prev.additionalInfo : "" }))} className="sr-only peer" />
                  <div className="w-12 h-6 bg-gray-200 rounded-full peer-checked:bg-[#23414a] transition-all"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-all peer-checked:translate-x-6"></div>
                </label>
              </div>
              {form.showAdditionalInfo && <textarea className="w-full border rounded-xl p-3 mt-4 text-sm" rows={3} placeholder="Enter description..." value={form.additionalInfo || ""} onChange={(e) => setForm((prev) => ({ ...prev, additionalInfo: e.target.value }))} />}
            </div>
          )}
          <div className="flex justify-end mt-4"><button onClick={onSave} className="px-4 py-2 bg-[#23414a] text-white rounded">Continue</button></div>
        </div>
      </div>
    </>
  );
}

/* ========================= */
/*  Preview Modal Component  */
/* ========================= */

function PreviewModal({ refNode, record, onClose, onEdit, onDownload, onPrint }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex justify-center items-start pt-8 px-4">
        <div ref={refNode} className="bg-white w-full max-w-3xl rounded-2xl shadow-xl border border-gray-200 my-6 p-6 max-h-[90vh] overflow-y-auto relative">
          <div className="absolute top-6 left-6"><button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-[#345261]"><FaArrowLeft size={20} /></button></div>
          <div className="flex justify-end items-center gap-2 mb-2">
            <button onClick={onEdit} className="p-2 hover:bg-gray-100 rounded"><FaEdit className="text-[#345261]" /></button>
            <button onClick={onDownload} className="p-2 hover:bg-gray-100 rounded"><FaDownload className="text-[#345261]" /></button>
            <button onClick={onPrint} className="p-2 hover:bg-gray-100 rounded"><FaPrint className="text-[#345261]" /></button>
            <button onClick={onClose} className="p-2 rounded hover:bg-gray-100 text-red-500">✕</button>
          </div>
          <div className="flex justify-center bg-gray-100 rounded-lg p-4 overflow-x-auto">
            <InvoiceTemplate
              record={record}
              currency={currency}
              numberToWords={numberToWords}
              formatDateDisplay={formatDateDisplay}
              pdfNumber={pdfNumber}
              computeItemTax={computeItemTax}
              calculatedTotal={grandTotalCalc(record.items, record.discountPercent, record.roundOff)}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default Invoice;
