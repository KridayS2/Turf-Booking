/**
 * TurfSync Checkout & Booking Confirmation Controller
 * Manages checkout summary calculations, dynamic pricing breakdowns,
 * mock Stripe card / UPI payment processing, and confirmation passes.
 */

const TurfBookingFlow = {
  checkoutSession: null,

  initCheckout() {
    const rawSession = localStorage.getItem('TURFSYNC_CHECKOUT_SESSION');
    if (!rawSession) {
      window.location.href = 'venues.html';
      return;
    }

    try {
      this.checkoutSession = JSON.parse(rawSession);
    } catch (e) {
      window.location.href = 'venues.html';
      return;
    }

    this.renderCheckoutSummary();
    this.setupPaymentForm();
  },

  renderCheckoutSummary() {
    const session = this.checkoutSession;
    const container = document.getElementById('checkout-items-list');
    if (!container || !session.slots || session.slots.length === 0) return;

    let subtotal = 0;

    container.innerHTML = session.slots.map(slot => {
      const slotTotal = session.isRecurring ? slot.price * 4 : slot.price;
      subtotal += slotTotal;

      return `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:1rem 0;border-bottom:1px solid var(--border);">
          <div>
            <div style="font-weight:700;font-size:1rem;color:var(--secondary);">${slot.courtName}</div>
            <div style="font-size:0.85rem;color:var(--text-muted);margin-top:0.2rem;">
              📍 ${slot.venueName} &bull; ⚽ ${slot.sport}
            </div>
            <div style="font-size:0.825rem;color:var(--primary-dark);font-weight:600;margin-top:0.25rem;">
              📅 ${TurfUI.formatDate(slot.dateStr)} at ${TurfUI.formatTime(slot.timeStr)} (1 Hour)
            </div>
            ${slot.badge ? `<span class="badge badge-amber" style="margin-top:0.35rem;">${slot.badge}</span>` : ''}
            ${session.isRecurring ? `<span class="badge badge-blue" style="margin-top:0.35rem;">4-Week Recurring Plan</span>` : ''}
          </div>
          <div style="text-align:right;">
            <div style="font-weight:800;font-size:1.1rem;color:var(--secondary);">₹${slotTotal.toLocaleString('en-IN')}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);">Base: ₹${slot.basePrice}/hr</div>
          </div>
        </div>
      `;
    }).join('');

    const taxAmount = Math.round(subtotal * 0.18); // 18% GST standard
    const finalTotal = subtotal + taxAmount;

    document.getElementById('summary-subtotal').textContent = `₹${subtotal.toLocaleString('en-IN')}`;
    document.getElementById('summary-tax').textContent = `₹${taxAmount.toLocaleString('en-IN')}`;
    document.getElementById('summary-total').textContent = `₹${finalTotal.toLocaleString('en-IN')}`;
  },

  setupPaymentForm() {
    const form = document.getElementById('payment-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.processPayment();
    });
  },

  processPayment() {
    const payBtn = document.getElementById('pay-submit-btn');
    if (payBtn) {
      payBtn.disabled = true;
      payBtn.innerHTML = `
        <span style="display:inline-block;animation:spin 1s linear infinite;">↻</span>
        Connecting to Stripe Secure Gateway...
      `;
    }

    const name = document.getElementById('payer-name').value.trim() || 'Alex Morgan';
    const email = document.getElementById('payer-email').value.trim() || 'alex.player@example.com';
    const phone = document.getElementById('payer-phone').value.trim() || '+91 98765 43210';

    // Simulate 1.2s Stripe network latency
    setTimeout(() => {
      const createdBookings = [];
      const session = this.checkoutSession;

      session.slots.forEach(slot => {
        const booking = TurfStorage.createBooking({
          venueId: slot.venueId,
          courtId: slot.courtId,
          courtName: slot.courtName,
          sport: slot.sport,
          venueName: slot.venueName,
          userId: 'user-1',
          userName: name,
          userEmail: email,
          userPhone: phone,
          date: slot.dateStr,
          startTime: slot.timeStr,
          endTime: `${(parseInt(slot.timeStr.split(':')[0]) + 1).toString().padStart(2, '0')}:00`,
          totalAmount: session.isRecurring ? slot.price * 4 : slot.price,
          isRecurring: session.isRecurring,
          paymentMethod: 'Stripe Card (•••• 4242)'
        });
        createdBookings.push(booking);
      });

      // Clear checkout session
      localStorage.removeItem('TURFSYNC_CHECKOUT_SESSION');

      // Save confirmation payload
      localStorage.setItem('TURFSYNC_CONFIRMATION_PAYLOAD', JSON.stringify({
        bookings: createdBookings,
        payer: { name, email, phone }
      }));

      // Render confirmation view
      document.getElementById('checkout-step-payment').style.display = 'none';
      document.getElementById('checkout-step-success').style.display = 'block';
      this.renderConfirmation(createdBookings);
      TurfUI.showToast('✓ Payment Successful! Your slot is officially confirmed.', 'success');
    }, 1200);
  },

  renderConfirmation(bookings) {
    const listEl = document.getElementById('confirmation-bookings-list');
    if (!listEl) return;

    listEl.innerHTML = bookings.map(b => `
      <div style="background:var(--bg-subtle);border-radius:var(--radius-md);padding:1.25rem;margin-bottom:1rem;border:1px solid var(--border);">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span class="badge badge-green">Confirmed Pass</span>
          <strong style="color:var(--secondary);font-family:monospace;font-size:1rem;">#${b.id}</strong>
        </div>
        <h3 style="margin-top:0.6rem;font-size:1.15rem;color:var(--secondary);">${b.courtName}</h3>
        <p style="font-size:0.875rem;color:var(--text-muted);">📍 ${b.venueName}</p>
        <div style="margin-top:0.75rem;font-size:0.9rem;font-weight:600;color:var(--primary-dark);">
          📅 ${TurfUI.formatDate(b.date)} &bull; ⏰ ${TurfUI.formatTime(b.startTime)} - ${TurfUI.formatTime(b.endTime)}
        </div>
      </div>
    `).join('');
  }
};

window.TurfBookingFlow = TurfBookingFlow;
