/**
 * Feedback Management Module
 * Handles display and management of customer feedback
 */

let allFeedback = [];
let currentFilter = 'all';

// Initialize feedback page
document.addEventListener('DOMContentLoaded', async function() {
    if (!document.getElementById('feedback-tbody')) return;

    // Wait for Supabase to initialize
    if (window.supabasePromise) {
        await window.supabasePromise;
    }

    await loadFeedback();
    setupEventListeners();

    // Auto-refresh feedback every 30 seconds
    setInterval(async function() {
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
        ratingFilter.addEventListener('change', function() {
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
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #9ca3af;">No feedback found</td></tr>';
        return;
    }

    tbody.innerHTML = filteredFeedback.map(feedback => {
        const customer = feedback.customers || {};
        const stars = renderStars(feedback.rating);
        const truncatedComment = feedback.comment 
            ? (feedback.comment.length > 50 ? feedback.comment.substring(0, 50) + '...' : feedback.comment)
            : 'No comment';
        
        const feedbackDate = feedback.created_at 
            ? formatForDisplay(feedback.created_at, { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            : 'N/A';

        return `
            <tr>
                <td>
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <span style="font-weight: 600; color: var(--color-dark);">${customer.name || 'Unknown'}</span>
                        <span style="font-size: 12px; color: var(--color-text-muted);">${customer.email || 'N/A'}</span>
                    </div>
                </td>
                <td>
                    <div style="font-size: 16px;">${stars}</div>
                </td>
                <td>
                    <span style="color: var(--color-dark);">${truncatedComment}</span>
                </td>
                <td style="font-size: 13px; color: var(--color-text-muted);">${feedbackDate}</td>
                <td>
                    <button 
                        onclick="showFeedbackDetails('${feedback.feedback_id}')"
                        style="padding: 8px 16px; background: var(--color-primary); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; transition: opacity 0.2s;"
                        onmouseover="this.style.opacity='0.9'"
                        onmouseout="this.style.opacity='1'">
                        View Details
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
    const fullStar = '⭐';
    const emptyStar = '☆';
    let stars = '';
    
    for (let i = 1; i <= 5; i++) {
        stars += i <= rating ? fullStar : emptyStar;
    }
    
    return stars;
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
    
    document.getElementById('modal-rating').innerHTML = renderStars(feedback.rating) + ` <span style="color: var(--color-text-muted); font-size: 14px;">(${feedback.rating}/5)</span>`;
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
