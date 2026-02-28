// Export Utilities
// Functions to export data to CSV and Excel formats

// ============================================
// CSV EXPORT
// ============================================

/**
 * Convert array of objects to CSV string
 * @param {Array} data - Array of objects to convert
 * @param {Array} headers - Optional custom headers
 * @returns {string} CSV string
 */
export function arrayToCSV(data, headers = null) {
  if (!data || data.length === 0) {
    return '';
  }
  
  // Get headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Create header row
  const headerRow = csvHeaders.join(',');
  
  // Create data rows
  const dataRows = data.map(row => {
    return csvHeaders.map(header => {
      let cell = row[header];
      
      // Handle different data types
      if (cell === null || cell === undefined) {
        cell = '';
      } else if (typeof cell === 'object') {
        cell = JSON.stringify(cell);
      } else {
        cell = String(cell);
      }
      
      // Escape quotes and wrap in quotes if contains comma or newline
      if (cell.includes(',') || cell.includes('\n') || cell.includes('"')) {
        cell = '"' + cell.replace(/"/g, '""') + '"';
      }
      
      return cell;
    }).join(',');
  });
  
  // Combine header and data rows
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Download CSV file
 * @param {string} csvContent - CSV content string
 * @param {string} filename - Name of file to download
 */
export function downloadCSV(csvContent, filename = 'export.csv') {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Export array of objects to CSV file
 * @param {Array} data - Data to export
 * @param {string} filename - Filename for download
 * @param {Array} headers - Optional custom headers
 */
export function exportToCSV(data, filename = 'export.csv', headers = null) {
  const csv = arrayToCSV(data, headers);
  downloadCSV(csv, filename);
}

// ============================================
// SALES EXPORT
// ============================================

/**
 * Export sales data to CSV
 * @param {Array} sales - Sales data array
 * @param {string} filename - Filename for download
 */
export function exportSalesToCSV(sales, filename = 'sales_export.csv') {
  const headers = [
    'Date',
    'Agent',
    'National ID',
    'Customer',
    'Phone',
    'Product',
    'Quantity',
    'Selling Price',
    'Total Sale',
    'Commission'
  ];
  
  const formattedData = sales.map(sale => ({
    'Date': formatDate(sale.date),
    'Agent': sale.agentName || '',
    'National ID': sale.agentNationalId || '',
    'Customer': sale.customerName || '',
    'Phone': sale.customerPhone || '',
    'Product': sale.productName || '',
    'Quantity': sale.quantity || 0,
    'Selling Price': sale.sellingPrice || 0,
    'Total Sale': sale.totalSale || 0,
    'Commission': sale.commission || 0
  }));
  
  exportToCSV(formattedData, filename, headers);
}

// ============================================
// AGENTS EXPORT
// ============================================

/**
 * Export agents data to CSV
 * @param {Array} agents - Agents data array
 * @param {string} filename - Filename for download
 */
export function exportAgentsToCSV(agents, filename = 'agents_export.csv') {
  const headers = [
    'Name',
    'National ID',
    'Phone',
    'Email',
    'Location',
    'Status',
    'Date Added'
  ];
  
  const formattedData = agents.map(agent => ({
    'Name': agent.fullName || '',
    'National ID': agent.nationalId || '',
    'Phone': agent.phone || '',
    'Email': agent.email || '',
    'Location': agent.location || '',
    'Status': agent.isActive ? 'Active' : 'Inactive',
    'Date Added': formatDate(agent.dateCreated)
  }));
  
  exportToCSV(formattedData, filename, headers);
}

// ============================================
// PRODUCTS EXPORT
// ============================================

/**
 * Export products data to CSV
 * @param {Array} products - Products data array
 * @param {string} filename - Filename for download
 */
export function exportProductsToCSV(products, filename = 'products_export.csv') {
  const headers = [
    'Product Name',
    'Hair Type',
    'Length',
    'Agent Price',
    'Selling Price',
    'Commission',
    'Margin %',
    'Status'
  ];
  
  const formattedData = products.map(product => ({
    'Product Name': product.productName || '',
    'Hair Type': product.hairType || '',
    'Length': product.inches ? product.inches + '"' : '',
    'Agent Price': product.agentPrice || 0,
    'Selling Price': product.sellingPrice || 0,
    'Commission': product.commission || 0,
    'Margin %': product.commission && product.sellingPrice 
      ? ((product.commission / product.sellingPrice) * 100).toFixed(1) 
      : 0,
    'Status': product.isActive ? 'Active' : 'Inactive'
  }));
  
  exportToCSV(formattedData, filename, headers);
}

// ============================================
// PAYMENTS EXPORT
// ============================================

/**
 * Export payments data to CSV
 * @param {Array} payments - Payments data array
 * @param {string} filename - Filename for download
 */
export function exportPaymentsToCSV(payments, filename = 'payments_export.csv') {
  const headers = [
    'Date',
    'Agent',
    'National ID',
    'Amount',
    'Method',
    'Notes'
  ];
  
  const formattedData = payments.map(payment => ({
    'Date': formatDate(payment.date),
    'Agent': payment.agentName || '',
    'National ID': payment.agentNationalId || '',
    'Amount': payment.amount || 0,
    'Method': payment.method || '',
    'Notes': payment.notes || ''
  }));
  
  exportToCSV(formattedData, filename, headers);
}

// ============================================
// WAREHOUSE EXPORT
// ============================================

/**
 * Export warehouse stock to CSV
 * @param {Array} stock - Warehouse stock array
 * @param {string} filename - Filename for download
 */
export function exportWarehouseToCSV(stock, filename = 'warehouse_export.csv') {
  const headers = [
    'Product Name',
    'Hair Type',
    'Length',
    'Quantity Imported',
    'Quantity Distributed',
    'Quantity Remaining',
    'Cost per Unit',
    'Total Value',
    'Supplier',
    'Date Imported'
  ];
  
  const formattedData = stock.map(item => ({
    'Product Name': item.productName || '',
    'Hair Type': item.hairType || '',
    'Length': item.inches ? item.inches + '"' : '',
    'Quantity Imported': item.quantityImported || 0,
    'Quantity Distributed': item.quantityDistributed || 0,
    'Quantity Remaining': item.quantityRemaining || 0,
    'Cost per Unit': item.costPrice || 0,
    'Total Value': (item.quantityRemaining || 0) * (item.costPrice || 0),
    'Supplier': item.supplier || '',
    'Date Imported': formatDate(item.dateImported)
  }));
  
  exportToCSV(formattedData, filename, headers);
}

// ============================================
// REPORTS EXPORT
// ============================================

/**
 * Export report data to CSV
 * @param {Object} reportData - Report data object
 * @param {string} reportType - Type of report
 * @param {string} filename - Filename for download
 */
export function exportReportToCSV(reportData, reportType = 'report', filename = null) {
  const filenameToUse = filename || `${reportType}_${getCurrentDate()}.csv`;
  
  // Export based on report type
  if (reportData.sales) {
    exportSalesToCSV(reportData.sales, filenameToUse);
  } else if (reportData.agents) {
    exportAgentsToCSV(reportData.agents, filenameToUse);
  } else {
    // Generic export
    exportToCSV([reportData], filenameToUse);
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format date for export
 * @param {any} date - Date to format (Timestamp, Date, or string)
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  if (!date) return '';
  
  // Handle Firebase Timestamp
  if (date.toDate) {
    date = date.toDate();
  }
  
  // Handle date string
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  // Handle Date object
  if (date instanceof Date && !isNaN(date)) {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  }
  
  return '';
}

/**
 * Get current date as string
 * @returns {string} Current date in YYYY-MM-DD format
 */
function getCurrentDate() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Create filename with date
 * @param {string} basename - Base filename
 * @param {string} extension - File extension (default: csv)
 * @returns {string} Filename with current date
 */
export function createDateFilename(basename, extension = 'csv') {
  return `${basename}_${getCurrentDate()}.${extension}`;
}

// ============================================
// TABLE TO CSV
// ============================================

/**
 * Export HTML table to CSV
 * @param {string} tableId - ID of HTML table element
 * @param {string} filename - Filename for download
 */
export function exportTableToCSV(tableId, filename = 'table_export.csv') {
  const table = document.getElementById(tableId);
  if (!table) {
    console.error('Table not found:', tableId);
    return;
  }
  
  const rows = [];
  
  // Get header row
  const headerCells = table.querySelectorAll('thead th');
  const headers = Array.from(headerCells).map(cell => cell.textContent.trim());
  rows.push(headers.join(','));
  
  // Get data rows
  const dataRows = table.querySelectorAll('tbody tr');
  dataRows.forEach(row => {
    const cells = row.querySelectorAll('td');
    const rowData = Array.from(cells).map(cell => {
      let text = cell.textContent.trim();
      // Escape if contains comma
      if (text.includes(',')) {
        text = '"' + text + '"';
      }
      return text;
    });
    rows.push(rowData.join(','));
  });
  
  const csv = rows.join('\n');
  downloadCSV(csv, filename);
}

console.log('Export utilities loaded');
