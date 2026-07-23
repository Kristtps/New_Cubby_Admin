// ============================================================
// INVENTORY PAGE — Bill/Coin Compartment Tracking
// Tables: device_inventory (joined with devices)
// ============================================================

const INV_MAX_CAPACITY = 2000; // ₱ assumed max per device for fill bar
const INV_LOW_THRESHOLD = 200; // ₱ warn threshold

let inventoryData = [];
let activeRefill  = null;

// ── Helpers ──────────────────────────────────────────────────
function invFmt(amount) {
    if (amount === null || amount === undefined) return '—';
    return '₱' + Number(amount).toFixed(2);
}

function invFmtDate(ts) {
    if (!ts) return '—';
    try {
        return new Intl.DateTimeFormat('en-PH', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true,
            timeZone: 'Asia/Manila'
        }).format(new Date(ts));
    } catch (_) { return ts; }
}

function invFillClass(balance) {
    const pct = (balance / INV_MAX_CAPACITY) * 100;
    if (pct >= 40) return 'high';
    if (pct >= 15) return 'medium';
    return 'low';
}

function invStatusPill(deviceStatus, balance) {
    if (balance < INV_LOW_THRESHOLD) return `<span class="inv-status low">Low Balance</span>`;
    if ((deviceStatus || '').toLowerCase() === 'online') return `<span class="inv-status online">Online</span>`;
    return `<span class="inv-status offline">Offline</span>`;
}

function getDB() {
    return window.supabaseClient || window.supabase;
}

