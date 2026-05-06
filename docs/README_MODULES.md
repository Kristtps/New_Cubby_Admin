# Camping Rental Management - JavaScript Modules

This document provides a comprehensive guide to all JavaScript modules used in the Camping Rental Management System.

## Overview

The JavaScript codebase is organized into modular components, each handling specific functionality:

| Module | Purpose |
|--------|---------|
| `main.js` | Core initialization and sidebar management |
| `dashboard.js` | Dashboard page with statistics and charts |
| `rentals.js` | Rental management functionality |
| `customers.js` | Customer data and profiles management |
| `equipment.js` | Equipment inventory management |
| `reports.js` | Reporting and analytics |
| `settings.js` | Application settings and preferences |
| `api.js` | Backend API communication |
| `auth.js` | Authentication and authorization |
| `storage.js` | Local storage and caching |
| `theme.js` | Theme and dark mode management |
| `utils.js` | Utility functions and helpers |
| `validation.js` | Form and data validation |
| `service-worker.js` | Progressive Web App support |

## Module Details

### 1. main.js
Core functionality for all pages.

**Key Functions:**
- `initializeSidebar()` - Initialize sidebar navigation
- `handleNavigation(page)` - Handle page navigation
- `setupEventDelegation()` - Setup event delegation

### 2. dashboard.js
Dashboard page with statistics and charts.

**Key Functions:**
- `initializeDashboard()` - Initialize dashboard
- `loadDashboardData()` - Load statistics from API
- `initializeCharts()` - Setup Chart.js charts
- `updateDashboardStats()` - Update stat cards

**Example Usage:**
```javascript
// Initialize dashboard
initializeDashboard();

// Load and display data
loadDashboardData();

// Update specific stats
updateDashboardStats({
    totalRevenue: 5000,
    totalRentals: 25,
    activeRentals: 5
});
```

### 3. rentals.js
Rental management and tracking.

**Key Functions:**
- `loadRentalsList()` - Load all rentals
- `createRental(rentalData)` - Create new rental
- `updateRental(rentalId, data)` - Update rental
- `completeRental(rentalId)` - Mark rental complete
- `processRentalPayment(rentalId, amount, method)` - Process payment

**Example Usage:**
```javascript
// Create new rental
createRental({
    customerId: 'CUST001',
    equipment: ['EQ001', 'EQ002'],
    startDate: '2024-04-15',
    endDate: '2024-04-17',
    totalCost: 800
});

// Process payment
processRentalPayment('RENT001', 800, 'credit_card');
```

### 4. customers.js
Customer management (NOTE: Already existed with different implementation).

**Key Functions:**
- `loadCustomersList()` - Load all customers
- `updateCustomerWallet(customerId, amount)` - Update wallet
- `addCustomerRow(customerData)` - Add customer to table
- `refreshCustomersFromDatabase(customersData)` - Refresh customer list

### 5. equipment.js
Equipment inventory management.

**Key Functions:**
- `loadEquipmentInventory()` - Load all equipment
- `addEquipmentItem(equipmentData)` - Add equipment
- `updateEquipmentItem(equipmentId, data)` - Update equipment
- `deleteEquipmentItem(equipmentId)` - Remove equipment
- `logMaintenance(equipmentId, maintenanceData)` - Log maintenance

**Example Usage:**
```javascript
// Add new equipment
addEquipmentItem({
    name: 'Tent - 4 Person',
    category: 'Shelters',
    quantity: 15,
    condition: 'Good'
});

// Log maintenance
logMaintenance('EQ001', {
    type: 'repair',
    description: 'Fixed torn seam',
    date: '2024-04-15'
});
```

### 6. reports.js
Reporting and analytics functionality.

**Key Functions:**
- `initializeRevenueChart()` - Initialize revenue chart
- `initializeRentalsChart()` - Initialize rentals breakdown chart
- `updateReportStats(statsData)` - Update report statistics
- `generateRevenueReport(options)` - Generate revenue report

**Chart Types:**
- Revenue & Rentals (Line chart)
- Rentals by Size (Doughnut chart)

