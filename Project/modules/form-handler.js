// form-handler.js - Handle form interactions and validation

import { todayString, normalizeContact, showFeedback } from "./ui-utils.js";
import { setImagePreview } from "./image-handler.js";

export function setupFormHandler(elements, { posts, onSavePosts, onRenderPosts, onOpenDrawer, onCloseDrawer }) {
  let selectedImageData = "";

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
    if (!validateForm(posts)) return;
    if (!elements.postId.value) {
      openPublishDialog();
      return;
    }
    saveFormPost();
  });

  elements.cancelEdit.addEventListener("click", () => {
    resetForm();
    onCloseDrawer();
  });

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
    elements.contact.placeholder = isFound ? "09XXXXXXXXX or name@gmail.com" : "09XXXXXXXXX or name@gmail.com";
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
    const contactValue = elements.contact.value.trim();
    const isPhone = /^\d+$/.test(contactValue);
    const isEmail = contactValue.includes("@");

    if (isPhone) {
      if (!/^09\d{9}$/.test(contactValue)) {
        elements.contact.classList.add("invalid");
        elements.contact.focus();
        showFeedback("Phone number must be 11 digits and start with 09 (e.g. 09123456789).", elements, true);
        return false;
      }
    } else if (isEmail) {
      if (!/^[^\s@]+@gmail\.com$/i.test(contactValue)) {
        elements.contact.classList.add("invalid");
        elements.contact.focus();
        showFeedback("Email must be a valid Gmail address ending in @gmail.com.", elements, true);
        return false;
      }
    }

    const normalizedContact = normalizeContact(elements.contact.value);
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
      const { generateId } = require("./storage.js");
      posts.push({ ...postData, id: generateId(), status: "Open" });
      showFeedback("Your post is now live on the board.", elements);
    }
    onSavePosts(posts);
    resetForm();
    onCloseDrawer();
    onRenderPosts();
  }

  // Expose necessary functions
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
      onOpenDrawer();
    }
  };
}
