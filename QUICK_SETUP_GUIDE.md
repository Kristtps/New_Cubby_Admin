# ✅ Tagalog Language & Theme Toggle - QUICK SETUP GUIDE

## What's Done:

### ✅ Language System - 100% READY
- All English & Tagalog translations complete in `js/language.js`
- Profile page already working with language toggle
- Just need to add `data-i18n` to other HTML pages

### ✅ Theme Toggle - 100% WORKING  
- Profile page theme button now works!
- Click the toggle button in Profile → Preferences → Appearance
- Switches between Light/Dark mode
- Saves preference automatically

---

## How To Test Right Now:

1. Open your website
2. Go to **Profile** page
3. Scroll to **Preferences** section
4. Click **Appearance** toggle button → Theme changes!
5. Click **Language** dropdown → Select Tagalog
6. Profile page text changes to Tagalog!

---

## What You Need To Do:

### To Make ALL Pages Translatable (Not Just Profile):

You need to add `data-i18n="translation.key"` to HTML elements.

**Example - Lockers Page:**

#### BEFORE (Current):
```html
<h1>Locker Management</h1>
<p class="subtitle">Control compartments</p>
<span>Overview</span>
<span>Lockers</span>
```

#### AFTER (With Translation):
```html
<h1 data-i18n="lockers.title">Locker Management</h1>
<p class="subtitle" data-i18n="lockers.subtitle">Control compartments</p>
<span data-i18n="nav.overview">Overview</span>
<span data-i18n="nav.lockers">Lockers</span>
```

That's it! When you change language in Profile page, all text with `data-i18n` will automatically translate.

---

## Pages To Update:

All translations are ready in `js/language.js`. Just add `data-i18n` to:

1. ✅ **profile.html** - Already done, works!
2. ⚠️ **login.html** - Add `data-i18n`
3. ⚠️ **index.html** (Overview) - Add `data-i18n`
4. ⚠️ **lockers.html** - Add `data-i18n`
5. ⚠️ **customers.html** - Add `data-i18n`
6. ⚠️ **transactions.html** - Add `data-i18n`
7. ⚠️ **rentals.html** - Add `data-i18n`
8. ⚠️ **rates.html** - Add `data-i18n`
9. ⚠️ **reports.html** - Add `data-i18n`
10. ⚠️ **feedback.html** - Add `data-i18n`
11. ⚠️ **notifications.html** - Add `data-i18n`
12. ⚠️ **auditlog.html** - Add `data-i18n`

---

## Translation Keys Reference:

See complete list in `docs/TAGALOG_LANGUAGE_SYSTEM.md`

### Most Common Keys:

**Navigation:**
- `nav.overview` = Overview / Pangkalahatang-Tanaw
- `nav.lockers` = Lockers / Mga Locker
- `nav.customers` = Customers / Mga Customer
- `nav.transactions` = Transactions / Mga Transaksyon

**Buttons:**
- `btn.add` = Add / Magdagdag
- `btn.edit` = Edit / I-edit
- `btn.delete` = Delete / Tanggalin
- `btn.save` = Save / I-save
- `btn.close` = Close / Isara

**Status:**
- `status.available` = Available / Magagamit
- `status.occupied` = Occupied / May Laman
- `status.maintenance` = Maintenance / Kinakaayos

---

## Need Help?

If you want me to update a specific page with `data-i18n` attributes, just ask:
- "Add translations to lockers page"
- "Add translations to login page"
- "Add translations to overview page"

I can update any page for you!

---

## Files To Read:

1. **`docs/TAGALOG_LANGUAGE_SYSTEM.md`** - Complete documentation
2. **`js/language.js`** - All translations (English & Tagalog)
3. **`pages/profile.html`** - Example of working page with `data-i18n`

---

Last Updated: 2026-07-18
