/**
 * Feedback Management Module
 * Handles display and management of customer feedback
 */

let allFeedback = [];
let currentFilter = 'all';

// Initialize feedback page
document.addEventListener('DOMContentLoaded', async function () {
    if (!document.getElementById('feedback-tbody')) return;

    // Wait for Supabase to initialize
    if (window.supabasePromise) {
        await window.supabasePromise;
    }

    await loadFeedback();
    setupEventListeners();

    // Auto-refresh feedback every 30 seconds
    setInterval(async function () {
        try {
            await loadFeedback();
            console.log('✓ Feedback data auto-refreshed via AJAX');
        } catch (err) {
            console.error('Feedback auto-refresh error:', err);
        }
    }, 30000);
});

/**
 * Setup event listeners
 */
function setupEventListeners() {
    const ratingFilter = document.getElementById('rating-filter');
    if (ratingFilter) {
        ratingFilter.addEventListener('change', function () {
            currentFilter = this.value;
            renderFeedback();
        });
    }
}

/**
 * Load all feedback from database
 */
async function loadFeedback() {
    const tbody = document.getElementById('feedback-tbody');

    try {
        // Check if Supabase is connected
        if (!window.supabase || typeof window.supabase.from !== 'function') {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #ef4444;">Database not connected</td></tr>';
            console.error('Supabase client not initialized');
            return;
        }

        // Fetch feedback data
        const { data: feedbackData, error: feedbackError } = await window.supabase
            .from('feedback')
            .select('*')
            .order('created_at', { ascending: false });

        if (feedbackError) {
            console.error('Error loading feedback:', feedbackError);
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #ef4444;">Error loading feedback: ${feedbackError.message}</td></tr>`;
            return;
        }

        if (!feedbackData || feedbackData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #9ca3af;">No feedback found</td></tr>';
            allFeedback = [];
            updateStats();
            return;
        }

        // Get unique customer IDs
        const customerIds = [...new Set(feedbackData.map(f => f.customer_id))];

        // Fetch related customers
        const { data: customersData } = await window.supabase
            .from('customers')
            .select('customer_id, full_name, email, contact_number')
            .in('customer_id', customerIds);

        // Create lookup maps (normalize column names)
        const customersMap = {};
        if (customersData) {
            customersData.forEach(c => {
                customersMap[c.customer_id] = {
                    customer_id: c.customer_id,
                    name: c.full_name, // Map full_name to name
                    email: c.email,
                    phone: c.contact_number // Map contact_number to phone
                };
            });
        }

        // Combine data
        allFeedback = feedbackData.map(feedback => ({
            ...feedback,
            customers: customersMap[feedback.customer_id] || null
        }));

        renderFeedback();
        updateStats();

    } catch (err) {
        console.error('Exception loading feedback:', err);
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #ef4444;">Error loading feedback: ${err.message}</td></tr>`;
    }
}

/**
 * Simple HTML escaping helper
 */
function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Render feedback table based on current filter
 */
