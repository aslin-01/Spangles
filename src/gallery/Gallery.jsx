import { useState, useEffect, useCallback } from "react";
import { FaTrash, FaUpload, FaEdit, FaTimes, FaChevronLeft, FaChevronRight, FaSearch, FaChevronDown, FaPlus } from "react-icons/fa";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

// Gallery Item Component with rounded corners and white background
const GalleryItem = ({ item, galleryId, onPreview }) => {
  return (
    <div 
      className="group relative rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-300 cursor-zoom-in"
      style={{ height: "240px" }}
      onClick={() => onPreview(item)}
    >

      <div className="w-full h-full flex items-center justify-center p-2">
        {item.type === "image" ? (
          <img
            src={`${API_BASE}/api/gallery/view/${item.url.split("/").pop()}`}
            className="w-full h-full object-cover rounded-lg"
            alt=""
          />
        ) : (
          <video
            src={`${API_BASE}/api/gallery/view/${item.url.split("/").pop()}`}
            className="w-full h-full object-cover rounded-lg"
            controls
          />
        )}
      </div>
    </div>
  );
};

// Main Gallery Component
export default function Gallery() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [galleries, setGalleries] = useState([]);
  const [tempTitle, setTempTitle] = useState("");
  const [uploadFiles, setUploadFiles] = useState([]);
  const [editGallery, setEditGallery] = useState(null);
  const [galleryDeleteConfirm, setGalleryDeleteConfirm] = useState(null);
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [generalConfirm, setGeneralConfirm] = useState(null);

  /* PAGINATION STATE */
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [jumpPage, setJumpPage] = useState("");
  const [rowsInput, setRowsInput] = useState(10);

  // --------------------------- LOAD GALLERIES ---------------------------
  useEffect(() => {
    loadGalleries();
  }, []);

  const loadGalleries = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/gallery`);
      const data = await res.json();

      if (Array.isArray(data)) {
        setGalleries(data);
        // Extract unique categories and their counts
        const counts = data.reduce((acc, g) => {
          if (g.category) {
            acc[g.category] = (acc[g.category] || 0) + 1;
          }
          return acc;
        }, {});
        setCategories(Object.keys(counts).sort());
        window.__categoryCounts = counts; // Temporary store for UI convenience or use state
      } else {
        setGalleries([]);
      }
    } catch (err) {
      console.error("Failed to load galleries:", err);
      setGalleries([]);
    }
  };

  const openUploadModal = () => {
    setTempTitle("");
    setCategory("");
    setUploadFiles([]);
    setEditGallery(null);
    setShowUploadModal(true);
  };

  // Open edit modal with existing gallery data
  const openEditModal = (gallery) => {
    setTempTitle(gallery.title || "");
    setCategory(gallery.category || "");
    setUploadFiles([]);
    setEditGallery(gallery);
    setShowUploadModal(true);
  };

  /* PAGINATION LOGIC */
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentGalleries = galleries.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.max(1, Math.ceil(galleries.length / recordsPerPage));

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

  // --------------------------- FILE UPLOAD ---------------------------
  const handleFilesUpload = (e) => {
    const files = Array.from(e.target.files || []);

    const mapped = files.map((file) => ({
      id: Date.now() + Math.random(),
      file,
      src: URL.createObjectURL(file),
      type: file.type.includes("video") ? "video" : "image",
      name: file.name,
    }));

    setUploadFiles((prev) => [...prev, ...mapped]);
  };

  // --------------------------- SUBMIT UPLOAD/EDIT ---------------------------
  const handleUploadSubmit = async () => {
    if (uploadFiles.length === 0 && !editGallery) {
      toast.error("Please select at least one file");
      return;
    }

    try {
      const fd = new FormData();
      fd.append("title", tempTitle || "");
      fd.append("category", category || "");
      uploadFiles.forEach((f) => fd.append("files", f.file));

      let res;
      if (editGallery) {
        // Update existing gallery
        res = await fetch(`${API_BASE}/api/gallery/${editGallery._id}`, {
          method: "PUT",
          body: fd,
        });
      } else {
        // Create new gallery
        res = await fetch(`${API_BASE}/api/gallery`, {
          method: "POST",
          body: fd,
        });
      }

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.message || (editGallery ? "Update failed" : "Upload failed"));
        return;
      }

      const updatedGallery = await res.json();

      if (editGallery) {
        // Update existing gallery in state
        setGalleries((prev) =>
          prev.map((g) => (g._id === editGallery._id ? updatedGallery : g))
        );
        toast.success("Gallery updated successfully!");
      } else {
        // Add new gallery to state
        setGalleries((prev) => [updatedGallery, ...prev]);
        toast.success("Gallery created successfully!");
      }

      setTempTitle("");
      setCategory("");
      setUploadFiles([]);
      setEditGallery(null);
      setShowUploadModal(false);
    } catch (err) {
      console.error(editGallery ? "Update error:" : "Upload error:", err);
      toast.error(editGallery ? "Update failed" : "Upload failed");
    }
  };

  // --------------------------- REMOVE FILE BEFORE UPLOAD ---------------------------
  const removeUploadFile = (id) => {
    setUploadFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // --------------------------- DELETE ITEM ---------------------------
  const handleDelete = async (galleryId, item) => {
    try {
      const filename = item.url.split("/").pop();

      const res = await fetch(`${API_BASE}/api/gallery/${galleryId}/item/${filename}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Delete failed");
      }

      const result = await res.json();

      if (result.deletedGallery) {
        // Gallery was deleted because it became empty
        setGalleries((prev) => prev.filter((g) => g._id !== galleryId));
        toast.success("Item deleted and gallery removed because it became empty");
      } else {
        // Just item was deleted, update the gallery
        setGalleries((prev) =>
          prev.map((g) => (g._id === galleryId ? result : g))
        );
        toast.success("Item deleted successfully");
      }


    } catch (err) {
      console.error("Delete failed:", err);
      toast.error(err.message || "Delete failed");
    }
  };

  // --------------------------- DELETE GALLERY ---------------------------
  const handleDeleteGallery = async (galleryId) => {
    try {
      const res = await fetch(`${API_BASE}/api/gallery/${galleryId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Delete failed");
      }

      // Remove gallery from state
      setGalleries((prev) => prev.filter((g) => g._id !== galleryId));
      setGalleryDeleteConfirm(null);
      toast.success("Gallery deleted successfully");
    } catch (err) {
      console.error("Gallery delete failed:", err);
      toast.error(err.message || "Gallery delete failed");
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen flex justify-center no-scrollbar">
      <div className="w-full max-w-[1400px] mx-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Gallery</h1>

          <button
            onClick={openUploadModal}
            className="px-5 py-3 bg-[#345261] text-white rounded-lg flex items-center gap-2 hover:bg-[#2a4250] transition shadow"
          >
            <FaUpload />
            Upload Photos
          </button>
        </div>

        {/* EMPTY MESSAGE */}
        {galleries.length === 0 && (
          <p className="text-center text-gray-500 py-20">
            No galleries created yet.
          </p>
        )}

        {/* GALLERIES */}
        {currentGalleries.map((gallery) => (
          <div key={gallery._id} className="mb-12">
            <div className="border border-gray-300 rounded-lg p-4 w-full bg-white shadow relative">

              {/* GALLERY HEADER WITH TITLE AND ACTION BUTTONS */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                  {gallery.title && (
                    <h2 className="text-lg font-semibold">{gallery.title}</h2>
                  )}
                  {gallery.category && (
                    <span className="px-3 py-1 bg-[#345261]/10 text-[#345261] text-[11px] font-bold rounded-full border border-[#345261]/20 uppercase tracking-wide">
                      {gallery.category}
                    </span>
                  )}
                </div>
                {/* EDIT AND DELETE GALLERY BUTTONS - LEFT SIDE */}
                <div className="flex gap-2 ml-auto ">

                  <button
                    onClick={() => openEditModal(gallery)}
                    className="text-[#345261] hover:text-[#2a4250] p-2 rounded-full hover:bg-gray-100 transition"
                    title="Edit Gallery"
                  >
                    <FaEdit size={18} />
                  </button>

                  <button
                    onClick={() => setGalleryDeleteConfirm(gallery)}
                    className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition"
                    title="Delete Gallery"
                  >
                    <FaTrash size={18} />
                  </button>
                </div>
              </div>


              {/* 3 COLUMN GRID */}

              <div className="grid grid-cols-4 gap-6 w-full">
                {gallery.items.map((item, idx) => (
                  <GalleryItem
                    key={`${gallery._id}-${idx}`}
                    item={item}
                    galleryId={gallery._id}
                    onPreview={setPreviewItem}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* IMAGE PREVIEW LIGHTBOX */}
        {previewItem && (
          <div 
            className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-300"
            onClick={() => setPreviewItem(null)}
          >
            <button 
              className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
              onClick={() => setPreviewItem(null)}
            >
              <FaTimes size={32} />
            </button>

            <div 
              className="max-w-[90vw] max-h-[90vh] relative"
              onClick={(e) => e.stopPropagation()}
            >
              {previewItem.type === "image" ? (
                <img
                  src={`${API_BASE}/api/gallery/view/${previewItem.url.split("/").pop()}`}
                  className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                  alt=""
                />
              ) : (
                <video
                  src={`${API_BASE}/api/gallery/view/${previewItem.url.split("/").pop()}`}
                  className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
                  controls
                  autoPlay
                />
              )}
            </div>
          </div>
        )}

        {/* Pagination Section */}
        {galleries.length >= 10 && (
          <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm mb-12 text-[#345261]">
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

            {/* Navigation Pagers */}
            <div className="flex items-center gap-6">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-[#345261] border border-gray-200 hover:border-[#345261] hover:text-white hover:bg-[#345261] disabled:opacity-30 disabled:hover:bg-white disabled:hover:border-gray-200 disabled:hover:text-[#345261] transition-all shadow-sm active:scale-95"
              >
                <FaChevronLeft size={16} />
              </button>

              <div className="flex items-center gap-2">
                {getPageNumbers().map((num, i) => (
                  <button
                    key={i}
                    onClick={() => typeof num === "number" && setCurrentPage(num)}
                    disabled={num === "..."}
                    className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-semibold transition-all ${currentPage === num
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
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-[#345261] border border-gray-200 hover:border-[#345261] hover:text-white hover:bg-[#345261] disabled:opacity-30 disabled:hover:bg-white disabled:hover:border-gray-200 disabled:hover:text-[#345261] transition-all shadow-sm active:scale-95"
              >
                <FaChevronRight size={16} />
              </button>
            </div>

            {/* Jump to Page */}
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
                <FaSearch className="absolute right-2 text-gray-300 pointer-events-none" size={10} />
              </div>
            </div>
          </div>
        )}


        {/* UPLOAD/EDIT MODAL */}
        {showUploadModal && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => {
                if (uploadFiles.length > 0) {
                  setGeneralConfirm({
                    title: "Discard Changes?",
                    message: "Are you sure you want to discard the selected files?",
                    onConfirm: () => {
                      setShowUploadModal(false);
                      setTempTitle("");
                      setUploadFiles([]);
                      setEditGallery(null);
                      setGeneralConfirm(null);
                    }
                  });
                  return;
                }
                setShowUploadModal(false);
                setTempTitle("");
                setUploadFiles([]);
                setEditGallery(null);
              }}
            />

            <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
              <div
                className="bg-white rounded-2xl w-full max-w-3xl shadow-xl max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* MODAL HEADER - WITH CLOSE ICON */}
                <div className="p-6 relative">


                  {/* CLOSE (X) ICON */}
                  <button
                    onClick={() => {
                      if (uploadFiles.length > 0) {
                        setGeneralConfirm({
                          title: "Discard Files?",
                          message: "Are you sure you want to discard your selected files?",
                          onConfirm: () => {
                            setShowUploadModal(false);
                            setTempTitle("");
                            setUploadFiles([]);
                            setEditGallery(null);
                            setGeneralConfirm(null);
                          }
                        });
                        return;
                      }
                      setShowUploadModal(false);
                      setTempTitle("");
                      setUploadFiles([]);
                      setEditGallery(null);
                    }}
                    className="absolute top-6 right-6 text-gray-500 hover:text-gray-800"
                  >
                    <FaTimes size={24} />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 no-scrollbar">
                  {/* Title and Category Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <label className="block text-sm font-medium mb-3 text-gray-700">
                        Title
                      </label>
                      <input
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none transition-colors focus:border-[#345261]"
                        value={tempTitle}
                        onChange={(e) => setTempTitle(e.target.value)}
                        placeholder="Enter gallery title"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Category ({categories.length})
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowCategoryModal(true)}
                          className="text-[11px] font-bold text-[#345261] hover:text-[#1e3039] flex items-center gap-1.5 transition-colors uppercase tracking-[0.5px] opacity-90 hover:opacity-100"
                        >
                          <FaPlus size={9} strokeWidth={2} />Add Category
                        </button>
                      </div>
                      <div className="relative h-[50px]">
                        {/* Custom Dropdown Trigger */}
                        <div
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          className={`w-full h-full px-4 border rounded-xl bg-white flex items-center justify-between cursor-pointer transition-all shadow-sm ${isDropdownOpen ? 'border-[#345261] ring-1 ring-[#345261]/10' : 'border-gray-200 hover:border-[#345261]/30'}`}
                        >
                          <span className={`font-semibold text-sm ${category ? 'text-gray-700' : 'text-gray-400'}`}>
                            {category ? `${category} ${window.__categoryCounts?.[category] ? `(${window.__categoryCounts[category]})` : ""}` : 'Select Category'}
                          </span>
                          <FaChevronDown size={12} className={`text-gray-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-[#345261]' : ''}`} />
                        </div>

                        {/* Custom Dropdown Options */}
                        {isDropdownOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setIsDropdownOpen(false)}
                            />
                            <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-2 max-h-60 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                              <div
                                onClick={() => {
                                  setCategory("");
                                  setIsDropdownOpen(false);
                                }}
                                className="px-4 py-2.5 text-xs text-gray-400 hover:bg-gray-50 cursor-pointer transition-colors uppercase tracking-wider font-bold"
                              >
                                Clear Selection
                              </div>
                              {categories.map((cat, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => {
                                    setCategory(cat);
                                    setIsDropdownOpen(false);
                                  }}
                                  className={`px-4 py-2.5 text-sm font-medium cursor-pointer transition-colors flex justify-between items-center ${category === cat ? 'bg-[#345261] text-white' : 'text-gray-600 hover:bg-[#345261]/5 hover:text-[#345261]'}`}
                                >
                                  <span>{cat}</span>
                                  {window.__categoryCounts?.[cat] && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${category === cat ? 'bg-white/20' : 'bg-gray-100 text-gray-400'}`}>
                                      {window.__categoryCounts[cat]}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dropzone */}
                  <div className="mb-8">
                    <label className="block text-sm font-medium mb-3 text-gray-700">
                      Add Files
                    </label>
                    <div className="relative">
                      <label
                        htmlFor="filePicker"
                        className="block border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <FaUpload className="text-gray-400 mx-auto mb-4" size={40} />
                        <p className="text-lg text-gray-700 mb-2">
                          Drop your images/videos here, or browse
                        </p>
                        <p className="text-sm text-gray-500">
                          Supports JPG, PNG, GIF, MP4, MOV
                        </p>

                        <input
                          id="filePicker"
                          type="file"
                          multiple
                          accept="image/*,video/*"
                          onChange={handleFilesUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Horizontal Separator */}
                  <div className="border-t border-gray-200 my-8"></div>

                  {/* Thumbnails Preview */}
                  <div>
                    {editGallery && editGallery.items.length > 0 && (
                      <div className="mb-8">
                        <h3 className="text-lg font-medium mb-4 text-gray-800">
                          Existing Gallery Items
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                          {editGallery.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="relative overflow-hidden rounded-xl bg-gray-100 border border-gray-200 group shadow-sm hover:shadow-md transition-shadow"
                              style={{ height: "160px" }}
                            >
                              <div className="w-full h-full">
                                {item.type === "image" ? (
                                  <img
                                    src={`${API_BASE}/api/gallery/view/${item.url.split("/").pop()}`}
                                    className="w-full h-full object-cover"
                                    alt=""
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = `https://placehold.co/100x100/e0e0e0/666?text=IMG`;
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                    <div className="text-white text-center">
                                      <div className="text-xs mb-1">VIDEO</div>
                                      <div className="text-xl">▶</div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* DELETE/REMOVE BAR FOR EXISTING ITEMS */}
                              <button
                                onClick={() => {
                                  setGeneralConfirm({
                                    title: "Remove Item?",
                                    message: "Are you sure you want to remove this item from the gallery?",
                                    onConfirm: () => {
                                      handleDelete(editGallery._id, item);
                                      setShowUploadModal(false);
                                      loadGalleries();
                                      setGeneralConfirm(null);
                                    }
                                  });
                                }}
                                className="absolute bottom-0 left-0 right-0 bg-white/95 hover:bg-white text-red-600 py-1.5 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider border-t border-gray-100 transition-all z-10"
                                title="Remove item"
                              >
                                <FaTrash size={10} className="text-red-500" /> Delete
                              </button>

                              {/* Item number indicator - moved to top for visibility */}
                              <div className="absolute top-1 left-1 bg-black/60 text-white text-[9px] rounded px-1.5 py-0.5 z-10 font-bold">
                                #{idx + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2 italic font-medium">
                          Click the trash icon to remove items from this gallery
                        </p>
                      </div>
                    )}

                    {uploadFiles.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium mb-4 text-gray-800">
                          New Files
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                          {uploadFiles.map((file) => (
                            <div
                              key={file.id}
                              className="relative overflow-hidden rounded-xl bg-gray-100 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                              style={{ height: "160px" }}
                            >
                              <div className="w-full h-full">
                                {file.type === "image" ? (
                                  <img
                                    src={file.src}
                                    className="w-full h-full object-cover"
                                    alt=""
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                    <div className="text-white text-center">
                                      <div className="text-xs mb-1">VIDEO</div>
                                      <div className="text-xl">▶</div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => removeUploadFile(file.id)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* FOOTER - SIMPLE BUTTONS */}
                <div className="p-6 border-t flex justify-end gap-4">
                  <button
                    onClick={() => {
                      if (uploadFiles.length > 0) {
                        setGeneralConfirm({
                          title: "Discard Changes?",
                          message: "Are you sure you want to discard your changes?",
                          onConfirm: () => {
                            setShowUploadModal(false);
                            setTempTitle("");
                            setUploadFiles([]);
                            setEditGallery(null);
                            setGeneralConfirm(null);
                          }
                        });
                        return;
                      }
                      setShowUploadModal(false);
                      setTempTitle("");
                      setUploadFiles([]);
                      setEditGallery(null);
                    }}
                    className="px-6 py-3 text-red-600  rounded-lg  font-medium"
                  >
                    Discard
                  </button>

                  <button
                    onClick={handleUploadSubmit}
                    disabled={uploadFiles.length === 0 && !editGallery}
                    className={`px-6 py-3 rounded-lg font-medium ${uploadFiles.length > 0 || editGallery
                      ? "text-white"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                    style={
                      uploadFiles.length > 0 || editGallery
                        ? { backgroundColor: "#325160" }
                        : {}
                    }
                    onMouseEnter={(e) => {
                      if (uploadFiles.length > 0 || editGallery)
                        e.target.style.backgroundColor = "#29424D"; // darker hover color
                    }}
                    onMouseLeave={(e) => {
                      if (uploadFiles.length > 0 || editGallery)
                        e.target.style.backgroundColor = "#325160";
                    }}
                  >
                    {editGallery ? "Update Gallery" : "Upload"}
                  </button>

                </div>
              </div>
            </div>
          </>
        )}

        {/* ADD NEW CATEGORY MODAL */}
        {showCategoryModal && (
          <>
            <div
              className="fixed inset-0 bg-black/60 z-[60]"
              onClick={() => setShowCategoryModal(false)}
            />
            <div className="fixed inset-0 z-[70] flex justify-center items-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Add New Category</h3>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Category Name
                  </label>
                  <input
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none transition-colors focus:border-[#345261]"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="e.g. Wedding, Nature, Event"
                    autoFocus
                  />
                </div>

                {/* EXISTING CATEGORIES LIST */}
                <div className="mb-6">
                  <label className="block text-[10px] uppercase tracking-[1.5px] text-gray-500 font-bold mb-3">
                    Available Categories
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2 no-scrollbar">
                    {categories.length > 0 ? (
                      categories.map((cat, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 text-[#345261] rounded-lg text-xs font-semibold border border-gray-200 group hover:border-[#345261]/30 transition-all"
                        >
                          <span>{cat}</span>
                          <button
                            type="button"
                            onClick={() => {
                              // Check if category is in use
                              const isInUse = galleries.some(g => g.category === cat);

                              if (isInUse) {
                                toast.error(`Cannot delete "${cat}" because it contains galleries. Please delete or reassign the galleries first.`);
                              } else {
                                setGeneralConfirm({
                                  title: "Delete Category?",
                                  message: `Are you sure you want to remove the empty category "${cat}"?`,
                                  onConfirm: () => {
                                    setCategories(categories.filter(c => c !== cat));
                                    if (category === cat) setCategory("");
                                    toast.success("Category removed.");
                                    setGeneralConfirm(null);
                                  }
                                });
                              }
                            }}
                            className="text-gray-400 hover:text-red-500 transition-colors p-0.5"
                            title="Delete Category"
                          >
                            <FaTimes size={10} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 text-xs italic py-2">No categories created yet.</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowCategoryModal(false);
                      setNewCategory("");
                    }}
                    className="px-5 py-2 text-gray-500 font-medium hover:text-gray-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (newCategory.trim()) {
                        if (!categories.includes(newCategory.trim())) {
                          setCategories([...categories, newCategory.trim()]);
                        }
                        setCategory(newCategory.trim());
                        setNewCategory("");
                        setShowCategoryModal(false);
                        toast.success("Category added and selected!");
                      } else {
                        toast.error("Please enter a category name");
                      }
                    }}
                    className="px-6 py-2 bg-[#345261] text-white rounded-lg font-medium hover:bg-[#2a4250] transition shadow-md"
                  >
                    Add Category
                  </button>
                </div>
              </div>
            </div>
          </>
        )}


        {/* DELETE GALLERY CONFIRM MODAL */}
        {galleryDeleteConfirm && (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setGalleryDeleteConfirm(null)}
            />

            <div className="fixed inset-0 flex justify-center items-center z-50">
              <div className="bg-white rounded-2xl p-8 w-96 shadow-xl">
                <div className="mb-4 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-red-100 rounded-full">
                    <FaTrash className="text-red-600 text-2xl" />
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-center mb-2">
                  Delete Gallery?
                </h3>

                <p className="text-center text-gray-600 mb-6">
                  Are you sure you want to delete the entire gallery "<strong>{galleryDeleteConfirm.title}</strong>"?
                  This will delete all {galleryDeleteConfirm.items.length} items in this gallery.
                </p>

                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => setGalleryDeleteConfirm(null)}
                    className="px-6 py-2 border rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={() => handleDeleteGallery(galleryDeleteConfirm._id)}
                    className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete Gallery
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Toast Container with custom styling */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />

        {/* GENERAL CONFIRMATION MODAL (Replaces window.confirm) */}
        {generalConfirm && (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-[100]"
              onClick={() => setGeneralConfirm(null)}
            />
            <div className="fixed inset-0 flex justify-center items-center z-[110] p-4 pointer-events-none">
              <div
                className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200 pointer-events-auto"
                onClick={e => e.stopPropagation()}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-50 text-[#345261] rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaTimes size={24} className="opacity-20" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {generalConfirm.title}
                  </h3>
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    {generalConfirm.message}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setGeneralConfirm(null)}
                      className="flex-1 py-3 px-4 border border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        generalConfirm.onConfirm();
                        setGeneralConfirm(null);
                      }}
                      className="flex-1 py-3 px-4 bg-[#345261] text-white rounded-xl font-semibold hover:bg-[#2a4250] transition-all shadow-md active:scale-95"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <style>
          {`
  /* PROGRESS BAR */
  .Toastify__progress-bar,
  .Toastify__progress-bar--animated,
  .Toastify__progress-bar-theme--light,
  .Toastify__progress-bar-theme--colored {
    background-color: #345261 !important;
    height: 4px !important;
    transform-origin: left !important;
    animation: gallery-progress 3000ms linear forwards !important;
  }

  @keyframes gallery-progress {
    from { transform: scaleX(1); }
    to { transform: scaleX(0); }
  }

  /* TOAST BOX */
  .Toastify__toast {
    background-color: white !important;
    color: black !important;
    border: 1px solid #dfe8ee !important;
    border-radius: 10px !important;
    box-shadow: 0 4px 10px rgba(0,0,0,0.15) !important;
    padding: 12px !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    overflow: hidden !important;
  }

  /* Ensure transitions keep white bg */
  .Toastify__toast--enter,
  .Toastify__toast--exit,
  .Toastify__toast-body {
    background-color: white !important;
  }

  /* SUCCESS TICK ICON COLOR */
  .Toastify__toast-icon svg {
    fill: #345261 !important;
    color: #345261 !important;
  }
`}
        </style>


      </div>
    </div>
  );
}
