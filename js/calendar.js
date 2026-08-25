/**
 * TurfSync Interactive Calendar Engine
 * Renders weekly slot matrix, evaluates dynamic pricing, handles slot selections,
 * manages the booking dock, and triggers waitlist modal for occupied slots.
 */

const TurfCalendar = {
  currentVenueId: 'venue-1',
  selectedCourtId: 'court-1',
  weekStartDate: null,
  selectedSlots: [], // Array of { courtId, courtName, dateStr, timeStr, price, surgeBadge }
  isRecurring: false,

  init() {
    // Determine current Monday as the start of the week
    const now = new Date();
    const day = now.getDay(); // 0 is Sun, 1 is Mon
    const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
    this.weekStartDate = new Date(now.setDate(diffToMonday));
    this.weekStartDate.setHours(0, 0, 0, 0);

    // Read URL parameters if any
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('venue')) this.currentVenueId = urlParams.get('venue');
    if (urlParams.get('court')) this.selectedCourtId = urlParams.get('court');

    this.renderCourtTabs();
    this.renderWeek();
    this.setupEventListeners();
  },

  setupEventListeners() {
    document.getElementById('prev-week-btn')?.addEventListener('click', () => {
      this.weekStartDate.setDate(this.weekStartDate.getDate() - 7);
      this.renderWeek();
    });

    document.getElementById('next-week-btn')?.addEventListener('click', () => {
      this.weekStartDate.setDate(this.weekStartDate.getDate() + 7);
      this.renderWeek();
    });

    document.getElementById('today-btn')?.addEventListener('click', () => {
      const now = new Date();
      const day = now.getDay();
      const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
      this.weekStartDate = new Date(now.setDate(diffToMonday));
      this.weekStartDate.setHours(0, 0, 0, 0);
      this.renderWeek();
    });

    const recurringCheckbox = document.getElementById('dock-recurring-checkbox');
    if (recurringCheckbox) {
      recurringCheckbox.addEventListener('change', (e) => {
        this.isRecurring = e.target.checked;
        this.updateDock();
      });
    }

    document.getElementById('dock-checkout-btn')?.addEventListener('click', () => {
      this.proceedToCheckout();
    });
  },

  renderCourtTabs() {
    const venue = TurfStorage.getVenueById(this.currentVenueId);
    const container = document.getElementById('court-tabs-container');
    if (!venue || !container) return;

    // Update venue header info if elements exist
    const venueNameEl = document.getElementById('venue-name-header');
    if (venueNameEl) venueNameEl.textContent = venue.name;
    const venueTaglineEl = document.getElementById('venue-tagline-header');
    if (venueTaglineEl) venueTaglineEl.textContent = venue.tagline;

    container.innerHTML = venue.courts.map((court, idx) => {
      const isSelected = court.id === this.selectedCourtId || (!this.selectedCourtId && idx === 0);
      if (isSelected) this.selectedCourtId = court.id;

      const sportEmoji = court.sport === 'FOOTBALL' ? '⚽' : court.sport === 'CRICKET' ? '🏏' : court.sport === 'BADMINTON' ? '🏸' : court.sport === 'TENNIS' ? '🎾' : '🏓';

      return `
        <button class="court-tab ${isSelected ? 'active' : ''}" data-court-id="${court.id}">
          <span>${sportEmoji}</span>
          <span>${court.name}</span>
          <span class="badge ${isSelected ? 'badge-green' : 'badge-gray'}" style="margin-left:0.3rem;">₹${court.baseRate}/hr</span>
        </button>
      `;
    }).join('');

    container.querySelectorAll('.court-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        container.querySelectorAll('.court-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.selectedCourtId = tab.dataset.courtId;
        this.selectedSlots = []; // Clear selection across court switch
        this.updateDock();
        this.renderWeek();
      });
    });
  },

  getDaysOfWeek() {
    const days = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(this.weekStartDate);
      d.setDate(d.getDate() + i);
      const isoDate = d.toISOString().split('T')[0];
      days.push({
        dateObj: d,
        isoDate: isoDate,
        dayName: dayNames[i],
        dayNumber: d.getDate(),
        monthName: d.toLocaleString('en-US', { month: 'short' }),
        isToday: new Date().toISOString().split('T')[0] === isoDate
      });
    }
    return days;
  },

  renderWeek() {
    const days = this.getDaysOfWeek();
    const grid = document.getElementById('calendar-grid');
    if (!grid) return;

    // Update Current Week Label
    const weekLabel = document.getElementById('current-week-label');
    if (weekLabel) {
      weekLabel.textContent = `${days[0].monthName} ${days[0].dayNumber} – ${days[6].monthName} ${days[6].dayNumber}, ${days[0].dateObj.getFullYear()}`;
    }

    const court = TurfStorage.getCourtById(this.selectedCourtId);
    const venue = court ? TurfStorage.getVenueById(court.venueId) : null;
    const startHour = venue ? parseInt(venue.openingTime.split(':')[0]) : 6;
    const endHour = venue ? parseInt(venue.closingTime.split(':')[0]) : 23;

    let html = '';

    // Top Header Row
    html += `<div class="grid-header time-col-header"><span class="day-name">TIME</span></div>`;
    days.forEach(day => {
      html += `
        <div class="grid-header ${day.isToday ? 'today' : ''}">
          <div class="day-name">${day.dayName}</div>
          <div class="day-date">${day.monthName} ${day.dayNumber}</div>
        </div>
      `;
    });

    // Time Slot Rows
    for (let h = startHour; h < endHour; h++) {
      const timeStr = `${h.toString().padStart(2, '0')}:00`;
      const displayTime = TurfUI.formatTime(timeStr);

      html += `<div class="time-cell">${displayTime}</div>`;

      days.forEach(day => {
        const slotStatus = TurfStorage.getSlotStatus(this.selectedCourtId, day.isoDate, timeStr);
        const priceInfo = TurfStorage.calculateSlotPrice(this.selectedCourtId, day.isoDate, timeStr);
        
        const isSelected = this.selectedSlots.some(s => 
          s.courtId === this.selectedCourtId && s.dateStr === day.isoDate && s.timeStr === timeStr
        );

        let cellClass = 'slot-available';
        let slotContent = '';

        if (slotStatus === 'CONFIRMED') {
          cellClass = 'slot-booked';
          slotContent = `
            <span class="slot-booked-label">BOOKED</span>
            <span class="slot-waitlist-hint">Join Waitlist</span>
          `;
        } else if (slotStatus === 'HOLD') {
          cellClass = 'slot-hold';
          slotContent = `
            <span class="slot-hold-label">IN CHECKOUT</span>
          `;
        } else {
          if (isSelected) {
            cellClass = 'slot-selected';
          }
          slotContent = `
            <span class="slot-price">₹${priceInfo.finalPrice}</span>
            ${priceInfo.badge ? `<span class="slot-surge-badge">${priceInfo.badge}</span>` : ''}
          `;
        }

        html += `
          <div class="slot-cell ${cellClass}" data-date="${day.isoDate}" data-time="${timeStr}">
            <button class="slot-btn" onclick="TurfCalendar.handleSlotClick('${day.isoDate}', '${timeStr}', '${slotStatus}')">
              ${slotContent}
            </button>
          </div>
        `;
      });
    }

    grid.innerHTML = html;
  },

  handleSlotClick(dateStr, timeStr, status) {
    if (status === 'CONFIRMED') {
      this.openWaitlistModal(dateStr, timeStr);
      return;
    }

    if (status === 'HOLD') {
      TurfUI.showToast('This slot is temporarily locked by another user in checkout.', 'warning');
      return;
    }

    const court = TurfStorage.getCourtById(this.selectedCourtId);
    const priceInfo = TurfStorage.calculateSlotPrice(this.selectedCourtId, dateStr, timeStr);

    const existingIndex = this.selectedSlots.findIndex(s => 
      s.courtId === this.selectedCourtId && s.dateStr === dateStr && s.timeStr === timeStr
    );

    if (existingIndex > -1) {
      this.selectedSlots.splice(existingIndex, 1);
    } else {
      this.selectedSlots.push({
        courtId: this.selectedCourtId,
        courtName: court.name,
        venueId: court.venueId,
        venueName: court.venueName,
        sport: court.sport,
        dateStr: dateStr,
        timeStr: timeStr,
        price: priceInfo.finalPrice,
        basePrice: priceInfo.basePrice,
        multiplier: priceInfo.multiplier,
        badge: priceInfo.badge
      });
    }

    this.updateDock();
    this.renderWeek();
  },

  updateDock() {
    const dock = document.getElementById('booking-dock');
    if (!dock) return;

    if (this.selectedSlots.length === 0) {
      dock.classList.remove('active');
      return;
    }

    dock.classList.add('active');

    const totalSlots = this.selectedSlots.length;
    let subtotal = this.selectedSlots.reduce((sum, s) => sum + s.price, 0);

    if (this.isRecurring) {
      // 4 weeks monthly repeat estimate
      subtotal = subtotal * 4;
    }

    const slotsCountEl = document.getElementById('dock-slots-count');
    if (slotsCountEl) slotsCountEl.textContent = `${totalSlots} Slot${totalSlots > 1 ? 's' : ''} Selected ${this.isRecurring ? '(4-Wk Plan)' : ''}`;

    const totalAmountEl = document.getElementById('dock-total-amount');
    if (totalAmountEl) totalAmountEl.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
  },

  openWaitlistModal(dateStr, timeStr) {
    const court = TurfStorage.getCourtById(this.selectedCourtId);
    const modal = document.getElementById('waitlist-modal');
    if (!modal) return;

    document.getElementById('wl-court-name').textContent = court.name;
    document.getElementById('wl-slot-time').textContent = `${TurfUI.formatDate(dateStr)} at ${TurfUI.formatTime(timeStr)}`;
    
    // Store in hidden fields
    document.getElementById('wl-court-id').value = this.selectedCourtId;
    document.getElementById('wl-date').value = dateStr;
    document.getElementById('wl-time').value = timeStr;

    TurfUI.openModal('waitlist-modal');
  },

  submitWaitlist() {
    const courtId = document.getElementById('wl-court-id').value;
    const dateStr = document.getElementById('wl-date').value;
    const timeStr = document.getElementById('wl-time').value;
    const name = document.getElementById('wl-user-name').value.trim();
    const email = document.getElementById('wl-user-email').value.trim();
    const phone = document.getElementById('wl-user-phone').value.trim();

    if (!name || !email) {
      TurfUI.showToast('Please provide your name and email to join the waitlist.', 'error');
      return;
    }

    TurfStorage.joinWaitlist({
      courtId,
      date: dateStr,
      startTime: timeStr,
      userName: name,
      userEmail: email,
      userPhone: phone
    });

    TurfUI.closeModal('waitlist-modal');
    TurfUI.showToast('✓ Successfully joined waitlist! We will alert you immediately if this slot opens up.', 'success');
  },

  proceedToCheckout() {
    if (this.selectedSlots.length === 0) return;

    // Save temporary checkout session in localStorage
    const checkoutSession = {
      slots: this.selectedSlots,
      isRecurring: this.isRecurring,
      createdAt: new Date().toISOString()
    };

    localStorage.setItem('TURFSYNC_CHECKOUT_SESSION', JSON.stringify(checkoutSession));
    window.location.href = 'checkout.html';
  }
};

window.TurfCalendar = TurfCalendar;