### 7. settings.js
Application settings and preferences.

**Key Functions:**
- `saveProfileSettings(form)` - Save profile
- `updateCurrencySetting(currency)` - Change currency
- `updateLanguageSetting(language)` - Change language
- `updateNotificationPreference(type, enabled)` - Toggle notifications
- `changePassword(current, new)` - Change password

### 8. api.js
Backend API communication layer.

**Key Functions:**
- `apiRequest(endpoint, method, data)` - Make API request
- `login(email, password)` - User login
- `getRentals(filters)` - Get rentals
- `getCustomers(filters)` - Get customers
- `getEquipment(filters)` - Get equipment
- `processPayment(paymentData)` - Process payment

**Usage:**
```javascript
// Make API call
const rentals = await getRentals({ status: 'active' });

// Get customer details
const customer = await getCustomerById('CUST001');

// Create new rental
const rental = await createRental(rentalData);
```

**Error Handling:**
All API functions use try-catch. Token is automatically included in headers.

### 9. auth.js
Authentication and user management.

**Key Functions:**
- `performLogin(email, password, rememberMe)` - Login user
- `performLogout()` - Logout user
- `performRegister(userData)` - Register new user
- `getCurrentUser()` - Get current user
- `hasPermission(permission)` - Check user permission
- `hasRole(role)` - Check user role
- `changePassword(current, new)` - Change password
- `enableTwoFactorAuth(method)` - Enable 2FA

**Events:**
Listen for authentication events:
```javascript
onAuthEvent((detail) => {
    const { type, data } = detail;
    if (type === 'login') {
        console.log('User logged in:', data);
    }
});
```

### 10. storage.js
Local storage and caching utilities.

**Key Functions:**
- `saveToStorage(key, value, expiryTime)` - Save data
- `getFromStorage(key, defaultValue)` - Retrieve data
- `removeFromStorage(key)` - Delete data
- `cacheAPIResponse(url, data, ttl)` - Cache API responses
- `getCachedAPIResponse(url)` - Get cached response

**Usage:**
```javascript
// Save data with expiry (5 minutes)
saveToStorage('user_data', userData, 300000);

// Get data
const data = getFromStorage('user_data');

// Cache API response
cacheAPIResponse('/api/rentals', rentalsData, 600000);
```

### 11. theme.js
Theme and dark mode management.

**Key Functions:**
- `initializeTheme()` - Initialize theme system
- `toggleTheme()` - Toggle light/dark mode
- `applyTheme(theme)` - Apply theme
- `isDarkMode()` - Check if dark mode
- `setCustomColorTheme(colors)` - Set custom colors

**Usage:**
```javascript
// Toggle theme
toggleTheme();

// Check current theme
const isDark = isDarkMode();

// Set custom colors
setCustomColorTheme({
    primary: '#3B82F6',
    accent: '#06b6d4'
});

// Listen for theme changes
watchThemeChanges((newTheme) => {
    console.log('Theme changed to:', newTheme);
});
```

### 12. utils.js
Utility functions and helpers.

**Key Functions:**
- `formatDate(date, format)` - Format date
- `formatCurrency(amount, currency)` - Format currency
- `calculateDaysDifference(start, end)` - Calculate days
- `debounce(func, delay)` - Debounce function
- `throttle(func, limit)` - Throttle function
- `sortByProperty(array, prop)` - Sort array
- `groupBy(array, prop)` - Group array
- `showToast(message, type, duration)` - Show toast notification

**Usage:**
```javascript
// Format date
const date = formatDate(new Date(), 'MMM DD, YYYY');

// Format currency
const price = formatCurrency(1500, '₱');

// Debounce search
const debouncedSearch = debounce((term) => {
    // Search logic
}, 300);

// Sort objects
const sorted = sortByProperty(customers, 'name', 'asc');

// Show notification
showToast('Rental created successfully', 'success', 3000);
```

### 13. validation.js
Form and data validation.

