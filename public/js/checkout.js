(function () {
  const cfg = window.TICKETBOX_CHECKOUT;
  if (!cfg) return;

  const form = document.getElementById('checkout-form');
  const payButton = document.getElementById('pay-button');
  const errorEl = document.getElementById('checkout-error');

  function showError(message) {
    if (!errorEl) return;
    errorEl.hidden = false;
    errorEl.textContent = message;
  }

  function clearError() {
    if (!errorEl) return;
    errorEl.hidden = true;
    errorEl.textContent = '';
  }

  async function createOrder(payload) {
    const res = await fetch(`${cfg.apiBaseUrl}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Could not start checkout');
    }
    return data;
  }

  async function verifyPayment(payload) {
    const res = await fetch(`${cfg.apiBaseUrl}/payment/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Payment verification failed');
    }
    return data;
  }

  function openRazorpay({ order_id, key_id, booking_id }, customer) {
    return new Promise((resolve, reject) => {
      if (typeof Razorpay === 'undefined') {
        reject(new Error('Razorpay Checkout failed to load'));
        return;
      }

      const rzp = new Razorpay({
        key: key_id,
        amount: cfg.amountPaise,
        currency: 'INR',
        name: 'TicketBox',
        description: cfg.eventTitle,
        order_id,
        prefill: {
          name: customer.customer_name,
          email: customer.email,
          contact: customer.phone,
        },
        handler: function (response) {
          resolve({
            order_id: response.razorpay_order_id,
            payment_id: response.razorpay_payment_id,
            signature: response.razorpay_signature,
            booking_id,
          });
        },
        modal: {
          ondismiss: function () {
            reject(new Error('Payment cancelled'));
          },
        },
      });

      rzp.on('payment.failed', function (resp) {
        reject(new Error(resp.error?.description || 'Payment failed'));
      });

      rzp.open();
    });
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    clearError();

    const payload = {
      event_id: Number(form.event_id.value),
      customer_name: form.customer_name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      qty: Number(form.qty.value),
    };

    payButton.disabled = true;
    payButton.textContent = 'Starting payment…';

    try {
      const order = await createOrder(payload);
      const paid = await openRazorpay(order, payload);
      payButton.textContent = 'Verifying…';
      const verified = await verifyPayment({
        order_id: paid.order_id,
        payment_id: paid.payment_id,
        signature: paid.signature,
      });
      window.location.href = `/bookings/${encodeURIComponent(verified.ticket_code)}`;
    } catch (err) {
      showError(err.message || 'Checkout failed');
      payButton.disabled = false;
      payButton.textContent = 'Pay with Razorpay';
    }
  });
})();
