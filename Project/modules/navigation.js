// navigation.js - Handle navigation, scroll-spy, and mobile menu

export function initNavigation(elements) {
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

  // Disable scrolling - only allow scroll when navbar clicked
  function disableScroll(e) {
    // Allow scroll only if link was clicked
    if (!e.target.closest("a")) {
      e.preventDefault();
    }
  }

  // Prevent mouse wheel scrolling
  document.addEventListener("wheel", disableScroll, { passive: false });
  
  // Prevent arrow keys and Page Up/Down scrolling
  document.addEventListener("keydown", (e) => {
    if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", " "].includes(e.key)) {
      if (!e.target.closest("input") && !e.target.closest("textarea")) {
        e.preventDefault();
      }
    }
  });

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
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }
    const targetEl = document.querySelector(targetId);
    if (!targetEl) return;
    const headerHeight = header.getBoundingClientRect().height;
    const top = targetEl.getBoundingClientRect().top + window.pageYOffset - (headerHeight + 16);
    window.scrollTo({ top: Math.max(0, top), behavior: "instant" });
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

  elements.backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "instant" }));
}