**Key Functions:**
- `validateField(field)` - Validate single field
- `validateForm(form)` - Validate entire form
- `isValidEmail(email)` - Validate email
- `isValidPhoneNumber(phone)` - Validate phone
- `isStrongPassword(password)` - Check password strength
- `validateFile(file, options)` - Validate file upload
- `validateObject(obj, schema)` - Validate object against schema

**Usage:**
```javascript
// Validate form
const isValid = validateForm(document.querySelector('form'));

// Validate object
const result = validateObject(customerData, {
    name: { required: true, type: 'string' },
    email: { required: true, validator: isValidEmail },
    phone: { required: true, validator: isValidPhoneNumber }
});

// Validate file
const fileValidation = validateFile(file, {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png']
});
```

### 14. service-worker.js
Progressive Web App support.

**Features:**
- Offline functionality
- Asset caching
- API request caching
- Background sync
- Push notifications

**Installation:**
Register in main.js:
```javascript
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js');
}
```

## Module Dependencies

```
Main Page
├── main.js
├── auth.js (AuthPages)
└── theme.js

Dashboard
├── dashboard.js
├── main.js
├── api.js
└── utils.js

Rentals/Customers/Equipment/Reports
├── [page].js
├── main.js
├── api.js
├── validation.js
└── utils.js

All Pages
├── auth.js (Check auth)
├── storage.js (Cache)
├── theme.js (Apply theme)
└── service-worker.js (Background)
```

## Loading Order

Include scripts in this order for proper initialization:

```html
<!-- Utilities first -->
<script src="utils.js"></script>
<script src="storage.js"></script>
<script src="validation.js"></script>

<!-- Foundation modules -->
<script src="theme.js"></script>
<script src="auth.js"></script>
<script src="api.js"></script>

<!-- Page-specific modules -->
<script src="main.js"></script>
<script src="dashboard.js"></script>
<script src="rentals.js"></script>
<script src="customers.js"></script>
<script src="equipment.js"></script>
<script src="reports.js"></script>
<script src="settings.js"></script>

<!-- Service Worker -->
<script>
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js');
}
</script>
```

## Common Patterns

### API Call Pattern
```javascript
try {
    const data = await apiRequest('/endpoint', 'POST', { key: value });
    showToast('Success', 'success');
} catch (error) {
    console.error('Error:', error);
    showToast('Error occurred', 'error');
}
```

### Form Submission Pattern
```javascript
const form = document.querySelector('form');
form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (validateForm(form)) {
        const data = getFormData(form);
        // Process data
    }
});
```

### Data Caching Pattern
```javascript
// Check cache first
let data = getCachedAPIResponse(url);

if (!data) {
    // Fetch from API if not cached
    data = await apiRequest(url);
    // Cache for 5 minutes
    cacheAPIResponse(url, data, 300000);
}
```

### Theme Listening Pattern
```javascript
watchThemeChanges((theme) => {
    // Respond to theme changes
    updateUIForTheme(theme);
});
```

## Configuration

### API Base URL
Edit `api.js`:
```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

### Cache Duration (storage.js)
```javascript
// API responses cache 5 minutes
cacheAPIResponse(url, data, 300000);

// Custom data cache 1 hour
saveToStorage(key, data, 3600000);
```

## Error Handling

All modules include error handling. Check browser console for logs:
```javascript
try {
    // Operation
} catch (error) {
    console.error('Module error:', error);
}
```

## Performance Tips

1. Use debounce for search/filter operations
2. Cache API responses to reduce server load
3. Lazy load page-specific JavaScript
4. Use service worker for offline support
5. Implement pagination for large datasets

## Browser Support

- Chrome 51+
- Firefox 54+
- Safari 10+
- Edge 15+
- Modern mobile browsers

## Troubleshooting

### Auth token not persisting
- Check localStorage is enabled
- Verify token is being saved in `auth.js`

### Styles not applying theme
- Ensure `theme.js` loads before page-specific modules
- Check CSS variables are defined in stylesheet

### API calls failing
- Verify server is running
- Check API_BASE_URL in `api.js`
- Verify auth token in localStorage

### Service Worker not registering
- Check HTTPS is enabled (or localhost)
- Verify `service-worker.js` path is correct
- Check browser console for errors
