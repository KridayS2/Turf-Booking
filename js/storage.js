/**
 * TurfSync Local Storage & State Management Service
 * Provides full persistence and state methods for multi-venue data,
 * slot bookings, hold reservations, dynamic pricing rules, waitlist, and tiered refunds.
 */

const TurfStorage = {
  STORAGE_KEY: 'TURFSYNC_APP_DATA_V2',

  init() {
    if (!localStorage.getItem(this.STORAGE_KEY)) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(DEFAULT_DATA));
    }
  },

  getData() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || DEFAULT_DATA;
    } catch (e) {
      console.error('Failed to parse local storage data, resetting...', e);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(DEFAULT_DATA));
      return DEFAULT_DATA;
    }
  },

  saveData(data) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  },

  // Venue Operations
  getVenues() {
    return this.getData().venues || [];
  },

  getVenueById(id) {
    return this.getVenues().find(v => v.id === id) || null;
  },

  getCourtById(courtId) {
    for (const venue of this.getVenues()) {
      const court = venue.courts.find(c => c.id === courtId);
      if (court) return { ...court, venueId: venue.id, venueName: venue.name };
    }
    return null;
  },

  // Pricing Engine Evaluation
  calculateSlotPrice(courtId, dateStr, timeStr) {
    const court = this.getCourtById(courtId);
    if (!court) return { basePrice: 0, finalPrice: 0, multipliers: [], badge: null };

    const data = this.getData();
    const rules = (data.pricingRules || []).filter(r => r.venueId === court.venueId);

    // Calculate day of week: JS getDay() is 0 (Sun) to 6 (Sat). We map 1(Sun)..7(Sat) or check day
    const dateObj = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = dateObj.getDay() === 0 ? 7 : dateObj.getDay(); // 1=Mon..7=Sun

    let totalMultiplier = 1.0;
    let appliedRules = [];
    let badgeText = null;

    const [hour] = timeStr.split(':').map(Number);

    for (const rule of rules) {
      const [startH] = rule.startTime.split(':').map(Number);
      const [endH] = rule.endTime.split(':').map(Number);

      const matchesDay = !rule.days || rule.days.includes(dayOfWeek);
      const matchesTime = hour >= startH && hour < endH;

      if (matchesDay && matchesTime) {
        totalMultiplier *= rule.multiplier;
        appliedRules.push(rule);
        badgeText = rule.badgeText;
      }
    }

    const finalPrice = Math.round(court.baseRate * totalMultiplier);

    return {
      basePrice: court.baseRate,
      finalPrice: finalPrice,
      multiplier: totalMultiplier,
      appliedRules: appliedRules,
      badge: badgeText
    };
  },

  // Booking Operations
  getBookings() {
    return this.getData().bookings || [];
  },

  getBookingById(id) {
    return this.getBookings().find(b => b.id === id) || null;
  },

  getUserBookings(userEmail = 'alex.player@example.com') {
    return this.getBookings().filter(b => b.userEmail === userEmail || b.userId === 'user-1');
  },

  isSlotBooked(courtId, dateStr, timeStr) {
    const bookings = this.getBookings();
    return bookings.some(b => 
      b.courtId === courtId && 
      b.date === dateStr && 
      b.startTime === timeStr && 
      (b.status === 'CONFIRMED' || b.status === 'HOLD')
    );
  },

  getSlotStatus(courtId, dateStr, timeStr) {
    const booking = this.getBookings().find(b => 
      b.courtId === courtId && 
      b.date === dateStr && 
      b.startTime === timeStr && 
      (b.status === 'CONFIRMED' || b.status === 'HOLD')
    );
    if (!booking) return 'AVAILABLE';
    return booking.status; // 'CONFIRMED' or 'HOLD'
  },

  createBooking(bookingPayload) {
    const data = this.getData();
    const newBooking = {
      id: `TS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      status: 'CONFIRMED',
      paymentStatus: 'SUCCEEDED',
      ...bookingPayload
    };

    data.bookings.unshift(newBooking);
    this.saveData(data);
    return newBooking;
  },

  // Tiered Cancellation Engine
  calculateRefund(booking) {
    const bookingDateTime = new Date(`${booking.date}T${booking.startTime}:00`);
    const now = new Date();
    const diffHours = (bookingDateTime - now) / (1000 * 60 * 60);

    let refundPercent = 0;
    let tierLabel = '';

    if (diffHours >= 24) {
      refundPercent = 100;
      tierLabel = 'Full Refund (>24h Notice)';
    } else if (diffHours >= 12 && diffHours < 24) {
      refundPercent = 50;
      tierLabel = '50% Partial Refund (12h–24h Notice)';
    } else {
      refundPercent = 0;
      tierLabel = 'No Refund (<12h Notice)';
    }

    const refundAmount = Math.round((booking.totalAmount * refundPercent) / 100);

    return {
      diffHours: Math.max(0, diffHours.toFixed(1)),
      refundPercent,
      tierLabel,
      refundAmount,
      currency: '₹'
    };
  },

  cancelBooking(bookingId, reason = 'Player requested cancellation') {
    const data = this.getData();
    const booking = data.bookings.find(b => b.id === bookingId);
    if (!booking) return null;

    const refundInfo = this.calculateRefund(booking);

    booking.status = 'CANCELLED';
    booking.cancelledAt = new Date().toISOString();
    booking.cancellationReason = reason;
    booking.refundAmount = refundInfo.refundAmount;
    booking.refundPercent = refundInfo.refundPercent;
    booking.paymentStatus = refundInfo.refundPercent > 0 ? (refundInfo.refundPercent === 100 ? 'REFUNDED' : 'PARTIALLY_REFUNDED') : 'SUCCEEDED';

    this.saveData(data);

    // Auto promote waitlist if exists for this slot
    this.promoteWaitlistForSlot(booking.courtId, booking.date, booking.startTime);

    return { booking, refundInfo };
  },

  // Waitlist System
  joinWaitlist(entry) {
    const data = this.getData();
    const newEntry = {
      id: `wl-${Date.now()}`,
      status: 'WAITING',
      createdAt: new Date().toISOString(),
      ...entry
    };
    data.waitlist = data.waitlist || [];
    data.waitlist.push(newEntry);
    this.saveData(data);
    return newEntry;
  },

  promoteWaitlistForSlot(courtId, dateStr, timeStr) {
    const data = this.getData();
    const candidate = (data.waitlist || []).find(w => 
      w.courtId === courtId && 
      w.date === dateStr && 
      w.startTime === timeStr && 
      w.status === 'WAITING'
    );
    if (candidate) {
      candidate.status = 'NOTIFIED';
      candidate.notifiedAt = new Date().toISOString();
      this.saveData(data);
      console.log(`[Waitlist Notification Triggered] Email/SMS sent to ${candidate.userName} (${candidate.userEmail}) for released slot.`);
    }
  },

  // Dynamic Pricing Rules Management
  getPricingRules(venueId) {
    const rules = this.getData().pricingRules || [];
    if (!venueId) return rules;
    return rules.filter(r => r.venueId === venueId);
  },

  addPricingRule(rule) {
    const data = this.getData();
    const newRule = {
      id: `rule-${Date.now()}`,
      ...rule
    };
    data.pricingRules.push(newRule);
    this.saveData(data);
    return newRule;
  },

  deletePricingRule(ruleId) {
    const data = this.getData();
    data.pricingRules = (data.pricingRules || []).filter(r => r.id !== ruleId);
    this.saveData(data);
  },

  // Reviews
  getVenueReviews(venueId) {
    return (this.getData().reviews || []).filter(r => r.venueId === venueId);
  },

  addReview(review) {
    const data = this.getData();
    const newReview = {
      id: `rev-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      ...review
    };
    data.reviews.unshift(newReview);
    this.saveData(data);
    return newReview;
  },

  resetData() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(DEFAULT_DATA));
  }
};

TurfStorage.init();
