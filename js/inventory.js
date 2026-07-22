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
                <button class="btn-refill" onclick="openRefillModal('${row.inventory_id}','${safeName}',${balance})">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Refill
                </button>
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
                db.from('audit_logs').insert([{
                    action: 'Inventory Refill',
                    details: {
                        device_name:   activeRefill.device_name,
                        inventory_id:  activeRefill.inventory_id,
                        refill_amount: amount,
                        new_balance:   newBalance
                    }
                }]).catch(() => {});

                closeRefillModal();
                await loadInventory();
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
});
