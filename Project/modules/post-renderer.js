// post-renderer.js - Handle post rendering and display

import { escapeHtml, formatDate, animateCount } from "./ui-utils.js";

export function setupPostRenderer(elements, { posts, onDeletePost, onResolvePost, onEditPost }) {
  elements.postList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const post = posts.find((entry) => entry.id === button.dataset.id);
    if (!post) return;

    if (button.dataset.action === "delete") {
      onDeletePost(post);
      return;
    }
    if (button.dataset.action === "resolve") {
      onResolvePost(post);
      return;
    }
    if (button.dataset.action === "edit") {
      onEditPost(post);
      return;
    }
  });
}

export function renderPosts(elements, posts) {
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
