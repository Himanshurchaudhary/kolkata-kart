import { useState } from "react";

const sections = [
  {
    id: "acceptance",
    title: "Acceptance of Terms",
    content: `By accessing or using Kolkata Kart's website, mobile application, or any of our services, you confirm that you have read, understood, and agree to be bound by these Terms & Conditions. If you do not agree, please discontinue use of our platform immediately.

These terms apply to all visitors, users, and customers of Kolkata Kart. We reserve the right to update these terms at any time, and continued use of the platform constitutes acceptance of any revised terms.`,
  },
  {
    id: "about",
    title: "About Kolkata Kart",
    content: `Kolkata Kart is an online grocery platform dedicated to connecting local vendors, fishermen, and small farmers from North 24 Parganas and across West Bengal with families seeking fresh, affordable, and quality groceries.

Our mission is to support the local economy of Kolkata and its surrounding areas while delivering daily essentials directly to your doorstep. Kolkata Kart operates as an e-commerce marketplace facilitating transactions between buyers and registered sellers.`,
  },
  {
    id: "eligibility",
    title: "Eligibility & Account",
    content: `To use Kolkata Kart, you must be at least 18 years of age or have parental/guardian consent. By creating an account, you represent that all information provided is accurate, current, and complete.

You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account. Kolkata Kart shall not be liable for any losses arising from unauthorized account access due to your failure to safeguard login information.`,
  },
  {
    id: "orders",
    title: "Orders & Payments",
    content: `All orders placed on Kolkata Kart are subject to availability and confirmation. We reserve the right to cancel or refuse any order at our discretion, including cases of suspected fraud, inaccurate product information, or pricing errors.

Payments must be made through our supported payment methods including UPI, credit/debit cards, net banking, and cash on delivery (where available). Prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise.`,
  },
  {
    id: "delivery",
    title: "Delivery Policy",
    content: `Kolkata Kart strives to deliver your orders within the estimated timeframe shown at checkout. Delivery timelines may vary based on your location, product availability, and external factors such as weather or public holidays.

We currently serve select areas across Kolkata and North 24 Parganas. Delivery charges, if applicable, will be clearly displayed before order confirmation. Risk of loss and title for products pass to you upon delivery.`,
  },
  {
    id: "returns",
    title: "Returns & Refunds",
    content: `We want you to be satisfied with every purchase. If you receive a damaged, defective, or incorrect item, please report it within 24 hours of delivery through our app or customer support.

Perishable items (fresh produce, fish, dairy, etc.) are not eligible for return unless they arrive in a damaged or spoiled condition. Refunds, where approved, will be processed to the original payment method within 5–7 business days.`,
  },
  {
    id: "prohibited",
    title: "Prohibited Activities",
    content: `Users must not engage in any activity that disrupts, damages, or impairs the platform. This includes but is not limited to: placing fraudulent orders, scraping or harvesting data without authorization, impersonating other users or Kolkata Kart staff, uploading malicious content, or attempting to gain unauthorized access to our systems.

Violation of these prohibitions may result in immediate account suspension and legal action where applicable.`,
  },
  {
    id: "ip",
    title: "Intellectual Property",
    content: `All content on the Kolkata Kart platform — including logos, text, images, graphics, and software — is the exclusive property of Kolkata Kart or its licensors and is protected under applicable intellectual property laws.

You may not reproduce, distribute, modify, or create derivative works from any content on our platform without prior written permission from Kolkata Kart.`,
  },
  {
    id: "privacy",
    title: "Privacy & Data",
    content: `Your privacy matters to us. Kolkata Kart collects and processes personal data in accordance with our Privacy Policy. By using our platform, you consent to the collection and use of your data as described therein.

We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.`,
  },
  {
    id: "liability",
    title: "Limitation of Liability",
    content: `To the maximum extent permitted by law, Kolkata Kart shall not be liable for any indirect, incidental, special, or consequential damages arising out of your use of or inability to use our platform or services.

Our total liability for any claim arising in connection with these terms shall not exceed the amount paid by you for the specific order giving rise to the claim.`,
  },
  {
    id: "governing",
    title: "Governing Law",
    content: `These Terms & Conditions shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with these terms shall be subject to the exclusive jurisdiction of the courts located in Barasat, West Bengal.

If any provision of these terms is found to be unenforceable, the remaining provisions shall continue in full force and effect.`,
  },
  {
    id: "contact",
    title: "Contact Us",
    content: `If you have any questions, concerns, or feedback regarding these Terms & Conditions, please reach out to us:

Email: support@kolkata.in
Phone: +91 96798 52485
Address: Geram Manjurhati, Post Chakla, Thana Deganga, Mahakuma Barasat, District North 24 Parganas, Pin Code: 743424
Support Hours: Monday – Saturday, 9:00 AM – 6:00 PM IST`,
  },
];

