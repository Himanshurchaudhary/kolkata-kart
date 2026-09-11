import { useState } from "react";

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

async function apiFetch(path, options = {}, token = null) {
  const headers = { ...(options.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

function Spinner({ size = "h-5 w-5" }) {
  return (
    <div className={`${size} animate-spin rounded-full border-4 border-green-200 border-t-green-500`} />
  );
}

// ─── Sub-component: Prepaid Confirmation (no payment needed) ─────────────────
function PrepaidConfirmation({ order, onDone }) {
  return (
    <div className="space-y-5">
      {/* Already paid banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-blue-800">Payment Already Received</p>
          <p className="text-xs text-blue-600 mt-0.5">
            This order was prepaid via {order.paymentMethod}. No collection needed.
          </p>
        </div>
      </div>

      {/* Order total */}
      <div className="bg-gray-50 rounded-2xl p-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Order Total</span>
          <span className="text-lg font-bold text-gray-900">₹{order.total?.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center mt-1.5">
          <span className="text-xs text-gray-400">Payment Status</span>
          <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
            Paid
          </span>
        </div>
      </div>

      <button
        onClick={onDone}
        className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3.5 rounded-2xl transition flex items-center justify-center gap-2 text-sm"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
        Confirm Delivery Complete
      </button>
    </div>
  );
}

// ─── Sub-component: COD Cash Collection ──────────────────────────────────────
function CashPaymentOption({ order, token, onSuccess, onError }) {
  const [confirming, setConfirming] = useState(false);

  const handleCashCollected = async () => {
    setConfirming(true);
    try {
      const data = await apiFetch(
        `/driver/my-orders/${order.id}/confirm-payment`,
        { method: "PATCH", body: JSON.stringify({ paymentMode: "Cash" }) },
        token
      );
      onSuccess(data.order, "Cash");
    } catch (err) {
      onError(err.message);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="border-2 border-gray-200 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
          {/* Banknote icon */}
          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Cash</p>
          <p className="text-xs text-gray-500">Collect ₹{order.total?.toLocaleString()} in cash from customer</p>
        </div>
      </div>
      <button
        onClick={handleCashCollected}
        disabled={confirming}
        className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm"
      >
        {confirming ? <Spinner size="h-4 w-4" /> : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {confirming ? "Confirming…" : "Cash Collected — Mark as Paid"}
      </button>
    </div>
  );
}

// ─── Sub-component: COD Online Payment via Razorpay ──────────────────────────
function OnlinePaymentOption({ order, token, onSuccess, onError }) {
  const [initiating, setInitiating] = useState(false);

  const handleRazorpay = async () => {
    setInitiating(true);
    try {
        // ✅ Use driver-scoped route — accepts driver JWT
        const rzpData = await apiFetch(
            `/driver/my-orders/${order.id}/payment-init`,
            { method: "POST" },
            token
        );

        if (!rzpData.success) {
            onError(rzpData.message || "Payment init failed");
            setInitiating(false);
            return;
        }

        const options = {
            key:      rzpData.key_id,
            amount:   rzpData.amount,
            currency: "INR",
            order_id: rzpData.order_id,
            name:     "GraminKart",
            description: `COD Collection — Order #${order.orderNumber}`,
            handler: async (response) => {
                try {
                    // ✅ Use driver-scoped verify route
                    const verify = await apiFetch(
                        `/driver/my-orders/${order.id}/payment-verify`,
                        {
                            method: "POST",
                            body: JSON.stringify({
                                razorpay_order_id:   response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature:  response.razorpay_signature,
                            }),
                        },
                        token
                    );

                    if (!verify.success) {
                        onError("Payment verification failed");
                        setInitiating(false);
                        return;
                    }

                    // Confirm payment on order
                    const data = await apiFetch(
                        `/driver/my-orders/${order.id}/confirm-payment`,
                        {
                            method: "PATCH",
                            body: JSON.stringify({
                                paymentMode:       "Online",
                                razorpayOrderId:   response.razorpay_order_id,
                                razorpayPaymentId: response.razorpay_payment_id,
                            }),
                        },
                        token
                    );
                    onSuccess(data.order, "Online");
                } catch (err) {
                    onError(err.message);
                } finally {
                    setInitiating(false);
                }
            },
            modal: {
                ondismiss: () => setInitiating(false),
            },
        };

        new window.Razorpay(options).open();
    } catch (err) {
        onError(err.message);
        setInitiating(false);
    }
};

  return (
    <div className="border-2 border-gray-200 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          {/* QR / card icon */}
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Online Payment</p>
          <p className="text-xs text-gray-500">UPI / Card — show QR to customer</p>
        </div>
      </div>
      <button
        onClick={handleRazorpay}
        disabled={initiating}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm"
      >
        {initiating ? <Spinner size="h-4 w-4" /> : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8H2a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2v-1" />
          </svg>
        )}
        {initiating ? "Opening Payment…" : "Open Razorpay / QR"}
      </button>
    </div>
  );
}

// ─── COD Payment Collection Panel ────────────────────────────────────────────
function CODPaymentCollection({ order, token, onSuccess, onError }) {
  return (
    <div className="space-y-3">
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-orange-800">Collect Payment from Customer</p>
          <p className="text-xs text-orange-600 mt-0.5">
            Amount due: <span className="font-bold">₹{order.total?.toLocaleString()}</span>
          </p>
        </div>
      </div>

      <CashPaymentOption   order={order} token={token} onSuccess={onSuccess} onError={onError} />
      {/* <OnlinePaymentOption order={order} token={token} onSuccess={onSuccess} onError={onError} /> */}
    </div>
  );
}

// ─── Success Banner ───────────────────────────────────────────────────────────
function DeliverySuccessBanner({ paymentMode }) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center gap-4">
      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-bold text-green-800">Fully Delivered!</p>
        <p className="text-xs text-green-600 mt-0.5">
          {paymentMode === "Cash"
            ? "Cash collected and order completed."
            : paymentMode === "Online"
            ? "Online payment received and order completed."
            : "Prepaid order delivered successfully."}
        </p>
      </div>
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DeliveryConfirmationScreen({ order: initialOrder, token, onCompleted }) {
  const [order, setOrder]             = useState(initialOrder);
  const [error, setError]             = useState("");
  const [completedMode, setCompletedMode] = useState(null); // 'Cash' | 'Online' | 'Prepaid'

  const isCOD     = order.paymentMethod === "COD";
  const isAlreadyPaid = order.paymentStatus === "Paid";

  const handleSuccess = (updatedOrder, mode) => {
    setOrder(updatedOrder);
    setCompletedMode(mode);
    // Bubble up after a short delay so the success banner is visible
    setTimeout(() => onCompleted(updatedOrder), 2200);
  };

  const handleError = (msg) => setError(msg);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Delivery Confirmation
      </h3>

      {/* Order summary pill */}
      <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
        <div>
          <p className="text-xs text-gray-400">Order</p>
          <p className="text-sm font-bold text-gray-900 font-mono">{order.orderNumber}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Total</p>
          <p className="text-sm font-bold text-gray-900">₹{order.total?.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Method</p>
          <p className="text-sm font-semibold text-gray-700">{order.paymentMethod}</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-600 text-xs bg-red-50 rounded-lg px-3 py-2 border border-red-100">
          {error}
        </p>
      )}

      {/* Content — success OR action */}
      {completedMode ? (
        <DeliverySuccessBanner paymentMode={completedMode} />
      ) : isCOD && !isAlreadyPaid ? (
        <CODPaymentCollection
          order={order}
          token={token}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      ) : (
        <PrepaidConfirmation
          order={order}
          onDone={() => {
            setCompletedMode("Prepaid");
            setTimeout(() => onCompleted(order), 2200);
          }}
        />
      )}
    </div>
  );
}