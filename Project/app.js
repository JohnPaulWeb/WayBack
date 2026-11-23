/* =============================================================
   WayBack — app.js
   Event-Driven Programming | EDP Group 4 | November 2026

   Structure:
   1.  Constants
   2.  State
   3.  Utility functions
   4.  Storage functions
   5.  UI / DOM helpers
   6.  Form functions
   7.  Dialog functions
   8.  Render functions
   9.  Navigation
   10. ── EVENT LISTENERS ──
   11. Init
   ============================================================= */


/* ── 1. CONSTANTS ─────────────────────────────────────────── */

const STORAGE_KEY        = "wayback-posts";
const LEGACY_STORAGE_KEY = "findit-posts";
const MAX_IMAGE_SIZE     = 1024 * 1024;                            // 1 MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];


/* ── 2. STATE ─────────────────────────────────────────────── */

let posts         = [];   // populated in init
let pendingDeleteId = "";
let pendingPublish  = false;
let selectedImageData = "";
let lastFocused   = null;
let feedbackTimeout = null;  // fix: was stored on the function itself


/* ── DOM ELEMENT REFERENCES ───────────────────────────────── */

const elements = {
  form:               document.querySelector("#postForm"),
  postId:             document.querySelector("#postId"),
  itemImage:          document.querySelector("#itemImage"),
  imagePreview:       document.querySelector("#imagePreview"),
  imagePreviewPhoto:  document.querySelector("#imagePreviewPhoto"),
  removeImage:        document.querySelector("#removeImage"),
  type:               document.querySelector("#type"),
  typeSegment:        document.querySelector("#typeSegment"),
  item:               document.querySelector("#item"),
  description:        document.querySelector("#description"),
  descCount:          document.querySelector("#descCount"),
  location:           document.querySelector("#location"),
  date:               document.querySelector("#date"),
  contact:            document.querySelector("#contact"),
  submitText:         document.querySelector("#submitText"),
  cancelEdit:         document.querySelector("#cancelEdit"),
  formTitle:          document.querySelector("#formTitle"),
  search:             document.querySelector("#search"),
  typeFilter:         document.querySelector("#typeFilter"),
  statusFilter:       document.querySelector("#statusFilter"),
  sort:               document.querySelector("#sort"),
  postList:           document.querySelector("#postList"),
  resultCount:        document.querySelector("#resultCount"),
  openCount:          document.querySelector("#openCount"),
  totalCount:         document.querySelector("#totalCount"),
  openLostCount:      document.querySelector("#openLostCount"),
  openFoundCount:     document.querySelector("#openFoundCount"),
  resolvedCount:      document.querySelector("#resolvedCount"),
  deleteDialog:       document.querySelector("#deleteDialog"),
  deleteDialogTitle:  document.querySelector("#deleteDialogTitle"),
  deleteDialogQuestion: document.querySelector("#deleteDialogQuestion"),
  deleteDialogMessage:  document.querySelector("#deleteDialogMessage"),
  cancelDelete:       document.querySelector("#cancelDelete"),
  confirmDelete:      document.querySelector("#confirmDelete"),
  feedback:           document.querySelector("#feedback"),
  backToTop:          document.querySelector("#backToTop"),
  drawer:             document.querySelector("#post-item"),
  drawerBackdrop:     document.querySelector("#drawerBackdrop"),
  closeDrawerBtn:     document.querySelector("#closeDrawer"),
  openFormBtn:        document.querySelector("#openFormBtn"),
  typeHint:           document.querySelector("#typeHint"),
  locationLabel:      document.querySelector("#locationLabel"),
  dateLabel:          document.querySelector("#dateLabel"),
  tickerTrack:        document.querySelector(".ticker-track"),
};


/* ── 3. UTILITY FUNCTIONS ─────────────────────────────────── */

function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try { return crypto.randomUUID(); } catch (e) { /* fall through */ }
  }
  return "post_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
}

function todayString() {
  const now   = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day   = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const dateObj = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(dateObj.getTime())) return String(dateString);
  try {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" })
      .format(dateObj);
  } catch (e) {
    return String(dateString);
  }
}

function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[ch]));
}

function normalizeContact(value) {
  if (!value) return "";
  const trimmed    = String(value).trim().toLowerCase();
  const digitsOnly = trimmed.replace(/\D/g, "");
  return digitsOnly.length >= 7 ? digitsOnly : trimmed.replace(/\s+/g, "");
}


/* ── 4. STORAGE FUNCTIONS ─────────────────────────────────── */