export default function TermsAndConditions() {
  const [activeId, setActiveId] = useState("acceptance");

  const handleScroll = (id) => {
    setActiveId(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const gradientStyle = {
    background:
      "radial-gradient(ellipse at 60% 40%, #38bdf8 0%, #0ea5e9 30%, #0284c7 60%, #0369a1 100%)",
    position: "relative",
    overflow: "hidden",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .kk-font { font-family: 'DM Sans', sans-serif; }

        .hero-overlay::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 25% 60%, rgba(255,255,255,0.13) 0%, transparent 55%),
            radial-gradient(ellipse at 80% 10%, rgba(255,255,255,0.07) 0%, transparent 40%);
          pointer-events: none;
        }

        .kk-pill {
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
          background-color: #dbeafe;
          color: #1d4ed8;
          font-weight: 700;
        }
        .sidebar-btn-inactive {
          color: #6b7280;
        }
        .sidebar-btn-inactive:hover {
          background-color: #eff6ff;
          color: #1d4ed8;
        }
      `}</style>

      {/* ── HERO ── */}
      <div className="w-full py-16 px-4 text-center hero-overlay kk-font" style={gradientStyle}>
        {/* Watermarks */}
        <span className="watermark" style={{ left: "24px", top: "50%", transform: "translateY(-50%)" }}>KK</span>
        <span className="watermark" style={{ right: "24px", bottom: "-10px" }}>KC</span>

        {/* Brand pill */}
        <div className="relative z-10 inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 kk-pill">
          <span className="text-sm">🛒</span>
          <span className="text-xs font-semibold tracking-widest uppercase text-white">
            Kolkata Kart · Est. 2025
          </span>
        </div>

        <h1 className="relative z-10 text-4xl md:text-5xl font-bold text-white mb-4 kk-font">
          Terms &amp;{" "}
          <span style={{ color: "#facc15" }}>Conditions</span>
        </h1>
        <p className="relative z-10 text-sm md:text-base max-w-lg mx-auto leading-relaxed kk-font" style={{ color: "rgba(255,255,255,0.85)" }}>
          Please read these terms carefully before using our platform. By continuing, you agree to the following.
        </p>

        {/* Meta badges */}
        <div className="relative z-10 flex flex-wrap justify-center gap-6 mt-8 kk-font">
          {["📅 Effective: January 1, 2025", "📅 Last Updated: 2025", "📄 Version 1.0"].map((text) => (
            <div key={text} className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.75)" }}>
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col lg:flex-row gap-8 kk-font">

        {/* Sidebar */}
        <aside className="lg:w-60 shrink-0">
          <div className="lg:sticky lg:top-6 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
            {/* Sidebar header */}
            <div
              className="px-4 py-3"
              style={{
                background: "radial-gradient(ellipse at 70% 50%, #0ea5e9 0%, #0369a1 100%)",
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
              These Terms &amp; Conditions govern your use of Kolkata Kart's platform. By placing an order or creating an account, you legally agree to these terms. Questions? Email{" "}
              <strong>support@kolkata.in</strong>
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
                    style={{ background: "radial-gradient(ellipse at 60% 40%, #0ea5e9 0%, #0369a1 100%)" }}
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
            <span className="watermark" style={{ right: "20px", bottom: "-10px", fontSize: "5rem" }}>KK</span>

            <div className="relative z-10">
              {/* Pill */}
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-4 kk-pill">
                <span className="text-sm">💙</span>
                <span className="text-xs font-semibold tracking-widest uppercase text-white">
                  Kolkata Kart Promise
                </span>
              </div>

              <h3 className="font-bold text-2xl mb-2 kk-font" style={{ color: "#ffffff" }}>
                You're in{" "}
                <span style={{ color: "#facc15" }}>good hands</span>
              </h3>
              <p className="text-sm max-w-md mx-auto leading-relaxed mb-6 kk-font" style={{ color: "rgba(255,255,255,0.85)" }}>
                By using Kolkata Kart, you trust us with your grocery needs. We promise to uphold quality, transparency, and fairness in everything we do.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <a
                  href="mailto:support@kolkata.in"
                  className="bg-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors hover:bg-yellow-50 kk-font"
                  style={{ color: "#0369a1" }}
                >
                  📧 support@kolkata.in
                </a>
                <a
                  href="tel:+919679852485"
                  className="border text-white font-semibold text-sm px-5 py-2.5 rounded-xl kk-font"
                  style={{ borderColor: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)" }}
                >
                  📞 +91 96798 52485
                </a>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}