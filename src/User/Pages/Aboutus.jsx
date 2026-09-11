import { useState, useEffect } from "react";

const stats = [
  { value: "5K+", label: "Happy Customers" },
  { value: "2000+", label: "Products Available" },
  { value: "100+", label: "Local Farmers" },
  { value: "20+", label: "Cities Served" },
];

const values = [
  {
    icon: "🌾",
    title: "Farm Fresh",
    desc: "We source directly from local farmers across Bihar and nearby regions to bring you the freshest produce every day.",
  },
  {
    icon: "🤝",
    title: "Community First",
    desc: "Gramin Cart was born to empower rural farmers and give urban families access to honest, quality groceries.",
  },
  {
    icon: "💚",
    title: "Zero Middlemen",
    desc: "By cutting out middlemen, we ensure better prices for both the farmer and your family.",
  },
  {
    icon: "🚚",
    title: "Fast Delivery",
    desc: "Same-day and next-day delivery across our service areas so your kitchen is never empty.",
  },
];

const team = [
  { name: "Arjun Sharma", role: "Co-Founder & CEO", initials: "AS", color: "bg-green-100 text-green-700" },
  { name: "Priya Kumari", role: "Co-Founder & COO", initials: "PK", color: "bg-amber-100 text-amber-700" },
  { name: "Rohit Yadav", role: "Head of Supply Chain", initials: "RY", color: "bg-emerald-100 text-emerald-700" },
];

function CountUp({ target, suffix = "" }) {
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
      <section className="relative overflow-hidden bg-gradient-to-br from-green-700 via-green-600 to-emerald-500 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-8 left-10 text-8xl">🌾</div>
          <div className="absolute bottom-10 right-10 text-8xl">🥦</div>
          <div className="absolute top-1/2 left-1/3 text-6xl">🍅</div>
        </div>
        <div className={`relative max-w-4xl mx-auto px-6 py-24 text-center transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <span className="inline-block bg-white/20 text-white text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-widest mb-5">
            Est. 2026 · Gopalganj, Bihar
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-5 drop-shadow">
            Bringing the Village's
            <br />
            <span className="text-yellow-300">Best to Your Doorstep</span>
          </h1>
          <p className="text-lg text-green-100 max-w-xl mx-auto leading-relaxed">
            Gramin Cart is India's grassroots grocery platform — connecting local farmers directly with families who care about fresh, honest food.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl font-extrabold text-green-700">
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
            <span className="text-xs font-bold uppercase tracking-widest text-green-600">Our Story</span>
            <h2 className="text-3xl font-extrabold mt-2 mb-5 text-gray-800 leading-snug">
              Started in 2026 with a <span className="text-green-600">Simple Idea</span>
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Gramin Cart was founded in early 2026 by a group of friends from Patna who were tired of watching farmers struggle to get fair prices while city families paid too much for low-quality produce.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              We built a simple bridge — an online grocery platform that works directly with small farmers and cooperatives across Bihar to deliver fresh vegetables, grains, dairy, and daily essentials to your home.
            </p>
            <p className="text-gray-600 leading-relaxed">
              In less than a year, we've grown from a tiny WhatsApp group of 50 customers to serving over 50,000 families — and we're just getting started.
            </p>
          </div>

          {/* Visual card */}
          <div className="md:w-1/2">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-8">
              <div className="space-y-5">
                {[
                  { year: "Jan 2026", text: "Founded in Patna with 3 co-founders" },
                  { year: "Mar 2026", text: "First 500 orders delivered" },
                  { year: "Jun 2026", text: "Expanded to 20+ cities across Bihar" },
                  { year: "2026 →", text: "Building India's largest rural grocery network" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="min-w-[80px] text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded text-center mt-0.5">
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
            <span className="text-xs font-bold uppercase tracking-widest text-green-600">What We Stand For</span>
            <h2 className="text-3xl font-extrabold mt-2 text-gray-800">Our Values</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {values.map((v, i) => (
              <div
                key={i}
                className="flex gap-4 p-6 rounded-xl border border-gray-100 hover:border-green-200 hover:shadow-md transition-all duration-300 bg-white"
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

      {/* Team */}
      {/* <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-green-600">The People Behind It</span>
          <h2 className="text-3xl font-extrabold mt-2 text-gray-800">Meet Our Team</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          {team.map((t, i) => (
            <div key={i} className="flex-1 text-center bg-white border border-gray-100 rounded-2xl p-8 hover:shadow-md transition-shadow">
              <div className={`w-16 h-16 rounded-full ${t.color} flex items-center justify-center text-xl font-extrabold mx-auto mb-4`}>
                {t.initials}
              </div>
              <p className="font-bold text-gray-800">{t.name}</p>
              <p className="text-sm text-gray-500 mt-1">{t.role}</p>
            </div>
          ))}
        </div>
      </section> */}

      {/* CTA Banner */}
      <section className="bg-green-700 text-white">
        <div className="max-w-4xl mx-auto px-6 py-14 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-3">
            Shop Fresh. Support Local. 🌿
          </h2>
          <p className="text-green-200 mb-8 text-base">
            Join thousands of families already shopping with Gramin Cart.
          </p>
          
        </div>
      </section>

      {/* Footer note */}
      
    </div>
  );
}