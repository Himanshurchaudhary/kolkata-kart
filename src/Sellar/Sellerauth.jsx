import { useState, useRef } from "react";

const API_BASEA = import.meta.env.VITE_API_URL;
const API_BASE = `${API_BASEA}/api/seller`;

const SHOP_CATEGORIES = [
  "Vegetables & Fruits", "Dairy & Eggs", "Grocery & Staples",
  "Bakery & Cakes", "Beverages", "Snacks & Namkeen",
  "Personal Care", "Household", "Perfumes & Fragrance", "Other"
];

const STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa",
  "Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala",
  "Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland",
  "Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
  "Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Other"
];

// ─── Reusable Input ────────────────────────────────────────────────
function Field({ label, required, error, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontWeight: 600, fontSize: 13, color: "#2d5a1b", marginBottom: 5 }}>
        {label}{required && <span style={{ color: "#e53e3e" }}> *</span>}
      </label>
      {children}
      {error && <p style={{ color: "#e53e3e", fontSize: 12, marginTop: 4 }}>{error}</p>}
    </div>
  );
}

function Input({ error, ...props }) {
  return (
    <input
      {...props}
      style={{
        width: "100%", padding: "10px 12px", border: `1.5px solid ${error ? "#e53e3e" : "#d1d5db"}`,
        borderRadius: 8, fontSize: 14, boxSizing: "border-box",
        outline: "none", transition: "border-color .2s",
        background: "#fafafa", color: "#1a1a1a",
        ...props.style
      }}
      onFocus={e => e.target.style.borderColor = "#3a7d1e"}
      onBlur={e => e.target.style.borderColor = error ? "#e53e3e" : "#d1d5db"}
    />
  );
}

function Select({ error, children, ...props }) {
  return (
    <select
      {...props}
      style={{
        width: "100%", padding: "10px 12px", border: `1.5px solid ${error ? "#e53e3e" : "#d1d5db"}`,
        borderRadius: 8, fontSize: 14, boxSizing: "border-box",
        background: "#fafafa", color: "#1a1a1a", outline: "none"
      }}
    >
      {children}
    </select>
  );
}

function Btn({ children, loading, secondary, small, ...props }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      style={{
        background: secondary ? "transparent" : "#3a7d1e",
        color: secondary ? "#3a7d1e" : "#fff",
        border: secondary ? "2px solid #3a7d1e" : "none",
        borderRadius: 8, padding: small ? "7px 14px" : "11px 20px",
        fontSize: small ? 13 : 15, fontWeight: 700, cursor: "pointer",
        width: props.fullWidth ? "100%" : "auto",
        opacity: (loading || props.disabled) ? .65 : 1,
        transition: "opacity .2s, background .2s",
        ...props.style
      }}
    >
      {loading ? "Please wait…" : children}
    </button>
  );
}

