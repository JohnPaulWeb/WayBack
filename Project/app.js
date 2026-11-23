const STORAGE_KEY = "wayback-posts";
const LEGACY_STORAGE_KEY = "findit-posts";

const elements = {
  form: document.querySelector("#postForm"),
  postId: document.querySelector("#postId"),
  itemImage: document.querySelector("#itemImage"),
  imagePreview: document.querySelector("#imagePreview"),
  imagePreviewPhoto: document.querySelector("#imagePreviewPhoto"),
  removeImage: document.querySelector("#removeImage"),
  type: document.querySelector("#type"),
  typeSegment: document.querySelector("#typeSegment"),
  item: document.querySelector("#item"),
  description: document.querySelector("#description"),
  descCount: document.querySelector("#descCount"),
  location: document.querySelector("#location"),
  date: document.querySelector("#date"),
  contact: document.querySelector("#contact"),
  submitText: document.querySelector("#submitText"),
  cancelEdit: document.querySelector("#cancelEdit"),
  formTitle: document.querySelector("#formTitle"),
  search: document.querySelector("#search"),
  typeFilter: document.querySelector("#typeFilter"),
  statusFilter: document.querySelector("#statusFilter"),
  sort: document.querySelector("#sort"),
  postList: document.querySelector("#postList"),
  resultCount: document.querySelector("#resultCount"),
  openCount: document.querySelector("#openCount"),
  totalCount: document.querySelector("#totalCount"),
  openLostCount: document.querySelector("#openLostCount"),
  openFoundCount: document.querySelector("#openFoundCount"),
  resolvedCount: document.querySelector("#resolvedCount"),
  deleteDialog: document.querySelector("#deleteDialog"),
  deleteDialogTitle: document.querySelector("#deleteDialogTitle"),
  deleteDialogQuestion: document.querySelector("#deleteDialogQuestion"),
  deleteDialogMessage: document.querySelector("#deleteDialogMessage"),
  cancelDelete: document.querySelector("#cancelDelete"),
  confirmDelete: document.querySelector("#confirmDelete"),
  feedback: document.querySelector("#feedback"),
  backToTop: document.querySelector("#backToTop"),
  drawer: document.querySelector("#post-item"),
  drawerBackdrop: document.querySelector("#drawerBackdrop"),
  closeDrawerBtn: document.querySelector("#closeDrawer"),
  openFormBtn: document.querySelector("#openFormBtn"),
  typeHint: document.querySelector("#typeHint"),
  locationLabel: document.querySelector("#locationLabel"),
  dateLabel: document.querySelector("#dateLabel")
};

let posts = loadPosts();
let pendingDeleteId = "";
let pendingPublish = false;
let selectedImageData = "";
let lastFocused = null;

const MAX_IMAGE_SIZE = 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // Fall through to fallback
    }
  }
  return "post_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
}

function todayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function loadPosts() {
  try {
    // Pick up posts saved under the old app name once, then keep using the new key.
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw) localStorage.setItem(STORAGE_KEY, raw);
    }
    if (!raw) return [];
    const saved = JSON.parse(raw);
    if (!Array.isArray(saved)) return [];
    return saved.filter((item) => item && typeof item === "object").map((item) => ({
      id: item.id || generateId(),
      type: item.type === "Found" ? "Found" : "Lost",
      status: item.status === "Resolved" ? "Resolved" : "Open",
      item: item.item || "",
      description: item.description || "",
      location: item.location || "",
      date: item.date || "",
      contact: item.contact || "",
      image: item.image || ""
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

function showFeedback(message, isError = false) {
  elements.feedback.textContent = message;
  elements.feedback.className = `feedback show${isError ? " error" : ""}`;
  window.clearTimeout(showFeedback.timeout);
  showFeedback.timeout = window.setTimeout(() => {
    elements.feedback.className = "feedback";
  }, 3500);
}

/* ---------- Form helpers ---------- */
function setType(value) {
  const type = value === "Found" ? "Found" : "Lost";
  elements.type.value = type;
  elements.typeSegment.querySelectorAll(".seg").forEach((button) => {
    const active = button.dataset.value === type;
    button.classList.toggle("active", active);
    button.setAttribute("aria-checked", String(active));
  });
  const isFound = type === "Found";
  elements.drawer.dataset.type = type;
  elements.typeHint.textContent = isFound
    ? "You found something. Describe it without giving away every detail, so only the real owner can claim it."
    : "You lost something. Add where you last had it and any marks that make it easy to recognize.";
  elements.locationLabel.textContent = isFound ? "Where did you find it?" : "Last seen location";
  elements.dateLabel.textContent = isFound ? "Date found" : "Date lost";
  elements.item.placeholder = isFound ? "e.g. Blue umbrella" : "e.g. Black leather wallet";
  elements.location.placeholder = isFound ? "e.g. Canteen, Table 4" : "e.g. Main Library";
  elements.contact.placeholder = isFound ? "How the owner can reach you" : "Email, phone, or social handle";
  if (!elements.postId.value) {
    elements.submitText.textContent = isFound ? "Post found item" : "Post lost item";
  }
}

/* ---------- Slide-in form ---------- */
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
  if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus({ preventScroll: true });
}

elements.openFormBtn.addEventListener("click", () => {
  if (elements.postId.value) resetForm();
  openDrawer();
});
elements.closeDrawerBtn.addEventListener("click", closeDrawer);
elements.drawerBackdrop.addEventListener("click", closeDrawer);

function updateDescCount() {
  elements.descCount.textContent = `${elements.description.value.length}/${elements.description.maxLength}`;
}

function clearInvalid() {
  elements.form.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));
}

function resetForm() {
  elements.form.reset();
  setImagePreview("");
  clearInvalid();
  elements.postId.value = "";
  setType("Lost");
  elements.date.value = todayString();
  updateDescCount();
  elements.formTitle.textContent = "Create a post";
  elements.cancelEdit.classList.add("hidden");
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

elements.typeSegment.addEventListener("click", (event) => {
  const button = event.target.closest(".seg");
  if (button) setType(button.dataset.value);
});

elements.typeSegment.addEventListener("keydown", (event) => {
  if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
  event.preventDefault();
  const next = elements.type.value === "Lost" ? "Found" : "Lost";
  setType(next);
  elements.typeSegment.querySelector(`.seg[data-value="${next}"]`).focus();
});

elements.description.addEventListener("input", updateDescCount);

elements.form.addEventListener("input", (event) => {
  event.target.classList.remove("invalid");
});

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

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    if (elements.itemImage.files[0] !== file) return;
    if (typeof reader.result !== "string") {
      showFeedback("The item photo could not be read.", true);
      return;
    }
    const image = new Image();
    image.addEventListener("load", () => setImagePreview(reader.result), { once: true });
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

elements.removeImage.addEventListener("click", () => {
  elements.itemImage.value = "";
  setImagePreview("");
});

function normalizeContact(value) {
  if (!value) return "";
  const trimmedValue = String(value).trim().toLowerCase();
  const digitsOnly = trimmedValue.replace(/\D/g, "");
  return digitsOnly.length >= 7 ? digitsOnly : trimmedValue.replace(/\s+/g, "");
}

function validateForm() {
  clearInvalid();
  const fields = [elements.item, elements.description, elements.location, elements.date, elements.contact];
  const invalid = fields.find((field) => !field.value.trim());
  if (invalid) {
    invalid.classList.add("invalid");
    invalid.focus();
    showFeedback("Please complete every field before publishing.", true);
    return false;
  }
  const normalizedContact = normalizeContact(elements.contact.value);
  const isDuplicateContact = posts.some((post) =>
    post.id !== elements.postId.value && normalizeContact(post.contact) === normalizedContact
  );
  if (isDuplicateContact) {
    elements.contact.classList.add("invalid");
    elements.contact.focus();
    showFeedback("This contact information is already used by another post.", true);
    return false;
  }
  const selectedDate = new Date(`${elements.date.value}T00:00:00`);
  if (Number.isNaN(selectedDate.getTime())) {
    elements.date.classList.add("invalid");
    elements.date.focus();
    showFeedback("Please enter a valid date.", true);
    return false;
  }
  return true;
}

function formatDate(dateString) {
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

/* ---------- Rendering ---------- */
function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[character]));
}

