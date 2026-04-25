

import { useState, useEffect, useRef } from "react";
import {
  FaSearch,
  FaPlus,
  FaArrowLeft,
  FaTrash,
  FaEdit,
  FaCalendarAlt,
  FaRegClock,
  FaChevronLeft,
  FaChevronRight,
  FaChevronDown,
  FaTimes,
} from "react-icons/fa";
import JoditEditor from "jodit-react";
import "jodit/es5/jodit.min.css";

const API_BASE = "http://localhost:5000";

/* Compact toolbar CSS + Content View CSS */
const toolbarCSS = `
.jodit-toolbar__box { height: 34px !important; min-height: 34px !important; }
.jodit-toolbar-button { padding: 0 4px !important; }
.jodit-toolbar-button__button { min-width: 26px !important; height: 26px !important; }
.jodit-workplace { margin-top: 2px !important; }
.jodit-status-bar { display: none !important; }

.content-view h1 { font-size: 1.875rem; font-weight: bold; margin-top: 1rem; margin-bottom: 0.5rem; }
.content-view h2 { font-size: 1.5rem; font-weight: bold; margin-top: 1rem; margin-bottom: 0.5rem; }
.content-view h3 { font-size: 1.25rem; font-weight: bold; margin-top: 1rem; margin-bottom: 0.5rem; }
.content-view p { margin-bottom: 1rem; line-height: 1.6; }
.content-view ul, .content-view ol { margin-left: 1.5rem; margin-bottom: 1rem; }
.content-view li { margin-bottom: 0.25rem; }
.content-view strong { font-weight: bold; }
.content-view em { font-style: italic; }
.content-view u { text-decoration: underline; }
.content-view blockquote { border-left: 4px solid #ccc; padding-left: 1rem; margin: 1rem 0; font-style: italic; }
.content-view ul li { list-style-type: disc; }
.content-view ol li { list-style-type: decimal; }
`;

/* Format Date */
const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

/* Toast Component */
function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-80">
      <span className="text-sm text-gray-800">{message}</span>
      <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
        <div className="bg-[#345261] h-1 rounded-full toast-progress"></div>
      </div>
    </div>
  );
}

