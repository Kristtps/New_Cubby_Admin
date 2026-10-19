# Inventory Page - Table Layout Fix ✅

## Issues Identified from Screenshot

1. ✅ **Main inventory table** needs better positioning
2. ✅ **History table** needs scrollable container
3. ✅ **Terminology**: "change balance" updates needed
4. ✅ **Table spacing** and alignment improvements

---

## 🔧 Complete CSS Fix

Add these styles to `pages/inventory.html` in the `<style>` section:

```css
/* ============================================
   INVENTORY TABLE LAYOUT FIX
   ============================================ */

/* Main Content Area */
.main-content {
    padding: 40px 44px;
    overflow-y: auto;
    max-height: 100vh;
}

/* Inventory Stats Grid */
.inv-stats-grid { 
    display: grid; 
    grid-template-columns: repeat(3, 1fr); 
    gap: 16px; 
    margin-bottom: 28px; 
}

/* Main Inventory Table Container */
.inv-table-container { 
    background: var(--color-panel-bg); 
    border: 1px solid var(--color-border); 
    border-radius: 16px; 
    overflow: hidden; 
    box-shadow: var(--shadow-md); 
    margin-bottom: 32px;
}

.inv-table-header { 
    display: flex; 
    align-items: center; 
    justify-content: space-between; 
    padding: 20px 24px 16px; 
    border-bottom: 1px solid var(--color-border); 
    gap: 12px; 
    flex-wrap: wrap; 
}

.inv-table-header h3 { 
    font-size: 18px; 
    font-weight: 700; 
    color: var(--color-dark); 
    margin: 0; 
}

.inv-table-header p { 
    font-size: 13px; 
    color: var(--color-text-muted); 
    margin: 2px 0 0; 
}

/* Main Table Scrollable Wrapper */
.inv-table-scroll-wrapper {
    overflow-x: auto;
    overflow-y: auto;
    max-height: 500px;
}

.inv-table { 
    width: 100%; 
    border-collapse: collapse; 
    min-width: 900px;
}

.inv-table thead th { 
    background: linear-gradient(135deg, var(--color-gray-800) 0%, var(--color-gray-700) 100%); 
    color: #fff; 
    padding: 14px 16px; 
    font-size: 11px; 
    font-weight: 700; 
    text-transform: uppercase; 
    letter-spacing: 0.07em; 
    text-align: left; 
    white-space: nowrap;
    position: sticky;
    top: 0;
    z-index: 10;
}

[data-theme="dark"] .inv-table thead th { 
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); 
}

.inv-table tbody tr { 
    border-bottom: 1px solid var(--color-border); 
    transition: background 0.15s; 
}

.inv-table tbody tr:last-child { 
    border-bottom: none; 
}

.inv-table tbody tr:hover { 
    background: var(--color-gray-50); 
}

[data-theme="dark"] .inv-table tbody tr:hover { 
    background: rgba(255, 255, 255, 0.03); 
}

.inv-table td { 
    padding: 16px; 
    font-size: 14px; 
    color: var(--color-text); 
    vertical-align: middle; 
}

/* Custom Scrollbar for Main Table */
.inv-table-scroll-wrapper::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

.inv-table-scroll-wrapper::-webkit-scrollbar-track {
    background: var(--color-bg-light);
    border-radius: 10px;
}

.inv-table-scroll-wrapper::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 10px;
    transition: background 0.2s;
}

.inv-table-scroll-wrapper::-webkit-scrollbar-thumb:hover {
    background: var(--color-primary);
}

.inv-table-scroll-wrapper {
    scrollbar-width: thin;
    scrollbar-color: var(--color-border) var(--color-bg-light);
}

/* ============================================
   HISTORY TABLE SECTION - SCROLLABLE
   ============================================ */

.inv-history-container { 
    background: var(--color-panel-bg); 
    border: 1px solid var(--color-border); 
    border-radius: 16px; 
    overflow: hidden; 
    box-shadow: var(--shadow-md); 
    margin-top: 32px;
    max-height: 600px;
    display: flex;
    flex-direction: column;
}

.inv-history-header { 
    display: flex; 
    align-items: center; 
    justify-content: space-between; 
    padding: 20px 24px 16px; 
    border-bottom: 1px solid var(--color-border); 
    gap: 12px; 
    flex-wrap: wrap;
    flex-shrink: 0;
    background: var(--color-panel-bg);
    position: sticky;
    top: 0;
    z-index: 5;
}

.inv-history-header h3 { 
    font-size: 18px; 
    font-weight: 700; 
    color: var(--color-dark); 
    margin: 0; 
}

.inv-history-header p { 
    font-size: 13px; 
    color: var(--color-text-muted); 
    margin: 2px 0 0; 
}

/* Filter Controls in History Header */
.inv-history-filters {
    display: flex;
    gap: 12px;
    align-items: center;
}

.inv-history-filters select {
    padding: 8px 12px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    font-size: 13px;
    background: var(--color-panel-bg);
    color: var(--color-text);
    cursor: pointer;
    min-width: 150px;
}

/* Scrollable History Table Wrapper */
.inv-history-table-wrapper { 
    overflow-y: auto; 
    overflow-x: hidden; 
    flex: 1;
    scroll-behavior: smooth;
}

.inv-history-table {
    width: 100%;
    border-collapse: collapse;
}

.inv-history-table thead th {
    background: linear-gradient(135deg, var(--color-gray-800) 0%, var(--color-gray-700) 100%);
    color: #fff;
    padding: 12px 16px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    text-align: left;
    white-space: nowrap;
    position: sticky;
    top: 0;
    z-index: 3;
}

[data-theme="dark"] .inv-history-table thead th {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}

.inv-history-table tbody tr {
    border-bottom: 1px solid var(--color-border);
    transition: background 0.15s;
}

.inv-history-table tbody tr:last-child {
    border-bottom: none;
}

.inv-history-table tbody tr:hover {
    background: var(--color-gray-50);
}

[data-theme="dark"] .inv-history-table tbody tr:hover {
    background: rgba(255, 255, 255, 0.03);
}

.inv-history-table td {
    padding: 14px 16px;
    font-size: 14px;
    color: var(--color-text);
    vertical-align: middle;
}

/* History badges */
.hist-badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.hist-badge.refill {
    background: rgba(16, 185, 129, 0.12);
    color: var(--color-primary);
}

.hist-badge.deduct {
    background: rgba(239, 68, 68, 0.12);
    color: #ef4444;
}

/* Empty state */
.hist-empty {
    text-align: center;
    padding: 60px 20px;
    color: var(--color-text-muted);
    font-size: 14px;
}

/* Custom Scrollbar for History Table */
.inv-history-table-wrapper::-webkit-scrollbar {
    width: 8px;
}

.inv-history-table-wrapper::-webkit-scrollbar-track {
    background: var(--color-bg-light);
    border-radius: 10px;
}

.inv-history-table-wrapper::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 10px;
    transition: background 0.2s;
}

.inv-history-table-wrapper::-webkit-scrollbar-thumb:hover {
    background: var(--color-primary);
}

.inv-history-table-wrapper {
    scrollbar-width: thin;
    scrollbar-color: var(--color-border) var(--color-bg-light);
}

/* Dark Mode Scrollbars */
[data-theme="dark"] .inv-table-scroll-wrapper::-webkit-scrollbar-track,
[data-theme="dark"] .inv-history-table-wrapper::-webkit-scrollbar-track {
    background: var(--dark-bg-primary);
}

[data-theme="dark"] .inv-table-scroll-wrapper::-webkit-scrollbar-thumb,
[data-theme="dark"] .inv-history-table-wrapper::-webkit-scrollbar-thumb {
    background: var(--dark-border);
}

[data-theme="dark"] .inv-table-scroll-wrapper::-webkit-scrollbar-thumb:hover,
[data-theme="dark"] .inv-history-table-wrapper::-webkit-scrollbar-thumb:hover {
    background: var(--color-primary);
}

[data-theme="dark"] .inv-table-scroll-wrapper,
[data-theme="dark"] .inv-history-table-wrapper {
    scrollbar-color: var(--dark-border) var(--dark-bg-primary);
}

/* Dark Mode Container Styles */
[data-theme="dark"] .inv-table-container,
[data-theme="dark"] .inv-history-container {
    background: var(--dark-bg-secondary);
    border-color: var(--dark-border);
}

[data-theme="dark"] .inv-table-header h3,
[data-theme="dark"] .inv-history-header h3 {
    color: var(--dark-text-primary);
}

[data-theme="dark"] .inv-table td,
[data-theme="dark"] .inv-history-table td {
    color: var(--dark-text-primary);
}
```

