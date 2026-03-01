// Firestore Database Operations
// Updated with new pricing structure and Product Catalog support
// Version 2.2 - Cleaned to match Firestore schema

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
      dateCreated:     serverTimestamp(),
      isActive:        true,
      totalOwed:       0,
      totalPaid:       0,
      totalCommission: 0,
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

export async function deleteAgent(agentId) {
  try {
    const docRef = doc(db, 'agents', agentId);
    await updateDoc(docRef, { isActive: false });
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

// Helper: get unique hair brands
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

// Helper: get colors for a brand
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

// Helper: get lengths for a brand and color
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

// Helper: get a specific product by brand + color + length
export async function getProductBySpecs(hairBrand, color, length) {
  try {
    const q = query(
      collection(db, 'products'),
      where('hairBrand', '==', hairBrand),
      where('color', '==', color),
      where('length', '==', length),
      where('isActive', '==', true)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return { success: false, error: 'Product not found' };
    }
    const docSnap = querySnapshot.docs[0];
    return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
  } catch (error) {
    console.error('Error getting product by specs:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// WAREHOUSE COLLECTION
// ============================================

export async function addWarehouseStock(stockData) {
  try {
    const availableQuantity = stockData.importQuantity || stockData.initialQuantity;
    const totalImportValue  = (stockData.importPrice || stockData.costPrice) * availableQuantity;
    
    const docRef = await addDoc(collection(db, 'warehouse'), {
      hairBrand:           stockData.hairBrand || stockData.productName,
      color:               stockData.color || 'Not Specified',
      length:              stockData.inches || stockData.length,
      importDate:          stockData.importDate,
      importQuantity:      availableQuantity,
      availableQuantity:   availableQuantity,
      distributedQuantity: 0,
      importPrice:         stockData.importPrice || stockData.costPrice,
      totalImportValue:    totalImportValue,
      availableTotalValue: totalImportValue,
      supplier:            stockData.supplier || '',
      notes:               stockData.notes || '',
      status:              'available',
      dateAdded:           serverTimestamp()
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
      let status = 'available';
      if (data.availableQuantity === 0) status = 'out';
      else if (data.availableQuantity < 10) status = 'low';
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

    if (updateData.availableQuantity !== undefined) {
      const stockDoc    = await getDoc(docRef);
      const currentData = stockDoc.data();
      updateData.availableTotalValue = updateData.availableQuantity * currentData.importPrice;

      if (updateData.availableQuantity === 0)     updateData.status = 'out';
      else if (updateData.availableQuantity < 10) updateData.status = 'low';
      else                                         updateData.status = 'available';
    }
    
    await updateDoc(docRef, { ...updateData, lastUpdated: serverTimestamp() });
    return { success: true };
  } catch (error) {
    console.error('Error updating warehouse stock:', error);
    return { success: false, error: error.message };
  }
}

// Permanently delete a warehouse stock entry
export async function deleteWarehouseStock(stockId) {
  try {
    await deleteDoc(doc(db, 'warehouse', stockId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting warehouse stock:', error);
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
    
    if (distributionData.items && distributionData.items.length > 0) {
      for (const item of distributionData.items) {
        if (item.warehouseStockId) {
          const stockRef = doc(db, 'warehouse', item.warehouseStockId);
          const stockDoc = await getDoc(stockRef);
          if (stockDoc.exists()) {
            const currentData    = stockDoc.data();
            const newAvailable   = currentData.availableQuantity   - item.quantity;
            const newDistributed = currentData.distributedQuantity + item.quantity;
            await updateWarehouseStock(item.warehouseStockId, {
              availableQuantity:   newAvailable,
              distributedQuantity: newDistributed
            });
          }
        }
      }
    }
    
    if (distributionData.agentId && distributionData.totalAgentPrice) {
      const agentRef = doc(db, 'agents', distributionData.agentId);
      const agentDoc = await getDoc(agentRef);
      if (agentDoc.exists()) {
        const currentOwed = agentDoc.data().totalOwed || 0;
        await updateDoc(agentRef, { totalOwed: currentOwed + distributionData.totalAgentPrice });
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
    // NOTE: No orderBy here — avoids needing a composite Firestore index
    // (where agentId + orderBy distributionDate). We sort in JS instead.
    let q;
    if (agentId) {
      q = query(collection(db, 'distributions'), where('agentId', '==', agentId));
    } else {
      q = query(collection(db, 'distributions'));
    }
    const querySnapshot = await getDocs(q);
    const distributions = [];
    querySnapshot.forEach((doc) => {
      distributions.push({ id: doc.id, ...doc.data() });
    });
    // Sort descending — handles both string dates ("2026-03-01") and Timestamps
    distributions.sort((a, b) => {
      const da = a.distributionDate?.toDate ? a.distributionDate.toDate() : new Date(a.distributionDate || 0);
      const db2 = b.distributionDate?.toDate ? b.distributionDate.toDate() : new Date(b.distributionDate || 0);
      return db2 - da;
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
      saleDate:      saleData.saleDate || serverTimestamp(),
      paymentStatus: saleData.paymentStatus || 'pending'
    });

    // Update selling agent's totalCommission
    if (saleData.agentId && saleData.agentCommission) {
      const agentRef = doc(db, 'agents', saleData.agentId);
      const agentDoc = await getDoc(agentRef);
      if (agentDoc.exists()) {
        const currentCommission = agentDoc.data().totalCommission || 0;
        await updateDoc(agentRef, { totalCommission: currentCommission + saleData.agentCommission });
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
    // NOTE: No orderBy on filtered query — avoids composite index requirement.
    // Sort by saleDate in JS instead.
    let q;
    if (agentId) {
      q = query(collection(db, 'sales'), where('agentId', '==', agentId));
    } else {
      q = query(collection(db, 'sales'), orderBy('saleDate', 'desc'));
    }
    const querySnapshot = await getDocs(q);
    const sales = [];
    querySnapshot.forEach((doc) => {
      sales.push({ id: doc.id, ...doc.data() });
    });
    if (agentId) {
      sales.sort((a, b) => {
        const da = a.saleDate?.toDate ? a.saleDate.toDate() : new Date(a.saleDate || 0);
        const db2 = b.saleDate?.toDate ? b.saleDate.toDate() : new Date(b.saleDate || 0);
        return db2 - da;
      });
    }
    return { success: true, data: sales };
  } catch (error) {
    console.error('Error getting sales:', error);
    return { success: false, error: error.message };
  }
}

export async function updateSale(saleId, saleData) {
  try {
    const docRef = doc(db, 'sales', saleId);
    await updateDoc(docRef, { ...saleData, lastUpdated: serverTimestamp() });
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
      recordedBy:  paymentData.recordedBy  || 'admin@hawalina.com'
    });
    
    if (paymentData.agentId && paymentData.amount) {
      const agentRef = doc(db, 'agents', paymentData.agentId);
      const agentDoc = await getDoc(agentRef);
      if (agentDoc.exists()) {
        const agentData   = agentDoc.data();
        const currentOwed = agentData.totalOwed || 0;
        const currentPaid = agentData.totalPaid || 0;
        await updateDoc(agentRef, {
          totalOwed:         currentOwed - paymentData.amount,
          totalPaid:         currentPaid + paymentData.amount,
          lastPayment:       paymentData.paymentDate,
          lastPaymentAmount: paymentData.amount
        });

        await addNotification({
          agentId: paymentData.agentId,
          type:    'payment_received',
          message: `Payment of GHS ${paymentData.amount} received`,
          date:    serverTimestamp(),
          isRead:  false
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
    // NOTE: No orderBy on filtered query — avoids composite index requirement.
    let q;
    if (agentId) {
      q = query(collection(db, 'payments'), where('agentId', '==', agentId));
    } else {
      q = query(collection(db, 'payments'), orderBy('paymentDate', 'desc'));
    }
    const querySnapshot = await getDocs(q);
    const payments = [];
    querySnapshot.forEach((doc) => {
      payments.push({ id: doc.id, ...doc.data() });
    });
    if (agentId) {
      payments.sort((a, b) => {
        const da = a.paymentDate?.toDate ? a.paymentDate.toDate() : new Date(a.paymentDate || 0);
        const db2 = b.paymentDate?.toDate ? b.paymentDate.toDate() : new Date(b.paymentDate || 0);
        return db2 - da;
      });
    }
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


console.log('✅ Firestore database module loaded (v2.2)');