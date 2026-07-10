# Dark Mode Quick Reference

## Toggle Control Location
- **Admin Pages**: Sidebar, between navigation and user profile
- **Login Page**: Top-right corner

## Theme Persistence
- Saved in: `localStorage` with key `coincubby_theme`
- Values: `"light"` or `"dark"`
- Fallback: System preference via `prefers-color-scheme`

## CSS Variables Reference

### Theme Application
```css
/* Light Mode (default) */
:root {
    --color-primary: #5FDBA7;
    --color-text: #1f4037;
    --color-bg-light: #f0fdf7;
    /* ... 40+ more variables */
}

/* Dark Mode (when data-theme="dark") */
[data-theme="dark"] {
    --color-primary: #6ee7b7;
    --color-text: #f5f5f5;
    --color-bg-light: #1a1a1a;
    /* ... 40+ more variables */
}
```

### Using Variables in Components
```css
.my-card {
    background-color: var(--color-bg-light);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    transition: all 0.3s ease; /* Optional smooth transition */
}
/* Automatically supports both light and dark themes! */
```

## JavaScript API

### Get Current Theme
```javascript
const theme = window.themeManager.getCurrentTheme(); // 'light' or 'dark'
```

### Toggle Theme
```javascript
window.themeManager.toggleTheme();
```

### Set Specific Theme
```javascript
window.themeManager.setTheme('dark');
window.themeManager.setTheme('light');
```

### Listen for Changes
```javascript
window.addEventListener('themechange', (e) => {
    console.log('New theme:', e.detail.theme);
});
```

## Color Palette Cheatsheet

| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Primary | #5FDBA7 | #6ee7b7 |
| Primary Dark | #3BA57D | #4ade80 |
| Background | #f0fdf7 | #1a1a1a |
| Text | #1f4037 | #f5f5f5 |
| Text Muted | #7da88f | #b0b0b0 |
| Border | #c5e8d6 | #3d3d3d |
| Sidebar | #e6f9f0 | #1f1f1f |
| Card/Table | #ffffff | #242424 |
| **Status - Available** | #5FDBA7 | #4ade80 |
| **Status - Occupied** | #ef4444 | #f87171 |
| **Status - Payment** | #f59e0b | #fbbf24 |
| **Status - Maintenance** | #a78bfa | #c4b5fd |

## Common Customizations

### Add Dark Mode to New Component
1. Use CSS variables instead of hardcoded colors:
   ```css
   .new-component {
       color: var(--color-text);
       background: var(--color-bg-light);
       border: 1px solid var(--color-border);
   }
   ```

2. Test in both light and dark modes - no additional CSS needed!

### Add System Preference Detection
Already built-in! Just initialize ThemeManager:
```html
<script src="../js/theme.js"></script>
<!-- ThemeManager automatically handles detection -->
```

### Force Light or Dark Mode for Testing
```javascript
// Force dark mode
document.documentElement.setAttribute('data-theme', 'dark');
localStorage.setItem('coincubby_theme', 'dark');

// Force light mode
document.documentElement.setAttribute('data-theme', 'light');
localStorage.setItem('coincubby_theme', 'light');
```

## Debugging

### Check Saved Preference
```javascript
console.log(localStorage.getItem('coincubby_theme'));
```

### Check Current Theme in DOM
```javascript
console.log(document.documentElement.getAttribute('data-theme'));
```

### Check CSS Variable Value
```javascript
const style = getComputedStyle(document.documentElement);
console.log(style.getPropertyValue('--color-primary'));
```

### Monitor Theme Changes
```javascript
window.addEventListener('themechange', (e) => {
    console.log('Theme changed:', e.detail.theme);
    console.log('All colors updated in real-time!');
});
```

## Files to Know

| File | Purpose |
|------|---------|
| `js/theme.js` | Theme management system |
| `css/styles.css` | Main CSS variables & styles |
| `css/login.css` | Login page styles |
| `docs/DARK_MODE_IMPLEMENTATION.md` | Full documentation |
| `docs/DARK_MODE_SUMMARY.md` | Complete implementation summary |

## Browser DevTools Tips

### Chrome/Edge Developer Tools
1. Open DevTools (F12)
2. Go to "Rendering" tab
3. Find "Emulate CSS media feature" 
4. Select `prefers-color-scheme: dark` to test

### Firefox Developer Tools
1. Open DevTools (F12)
2. Go to Inspector → Computed
3. Filter CSS variables to debug colors

### iOS Safari
Settings → Accessibility → Display & Text Size → Dark Mode (test device setting)

## Accessibility Checklist
- ✅ ARIA labels on toggle button
- ✅ Keyboard accessible (Tab, Enter/Space)
- ✅ WCAG AA contrast ratios
- ✅ Color not only differentiator (icons + color)
- ✅ No reduced-motion conflicts
- ✅ Focus states visible in both modes

---
**Keep this reference handy when working with theme-aware components!**