---

## 📋 HTML Structure Updates

### Main Inventory Table

Update the main table structure to include scrollable wrapper:

```html
<div class="inv-table-container">
    <div class="inv-table-header">
        <div>
            <h3>Device Inventory</h3>
            <p>Coin/change balances across all kiosk devices</p>
        </div>
        <input type="text" id="inv-search" placeholder="Search devices...">
    </div>
    
    <!-- Add this wrapper for scrolling -->
    <div class="inv-table-scroll-wrapper">
        <table class="inv-table" id="inv-table">
            <thead>
                <tr>
                    <th>DEVICE</th>
                    <th>LOCATION</th>
                    <th>STATUS</th>
                    <th>CURRENT BALANCE</th>
                    <th>FILL LEVEL</th>
                    <th>LAST REFILLED</th>
                    <th>LAST REFILL AMOUNT</th>
                    <th>ACTION</th>
                </tr>
            </thead>
            <tbody id="inv-tbody">
                <!-- Rows populated by JavaScript -->
            </tbody>
        </table>
    </div>
</div>
```

### History Table

Update the history section structure:

```html
<div class="inv-history-container">
    <div class="inv-history-header">
        <div>
            <h3>Inventory History</h3>
            <p>Track all refills and deductions</p>
        </div>
        <div class="inv-history-filters">
            <select id="hist-device-filter" onchange="applyHistoryFilters()">
                <option value="all">All Devices</option>
            </select>
            <select id="hist-type-filter" onchange="applyHistoryFilters()">
                <option value="all">All Actions</option>
                <option value="Inventory Refill">Refills Only</option>
                <option value="Inventory Deduct">Deductions Only</option>
            </select>
        </div>
    </div>
    
    <!-- Add this wrapper for scrolling -->
    <div class="inv-history-table-wrapper">
        <table class="inv-history-table">
            <thead>
                <tr>
                    <th>TIMESTAMP</th>
                    <th>DEVICE</th>
                    <th>ACTION</th>
                    <th>AMOUNT</th>
                    <th>BALANCE AFTER</th>
                </tr>
            </thead>
            <tbody id="inv-history-tbody">
                <!-- Rows populated by JavaScript -->
            </tbody>
        </table>
    </div>
</div>
```

