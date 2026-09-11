import { useState } from "react";

const sections = [
  {
    id: "information",
    icon: "🗂️",
    title: "Information We Collect",
    content: [
      {
        subtitle: "Personal Information",
        text: "When you create an account or place an order on Gramin Cart, we collect your name, email address, phone number, and delivery address to process and fulfill your orders.",
      },
      {
        subtitle: "Usage Data",
        text: "We automatically collect information about how you interact with our platform — including pages visited, items viewed, search queries, and device/browser details — to improve your shopping experience.",
      },
      {
        subtitle: "Payment Information",
        text: "Payment transactions are processed through secure, encrypted third-party gateways. Gramin Cart does not store your full card details on our servers.",
      },
    ],
  },
  {
    id: "usage",
    icon: "⚙️",
    title: "How We Use Your Information",
    content: [
      {
        subtitle: "Order Processing",
        text: "Your personal data is used to confirm, process, and deliver your grocery orders and to communicate updates regarding your purchases.",
      },
      {
        subtitle: "Personalization",
        text: "We use your browsing and purchase history to recommend products and offers that match your preferences and local needs.",
      },
      {
        subtitle: "Service Improvement",
        text: "Aggregate usage data helps us improve our platform, add new features, and ensure a smooth, reliable experience for all customers.",
      },
    ],
  },
  {
    id: "sharing",
    icon: "🤝",
    title: "Information Sharing",
    content: [
      {
        subtitle: "Delivery Partners",
        text: "We share your name, address, and contact number with our delivery partners solely to fulfill your orders. They are not permitted to use this data for any other purpose.",
      },
      {
        subtitle: "No Third-Party Selling",
        text: "Gramin Cart does not sell, rent, or trade your personal information to any third-party marketers or advertisers.",
      },
      {
        subtitle: "Legal Obligations",
        text: "We may disclose your information if required by law, court order, or to protect the rights and safety of Gramin Cart, our users, or the public.",
      },
    ],
  },
  {
    id: "security",
    icon: "🔒",
    title: "Data Security",
    content: [
      {
        subtitle: "Encryption",
        text: "All data transmitted between your device and our servers is protected using industry-standard SSL/TLS encryption to prevent unauthorized access.",
      },
      {
        subtitle: "Access Control",
        text: "Only authorized Gramin Cart personnel have access to your personal data, and only to the extent necessary to perform their duties.",
      },
      {
        subtitle: "Breach Response",
        text: "In the unlikely event of a data breach, we will notify affected users promptly and take immediate steps to mitigate any harm.",
      },
    ],
  },
  {
    id: "rights",
    icon: "✋",
    title: "Your Rights",
    content: [
      {
        subtitle: "Access & Correction",
        text: "You have the right to access the personal information we hold about you and to request corrections if any details are inaccurate or incomplete.",
      },
      {
        subtitle: "Deletion",
        text: "You may request the deletion of your account and associated data at any time by contacting our support team at graminkartdc@gmail.com.",
      },
      {
        subtitle: "Opt-Out",
        text: "You can opt out of promotional emails and notifications at any time via your account settings or by clicking the unsubscribe link in any marketing email.",
      },
    ],
  },
  {
    id: "cookies",
    icon: "🍪",
    title: "Cookies & Tracking",
    content: [
      {
        subtitle: "Essential Cookies",
        text: "We use essential cookies to keep you logged in and remember your cart. These are required for the platform to function correctly.",
      },
      {
        subtitle: "Analytics Cookies",
        text: "Analytics cookies help us understand how users navigate our site so we can improve performance and usability. You may disable these in your browser settings.",
      },
      {
        subtitle: "Marketing Cookies",
        text: "We may use marketing cookies to show you relevant offers. You can manage your cookie preferences at any time through the cookie settings panel.",
      },
    ],
  },
  {
    id: "children",
    icon: "👶",
    title: "Children's Privacy",
    content: [
      {
        subtitle: "Age Restriction",
        text: "Gramin Cart is not directed at children under the age of 13. We do not knowingly collect personal information from children.",
      },
      {
        subtitle: "Parental Action",
        text: "If you believe your child has provided us with personal data, please contact us immediately and we will delete it from our systems.",
      },
    ],
  },
  {
    id: "updates",
    icon: "📋",
    title: "Policy Updates",
    content: [
      {
        subtitle: "Changes",
        text: "We may update this Privacy Policy from time to time to reflect changes in our practices or applicable laws. The updated policy will be posted on this page with a revised date.",
      },
      {
        subtitle: "Notification",
        text: "For significant changes, we will notify registered users via email or a prominent notice on our platform before the changes take effect.",
      },
    ],
  },
];

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState(null);

  return (
    <div className="min-h-screen bg-[#FAFAF7] font-sans">
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

        * { box-sizing: border-box; }
        body { margin: 0; }

        .hero-bg {
          background: radial-gradient(ellipse at 60% 40%, #4cdb65 0%, #22c55e 30%, #16a34a 60%, #15803d 100%);
          position: relative;
          overflow: hidden;
        }
        .hero-bg::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 30% 60%, rgba(255,255,255,0.13) 0%, transparent 55%),
                      radial-gradient(ellipse at 80% 10%, rgba(255,255,255,0.07) 0%, transparent 40%);
        }
        .leaf-pattern {
          position: absolute;
          left: -30px;
          top: 50%;
          transform: translateY(-50%);
          width: 180px;
          height: 260px;
          opacity: 0.13;
          background: linear-gradient(160deg, #bbf7d0, transparent 70%);
          border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
        }
        .leaf-pattern2 {
          position: absolute;
          right: -20px;
          bottom: -40px;
          width: 300px;
          height: 300px;
          opacity: 0.08;
          background: radial-gradient(circle, #d4edda 30%, transparent 70%);
          border-radius: 50%;
        }
        .section-card {
          transition: box-shadow 0.25s ease, transform 0.2s ease;
          cursor: pointer;
        }
        .section-card:hover {
          box-shadow: 0 8px 32px rgba(45, 106, 79, 0.12);
          transform: translateY(-2px);
        }
        .section-card.active {
          border-color: #2d6a4f !important;
          box-shadow: 0 8px 32px rgba(45, 106, 79, 0.18);
        }
        .content-reveal {
          animation: slideDown 0.3s ease;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .badge {
          background: rgba(255,255,255,0.18);
          border: 1px solid rgba(255,255,255,0.35);
          color: #ffffff;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          font-size: 11px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }
        .divider {
          background: linear-gradient(to right, #2d6a4f, #52b788, transparent);
        }
        .toc-link {
          transition: color 0.2s, padding-left 0.2s;
          text-decoration: none;
          color: #4a7c59;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
        }
        .toc-link:hover {
          color: #1a4731;
          padding-left: 4px;
        }
        .contact-box {
          background: radial-gradient(ellipse at 60% 40%, #4cdb65 0%, #22c55e 30%, #16a34a 60%, #15803d 100%);
          position: relative;
          overflow: hidden;
        }
        .contact-box::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 20% 60%, rgba(255,255,255,0.13) 0%, transparent 55%),
                      radial-gradient(ellipse at 85% 10%, rgba(255,255,255,0.07) 0%, transparent 40%);
          pointer-events: none;
        }
        .contact-watermark {
          position: absolute;
          right: 24px;
          top: 50%;
          transform: translateY(-50%);
          font-family: 'DM Sans', sans-serif;
          font-weight: 900;
          font-size: 5rem;
          color: rgba(255,255,255,0.08);
          line-height: 1;
          letter-spacing: -4px;
          user-select: none;
          pointer-events: none;
        }
      `}</style>

      {/* Hero Header */}
      <div className="hero-bg relative px-6 py-16 md:py-24">
        <div className="leaf-pattern"></div>
        <div className="leaf-pattern2"></div>
        {/* Watermark logo - top left like screenshot */}
        <div style={{
          position: "absolute", left: "24px", top: "50%", transform: "translateY(-50%)",
          fontFamily: "'DM Sans', sans-serif", fontWeight: 900, fontSize: "5rem",
          color: "rgba(255,255,255,0.1)", lineHeight: 1, letterSpacing: "-4px",
          userSelect: "none", pointerEvents: "none"
        }}>
          GK
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <span className="badge inline-block px-4 py-1.5 rounded-full mb-6">
            🌿 Gramin Cart — Est. 2026
          </span>
          <h1
            className="mb-4"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "clamp(2.4rem, 5vw, 4rem)",
              fontWeight: 800,
              lineHeight: 1.12,
              letterSpacing: "-0.5px",
              color: "#ffffff",
            }}
          >
            Privacy{" "}
            <span style={{ color: "#facc15" }}>Policy</span>
          </h1>
          <p
            className="max-w-xl mx-auto"
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "1.05rem", lineHeight: 1.7, color: "rgba(255,255,255,0.85)" }}
          >
            At Gramin Cart, your trust is our harvest. We are transparent about how
            we collect, use, and protect your personal information.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm" style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.7)" }}>
            <span>📅 Effective: January 1, 2026</span>
            <span className="opacity-40">|</span>
            <span>📅 Last Updated: June 2026</span>
            <span className="opacity-40">|</span>
            <span>📍 India</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* Sidebar TOC */}
          <aside className="lg:w-56 shrink-0">
            <div className="sticky top-8">
              <p
                className="text-xs uppercase tracking-widest text-gray-400 mb-3"
                style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}
              >
                Contents
              </p>
              <nav className="flex flex-col gap-2">
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="toc-link"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveSection(activeSection === s.id ? null : s.id);
                      document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                  >
                    {s.icon} {s.title}
                  </a>
                ))}
              </nav>
              <div className="mt-8 p-4 rounded-xl bg-green-50 border border-green-100">
                <p className="text-xs text-green-800" style={{ fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
                  Questions? Contact us at<br />
                  <a href="mailto:graminkartdc@gmail.com" className="font-semibold underline">graminkartdc@gmail.com</a>
                </p>
              </div>
            </div>
          </aside>

          {/* Sections */}
          <div className="flex-1 flex flex-col gap-4">
            {/* Intro */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <p
                className="text-gray-600"
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.97rem", lineHeight: 1.8 }}
              >
                This Privacy Policy explains how <strong className="text-[#1a4731]">Gramin Cart</strong> ("we", "our", or "us") collects,
                uses, shares, and protects information obtained from users ("you") of our website and mobile application.
                By using Gramin Cart, you agree to the practices described in this policy.
                This policy applies to all services offered by Gramin Cart in India since our founding in 2026.
              </p>
            </div>

            {/* Accordion Sections */}
            {sections.map((section, idx) => (
              <div
                key={section.id}
                id={section.id}
                className={`section-card bg-white rounded-2xl border overflow-hidden ${
                  activeSection === section.id ? "active border-[#2d6a4f]" : "border-gray-100"
                }`}
                onClick={() =>
                  setActiveSection(activeSection === section.id ? null : section.id)
                }
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center text-lg shrink-0"
                    >
                      {section.icon}
                    </span>
                    <h2
                      className="text-gray-900"
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: "1.1rem",
                        fontWeight: 700,
                      }}
                    >
                      {idx + 1}. {section.title}
                    </h2>
                  </div>
                  <span
                    className="text-[#2d6a4f] text-xl transition-transform duration-200"
                    style={{
                      transform: activeSection === section.id ? "rotate(45deg)" : "rotate(0deg)",
                      display: "inline-block",
                    }}
                  >
                    +
                  </span>
                </div>

                {/* Expanded Content */}
                {activeSection === section.id && (
                  <div className="content-reveal px-6 pb-6">
                    <div className="divider h-px mb-5" />
                    <div className="flex flex-col gap-4">
                      {section.content.map((item, i) => (
                        <div key={i}>
                          <h3
                            className="text-[#1a4731] mb-1"
                            style={{
                              fontFamily: "'DM Sans', sans-serif",
                              fontWeight: 600,
                              fontSize: "0.9rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                          >
                            {item.subtitle}
                          </h3>
                          <p
                            className="text-gray-600"
                            style={{
                              fontFamily: "'DM Sans', sans-serif",
                              fontSize: "0.95rem",
                              lineHeight: 1.75,
                            }}
                          >
                            {item.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Contact Box */}
            <div className="contact-box rounded-2xl p-8 text-white mt-2">
              <div className="contact-watermark">GK</div>
              <div className="relative z-10">
                <span className="badge inline-block px-4 py-1.5 rounded-full mb-4 text-xs" style={{ letterSpacing: "1.5px" }}>
                  📬 GET IN TOUCH
                </span>
                <h2
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "1.6rem", fontWeight: 800, lineHeight: 1.2 }}
                  className="mb-2"
                >
                  Have questions or{" "}
                  <span style={{ color: "#facc15" }}>concerns?</span>
                </h2>
                <p
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", lineHeight: 1.7, color: "rgba(255,255,255,0.85)" }}
                  className="mb-5 max-w-md"
                >
                  Our dedicated privacy team is here to help. Reach out and we'll
                  respond within 2 business days.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="mailto:graminkartdc@gmail.com"
                    className="bg-white text-[#15803d] px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-yellow-50 transition-colors"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    📧 graminkartdc@gmail.com
                  </a>
                  <a
                    href="tel:+911800000000"
                    className="border border-white/30 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
                    style={{ fontFamily: "'DM Sans', sans-serif", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    📞 80830 42829
                  </a>
                </div>
              </div>
            </div>

            {/* Footer Note */}
        
          </div>
        </div>
      </div>
    </div>
  );
}