// Firestore Database Operations
// Updated with new pricing structure and Product Catalog support
// Version 2.0 - January 13, 2025

import { db } from './firebase-config.js';
import { 
  collection, 
  addDoc, 
  getDoc,
  getDocs, 
  updateDoc,
  deleteDoc,
  doc,
  query, 
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// ============================================
// AGENTS COLLECTION
// ============================================

export async function addAgent(agentData) {
  try {
    const docRef = await addDoc(collection(db, 'agents'), {
      ...agentData,
      dateCreated: serverTimestamp(),
      isActive: true,
      totalOwed: 0,
      totalPaid: 0,
      totalCommission: 0
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding agent:', error);
    return { success: false, error: error.message };
  }
}

export async function getAgent(agentId) {
  try {
    const docRef = doc(db, 'agents', agentId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
    } else {
      return { success: false, error: 'Agent not found' };
    }
  } catch (error) {
    console.error('Error getting agent:', error);
    return { success: false, error: error.message };
  }
}

export async function getAllAgents() {
  try {
    const querySnapshot = await getDocs(collection(db, 'agents'));
    const agents = [];
    querySnapshot.forEach((doc) => {
      agents.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: agents };
  } catch (error) {
    console.error('Error getting agents:', error);
    return { success: false, error: error.message };
  }
}

export async function updateAgent(agentId, agentData) {
  try {
    const docRef = doc(db, 'agents', agentId);
    await updateDoc(docRef, {
      ...agentData,
      lastUpdated: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating agent:', error);
    return { success: false, error: error.message };
  }
}

// ✅ Actually deletes the document permanently
export async function deleteAgent(agentId) {
  try {
    const docRef = doc(db, 'agents', agentId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting agent:', error);
    return { success: false, error: error.message };
  }
}
// ============================================
// PRODUCTS COLLECTION (CATALOG)
// ============================================

export async function addProduct(productData) {
  try {
    const docRef = await addDoc(collection(db, 'products'), {
      hairBrand: productData.hairBrand,
      color: productData.color,
      length: productData.length,
      sellingPrice: productData.sellingPrice || 0,
      description: productData.description || '',
      dateAdded: serverTimestamp(),
      isActive: true
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding product:', error);
    return { success: false, error: error.message };
  }
}

export async function getAllProducts() {
  try {
    const q = query(collection(db, 'products'), where('isActive', '==', true));
    const querySnapshot = await getDocs(q);
    const products = [];
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: products };
  } catch (error) {
    console.error('Error getting products:', error);
    return { success: false, error: error.message };
  }
}

export async function getProductsByBrand(hairBrand) {
  try {
    const q = query(
      collection(db, 'products'), 
      where('hairBrand', '==', hairBrand),
      where('isActive', '==', true)
    );
    const querySnapshot = await getDocs(q);
    const products = [];
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: products };
  } catch (error) {
    console.error('Error getting products by brand:', error);
    return { success: false, error: error.message };
  }
}

export async function updateProduct(productId, productData) {
  try {
    const docRef = doc(db, 'products', productId);
    await updateDoc(docRef, {
      ...productData,
      lastUpdated: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating product:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteProduct(productId) {
  try {
    const docRef = doc(db, 'products', productId);
    await updateDoc(docRef, { isActive: false });
    return { success: true };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { success: false, error: error.message };
  }
}

// Helper function to get unique hair brands
export async function getHairBrands() {
  try {
    const result = await getAllProducts();
    if (result.success) {
      const brands = [...new Set(result.data.map(p => p.hairBrand))];
      return { success: true, data: brands.sort() };
    }
    return { success: false, error: 'Failed to get products' };
  } catch (error) {
    console.error('Error getting hair brands:', error);
    return { success: false, error: error.message };
  }
}

// Helper function to get colors for a brand
export async function getColorsByBrand(hairBrand) {
  try {
    const result = await getProductsByBrand(hairBrand);
    if (result.success) {
      const colors = [...new Set(result.data.map(p => p.color))];
      return { success: true, data: colors.sort() };
    }
    return { success: false, error: 'Failed to get products' };
  } catch (error) {
    console.error('Error getting colors:', error);
    return { success: false, error: error.message };
  }
}

// Helper function to get lengths for a brand and color
export async function getLengthsByBrandAndColor(hairBrand, color) {
  try {
    const q = query(
      collection(db, 'products'),
      where('hairBrand', '==', hairBrand),
      where('color', '==', color),
      where('isActive', '==', true)
    );
    const querySnapshot = await getDocs(q);
    const lengths = [];
    querySnapshot.forEach((doc) => {
      lengths.push(doc.data().length);
    });
    return { success: true, data: [...new Set(lengths)].sort((a, b) => a - b) };
  } catch (error) {
    console.error('Error getting lengths:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// WAREHOUSE COLLECTION
// ============================================

export async function addWarehouseStock(stockData) {
  try {
    const availableQuantity = stockData.importQuantity || stockData.initialQuantity;
    const totalImportValue = (stockData.importPrice || stockData.costPrice) * availableQuantity;
    
    const docRef = await addDoc(collection(db, 'warehouse'), {
      hairBrand: stockData.hairBrand || stockData.productName,
      color: stockData.color || 'Not Specified',
      length: stockData.inches || stockData.length,
      importDate: stockData.importDate,
      importQuantity: stockData.importQuantity || stockData.initialQuantity,
      availableQuantity: availableQuantity,
      distributedQuantity: 0,
      importPrice: stockData.importPrice || stockData.costPrice,
      totalImportValue: totalImportValue,
      availableTotalValue: totalImportValue,
      supplier: stockData.supplier,
      notes: stockData.notes || '',
      status: 'available',
      dateAdded: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding warehouse stock:', error);
    return { success: false, error: error.message };
  }
}

export async function getWarehouseStock() {
  try {
    const querySnapshot = await getDocs(collection(db, 'warehouse'));
    const stock = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Auto-calculate status
      let status = 'available';
      if (data.availableQuantity === 0) {
        status = 'out';
      } else if (data.availableQuantity < 10) {
        status = 'low';
      }
      stock.push({ id: doc.id, ...data, status });
    });
    return { success: true, data: stock };
  } catch (error) {
    console.error('Error getting warehouse stock:', error);
    return { success: false, error: error.message };
  }
}

export async function updateWarehouseStock(stockId, updateData) {
  try {
    const docRef = doc(db, 'warehouse', stockId);
    
    // Recalculate values if quantities change
    if (updateData.availableQuantity !== undefined) {
      const stockDoc = await getDoc(docRef);
      const currentData = stockDoc.data();
      updateData.availableTotalValue = updateData.availableQuantity * currentData.importPrice;
      
      // Update status
      if (updateData.availableQuantity === 0) {
        updateData.status = 'out';
      } else if (updateData.availableQuantity < 10) {
        updateData.status = 'low';
      } else {
        updateData.status = 'available';
      }
    }
    
    await updateDoc(docRef, {
      ...updateData,
      lastUpdated: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating warehouse stock:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// DISTRIBUTIONS COLLECTION
// ============================================

export async function addDistribution(distributionData) {
  try {
    const docRef = await addDoc(collection(db, 'distributions'), {
      ...distributionData,
      distributionDate: distributionData.distributionDate || serverTimestamp(),
      status: 'completed'
    });
    
    // Update warehouse quantities
    if (distributionData.items && distributionData.items.length > 0) {
      for (const item of distributionData.items) {
        if (item.warehouseStockId) {
          const stockRef = doc(db, 'warehouse', item.warehouseStockId);
          const stockDoc = await getDoc(stockRef);
          if (stockDoc.exists()) {
            const currentData = stockDoc.data();
            const newAvailable = currentData.availableQuantity - item.quantity;
            const newDistributed = currentData.distributedQuantity + item.quantity;
            
            await updateWarehouseStock(item.warehouseStockId, {
              availableQuantity: newAvailable,
              distributedQuantity: newDistributed
            });
          }
        }
      }
    }
    
    // Update agent's total owed
    if (distributionData.agentId && distributionData.totalAgentPrice) {
      const agentRef = doc(db, 'agents', distributionData.agentId);
      const agentDoc = await getDoc(agentRef);
      if (agentDoc.exists()) {
        const currentOwed = agentDoc.data().totalOwed || 0;
        await updateDoc(agentRef, {
          totalOwed: currentOwed + distributionData.totalAgentPrice
        });
      }
    }
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding distribution:', error);
    return { success: false, error: error.message };
  }
}

export async function getDistributions(agentId = null) {
  try {
    let q;
    if (agentId) {
      q = query(
        collection(db, 'distributions'), 
        where('agentId', '==', agentId),
        orderBy('distributionDate', 'desc')
      );
    } else {
      q = query(collection(db, 'distributions'), orderBy('distributionDate', 'desc'));
    }
    
    const querySnapshot = await getDocs(q);
    const distributions = [];
    querySnapshot.forEach((doc) => {
      distributions.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: distributions };
  } catch (error) {
    console.error('Error getting distributions:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// SALES COLLECTION
// ============================================

export async function addSale(saleData) {
  try {
    const docRef = await addDoc(collection(db, 'sales'), {
      ...saleData,
      saleDate: saleData.saleDate || serverTimestamp(),
      paymentStatus: saleData.paymentStatus || 'pending'
    });
    
    // Update agent's commission
    if (saleData.agentId && saleData.agentCommission) {
      const agentRef = doc(db, 'agents', saleData.agentId);
      const agentDoc = await getDoc(agentRef);
      if (agentDoc.exists()) {
        const currentCommission = agentDoc.data().totalCommission || 0;
        await updateDoc(agentRef, {
          totalCommission: currentCommission + saleData.agentCommission
        });
      }
    }
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding sale:', error);
    return { success: false, error: error.message };
  }
}

export async function getSales(agentId = null) {
  try {
    let q;
    if (agentId) {
      q = query(
        collection(db, 'sales'), 
        where('agentId', '==', agentId),
        orderBy('saleDate', 'desc')
      );
    } else {
      q = query(collection(db, 'sales'), orderBy('saleDate', 'desc'));
    }
    
    const querySnapshot = await getDocs(q);
    const sales = [];
    querySnapshot.forEach((doc) => {
      sales.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: sales };
  } catch (error) {
    console.error('Error getting sales:', error);
    return { success: false, error: error.message };
  }
}

export async function updateSale(saleId, saleData) {
  try {
    const docRef = doc(db, 'sales', saleId);
    await updateDoc(docRef, {
      ...saleData,
      lastUpdated: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating sale:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// PAYMENTS COLLECTION
// ============================================

export async function addPayment(paymentData) {
  try {
    const docRef = await addDoc(collection(db, 'payments'), {
      ...paymentData,
      paymentDate: paymentData.paymentDate || serverTimestamp(),
      recordedBy: paymentData.recordedBy || 'admin@hawalina.com'
    });
    
    // Update agent's balance
    if (paymentData.agentId && paymentData.amount) {
      const agentRef = doc(db, 'agents', paymentData.agentId);
      const agentDoc = await getDoc(agentRef);
      if (agentDoc.exists()) {
        const agentData = agentDoc.data();
        const currentOwed = agentData.totalOwed || 0;
        const currentPaid = agentData.totalPaid || 0;
        
        await updateDoc(agentRef, {
          totalOwed: currentOwed - paymentData.amount,
          totalPaid: currentPaid + paymentData.amount,
          lastPayment: paymentData.paymentDate,
          lastPaymentAmount: paymentData.amount
        });
        
        // Create notification for agent
        await addNotification({
          agentId: paymentData.agentId,
          type: 'payment_received',
          message: `Payment of GHS ${paymentData.amount} received`,
          date: serverTimestamp(),
          isRead: false
        });
      }
    }
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding payment:', error);
    return { success: false, error: error.message };
  }
}

export async function getPayments(agentId = null) {
  try {
    let q;
    if (agentId) {
      q = query(
        collection(db, 'payments'),
        where('agentId', '==', agentId),
        orderBy('paymentDate', 'desc')
      );
    } else {
      q = query(collection(db, 'payments'), orderBy('paymentDate', 'desc'));
    }
    
    const querySnapshot = await getDocs(q);
    const payments = [];
    querySnapshot.forEach((doc) => {
      payments.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: payments };
  } catch (error) {
    console.error('Error getting payments:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// NOTIFICATIONS COLLECTION
// ============================================

export async function addNotification(notificationData) {
  try {
    const docRef = await addDoc(collection(db, 'notifications'), {
      ...notificationData,
      dateCreated: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding notification:', error);
    return { success: false, error: error.message };
  }
}

export async function getNotifications(agentId) {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('agentId', '==', agentId),
      orderBy('dateCreated', 'desc'),
      limit(50)
    );
    
    const querySnapshot = await getDocs(q);
    const notifications = [];
    querySnapshot.forEach((doc) => {
      notifications.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: notifications };
  } catch (error) {
    console.error('Error getting notifications:', error);
    return { success: false, error: error.message };
  }
}

export async function markNotificationAsRead(notificationId) {
  try {
    const docRef = doc(db, 'notifications', notificationId);
    await updateDoc(docRef, { isRead: true });
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// CALCULATION HELPERS
// ============================================

export function calculateCompanyProfit(agentPrice, importPrice, quantity) {
  return (agentPrice - importPrice) * quantity;
}

export function calculateAgentCommission(sellingPrice, agentPrice, quantity) {
  return (sellingPrice - agentPrice) * quantity;
}

export function calculateTotalAgentPrice(agentPrice, quantity, miscFee = 0) {
  return (agentPrice * quantity) + miscFee;
}

export function calculateTotalSellingPrice(sellingPrice, quantity) {
  return sellingPrice * quantity;
}

console.log('✅ Firestore database module loaded (v2.0 - Updated Pricing Structure)');
