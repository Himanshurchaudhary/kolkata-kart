const API_URL  = import.meta.env.VITE_API_URL;
const getToken = () => localStorage.getItem("userToken");
const headers  = () => ({
  "Content-Type":  "application/json",
  "Authorization": `Bearer ${getToken()}`,
});

// Response parse karo, aur non-2xx par backend ka { message } error ke roop mein throw karo.
// Isse stock/validation errors caller ke catch block mein pahunchte hain.
const parse = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
};

// ─── CART ──────────────────────────────────────────────────────
export const fetchCart = async () => {
  const res = await fetch(`${API_URL}/api/cart`, { headers: headers() });
  return res.json();
};

export const addToCart = async (productId, quantity = 1, variantId = null) => {
  const res = await fetch(`${API_URL}/api/cart/add`, {
    method:  "POST",
    headers: headers(),
    body:    JSON.stringify({ productId, quantity, variantId }),
  });
  const data = await parse(res);
  window.dispatchEvent(new CustomEvent("cart-updated", { detail: data }));
  return data;
};

// ✅ Combo ko ek single cart row ke roop mein add karta hai (comboId bhejo, poora combo object nahi).
// Price backend DB se padhta hai, isliye comboPrice frontend se nahi jaata.
export const addComboToCart = async (comboId, quantity = 1) => {
  const res = await fetch(`${API_URL}/api/cart/add`, {
    method:  "POST",
    headers: headers(),
    body:    JSON.stringify({ comboId, quantity }),
  });
  const data = await parse(res);
  window.dispatchEvent(new CustomEvent("cart-updated", { detail: data }));
  return data;
};

// ✅ cartItemId use karo — product_id nahi
export const updateCartItem = async (cartItemId, quantity) => {
  const res = await fetch(`${API_URL}/api/cart/update/${cartItemId}`, {
    method:  "PUT",
    headers: headers(),
    body:    JSON.stringify({ quantity }),
  });
  const data = await parse(res);
  window.dispatchEvent(new CustomEvent("cart-updated", { detail: data }));
  return data;
};

// ✅ cartItemId use karo — product_id nahi
export const removeFromCart = async (cartItemId) => {
  const res = await fetch(`${API_URL}/api/cart/remove/${cartItemId}`, {
    method:  "DELETE",
    headers: headers(),
  });
  const data = await parse(res);
  window.dispatchEvent(new CustomEvent("cart-updated", { detail: data }));
  return data;
};

export const clearCart = async () => {
  await fetch(`${API_URL}/api/cart/clear`, { method: "DELETE", headers: headers() });
  window.dispatchEvent(new CustomEvent("cart-updated", { detail: { items: [] } }));
};

// ─── WISHLIST (products) ───────────────────────────────────────
export const fetchWishlist = async () => {
  const res = await fetch(`${API_URL}/api/wishlist`, { headers: headers() });
  return res.json();
};

export const addToWishlist = async (productId) => {
  const res = await fetch(`${API_URL}/api/wishlist/add`, {
    method:  "POST",
    headers: headers(),
    body:    JSON.stringify({ productId }),
  });
  const data = await res.json();
  window.dispatchEvent(new CustomEvent("wishlist-updated", { detail: data }));
  return data;
};

export const removeFromWishlist = async (productId) => {
  const res = await fetch(`${API_URL}/api/wishlist/remove/${productId}`, {
    method:  "DELETE",
    headers: headers(),
  });
  const data = await res.json();
  window.dispatchEvent(new CustomEvent("wishlist-updated", { detail: data }));
  return data;
};

export const toggleWishlist = async (productId, isCurrentlyWished) => {
  if (isCurrentlyWished) return removeFromWishlist(productId);
  return addToWishlist(productId);
};

// ─── COMBO WISHLIST ────────────────────────────────────────────
// Combo ek single item ke roop mein save hota hai (uske products alag nahi).
// Jaanbujhkar "wishlist-updated" event nahi bheja, kyunki wo product list ke liye hai.
export const fetchComboWishlist = async () => {
  const res = await fetch(`${API_URL}/api/combo-wishlist`, { headers: headers() });
  return parse(res);
};

export const addComboToWishlist = async (comboId) => {
  const res = await fetch(`${API_URL}/api/combo-wishlist/add`, {
    method:  "POST",
    headers: headers(),
    body:    JSON.stringify({ comboId }),
  });
  const data = await parse(res);
  window.dispatchEvent(new CustomEvent("combo-wishlist-updated", { detail: { action: "add" } }));
  return data;
};

export const removeComboFromWishlist = async (comboId) => {
  const res = await fetch(`${API_URL}/api/combo-wishlist/remove/${comboId}`, {
    method:  "DELETE",
    headers: headers(),
  });
  const data = await parse(res);
  window.dispatchEvent(new CustomEvent("combo-wishlist-updated", { detail: { action: "remove" } }));
  return data;
};

export const toggleComboWishlist = (comboId, isCurrentlyWished) =>
  isCurrentlyWished ? removeComboFromWishlist(comboId) : addComboToWishlist(comboId);