/**
 * TurfSync Admin Management Controller
 * Supports multi-venue switching, live court availability matrix,
 * offline booking additions, dynamic pricing rules CRUD, and revenue tracking.
 */

const TurfAdmin = {
  currentVenueId: 'venue-1',

  init() {
    this.setupVenueSelector();
    this.renderKPIs();
    this.renderCourtMatrix();
    this.renderPricingRules();
    this.setupOfflineBookingModal();
  },

  setupVenueSelector() {
    const select = document.getElementById('admin-venue-select');
    if (!select) return;

    const venues = TurfStorage.getVenues();
    select.innerHTML = venues.map(v => `
      <option value="${v.id}" ${v.id === this.currentVenueId ? 'selected' : ''}>${v.name}</option>
    `).join('');

    select.addEventListener('change', (e) => {
      this.currentVenueId = e.target.value;
      this.renderKPIs();
      this.renderCourtMatrix();
      this.renderPricingRules();
      TurfUI.showToast(`Switched venue to ${select.options[select.selectedIndex].text}`, 'info');
    });
  },

  renderKPIs() {
    const bookings = TurfStorage.getBookings().filter(b => b.venueId === this.currentVenueId && b.status === 'CONFIRMED');
    const venue = TurfStorage.getVenueById(this.currentVenueId);
    if (!venue) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const todayBookings = bookings.filter(b => b.date === todayStr);

    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const todayRevenue = todayBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    const totalCourtHours = venue.courts.length * 17; // 6am to 11pm is 17 hours
    const utilizationRate = totalCourtHours > 0 ? Math.round((todayBookings.length / totalCourtHours) * 100) : 0;

    const kpiRev = document.getElementById('kpi-revenue');
    if (kpiRev) kpiRev.textContent = `₹${totalRevenue.toLocaleString('en-IN')}`;

    const kpiTodayRev = document.getElementById('kpi-today-revenue');
    if (kpiTodayRev) kpiTodayRev.textContent = `₹${todayRevenue.toLocaleString('en-IN')}`;

    const kpiBookings = document.getElementById('kpi-bookings-count');
    if (kpiBookings) kpiBookings.textContent = bookings.length;

    const kpiUtil = document.getElementById('kpi-utilization');
    if (kpiUtil) kpiUtil.textContent = `${utilizationRate}%`;
  },

  renderCourtMatrix() {
    const tableBody = document.getElementById('court-matrix-tbody');
    if (!tableBody) return;

    const venue = TurfStorage.getVenueById(this.currentVenueId);
    if (!venue) return;

    const bookings = TurfStorage.getBookings().filter(b => b.venueId === this.currentVenueId);
    const todayStr = new Date().toISOString().split('T')[0];

    let rowsHtml = '';

    venue.courts.forEach(court => {
      const courtBookings = bookings.filter(b => b.courtId === court.id && b.date === todayStr && b.status === 'CONFIRMED');

      rowsHtml += `
        <tr>
          <td>
            <strong>${court.name}</strong>
            <div style="font-size:0.775rem;color:var(--text-muted);">${court.sport} &bull; ${court.surface}</div>
          </td>
          <td>
            <span class="badge ${court.isActive ? 'badge-green' : 'badge-red'}">
              ${court.isActive ? 'Active' : 'Maintenance Blocked'}
            </span>
          </td>
          <td>₹${court.baseRate}/hr</td>
          <td>
            <strong style="color:var(--secondary);">${courtBookings.length} Slots</strong>
            <div style="font-size:0.75rem;color:var(--text-muted);">Occupied Today</div>
          </td>
          <td>
            <div style="display:flex;gap:0.5rem;">
              <button class="btn btn-sm btn-outline-primary" onclick="TurfAdmin.openAddOfflineModal('${court.id}')">
                + Offline Booking
              </button>
              <button class="btn btn-sm btn-outline" onclick="TurfAdmin.toggleCourtStatus('${court.id}')">
                ${court.isActive ? 'Block Court' : 'Unblock Court'}
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    tableBody.innerHTML = rowsHtml;
  },

  toggleCourtStatus(courtId) {
    const venue = TurfStorage.getVenueById(this.currentVenueId);
    const court = venue?.courts.find(c => c.id === courtId);
    if (court) {
      court.isActive = !court.isActive;
      TurfStorage.saveData(TurfStorage.getData());
      this.renderCourtMatrix();
      TurfUI.showToast(`Court status updated: ${court.name} is now ${court.isActive ? 'Active' : 'Blocked'}.`, 'info');
    }
  },

  renderPricingRules() {
    const container = document.getElementById('pricing-rules-list');
    if (!container) return;

    const rules = TurfStorage.getPricingRules(this.currentVenueId);

    if (rules.length === 0) {
      container.innerHTML = `<p style="color:var(--text-muted);font-size:0.9rem;">No active pricing surge rules for this venue. Standard base rates apply.</p>`;
      return;
    }

    container.innerHTML = rules.map(rule => `
      <div class="pricing-rule-item">
        <div class="rule-meta">
          <div class="rule-name">${rule.name}</div>
          <div class="rule-timing">⏰ ${rule.startTime} - ${rule.endTime} &bull; Surge: ${Math.round((rule.multiplier - 1) * 100)}%</div>
        </div>
        <div style="display:flex;align-items:center;gap:0.75rem;">
          <span class="rule-multiplier-badge">${rule.multiplier}x Rate</span>
          <button class="btn btn-sm btn-danger" onclick="TurfAdmin.deletePricingRule('${rule.id}')">Delete</button>
        </div>
      </div>
    `).join('');
  },

  deletePricingRule(ruleId) {
    TurfStorage.deletePricingRule(ruleId);
    this.renderPricingRules();
    TurfUI.showToast('Dynamic pricing rule deleted.', 'info');
  },

  setupOfflineBookingModal() {
    const form = document.getElementById('offline-booking-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const courtId = document.getElementById('off-court-id').value;
      const dateStr = document.getElementById('off-date').value;
      const timeStr = document.getElementById('off-time').value;
      const name = document.getElementById('off-user-name').value.trim() || 'Offline Walk-in';
      const phone = document.getElementById('off-user-phone').value.trim() || '+91 99999 00000';

      const court = TurfStorage.getCourtById(courtId);
      const priceInfo = TurfStorage.calculateSlotPrice(courtId, dateStr, timeStr);

      if (TurfStorage.isSlotBooked(courtId, dateStr, timeStr)) {
        TurfUI.showToast('Slot is already booked! Please select another hour.', 'error');
        return;
      }

      TurfStorage.createBooking({
        venueId: this.currentVenueId,
        courtId: courtId,
        courtName: court.name,
        sport: court.sport,
        venueName: court.venueName,
        userId: 'offline-user',
        userName: name,
        userEmail: 'counter.cash@turfsync.local',
        userPhone: phone,
        date: dateStr,
        startTime: timeStr,
        endTime: `${(parseInt(timeStr.split(':')[0]) + 1).toString().padStart(2, '0')}:00`,
        totalAmount: priceInfo.finalPrice,
        isRecurring: false,
        paymentMethod: 'Cash / On-Site'
      });

      TurfUI.closeModal('offline-booking-modal');
      this.renderKPIs();
      this.renderCourtMatrix();
      TurfUI.showToast(`✓ Offline cash booking created for ${court.name} at ${timeStr}.`, 'success');
    });
  },

  openAddOfflineModal(courtId) {
    const venue = TurfStorage.getVenueById(this.currentVenueId);
    const select = document.getElementById('off-court-id');
    if (!select || !venue) return;

    select.innerHTML = venue.courts.map(c => `
      <option value="${c.id}" ${c.id === courtId ? 'selected' : ''}>${c.name} (${c.sport})</option>
    `).join('');

    const todayStr = new Date().toISOString().split('T')[0];
    document.getElementById('off-date').value = todayStr;

    TurfUI.openModal('offline-booking-modal');
  }
};

window.TurfAdmin = TurfAdmin;
