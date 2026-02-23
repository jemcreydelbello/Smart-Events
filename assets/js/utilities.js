/**
 * Smart Events - Global Utilities
 * Shared utility functions and helpers
 */

/**
 * UI Module - DOM and UI management
 */
const UI = {
  /**
   * Show modal by ID
   */
  showModal: function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('ui-fade-in');
      document.body.style.overflow = 'hidden';
    }
  },

  /**
   * Hide modal by ID
   */
  hideModal: function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = 'auto';
    }
  },

  /**
   * Close all modals
   */
  closeAllModals: function() {
    document.querySelectorAll('[id$="Modal"]').forEach(modal => {
      if (!modal.classList.contains('hidden')) {
        modal.classList.add('hidden');
      }
    });
    document.body.style.overflow = 'auto';
  },

  /**
   * Show notification toast
   */
  showNotification: function(message, type = 'info', duration = 4000) {
    const notificationId = 'notification-' + Date.now();
    const notification = document.createElement('div');
    notification.id = notificationId;
    notification.className = `fixed top-4 right-4 max-w-md p-4 rounded-lg shadow-lg text-white z-50 ui-fade-in`;
    
    const bgColor = {
      'success': 'bg-green-500',
      'error': 'bg-red-500',
      'warning': 'bg-yellow-500',
      'info': 'bg-blue-500'
    }[type] || 'bg-blue-500';
    
    notification.className += ' ' + bgColor;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    if (duration > 0) {
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, duration);
    }
    
    return notificationId;
  },

  /**
   * Show confirmation dialog
   */
  confirm: function(message, onConfirm, onCancel) {
    const confirmed = window.confirm(message);
    if (confirmed && typeof onConfirm === 'function') {
      onConfirm();
    } else if (!confirmed && typeof onCancel === 'function') {
      onCancel();
    }
    return confirmed;
  },

  /**
   * Toggle element visibility
   */
  toggleElement: function(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.classList.toggle('hidden');
    }
  },

  /**
   * Show element
   */
  show: function(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.classList.remove('hidden');
    }
  },

  /**
   * Hide element
   */
  hide: function(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.classList.add('hidden');
    }
  },

  /**
   * Enable element
   */
  enable: function(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.disabled = false;
    }
  },

  /**
   * Disable element
   */
  disable: function(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.disabled = true;
    }
  },

  /**
   * Clear form inputs
   */
  clearForm: function(formId) {
    const form = document.getElementById(formId);
    if (form) {
      form.reset();
      form.querySelectorAll('[data-error]').forEach(el => {
        el.removeAttribute('data-error');
      });
    }
  },

  /**
   * Set form errors
   */
  displayFormErrors: function(formId, errors) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    // Clear existing errors
    form.querySelectorAll('[data-error]').forEach(el => {
      el.removeAttribute('data-error');
    });
    
    // Display new errors
    for (const [fieldName, errorMessage] of Object.entries(errors)) {
      const input = form.querySelector(`[name="${fieldName}"]`);
      if (input) {
        input.setAttribute('data-error', errorMessage);
        input.classList.add('ui-input-error');
      }
    }
  },

  /**
   * Set loading state for button
   */
  setButtonLoading: function(buttonId, isLoading = true) {
    const button = document.getElementById(buttonId);
    if (!button) return;
    
    if (isLoading) {
      button.disabled = true;
      button.dataset.originalText = button.textContent;
      button.innerHTML = '<span class="ui-spinner mr-2"></span>Loading...';
    } else {
      button.disabled = false;
      button.textContent = button.dataset.originalText || 'Submit';
    }
  },

  /**
   * Get form data as object
   */
  getFormData: function(formId) {
    const form = document.getElementById(formId);
    if (!form) return {};
    
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
      data[key] = value;
    }
    
    return data;
  },

  /**
   * Populate form fields with data
   */
  populateForm: function(formId, data) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    for (const [key, value] of Object.entries(data)) {
      const input = form.querySelector(`[name="${key}"]`);
      if (input) {
        if (input.type === 'checkbox') {
          input.checked = value === '1' || value === true;
        } else if (input.type === 'radio') {
          form.querySelector(`[name="${key}"][value="${value}"]`).checked = true;
        } else {
          input.value = value;
        }
      }
    }
  }
};

