import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

const AddBanner = () => {
  const navigate = useNavigate();
  const [title, setTitle]     = useState('');
  const [image, setImage]     = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImage(null);
    setPreview(null);
  };

  const handleSubmit = async () => {
    setError('');
    if (!title.trim()) return setError('Title is required.');
    if (!image)        return setError('Banner image is required.');

    const formData = new FormData();
    formData.append('title',       title.trim());
    formData.append('bannerImage', image);

    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res   = await fetch(`${API_URL}/api/banner/add`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
        body:    formData,
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message || 'Failed to add banner.');
      navigate('/admin/bannerList');
    } catch (err) {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#243746]">Add Banner</h1>
        <p className="text-sm text-gray-500 mt-1">Upload a new homepage banner image</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5 shadow-sm">

        {/* Error */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            {error}
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-[#243746] mb-1">
            Banner Title
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Summer Sale Banner"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00B14F] focus:border-transparent transition"
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-semibold text-[#243746] mb-1">
            Banner Image
          </label>

          {!preview ? (
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#00B14F] hover:bg-[#F0FBF4] transition">
              <Upload size={28} className="text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">Click to upload image</span>
              <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
            </label>
          ) : (
            <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-200">
              <img src={preview} alt="preview" className="w-full h-full object-cover" />
              <button
                onClick={removeImage}
                className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-red-50 transition"
              >
                <X size={16} className="text-red-500" />
              </button>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => navigate('/admin/banner/list')}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-[#00B14F] hover:bg-[#009943] disabled:bg-[#00B14F]/50 text-white text-sm font-semibold transition flex items-center justify-center gap-2"
          >
            {loading && (
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            )}
            {loading ? 'Uploading...' : 'Add Banner'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AddBanner;