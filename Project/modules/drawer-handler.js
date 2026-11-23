// drawer-handler.js - Handle the slide-in form drawer

export function setupDrawerHandler(elements) {
  let lastFocused = null;

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

  elements.openFormBtn.addEventListener("click", openDrawer);
  elements.closeDrawerBtn.addEventListener("click", closeDrawer);
  elements.drawerBackdrop.addEventListener("click", closeDrawer);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeDrawer();
    }
  });

  return {
    openDrawer,
    closeDrawer
  };
}