function loadPosts() {
  try {
    // Migrate posts saved under the old app name on first run
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw) localStorage.setItem(STORAGE_KEY, raw);
    }
    if (!raw) return [];
    const saved = JSON.parse(raw);
    if (!Array.isArray(saved)) return [];
    return saved
      .filter((item) => item && typeof item === "object")
      .map((item) => ({
        id:          item.id          || generateId(),
        type:        item.type === "Found" ? "Found" : "Lost",
        status:      item.status === "Resolved" ? "Resolved" : "Open",
        item:        item.item        || "",
        description: item.description || "",
        location:    item.location    || "",
        date:        item.date        || "",
        contact:     item.contact     || "",
        image:       item.image       || "",
      }));
  } catch (error) {
    showFeedback("Saved posts could not be loaded.", true);
    return [];
  }
}

function savePosts() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  } catch (error) {
    showFeedback("Your browser could not save this post. The photo may be too large.", true);
  }
}


/* ── 5. UI / DOM HELPERS ──────────────────────────────────── */

function showFeedback(message, isError = false) {
  elements.feedback.textContent = message;
  elements.feedback.className   = `feedback show${isError ? " error" : ""}`;
  window.clearTimeout(feedbackTimeout);
  feedbackTimeout = window.setTimeout(() => {
    elements.feedback.className = "feedback";
  }, 3500);
}

function animateCount(element, target) {
  const from = Number(element.textContent) || 0;
  if (from === target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    element.textContent = target;
    return;
  }
  window.cancelAnimationFrame(element._countFrame);
  const start    = performance.now();
  const duration = 600;
  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3);
    element.textContent = Math.round(from + (target - from) * eased);
    if (progress < 1) element._countFrame = window.requestAnimationFrame(step);
  };
  element._countFrame = window.requestAnimationFrame(step);
}

function setType(value) {
  const type    = value === "Found" ? "Found" : "Lost";
  const isFound = type === "Found";

  elements.type.value = type;
  elements.typeSegment.querySelectorAll(".seg").forEach((btn) => {
    const active = btn.dataset.value === type;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-checked", String(active));
  });

  elements.drawer.dataset.type   = type;
  elements.typeHint.textContent  = isFound
    ? "You found something. Describe it without giving away every detail, so only the real owner can claim it."
    : "You lost something. Add where you last had it and any marks that make it easy to recognize.";
  elements.locationLabel.textContent = isFound ? "Where did you find it?" : "Last seen location";
  elements.dateLabel.textContent     = isFound ? "Date found"             : "Date lost";
  elements.item.placeholder          = isFound ? "e.g. Blue umbrella"     : "e.g. Black leather wallet";
  elements.location.placeholder      = isFound ? "e.g. Canteen, Table 4"  : "e.g. Main Library";
  elements.contact.placeholder       = "09XXXXXXXXX or name@gmail.com";

  if (!elements.postId.value) {
    elements.submitText.textContent = isFound ? "Post found item" : "Post lost item";
  }
}

function openDrawer() {
  lastFocused = document.activeElement;
  document.body.classList.add("drawer-open");
  elements.drawer.setAttribute("aria-hidden", "false");
  window.setTimeout(() => elements.typeSegment.querySelector(".seg.active").focus({ preventScroll: true }), 120);
}

function closeDrawer() {
  if (!document.body.classList.contains("drawer-open")) return;
  document.body.classList.remove("drawer-open");
  elements.drawer.setAttribute("aria-hidden", "true");
  if (lastFocused && typeof lastFocused.focus === "function") {
    lastFocused.focus({ preventScroll: true });
  }
}

function setImagePreview(imageData) {
  selectedImageData = imageData;
  if (imageData) {
    elements.imagePreviewPhoto.src = imageData;
  } else {
    elements.imagePreviewPhoto.removeAttribute("src");
  }
  elements.imagePreview.classList.toggle("hidden", !imageData);
}

function updateDescCount() {
  elements.descCount.textContent =
    `${elements.description.value.length}/${elements.description.maxLength}`;
}

function clearInvalid() {
  elements.form.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));
}


/* ── 6. FORM FUNCTIONS ────────────────────────────────────── */

function resetForm() {
  elements.form.reset();
  setImagePreview("");
  clearInvalid();
  elements.postId.value          = "";
  elements.formTitle.textContent = "Create a post";
  elements.cancelEdit.classList.add("hidden");
  setType("Lost");
  elements.date.value = todayString();
  updateDescCount();
}

