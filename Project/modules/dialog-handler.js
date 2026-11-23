// dialog-handler.js - Handle delete and publish confirmation dialogs

export function setupDialogHandler(elements, { onConfirmDelete, onConfirmPublish }) {
  let pendingDeleteId = "";
  let pendingPublish = false;
  let lastFocused = null;

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
      onConfirmPublish();
      return;
    }
    if (!pendingDeleteId) return;
    const deletedId = pendingDeleteId;
    onConfirmDelete(deletedId);
    closeDeleteDialog();
  });

  elements.deleteDialog.addEventListener("click", (event) => {
    if (event.target === elements.deleteDialog) closeDeleteDialog();
  });

  document.addEventListener("keydown", (event) => {
    const open = !elements.deleteDialog.classList.contains("hidden");
    if (event.key === "Escape" && open) {
      closeDeleteDialog();
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

  return {
    openDeleteDialog,
    openPublishDialog,
    closeDeleteDialog
  };
}
