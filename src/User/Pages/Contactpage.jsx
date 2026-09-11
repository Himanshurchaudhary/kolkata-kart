import { useState, useRef } from "react";

// ─── EmailJS CDN is loaded via index.html or via the script tag below ───────
// To use real email: replace these with your EmailJS credentials
const EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID";   // e.g. "service_abc123"
const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID"; // e.g. "template_xyz456"
const EMAILJS_PUBLIC_KEY = "YOUR_PUBLIC_KEY";   // e.g. "abcDEFghiJKL"

// ─── Inline style for the agent image placeholder ───────────────────────────
const agentBg = {
  background: "linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)",
};

// ─── SVG headset icon used as image placeholder ──────────────────────────────
function AgentIllustration() {
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center rounded-2xl overflow-hidden relative"
      style={agentBg}
    >
      {/* decorative circle */}
      <div className="absolute w-64 h-64 rounded-full bg-white/40 -top-10 -right-10" />
      <div className="absolute w-40 h-40 rounded-full bg-white/30 bottom-4 left-4" />

      {/* agent avatar SVG */}
      <svg viewBox="0 0 200 220" className="w-56 h-56 relative z-10" fill="none">
        {/* body */}
        <ellipse cx="100" cy="195" rx="55" ry="28" fill="#d1d5db" />
        <rect x="62" y="145" width="76" height="60" rx="18" fill="#ffffff" />
        {/* shirt dots */}
        <circle cx="85" cy="165" r="3" fill="#e5e7eb" />
        <circle cx="100" cy="165" r="3" fill="#e5e7eb" />
        <circle cx="115" cy="165" r="3" fill="#e5e7eb" />
        {/* neck */}
        <rect x="88" y="130" width="24" height="20" rx="8" fill="#fcd9bd" />
        {/* head */}
        <ellipse cx="100" cy="110" rx="36" ry="38" fill="#fcd9bd" />
        {/* hair */}
        <ellipse cx="100" cy="82" rx="36" ry="22" fill="#6b4226" />
        <rect x="64" y="82" width="10" height="28" rx="5" fill="#6b4226" />
        <rect x="126" y="82" width="10" height="28" rx="5" fill="#6b4226" />
        {/* eyes */}
        <ellipse cx="88" cy="112" rx="5" ry="5.5" fill="white" />
        <ellipse cx="112" cy="112" rx="5" ry="5.5" fill="white" />
        <circle cx="89" cy="113" r="3" fill="#374151" />
        <circle cx="113" cy="113" r="3" fill="#374151" />
        {/* smile */}
        <path d="M88 126 Q100 135 112 126" stroke="#c97d60" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        {/* headset band */}
        <path d="M64 100 Q64 68 100 68 Q136 68 136 100" stroke="#1f2937" strokeWidth="5" fill="none" strokeLinecap="round" />
        {/* ear cups */}
        <rect x="56" y="98" width="14" height="18" rx="7" fill="#374151" />
        <rect x="130" y="98" width="14" height="18" rx="7" fill="#374151" />
        {/* mic arm */}
        <path d="M130 112 Q148 122 142 135" stroke="#374151" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="142" cy="137" r="4" fill="#22c55e" />
        {/* hands on desk */}
        <ellipse cx="72" cy="200" rx="12" ry="8" fill="#fcd9bd" />
        <ellipse cx="128" cy="200" rx="12" ry="8" fill="#fcd9bd" />
        {/* pen */}
        <rect x="128" y="188" width="3" height="22" rx="1.5" transform="rotate(-20 128 188)" fill="#ef4444" />
      </svg>

      {/* desk / notebook suggestion */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-white/50 rounded-b-2xl flex items-center px-6 gap-3">
        <div className="w-20 h-6 bg-white rounded shadow-sm" />
        <div className="w-8 h-8 rounded bg-green-200" />
      </div>
    </div>
  );
}

// ─── Input component ─────────────────────────────────────────────────────────
function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all bg-white";

// ─── Main ContactPage ────────────────────────────────────────────────────────
export default function ContactPage() {
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState("idle"); // idle | sending | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!form.fullName || !form.phone || !form.subject || !form.message) {
      setErrorMsg("Please fill in all required fields.");
      setStatus("error");
      return;
    }
    setStatus("sending");
    setErrorMsg("");

    try {
      // ── Load EmailJS from CDN if not already loaded ──
      if (!window.emailjs) {
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
          s.onload = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        });
        window.emailjs.init(EMAILJS_PUBLIC_KEY);
      }

      await window.emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          from_name: form.fullName,
          phone: form.phone,
          subject: form.subject,
          message: form.message,
        },
        EMAILJS_PUBLIC_KEY
      );

      setStatus("success");
      setForm({ fullName: "", phone: "", subject: "", message: "" });
    } catch (err) {
      console.error(err);
      // In demo mode (invalid keys), show a friendly success for UI preview
      if (
        EMAILJS_SERVICE_ID === "YOUR_SERVICE_ID" ||
        EMAILJS_PUBLIC_KEY === "YOUR_PUBLIC_KEY"
      ) {
        setStatus("demo");
      } else {
        setErrorMsg("Failed to send message. Please try again.");
        setStatus("error");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-sm px-8 py-10">
        {/* ── Header ── */}
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Can't find the answer you are looking for?
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Our friendly assistant is here to assist you 24 hours a day!
        </p>

        {/* ── Body: form + image ── */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Form ── */}
          <div className="flex-1 flex flex-col gap-5">
            {/* Row 1: Full Name + Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Full Name" required>
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  className={inputClass}
                />
              </Field>
              <Field label="Phone Number" required>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  className={inputClass}
                />
              </Field>
            </div>

            {/* Subject */}
            <Field label="Subject" required>
              <input
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="Enter subject line"
                className={inputClass}
              />
            </Field>

            {/* Message */}
            <Field label="Message" required>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Write your message ..."
                rows={6}
                className={`${inputClass} resize-y`}
              />
            </Field>

            {/* Status messages */}
            {status === "error" && (
              <p className="text-sm text-red-500">{errorMsg}</p>
            )}
            {status === "success" && (
              <p className="text-sm text-green-600 font-medium">
                ✓ Message sent successfully! We'll get back to you soon.
              </p>
            )}
            {status === "demo" && (
              <div className="text-sm bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-yellow-800">
                <p className="font-semibold mb-1">⚠ Demo Mode — Email Not Sent</p>
                <p>
                  Replace <code className="bg-yellow-100 px-1 rounded">YOUR_SERVICE_ID</code>,{" "}
                  <code className="bg-yellow-100 px-1 rounded">YOUR_TEMPLATE_ID</code>, and{" "}
                  <code className="bg-yellow-100 px-1 rounded">YOUR_PUBLIC_KEY</code> at the top
                  of the file with your{" "}
                  <a
                    href="https://www.emailjs.com"
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-yellow-900"
                  >
                    EmailJS
                  </a>{" "}
                  credentials to enable real email delivery.
                </p>
              </div>
            )}

            {/* Send button */}
            <div>
              <button
                onClick={handleSubmit}
                disabled={status === "sending"}
                className="bg-green-500 hover:bg-green-600 active:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold px-8 py-3 rounded-lg transition-colors duration-200 cursor-pointer"
              >
                {status === "sending" ? "Sending…" : "Send"}
              </button>
            </div>
          </div>

          {/* ── Agent image ── */}
          <div className="hidden lg:block w-80 h-auto min-h-72 flex-shrink-0">
            <AgentIllustration />
          </div>
        </div>
      </div>
    </div>
  );
}