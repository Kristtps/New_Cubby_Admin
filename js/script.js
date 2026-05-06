// Add interactive features and database integration support
// Sign Out Button Handler - Makes all .sign-out links functional

document.addEventListener('click', function(e) {
    const logoutLink = e.target.closest('.sign-out');
    if (logoutLink) {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
            if (typeof logoutUser !== 'undefined') {
                logoutUser();
            } else {
                localStorage.removeItem('coincubby_auth');
                window.location.href = 'login.html';
            }
        }
    }
});

// Protect this page from unauthorized access (only if not authenticated)
document.addEventListener('DOMContentLoaded', async function() {
    // Wait for Supabase to initialize if needed
    if (window.supabasePromise) {
        await window.supabasePromise;
    }
    
    if (typeof protectPage !== 'undefined') {
        protectPage();
    } else if (typeof isUserAuthenticated !== 'undefined') {
        if (!isUserAuthenticated()) {
            console.log('User not authenticated, redirecting to login...');
            window.location.href = 'login.html';
            return;
        }
    }
    
    initializeSidebar();
    
    // Static sign-out links now handled universally above, skip dynamic nav button
    // if (typeof addLogoutButton !== 'undefined') {
    //     addLogoutButton();
    // }
    
    // Check which page we're on
    if (document.getElementById('lockers-table')) {
        await initializeLockerManagement();
    } else {
        // Try to load data from database first
        if (typeof isSupabaseConnected !== 'undefined' && isSupabaseConnected()) {
            try {
                console.log('Loading dashboard data from Supabase...');
                const stats = await getDashboardStats();
                const lockers = await fetchAllLockers();
                
                // Update UI with database data
                const dashboardData = {
                    stats: {
                        'total-lockers': (lockers && lockers.length) || 0,
                        'active-rentals': (stats && stats.activeRentals) || 0,
                        'total-customers': (stats && stats.totalCustomers) || 0,
                        'today-revenue': ((stats && stats.todayRevenue) || 0).toFixed(2)
                    },
                    recentRentals: (stats && stats.recentRentals) || []
                };
                
                refreshDashboardFromDatabase(dashboardData);
                console.log('Dashboard data loaded from database:', dashboardData);
            } catch (error) {
                console.error('Error loading dashboard data from database:', error);
                console.log('Falling back to sample data...');
                initializeLockers();
            }
        } else {
            console.log('Supabase not connected, using sample data');
            initializeLockers();
        }
        
        animateStats();
    }
});

// ==================== DATABASE HELPER FUNCTIONS ====================

/**
 * Get dashboard statistics from database
 * This will be called by db-operations.js and exposed globally
 */
async function getDashboardStats() {
    if (typeof dbOps !== 'undefined' && dbOps.getDashboardStats) {
        return await dbOps.getDashboardStats();
    }
    return null;
}

/**
 * Fetch all lockers from database
 */
async function fetchAllLockers() {
    if (typeof dbOps !== 'undefined' && dbOps.fetchAllLockers) {
        return await dbOps.fetchAllLockers();
    }
    return [];
}

// ==================== DATABASE INTEGRATION FUNCTIONS ====================
// Use these functions to update UI with database data without changing the design

/**
 * Update a stat value from database
 * @param {string} statKey - 'total-lockers', 'active-rentals', 'total-customers', 'today-revenue'
 * @param {string|number} value - New value from database
 */
function updateStat(statKey, value) {
    const statCard = document.querySelector(`[data-stat="${statKey}"] .stat-value`);
    if (statCard) {
        const currency = statCard.getAttribute('data-currency');
        if (currency) {
            statCard.textContent = currency + value;
        } else {
            statCard.textContent = value;
        }
    }
}

/**
 * Update all stats at once
 * @param {object} statsData - Object with stat keys and values
 * Example: { 'total-lockers': 20, 'active-rentals': 3, 'total-customers': 5, 'today-revenue': '150.00' }
 */
function updateAllStats(statsData) {
    Object.keys(statsData).forEach(key => {
        updateStat(key, statsData[key]);
    });
}

