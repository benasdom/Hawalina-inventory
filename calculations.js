// Business Calculations Module
// Reusable calculation functions for the hair inventory system

// ============================================
// PRICING CALCULATIONS
// ============================================

/**
 * Calculate commission from agent price and selling price
 * @param {number} agentPrice - Price agent pays
 * @param {number} sellingPrice - Retail selling price
 * @returns {number} Commission amount
 */
export function calculateCommission(agentPrice, sellingPrice) {
  return sellingPrice - agentPrice;
}

/**
 * Calculate margin percentage
 * @param {number} commission - Commission amount
 * @param {number} sellingPrice - Retail selling price
 * @returns {number} Margin percentage
 */
export function calculateMargin(commission, sellingPrice) {
  if (sellingPrice === 0) return 0;
  return (commission / sellingPrice) * 100;
}

/**
 * Calculate total commission from margin and selling price
 * @param {number} marginPercent - Margin percentage
 * @param {number} sellingPrice - Retail selling price
 * @returns {number} Commission amount
 */
export function calculateCommissionFromMargin(marginPercent, sellingPrice) {
  return (marginPercent / 100) * sellingPrice;
}

// ============================================
// INVENTORY CALCULATIONS
// ============================================

/**
 * Calculate total value of inventory items
 * @param {Array} items - Array of items with quantity and price
 * @returns {number} Total value
 */
export function calculateTotalValue(items) {
  return items.reduce((sum, item) => {
    const quantity = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.price) || 0;
    return sum + (quantity * price);
  }, 0);
}

/**
 * Calculate remaining stock
 * @param {number} received - Quantity received
 * @param {number} sold - Quantity sold
 * @returns {number} Remaining quantity
 */
export function calculateRemainingStock(received, sold) {
  return received - sold;
}

/**
 * Calculate stock value
 * @param {number} quantity - Quantity in stock
 * @param {number} pricePerUnit - Price per unit
 * @returns {number} Total stock value
 */
export function calculateStockValue(quantity, pricePerUnit) {
  return quantity * pricePerUnit;
}

// ============================================
// FINANCIAL CALCULATIONS
// ============================================

/**
 * Calculate outstanding balance
 * @param {number} distributed - Total value distributed to agent
 * @param {number} paid - Total amount paid by agent
 * @returns {number} Outstanding balance
 */
export function calculateOutstanding(distributed, paid) {
  return distributed - paid;
}

/**
 * Calculate collection rate percentage
 * @param {number} paid - Amount paid
 * @param {number} distributed - Amount distributed
 * @returns {number} Collection rate percentage
 */
export function calculateCollectionRate(paid, distributed) {
  if (distributed === 0) return 0;
  return (paid / distributed) * 100;
}

/**
 * Calculate profit
 * @param {number} revenue - Total revenue
 * @param {number} cost - Total cost
 * @returns {number} Profit amount
 */
export function calculateProfit(revenue, cost) {
  return revenue - cost;
}

/**
 * Calculate profit margin percentage
 * @param {number} profit - Profit amount
 * @param {number} revenue - Total revenue
 * @returns {number} Profit margin percentage
 */
export function calculateProfitMargin(profit, revenue) {
  if (revenue === 0) return 0;
  return (profit / revenue) * 100;
}

// ============================================
// DISTRIBUTION CALCULATIONS
// ============================================

/**
 * Calculate total distribution cost (including delivery)
 * @param {Array} products - Array of products with quantity and price
 * @param {number} deliveryFee - Delivery fee amount
 * @returns {number} Total distribution cost
 */
export function calculateDistributionTotal(products, deliveryFee = 0) {
  const subtotal = products.reduce((sum, product) => {
    const quantity = parseFloat(product.quantity) || 0;
    const price = parseFloat(product.agentPrice || product.price) || 0;
    return sum + (quantity * price);
  }, 0);
  
  return subtotal + parseFloat(deliveryFee);
}

/**
 * Calculate expected commission for distribution
 * @param {Array} products - Array of products with quantity, agent price, and selling price
 * @returns {number} Total expected commission
 */
export function calculateExpectedCommission(products) {
  return products.reduce((sum, product) => {
    const quantity = parseFloat(product.quantity) || 0;
    const agentPrice = parseFloat(product.agentPrice) || 0;
    const sellingPrice = parseFloat(product.sellingPrice || product.retailPrice) || 0;
    const commission = sellingPrice - agentPrice;
    return sum + (quantity * commission);
  }, 0);
}

