// src/Seller/Pages/SellerProfile.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  User, Mail, Phone, Calendar, Store, Tag, MapPin,
  IndianRupee, Clock, CreditCard, Camera, Save,
  ChevronDown, ChevronUp, CheckCircle, XCircle,
  Loader, Edit3, Package,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

// ── Helpers ────────────────────────────────────────────────────────
const token = () => localStorage.getItem("sellerToken");

const authFetch = (url, opts = {}) =>
  fetch(`${API}${url}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token()}`,
      ...(opts.headers || {}),
    },
  });

// ── Toast ──────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = {
    success: { bg: "#f0fdf4", border: "#86efac", color: "#166534" },
    error:   { bg: "#fef2f2", border: "#fca5a5", color: "#991b1b" },
  };
  const c = colors[type] || colors.success;

  return (
    <div style={{
      position: "fixed", bottom: 20, left: "50%",
      transform: "translateX(-50%)",
      background: c.bg, border: `1px solid ${c.border}`,
      color: c.color, borderRadius: 12,
      padding: "12px 20px", fontSize: 13, fontWeight: 600,
      display: "flex", alignItems: "center", gap: 8,
      boxShadow: "0 4px 20px rgba(0,0,0,.12)",
      zIndex: 9999, maxWidth: "calc(100vw - 32px)",
      animation: "slideUp .25s ease",
    }}>
      {type === "success"
        ? <CheckCircle size={16} />
        : <XCircle size={16} />}
      {message}
      <style>{`@keyframes slideUp{from{opacity:0;transform:translate(-50%,12px)}to{opacity:1;transform:translate(-50%,0)}}`}</style>
    </div>
  );
}

