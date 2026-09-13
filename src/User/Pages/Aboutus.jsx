import { useState, useEffect } from "react";

const stats = [
  { value: "3K+", label: "Happy Customers" },
  { value: "1500+", label: "Products Available" },
  { value: "80+", label: "Local Vendors" },
  { value: "10+", label: "Areas Served" },
];

const values = [
  {
    icon: "🐟",
    title: "Kolkata Fresh",
    desc: "From Deganga's fields to your kitchen — we source fresh vegetables, fish, and daily essentials directly from local vendors across North 24 Parganas.",
  },
  {
    icon: "🤝",
    title: "Community First",
    desc: "Kolkata Kart was built to support local sellers and give families across the city access to quality groceries at honest prices.",
  },
  {
    icon: "💙",
    title: "No Middlemen",
    desc: "Direct from vendor to your doorstep — better price for the seller, better deal for you.",
  },
  {
    icon: "🚚",
    title: "Quick Delivery",
    desc: "Same-day and next-day delivery across our service areas so your kitchen is always stocked.",
  },
];

function CountUp({ target }) {
  const [count, setCount] = useState(0);
  const numeric = parseInt(target.replace(/\D/g, ""));

  useEffect(() => {
    let start = 0;
    const step = Math.ceil(numeric / 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= numeric) {
        setCount(numeric);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 20);
    return () => clearInterval(timer);
  }, [numeric]);

  return (
    <span>
      {count.toLocaleString("en-IN")}
      {target.replace(/[0-9,]/g, "")}
    </span>
  );
}

export default function AboutUs() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#fafaf7] font-sans text-gray-800">

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-8 left-10 text-8xl">🐟</div>
          <div className="absolute bottom-10 right-10 text-8xl">🥬</div>
          <div className="absolute top-1/2 left-1/3 text-6xl">🛒</div>
        </div>
        <div
          className={`relative max-w-4xl mx-auto px-6 py-24 text-center transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <span className="inline-block bg-white/20 text-white text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-widest mb-5">
            Est. 2025 · Deganga, North 24 Parganas
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-5 drop-shadow">
            Kolkata's Own
            <br />
            <span className="text-yellow-300">Grocery Delivery Platform</span>
          </h1>
          <p className="text-lg text-blue-100 max-w-xl mx-auto leading-relaxed">
            Kolkata Kart connects local vendors and farmers directly with families across the city — fresh, honest, and delivered fast.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl font-extrabold text-blue-700">
                <CountUp target={s.value} />
              </p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Our Story */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="flex flex-col md:flex-row gap-12 items-center">
          <div className="md:w-1/2">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600">Our Story</span>
            <h2 className="text-3xl font-extrabold mt-2 mb-5 text-gray-800 leading-snug">
              A Local Idea That Grew Into{" "}
              <span className="text-blue-600">Something Bigger</span>
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Kolkata Kart started in Deganga, a small town in North 24 Parganas, with one simple goal — make grocery shopping easier and fairer for everyday families across Kolkata and its suburbs.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              We work directly with local vendors, fishermen, and small farmers from the region to deliver fresh vegetables, fish, dairy, and daily essentials straight to your home — no unnecessary markups, no compromises on quality.
            </p>
            <p className="text-gray-600 leading-relaxed">
              What started as a small initiative has now grown to serve thousands of families — and we're expanding every day.
            </p>
          </div>

          {/* Timeline card */}
          <div className="md:w-1/2">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-2xl p-8">
              <div className="space-y-5">
                {[
                  { year: "2025 Start", text: "Founded in Geram Manjurhati, Deganga" },
                  { year: "Early Days", text: "First 200 orders delivered across Barasat" },
                  { year: "Growth", text: "Expanded to 10+ areas in North 24 Parganas" },
                  { year: "Now →", text: "Building Kolkata's most trusted grocery network" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="min-w-[90px] text-xs font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded text-center mt-0.5">
                      {item.year}
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600">What We Stand For</span>
            <h2 className="text-3xl font-extrabold mt-2 text-gray-800">Our Values</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {values.map((v, i) => (
              <div
                key={i}
                className="flex gap-4 p-6 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-300 bg-white"
              >
                <div className="text-3xl mt-1">{v.icon}</div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">{v.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact / Address */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600">Find Us</span>
          <h2 className="text-3xl font-extrabold mt-2 text-gray-800">Our Address</h2>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-2xl p-8 max-w-md mx-auto text-center">
          <div className="text-4xl mb-4">📍</div>
          <p className="font-bold text-gray-800 text-lg mb-1">Kolkata Kart</p>
          <p className="text-gray-600 text-sm leading-relaxed">
            Geram Manjurhati, Post Chakla<br />
            Thana Deganga, Mahakuma Barasat<br />
            District North 24 Parganas<br />
            Pin Code — 743424
          </p>
          <div className="mt-5 space-y-2">
            <a
              href="tel:+919679852485"
              className="flex items-center justify-center gap-2 text-blue-700 font-semibold text-sm hover:underline"
            >
              📞 +91 96798 52485
            </a>
            <a
              href="mailto:support@kolkata.in"
              className="flex items-center justify-center gap-2 text-blue-700 font-semibold text-sm hover:underline"
            >
              ✉️ support@kolkata.in
            </a>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-6 py-14 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-3">
            Shop Fresh. Support Local. 💙
          </h2>
          <p className="text-blue-200 mb-8 text-base">
            Join thousands of Kolkata families already shopping with Kolkata Kart.
          </p>
        </div>
      </section>

    </div>
  );
}