/**
 * Update locker status and styling
 * @param {string} lockerId - Locker ID (e.g., 'L1', 'M2', 'S3')
 * @param {string} newStatus - Status: 'available', 'occupied', 'payment', 'maintenance'
 */
function updateLockerStatus(lockerId, newStatus) {
    const locker = document.querySelector(`[data-locker-id="${lockerId}"]`);
    if (locker) {
        // Remove old status classes
        locker.classList.remove('available', 'occupied', 'payment', 'maintenance');
        
        // Add new status class
        locker.classList.add(newStatus);
        
        // Update data attribute
        locker.setAttribute('data-status', newStatus);
    }
}

/**
 * Update multiple locker statuses
 * @param {object} lockerUpdates - Object with lockerId: status pairs
 * Example: { 'L1': 'occupied', 'M2': 'available', 'S3': 'payment' }
 */
function updateLockerStatuses(lockerUpdates) {
    Object.keys(lockerUpdates).forEach(lockerId => {
        updateLockerStatus(lockerId, lockerUpdates[lockerId]);
    });
}

/**
 * Update a module's available count
 * @param {number} moduleId - Module ID (1 or 2)
 * @param {number} count - Number of available lockers
 */
function updateModuleAvailableCount(moduleId, count) {
    const module = document.querySelector(`[data-module-id="${moduleId}"]`);
    if (module) {
        const countElement = module.querySelector('[data-available-count]');
        if (countElement) {
            countElement.textContent = count + ' available';
            countElement.setAttribute('data-available-count', count);
        }
    }
}

/**
 * Add or update a rental in the recent rentals list
 * @param {object} rentalData - { id, customerName, lockerInfo, amount }
 * Example: { id: 1, customerName: 'John Doe', lockerInfo: 'Locker M1 • Apr 17, 10:30', amount: '₱25' }
 */
function updateRental(rentalData) {
    const rentalsList = document.getElementById('rentals-list');
    
    // Check if rental already exists
    let rentalItem = document.querySelector(`[data-rental-id="${rentalData.id}"]`);
    
    if (!rentalItem) {
        // Create new rental element
        rentalItem = document.createElement('div');
        rentalItem.className = 'rental-item';
        rentalItem.setAttribute('data-rental-id', rentalData.id);
        rentalsList.appendChild(rentalItem);
    }
    
    // Update rental content
    rentalItem.innerHTML = `
        <p class="rental-customer" data-field="customer-name">${rentalData.customerName}</p>
        <p class="rental-details" data-field="locker-info">${rentalData.lockerInfo}</p>
        <p class="rental-price" data-field="rental-amount">${rentalData.amount}</p>
    `;
}

/**
 * Update recent rentals list with multiple items
 * @param {array} rentalsData - Array of rental objects
 */
function updateRentalsList(rentalsData) {
    const rentalsList = document.getElementById('rentals-list');
    rentalsList.innerHTML = '';
    
    rentalsData.forEach(rental => {
        updateRental(rental);
    });
}

/**
 * Refresh UI with complete dashboard data from database
 * @param {object} dashboardData - Complete dashboard data object
 */
function refreshDashboardFromDatabase(dashboardData) {
    // Update stats
    if (dashboardData.stats) {
        updateAllStats(dashboardData.stats);
    }
    
    // Update locker statuses
    if (dashboardData.lockers) {
        updateLockerStatuses(dashboardData.lockers);
    }
    
    // Update module availability counts
    if (dashboardData.modules) {
        Object.keys(dashboardData.modules).forEach(moduleId => {
            updateModuleAvailableCount(moduleId, dashboardData.modules[moduleId].availableCount);
        });
    }
    
    // Update recent rentals
    if (dashboardData.recentRentals) {
        updateRentalsList(dashboardData.recentRentals);
    }
}

// ==================== ORIGINAL FEATURES ====================

// Sidebar navigation
function initializeSidebar() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // Only prevent default if it's an anchor link
            if (this.getAttribute('href') === '#') {
                e.preventDefault();
            }
            
            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
        });
    });
}

// ==================== LOCKER MANAGEMENT PAGE FUNCTIONS ====================

let lockerRecords = [];