function animateCount(element, target) {
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

function renderPosts() {
  const query = elements.search.value.trim().toLowerCase();
  const type = elements.typeFilter.value;
  const status = elements.statusFilter.value;
  const sortDirection = elements.sort.value === "newest" ? -1 : 1;
  const visiblePosts = posts
    .filter((post) => {
      const haystack = `${post.item} ${post.description} ${post.location}`.toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      return matchesQuery && (type === "All" || post.type === type) && (status === "All" || post.status === status);
    })
    .sort((a, b) => (new Date(a.date) - new Date(b.date)) * sortDirection);

  elements.resultCount.textContent = visiblePosts.length;
  animateCount(elements.openCount, posts.filter((post) => post.status === "Open").length);
  animateCount(elements.totalCount, posts.length);
  animateCount(elements.openLostCount, posts.filter((post) => post.status === "Open" && post.type === "Lost").length);
  animateCount(elements.openFoundCount, posts.filter((post) => post.status === "Open" && post.type === "Found").length);
  animateCount(elements.resolvedCount, posts.filter((post) => post.status === "Resolved").length);

  let emptyMessage = `<strong>No posts found</strong>Try changing your search or filters, or publish a new report.`;
  if (!posts.length) {
    emptyMessage = `<strong>Nothing on the board yet</strong>Be the first to report a lost or found item using the form.`;
  }
  elements.postList.innerHTML = visiblePosts.length
    ? visiblePosts.map(postTemplate).join("")
    : `<div class="empty-state">${emptyMessage}</div>`;
}

function postTemplate(post) {
  const type = post.type || "Lost";
  const status = post.status || "Open";
  return `
    <article class="post-card ${status === "Resolved" ? "resolved" : ""}">
      <div class="post-top">
        <span class="tag ${type.toLowerCase()}">${type.toUpperCase()}</span>
        <span class="post-status">${status.toUpperCase()}</span>
      </div>
      ${post.image ? `<img class="post-image" src="${escapeHtml(post.image)}" alt="Photo of ${escapeHtml(post.item || "item")}" loading="lazy">` : ""}
      <h3>${escapeHtml(post.item || "Untitled item")}</h3>
      <p class="post-body">${escapeHtml(post.description || "")}</p>
      <div class="post-meta">
        <div><span class="post-meta-label">Location:</span> ${escapeHtml(post.location || "N/A")}</div>
        <div><span class="post-meta-label">Date:</span> ${formatDate(post.date)}</div>
        <div><span class="post-meta-label">Contact:</span> ${escapeHtml(post.contact || "N/A")}</div>
      </div>
      <div class="post-actions">
        ${status === "Open" ? `<button class="text-button" type="button" data-action="resolve" data-id="${escapeHtml(post.id)}">Mark resolved</button>` : ""}
        <button class="text-button" type="button" data-action="edit" data-id="${escapeHtml(post.id)}">Edit</button>
        <button class="text-button delete" type="button" data-action="delete" data-id="${escapeHtml(post.id)}">Delete</button>
      </div>
    </article>`;
}

/* ---------- Saving ---------- */
elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!validateForm()) return;
  if (!elements.postId.value) {
    openPublishDialog();
    return;
  }
  saveFormPost();
});

function saveFormPost() {
  const postData = {
    type: elements.type.value,
    item: elements.item.value.trim(),
    description: elements.description.value.trim(),
    location: elements.location.value.trim(),
    date: elements.date.value,
    contact: elements.contact.value.trim(),
    image: selectedImageData
  };
  if (elements.postId.value) {
    const post = posts.find((entry) => entry.id === elements.postId.value);
    if (!post) {
      resetForm();
      return;
    }
    Object.assign(post, postData);
    showFeedback("Your post was updated.");
  } else {
    posts.push({ ...postData, id: generateId(), status: "Open" });
    showFeedback("Your post is now live on the board.");
  }
  savePosts();
  resetForm();
  closeDrawer();
  renderPosts();
}

elements.cancelEdit.addEventListener("click", () => {
  resetForm();
  closeDrawer();
});

/* ---------- Dialog ---------- */
function closeDeleteDialog() {
  pendingDeleteId = "";
  pendingPublish = false;
  elements.deleteDialog.classList.add("hidden");
  if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
}

