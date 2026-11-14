const STORAGE_KEY = "findit-posts";

const elements = {
  form: document.querySelector("#postForm"),
  postId: document.querySelector("#postId"),
  itemImage: document.querySelector("#itemImage"),
  imagePreview: document.querySelector("#imagePreview"),
  imagePreviewPhoto: document.querySelector("#imagePreviewPhoto"),
  removeImage: document.querySelector("#removeImage"),
  type: document.querySelector("#type"),
  item: document.querySelector("#item"),
  description: document.querySelector("#description"),
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
  feedback: document.querySelector("#feedback")
};

let posts = loadPosts();
let pendingDeleteId = "";
let pendingPublish = false;
let selectedImageData = "";

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

function loadPosts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const saved = JSON.parse(raw);
    if (!Array.isArray(saved)) return [];
    return saved.filter((item) => item && typeof item === "object").map((item) => ({
      id: item.id || generateId(),
      type: item.type || "Lost",
      status: item.status || "Open",
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
    showFeedback("Your browser could not save this post.", true);
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

function resetForm() {
  elements.form.reset();
  setImagePreview("");
  elements.postId.value = "";
  elements.type.value = "Lost";
  elements.submitText.textContent = "Publish This Post";
  elements.formTitle.textContent = "Create a post";
  elements.cancelEdit.classList.add("hidden");
}

function setImagePreview(imageData) {
  selectedImageData = imageData;
  elements.imagePreviewPhoto.src = imageData;
  elements.imagePreview.classList.toggle("hidden", !imageData);
}

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

function validateForm() {
  const fields = [elements.item, elements.description, elements.location, elements.date, elements.contact];
  const invalid = fields.find((field) => !field.value.trim());
  if (invalid) {
    invalid.focus();
    showFeedback("Please complete every field before publishing.", true);
    return false;
  }
  const normalizedContact = normalizeContact(elements.contact.value);
  const isDuplicateContact = posts.some((post) =>
    post.id !== elements.postId.value && normalizeContact(post.contact) === normalizedContact
  );
  if (isDuplicateContact) {
    elements.contact.focus();
    showFeedback("This contact information is already used by another post.", true);
    return false;
  }
  const selectedDate = new Date(`${elements.date.value}T00:00:00`);
  if (Number.isNaN(selectedDate.getTime())) {
    elements.date.focus();
    showFeedback("Please enter a valid date.", true);
    return false;
  }
  return true;
}

function normalizeContact(value) {
  if (!value) return "";
  const trimmedValue = String(value).trim().toLowerCase();
  const digitsOnly = trimmedValue.replace(/\D/g, "");
  return digitsOnly.length >= 7 ? digitsOnly : trimmedValue.replace(/\s+/g, "");
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

function renderPosts() {
  const query = elements.search.value.trim().toLowerCase();
  const type = elements.typeFilter.value;
  const status = elements.statusFilter.value;
  const sortDirection = elements.sort.value === "newest" ? -1 : 1;
  const visiblePosts = posts
    .filter((post) => {
      const matchesQuery = !query || `${post.item} ${post.location}`.toLowerCase().includes(query);
      return matchesQuery && (type === "All" || post.type === type) && (status === "All" || post.status === status);
    })
    .sort((a, b) => (new Date(a.date) - new Date(b.date)) * sortDirection);

  elements.resultCount.textContent = visiblePosts.length;
  elements.openCount.textContent = posts.filter((post) => post.status === "Open").length;
  elements.totalCount.textContent = posts.length;
  elements.openLostCount.textContent = posts.filter((post) => post.status === "Open" && post.type === "Lost").length;
  elements.openFoundCount.textContent = posts.filter((post) => post.status === "Open" && post.type === "Found").length;
  elements.resolvedCount.textContent = posts.filter((post) => post.status === "Resolved").length;
  elements.postList.innerHTML = visiblePosts.length ? visiblePosts.map(postTemplate).join("") : `
    <div class="empty-state"><strong>No posts found</strong>Try changing your search or filters, or publish a new report.</div>`;
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
      <p>${escapeHtml(post.description || "")}</p>
      <div class="post-meta">
        <div><span class="post-meta-label">Location:</span> ${escapeHtml(post.location || "N/A")}</div>
        <div><span class="post-meta-label">Date:</span> ${formatDate(post.date)}</div>
        <div><span class="post-meta-label">Contact:</span> ${escapeHtml(post.contact || "N/A")}</div>
      </div>
      <div class="post-actions">
        ${status === "Open" ? `<button class="text-button" data-action="resolve" data-id="${escapeHtml(post.id)}">Mark resolved</button>` : ""}
        <button class="text-button" data-action="edit" data-id="${escapeHtml(post.id)}">Edit</button>
        <button class="text-button delete" data-action="delete" data-id="${escapeHtml(post.id)}">Delete</button>
      </div>
    </article>`;
}

function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[character]));
}

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
    Object.assign(post, postData);
    showFeedback("Your post was updated.");
  } else {
    posts.push({ ...postData, id: crypto.randomUUID(), status: "Open" });
    posts.push({ ...postData, id: generateId(), status: "Open" });
    showFeedback("Your post is now live on the board.");
  }
  savePosts();
  resetForm();
  renderPosts();
}

elements.cancelEdit.addEventListener("click", resetForm);
function closeDeleteDialog() {
  pendingDeleteId = "";
  pendingPublish = false;
  elements.deleteDialog.classList.add("hidden");
}

function openDeleteDialog(post) {
  pendingDeleteId = post.id;
  pendingPublish = false;
  elements.deleteDialogTitle.textContent = "Delete confirmation";
  elements.deleteDialogQuestion.textContent = "Delete this post?";
  elements.deleteDialogMessage.textContent = "This action cannot be undone.";
  elements.confirmDelete.textContent = "Delete";
  elements.deleteDialog.classList.remove("hidden");
  elements.cancelDelete.focus();
}

function openPublishDialog() {
  pendingPublish = true;
  pendingDeleteId = "";
  elements.deleteDialogTitle.textContent = "Publish confirmation";
  elements.deleteDialogQuestion.textContent = "";
  elements.deleteDialogMessage.textContent = "Are you sure you want to publish this post?";
  elements.confirmDelete.textContent = "Publish";
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
  posts = posts.filter((entry) => entry.id !== pendingDeleteId);
  savePosts();
  closeDeleteDialog();
  showFeedback("The post was deleted.");
  renderPosts();
});
elements.deleteDialog.addEventListener("click", (event) => {
  if (event.target === elements.deleteDialog) closeDeleteDialog();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !elements.deleteDialog.classList.contains("hidden")) {
    closeDeleteDialog();
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
  } else if (button.dataset.action === "resolve") {
    post.status = "Resolved";
    savePosts();
    showFeedback("Great! This post has been marked as resolved.");
  } else if (button.dataset.action === "edit") {
    elements.postId.value = post.id;
    elements.type.value = post.type;
    elements.item.value = post.item;
    elements.description.value = post.description;
    elements.location.value = post.location;
    elements.date.value = post.date;
    elements.contact.value = post.contact;
    setImagePreview(post.image || "");
    elements.submitText.textContent = "Save changes";
    elements.formTitle.textContent = "Edit your post";
    elements.cancelEdit.classList.remove("hidden");
    elements.item.focus();
  }
  renderPosts();
});

// --- Navigation & Smooth Scroll for Navbar (Home, Board, About Us) ---
function initNavigation() {
  const navLinks = document.querySelectorAll(".primary-nav a");
  const homeLink = document.querySelector('.primary-nav a[href="#top"]');
  const boardLink = document.querySelector('.primary-nav a[href="#community-board"]');
  const aboutLink = document.querySelector('.primary-nav a[href="#about-us"]');
  const boardSection = document.querySelector("#community-board");
  const aboutSection = document.querySelector("#about-us");
  const brandLink = document.querySelector(".site-header .brand");
  const heroBoardBtn = document.querySelector('.hero-button[href="#community-board"]');
  const heroPostBtn = document.querySelector('.hero-button[href="#post-item"]');
  const scrollHint = document.querySelector(".scroll-hint");

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
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
      setActiveNav("#top");
      return;
    }

    const targetEl = document.querySelector(targetId);
    if (!targetEl) return;

    const header = document.querySelector(".site-header");
    const headerHeight = header ? header.getBoundingClientRect().height : 72;
    const extraOffset = 18;
    const targetPosition = targetEl.getBoundingClientRect().top + window.pageYOffset - (headerHeight + extraOffset);

    window.scrollTo({
      top: Math.max(0, targetPosition),
      behavior: "smooth"
    });

    setActiveNav(targetId);
  }

  function updateHistory(href) {
    try {
      if (window.history && window.history.pushState) {
        window.history.pushState(null, "", href);
      }
    } catch (e) {
      // Silently ignore SecurityError on file:// protocol
    }
  }

  // Handle primary nav link clicks (Home, Board, About Us)
  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (href && href.startsWith("#")) {
        event.preventDefault();
        smoothScrollTo(href);
        if (history.pushState) {
          history.pushState(null, "", href);
        }
        updateHistory(href);
      }
    });
  });

  // Handle Brand Logo click -> scrolls smoothly to top (Home)
  if (brandLink) {
    brandLink.addEventListener("click", (event) => {
      event.preventDefault();
      smoothScrollTo("#top");
      if (history.pushState) {
        history.pushState(null, "", "#top");
      }
      updateHistory("#top");
    });
  }

  // Handle hero button clicks
  [heroBoardBtn, heroPostBtn, scrollHint].forEach((btn) => {
    if (!btn) return;
    btn.addEventListener("click", (event) => {
      const href = btn.getAttribute("href");
      if (href && href.startsWith("#")) {
        event.preventDefault();
        smoothScrollTo(href);
        if (history.pushState) {
          history.pushState(null, "", href);
        }
        updateHistory(href);
      }
    });
  });

  // ScrollSpy: dynamically sync the active navbar indicator as user scrolls
  let isTicking = false;
  window.addEventListener("scroll", () => {
    if (!isTicking) {
      window.requestAnimationFrame(() => {
        const triggerPoint = window.innerHeight * 0.45;
        const aboutRect = aboutSection ? aboutSection.getBoundingClientRect() : null;
        const boardRect = boardSection ? boardSection.getBoundingClientRect() : null;

        if (aboutRect && aboutRect.top <= triggerPoint) {
          setActiveNav("#about-us");
        } else if (boardRect && boardRect.top <= triggerPoint) {
          setActiveNav("#community-board");
        } else {
          setActiveNav("#top");
        }
        isTicking = false;
      });
      isTicking = true;
    }
  }, { passive: true });
}

initNavigation();

renderPosts();