// ── Fetch ─────────────────────────────────────────────────────
async function loadInventory() {
    const tbody = document.getElementById('inv-tbody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:48px;color:var(--color-text-muted);">Loading inventory…</td></tr>`;

    // Wait for Supabase to be ready
    if (window.supabasePromise) await window.supabasePromise;

    const db = getDB();
    if (!db) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:#ef4444;">
            ⚠ Database not connected. Check supabase-client.js.</td></tr>`;
        return;
    }

    try {
        const { data, error } = await db
            .from('device_inventory')
            .select(`
                inventory_id,
                device_id,
                change_amount,
                last_refilled_at,
                last_refilled_amount,
                updated_at,
                devices (
                    device_id,
                    device_code,
                    device_name,
                    location,
                    status,
                    last_seen_at
                )
            `)
            .order('updated_at', { ascending: false });

        if (error) throw error;

        inventoryData = data || [];
        renderInventoryTable(inventoryData);
        updateInventoryStats(inventoryData);
        checkLowBalanceAlerts(inventoryData);

        console.log(`✓ Inventory loaded: ${inventoryData.length} device(s)`);
    } catch (err) {
        console.error('❌ loadInventory error:', err);
        tbody.innerHTML = `
            <tr><td colspan="8">
                <div class="inv-empty">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <p style="color:#ef4444;font-weight:600;">Failed to load inventory</p>
                    <p style="font-size:12px;margin-top:6px;">${err.message}</p>
                    <p style="font-size:11px;margin-top:4px;opacity:.7;">Check browser console for more details</p>
                </div>
            </td></tr>`;
    }
}

// ── Render table ──────────────────────────────────────────────
function renderInventoryTable(rows) {
    const tbody = document.getElementById('inv-tbody');
    if (!tbody) return;

    if (!rows || rows.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="8">
                <div class="inv-empty">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                    </svg>
                    <p>No inventory records found.</p>
                    <p style="font-size:12px;margin-top:4px;">
                        The <code>device_inventory</code> table has no rows, or no devices are linked.
                    </p>
                </div>
            </td></tr>`;
        return;
    }

    tbody.innerHTML = rows.map(row => {
        const dev     = row.devices || {};
        const balance = Number(row.change_amount) || 0;
        const pct     = Math.min(100, Math.round((balance / INV_MAX_CAPACITY) * 100));
        const barCls  = invFillClass(balance);
        // Escape device name to avoid breaking onclick attribute
        const safeName = (dev.device_name || dev.device_code || 'Device').replace(/'/g, "\\'");

        return `
        <tr>
            <td>
                <div style="font-weight:700;color:var(--color-dark);">${dev.device_name || dev.device_code || '—'}</div>
                <div style="font-size:12px;color:var(--color-text-muted);margin-top:2px;font-family:monospace;">${dev.device_code || ''}</div>
            </td>
            <td style="color:var(--color-text-muted);">${dev.location || '—'}</td>
            <td>${invStatusPill(dev.status, balance)}</td>
            <td>
                <span style="font-size:15px;font-weight:800;color:${balance < INV_LOW_THRESHOLD ? '#ef4444' : 'var(--color-dark)'};">
                    ${invFmt(balance)}
                </span>
            </td>
            <td>
                <div class="balance-bar-wrap">
                    <div class="balance-bar-bg">
                        <div class="balance-bar-fill ${barCls}" style="width:${pct}%;"></div>
                    </div>
                    <span class="balance-pct">${pct}%</span>
                </div>
            </td>
            <td style="font-size:13px;">${invFmtDate(row.last_refilled_at)}</td>
            <td style="font-weight:600;color:var(--color-primary);">${invFmt(row.last_refilled_amount)}</td>
            <td>
                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                    <button class="btn-refill" onclick="openRefillModal('${row.inventory_id}','${safeName}',${balance})">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Refill
                    </button>
                    <button class="btn-deduct" onclick="openDeductModal('${row.inventory_id}','${safeName}',${balance})">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Deduct
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

// ── Stats ─────────────────────────────────────────────────────
function updateInventoryStats(rows) {
    const total      = rows.length;
    const totalBal   = rows.reduce((s, r) => s + (Number(r.change_amount) || 0), 0);
    const lowCount   = rows.filter(r => (Number(r.change_amount) || 0) < INV_LOW_THRESHOLD).length;
    const lastRefill = rows.reduce((s, r) => s + (Number(r.last_refilled_amount) || 0), 0);

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('stat-total-devices',  total);
    set('stat-total-balance',  invFmt(totalBal));
    set('stat-low-devices',    lowCount);
    set('stat-last-refill',    invFmt(lastRefill));
}

// ── Refill modal ──────────────────────────────────────────────
function openRefillModal(inventoryId, deviceName, currentBalance) {
    activeRefill = { inventory_id: inventoryId, current_balance: Number(currentBalance) || 0, device_name: deviceName };

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('refill-modal-device-name', 'Device: ' + deviceName);
    set('refill-current-balance',   invFmt(activeRefill.current_balance));
    set('refill-new-balance',       invFmt(activeRefill.current_balance));

    const inp = document.getElementById('refill-amount-input');
    if (inp) { inp.value = ''; inp.style.borderColor = ''; inp.focus(); }

    const overlay = document.getElementById('refill-modal-overlay');
    if (overlay) overlay.classList.add('active');
}

function closeRefillModal() {
    const overlay = document.getElementById('refill-modal-overlay');
    if (overlay) overlay.classList.remove('active');
    activeRefill = null;
}

// ── Low Balance Alert (threshold: ₱20) ───────────────────────
const LOW_ALERT_THRESHOLD = 20;

async function checkLowBalanceAlerts(rows) {
    const lowDevices = rows.filter(r => (Number(r.change_amount) || 0) < LOW_ALERT_THRESHOLD);
    if (lowDevices.length === 0) return;

    const db = getDB();

    for (const row of lowDevices) {
        const dev     = row.devices || {};
        const name    = dev.device_name || dev.device_code || 'Unknown Device';
        const balance = Number(row.change_amount) || 0;

        // Show a toast warning in the UI
        showLowBalanceToast(name, balance);

        // Insert into notifications table (best-effort)
        if (db) {
            try {
                // Avoid duplicate notifications — check if one already exists for today
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const { data: existing } = await db
                    .from('notifications')
                    .select('notification_id')
                    .eq('type', 'inventory_low_balance')
                    .eq('related_id', row.inventory_id)
                    .gte('created_at', today.toISOString())
                    .limit(1);

                if (!existing || existing.length === 0) {
                    await db.from('notifications').insert([{
                        type:          'inventory_low_balance',
                        title:         'Low Bill Compartment Balance',
                        message:       `${name} bill compartment balance is critically low: ₱${balance.toFixed(2)}. Please refill soon.`,
                        related_id:    row.inventory_id,
                        related_table: 'device_inventory',
                        is_read:       false,
                        priority:      balance === 0 ? 'urgent' : 'high'
                    }]);
                    console.log(`⚠️ Low balance notification created for: ${name}`);
                }
            } catch (err) {
                console.warn('Could not create low balance notification:', err.message);
            }
        }
    }
}

function showLowBalanceToast(deviceName, balance) {
    // Remove any existing toast for same device
    const existingId = `low-toast-${deviceName.replace(/\s/g, '-')}`;
    const existing = document.getElementById(existingId);
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = existingId;
    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: #1e293b;
        color: #f1f5f9;
        padding: 14px 18px;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        z-index: 9999;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        max-width: 340px;
        border-left: 4px solid #f59e0b;
        animation: slideInRight 0.3s ease;
    `;
    toast.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" style="flex-shrink:0;margin-top:1px;">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <div>
            <div style="font-weight:700;font-size:13px;margin-bottom:3px;">Low Balance Warning</div>
            <div style="font-size:12px;color:#94a3b8;line-height:1.4;">
                <strong style="color:#fbbf24;">${deviceName}</strong> bill compartment is at 
                <strong style="color:#ef4444;">₱${balance.toFixed(2)}</strong> — below the ₱${LOW_ALERT_THRESHOLD} threshold. Please refill.
            </div>
        </div>
        <button onclick="this.parentElement.remove()" style="background:none;border:none;color:#64748b;cursor:pointer;font-size:18px;line-height:1;flex-shrink:0;padding:0 0 0 4px;">&times;</button>
    `;

    // Add slide-in animation
    if (!document.getElementById('inv-toast-style')) {
        const style = document.createElement('style');
        style.id = 'inv-toast-style';
        style.textContent = `@keyframes slideInRight { from { transform: translateX(120%); opacity:0; } to { transform: translateX(0); opacity:1; } }`;
        document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    // Auto-dismiss after 8 seconds
    setTimeout(() => { if (toast.parentElement) toast.remove(); }, 8000);
}

// ── Inventory History ─────────────────────────────────────────
let historyData = [];

async function loadInventoryHistory() {
    const tbody = document.getElementById('inv-history-tbody');
    if (!tbody) return;

    if (window.supabasePromise) await window.supabasePromise;
    const db = getDB();
    if (!db) {
        tbody.innerHTML = `<tr><td colspan="5" class="hist-empty">Database not connected.</td></tr>`;
        return;
    }

    try {
        const { data, error } = await db
            .from('audit_logs')
            .select('log_id, timestamp, action, details')
            .in('action', ['Inventory Refill', 'Inventory Deduction'])
            .order('timestamp', { ascending: false })
            .limit(100);

        if (error) throw error;

        historyData = data || [];
        renderHistory(historyData);
        populateDeviceFilter(historyData);
    } catch (err) {
        console.error('❌ loadInventoryHistory error:', err);
        tbody.innerHTML = `<tr><td colspan="5" class="hist-empty">Failed to load history: ${err.message}</td></tr>`;
    }
}

function renderHistory(rows) {
    const tbody = document.getElementById('inv-history-tbody');
    if (!tbody) return;

    if (!rows || rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="hist-empty">No inventory history yet. Refills and deductions will appear here.</td></tr>`;
        return;
    }

    tbody.innerHTML = rows.map(row => {
        const d         = row.details || {};
        const isRefill  = row.action === 'Inventory Refill';
        const amount    = isRefill ? (d.refill_amount || d.amount || 0) : (d.deduct_amount || d.amount || 0);
        const newBal    = d.new_balance ?? '—';
        const device    = d.device_name || '—';
        const badgeCls  = isRefill ? 'refill' : 'deduct';
        const sign      = isRefill ? '+' : '-';
        const amtColor  = isRefill ? 'var(--color-primary)' : '#ef4444';
        const ts        = row.timestamp ? invFmtDate(row.timestamp) : '—';

        return `<tr>
            <td style="color:var(--color-text-muted);white-space:nowrap;">${ts}</td>
            <td style="font-weight:600;">${device}</td>
            <td><span class="hist-badge ${badgeCls}">${isRefill ? '+ Refill' : '− Deduct'}</span></td>
            <td style="font-weight:700;color:${amtColor};">${sign}${invFmt(amount)}</td>
            <td style="font-weight:600;">${typeof newBal === 'number' ? invFmt(newBal) : newBal}</td>
        </tr>`;
    }).join('');
}

function populateDeviceFilter(rows) {
    const sel = document.getElementById('hist-device-filter');
    if (!sel) return;
    const devices = [...new Set(rows.map(r => r.details?.device_name).filter(Boolean))];
    // Keep "All Devices" option, add the rest
    sel.innerHTML = '<option value="all">All Devices</option>' +
        devices.map(d => `<option value="${d}">${d}</option>`).join('');
}

function applyHistoryFilters() {
    const deviceVal = document.getElementById('hist-device-filter')?.value || 'all';
    const typeVal   = document.getElementById('hist-type-filter')?.value   || 'all';

    let filtered = historyData;
    if (deviceVal !== 'all') filtered = filtered.filter(r => r.details?.device_name === deviceVal);
    if (typeVal   !== 'all') filtered = filtered.filter(r => r.action === typeVal);
    renderHistory(filtered);
}

// ── Deduct modal ──────────────────────────────────────────────
let activeDeduct = null;

function openDeductModal(inventoryId, deviceName, currentBalance) {
    activeDeduct = { inventory_id: inventoryId, current_balance: Number(currentBalance) || 0, device_name: deviceName };

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('deduct-modal-device-name', 'Device: ' + deviceName);
    set('deduct-current-balance',   invFmt(activeDeduct.current_balance));
    set('deduct-new-balance',       invFmt(activeDeduct.current_balance));

    const inp = document.getElementById('deduct-amount-input');
    if (inp) { inp.value = ''; inp.style.borderColor = ''; inp.focus(); }

    const overlay = document.getElementById('deduct-modal-overlay');
    if (overlay) overlay.classList.add('active');
}

function closeDeductModal() {
    const overlay = document.getElementById('deduct-modal-overlay');
    if (overlay) overlay.classList.remove('active');
    activeDeduct = null;
}

// ── Init (runs after DOM is ready) ───────────────────────────
document.addEventListener('DOMContentLoaded', function () {

    // Search
    const searchEl = document.getElementById('inv-search');
    if (searchEl) {
        searchEl.addEventListener('input', function () {
            const q = this.value.trim().toLowerCase();
            if (!q) { renderInventoryTable(inventoryData); return; }
            renderInventoryTable(inventoryData.filter(row => {
                const d = row.devices || {};
                return (d.device_name || '').toLowerCase().includes(q)
                    || (d.device_code || '').toLowerCase().includes(q)
                    || (d.location    || '').toLowerCase().includes(q);
            }));
        });
    }

    // Refresh button
    const refreshBtn = document.getElementById('refresh-inv-btn');
    if (refreshBtn) refreshBtn.addEventListener('click', loadInventory);

    // Refill amount preview
    const amountInp = document.getElementById('refill-amount-input');
    if (amountInp) {
        amountInp.addEventListener('input', function () {
            if (!activeRefill) return;
            const newBal = activeRefill.current_balance + (parseFloat(this.value) || 0);
            const el = document.getElementById('refill-new-balance');
            if (el) el.textContent = invFmt(newBal);
        });
    }

    // Cancel / overlay close
    const cancelBtn = document.getElementById('refill-cancel-btn');
    if (cancelBtn) cancelBtn.addEventListener('click', closeRefillModal);

    const overlay = document.getElementById('refill-modal-overlay');
    if (overlay) overlay.addEventListener('click', e => { if (e.target === overlay) closeRefillModal(); });

    // Confirm refill
    const confirmBtn = document.getElementById('refill-confirm-btn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', async function () {
            if (!activeRefill) return;

            const amountStr = document.getElementById('refill-amount-input')?.value.trim();
            const amount    = parseFloat(amountStr);

            if (!amountStr || isNaN(amount) || amount <= 0) {
                const inp = document.getElementById('refill-amount-input');
                if (inp) { inp.style.borderColor = '#ef4444'; inp.focus(); }
                return;
            }

            const newBalance = activeRefill.current_balance + amount;
            this.disabled    = true;
            this.textContent = 'Saving…';

            try {
                const db = getDB();
                if (!db) throw new Error('Database not connected');

                const { error } = await db
                    .from('device_inventory')
                    .update({
                        change_amount:        newBalance,
                        last_refilled_at:     new Date().toISOString(),
                        last_refilled_amount: amount,
                        updated_at:           new Date().toISOString()
                    })
                    .eq('inventory_id', activeRefill.inventory_id);

                if (error) throw error;

                // Audit log (best-effort)
                try {
                    await db.from('audit_logs').insert([{
                        action: 'Inventory Refill',
                        details: {
                            device_name:   activeRefill.device_name,
                            inventory_id:  activeRefill.inventory_id,
                            refill_amount: amount,
                            new_balance:   newBalance
                        }
                    }]);
                } catch (_) { /* audit log is optional */ }

                closeRefillModal();
                await loadInventory();
                await loadInventoryHistory();
                console.log(`✓ Refill saved: ${activeRefill?.device_name} +${invFmt(amount)} → ${invFmt(newBalance)}`);
            } catch (err) {
                console.error('❌ Refill save error:', err);
                alert('Failed to save refill: ' + err.message);
            } finally {
                this.disabled    = false;
                this.innerHTML   = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:4px;"><polyline points="20 6 9 17 4 12"></polyline></svg> Confirm Refill`;
            }
        });
    }

    // Initial data load
    loadInventory();
    loadInventoryHistory();

    // History filters
    const histDeviceSel = document.getElementById('hist-device-filter');
    const histTypeSel   = document.getElementById('hist-type-filter');
    if (histDeviceSel) histDeviceSel.addEventListener('change', applyHistoryFilters);
    if (histTypeSel)   histTypeSel.addEventListener('change', applyHistoryFilters);

    // ── Deduct modal wiring ───────────────────────────────────
    const deductAmountInp = document.getElementById('deduct-amount-input');
    if (deductAmountInp) {
        deductAmountInp.addEventListener('input', function () {
            if (!activeDeduct) return;
            const amount = parseFloat(this.value) || 0;
            const newBal = Math.max(0, activeDeduct.current_balance - amount);
            const el = document.getElementById('deduct-new-balance');
            if (el) el.textContent = invFmt(newBal);
        });
    }

    const deductCancelBtn = document.getElementById('deduct-cancel-btn');
    if (deductCancelBtn) deductCancelBtn.addEventListener('click', closeDeductModal);

    const deductOverlay = document.getElementById('deduct-modal-overlay');
    if (deductOverlay) deductOverlay.addEventListener('click', e => { if (e.target === deductOverlay) closeDeductModal(); });

    const deductConfirmBtn = document.getElementById('deduct-confirm-btn');
    if (deductConfirmBtn) {
        deductConfirmBtn.addEventListener('click', async function () {
            if (!activeDeduct) return;

            const amountStr = document.getElementById('deduct-amount-input')?.value.trim();
            const amount    = parseFloat(amountStr);

            if (!amountStr || isNaN(amount) || amount <= 0) {
                const inp = document.getElementById('deduct-amount-input');
                if (inp) { inp.style.borderColor = '#ef4444'; inp.focus(); }
                return;
            }

            if (amount > activeDeduct.current_balance) {
                alert(`Cannot deduct ${invFmt(amount)} — current balance is only ${invFmt(activeDeduct.current_balance)}.`);
                return;
            }

            const newBalance = Math.max(0, activeDeduct.current_balance - amount);
            this.disabled    = true;
            this.textContent = 'Saving…';

            try {
                const db = getDB();
                if (!db) throw new Error('Database not connected');

                const { error } = await db
                    .from('device_inventory')
                    .update({
                        change_amount: newBalance,
                        updated_at:    new Date().toISOString()
                    })
                    .eq('inventory_id', activeDeduct.inventory_id);

                if (error) throw error;

                // Audit log (best-effort)
                try {
                    await db.from('audit_logs').insert([{
                        action: 'Inventory Deduction',
                        details: {
                            device_name:   activeDeduct.device_name,
                            inventory_id:  activeDeduct.inventory_id,
                            deduct_amount: amount,
                            new_balance:   newBalance
                        }
                    }]);
                } catch (_) { /* audit log is optional */ }

                closeDeductModal();
                await loadInventory();
                await loadInventoryHistory();
                console.log(`✓ Deduction saved: ${activeDeduct?.device_name} -${invFmt(amount)} → ${invFmt(newBalance)}`);
            } catch (err) {
                console.error('❌ Deduct save error:', err);
                alert('Failed to save deduction: ' + err.message);
            } finally {
                this.disabled  = false;
                this.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:4px;"><polyline points="20 6 9 17 4 12"></polyline></svg> Confirm Deduction`;
            }
        });
    }
});