---

## ✨ Features

### Main Table:
- ✅ **Scrollable horizontally and vertically**
- ✅ **Sticky header** stays visible while scrolling
- ✅ **Max height: 500px** for comfortable viewing
- ✅ **Custom scrollbar** matching design system
- ✅ **Responsive** with minimum width

### History Table:
- ✅ **Max height: 600px** with vertical scrolling
- ✅ **Fixed header** with filters always visible
- ✅ **Smooth scrolling** animation
- ✅ **Custom scrollbar** with hover effects
- ✅ **Dark mode support** for all elements

---

## 🎨 Visual Improvements

### Before:
- Tables extend beyond viewport
- No scrolling capability
- Filters might be hidden
- Awkward horizontal layout

### After:
- ✅ Tables scroll within their containers
- ✅ Headers stay fixed at top
- ✅ Filters always accessible
- ✅ Professional scrollbar styling
- ✅ Better use of vertical space

---

## 🧪 Testing Checklist

### Main Table:
- [ ] Load inventory page
- [ ] Verify table scrolls horizontally if needed
- [ ] Verify table scrolls vertically
- [ ] Header stays at top when scrolling
- [ ] Scrollbar appears and functions
- [ ] Hover effects work on scrollbar
- [ ] Works in dark mode

### History Table:
- [ ] Scroll down to history section
- [ ] Verify header with filters stays fixed
- [ ] Verify table scrolls vertically
- [ ] Test filter dropdowns work
- [ ] Scrollbar matches design
- [ ] Works in dark mode

---

## 📊 Layout Specifications

### Main Table:
- **Max Height**: 500px
- **Min Width**: 900px (for horizontal scroll)
- **Scrollbar Width**: 8px
- **Header**: Sticky, z-index 10

### History Table:
- **Max Height**: 600px
- **Scrollbar Width**: 8px
- **Header**: Sticky, z-index 5
- **Filters**: Always visible in header

---

## ✅ Summary

**Status**: ✅ **COMPLETE CSS PROVIDED**

All necessary CSS and HTML structure updates are documented above. Apply these changes to `pages/inventory.html` to:

1. ✅ Make main inventory table scrollable
2. ✅ Make history table scrollable
3. ✅ Fix table positioning and layout
4. ✅ Add professional custom scrollbars
5. ✅ Ensure dark mode compatibility

The tables will now:
- Scroll independently within their containers
- Keep headers fixed for context
- Use custom styled scrollbars
- Maintain proper spacing and alignment
- Work perfectly in both light and dark themes

---

**Next Steps**: 
1. Open `pages/inventory.html`
2. Add the CSS to the `<style>` section
3. Update HTML structure with wrapper divs
4. Test scrolling behavior
5. Verify dark mode appearance
