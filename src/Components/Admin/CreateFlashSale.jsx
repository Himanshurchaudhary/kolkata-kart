import { useState, useRef } from "react";
const API_BASEA = import.meta.env.VITE_API_URL;

const BASE_URL = `${API_BASEA}/api/flash`; // Update this to your actual API base URL

export default function CreateFlashSale() {
  const [form, setForm] = useState({
    name: "",
    minDiscount: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    description: "",
  });

  // Desktop banner state
  const [desktopFile, setDesktopFile] = useState(null);
  const [desktopPreview, setDesktopPreview] = useState(null);
  const desktopInputRef = useRef(null);

  // Mobile banner state
  const [mobileFile, setMobileFile] = useState(null);
  const [mobilePreview, setMobilePreview] = useState(null);
  const mobileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isVideoFile = (file) => !!file?.type?.startsWith("video/");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  // ── Generic media handlers (image or video) ──
  const handleMediaChange = (e, setFile, setPreview) => {
    const file = e.target.files[0];
    if (!file) return;
    const okType = file.type.startsWith("image/") || file.type.startsWith("video/");
    if (!okType) {
      setError("Please select a valid image or video file.");
      return;
    }
    setFile(file);
    setPreview(URL.createObjectURL(file));
    setError("");
  };

  const handleMediaDrop = (e, setFile, setPreview) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const okType = file.type.startsWith("image/") || file.type.startsWith("video/");
    if (!okType) {
      setError("Please drop a valid image or video file.");
      return;
    }
    setFile(file);
    setPreview(URL.createObjectURL(file));
    setError("");
  };

  const removeDesktopMedia = () => {
    setDesktopFile(null);
    setDesktopPreview(null);
    if (desktopInputRef.current) desktopInputRef.current.value = "";
  };

  const removeMobileMedia = () => {
    setMobileFile(null);
    setMobilePreview(null);
    if (mobileInputRef.current) mobileInputRef.current.value = "";
  };

  const validate = () => {
    const { name, minDiscount, startDate, startTime, endDate, endTime, description } = form;
    if (!name.trim()) return "Name is required.";
    if (!minDiscount || isNaN(minDiscount) || Number(minDiscount) < 0 || Number(minDiscount) > 100)
      return "Minimum Discount must be a number between 0 and 100.";
    if (!startDate) return "Start Date is required.";
    if (!startTime) return "Start Time is required.";
    if (!endDate) return "End Date is required.";
    if (!endTime) return "End Time is required.";
    if (new Date(`${endDate}T${endTime}`) <= new Date(`${startDate}T${startTime}`))
      return "End date/time must be after start date/time.";
    if (!description.trim()) return "Description is required.";
    if (!desktopFile) return "Desktop Banner (image or video) is required.";
    if (!mobileFile) return "Mobile Banner (image or video) is required.";
    return null;
  };

  const getToken = () => localStorage.getItem("adminToken") || "";

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("minDiscount", form.minDiscount);
      formData.append("startDate", form.startDate);
      formData.append("startTime", form.startTime);
      formData.append("endDate", form.endDate);
      formData.append("endTime", form.endTime);
      formData.append("description", form.description);
      formData.append("desktopMedia", desktopFile);
      formData.append("mobileMedia", mobileFile);

      const res = await fetch(`${BASE_URL}/add`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create flash sale.");
      }

      setSuccess("Flash Sale created successfully!");
      setForm({
        name: "",
        minDiscount: "",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        description: "",
      });
      removeDesktopMedia();
      removeMobileMedia();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setForm({
      name: "",
      minDiscount: "",
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      description: "",
    });
    removeDesktopMedia();
    removeMobileMedia();
    setError("");
    setSuccess("");
  };

  const inputClass =
    "w-full border border-gray-200 rounded-lg px-3.5 sm:px-4 py-2.5 text-base sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition bg-white";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";
  const requiredStar = <span className="text-red-500 ml-0.5">*</span>;

  // ── Reusable media upload box (image OR video) ──
  const MediaUploadBox = ({
    label,
    hint,
    preview,
    file,
    inputRef,
    onChange,
    onDrop,
    onRemove,
    height = "h-40 sm:h-44",
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{" "}
        {hint && (
          <span className="text-blue-500 font-normal block sm:inline text-xs sm:text-sm">
            {hint}
          </span>
        )}{" "}
        {requiredStar}
      </label>

      <div
        onClick={() => inputRef.current.click()}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className={`w-full ${height} border-2 border-dashed border-gray-300 rounded-xl overflow-hidden cursor-pointer active:bg-green-50 hover:border-green-400 hover:bg-green-50 transition flex items-center justify-center bg-gray-100 group relative`}
      >
        {preview ? (
          isVideoFile(file) ? (
            <video
              src={preview}
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          )
        ) : (
          <div className="flex flex-col items-center text-gray-400 group-hover:text-green-500 transition select-none px-4 text-center">
            <svg className="w-10 h-10 sm:w-12 sm:h-12 mb-2 opacity-60" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
            </svg>
            <span className="text-xs">Tap or drag to upload image/video</span>
          </div>
        )}

        {preview && isVideoFile(file) && (
          <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded">
            VIDEO
          </span>
        )}
      </div>

      {preview && (
        <button
          type="button"
          onClick={onRemove}
          className="mt-2 text-xs text-red-500 hover:underline w-full text-center py-1"
        >
          Remove
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        onChange={onChange}
        className="hidden"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-28 sm:pb-10">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6 sm:mb-8">
          <span className="text-yellow-500 text-xl sm:text-2xl">⚡</span>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Create New FlashSale</h1>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-5 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            <span className="mt-0.5">⚠️</span>
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-5 flex items-start gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
            <span className="mt-0.5">✅</span>
            <span>{success}</span>
          </div>
        )}

        {/* Form Layout */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          {/* Media uploads move above fields on mobile so they don't get buried */}
          <div className="w-full md:w-60 md:flex-shrink-0 md:order-2 space-y-5">
            <MediaUploadBox
              label="Desktop Banner"
              hint="Recommended: 1600 × 550 px — image or video"
              preview={desktopPreview}
              file={desktopFile}
              inputRef={desktopInputRef}
              onChange={(e) => handleMediaChange(e, setDesktopFile, setDesktopPreview)}
              onDrop={(e) => handleMediaDrop(e, setDesktopFile, setDesktopPreview)}
              onRemove={removeDesktopMedia}
            />

            <MediaUploadBox
              label="Mobile Banner"
              hint="Recommended: 600 × 400 px — image or video"
              preview={mobilePreview}
              file={mobileFile}
              inputRef={mobileInputRef}
              onChange={(e) => handleMediaChange(e, setMobileFile, setMobilePreview)}
              onDrop={(e) => handleMediaDrop(e, setMobileFile, setMobilePreview)}
              onRemove={removeMobileMedia}
            />
          </div>

          {/* Left: Fields */}
          <div className="flex-1 space-y-5 md:order-1">
            {/* Name */}
            <div>
              <label className={labelClass}>Name {requiredStar}</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter name"
                className={inputClass}
              />
            </div>

            {/* Minimum Discount */}
            <div>
              <label className={labelClass}>Minimum Discount {requiredStar}</label>
              <input
                type="number"
                name="minDiscount"
                value={form.minDiscount}
                onChange={handleChange}
                placeholder="Enter discount (e.g. 20)"
                min="0"
                max="100"
                inputMode="numeric"
                className={inputClass}
              />
            </div>

            {/* Start Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Start Date {requiredStar}</label>
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Start Time {requiredStar}</label>
                <input
                  type="time"
                  name="startTime"
                  value={form.startTime}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>

            {/* End Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>End Date {requiredStar}</label>
                <input
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>End Time {requiredStar}</label>
                <input
                  type="time"
                  name="endTime"
                  value={form.endTime}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className={labelClass}>Description {requiredStar}</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Enter short description"
                rows={4}
                className={`${inputClass} resize-y`}
              />
            </div>
          </div>
        </div>

        {/* Footer Buttons: fixed to bottom on mobile so they're always reachable, inline on desktop */}
        <div className="fixed sm:static bottom-0 left-0 right-0 sm:mt-10 sm:pt-6 sm:border-t border-gray-200 bg-white sm:bg-transparent px-4 sm:px-0 py-3 sm:py-0 shadow-[0_-2px_8px_rgba(0,0,0,0.06)] sm:shadow-none flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 z-10">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3 sm:py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3 sm:py-2.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Submitting...
              </>
            ) : (
              "Submit"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}