// ============================================
// SALES CALCULATIONS
// ============================================

/**
 * Calculate sale total
 * @param {number} quantity - Quantity sold
 * @param {number} pricePerUnit - Price per unit
 * @returns {number} Total sale amount
 */
export function calculateSaleTotal(quantity, pricePerUnit) {
  return quantity * pricePerUnit;
}

/**
 * Calculate actual commission from a sale
 * @param {number} quantity - Quantity sold
 * @param {number} sellingPrice - Price sold at
 * @param {number} agentPrice - Price agent paid
 * @returns {number} Commission earned
 */
export function calculateActualCommission(quantity, sellingPrice, agentPrice) {
  const commissionPerUnit = sellingPrice - agentPrice;
  return quantity * commissionPerUnit;
}

/**
 * Calculate average sale value
 * @param {number} totalSales - Total sales amount
 * @param {number} numberOfSales - Number of sales transactions
 * @returns {number} Average sale value
 */
export function calculateAverageSale(totalSales, numberOfSales) {
  if (numberOfSales === 0) return 0;
  return totalSales / numberOfSales;
}

// ============================================
// ANALYTICS CALCULATIONS
// ============================================

/**
 * Calculate growth percentage
 * @param {number} current - Current period value
 * @param {number} previous - Previous period value
 * @returns {number} Growth percentage
 */
export function calculateGrowth(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Calculate percentage of total
 * @param {number} part - Part value
 * @param {number} total - Total value
 * @returns {number} Percentage
 */
export function calculatePercentageOfTotal(part, total) {
  if (total === 0) return 0;
  return (part / total) * 100;
}

/**
 * Calculate running total
 * @param {Array} values - Array of numeric values
 * @returns {Array} Array of running totals
 */
export function calculateRunningTotal(values) {
  let runningTotal = 0;
  return values.map(value => {
    runningTotal += value;
    return runningTotal;
  });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Round to 2 decimal places
 * @param {number} value - Value to round
 * @returns {number} Rounded value
 */
export function roundToTwo(value) {
  return Math.round(value * 100) / 100;
}

/**
 * Format currency (GHS)
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
  return `GHS ${roundToTwo(amount).toLocaleString()}`;
}

/**
 * Format percentage
 * @param {number} value - Percentage value
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage string
 */
export function formatPercentage(value, decimals = 1) {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Calculate sum of array
 * @param {Array} values - Array of numeric values
 * @returns {number} Sum of values
 */
export function sum(values) {
  return values.reduce((total, value) => total + (parseFloat(value) || 0), 0);
}

/**
 * Calculate average of array
 * @param {Array} values - Array of numeric values
 * @returns {number} Average value
 */
export function average(values) {
  if (values.length === 0) return 0;
  return sum(values) / values.length;
}

/**
 * Find maximum value in array
 * @param {Array} values - Array of numeric values
 * @returns {number} Maximum value
 */
export function max(values) {
  if (values.length === 0) return 0;
  return Math.max(...values.map(v => parseFloat(v) || 0));
}

/**
 * Find minimum value in array
 * @param {Array} values - Array of numeric values
 * @returns {number} Minimum value
 */
export function min(values) {
  if (values.length === 0) return 0;
  return Math.min(...values.map(v => parseFloat(v) || 0));
}

// ============================================
// DATE CALCULATIONS
// ============================================

/**
 * Get date range for period
 * @param {string} period - Period type (today, week, month, year)
 * @returns {Object} Object with startDate and endDate
 */
export function getDateRange(period) {
  const now = new Date();
  const endDate = new Date(now);
  let startDate = new Date(now);
  
  switch(period) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate.setDate(now.getDate() - 30);
  }
  
  return { startDate, endDate };
}

/**
 * Check if date is within range
 * @param {Date} date - Date to check
 * @param {Date} startDate - Range start date
 * @param {Date} endDate - Range end date
 * @returns {boolean} True if date is within range
 */
export function isDateInRange(date, startDate, endDate) {
  const checkDate = new Date(date);
  return checkDate >= startDate && checkDate <= endDate;
}

console.log('Calculations module loaded');