/**
 * Initialize locker management page functionality
 */
async function initializeLockerManagement() {
    lockerRecords = await loadLockerRecords();
    renderLockersTable();
    initializeActionButtons();
    initializeAddLockerButton();
    initializeModal();
}

async function loadLockerRecords() {
    try {
        if (typeof isSupabaseConnected !== 'undefined' && isSupabaseConnected() &&
            typeof dbOps !== 'undefined' && dbOps.fetchAllLockers) {
            const dbRows = await dbOps.fetchAllLockers();
            if (dbRows === null) {
                alert('Supabase lockers connection failed. Showing local sample data.');
                return getDefaultLockerData();
            }
            if (!Array.isArray(dbRows)) {
                alert('Unexpected lockers response from Supabase. Showing local sample data.');
                return getDefaultLockerData();
            }
            if (dbRows.length === 0) {
                alert('No lockers found from Supabase. Showing local sample data.');
                return getDefaultLockerData();
            }
            const mapped = mapDbRowsToLockerRecords(dbRows || []);
            if (mapped.length === 0) {
                alert('Could not map Supabase lockers data. Showing local sample data.');
                return getDefaultLockerData();
            }
            return mapped;
        }
    } catch (error) {
        console.error('Error loading lockers from database:', error);
    }
    return getDefaultLockerData();
}

/**
 * Initialize action button handlers
 */
function initializeActionButtons() {
    const tbody = document.getElementById('lockers-tbody');
    
    if (!tbody) return;
    
    tbody.addEventListener('click', function(e) {
        const btn = e.target.closest('.action-btn');
        if (!btn) return;
        
        const row = btn.closest('tr');
        const lockerId = row.getAttribute('data-locker-row');
        const action = btn.getAttribute('data-action');
        const locker = lockerRecords.find(item => item.code === lockerId);
        if (!locker) return;
        
        if (action === 'occupied') {
            handleOccupiedToggle(locker);
        } else if (action === 'maintenance') {
            handleMaintenanceToggle(locker);
        } else if (action === 'emergency-unlock') {
            handleEmergencyUnlock(locker);
        } else if (action === 'delete') {
            handleDeleteAction(locker);
        }
    });
}

/**
 * Handle occupied toggle button click - cycles between available and occupied
 */
function handleOccupiedToggle(locker) {
    locker.status = locker.status === 'occupied' ? 'available' : 'occupied';
    persistLockerStatus(locker);
    renderLockersTable();
    console.log(`Occupied toggle for locker: ${locker.code} -> ${locker.status}`);
}

/**
 * Handle maintenance toggle button click - cycles between available and maintenance
 */
function handleMaintenanceToggle(locker) {
    locker.status = locker.status === 'maintenance' ? 'available' : 'maintenance';
    persistLockerStatus(locker);
    renderLockersTable();
    console.log(`Maintenance toggle for locker: ${locker.code} -> ${locker.status}`);
}

/**
 * Emergency unlock always returns the locker to available.
 */
function handleEmergencyUnlock(locker) {
    if (!confirm(`Emergency unlock ${locker.code}?`)) return;
    locker.status = 'available';
    persistLockerStatus(locker);
    renderLockersTable();
    console.log(`Emergency unlock applied to locker: ${locker.code}`);
}

/**
 * Handle delete button click
 */
function handleDeleteAction(locker) {
    if (!confirm(`Are you sure you want to delete locker ${locker.code}?`)) return;
    lockerRecords = lockerRecords.filter(item => item.code !== locker.code);
    renderLockersTable();
    console.log(`Delete action for locker: ${locker.code}`);
}

/**
 * Initialize add locker button
 */
function initializeAddLockerButton() {
    const addModuleBtn = document.getElementById('add-module-btn');
    if (addModuleBtn) {
        addModuleBtn.addEventListener('click', function() {
            addDefaultModule();
        });
    }
}

/**
 * Initialize modal open/close functionality
 */