function validateForm() {
  clearInvalid();

  // 1 — All required fields must be filled
  const fields  = [elements.item, elements.description, elements.location, elements.date, elements.contact];
  const invalid = fields.find((field) => !field.value.trim());
  if (invalid) {
    invalid.classList.add("invalid");
    invalid.focus();
    showFeedback("Please complete every field before publishing.", true);
    return false;
  }

  // 2 — Contact: phone must be 09XXXXXXXXX; everything else must be a Gmail address
  const contactValue = elements.contact.value.trim();
  const isPhone      = /^\d+$/.test(contactValue);

  if (isPhone) {
    if (!/^09\d{9}$/.test(contactValue)) {
      elements.contact.classList.add("invalid");
      elements.contact.focus();
      showFeedback("Phone number must be 11 digits and start with 09 (e.g. 09123456789).", true);
      return false;
    }
  } else {
    // Non-phone contact must be a valid Gmail address: local@gmail.com exactly
    const emailRegex = /^[a-zA-Z0-9._%+\-]+@gmail\.com$/;
    if (!emailRegex.test(contactValue)) {
      elements.contact.classList.add("invalid");
      elements.contact.focus();
      showFeedback("Email must end in @gmail.com with a dot — not a comma (e.g. yourname@gmail.com).", true);
      return false;
    }
  }

  // 3 — Contact must be unique across all posts
  const normalizedContact   = normalizeContact(contactValue);
  const isDuplicateContact  = posts.some((post) =>
    post.id !== elements.postId.value &&
    normalizeContact(post.contact) === normalizedContact
  );
  if (isDuplicateContact) {
    elements.contact.classList.add("invalid");
    elements.contact.focus();
    showFeedback("This contact information is already used by another post.", true);
    return false;
  }

  // 4 — Date must be valid
  const selectedDate = new Date(`${elements.date.value}T00:00:00`);
  if (Number.isNaN(selectedDate.getTime())) {
    elements.date.classList.add("invalid");
    elements.date.focus();
    showFeedback("Please enter a valid date.", true);
    return false;
  }

  return true;
}

function saveFormPost() {
  const postData = {
    type:        elements.type.value,
    item:        elements.item.value.trim(),
    description: elements.description.value.trim(),
    location:    elements.location.value.trim(),
    date:        elements.date.value,
    contact:     elements.contact.value.trim(),
    image:       selectedImageData,
  };

  if (elements.postId.value) {
    // Edit existing post
    const post = posts.find((entry) => entry.id === elements.postId.value);
    if (!post) { resetForm(); return; }
    Object.assign(post, postData);
    showFeedback("Your post was updated.");
  } else {
    // New post
    posts.push({ ...postData, id: generateId(), status: "Open" });
    showFeedback("Your post is now live on the board.");
  }

  savePosts();
  resetForm();
  closeDrawer();
  renderPosts();
}


/* ── 7. DIALOG FUNCTIONS ──────────────────────────────────── */

function openDeleteDialog(post) {
  lastFocused = document.activeElement;
  pendingDeleteId = post.id;
  pendingPublish  = false;
  elements.deleteDialogTitle.textContent    = "Delete confirmation";
  elements.deleteDialogQuestion.textContent = "Delete this post?";
  elements.deleteDialogMessage.textContent  =
    `"${post.item || "Untitled item"}" will be removed. This action cannot be undone.`;
  elements.confirmDelete.textContent = "Delete";
  elements.confirmDelete.classList.remove("is-publish");
  elements.deleteDialog.classList.remove("hidden");
  elements.cancelDelete.focus();
}

function openPublishDialog() {
  lastFocused     = document.activeElement;
  pendingPublish  = true;
  pendingDeleteId = "";
  elements.deleteDialogTitle.textContent    = "Publish confirmation";
  elements.deleteDialogQuestion.textContent = "";
  elements.deleteDialogMessage.textContent  = "Are you sure you want to publish this post?";
  elements.confirmDelete.textContent = "Publish";
  elements.confirmDelete.classList.add("is-publish");
  elements.deleteDialog.classList.remove("hidden");
  elements.cancelDelete.focus();
}

function closeDeleteDialog() {
  pendingDeleteId = "";
  pendingPublish  = false;
  elements.deleteDialog.classList.add("hidden");
  if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
}


/* ── 8. RENDER FUNCTIONS ──────────────────────────────────── */