/**
 * Format Module - Data formatting helpers
 */
const Format = {
  /**
   * Format date to readable string
   */
  date: function(dateString, locale = 'en-US') {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  },

  /**
   * Format date and time
   */
  dateTime: function(dateString, locale = 'en-US') {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  },

  /**
   * Format time
   */
  time: function(timeString, locale = 'en-US') {
    try {
      const [hours, minutes] = timeString.split(':');
      const date = new Date(2000, 0, 1, hours, minutes);
      return date.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return timeString;
    }
  },

  /**
   * Format currency
   */
  currency: function(amount, currency = 'USD', locale = 'en-US') {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency
      }).format(amount);
    } catch (e) {
      return `$${amount.toFixed(2)}`;
    }
  },

  /**
   * Format number with commas
   */
  number: function(number, decimals = 0) {
    try {
      return parseFloat(number).toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
    } catch (e) {
      return number;
    }
  },

  /**
   * Format percentage
   */
  percentage: function(value, decimals = 1) {
    return (parseFloat(value) * 100).toFixed(decimals) + '%';
  },

  /**
   * Truncate text
   */
  truncate: function(text, length = 50, suffix = '...') {
    if (text.length <= length) return text;
    return text.substring(0, length) + suffix;
  },

  /**
   * Capitalize first letter
   */
  capitalize: function(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  /**
   * Convert to slug
   */
  slug: function(str) {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
};

/**
 * Validation Module - Form validation helpers
 */
const Validation = {
  /**
   * Validate email format
   */
  email: function(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  /**
   * Validate phone number
   */
  phone: function(phone) {
    const re = /^[\d\s\-\+\(\)\.]+$/;
    return phone.length >= 10 && re.test(phone);
  },

  /**
   * Validate URL
   */
  url: function(url) {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Validate required field
   */
  required: function(value) {
    return value !== null && value !== undefined && value.toString().trim() !== '';
  },

  /**
   * Validate minimum length
   */
  minLength: function(value, length) {
    return value.toString().length >= length;
  },

  /**
   * Validate maximum length
   */
  maxLength: function(value, length) {
    return value.toString().length <= length;
  },

  /**
   * Validate number
   */
  number: function(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
  },

  /**
   * Validate positive number
   */
  positiveNumber: function(value) {
    return this.number(value) && parseFloat(value) > 0;
  },

  /**
   * Validate date format (YYYY-MM-DD)
   */
  dateFormat: function(date) {
    const re = /^\d{4}-\d{2}-\d{2}$/;
    if (!re.test(date)) return false;
    return !isNaN(Date.parse(date));
  }
};

/**
 * Helper functions
 */

/**
 * Copy text to clipboard
 */
function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      UI.showNotification('Copied to clipboard', 'success', 2000);
    });
  } else {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    UI.showNotification('Copied to clipboard', 'success', 2000);
  }
}

/**
 * Debounce function
 */
function debounce(func, delay = 300) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Throttle function
 */
function throttle(func, limit = 300) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Sleep/delay
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate UUID
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Get query parameters from URL
 */
function getQueryParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

/**
 * Set query parameter in URL
 */
function setQueryParam(name, value) {
  const url = new URL(window.location);
  url.searchParams.set(name, value);
  window.history.pushState({}, '', url);
}

/**
 * Parse JSON safely
 */
function parseJSON(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
}

/**
 * Event delegation helper
 */
function on(selector, event, handler) {
  document.addEventListener(event, (e) => {
    if (e.target.matches(selector) || e.target.closest(selector)) {
      handler.call(e.target, e);
    }
  });
}

/**
 * Ready function (DOMContentLoaded)
 */
function ready(callback) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
}

/**
 * Get element or create default
 */
function getOrCreate(id, tag = 'div') {
  let element = document.getElementById(id);
  if (!element) {
    element = document.createElement(tag);
    element.id = id;
    document.body.appendChild(element);
  }
  return element;
}