/* MAIN COMPONENT */
export default function Blogs() {
  const [page, setPage] = useState("list");
  const [blogs, setBlogs] = useState([]);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [search, setSearch] = useState("");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const editor = useRef(null);
  const fileInputRef = useRef(null);

  const [toast, setToast] = useState(null);

  /* PAGINATION STATE */
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(50);
  const [jumpPage, setJumpPage] = useState("");
  const [rowsInput, setRowsInput] = useState(50);

  /* CATEGORY & TAG STATE */
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newTag, setNewTag] = useState("");
  const [categoryCounts, setCategoryCounts] = useState({});
  const [tagCounts, setTagCounts] = useState({});
  const [generalConfirm, setGeneralConfirm] = useState(null);

  /* Inject Toolbar CSS */
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = toolbarCSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  /* Fetch Blogs */
  const fetchBlogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/blogs`);
      const data = await res.json();
      setBlogs(data);

      // Extract unique categories and counts
      const catMap = {};
      const tagMap = {};
      data.forEach(blog => {
        if (blog.category) {
          catMap[blog.category] = (catMap[blog.category] || 0) + 1;
        }
        if (Array.isArray(blog.tags)) {
          blog.tags.forEach(t => {
            tagMap[t] = (tagMap[t] || 0) + 1;
          });
        }
      });
      setCategories(Object.keys(catMap).sort());
      setAvailableTags(Object.keys(tagMap).sort());
      setCategoryCounts(catMap);
      setTagCounts(tagMap);
    } catch (err) {
      console.error("Error loading blogs:", err);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  /* Image Preview Handler */
  useEffect(() => {
    if (!imageFile) {
      if (!isEditing || !selectedBlog) setImagePreview(null);
      return;
    }

    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);

    return () => URL.revokeObjectURL(url);
  }, [imageFile, isEditing, selectedBlog]);

  const filteredBlogs = blogs.filter((b) =>
    b.title.toLowerCase().includes(search.toLowerCase())
  );

  /* PAGINATION LOGIC */
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentBlogs = filteredBlogs.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.max(1, Math.ceil(filteredBlogs.length / recordsPerPage));

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

  /* Upload Blog */
  const uploadBlog = async () => {
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("image", imageFile);
      formData.append("category", category);
      tags.forEach((tag) => formData.append("tags", tag));

      const res = await fetch(`${API_BASE}/api/blogs`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setBlogs([data, ...blogs]);
      setSelectedBlog(data);
      resetEditor();
      setPage("view");
      setToast("Blog uploaded successfully!");
    } catch {
      setToast("Failed to upload blog");
    }
  };

  /* Update Blog */
  const updateBlog = async () => {
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      if (imageFile) formData.append("image", imageFile);
      formData.append("category", category);
      tags.forEach((tag) => formData.append("tags", tag));

      const res = await fetch(`${API_BASE}/api/blogs/${selectedBlog._id}`, {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();

      setBlogs((prev) =>
        prev.map((b) => (b._id === selectedBlog._id ? data : b))
      );

      setSelectedBlog(data);
      setIsEditing(false);
      setPage("view");
      setToast("Blog updated successfully!");
    } catch {
      setToast("Failed to update blog");
    }
  };

  /* Delete Blog */
  const deleteBlog = async (id) => {
    await fetch(`${API_BASE}/api/blogs/${id}`, { method: "DELETE" });
    setBlogs(blogs.filter((b) => b._id !== id));
    setToast("Blog deleted successfully!");
  };

  /* Reset Editor */
  const resetEditor = () => {
    setTitle("");
    setContent("");
    setImageFile(null);
    setImagePreview(null);
    setIsEditing(false);
    setCategory("");
    setTags([]);
  };

  /* Handle Image File */
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(file);
  };

  const handleAddNewCategory = () => {
    if (newCategory.trim()) {
      const trimmed = newCategory.trim();
      if (!categories.includes(trimmed)) {
        setCategories([...categories, trimmed].sort());
      }
      setCategory(trimmed);
      setNewCategory("");
      setShowCategoryModal(false);
    }
  };

  const handleAddNewTag = () => {
    if (newTag.trim()) {
      const trimmed = newTag.trim();
      if (!availableTags.includes(trimmed)) {
        setAvailableTags([...availableTags, trimmed].sort());
      }
      if (!tags.includes(trimmed)) {
        setTags([...tags, trimmed]);
      }
      setNewTag("");
      setShowTagModal(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      {/* GLOBAL TOAST */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* LIST PAGE */}
      {page === "list" && (
        <>
          <div className="flex justify-between items-center bg-white p-5 rounded-xl border border-gray-100 shadow-sm mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Blog Management</h2>
              <p className="text-gray-500 text-sm mt-1">Create, edit and manage your blog articles</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative group">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#345261] transition-colors" />
                <input
                  className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl w-72 text-sm focus:ring-2 focus:ring-[#345261]/20 focus:border-[#345261] outline-none transition-all bg-gray-50/50 focus:bg-white"
                  placeholder="Search articles..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <button
                onClick={() => {
                  resetEditor();
                  setPage("add");
                }}
                className="flex items-center gap-2 bg-[#23414a] hover:bg-[#1a3037] text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-[#23414a]/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <FaPlus size={14} /> New Article
              </button>
            </div>
          </div>

          {/* BLOG GRID - CINEMATIC VERSION */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {currentBlogs.map((blog) => (
              <div
                key={blog._id}
                className="group relative h-[380px] rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-700 cursor-default"
              >
                {/* Full-Bleed Image Background */}
                <img
                  src={`${API_BASE}/api/blogs/view/${blog.image.split("/").pop()}`}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s] ease-out"
                  alt="blog"
                />

                {/* Rich Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />

                {/* Floating Actions (Top Right) */}
                <div className="absolute top-4 right-4 flex gap-2 translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setTitle(blog.title);
                      setContent(blog.content);
                      setCategory(blog.category || "");
                      setTags(blog.tags || []);
                      setImagePreview(`${API_BASE}/api/blogs/view/${blog.image.split("/").pop()}`);
                      setImageFile(null);
                      setPage("add");
                    }}
                    className="p-2.5 bg-white/20 backdrop-blur-md hover:bg-white/40 text-white rounded-xl border border-white/20 transition-all"
                    title="Edit"
                  >
                    <FaEdit size={14} />
                  </button>
                  <button
                    onClick={() => deleteBlog(blog._id)}
                    className="p-2.5 bg-red-500/20 backdrop-blur-md hover:bg-red-500/40 text-red-100 rounded-xl border border-white/10 transition-all"
                    title="Delete"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>

                {/* Category Badge (Top Left) */}
                {blog.category && (
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-[#345261]/80 backdrop-blur-md text-white text-[10px] font-bold rounded-lg uppercase tracking-wider border border-white/10">
                      {blog.category}
                    </span>
                  </div>
                )}

                {/* Content Overlay (Bottom) */}
                <div className="absolute bottom-0 left-0 right-0 px-8 pb-5 pt-8 flex flex-col justify-end transform transition-transform duration-500 group-hover:translate-y-[-10px]">
                  <div className="flex items-center gap-2 text-white/60 mb-3 text-[11px] font-semibold tracking-wide">
                    <FaCalendarAlt size={12} className="text-white/40" />
                    {formatDate(blog.createdAt)}
                  </div>

                  <h3
                    className="text-2xl font-bold text-white leading-tight mb-2 cursor-pointer hover:text-white/80 transition-all"
                    onClick={() => {
                      setSelectedBlog(blog);
                      setPage("view");
                    }}
                  >
                    {blog.title}
                  </h3>

                  {/* Expandable Content on Hover */}
                  <div className="max-h-0 opacity-0 group-hover:max-h-40 group-hover:opacity-100 overflow-hidden transition-all duration-500 ease-in-out">
                    <p className="text-white/70 text-sm leading-relaxed line-clamp-3 mb-4 mt-2">
                      {blog.content.replace(/<[^>]*>/g, ' ').trim()}
                    </p>

                    <button
                      onClick={() => {
                        setSelectedBlog(blog);
                        setPage("view");
                      }}
                      className="w-fit flex items-center gap-2 px-5 py-2 bg-white text-[#345261] rounded-full text-xs font-bold shadow-xl hover:bg-gray-100 transition-all mb-2"
                    >
                      Read Article <FaChevronRight size={10} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Section */}
          {filteredBlogs.length >= 10 && (
            <div className="flex items-center justify-between p-4 bg-white border rounded-xl shadow-sm mt-8 text-[#345261]">
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
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-all font-medium"
                >
                  <FaChevronLeft size={12} />
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
        </>
      )}

      {/* ADD / EDIT PAGE */}
      {page === "add" && (
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => {
                if (imagePreview?.startsWith("blob:")) {
                  URL.revokeObjectURL(imagePreview);
                }
                setPage("list");
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-[#345261]"
              title="Back"
            >
              <FaArrowLeft size={20} />
            </button>
            <h2 className="text-xl font-semibold">
              {isEditing ? "Edit Blog" : "New Blog"}
            </h2>
          </div>

          <label className="block font-medium mb-1">Title</label>
          <input
            className="w-full border px-3 py-2 rounded mb-6"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter blog title"
          />

          {/* CATEGORY & TAGS SELECTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Category selection */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Category ({categories.length})
                </label>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(true)}
                  className="text-[11px] font-bold text-[#345261] hover:text-[#1e3039] flex items-center gap-1.5 transition-colors uppercase tracking-[0.5px]"
                >
                  <FaPlus size={9} /> Add Category
                </button>
              </div>
              <div className="relative">
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#345261] focus:border-[#345261] bg-white appearance-none cursor-pointer pr-10 text-sm"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat, idx) => (
                    <option key={idx} value={cat}>
                      {cat} {categoryCounts[cat] ? `(${categoryCounts[cat]})` : ""}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <FaChevronDown size={12} />
                </div>
              </div>
            </div>

            {/* Tags selection */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Tags ({availableTags.length})
                </label>
                <button
                  type="button"
                  onClick={() => setShowTagModal(true)}
                  className="text-[11px] font-bold text-[#345261] hover:text-[#1e3039] flex items-center gap-1.5 transition-colors uppercase tracking-[0.5px]"
                >
                  <FaPlus size={9} /> Add Tag
                </button>
              </div>
              <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded min-h-[42px] bg-gray-50">
                {tags.length === 0 && <span className="text-gray-400 text-xs italic">No tags selected</span>}
                {tags.map((t, i) => (
                  <span key={i} className="flex items-center gap-1 px-2 py-0.5 bg-[#345261]/10 text-[#345261] rounded text-xs font-medium border border-[#345261]/20">
                    {t}
                    <button onClick={() => setTags(tags.filter(tag => tag !== t))} className="hover:text-red-500">
                      <FaPlus className="rotate-45" size={10} />
                    </button>
                  </span>
                ))}
              </div>

              {/* Tag pool to select from */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {availableTags.filter(t => !tags.includes(t)).slice(0, 10).map((t, i) => (
                  <button
                    key={i}
                    onClick={() => setTags([...tags, t])}
                    className="px-2 py-0.5 border border-gray-200 rounded text-[10px] text-gray-500 hover:border-[#345261] hover:text-[#345261] transition-colors"
                  >
                    + {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <label className="block font-medium mb-1">Content</label>
          <div className="border border-gray-300 rounded-lg mb-4 overflow-hidden">

            <JoditEditor
              ref={editor}
              value={content}
              onBlur={(newContent) => setContent(newContent)}
              config={{
                height: 400,
                toolbarAdaptive: false,
                toolbarSticky: false,
                statusbar: false,

                // 🚫 Disable "Paste as HTML" popup
                askBeforePasteHTML: false,
                askBeforePasteFromWord: false,
                pasteHTMLAction: "insert",
                defaultActionOnPaste: "insert_clear_html",

                buttons: [
                  "bold", "italic", "underline", "strikethrough",
                  "ul", "ol",
                  "outdent", "indent",
                  "left", "center", "right", "justify",
                  "font", "fontsize", "brush"
                ],
              }}
            />

          </div>

          <label className="block font-semibold mb-2">Upload Image</label>

          <div className="flex items-start gap-4 mb-4">
            <div
              className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer w-[300px] h-[200px]"
              onClick={() => fileInputRef.current.click()}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  className="w-full h-full object-cover rounded"
                  alt="Preview"
                />
              ) : (
                <>
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/2659/2659360.png"
                    className="w-10 opacity-60"
                    alt="upload"
                  />
                  <p className="mt-2 text-gray-500 text-sm">Upload Image</p>
                </>
              )}
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageChange}
          />

          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={() => {
                if (imagePreview?.startsWith("blob:")) {
                  URL.revokeObjectURL(imagePreview);
                }
                setToast("Draft discarded");
                setPage("list");
              }}
              className="text-red-500 font-semibold"
            >
              Discard
            </button>

            <button
              onClick={() => (isEditing ? updateBlog() : uploadBlog())}
              className="bg-[#23414a] text-white px-6 py-2 rounded"
              disabled={!title || !content || (!imageFile && !imagePreview)}
            >
              {isEditing ? "Save Changes" : "Upload"}
            </button>
          </div>
        </div>
      )}

      {/* VIEW BLOG PAGE */}
      {page === "view" && selectedBlog && (
        <div className="w-full bg-white rounded-[10px] min-h-screen px-6 py-10">
          {/* Back Button */}
          <button
            onClick={() => setPage("list")}
            className="p-2 -ml-2 mb-8 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-all"
          >
            <FaArrowLeft size={20} />
          </button>

          {/* Title & Tags */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <h1 className="text-[32px] md:text-[40px] font-bold text-[#1a2b33] leading-tight tracking-tight">
              {selectedBlog.title}
            </h1>

            {selectedBlog.tags && selectedBlog.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center mt-3">
                {selectedBlog.tags.map((tag, idx) => (
                  <span key={idx} className="px-3 py-1 bg-[#345261]/10 text-[#345261] text-[10px] font-bold rounded uppercase tracking-wider">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Meta Info */}
          <div className="flex items-center gap-2 text-gray-500 mb-10">
            <FaRegClock className="text-gray-400" size={16} />
            <span className="text-sm font-medium">
              {formatDate(selectedBlog.createdAt)} |{" "}
              {new Date(selectedBlog.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          {/* Featured Image */}
          <div className="w-full mb-12 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <img
              src={`${API_BASE}/api/blogs/view/${selectedBlog.image.split("/").pop()}`}
              className="w-full h-[400px] object-cover"
              alt={selectedBlog.title}
            />
          </div>

          {/* Content Area */}
          <div
            className="content-view prose prose-lg max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: selectedBlog.content }}
            style={{
              lineHeight: "1.8",
              fontSize: "17px",
              color: "#4a5568"
            }}
          />

        </div>
      )}

      {/* ADD NEW CATEGORY MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setShowCategoryModal(false)} />
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl p-6 relative z-10">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Add New Category</h3>
            <p className="text-xs text-gray-500 mb-4">Enter a new category name or select from existing ones below.</p>

            <div className="mb-6">
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#345261] outline-none mb-4"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="e.g. Technology, Lifestyle, Career"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleAddNewCategory()}
              />

              {/* EXISTING CATEGORIES LIST */}
              <label className="block text-[10px] uppercase tracking-[1.5px] text-gray-500 font-bold mb-3">
                Existing Categories
              </label>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2">
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
                          const isInUse = blogs.some(b => b.category === cat);
                          if (isInUse) {
                            setToast(`Cannot delete "${cat}" because it is used in some blogs.`);
                          } else {
                            setGeneralConfirm({
                              title: "Delete Category?",
                              message: `Are you sure you want to remove the empty category "${cat}"?`,
                              onConfirm: () => {
                                setCategories(categories.filter(c => c !== cat));
                                if (category === cat) setCategory("");
                                setToast("Category removed.");
                              }
                            });
                          }
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors p-0.5"
                      >
                        <FaTimes size={10} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-xs italic">No categories created yet.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setNewCategory("");
                }}
                className="px-4 py-2 text-gray-500 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNewCategory}
                className="px-6 py-2 bg-[#345261] text-white rounded-lg font-medium shadow-md hover:bg-[#2a4250] transition-colors"
                disabled={!newCategory.trim()}
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW TAG MODAL */}
      {showTagModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setShowTagModal(false)} />
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl p-6 relative z-10">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Add New Tag</h3>
            <p className="text-xs text-gray-500 mb-4">Enter a new tag name or manage existing tags below.</p>

            <div className="mb-6">
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#345261] outline-none mb-4"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="e.g. React, Nodejs, Design"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleAddNewTag()}
              />

              {/* EXISTING TAGS LIST */}
              <label className="block text-[10px] uppercase tracking-[1.5px] text-gray-500 font-bold mb-3">
                Existing Tags
              </label>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2">
                {availableTags.length > 0 ? (
                  availableTags.map((t, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 text-[#345261] rounded-lg text-xs font-semibold border border-gray-200 group hover:border-[#345261]/30 transition-all"
                    >
                      <span>#{t}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const isInUse = blogs.some(b => b.tags && b.tags.includes(t));
                          if (isInUse) {
                            setToast(`Cannot delete "${t}" because it is used in some blogs.`);
                          } else {
                            setGeneralConfirm({
                              title: "Delete Tag?",
                              message: `Are you sure you want to remove the tag "${t}"?`,
                              onConfirm: () => {
                                setAvailableTags(availableTags.filter(at => at !== t));
                                setTags(tags.filter(st => st !== t));
                                setToast("Tag removed.");
                              }
                            });
                          }
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors p-0.5"
                      >
                        <FaTimes size={10} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-xs italic">No tags created yet.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => {
                  setShowTagModal(false);
                  setNewTag("");
                }}
                className="px-4 py-2 text-gray-500 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNewTag}
                className="px-6 py-2 bg-[#345261] text-white rounded-lg font-medium shadow-md hover:bg-[#2a4250] transition-colors"
                disabled={!newTag.trim()}
              >
                Add Tag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GENERAL CONFIRMATION MODAL */}
      {generalConfirm && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setGeneralConfirm(null)} />
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl relative z-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-50 text-[#345261] rounded-full flex items-center justify-center mb-4">
              <FaTimes size={24} className="opacity-20" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {generalConfirm.title}
            </h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              {generalConfirm.message}
            </p>
            <div className="flex w-full gap-3">
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
      )}
    </div>
  );
}