function SectionHeader({ icon, title, subtitle }) {
  return (
    <div style={{ marginBottom: 20, paddingBottom: 10, borderBottom: "2px solid #e8f5e1" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <h3 style={{ margin: 0, fontSize: 16, color: "#2d5a1b", fontWeight: 700 }}>{title}</h3>
      </div>
      {subtitle && <p style={{ margin: "4px 0 0 28px", fontSize: 12, color: "#6b7280" }}>{subtitle}</p>}
    </div>
  );
}

// ─── OTP Box ──────────────────────────────────────────────────────
function OtpBox({ value, onChange, onSend, onVerify, sent, verified, loading, email }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
      <div style={{ flex: "1 1 160px" }}>
        <Input
          placeholder="Enter 6-digit OTP"
          maxLength={6}
          value={value}
          onChange={onChange}
          disabled={verified}
        />
      </div>
      {!sent ? (
        <Btn small onClick={onSend} loading={loading} disabled={!email}>
          Send OTP
        </Btn>
      ) : !verified ? (
        <Btn small onClick={onVerify} loading={loading}>
          Verify OTP
        </Btn>
      ) : (
        <span style={{ color: "#3a7d1e", fontWeight: 700, fontSize: 13 }}>✓ Verified</span>
      )}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div style={{
      position: "fixed", top: 18, right: 18, zIndex: 9999,
      background: type === "error" ? "#e53e3e" : "#3a7d1e",
      color: "#fff", padding: "12px 20px", borderRadius: 10,
      fontWeight: 600, fontSize: 14, boxShadow: "0 4px 20px rgba(0,0,0,.18)",
      maxWidth: 320, animation: "slideIn .3s ease"
    }}>
      {msg}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════════════
function LoginPage({ onSwitch }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showPass, setShowPass] = useState(false);

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleLogin = async () => {
    if (!form.email || !form.password) return notify("Please fill all fields.", "error");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      notify("Login successful! Redirecting…");
      localStorage.setItem("sellerToken", data.token);
      setTimeout(() => { window.location.href = "/seller/dashboard"; }, 1500);
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "0 16px" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h2 style={{ color: "#2d5a1b", margin: "0 0 6px", fontSize: 24, fontWeight: 800 }}>Seller Login</h2>
          <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>
            Sign in to your Gramin Cart seller account
          </p>
        </div>
        <div style={{ background: "#fff", borderRadius: 16, padding: "28px 24px", boxShadow: "0 4px 24px rgba(58,125,30,.1)", border: "1px solid #e8f5e1" }}>
          <Field label="Email Address" required>
            <Input type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} />
          </Field>
          <Field label="Password" required>
            <div style={{ position: "relative" }}>
              <Input
                type={showPass ? "text" : "password"}
                placeholder="Your password"
                value={form.password}
                onChange={set("password")}
                style={{ paddingRight: 44 }}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
              />
              <span
                onClick={() => setShowPass(s => !s)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", cursor: "pointer", fontSize: 16 }}
              >
                {showPass ? "🙈" : "👁️"}
              </span>
            </div>
          </Field>
          <div style={{ textAlign: "right", marginBottom: 20 }}>
            <a href="/seller/forgot-password" style={{ color: "#3a7d1e", fontSize: 13, textDecoration: "none", fontWeight: 600 }}>
              Forgot Password?
            </a>
          </div>
          <Btn fullWidth loading={loading} onClick={handleLogin}>
            Sign In →
          </Btn>
          <p style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: "#6b7280" }}>
            New seller?{" "}
            <span onClick={onSwitch} style={{ color: "#3a7d1e", fontWeight: 700, cursor: "pointer" }}>
              Create Account
            </span>
          </p>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// REGISTRATION — multi-step
// ═══════════════════════════════════════════════════════════════════
const TOTAL_STEPS = 6;

function StepIndicator({ current }) {
  const labels = ["Personal", "Shop", "KYC", "Bank", "Pickup", "Agreement"];
  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 24, flexWrap: "wrap", gap: 4 }}>
      {labels.map((l, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: done ? "#3a7d1e" : active ? "#f97316" : "#e5e7eb",
                color: done || active ? "#fff" : "#9ca3af",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700
              }}>
                {done ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: 10, color: active ? "#f97316" : done ? "#3a7d1e" : "#9ca3af", fontWeight: 600, whiteSpace: "nowrap" }}>
                {l}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div style={{ width: 20, height: 2, background: done ? "#3a7d1e" : "#e5e7eb", margin: "0 2px", marginBottom: 14 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

const initialForm = {
  // Step 0: Personal
  fullName: "", email: "", mobile: "", password: "", confirmPassword: "", dob: "",
  otp: "", otpSent: false, emailVerified: false,
  // Step 1: Shop
  shopName: "", shopCategory: "", shopStreet: "", shopCity: "", shopState: "", shopPincode: "",
  deliveryCharge: "", shopDescription: "",
  // Step 2: KYC
  panNumber: "", aadharNumber: "", panCardImage: null, panCardPreview: "",
  // Step 3: Bank
  upiId: "", upiMobile: "",
  // Step 4: Pickup
  sameAsShop: true, pickupStreet: "", pickupCity: "", pickupState: "", pickupPincode: "",
  workingHoursFrom: "09:00", workingHoursTo: "18:00",
  // Step 5: Agreement
  termsAccepted: false, commissionAccepted: false,
};

function RegisterPage({ onSwitch }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const panRef = useRef();

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const set = key => e => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [key]: val }));
    setErrors(er => ({ ...er, [key]: "" }));
  };

  // OTP
  const sendOtp = async () => {
    if (!form.email) return notify("Enter email first", "error");
    setOtpLoading(true);
    try {
      const res = await fetch(`${API_BASE}/send-otp`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setForm(f => ({ ...f, otpSent: true }));
      notify("OTP sent to your email!");
    } catch (e) { notify(e.message, "error"); }
    finally { setOtpLoading(false); }
  };

  const verifyOtp = async () => {
    if (!form.otp) return notify("Enter OTP", "error");
    setOtpLoading(true);
    try {
      const res = await fetch(`${API_BASE}/verify-otp`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, otp: form.otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setForm(f => ({ ...f, emailVerified: true }));
      notify("Email verified!");
    } catch (e) { notify(e.message, "error"); }
    finally { setOtpLoading(false); }
  };

  // PAN image
  const handlePanImage = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return notify("Image must be under 2MB", "error");
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({ ...f, panCardImage: file, panCardPreview: ev.target.result }));
    reader.readAsDataURL(file);
  };

  // Validate per step
  const validate = () => {
    const e = {};
    if (step === 0) {
      if (!form.fullName.trim()) e.fullName = "Full name is required";
      if (!form.email.trim()) e.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
      if (!form.emailVerified) e.otp = "Please verify your email";
      if (!form.mobile.trim()) e.mobile = "Mobile number is required";
      else if (!/^[6-9]\d{9}$/.test(form.mobile)) e.mobile = "Invalid mobile number";
      if (!form.password) e.password = "Password is required";
      else if (form.password.length < 8) e.password = "Min 8 characters";
      if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    }
    if (step === 1) {
      if (!form.shopName.trim()) e.shopName = "Shop name is required";
      if (!form.shopCategory) e.shopCategory = "Select a category";
      if (!form.shopStreet.trim()) e.shopStreet = "Street address required";
      if (!form.shopCity.trim()) e.shopCity = "City required";
      if (!form.shopState) e.shopState = "State required";
      if (!form.shopPincode.trim()) e.shopPincode = "Pincode required";
      else if (!/^\d{6}$/.test(form.shopPincode)) e.shopPincode = "6-digit pincode";
      if (!form.deliveryCharge && form.deliveryCharge !== "0") e.deliveryCharge = "Enter delivery charge (0 for free)";
    }
    if (step === 2) {
      if (!form.panNumber.trim()) e.panNumber = "PAN number required";
      else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.panNumber.toUpperCase())) e.panNumber = "Invalid PAN format";
      if (!form.aadharNumber.trim()) e.aadharNumber = "Aadhaar number required";
      else if (!/^\d{12}$/.test(form.aadharNumber)) e.aadharNumber = "12-digit Aadhaar number";
      if (!form.panCardImage) e.panCardImage = "PAN card image required";
    }
    if (step === 3) {
      if (!form.upiId.trim()) e.upiId = "UPI ID required";
      else if (!form.upiId.includes("@")) e.upiId = "Invalid UPI ID (e.g. name@upi)";
      if (!form.upiMobile.trim()) e.upiMobile = "UPI-linked mobile required";
      else if (!/^[6-9]\d{9}$/.test(form.upiMobile)) e.upiMobile = "Invalid mobile number";
    }
    if (step === 4 && !form.sameAsShop) {
      if (!form.pickupStreet.trim()) e.pickupStreet = "Pickup street required";
      if (!form.pickupCity.trim()) e.pickupCity = "Pickup city required";
      if (!form.pickupState) e.pickupState = "Pickup state required";
      if (!form.pickupPincode.trim()) e.pickupPincode = "Pickup pincode required";
      else if (!/^\d{6}$/.test(form.pickupPincode)) e.pickupPincode = "6-digit pincode";
    }
    if (step === 5) {
      if (!form.termsAccepted) e.termsAccepted = "You must accept terms";
      if (!form.commissionAccepted) e.commissionAccepted = "You must accept commission structure";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate()) setStep(s => Math.min(s + 1, TOTAL_STEPS - 1)); };
  const back = () => setStep(s => Math.max(s - 1, 0));

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const fd = new FormData();
      // flatten form
      Object.entries(form).forEach(([k, v]) => {
        if (k === "panCardImage" && v) fd.append("panCardImage", v);
        else if (typeof v !== "object") fd.append(k, v);
      });
      const res = await fetch(`${API_BASE}/register`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");
      notify("Registration successful! Awaiting admin approval.");
      setTimeout(() => onSwitch(), 2500);
    } catch (e) { notify(e.message, "error"); }
    finally { setLoading(false); }
  };

  const stepContent = () => {
    switch (step) {
      case 0: return (
        <>
          <SectionHeader icon="👤" title="Personal Information" subtitle="Your basic account details" />
          <Field label="Full Name" required error={errors.fullName}>
            <Input placeholder="Ramesh Kumar" value={form.fullName} onChange={set("fullName")} error={errors.fullName} />
          </Field>
          <Field label="Email Address" required error={errors.email || errors.otp}>
            <Input type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} disabled={form.emailVerified} error={errors.email} />
          </Field>
          <Field label="Email OTP Verification" required error={errors.otp}>
            <OtpBox
              value={form.otp} onChange={set("otp")}
              onSend={sendOtp} onVerify={verifyOtp}
              sent={form.otpSent} verified={form.emailVerified}
              loading={otpLoading} email={form.email}
            />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Mobile Number" required error={errors.mobile}>
              <Input type="tel" placeholder="9876543210" maxLength={10} value={form.mobile} onChange={set("mobile")} error={errors.mobile} />
            </Field>
            <Field label="Date of Birth">
              <Input type="date" value={form.dob} onChange={set("dob")} />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Password" required error={errors.password}>
              <div style={{ position: "relative" }}>
                <Input type={showPass ? "text" : "password"} placeholder="Min 8 chars" value={form.password} onChange={set("password")} error={errors.password} style={{ paddingRight: 40 }} />
                <span onClick={() => setShowPass(s => !s)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", cursor: "pointer", fontSize: 15 }}>
                  {showPass ? "🙈" : "👁️"}
                </span>
              </div>
            </Field>
            <Field label="Confirm Password" required error={errors.confirmPassword}>
              <Input type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={set("confirmPassword")} error={errors.confirmPassword} />
            </Field>
          </div>
        </>
      );
      case 1: return (
        <>
          <SectionHeader icon="🏪" title="Shop Information" subtitle="Tell us about your business" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Shop Name" required error={errors.shopName}>
              <Input placeholder="Ramesh Grocery" value={form.shopName} onChange={set("shopName")} error={errors.shopName} />
            </Field>
            <Field label="Shop Category" required error={errors.shopCategory}>
              <Select value={form.shopCategory} onChange={set("shopCategory")} error={errors.shopCategory}>
                <option value="">Select category</option>
                {SHOP_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Street / Locality" required error={errors.shopStreet}>
            <Input placeholder="Plot 12, Gandhi Nagar" value={form.shopStreet} onChange={set("shopStreet")} error={errors.shopStreet} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Field label="City" required error={errors.shopCity}>
              <Input placeholder="Gopalganj" value={form.shopCity} onChange={set("shopCity")} error={errors.shopCity} />
            </Field>
            <Field label="State" required error={errors.shopState}>
              <Select value={form.shopState} onChange={set("shopState")} error={errors.shopState}>
                <option value="">State</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>
            <Field label="Pincode" required error={errors.shopPincode}>
              <Input placeholder="841409" maxLength={6} value={form.shopPincode} onChange={set("shopPincode")} error={errors.shopPincode} />
            </Field>
          </div>
          <Field label="Delivery Charge (₹)" required error={errors.deliveryCharge}>
            <Input type="number" min="0" placeholder="0 for free delivery" value={form.deliveryCharge} onChange={set("deliveryCharge")} error={errors.deliveryCharge} />
          </Field>
          <Field label="Shop Description">
            <textarea
              placeholder="Brief about your shop (optional)"
              value={form.shopDescription} onChange={set("shopDescription")}
              rows={3}
              style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #d1d5db", borderRadius: 8, fontSize: 14, boxSizing: "border-box", resize: "vertical", background: "#fafafa", outline: "none" }}
            />
          </Field>
        </>
      );
      case 2: return (
        <>
          <SectionHeader icon="📄" title="KYC Documents" subtitle="Required for legal verification" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="PAN Number" required error={errors.panNumber}>
              <Input
                placeholder="ABCDE1234F"
                maxLength={10}
                value={form.panNumber}
                onChange={e => setForm(f => ({ ...f, panNumber: e.target.value.toUpperCase() }))}
                error={errors.panNumber}
              />
            </Field>
            <Field label="Aadhaar Number" required error={errors.aadharNumber}>
              <Input placeholder="123456789012" maxLength={12} value={form.aadharNumber} onChange={set("aadharNumber")} error={errors.aadharNumber} />
            </Field>
          </div>
          <Field label="PAN Card Image" required error={errors.panCardImage}>
            <div
              onClick={() => panRef.current.click()}
              style={{
                border: `2px dashed ${errors.panCardImage ? "#e53e3e" : "#3a7d1e"}`,
                borderRadius: 10, padding: "20px 12px", textAlign: "center",
                cursor: "pointer", background: "#f0fdf4", color: "#3a7d1e"
              }}
            >
              {form.panCardPreview ? (
                <img src={form.panCardPreview} alt="PAN" style={{ maxHeight: 120, maxWidth: "100%", borderRadius: 6 }} />
              ) : (
                <>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>📷</div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Click to upload PAN Card</div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>JPG, PNG — max 2MB</div>
                </>
              )}
            </div>
            <input ref={panRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePanImage} />
          </Field>
          <div style={{ background: "#fef3c7", border: "1px solid #f59e0b", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#92400e" }}>
            🔒 Your KYC data is encrypted and only used for verification purposes.
          </div>
        </>
      );
      case 3: return (
        <>
          <SectionHeader icon="🏦" title="Bank / UPI Details" subtitle="For receiving payments" />
          <Field label="UPI ID" required error={errors.upiId}>
            <Input placeholder="name@upi or name@paytm" value={form.upiId} onChange={set("upiId")} error={errors.upiId} />
          </Field>
          <Field label="Mobile Number Linked to UPI" required error={errors.upiMobile}>
            <Input type="tel" placeholder="9876543210" maxLength={10} value={form.upiMobile} onChange={set("upiMobile")} error={errors.upiMobile} />
          </Field>
          <div style={{ background: "#f0fdf4", border: "1px solid #3a7d1e", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#2d5a1b" }}>
            💸 Payments will be sent directly to your UPI ID after order completion.
          </div>
        </>
      );
      case 4: return (
        <>
          <SectionHeader icon="📍" title="Pickup / Warehouse Address" subtitle="Where orders will be picked up from" />
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, cursor: "pointer", fontWeight: 600, color: "#2d5a1b", fontSize: 14 }}>
            <input type="checkbox" checked={form.sameAsShop} onChange={set("sameAsShop")} style={{ width: 16, height: 16, accentColor: "#3a7d1e" }} />
            Same as shop address
          </label>
          {!form.sameAsShop && (
            <>
              <Field label="Street / Locality" required error={errors.pickupStreet}>
                <Input placeholder="Warehouse address" value={form.pickupStreet} onChange={set("pickupStreet")} error={errors.pickupStreet} />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <Field label="City" required error={errors.pickupCity}>
                  <Input placeholder="City" value={form.pickupCity} onChange={set("pickupCity")} error={errors.pickupCity} />
                </Field>
                <Field label="State" required error={errors.pickupState}>
                  <Select value={form.pickupState} onChange={set("pickupState")} error={errors.pickupState}>
                    <option value="">State</option>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </Select>
                </Field>
                <Field label="Pincode" required error={errors.pickupPincode}>
                  <Input placeholder="841409" maxLength={6} value={form.pickupPincode} onChange={set("pickupPincode")} error={errors.pickupPincode} />
                </Field>
              </div>
            </>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Working Hours From">
              <Input type="time" value={form.workingHoursFrom} onChange={set("workingHoursFrom")} />
            </Field>
            <Field label="Working Hours To">
              <Input type="time" value={form.workingHoursTo} onChange={set("workingHoursTo")} />
            </Field>
          </div>
        </>
      );
      case 5: return (
        <>
          <SectionHeader icon="✅" title="Agreement" subtitle="Review and accept to complete registration" />
          <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: 16, marginBottom: 16, maxHeight: 180, overflowY: "auto", fontSize: 13, color: "#374151", lineHeight: 1.7 }}>
            <strong>Terms & Conditions</strong><br />
            By registering as a seller on Gramin Cart, you agree to: maintain accurate product listings, deliver orders on time, abide by our quality standards, not sell counterfeit or prohibited goods, respond to customer queries within 24 hours, and follow all applicable Indian laws regarding food safety, GST, and commerce.
          </div>
          <Field error={errors.termsAccepted}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", fontSize: 14, color: "#374151" }}>
              <input type="checkbox" checked={form.termsAccepted} onChange={set("termsAccepted")} style={{ marginTop: 2, width: 16, height: 16, accentColor: "#3a7d1e" }} />
              I have read and agree to the <strong>&nbsp;Terms & Conditions</strong>
            </label>
          </Field>
          <div style={{ background: "#f0fdf4", border: "1px solid #3a7d1e", borderRadius: 10, padding: 16, marginBottom: 16, fontSize: 13, color: "#2d5a1b", lineHeight: 1.7 }}>
            <strong>Commission Structure</strong><br />
            Gramin Cart charges a <strong>15% commission</strong> on each successful order. Payouts are processed weekly to your registered UPI ID. Platform fee is non-refundable once order is confirmed.
          </div>
          <Field error={errors.commissionAccepted}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", fontSize: 14, color: "#374151" }}>
              <input type="checkbox" checked={form.commissionAccepted} onChange={set("commissionAccepted")} style={{ marginTop: 2, width: 16, height: 16, accentColor: "#3a7d1e" }} />
              I agree to pay <strong>&nbsp;15% commission&nbsp;</strong> per order to Gramin Cart
            </label>
          </Field>
        </>
      );
      default: return null;
    }
  };

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h2 style={{ color: "#2d5a1b", margin: "0 0 6px", fontSize: 22, fontWeight: 800 }}>Seller Registration</h2>
          <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>Join Gramin Cart and start selling today</p>
        </div>
        <StepIndicator current={step} />
        <div style={{ background: "#fff", borderRadius: 16, padding: "24px 20px", boxShadow: "0 4px 24px rgba(58,125,30,.1)", border: "1px solid #e8f5e1" }}>
          {stepContent()}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, gap: 10 }}>
            {step > 0 ? (
              <Btn secondary onClick={back}>← Back</Btn>
            ) : (
              <span />
            )}
            {step < TOTAL_STEPS - 1 ? (
              <Btn onClick={next}>Continue →</Btn>
            ) : (
              <Btn loading={loading} onClick={submit} style={{ background: "#f97316" }}>
                Submit Registration ✓
              </Btn>
            )}
          </div>
        </div>
        <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#6b7280" }}>
          Already registered?{" "}
          <span onClick={onSwitch} style={{ color: "#3a7d1e", fontWeight: 700, cursor: "pointer" }}>Sign in here</span>
        </p>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════════
export default function SellerAuth() {
  const [mode, setMode] = useState("login"); // "login" | "register"

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Segoe UI', sans-serif; }
        @keyframes slideIn { from { opacity:0; transform: translateY(-12px) } to { opacity:1; transform: translateY(0) } }
        @media (max-width: 480px) {
          .reg-grid-2 { grid-template-columns: 1fr !important; }
          .reg-grid-3 { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Header ─────────────────────────────────────── */}
      <header style={{ background: "#fff", borderBottom: "1px solid #e8f5e1", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, background: "linear-gradient(135deg,#3a7d1e,#6ab04c)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🛒</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#3a7d1e", lineHeight: 1 }}>Gramin Cart</div>
              <div style={{ fontSize: 10, color: "#6b7280" }}>Seller Portal</div>
            </div>
          </div>
          <a href="/" style={{ fontSize: 13, color: "#3a7d1e", fontWeight: 600, textDecoration: "none" }}>← Back to Store</a>
        </div>
      </header>

      {/* ── Tab switcher ───────────────────────────────── */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px 0" }}>
        <div style={{ display: "flex", background: "#f3f4f6", borderRadius: 10, padding: 4, maxWidth: 320, margin: "0 auto 28px" }}>
          {["login", "register"].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: "9px 0", border: "none", borderRadius: 8,
              background: mode === m ? "#3a7d1e" : "transparent",
              color: mode === m ? "#fff" : "#6b7280",
              fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "all .2s"
            }}>
              {m === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        {mode === "login"
          ? <LoginPage onSwitch={() => setMode("register")} />
          : <RegisterPage onSwitch={() => setMode("login")} />
        }
      </div>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer style={{ textAlign: "center", padding: "32px 16px 20px", color: "#9ca3af", fontSize: 12, marginTop: 40 }}>
        © 2026 GraminCart · District Gopalganj, Bihar · graminkartdc@gmail.com
      </footer>
    </>
  );
}