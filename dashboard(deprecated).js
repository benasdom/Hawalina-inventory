// CEO Dashboard JavaScript
// Loads data from Firebase and displays KPIs

// Import Firebase modules
import { db } from './firebase-config.js';
import { 
  collection, 
  getDocs,
  query,
  orderBy,
  limit 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { calculateTotalValue, calculateStockValue, formatCurrency } from './calculations.js';

// State
let allWarehouse = [];
let allProducts = [];
let allAgents = [];
let allDistributions = [];
let allSales = [];
let allPayments = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadAllData();
  calculateAndDisplayKPIs();
  populateTables();
  setupEventListeners();
});

// Load all data from Firestore
async function loadAllData() {
  try {
    // Load warehouse data
    const warehouseQuery = query(collection(db, 'warehouse'), orderBy('dateAdded', 'desc'));
    const warehouseSnap = await getDocs(warehouseQuery);
    allWarehouse = warehouseSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Load products
    const productsQuery = query(collection(db, 'products'), orderBy('dateAdded', 'desc'));
    const productsSnap = await getDocs(productsQuery);
    allProducts = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Load agents
    const agentsQuery = query(collection(db, 'agents'), orderBy('dateCreated', 'desc'));
    const agentsSnap = await getDocs(agentsQuery);
    allAgents = agentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Load distributions
    const distQuery = query(collection(db, 'distributions'), orderBy('distributionDate', 'desc'));
    const distSnap = await getDocs(distQuery);
    allDistributions = distSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Load sales
    const salesQuery = query(collection(db, 'sales'), orderBy('saleDate', 'desc'));
    const salesSnap = await getDocs(salesQuery);
    allSales = salesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Load payments
    const paymentsQuery = query(collection(db, 'payments'), orderBy('paymentDate', 'desc'));
    const paymentsSnap = await getDocs(paymentsQuery);
    allPayments = paymentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log('Data loaded:', {
      warehouse: allWarehouse.length,
      products: allProducts.length,
      agents: allAgents.length,
      distributions: allDistributions.length,
      sales: allSales.length,
      payments: allPayments.length
    });

  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// Calculate and display KPIs
function calculateAndDisplayKPIs() {
  // 1. Total Import Value = sum of (importPrice × importQuantity)
  const totalImportValue = allWarehouse.reduce((sum, item) => {
    const qty = item.importQuantity || item.availableQuantity || 0;
    const price = item.importPrice || 0;
    return sum + (qty * price);
  }, 0);

  // 2. Total Agent Value = sum of (agentPrice × distributedQuantity)
  const totalAgentValue = allDistributions.reduce((sum, dist) => {
    if (dist.items && Array.isArray(dist.items)) {
      return sum + dist.items.reduce((itemSum, item) => {
        return itemSum + ((item.agentPrice || 0) * (item.quantity || 0));
      }, 0);
    }
    return sum + (dist.totalAgentPrice || 0);
  }, 0);

  // Also calculate from warehouse distributed quantity
  const warehouseAgentValue = allWarehouse.reduce((sum, item) => {
    const qty = item.distributedQuantity || 0;
    const price = item.agentPrice || 0;
    return sum + (qty * price);
  }, 0);

  // 3. Total Selling Value = sum of (sellingPrice × quantity) for all sales
  const totalSellingValue = allSales.reduce((sum, sale) => {
    return sum + (sale.totalSale || (sale.sellingPrice * sale.quantity) || 0);
  }, 0);

  // 4. Total Company Profit = Total Agent Value - Total Import Value
  const totalCompanyProfit = totalAgentValue - totalImportValue;

  // 5. Total Agent Commission = Total Selling Value - Total Agent Value
  const totalAgentCommission = totalSellingValue - totalAgentValue;

  // 6. Distribution Rate = (Distributed Quantity / Imported Quantity) × 100%
  const totalImported = allWarehouse.reduce((sum, item) => sum + (item.importQuantity || item.availableQuantity || 0), 0);
  const totalDistributed = allWarehouse.reduce((sum, item) => sum + (item.distributedQuantity || 0), 0);
  const distributionRate = totalImported > 0 ? (totalDistributed / totalImported) * 100 : 0;

  // 7. Active Agents = agents with activity
  const activeAgents = allAgents.filter(agent => agent.isActive !== false).length;

  // 8. Top Performing Hair Brand
  const brandValues = {};
  allWarehouse.forEach(item => {
    const brand = item.hairBrand || 'Unknown';
    const value = (item.distributedQuantity || 0) * (item.agentPrice || 0);
    brandValues[brand] = (brandValues[brand] || 0) + value;
  });
  
  let topBrand = '—';
  let maxValue = 0;
  for (const [brand, value] of Object.entries(brandValues)) {
    if (value > maxValue) {
      maxValue = value;
      topBrand = brand;
    }
  }

  // Display KPIs
  document.getElementById('kpiImport').textContent = totalImportValue.toLocaleString();
  document.getElementById('kpiAgent').textContent = totalAgentValue.toLocaleString();
  document.getElementById('kpiSell').textContent = totalSellingValue.toLocaleString();
  document.getElementById('kpiProfit').textContent = totalCompanyProfit.toLocaleString();
  document.getElementById('kpiComm').textContent = totalAgentCommission.toLocaleString();
  document.getElementById('kpiRate').textContent = distributionRate.toFixed(1);
  document.getElementById('kpiActive').textContent = activeAgents;
  document.getElementById('kpiTopBrand').textContent = topBrand;
}

// Populate tables
function populateTables() {
  populateTopAgents();
  populateTopProducts();
}

// Top Performing Agents
function populateTopAgents() {
  const tbody = document.getElementById('agentsBody');
  
  if (allAgents.length === 0) {
    tbody.innerHTML = '<tr><td class="empty" colspan="4">No agents found.</td></tr>';
    return;
  }

  // Calculate stats for each agent
  const agentStats = allAgents.map(agent => {
    const agentDists = allDistributions.filter(d => d.agentId === agent.id);
    const agentSales = allSales.filter(s => s.agentId === agent.id);
    
    const totalAgentValue = agentDists.reduce((sum, d) => {
      if (d.items && Array.isArray(d.items)) {
        return sum + d.items.reduce((s, i) => s + ((i.agentPrice || 0) * (i.quantity || 0)), 0);
      }
      return sum + (d.totalAgentPrice || 0);
    }, 0);

    const totalSellingValue = agentSales.reduce((sum, s) => sum + (s.totalSale || 0), 0);
    
    const totalCommission = agentSales.reduce((sum, s) => sum + (s.agentCommission || 0), 0);

    return {
      id: agent.id,
      name: agent.fullName || agent.name || agent.nationalId,
      totalAgentValue,
      totalSellingValue,
      totalCommission
    };
  });

  // Sort by total selling value
  agentStats.sort((a, b) => b.totalSellingValue - a.totalSellingValue);

  // Display top 5
  tbody.innerHTML = agentStats.slice(0, 5).map(agent => `
    <tr>
      <td><strong>${agent.name}</strong><br><small>${agent.id}</small></td>
      <td>GHS ${agent.totalAgentValue.toLocaleString()}</td>
      <td>GHS ${agent.totalSellingValue.toLocaleString()}</td>
      <td><strong style="color: var(--success);">GHS ${agent.totalCommission.toLocaleString()}</strong></td>
    </tr>
  `).join('');
}

// Top Performing Products
function populateTopProducts() {
  const tbody = document.getElementById('productsBody');
  const prodColLabel = document.getElementById('prodColLabel');
  const isBrandView = prodColLabel.textContent === 'Hair Brand';
  
  if (allWarehouse.length === 0) {
    tbody.innerHTML = '<tr><td class="empty" colspan="2">No products found.</td></tr>';
    return;
  }

  // Group by brand or color
  const productGroups = {};
  allWarehouse.forEach(item => {
    const key = isBrandView ? (item.hairBrand || 'Unknown') : (item.color || 'Unknown');
    const value = (item.distributedQuantity || 0) * (item.agentPrice || 0);
    productGroups[key] = (productGroups[key] || 0) + value;
  });

  // Convert to array and sort
  const sortedProducts = Object.entries(productGroups)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  tbody.innerHTML = sortedProducts.slice(0, 5).map(product => `
    <tr>
      <td><strong>${product.name}</strong></td>
      <td>GHS ${product.value.toLocaleString()}</td>
    </tr>
  `).join('');
}

// Setup event listeners
function setupEventListeners() {
  // Range chips
  const chips = document.querySelectorAll('#chips .chip');
  const rangeLabel = document.getElementById('rangeLabel');
  chips.forEach(btn => {
    btn.addEventListener('click', () => {
      chips.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      rangeLabel.textContent = btn.dataset.range;
      // TODO: Filter data based on range
    });
  });

  // Brand/Color tabs
  const tabBrand = document.getElementById('tabBrand');
  const tabColor = document.getElementById('tabColor');
  const prodColLabel = document.getElementById('prodColLabel');
  
  if (tabBrand) {
    tabBrand.addEventListener('click', () => {
      prodColLabel.textContent = 'Hair Brand';
      populateTopProducts();
    });
  }
  
  if (tabColor) {
    tabColor.addEventListener('click', () => {
      prodColLabel.textContent = 'Hair Color';
      populateTopProducts();
    });
  }
}

console.log('Dashboard script loaded');