function postTemplate(post) {
  const type   = post.type   || "Lost";
  const status = post.status || "Open";
  return `
    <article class="post-card ${status === "Resolved" ? "resolved" : ""}">
      <div class="post-top">
        <span class="tag ${type.toLowerCase()}">${type.toUpperCase()}</span>
        <span class="post-status">${status.toUpperCase()}</span>
      </div>
      ${post.image
        ? `<img class="post-image" src="${escapeHtml(post.image)}" alt="Photo of ${escapeHtml(post.item || "item")}" loading="lazy">`
        : ""}
      <h3>${escapeHtml(post.item || "Untitled item")}</h3>
      <p class="post-body">${escapeHtml(post.description || "")}</p>
      <div class="post-meta">
        <div><span class="post-meta-label">Location:</span> ${escapeHtml(post.location || "N/A")}</div>
        <div><span class="post-meta-label">Date:</span> ${formatDate(post.date)}</div>
        <div><span class="post-meta-label">Contact:</span> ${escapeHtml(post.contact || "N/A")}</div>
      </div>
      <div class="post-actions">
        ${status === "Open"
          ? `<button class="text-button" type="button" data-action="resolve" data-id="${escapeHtml(post.id)}">Mark resolved</button>`
          : ""}
        <button class="text-button" type="button" data-action="edit"   data-id="${escapeHtml(post.id)}">Edit</button>
        <button class="text-button delete" type="button" data-action="delete" data-id="${escapeHtml(post.id)}">Delete</button>
      </div>
    </article>`;
}

function renderPosts() {
  const query         = elements.search.value.trim().toLowerCase();
  const type          = elements.typeFilter.value;
  const status        = elements.statusFilter.value;
  const sortDirection = elements.sort.value === "newest" ? -1 : 1;

  const visiblePosts = posts
    .filter((post) => {
      const haystack     = `${post.item} ${post.description} ${post.location}`.toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      return (
        matchesQuery &&
        (type   === "All" || post.type   === type) &&
        (status === "All" || post.status === status)
      );
    })
    .sort((a, b) => (new Date(a.date) - new Date(b.date)) * sortDirection);

  elements.resultCount.textContent = visiblePosts.length;
  animateCount(elements.totalCount,     posts.length);
  animateCount(elements.openCount,      posts.filter((p) => p.status === "Open").length);
  animateCount(elements.openLostCount,  posts.filter((p) => p.status === "Open" && p.type === "Lost").length);
  animateCount(elements.openFoundCount, posts.filter((p) => p.status === "Open" && p.type === "Found").length);
  animateCount(elements.resolvedCount,  posts.filter((p) => p.status === "Resolved").length);

  const emptyMessage = posts.length === 0
    ? `<strong>Nothing on the board yet</strong>Be the first to report a lost or found item using the form.`
    : `<strong>No posts found</strong>Try changing your search or filters, or publish a new report.`;

  elements.postList.innerHTML = visiblePosts.length
    ? visiblePosts.map(postTemplate).join("")
    : `<div class="empty-state">${emptyMessage}</div>`;
}


/* ── 9. NAVIGATION ────────────────────────────────────────── */

function initNavigation() {
  const header   = document.querySelector(".site-header");
  const nav      = document.querySelector("#primaryNav");
  const toggle   = document.querySelector("#navToggle");
  const navLinks = Array.from(nav.querySelectorAll("a"));
  const sections = {
    "#top":             document.querySelector("#top"),
    "#community-board": document.querySelector("#community-board"),
    "#how-it-works":    document.querySelector("#how-it-works"),
    "#about-us":        document.querySelector("#about-us"),
  };

  function setMenu(open) {
    header.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  }

  function setActiveNav(targetHref) {
    navLinks.forEach((link) => {
      const isMatch = link.getAttribute("href") === targetHref;
      link.classList.toggle("active", isMatch);
      isMatch
        ? link.setAttribute("aria-current", "page")
        : link.removeAttribute("aria-current");
    });
  }

  function smoothScrollTo(targetId) {
    if (targetId === "#top" || targetId === "#") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const targetEl    = document.querySelector(targetId);
    if (!targetEl) return;
    const headerHeight = header.getBoundingClientRect().height;
    const top          = targetEl.getBoundingClientRect().top + window.pageYOffset - (headerHeight + 16);
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }

  function updateHistory(href) {
    try {
      if (window.history && window.history.pushState) window.history.pushState(null, "", href);
    } catch (e) {
      // Ignore SecurityError on file:// protocol
    }
  }

  // Smooth-scroll all anchor links
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href || href === "#") return;
      if (href === "#community-board" && link.classList.contains("skip-link")) return;
      event.preventDefault();
      setMenu(false);
      if (href === "#post-item") {
        if (elements.postId.value) resetForm();
        openDrawer();
        return;
      }
      smoothScrollTo(href);
      updateHistory(href);
    });
  });

  toggle.addEventListener("click", () => setMenu(!header.classList.contains("menu-open")));

  // Close mobile menu on Escape
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenu(false);
  });

  // Close mobile menu when viewport widens past breakpoint
  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) setMenu(false);
  });

  // ScrollSpy + header state + back-to-top (RAF-throttled)
  let isTicking = false;
  function onScroll() {
    header.classList.toggle("is-scrolled", window.scrollY > 24);
    elements.backToTop.classList.toggle("hidden", window.scrollY < 600);
    const trigger = window.innerHeight * 0.4;
    let current   = "#top";
    Object.entries(sections).forEach(([href, el]) => {
      if (el && el.getBoundingClientRect().top <= trigger) current = href;
    });
    setActiveNav(current);
    isTicking = false;
  }
  window.addEventListener("scroll", () => {
    if (!isTicking) {
      window.requestAnimationFrame(onScroll);
      isTicking = true;
    }
  }, { passive: true });
  onScroll();

  elements.backToTop.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" })
  );
}


