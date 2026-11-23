// app-new.js - Main entry point that orchestrates all modules

import { getDOMElements } from "./modules/dom-elements.js";
import { loadPosts, savePosts, generateId } from "./modules/storage.js";
import { showFeedback, todayString, validateEmail, validatePhoneNumber, isValidContact } from "./modules/ui-utils.js";
import { setupImageHandler, setImagePreview } from "./modules/image-handler.js";
import { setupFormHandler } from "./modules/form-handler.js";
import { setupPostRenderer, renderPosts } from "./modules/post-renderer.js";
import { setupDialogHandler } from "./modules/dialog-handler.js";
import { setupDrawerHandler } from "./modules/drawer-handler.js";
import { initNavigation } from "./modules/navigation.js";

// Initialize
const elements = getDOMElements();
let posts = loadPosts();

// Setup drawer
const drawerAPI = setupDrawerHandler(elements);

// Setup filter controls
[elements.search, elements.typeFilter, elements.statusFilter, elements.sort].forEach((control) => {
  control.addEventListener("input", () => renderPosts(elements, posts));
  control.addEventListener("change", () => renderPosts(elements, posts));
});

// Setup dialog handler
const dialogAPI = setupDialogHandler(elements, {
  onConfirmDelete: (deletedId) => {
    posts = posts.filter((entry) => entry.id !== deletedId);
    if (elements.postId.value === deletedId) formAPI.resetForm();
    savePosts(posts);
    showFeedback("The post was deleted.", elements);
    renderPosts(elements, posts);
  },
  onConfirmPublish: () => {
    formAPI.publishPost();
  }
});

// Setup post renderer with handlers
setupPostRenderer(elements, {
  posts,
  onDeletePost: (post) => dialogAPI.openDeleteDialog(post),
  onResolvePost: (post) => {
    post.status = "Resolved";
    savePosts(posts);
    showFeedback("Great! This post has been marked as resolved.", elements);
    renderPosts(elements, posts);
  },
  onEditPost: (post) => formAPI.editPost(post)
});

// Setup image handler
setupImageHandler(elements, {
  onImagePreview: (data) => {
    formAPI.setImagePreview(data);
  },
  onFeedback: (message, isError) => {
    showFeedback(message, elements, isError);
  }
});

// Setup form handler with form API for external control
const formAPI = (() => {
  let selectedImageData = "";
  let lastFocused = null;

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

  function updateDescCount() {
    elements.descCount.textContent = `${elements.description.value.length}/${elements.description.maxLength}`;
  }

  function clearInvalid() {
    elements.form.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));
  }

  function resetForm() {
    elements.form.reset();
    setImagePreview(elements, "");
    clearInvalid();
    elements.postId.value = "";
    setType("Lost");
    elements.date.value = todayString();
    updateDescCount();
    elements.formTitle.textContent = "Create a post";
    elements.cancelEdit.classList.add("hidden");
    selectedImageData = "";
  }

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
      showFeedback("Please complete every field before publishing.", elements, true);
      return false;
    }

    // Validate email or Philippine phone number
    const contactValue = elements.contact.value.trim();
    if (!isValidContact(contactValue)) {
      elements.contact.classList.add("invalid");
      elements.contact.focus();
      showFeedback("Please enter a valid email or 11-digit Philippine phone number (09XXXXXXXXX).", elements, true);
      return false;
    }

    const normalizedContact = normalizeContact(contactValue);
    const isDuplicateContact = posts.some((post) =>
      post.id !== elements.postId.value && normalizeContact(post.contact) === normalizedContact
    );
    if (isDuplicateContact) {
      elements.contact.classList.add("invalid");
      elements.contact.focus();
      showFeedback("This contact information is already used by another post.", elements, true);
      return false;
    }
    const selectedDate = new Date(`${elements.date.value}T00:00:00`);
    if (Number.isNaN(selectedDate.getTime())) {
      elements.date.classList.add("invalid");
      elements.date.focus();
      showFeedback("Please enter a valid date.", elements, true);
      return false;
    }
    return true;
  }

  function publishPost() {
    saveFormPost();
  }

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
      showFeedback("Your post was updated.", elements);
    } else {
      posts.push({ ...postData, id: generateId(), status: "Open" });
      showFeedback("Your post is now live on the board.", elements);
    }
    savePosts(posts);
    resetForm();
    drawerAPI.closeDrawer();
    renderPosts(elements, posts);
  }

  // Form event listeners
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

  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validateForm()) return;
    if (!elements.postId.value) {
      dialogAPI.openPublishDialog();
      return;
    }
    saveFormPost();
  });

  elements.cancelEdit.addEventListener("click", () => {
    resetForm();
    drawerAPI.closeDrawer();
  });

  elements.openFormBtn.addEventListener("click", () => {
    if (elements.postId.value) resetForm();
    drawerAPI.openDrawer();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.deleteDialog.classList.contains("hidden")) {
      return; // Let dialog handler take this
    }
    if (event.key === "Escape") {
      drawerAPI.closeDrawer();
    }
  });

  return {
    resetForm,
    setType,
    setImagePreview: (data) => {
      selectedImageData = data;
      setImagePreview(elements, data);
    },
    getSelectedImageData: () => selectedImageData,
    updateDescCount,
    editPost: (post) => {
      clearInvalid();
      elements.postId.value = post.id;
      setType(post.type);
      elements.item.value = post.item;
      elements.description.value = post.description;
      elements.location.value = post.location;
      elements.date.value = post.date;
      elements.contact.value = post.contact;
      elements.itemImage.value = "";
      selectedImageData = post.image || "";
      setImagePreview(elements, selectedImageData);
      updateDescCount();
      elements.submitText.textContent = "Save changes";
      elements.formTitle.textContent = "Edit your post";
      elements.cancelEdit.classList.remove("hidden");
      drawerAPI.openDrawer();
    },
    publishPost
  };
})();

// Initialize navigation
initNavigation(elements);

// Initial render
resetForm();
renderPosts(elements, posts);

function resetForm() {
  formAPI.resetForm();
}
