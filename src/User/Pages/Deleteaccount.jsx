import { useState } from "react";

const sections = [
  {
    id: "overview",
    title: "Overview",
    content: `Gramin Cart respects your right to control your personal data. If you wish to delete your Gramin Cart account and associated data, you can request deletion at any time using the process outlined below.

Once we receive your request, we will process it within 7 business days and confirm via email once your account and data have been deleted.`,
  },
  {
    id: "how-to-request",
    title: "How to Request Account Deletion",
    content: `To request deletion of your Gramin Cart account, please follow these steps:

1. Send an email to  graminkartdc@gmail.com from your registered email address, or mention your registered phone number in the email.
2. Use the subject line: "Account Deletion Request"
3. Include your full name and registered mobile number for verification purposes.
4. Our support team will verify your identity and process the request within 7 business days.

Alternatively, you can call our support line at 80830 42829 (Toll Free) during support hours to initiate the request.`,
  },
  {
    id: "data-deleted",
    title: "What Data Will Be Deleted",
    content: `Upon successful verification of your request, the following data associated with your account will be permanently deleted:

• Your profile information (name, email address, phone number)
• Saved delivery addresses
• Account credentials and login information
• Saved preferences and app settings
• Wishlist and cart data`,
  },
  {
    id: "data-retained",
    title: "What Data May Be Retained",
    content: `In certain cases, we may be required to retain some information even after account deletion, in accordance with applicable laws and for legitimate business purposes:

• Order history and transaction records may be retained for up to 90 days for accounting, tax, and legal compliance purposes, after which they will be permanently deleted.
• Information necessary to resolve disputes, enforce our agreements, or comply with legal obligations may be retained for the period required by law.

Once the applicable retention period has passed, this data will be permanently and irreversibly deleted from our systems.`,
  },
  {
    id: "contact",
    title: "Contact Us",
    content: `If you have any questions about the account deletion process, please reach out to us:

Email: graminkartdc@gmail.com
Phone:  8083042829
Address: Floor No.: GROUND FLOOR Building No./Flat No.: C/O USHA DEVI Name Of Premises/Building: NA Road/Street: BAIKUNTHPUR Nearby Landmark: Usribazar Branch Post Office Locality/Sub Locality: BAIKUNTHPUR City/Town/Village: Usri District: Gopalganj State: Bihar PIN Code: 841409
Support Hours: Monday – Saturday, 9:00 AM – 6:00 PM IST`,
  },
];

