// ========================================
// PRICING CALCULATION MODULE
// ========================================

/**
 * PRICING LOGIC:
 * 
 * 1. Rates come from database (Small, Medium, Large hourly rates)
 * 
 * 2. Fixed-Duration (Prepaid):
 *    - Hours × Hourly Rate
 *    - Example (₱15/hr): 1hr = ₱15, 2hr = ₱30, 3hr = ₱45
 * 
 * 3. Open Hour (Pay-as-you-go):
 *    - Charged in 30-minute steps
 *    - First 30 min: Half hourly rate
 *    - Next 30 min: Full hourly rate
 *    - Example (₱15/hr): 1-30min = ₱7.50, 31-60min = ₱15.00
 * 
 * 4. Overtime (Exceeding Prepaid):
 *    - Charged in 30-minute steps
 *    - 10-minute free grace period at start of each block
 *    - Example (₱15/hr):
 *      0-10 min late: ₱0 (Free)
 *      11-30 min late: ₱7.50 (Half-rate)
 *      31-40 min late: ₱7.50 
 *      41-60 min late: ₱15.00 (Full-rate)
 */

/**
 * Get rates from database
 * @returns {Promise<Object>} Rates object { small, medium, large }
 */
async function getRatesFromDatabase() {
    if (typeof dbOps !== 'undefined' && dbOps.fetchRates) {
        const rates = await dbOps.fetchRates();
        if (!rates || !rates.small || !rates.medium || !rates.large) {
            throw new Error('Incomplete rate data returned from database');
        }
        return {
            small: rates.small.rate,
            medium: rates.medium.rate,
            large: rates.large.rate
        };
    }
    throw new Error('Database operation for fetching rates is unavailable');
}

/**
 * Calculate Fixed-Duration (Prepaid) price
 * @param {number} hours - Number of hours prepaid
 * @param {number} hourlyRate - Hourly rate from database
 * @returns {number} Total prepaid amount
 */
function calculateFixedDuration(hours, hourlyRate) {
    return hours * hourlyRate;
}

/**
 * Calculate Open Hour (Pay-as-you-go) price
 * @param {number} minutes - Total minutes used
 * @param {number} hourlyRate - Hourly rate from database
 * @returns {Object} { totalFee, breakdown }
 */
function calculateOpenHour(minutes, hourlyRate) {
    const breakdown = [];
    let totalFee = 0;

    // Process in 30-minute blocks
    let remainingMinutes = minutes;
    let blockNumber = 1;

    while (remainingMinutes > 0) {
        if (remainingMinutes <= 30) {
            // First 30 minutes of this block
            const fee = hourlyRate / 2;
            totalFee += fee;
            breakdown.push({
                block: blockNumber,
                minutes: remainingMinutes,
                rate: 'Half-rate',
                fee: fee
            });
            remainingMinutes = 0;
        } else {
            // Full 30 minutes
            const fee = hourlyRate / 2;
            totalFee += fee;
            breakdown.push({
                block: blockNumber,
                minutes: 30,
                rate: 'Half-rate',
                fee: fee
            });
            remainingMinutes -= 30;
            blockNumber++;
        }

        // Next 30 minutes (completes the hour)
        if (remainingMinutes > 0) {
            if (remainingMinutes <= 30) {
                const fee = hourlyRate / 2;
                totalFee += fee;
                breakdown.push({
                    block: blockNumber,
                    minutes: remainingMinutes,
                    rate: 'Half-rate (completing hour)',
                    fee: fee
                });
                remainingMinutes = 0;
            } else {
                const fee = hourlyRate / 2;
                totalFee += fee;
                breakdown.push({
                    block: blockNumber,
                    minutes: 30,
                    rate: 'Half-rate (completing hour)',
                    fee: fee
                });
                remainingMinutes -= 30;
                blockNumber++;
            }
        }
    }

    return { totalFee, breakdown };
}

/**
 * Calculate Overtime charges (Exceeding Prepaid Hours)
 * 
 * Charged in 30-minute steps with 10-minute free grace period
 * 
 * @param {number} minutesLate - Minutes beyond prepaid time
 * @param {number} hourlyRate - Hourly rate from database
 * @returns {Object} { totalFee, breakdown }
 */
