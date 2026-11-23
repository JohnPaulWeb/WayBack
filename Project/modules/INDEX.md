# Module Index and Quick Reference

## Module Imports and Exports

### dom-elements.js
```javascript
import { getDOMElements } from "./modules/dom-elements.js";
// Returns: { form, postId, itemImage, ... (all cached elements) }
```

### storage.js
```javascript
import { generateId, loadPosts, savePosts } from "./modules/storage.js";
// generateId() -> string
// loadPosts() -> array of posts
// savePosts(posts) -> void
```

### ui-utils.js
```javascript
import { 
  todayString, 
  formatDate, 
  escapeHtml, 
  normalizeContact, 
  animateCount, 
  showFeedback 
} from "./modules/ui-utils.js";
```

### image-handler.js
```javascript
import { setupImageHandler, setImagePreview } from "./modules/image-handler.js";
// setupImageHandler(elements, { onImagePreview, onFeedback })
// setImagePreview(elements, imageData)
```

### post-renderer.js
```javascript
import { setupPostRenderer, renderPosts } from "./modules/post-renderer.js";
// setupPostRenderer(elements, { posts, onDeletePost, onResolvePost, onEditPost })
// renderPosts(elements, posts)
```

### dialog-handler.js
```javascript
import { setupDialogHandler } from "./modules/dialog-handler.js";
// setupDialogHandler(elements, { onConfirmDelete, onConfirmPublish })
// Returns: { openDeleteDialog, openPublishDialog, closeDeleteDialog }
```

### drawer-handler.js
```javascript
import { setupDrawerHandler } from "./modules/drawer-handler.js";
// setupDrawerHandler(elements)
// Returns: { openDrawer, closeDrawer }
```

### navigation.js
```javascript
import { initNavigation } from "./modules/navigation.js";
// initNavigation(elements)
```

---

## Common Workflows

### Adding a New Feature
1. Identify which module the feature belongs to
2. Add function to appropriate module
3. Import and use in app-new.js
4. Test in context

### Fixing a Bug
1. Identify which module contains the bug
2. Navigate to module file
3. Debug and fix
4. Test change

### Adding a New Utility
1. Add to ui-utils.js
2. Export the function
3. Import in app-new.js or other modules
4. Use as needed

### Modifying Form Behavior
1. Look in form handling section of app-new.js (IIFE)
2. Adjust event listeners or validation logic
3. Test form submission

### Changing Post Display
1. Edit post-renderer.js
2. Modify postTemplate() function
3. Update renderPosts() logic
4. Test with different filters

---

## File Organization

```
modules/
├── dom-elements.js      ← DOM references
├── storage.js           ← Data I/O
├── ui-utils.js          ← UI helpers
├── image-handler.js     ← Image logic
├── form-handler.js      ← Form logic (reference)
├── post-renderer.js     ← Rendering logic
├── dialog-handler.js    ← Dialog logic
├── drawer-handler.js    ← Drawer logic
└── navigation.js        ← Navigation logic
```

## Quick Debugging Checklist

- [ ] Is the HTML correctly loading `app-new.js` with `type="module"`?
- [ ] Are all imports using correct file paths?
- [ ] Are functions properly exported from modules?
- [ ] Are DOM elements correctly queried in dom-elements.js?
- [ ] Check browser console for import/export errors
- [ ] Verify localStorage is accessible (not in private browsing)