// ── Section Wrapper ────────────────────────────────────────────────
function Section({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{
      background: "#fff", borderRadius: 16,
      border: "1px solid #e8f5e1",
      overflow: "hidden", marginBottom: 14,
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px", background: "none", border: "none",
          cursor: "pointer", gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "#f0fdf4",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Icon size={16} color="#3a7d1e" />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>
            {title}
          </span>
        </div>
        {open ? <ChevronUp size={16} color="#9ca3af" /> : <ChevronDown size={16} color="#9ca3af" />}
      </button>

      {open && (
        <div style={{ padding: "0 16px 16px", borderTop: "1px solid #f0f0f0" }}>
          <div style={{ paddingTop: 14 }}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Field Row ──────────────────────────────────────────────────────
function Field({ label, name, value, type = "text", onChange, readOnly = false, options }) {
  const base = {
    width: "100%", padding: "10px 12px",
    border: "1px solid #e5e7eb", borderRadius: 10,
    fontSize: 14, color: readOnly ? "#9ca3af" : "#1a1a1a",
    background: readOnly ? "#f9fafb" : "#fff",
    outline: "none", boxSizing: "border-box",
    fontFamily: "inherit",
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{
        display: "block", fontSize: 11, fontWeight: 700,
        color: "#6b7280", marginBottom: 5, textTransform: "uppercase",
        letterSpacing: "0.5px",
      }}>
        {label}
      </label>
      {options ? (
        <select
          name={name}
          value={value || ""}
          onChange={onChange}
          disabled={readOnly}
          style={{ ...base, appearance: "none" }}
        >
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={value || ""}
          onChange={onChange}
          readOnly={readOnly}
          style={base}
        />
      )}
    </div>
  );
}

// ── Two Column Grid ────────────────────────────────────────────────
function Grid({ children }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
      gap: "0 12px",
    }}>
      {children}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════
export default function SellerProfile() {
  const fileRef = useRef();
  const [toast,   setToast]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [picLoading, setPicLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [form, setForm] = useState({
    full_name: "", email: "", mobile: "", dob: "",
    shop_name: "", shop_category: "", shop_description: "",
    shop_street: "", shop_city: "", shop_state: "", shop_pincode: "",
    delivery_charge: "",
    upi_id: "", upi_mobile: "",
    same_as_shop: "1",
    pickup_street: "", pickup_city: "", pickup_state: "", pickup_pincode: "",
    working_hours_from: "", working_hours_to: "",
    is_approved: false, profile_pic_url: "", created_at: "",
  });

  // ── Fetch profile ──────────────────────────────────────────────
  useEffect(() => {
    authFetch("/api/seller/profile")
      .then(r => r.json())
      .then(data => {
        if (data.seller) {
          const s = data.seller;
          setForm({
            full_name:          s.full_name          || "",
            email:              s.email              || "",
            mobile:             s.mobile             || "",
            dob:                s.dob ? s.dob.slice(0, 10) : "",
            shop_name:          s.shop_name          || "",
            shop_category:      s.shop_category      || "",
            shop_description:   s.shop_description   || "",
            shop_street:        s.shop_street        || "",
            shop_city:          s.shop_city          || "",
            shop_state:         s.shop_state         || "",
            shop_pincode:       s.shop_pincode       || "",
            delivery_charge:    s.delivery_charge    ?? "",
            upi_id:             s.upi_id             || "",
            upi_mobile:         s.upi_mobile         || "",
            same_as_shop:       String(s.same_as_shop ?? "1"),
            pickup_street:      s.pickup_street      || "",
            pickup_city:        s.pickup_city        || "",
            pickup_state:       s.pickup_state       || "",
            pickup_pincode:     s.pickup_pincode     || "",
            working_hours_from: s.working_hours_from || "",
            working_hours_to:   s.working_hours_to   || "",
            is_approved:        !!s.is_approved,
            profile_pic_url:    s.profile_pic_url    || "",
            created_at:         s.created_at         || "",
          });
        }
      })
      .catch(() => showToast("Failed to load profile", "error"))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (message, type = "success") =>
    setToast({ message, type });

  // ── Handle field change ────────────────────────────────────────
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  // ── Save profile ───────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await authFetch("/api/seller/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName:         form.full_name,
          mobile:           form.mobile,
          dob:              form.dob,
          shopName:         form.shop_name,
          shopCategory:     form.shop_category,
          shopDescription:  form.shop_description,
          shopStreet:       form.shop_street,
          shopCity:         form.shop_city,
          shopState:        form.shop_state,
          shopPincode:      form.shop_pincode,
          deliveryCharge:   form.delivery_charge,
          upiId:            form.upi_id,
          upiMobile:        form.upi_mobile,
          sameAsShop:       form.same_as_shop,
          pickupStreet:     form.pickup_street,
          pickupCity:       form.pickup_city,
          pickupState:      form.pickup_state,
          pickupPincode:    form.pickup_pincode,
          workingHoursFrom: form.working_hours_from,
          workingHoursTo:   form.working_hours_to,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Profile updated successfully");
      } else {
        showToast(data.message || "Update failed", "error");
      }
    } catch {
      showToast("Network error. Try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Profile pic change ─────────────────────────────────────────
  const handlePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Local preview
    const reader = new FileReader();
    reader.onload = ev => setPreviewUrl(ev.target.result);
    reader.readAsDataURL(file);

    // Upload
    setPicLoading(true);
    try {
      const fd = new FormData();
      fd.append("profilePic", file);
      const res = await authFetch("/api/seller/profile/pic", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (res.ok) {
        setForm(f => ({ ...f, profile_pic_url: data.profilePicUrl }));
        showToast("Profile picture updated");
      } else {
        showToast(data.message || "Upload failed", "error");
        setPreviewUrl(null);
      }
    } catch {
      showToast("Upload failed. Try again.", "error");
      setPreviewUrl(null);
    } finally {
      setPicLoading(false);
    }
  };

  const picSrc = previewUrl || form.profile_pic_url || null;
  const initials = form.full_name
    ? form.full_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "S";

  const sameAsShop = form.same_as_shop === "1" || form.same_as_shop === 1;

  // ── Loading state ──────────────────────────────────────────────
  if (loading) return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "60vh", gap: 10, color: "#6b7280", fontSize: 14,
    }}>
      <Loader size={20} color="#3a7d1e" style={{ animation: "spin .7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      Loading profile…
    </div>
  );

  // ── Main render ────────────────────────────────────────────────
  return (
    <div style={{
      padding: "16px 16px 100px",
      maxWidth: 640, margin: "0 auto",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>

      {/* ── Header card with profile pic ── */}
      <div style={{
        background: "linear-gradient(135deg, #2d5a1b 0%, #3a7d1e 60%, #6ab04c 100%)",
        borderRadius: 20, padding: "24px 20px",
        display: "flex", alignItems: "center", gap: 18,
        marginBottom: 16, position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative circle */}
        <div style={{
          position: "absolute", right: -30, top: -30,
          width: 130, height: 130, borderRadius: "50%",
          background: "rgba(255,255,255,.07)",
        }} />

        {/* Profile pic */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            border: "3px solid rgba(255,255,255,.4)",
            overflow: "hidden",
            background: "linear-gradient(135deg,#6ab04c,#2d5a1b)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {picSrc ? (
              <img
                src={picSrc}
                alt="Profile"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span style={{ color: "#fff", fontWeight: 800, fontSize: 26 }}>
                {initials}
              </span>
            )}
          </div>

          {/* Camera button */}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={picLoading}
            style={{
              position: "absolute", bottom: 0, right: 0,
              width: 26, height: 26, borderRadius: "50%",
              background: "#fff", border: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,.2)",
            }}
          >
            {picLoading
              ? <Loader size={13} color="#3a7d1e" style={{ animation: "spin .7s linear infinite" }} />
              : <Camera size={13} color="#3a7d1e" />}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handlePicChange}
          />
        </div>

        {/* Name + shop */}
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontWeight: 800, fontSize: 17, color: "#fff",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {form.full_name || "Seller"}
          </div>
          <div style={{
            fontSize: 13, color: "rgba(255,255,255,.75)", marginTop: 2,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {form.shop_name}
          </div>
          <div style={{ marginTop: 8 }}>
            <span style={{
              fontSize: 11, fontWeight: 700,
              background: form.is_approved ? "rgba(255,255,255,.2)" : "rgba(249,115,22,.35)",
              color: "#fff", borderRadius: 99, padding: "3px 10px",
            }}>
              {form.is_approved ? "✓ Approved" : "⏳ Pending Approval"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Personal Info ── */}
      <Section title="Personal Information" icon={User}>
        <Grid>
          <Field label="Full Name"    name="full_name" value={form.full_name} onChange={handleChange} />
          <Field label="Mobile"       name="mobile"    value={form.mobile}    onChange={handleChange} type="tel" />
        </Grid>
        <Grid>
          <Field label="Email"        name="email"     value={form.email}     onChange={handleChange} readOnly />
          <Field label="Date of Birth" name="dob"      value={form.dob}       onChange={handleChange} type="date" />
        </Grid>
        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: -4 }}>
          Email cannot be changed.
        </div>
      </Section>

      {/* ── Shop Details ── */}
      <Section title="Shop Details" icon={Store}>
        <Grid>
          <Field label="Shop Name"     name="shop_name"     value={form.shop_name}     onChange={handleChange} />
          <Field label="Shop Category" name="shop_category" value={form.shop_category} onChange={handleChange} />
        </Grid>
        <Field
          label="Shop Description"
          name="shop_description"
          value={form.shop_description}
          onChange={handleChange}
        />
        <Grid>
          <Field label="Street / Area" name="shop_street"  value={form.shop_street}  onChange={handleChange} />
          <Field label="City"          name="shop_city"    value={form.shop_city}    onChange={handleChange} />
        </Grid>
        <Grid>
          <Field label="State"         name="shop_state"   value={form.shop_state}   onChange={handleChange} />
          <Field label="Pincode"       name="shop_pincode" value={form.shop_pincode} onChange={handleChange} type="number" />
        </Grid>
        <Grid>
          <Field label="Delivery Charge (₹)" name="delivery_charge" value={form.delivery_charge} onChange={handleChange} type="number" />
        </Grid>
      </Section>

      {/* ── Working Hours ── */}
      <Section title="Working Hours" icon={Clock}>
        <Grid>
          <Field label="Opens At"  name="working_hours_from" value={form.working_hours_from} onChange={handleChange} type="time" />
          <Field label="Closes At" name="working_hours_to"   value={form.working_hours_to}   onChange={handleChange} type="time" />
        </Grid>
      </Section>

      {/* ── Payment ── */}
      <Section title="Payment Details" icon={CreditCard}>
        <Grid>
          <Field label="UPI ID"     name="upi_id"     value={form.upi_id}     onChange={handleChange} />
          <Field label="UPI Mobile" name="upi_mobile" value={form.upi_mobile} onChange={handleChange} type="tel" />
        </Grid>
      </Section>

      {/* ── Pickup Address ── */}
      <Section title="Pickup Address" icon={MapPin} defaultOpen={false}>
        <Field
          label="Same as Shop Address"
          name="same_as_shop"
          value={form.same_as_shop}
          onChange={handleChange}
          options={[
            { value: "1", label: "Yes — same as shop" },
            { value: "0", label: "No — different address" },
          ]}
        />
        {!sameAsShop && (
          <>
            <Grid>
              <Field label="Street / Area" name="pickup_street"  value={form.pickup_street}  onChange={handleChange} />
              <Field label="City"          name="pickup_city"    value={form.pickup_city}    onChange={handleChange} />
            </Grid>
            <Grid>
              <Field label="State"         name="pickup_state"   value={form.pickup_state}   onChange={handleChange} />
              <Field label="Pincode"       name="pickup_pincode" value={form.pickup_pincode} onChange={handleChange} type="number" />
            </Grid>
          </>
        )}
      </Section>

      {/* ── Account Info (read-only) ── */}
      <Section title="Account Info" icon={Package} defaultOpen={false}>
        <Grid>
          <Field label="Account Status" name="_status"  value={form.is_approved ? "Approved" : "Pending Approval"} readOnly />
          <Field label="Member Since"   name="_joined"  value={form.created_at ? new Date(form.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : ""} readOnly />
        </Grid>
      </Section>

      {/* ── Save Button (sticky bottom) ── */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#fff", borderTop: "1px solid #e8f5e1",
        padding: "12px 16px",
        display: "flex", justifyContent: "center",
        zIndex: 100,
      }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: "100%", maxWidth: 400,
            background: saving
              ? "#9ca3af"
              : "linear-gradient(135deg,#2d5a1b,#3a7d1e)",
            color: "#fff", border: "none", borderRadius: 14,
            padding: "14px 24px", fontSize: 15, fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center",
            justifyContent: "center", gap: 8,
            boxShadow: saving ? "none" : "0 4px 16px rgba(58,125,30,.3)",
          }}
        >
          {saving ? (
            <>
              <Loader size={18} style={{ animation: "spin .7s linear infinite" }} />
              Saving…
            </>
          ) : (
            <>
              <Save size={18} />
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}