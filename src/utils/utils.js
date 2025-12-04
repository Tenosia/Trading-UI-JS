/**
 * Format a price value to a string with specified decimal places
 * @param {number} px - Price value
 * @param {number} dec - Decimal places (default: 2)
 * @param {boolean} showPlus - Whether to show + for positive values
 * @returns {string} Formatted price string
 */
export const getPxString = (px, dec = 2, showPlus = false) => {
    if (px === null || px === undefined || typeof px !== 'number' || isNaN(px)) {
        return '--';
    }
    try {
        let strPx = px.toFixed(dec);
        if (showPlus && px >= 0) {
            strPx = '+' + strPx;
        }
        return strPx;
    } catch {
        return '--';
    }
};

/**
 * Calculate mid price from bid/ask arrays
 * @param {number[]} bids - Array of bid prices
 * @param {number[]} asks - Array of ask prices
 * @param {number} decimals - Decimal places for rounding
 * @returns {number} Mid price
 */
export const getMid = (bids, asks, decimals) => {
    const hasBids = Array.isArray(bids) && bids.length > 0;
    const hasAsks = Array.isArray(asks) && asks.length > 0;

    if (hasBids && hasAsks) {
        return roundTo((Math.max(...bids) + Math.min(...asks)) / 2.0, decimals);
    }
    if (hasBids) {
        return roundTo(Math.max(...bids), decimals);
    }
    if (hasAsks) {
        return roundTo(Math.min(...asks), decimals);
    }
    return NaN;
};

/**
 * Round a number to specified decimal places
 * @param {number} num - Number to round
 * @param {number} places - Decimal places
 * @returns {number} Rounded number
 */
export const roundTo = (num, places) => {
    if (typeof num !== 'number' || isNaN(num)) {
        return NaN;
    }
    const multiplier = Math.pow(10, places);
    return Math.round(num * multiplier) / multiplier;
};

/**
 * React Profiler render callback (disabled in production)
 */
export const handleRender = (id, phase, actualDuration) => {
    // Enable for debugging: console.log(`[${phase}] Component: ${id} rendered in ${actualDuration}ms`);
};

/**
 * Compare two arrays for element-wise equality
 * @param {any[]} a1 - First array
 * @param {any[]} a2 - Second array
 * @returns {boolean} True if arrays are equal
 */
export const AreArraysIndexEqual = (a1, a2) => {
    if (!Array.isArray(a1) || !Array.isArray(a2)) return false;
    if (a1.length !== a2.length) return false;
    return a1.every((item, index) => item === a2[index]);
};