function renderFeedback() {
    const tbody = document.getElementById('feedback-tbody');

    // Filter feedback
    let filteredFeedback = allFeedback;
    if (currentFilter !== 'all') {
        const filterRating = parseInt(currentFilter);
        filteredFeedback = allFeedback.filter(f => f.rating === filterRating);
    }

    if (filteredFeedback.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2.5rem; color: var(--color-text-muted);">No feedback found</td></tr>';
        return;
    }

    tbody.innerHTML = filteredFeedback.map(feedback => {
        const customer = feedback.customers || {};
        const stars = renderStars(feedback.rating);
        const hasComment = feedback.comment && feedback.comment.trim().length > 0;
        const commentText = hasComment
            ? (feedback.comment.length > 90 ? feedback.comment.substring(0, 90) + '…' : feedback.comment)
            : 'No written review';

        let datePart = 'N/A';
        let timePart = '';
        if (feedback.created_at) {
            datePart = formatForDisplay(feedback.created_at, {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            timePart = formatForDisplay(feedback.created_at, {
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        const safeName = escapeHtml(customer.name || 'Anonymous User');
        const safeEmail = escapeHtml(customer.email || 'No email provided');

        return `
            <tr>
                <td class="feedback-customer-cell">
                    <div class="customer-info">
                        <span class="customer-name">${safeName}</span>
                        <span class="customer-email">${safeEmail}</span>
                    </div>
                </td>
                <td class="feedback-rating-cell">
                    ${stars}
                </td>
                <td class="feedback-comment-cell">
                    <span class="feedback-comment-text ${hasComment ? '' : 'is-empty'}">
                        ${escapeHtml(commentText)}
                    </span>
                </td>
                <td class="feedback-date-cell">
                    <div class="feedback-date-primary">${datePart}</div>
                    ${timePart ? `<div class="feedback-date-sub">${timePart}</div>` : ''}
                </td>
                <td class="feedback-actions-cell">
                    <button 
                        type="button"
                        class="btn-action-view"
                        onclick="showFeedbackDetails('${feedback.feedback_id}')"
                        title="View details">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        <span>View</span>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Render star rating
 */
function renderStars(rating) {
    const num = Math.max(0, Math.min(5, Number(rating) || 0));
    let starsHtml = `<div class="rating-display" title="${num} out of 5 stars">`;
    starsHtml += `<div class="rating-stars">`;
    for (let i = 1; i <= 5; i++) {
        const isFilled = i <= num;
        starsHtml += `<svg class="star-icon ${isFilled ? 'filled' : 'empty'}" width="14" height="14" viewBox="0 0 24 24" fill="${isFilled ? '#f59e0b' : 'none'}" stroke="${isFilled ? '#f59e0b' : 'currentColor'}" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>`;
    }
    starsHtml += `</div>`;
    starsHtml += `<span class="rating-badge rating-${num}">${num}.0</span>`;
    starsHtml += `</div>`;
    return starsHtml;
}

/**
 * Update statistics
 */
function updateStats() {
    const totalFeedback = allFeedback.length;
    const fiveStarCount = allFeedback.filter(f => f.rating === 5).length;
    const lowRatingCount = allFeedback.filter(f => f.rating <= 2).length;

    let averageRating = 0;
    if (totalFeedback > 0) {
        const totalRating = allFeedback.reduce((sum, f) => sum + f.rating, 0);
        averageRating = (totalRating / totalFeedback).toFixed(1);
    }

    document.getElementById('total-feedback').textContent = totalFeedback;
    document.getElementById('average-rating').textContent = averageRating;
    document.getElementById('five-star-count').textContent = fiveStarCount;
    document.getElementById('low-rating-count').textContent = lowRatingCount;
}

/**
 * Show feedback details modal
 */
async function showFeedbackDetails(feedbackId) {
    const feedback = allFeedback.find(f => f.feedback_id === feedbackId);
    if (!feedback) return;

    const modal = document.getElementById('feedbackModal');
    const customer = feedback.customers || {};

    // Populate modal
    document.getElementById('modal-customer-name').textContent = customer.name || 'Unknown';
    document.getElementById('modal-customer-email').textContent = customer.email || 'N/A';
    document.getElementById('modal-customer-phone').textContent = customer.phone || 'N/A';

    document.getElementById('modal-rating').innerHTML = renderStars(feedback.rating);
    document.getElementById('modal-comment').textContent = feedback.comment || 'No comment provided';

    const feedbackDate = feedback.created_at
        ? formatForDisplay(feedback.created_at)
        : 'N/A';
    document.getElementById('modal-feedback-date').textContent = feedbackDate;

    // Show modal
    modal.classList.add('active');
}

/**
 * Close feedback details modal
 */
function closeFeedbackModal() {
    const modal = document.getElementById('feedbackModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Make functions globally accessible
window.showFeedbackDetails = showFeedbackDetails;
window.closeFeedbackModal = closeFeedbackModal;
