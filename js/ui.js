/**
 * TurfSync UI Utilities & Helpers
 * Includes Toast Notifications, Native Dialog Controllers, Formatters, and Navbar Helpers.
 */

const TurfUI = {
  // Toast Notification System
  showToast(message, type = 'info', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ';
    toast.innerHTML = `
      <div style="display:flex;align-items:center;gap:0.6rem;">
        <span style="font-weight:bold;font-size:1.1rem;">${icon}</span>
        <span>${message}</span>
      </div>
      <button style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:1.1rem;" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }
    }, duration);
  },

  // Native Dialog Controller
  openModal(modalId) {
    const dialog = document.getElementById(modalId);
    if (dialog && typeof dialog.showModal === 'function') {
      dialog.showModal();
    }
  },

  closeModal(modalId) {
    const dialog = document.getElementById(modalId);
    if (dialog && typeof dialog.close === 'function') {
      dialog.close();
    }
  },

  // Setup click outside to dismiss native dialog
  setupModalBackdropDismiss() {
    document.querySelectorAll('dialog.modal').forEach(dialog => {
      dialog.addEventListener('click', (event) => {
        const rect = dialog.getBoundingClientRect();
        const isInDialog = (
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width
        );
        if (!isInDialog) {
          dialog.close();
        }
      });
    });
  },

  // Currency & Date Formatters
  formatCurrency(amount, currency = '₹') {
    return `${currency}${Number(amount).toLocaleString('en-IN')}`;
  },

  formatDate(dateStr) {
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', options);
  },

  formatTime(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    return `${displayHour}:${m === 0 ? '00' : m} ${period}`;
  },

  // Mobile Menu Toggle
  setupMobileNav() {
    const btn = document.querySelector('.mobile-menu-btn');
    const links = document.querySelector('.nav-links');
    if (btn && links) {
      btn.addEventListener('click', () => {
        links.classList.toggle('mobile-open');
      });
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  TurfUI.setupModalBackdropDismiss();
  TurfUI.setupMobileNav();
});