export default function DeleteAccount() {
  const [activeId, setActiveId] = useState("overview");

  const handleScroll = (id) => {
    setActiveId(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const gradientStyle = {
    background:
      "radial-gradient(ellipse at 60% 40%, #4cdb65 0%, #22c55e 30%, #16a34a 60%, #15803d 100%)",
    position: "relative",
    overflow: "hidden",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .gk-font { font-family: 'DM Sans', sans-serif; }

        .hero-overlay::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 25% 60%, rgba(255,255,255,0.13) 0%, transparent 55%),
            radial-gradient(ellipse at 80% 10%, rgba(255,255,255,0.07) 0%, transparent 40%);
          pointer-events: none;
        }

        .gk-pill {
          background: rgba(255,255,255,0.18);
          border: 1px solid rgba(255,255,255,0.35);
          backdrop-filter: blur(4px);
        }

        .watermark {
          position: absolute;
          font-family: 'DM Sans', sans-serif;
          font-weight: 900;
          font-size: 6rem;
          color: rgba(255,255,255,0.08);
          line-height: 1;
          letter-spacing: -4px;
          user-select: none;
          pointer-events: none;
        }

        .sidebar-btn-active {
          background-color: #dcfce7;
          color: #15803d;
          font-weight: 700;
        }
        .sidebar-btn-inactive {
          color: #6b7280;
        }
        .sidebar-btn-inactive:hover {
          background-color: #f0fdf4;
          color: #15803d;
        }
      `}</style>

      {/* ── HERO ── */}
      <div className="w-full py-16 px-4 text-center hero-overlay gk-font" style={gradientStyle}>
        {/* Watermarks */}
        <span className="watermark" style={{ left: "24px", top: "50%", transform: "translateY(-50%)" }}>GK</span>
        <span className="watermark" style={{ right: "24px", bottom: "-10px" }}>GC</span>

        {/* Brand pill */}
        <div className="relative z-10 inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 gk-pill">
          <span className="text-sm">🌿</span>
          <span className="text-xs font-semibold tracking-widest uppercase text-white">
            Gramin Cart · Est. 2026
          </span>
        </div>

        <h1 className="relative z-10 text-4xl md:text-5xl font-bold text-white mb-4 gk-font">
          Delete Your{" "}
          <span style={{ color: "#facc15" }}>Account</span>
        </h1>
        <p className="relative z-10 text-sm md:text-base max-w-lg mx-auto leading-relaxed gk-font" style={{ color: "rgba(255,255,255,0.85)" }}>
          We're sorry to see you go. Here's how you can request deletion of your Gramin Cart account and data.
        </p>

        {/* Meta badges */}
        <div className="relative z-10 flex flex-wrap justify-center gap-6 mt-8 gk-font">
          {["📅 Effective: January 1, 2026", "📅 Last Updated: July 2026", "📄 Version 1.0"].map((text) => (
            <div key={text} className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.75)" }}>
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col lg:flex-row gap-8 gk-font">

        {/* Sidebar */}
        <aside className="lg:w-60 shrink-0">
          <div className="lg:sticky lg:top-6 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
            {/* Sidebar header */}
            <div
              className="px-4 py-3"
              style={{
                background: "radial-gradient(ellipse at 70% 50%, #22c55e 0%, #15803d 100%)",
              }}
            >
              <p className="text-xs font-bold tracking-widest uppercase text-white">
                Table of Contents
              </p>
            </div>
            {/* Sidebar links */}
            <div className="bg-white p-2">
              {sections.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => handleScroll(s.id)}
                  className={`w-full text-left rounded-lg px-3 py-2 mb-0.5 text-xs leading-snug transition-colors ${
                    activeId === s.id ? "sidebar-btn-active" : "sidebar-btn-inactive"
                  }`}
                >
                  {i + 1}. {s.title}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">

          {/* Warning banner */}
          <div className="rounded-2xl p-4 mb-8 flex gap-3" style={{ backgroundColor: "#fffbeb", border: "1px solid #fcd34d" }}>
            <span className="text-xl shrink-0 mt-0.5">⚠️</span>
            <p className="text-sm leading-relaxed" style={{ color: "#92400e" }}>
              Account deletion is permanent and cannot be undone. Please make sure you no longer need your order history, saved addresses, or other account data before proceeding. Questions? Email{" "}
              <strong>graminkartdc@gmail.com</strong>
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-4">
            {sections.map((section, index) => (
              <div
                key={section.id}
                id={section.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden scroll-mt-6"
                style={{ transition: "box-shadow 0.2s" }}
              >
                {/* Card header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white"
                    style={{ background: "radial-gradient(ellipse at 60% 40%, #22c55e 0%, #15803d 100%)" }}
                  >
                    {index + 1}
                  </span>
                  <h2 className="font-bold text-gray-900 text-base">{section.title}</h2>
                </div>

                {/* Card body */}
                <div className="px-5 py-4">
                  {section.content.split("\n\n").map((para, i) => (
                    <p key={i} className="text-sm text-gray-600 leading-relaxed mb-3 last:mb-0 whitespace-pre-line">
                      {para}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer CTA */}
          <div
            className="mt-10 rounded-2xl p-8 text-center hero-overlay"
            style={gradientStyle}
          >
            {/* Watermark */}
            <span className="watermark" style={{ right: "20px", bottom: "-10px", fontSize: "5rem" }}>GK</span>

            <div className="relative z-10">
              {/* Pill */}
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-4 gk-pill">
                <span className="text-sm">🌾</span>
                <span className="text-xs font-semibold tracking-widest uppercase text-white">
                  Need Help Instead?
                </span>
              </div>

              <h3 className="font-bold text-2xl mb-2 gk-font" style={{ color: "#ffffff" }}>
                We'd love to{" "}
                <span style={{ color: "#facc15" }}>keep you</span>
              </h3>
              <p className="text-sm max-w-md mx-auto leading-relaxed mb-6 gk-font" style={{ color: "rgba(255,255,255,0.85)" }}>
                If you're facing an issue with your account or orders, our support team is happy to help before you decide to delete your account.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <a
                  href="mailto:graminkartdc@gmail.com"
                  className="bg-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors hover:bg-yellow-50 gk-font"
                  style={{ color: "#15803d" }}
                >
                  📧 graminkartdc@gmail.com
                </a>
                <a
                  href="tel:+911800000000"
                  className="border text-white font-semibold text-sm px-5 py-2.5 rounded-xl gk-font"
                  style={{ borderColor: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)" }}
                >
                  📞 80830 42829
                </a>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}