import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

const API_BASE = "http://localhost:5000";

export default function BlogPreview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/blogs/${id}`);
        const data = await res.json();
        setBlog(data);
      } catch (err) {
        console.error("Error fetching blog:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <p className="text-gray-500">Loading blog...</p>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="flex justify-center items-center py-10">
        <p className="text-red-500">Blog not found</p>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center py-10 px-4">
      <div className="w-full max-w-[1020px]">

        {/* BACK BUTTON */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#23414a] font-medium mb-6"
        >
          <FaArrowLeft /> Back
        </button>

        {/* TITLE */}
        <h1 className="text-2xl font-semibold mb-6 text-center">
          {blog.title}
        </h1>

        {/* IMAGE */}
        {blog.image && (
          <img
            src={`${API_BASE}${blog.image}`}
            alt={blog.title}
            className="w-full h-[351px] object-cover rounded mb-6"
          />
        )}

        {/* CONTENT (centered container, auto height) */}
        <div
          className="content-view w-full text-justify"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />
      </div>
    </div>
  );
}