function initializeModal() {
    const modal = document.getElementById('add-locker-modal');
    const closeBtn = document.getElementById('modal-close-btn');
    const form = document.getElementById('add-locker-form');
    
    if (!modal) return;
    
    // Close button click
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            closeAddLockerModal();
        });
    }
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeAddLockerModal();
        }
    });
    
    // Form submission
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleAddLockerSubmit();
        });
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAddLockerModal();
        }
    });
}

/**
 * Open add locker modal
 */
function openAddLockerModal() {
    const modal = document.getElementById('add-locker-modal');
    if (modal) {
        modal.classList.add('active');
        // Reset form
        const form = document.getElementById('add-locker-form');
        if (form) form.reset();
        // Focus on first input
        const firstInput = document.getElementById('locker-code');
        if (firstInput) firstInput.focus();
    }
}

/**
 * Close add locker modal
 */
function closeAddLockerModal() {
    const modal = document.getElementById('add-locker-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Handle add locker form submission
 */
function handleAddLockerSubmit() {
    const form = document.getElementById('add-locker-form');
    if (!form) return;
    
    const formData = new FormData(form);
    const lockerData = {
        code: formData.get('code'),
        size: formData.get('size'),
        module: 'M' + formData.get('module'),
        device: formData.get('device'),
        status: 'available'
    };
    
    console.log('Adding new locker:', lockerData);
    lockerRecords.push(lockerData);
    renderLockersTable();
    
    // Close modal
    closeAddLockerModal();
    
    // Optional: Show success message
    alert(`Locker ${lockerData.code} added successfully!`);
}

function addLockerRow(lockerData) {
    const tbody = document.getElementById('lockers-tbody');
    if (!tbody) return;

    const newRow = document.createElement('tr');
    newRow.setAttribute('data-locker-row', lockerData.code);

    newRow.innerHTML = `
        <td class="code-cell"><span class="locker-code" data-field="code">${lockerData.code}</span></td>
        <td class="size-cell"><span data-field="size">${lockerData.size}</span></td>
        <td class="module-cell"><span data-field="module">${lockerData.module}</span></td>
        <td class="device-cell"><span data-field="device">${lockerData.device}</span></td>
        <td class="status-cell"><span class="status-badge ${lockerData.status}" data-field="status">${lockerData.status}</span></td>
        <td class="actions-cell">
            <button class="action-btn occupied-btn" title="Toggle Occupied/Available" data-action="occupied">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11"></rect>
                    <path d="M7 11V7a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v4"></path>
                </svg>
            </button>
            <button class="action-btn maintenance-btn" title="Toggle Maintenance" data-action="maintenance">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2v20m0-20L7 7m10 0L17 7M5 12h14m-14 5h14"></path>
                </svg>
            </button>
            <button class="action-btn emergency-btn" title="Emergency Unlock" data-action="emergency-unlock">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 1v6"></path>
                    <path d="M5 8v5a7 7 0 0 0 14 0V8"></path>
                    <rect x="9" y="11" width="6" height="4" rx="1"></rect>
                </svg>
            </button>
            <button class="action-btn delete-btn" title="Delete" data-action="delete">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
            </button>
        </td>
    `;

    tbody.appendChild(newRow);
}

function renderLockersTable() {
    const tbody = document.getElementById('lockers-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (!Array.isArray(lockerRecords) || lockerRecords.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#6b7280;">No lockers to display.</td></tr>';
        return;
    }

    const grouped = groupLockersByModule(lockerRecords);
    Object.keys(grouped)
        .sort((a, b) => parseInt(a.replace('M', ''), 10) - parseInt(b.replace('M', ''), 10))
        .forEach(moduleName => {
            const groupRow = document.createElement('tr');
            groupRow.className = 'module-group-row';
            groupRow.innerHTML = `<td colspan="6">${moduleName} • ${grouped[moduleName].length} lockers</td>`;
            tbody.appendChild(groupRow);

            grouped[moduleName].forEach(locker => addLockerRow(locker));
        });
}

/**
 * Update multiple lockers from database
 * @param {array} lockersData - Array of locker objects
 */
function updateAllLockers(lockersData) {
    lockerRecords = lockersData.slice();
    renderLockersTable();
}

function groupLockersByModule(lockersData) {
    return lockersData.reduce((acc, locker) => {
        if (!acc[locker.module]) {
            acc[locker.module] = [];
        }
        acc[locker.module].push(locker);
        return acc;
    }, {});
}

function addDefaultModule() {
    const nextModuleNumber = getNextModuleNumber();
    const moduleName = `M${nextModuleNumber}`;
    const deviceId = `DEV-${String(nextModuleNumber).padStart(2, '0')}`;
    const template = getModuleTemplate();

    if (!confirm(`Add ${moduleName} with ${template.length} lockers (same setup as existing modules)?`)) return;

    const moduleLockers = template.map(locker => {
        const code = getNextLockerCode(locker.prefix);
        return {
            code: code,
            size: locker.size,
            module: moduleName,
            device: deviceId,
            status: 'available'
        };
    });

    lockerRecords.push(...moduleLockers);
    persistNewModuleLockers(moduleLockers);

    renderLockersTable();
    alert(`${moduleName} added successfully.`);
}

function getNextModuleNumber() {
    const modules = lockerRecords.map(locker => parseInt(locker.module.replace('M', ''), 10));
    const maxModule = modules.length ? Math.max(...modules) : 0;
    return maxModule + 1;
}

function getModuleTemplate() {
    return [
        { prefix: 'L', size: 'Large' },
        { prefix: 'M', size: 'Medium' },
        { prefix: 'S', size: 'Small' },
        { prefix: 'S', size: 'Small' }
    ];
}

function getDefaultLockerData() {
    return [
        { code: 'L1', size: 'Large', module: 'M1', device: 'DEV-01', status: 'available' },
        { code: 'M1', size: 'Medium', module: 'M1', device: 'DEV-01', status: 'available' },
        { code: 'S1', size: 'Small', module: 'M1', device: 'DEV-01', status: 'occupied' },
        { code: 'S2', size: 'Small', module: 'M1', device: 'DEV-01', status: 'occupied' },
        { code: 'L2', size: 'Large', module: 'M2', device: 'DEV-02', status: 'occupied' },
        { code: 'M2', size: 'Medium', module: 'M2', device: 'DEV-02', status: 'available' },
        { code: 'S3', size: 'Small', module: 'M2', device: 'DEV-02', status: 'available' },
        { code: 'S4', size: 'Small', module: 'M2', device: 'DEV-02', status: 'maintenance' }
    ];
}

function normalizeStatus(status) {
    const value = String(status || 'available').toLowerCase();
    if (value === 'available' || value === 'occupied' || value === 'maintenance' || value === 'payment') {
        return value;
    }
    return 'available';
}

function formatStatusForDb(status) {
    const normalized = normalizeStatus(status);
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getSizeTypeIdFromSize(size) {
    const map = { Small: 1, Medium: 2, Large: 3 };
    return map[size] || 1;
}

function mapDbRowsToLockerRecords(rows) {
    if (!Array.isArray(rows) || rows.length === 0) return [];

    const sortedRows = rows.slice().sort((a, b) => {
        const aId = a.locker_id || a.id || 0;
        const bId = b.locker_id || b.id || 0;
        return aId - bId;
    });

    return sortedRows.map((row, index) => {
        const number = row.locker_number || row.code || `L${index + 1}`;
        const moduleNumber = row.module_number || row.module || row.module_id || inferModuleFromLockerNumber(number);
        const size = row.size ||
            (row.size_type_id === 1 ? 'Small' : row.size_type_id === 2 ? 'Medium' : 'Large');
        return {
            code: number,
            size: size,
            module: String(moduleNumber).startsWith('M') ? String(moduleNumber) : `M${moduleNumber}`,
            device: row.device || row.device_id || `DEV-${String(Math.floor(index / 4) + 1).padStart(2, '0')}`,
            status: normalizeStatus(row.status),
            dbLockerId: row.locker_id || row.id || null
        };
    });
}

function inferModuleFromLockerNumber(lockerNumber) {
    const code = String(lockerNumber || '').toUpperCase();
    const numericPart = parseInt(code.replace(/^[A-Z]+/, ''), 10);
    if (code.startsWith('L') || code.startsWith('M')) {
        if (!isNaN(numericPart)) return `M${numericPart}`;
    }
    if (code.startsWith('S')) {
        if (!isNaN(numericPart)) return numericPart <= 2 ? 'M1' : 'M2';
    }
    return 'M1';
}

function getNextLockerCode(prefix) {
    const samePrefix = lockerRecords
        .map(locker => locker.code || '')
        .filter(code => code.startsWith(prefix))
        .map(code => parseInt(code.replace(prefix, ''), 10))
        .filter(value => !isNaN(value));
    const next = samePrefix.length ? Math.max(...samePrefix) + 1 : 1;
    return `${prefix}${next}`;
}

async function persistLockerStatus(locker) {
    if (!(typeof isSupabaseConnected !== 'undefined' && isSupabaseConnected() &&
        typeof dbOps !== 'undefined' && dbOps.updateLockerStatus && locker.dbLockerId)) {
        return;
    }
    try {
        const result = await dbOps.updateLockerStatus(locker.dbLockerId, formatStatusForDb(locker.status));
        if (!result) {
            alert(`Failed to update locker ${locker.code} in Supabase.`);
        }
    } catch (error) {
        console.error('Error saving locker status:', error);
        alert(`Failed to update locker ${locker.code} in Supabase.`);
    }
}

async function persistNewModuleLockers(newLockers) {
    if (!(typeof isSupabaseConnected !== 'undefined' && isSupabaseConnected() &&
        typeof dbOps !== 'undefined' && dbOps.createLockersBatch)) {
        return;
    }

    const dbPayload = newLockers.map(locker => ({
        locker_number: locker.code,
        size_type_id: getSizeTypeIdFromSize(locker.size),
        status: formatStatusForDb(locker.status)
    }));

    try {
        const inserted = await dbOps.createLockersBatch(dbPayload);
        if (!inserted) {
            alert('Failed to save new module lockers to Supabase.');
            return;
        }
        if (Array.isArray(inserted)) {
            inserted.forEach((row, index) => {
                if (newLockers[index]) {
                    newLockers[index].dbLockerId = row.locker_id || row.id || null;
                }
            });
        }
    } catch (error) {
        console.error('Error saving new module lockers:', error);
    }
}

// Locker interaction
function initializeLockers() {
    const lockers = document.querySelectorAll('.locker');
    
    lockers.forEach(locker => {
        locker.addEventListener('click', function() {
            const lockerId = this.getAttribute('data-locker-id');
            const status = this.getAttribute('data-status');
            const size = this.getAttribute('data-size');
            
            console.log(`Locker clicked: ID: ${lockerId}, Size: ${size}, Status: ${status}`);
            // You can add modal or detailed view here
        });
        
        locker.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px)';
        });
        
        locker.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// Animate stats on page load
function animateStats() {
    const stats = document.querySelectorAll('.stat-value');
    
    stats.forEach(stat => {
        const finalValue = stat.textContent;
        let startValue = 0;
        
        // Extract numeric value from final value
        const numericValue = parseFloat(finalValue.replace(/[^\d.]/g, ''));
        
        if (isNaN(numericValue)) return;
        
        const duration = 1000;
        const startTime = performance.now();
        
        function updateValue(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const currentValue = Math.floor(numericValue * progress);
            
            if (finalValue.includes('₱')) {
                stat.textContent = '₱' + (numericValue * progress).toFixed(2);
            } else {
                stat.textContent = currentValue;
            }
            
            if (progress < 1) {
                requestAnimationFrame(updateValue);
            } else {
                stat.textContent = finalValue;
            }
        }
        
        requestAnimationFrame(updateValue);
    });
}

// Responsive sidebar toggle (for mobile)
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.style.transform = sidebar.style.transform === 'translateX(-100%)' 
        ? 'translateX(0)' 
        : 'translateX(-100%)';
}

// Add keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Press 'L' to see locker details
    if (event.key === 'l' || event.key === 'L') {
        console.log('Show locker details view');
    }
    
    // Press 'C' to see customer details
    if (event.key === 'c' || event.key === 'C') {
        console.log('Show customer details view');
    }
});