/* ══════════════════════════════════════════════════════════
   10. EVENT LISTENERS
   Every user interaction and browser event is wired here.
   ══════════════════════════════════════════════════════════ */

/* ── DRAWER EVENTS ── */
// Open the slide-in form panel
elements.openFormBtn.addEventListener("click", () => {
  if (elements.postId.value) resetForm();
  openDrawer();
});

// Close via the X button or the backdrop overlay
elements.closeDrawerBtn.addEventListener("click", closeDrawer);
elements.drawerBackdrop.addEventListener("click", closeDrawer);


/* ── FORM EVENTS ── */
// Switch between Lost / Found with mouse click
elements.typeSegment.addEventListener("click", (event) => {
  const button = event.target.closest(".seg");
  if (button) setType(button.dataset.value);
});

// Switch between Lost / Found with arrow keys (keyboard navigation)
elements.typeSegment.addEventListener("keydown", (event) => {
  if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
  event.preventDefault();
  const next = elements.type.value === "Lost" ? "Found" : "Lost";
  setType(next);
  elements.typeSegment.querySelector(`.seg[data-value="${next}"]`).focus();
});

// Live character counter for description textarea
elements.description.addEventListener("input", updateDescCount);

// Clear red-border invalid state as soon as the user starts correcting a field
elements.form.addEventListener("input", (event) => {
  event.target.classList.remove("invalid");
});

// Validate then open publish confirmation dialog (or save edit directly)
elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!validateForm()) return;
  if (!elements.postId.value) {
    openPublishDialog();
    return;
  }
  saveFormPost();
});

// Image file selected: validate type & size, then show preview
elements.itemImage.addEventListener("change", () => {
  const [file] = elements.itemImage.files;
  if (!file) return;

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    elements.itemImage.value = "";
    showFeedback("Choose a JPEG, PNG, or WebP image.", true);
    return;
  }
  if (file.size > MAX_IMAGE_SIZE) {
    elements.itemImage.value = "";
    showFeedback("The item photo must be 1 MB or smaller.", true);
    return;
  }

  // FileReader fires its own events asynchronously
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    if (elements.itemImage.files[0] !== file) return;
    if (typeof reader.result !== "string") {
      showFeedback("The item photo could not be read.", true);
      return;
    }
    // Verify the data URL is a real decodable image before accepting it
    const image = new Image();
    image.addEventListener("load",  () => setImagePreview(reader.result), { once: true });
    image.addEventListener("error", () => {
      elements.itemImage.value = "";
      showFeedback("Choose a valid image file.", true);
    }, { once: true });
    image.src = reader.result;
  }, { once: true });

  reader.addEventListener("error", () => {
    if (elements.itemImage.files[0] !== file) return;
    elements.itemImage.value = "";
    showFeedback("The item photo could not be read.", true);
  }, { once: true });

  reader.readAsDataURL(file);
});

// Remove the attached photo
elements.removeImage.addEventListener("click", () => {
  elements.itemImage.value = "";
  setImagePreview("");
});

// Cancel an in-progress edit and close the drawer
elements.cancelEdit.addEventListener("click", () => {
  resetForm();
  closeDrawer();
});


