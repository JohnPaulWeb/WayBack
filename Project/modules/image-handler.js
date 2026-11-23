// image-handler.js - Handle image file uploads and validation

const MAX_IMAGE_SIZE = 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function setupImageHandler(elements, { onImagePreview, onFeedback }) {
  elements.itemImage.addEventListener("change", () => {
    handleImageChange(elements, { onImagePreview, onFeedback });
  });

  elements.removeImage.addEventListener("click", () => {
    elements.itemImage.value = "";
    onImagePreview("");
  });
}

function handleImageChange(elements, { onImagePreview, onFeedback }) {
  const [file] = elements.itemImage.files;
  if (!file) return;

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    elements.itemImage.value = "";
    onFeedback("Choose a JPEG, PNG, or WebP image.", true);
    return;
  }

  if (file.size > MAX_IMAGE_SIZE) {
    elements.itemImage.value = "";
    onFeedback("The item photo must be 1 MB or smaller.", true);
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    if (elements.itemImage.files[0] !== file) return;
    if (typeof reader.result !== "string") {
      onFeedback("The item photo could not be read.", true);
      return;
    }
    const image = new Image();
    image.addEventListener("load", () => onImagePreview(reader.result), { once: true });
    image.addEventListener("error", () => {
      elements.itemImage.value = "";
      onFeedback("Choose a valid image file.", true);
    }, { once: true });
    image.src = reader.result;
  }, { once: true });

  reader.addEventListener("error", () => {
    if (elements.itemImage.files[0] !== file) return;
    elements.itemImage.value = "";
    onFeedback("The item photo could not be read.", true);
  }, { once: true });

  reader.readAsDataURL(file);
}

export function setImagePreview(elements, imageData) {
  if (imageData) {
    elements.imagePreviewPhoto.src = imageData;
  } else {
    elements.imagePreviewPhoto.removeAttribute("src");
  }
  elements.imagePreview.classList.toggle("hidden", !imageData);
}