function openDeleteDialog(post) {
  lastFocused = document.activeElement;
  pendingDeleteId = post.id;
  pendingPublish = false;
  elements.deleteDialogTitle.textContent = "Delete confirmation";
  elements.deleteDialogQuestion.textContent = "Delete this post?";
  elements.deleteDialogMessage.textContent = `"${post.item || "Untitled item"}" will be removed. This action cannot be undone.`;
  elements.confirmDelete.textContent = "Delete";
  elements.confirmDelete.classList.remove("is-publish");
  elements.deleteDialog.classList.remove("hidden");
  elements.cancelDelete.focus();
}

function openPublishDialog() {
  lastFocused = document.activeElement;
  pendingPublish = true;
  pendingDeleteId = "";
  elements.deleteDialogTitle.textContent = "Publish confirmation";
  elements.deleteDialogQuestion.textContent = "";
  elements.deleteDialogMessage.textContent = "Are you sure you want to publish this post?";
  elements.confirmDelete.textContent = "Publish";
  elements.confirmDelete.classList.add("is-publish");
  elements.deleteDialog.classList.remove("hidden");
  elements.cancelDelete.focus();
}

elements.cancelDelete.addEventListener("click", closeDeleteDialog);
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
elements.deleteDialog.addEventListener("click", (event) => {
  if (event.target === elements.deleteDialog) closeDeleteDialog();
});
document.addEventListener("keydown", (event) => {
  const open = !elements.deleteDialog.classList.contains("hidden");
  if (event.key === "Escape" && open) {
    closeDeleteDialog();
  } else if (event.key === "Escape") {
    closeDrawer();
  }
  // Keep keyboard focus inside the dialog while it is open
  if (event.key === "Tab" && open) {
    const buttons = [elements.cancelDelete, elements.confirmDelete];
    const index = buttons.indexOf(document.activeElement);
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

[elements.search, elements.typeFilter, elements.statusFilter, elements.sort].forEach((control) => {
  control.addEventListener("input", renderPosts);
  control.addEventListener("change", renderPosts);
});

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
    elements.postId.value = post.id;
    setType(post.type);
    elements.item.value = post.item;
    elements.description.value = post.description;
    elements.location.value = post.location;
    elements.date.value = post.date;
    elements.contact.value = post.contact;
    elements.itemImage.value = "";
    setImagePreview(post.image || "");
    updateDescCount();
    elements.submitText.textContent = "Save changes";
    elements.formTitle.textContent = "Edit your post";
    elements.cancelEdit.classList.remove("hidden");
    openDrawer();
  }
  renderPosts();
});

/* ---------- Navigation ---------- */
function initNavigation() {
  const header = document.querySelector(".site-header");
  const nav = document.querySelector("#primaryNav");
  const toggle = document.querySelector("#navToggle");
  const navLinks = Array.from(nav.querySelectorAll("a"));
  const sections = {
    "#top": document.querySelector("#top"),
    "#community-board": document.querySelector("#community-board"),
    "#how-it-works": document.querySelector("#how-it-works"),
    "#about-us": document.querySelector("#about-us")
  };

  function setMenu(open) {
    header.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  }

  function setActiveNav(targetHref) {
    navLinks.forEach((link) => {
      const isMatch = link.getAttribute("href") === targetHref;
      link.classList.toggle("active", isMatch);
      if (isMatch) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function smoothScrollTo(targetId) {
    if (targetId === "#top" || targetId === "#") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const targetEl = document.querySelector(targetId);
    if (!targetEl) return;
    const headerHeight = header.getBoundingClientRect().height;
    const top = targetEl.getBoundingClientRect().top + window.pageYOffset - (headerHeight + 16);
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }

  function updateHistory(href) {
    try {
      if (window.history && window.history.pushState) {
        window.history.pushState(null, "", href);
      }
    } catch (e) {
      // Ignore SecurityError on file:// protocol
    }
  }

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
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenu(false);
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) setMenu(false);
  });

  // ScrollSpy, header state, and back-to-top
  let isTicking = false;
  function onScroll() {
    header.classList.toggle("is-scrolled", window.scrollY > 24);
    elements.backToTop.classList.toggle("hidden", window.scrollY < 600);

    const trigger = window.innerHeight * 0.4;
    let current = "#top";
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

  elements.backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

initNavigation();
resetForm();
renderPosts();