/* ── BOARD EVENTS ── */
// Live search + filter + sort — any change re-renders the board immediately
[elements.search, elements.typeFilter, elements.statusFilter, elements.sort].forEach((control) => {
  control.addEventListener("input",  renderPosts);
  control.addEventListener("change", renderPosts);
});

// Post action buttons (resolve / edit / delete) via event delegation
// One listener on the container handles all cards — avoids attaching per-card listeners
elements.postList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const post = posts.find((entry) => entry.id === button.dataset.id);
  if (!post) return;

  if (button.dataset.action === "delete") {
    openDeleteDialog(post);
    return;
  }
  if (button.dataset.action === "resolve") {
    post.status = "Resolved";
    savePosts();
    showFeedback("Great! This post has been marked as resolved.");
  } else if (button.dataset.action === "edit") {
    clearInvalid();
    elements.postId.value           = post.id;
    elements.item.value             = post.item;
    elements.description.value      = post.description;
    elements.location.value         = post.location;
    elements.date.value             = post.date;
    elements.contact.value          = post.contact;
    elements.itemImage.value        = "";
    elements.submitText.textContent = "Save changes";
    elements.formTitle.textContent  = "Edit your post";
    elements.cancelEdit.classList.remove("hidden");
    setType(post.type);
    setImagePreview(post.image || "");
    updateDescCount();
    openDrawer();
  }
  renderPosts();
});

// Post card entry animation ends — lock opacity so it doesn't flicker on re-render
elements.postList.addEventListener("animationend", (event) => {
  if (event.target.classList.contains("post-card")) {
    event.target.style.opacity = "1";
  }
});


/* ── DIALOG EVENTS ── */
// Cancel button dismisses the dialog
elements.cancelDelete.addEventListener("click", closeDeleteDialog);

// Confirm button: either publishes a new post or confirms a deletion
elements.confirmDelete.addEventListener("click", () => {
  if (pendingPublish) {
    closeDeleteDialog();
    saveFormPost();
    return;
  }
  if (!pendingDeleteId) return;
  const deletedId = pendingDeleteId;
  posts = posts.filter((entry) => entry.id !== deletedId);
  if (elements.postId.value === deletedId) resetForm();
  savePosts();
  closeDeleteDialog();
  showFeedback("The post was deleted.");
  renderPosts();
});

// Click outside the dialog box to dismiss it
elements.deleteDialog.addEventListener("click", (event) => {
  if (event.target === elements.deleteDialog) closeDeleteDialog();
});


/* ── GLOBAL KEYBOARD EVENTS ── */
// Escape closes whichever overlay is open; Tab traps focus inside the dialog
document.addEventListener("keydown", (event) => {
  const dialogOpen = !elements.deleteDialog.classList.contains("hidden");

  if (event.key === "Escape") {
    if (dialogOpen) closeDeleteDialog();
    else closeDrawer();
    return;
  }

  // Focus trap — keeps keyboard users inside the dialog while it is open
  if (event.key === "Tab" && dialogOpen) {
    const buttons = [elements.cancelDelete, elements.confirmDelete];
    const index   = buttons.indexOf(document.activeElement);
    if (event.shiftKey && index <= 0) {
      event.preventDefault();
      buttons[1].focus();
    } else if (!event.shiftKey && index === 1) {
      event.preventDefault();
      buttons[0].focus();
    } else if (index === -1) {
      event.preventDefault();
      buttons[0].focus();
    }
  }
});


/* ── WINDOW / BROWSER EVENTS ── */

// storage event — syncs board in real time when the user has two tabs open
window.addEventListener("storage", (event) => {
  if (event.key === STORAGE_KEY) {
    posts = loadPosts();
    renderPosts();
    showFeedback("Board updated from another tab.");
  }
});

// beforeunload — warns the user if they try to leave with an unsaved form open
window.addEventListener("beforeunload", (event) => {
  const hasTyped    = elements.item.value.trim() || elements.description.value.trim();
  const drawerOpen  = document.body.classList.contains("drawer-open");
  if (hasTyped && drawerOpen) {
    event.preventDefault(); // triggers the browser's "Leave site?" prompt
  }
});

// visibilitychange — pauses the ticker animation when the tab is hidden to save CPU
document.addEventListener("visibilitychange", () => {
  if (elements.tickerTrack) {
    elements.tickerTrack.style.animationPlayState =
      document.hidden ? "paused" : "running";
  }
});


/* ══════════════════════════════════════════════════════════
   11. INIT
   ══════════════════════════════════════════════════════════ */

initNavigation();
posts = loadPosts();  // load after DOM is ready
resetForm();
renderPosts();
