import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, ImageOff } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

const BannerList = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fetchBanners = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res   = await fetch(`${API_URL}/api/banner/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setBanners(data.data);
    } catch (err) {
      console.error('Failed to fetch banners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBanners(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this banner?')) return;
    setDeletingId(id);
    try {
      const token = localStorage.getItem('adminToken');
      const res   = await fetch(`${API_URL}/api/banner/${id}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setBanners(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#243746]">Banners</h1>
          <p className="text-sm text-gray-500 mt-1">{banners.length} banner{banners.length !== 1 ? 's' : ''} uploaded</p>
        </div>
        <button
          onClick={() => navigate('/admin/banner')}
          className="flex items-center gap-2 bg-[#00B14F] hover:bg-[#009943] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition"
        >
          <Plus size={16} />
          Add Banner
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-gray-100 rounded-2xl h-52 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && banners.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <ImageOff size={40} className="mb-3" />
          <p className="text-sm font-semibold">No banners yet</p>
          <p className="text-xs mt-1">Click "Add Banner" to upload your first one</p>
        </div>
      )}

      {/* Grid */}
      {!loading && banners.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {banners.map(banner => (
            <div key={banner.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

              {/* Image */}
              <div className="relative h-44">
                <img
                  src={banner.bannerImage}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                />
                {/* Status pill */}
                <span className={`absolute top-2 left-2 text-[11px] font-semibold px-2.5 py-0.5 rounded-full
                  ${banner.status === 'Active'
                    ? 'bg-[#D1F2D8] text-[#00B14F]'
                    : 'bg-gray-100 text-gray-500'}`}>
                  {banner.status}
                </span>
              </div>

              {/* Footer */}
              <div className="px-4 py-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-[#243746] truncate max-w-[160px]">
                  {banner.title}
                </p>
                <button
                  onClick={() => handleDelete(banner.id)}
                  disabled={deletingId === banner.id}
                  className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition disabled:opacity-50"
                >
                  {deletingId === banner.id
                    ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                    : <Trash2 size={16} />
                  }
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default BannerList;