function calculateOvertime(minutesLate, hourlyRate) {
    const breakdown = [];
    let totalFee = 0;
    let remainingMinutes = minutesLate;
    let blockNumber = 1;

    // If all minutes are within the 10‑minute grace period, nothing gets charged
    if (remainingMinutes <= 10) {
        breakdown.push({
            block: blockNumber,
            minutes: remainingMinutes,
            type: 'Grace Period',
            fee: 0
        });
        return { totalFee, breakdown };
    }

    // Apply a single 10‑minute grace block once

    breakdown.push({
        block: blockNumber,
        minutes: 10,
        type: 'Grace Period',
        fee: 0
    });
    blockNumber++;
    remainingMinutes -= 10;

    // Charge remaining minutes in 30‑minute blocks at half‑rate
    while (remainingMinutes > 0) {
        const minutesInBlock = Math.min(30, remainingMinutes);
        const fee = hourlyRate / 2;
        breakdown.push({
            block: blockNumber,
            minutes: minutesInBlock,
            type: 'Half-rate',
            fee: fee
        });
        totalFee += fee;
        remainingMinutes -= minutesInBlock;
        blockNumber++;
    }

    return { totalFee, breakdown };
}





/**
 * Calculate total rental fee
 * 
 * @param {Object} rental - Rental details
 * @param {number} rental.prepaidHours - Hours prepaid (for fixed)
 * @param {Date} rental.startTime - Rental start time
 * @param {Date|null} rental.endTime - Scheduled fixed-rental end time; null for Open Hour
 * @param {number} rental.hourlyRate - Hourly rate from database
 * @returns {Object} { totalFee, prepaidFee, overtimeFee, breakdown }
 */
function calculateRentalFee(rental) {
    const {
        prepaidHours = 0,
        startTime,
        endTime = null,
        hourlyRate
    } = rental;

    const now = new Date();
    const actualMinutes = Math.max(0, Math.floor((now - startTime) / 1000 / 60));
    const isFixedDuration = endTime !== null && endTime !== undefined;

    if (isFixedDuration) {
        // Fixed-Duration (Prepaid)
        const prepaidFee = calculateFixedDuration(prepaidHours, hourlyRate);
        const overtimeMinutes = Math.max(0, Math.floor((now - new Date(endTime)) / 1000 / 60));

        if (overtimeMinutes === 0) {
            // No overtime
            return {
                totalFee: prepaidFee,
                prepaidFee: prepaidFee,
                overtimeFee: 0,
                breakdown: {
                    type: 'Fixed-Duration',
                    prepaidHours: prepaidHours,
                    prepaidFee: prepaidFee,
                    actualMinutes: actualMinutes,
                    overtime: null
                }
            };
        } else {
            // Has overtime
            const overtime = calculateOvertime(overtimeMinutes, hourlyRate);

            return {
                totalFee: prepaidFee + overtime.totalFee,
                prepaidFee: prepaidFee,
                overtimeFee: overtime.totalFee,
                breakdown: {
                    type: 'Fixed-Duration with Overtime',
                    prepaidHours: prepaidHours,
                    prepaidFee: prepaidFee,
                    actualMinutes: actualMinutes,
                    overtimeMinutes: overtimeMinutes,
                    overtime: overtime
                }
            };
        }
    }

    // Open Hour (Pay-as-you-go): end_time is NULL.
    const result = calculateOpenHour(actualMinutes, hourlyRate);
    return {
        totalFee: result.totalFee,
        prepaidFee: 0,
        overtimeFee: 0,
        breakdown: {
            type: 'Open Hour',
            actualMinutes: actualMinutes,
            openHour: result
        }
    };
}

/**
 * Format fee for display
 * @param {number} fee - Fee amount
 * @returns {string} Formatted fee (e.g., "₱15.00")
 */
function formatFee(fee) {
    return `₱${fee.toFixed(2)}`;
}

/**
 * Get readable breakdown text
 * @param {Object} breakdown - Breakdown object from calculation
 * @returns {string} Human-readable breakdown
 */
function getBreakdownText(breakdown) {
    if (!breakdown) return '';

    let text = `Type: ${breakdown.type}\n`;
    text += `Actual Time: ${breakdown.actualMinutes} minutes\n`;

    if (breakdown.prepaidFee) {
        text += `Prepaid (${breakdown.prepaidHours}hr): ${formatFee(breakdown.prepaidFee)}\n`;
    }

    if (breakdown.overtime) {
        text += `\nOvertime Breakdown:\n`;
        breakdown.overtime.breakdown.forEach(item => {
            text += `  Block ${item.block}: ${item.minutes} min - ${item.type} - ${formatFee(item.fee)}\n`;
        });
        text += `Total Overtime: ${formatFee(breakdown.overtime.totalFee)}\n`;
    }

    if (breakdown.openHour) {
        text += `\nOpen Hour Breakdown:\n`;
        breakdown.openHour.breakdown.forEach(item => {
            text += `  Block ${item.block}: ${item.minutes} min - ${item.rate} - ${formatFee(item.fee)}\n`;
        });
    }

    return text;
}

// Export functions
if (typeof window !== 'undefined') {
    window.PricingModule = {
        getRatesFromDatabase,
        calculateFixedDuration,
        calculateOpenHour,
        calculateOvertime,
        calculateRentalFee,
        formatFee,
        getBreakdownText
    };
}
