// ui-utils.js - Helper functions for UI rendering and formatting

export function todayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function formatDate(dateString) {
  if (!dateString) return "N/A";
  const dateObj = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(dateObj.getTime())) {
    return String(dateString);
  }
  try {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" })
      .format(dateObj);
  } catch (e) {
    return String(dateString);
  }
}

export function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[character]));
}

export function normalizeContact(value) {
  if (!value) return "";
  const trimmedValue = String(value).trim().toLowerCase();
  const digitsOnly = trimmedValue.replace(/\D/g, "");
  return digitsOnly.length >= 7 ? digitsOnly : trimmedValue.replace(/\s+/g, "");
}

export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(email).trim());
}

export function validatePhoneNumber(phone) {
  // Philippine phone: ONLY 11 digits (09XXXXXXXXX)
  const cleanPhone = String(phone).trim().replace(/\D/g, "");
  
  // Check if it's EXACTLY 11 digits starting with 0
  if (cleanPhone.length === 11 && cleanPhone.startsWith("0")) {
    return true;
  }
  return false;
}

export function isValidContact(contact) {
  // Check if it's an email or phone number
  if (validateEmail(contact)) {
    return true;
  }
  if (validatePhoneNumber(contact)) {
    return true;
  }
  return false;
}

export function animateCount(element, target) {
  const from = Number(element.textContent) || 0;
  if (from === target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    element.textContent = target;
    return;
  }
  window.cancelAnimationFrame(element._countFrame);
  const start = performance.now();
  const duration = 600;
  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = Math.round(from + (target - from) * eased);
    if (progress < 1) element._countFrame = window.requestAnimationFrame(step);
  };
  element._countFrame = window.requestAnimationFrame(step);
}

export function showFeedback(message, elements, isError = false) {
  elements.feedback.textContent = message;
  elements.feedback.className = `feedback show${isError ? " error" : ""}`;
  window.clearTimeout(showFeedback.timeout);
  showFeedback.timeout = window.setTimeout(() => {
    elements.feedback.className = "feedback";
  }, 3500);
}
