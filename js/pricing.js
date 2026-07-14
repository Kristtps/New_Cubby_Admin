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
 *      31-40 min late: ₱7.50 (Free grace again)
 *      41-60 min late: ₱15.00 (Full-rate)
 */

/**
 * Get rates from database
 * @returns {Promise<Object>} Rates object { small, medium, large }
 */
async function getRatesFromDatabase() {
    try {
        if (typeof dbOps !== 'undefined' && dbOps.fetchRates) {
            const rates = await dbOps.fetchRates();
            return {
                small: rates.small?.rate || 10,
                medium: rates.medium?.rate || 20,
                large: rates.large?.rate || 35
            };
        }
    } catch (error) {
        console.error('Error fetching rates:', error);
    }
    
    // Fallback to localStorage
    const savedRates = localStorage.getItem('coincubby_rates');
    if (savedRates) {
        const rates = JSON.parse(savedRates);
        return {
            small: rates.small?.rate || 10,
            medium: rates.medium?.rate || 20,
            large: rates.large?.rate || 35
        };
    }
    
    // Default rates
    return { small: 10, medium: 20, large: 35 };
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
    
    while (remainingMinutes > 0) {
        // Start of new 30-minute block
        
        if (remainingMinutes <= 10) {
            // Within grace period - FREE
            breakdown.push({
                block: blockNumber,
                minutes: remainingMinutes,
                type: 'Grace Period',
                fee: 0
            });
            remainingMinutes = 0;
        } else if (remainingMinutes <= 30) {
            // 10 min grace + charged time
            breakdown.push({
                block: blockNumber,
                minutes: 10,
                type: 'Grace Period',
                fee: 0
            });
            
            const chargedMinutes = remainingMinutes - 10;
            const fee = hourlyRate / 2; // Half-rate for this block
            totalFee += fee;
            
            breakdown.push({
                block: blockNumber,
                minutes: chargedMinutes,
                type: 'Half-rate',
                fee: fee
            });
            remainingMinutes = 0;
        } else {
            // Full 30-minute block
            // 10 min grace + 20 min charged
            breakdown.push({
                block: blockNumber,
                minutes: 10,
                type: 'Grace Period',
                fee: 0
            });
            
            const fee = hourlyRate / 2; // Half-rate for this 30-min block
            totalFee += fee;
            
            breakdown.push({
                block: blockNumber,
                minutes: 20,
                type: 'Half-rate',
                fee: fee
            });
            
            remainingMinutes -= 30;
            blockNumber++;
        }
    }
    
    return { totalFee, breakdown };
}

/**
 * Calculate total rental fee
 * 
 * @param {Object} rental - Rental details
 * @param {string} rental.type - 'fixed' or 'open'
 * @param {number} rental.prepaidHours - Hours prepaid (for fixed)
 * @param {Date} rental.startTime - Rental start time
 * @param {Date} rental.endTime - Rental end time (or current time)
 * @param {number} rental.hourlyRate - Hourly rate from database
 * @returns {Object} { totalFee, prepaidFee, overtimeFee, breakdown }
 */
function calculateRentalFee(rental) {
    const {
        type,
        prepaidHours = 0,
        startTime,
        endTime = new Date(),
        hourlyRate
    } = rental;
    
    const actualMinutes = Math.floor((endTime - startTime) / 1000 / 60);
    
    if (type === 'fixed') {
        // Fixed-Duration (Prepaid)
        const prepaidFee = calculateFixedDuration(prepaidHours, hourlyRate);
        const prepaidMinutes = prepaidHours * 60;
        
        if (actualMinutes <= prepaidMinutes) {
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
            const overtimeMinutes = actualMinutes - prepaidMinutes;
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
    } else if (type === 'open') {
        // Open Hour (Pay-as-you-go)
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
    
    return {
        totalFee: 0,
        prepaidFee: 0,
        overtimeFee: 0,
        breakdown: null
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
