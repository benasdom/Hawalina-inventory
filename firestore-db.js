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
  serverTimestamp,
  runTransaction  // Added this
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

/**
 * Helper function for logging (non-blocking)
 */
async function logDistributionActivity(logData) {
  try {
    const activityRef = collection(db, 'activityLogs');
    await addDoc(activityRef, {
      ...logData,
      timestamp: serverTimestamp(),
      environment: 'production'
    });
  } catch (error) {
    // Silent fail - don't break main flow
    console.error('Failed to log activity:', error);
  }
}

/**
 * Adds a new distribution with proper inventory and agent balance updates
 * Uses Firestore transactions for data consistency
 */
export async function addDistribution(distributionData) {
  // Input validation
  if (!distributionData) {
    return { success: false, error: 'Distribution data is required' };
  }
  
  if (!distributionData.agentId) {
    return { success: false, error: 'Agent ID is required' };
  }
  
  if (!distributionData.items || !Array.isArray(distributionData.items) || distributionData.items.length === 0) {
    return { success: false, error: 'At least one item is required for distribution' };
  }
  
  // Validate each item
  for (const item of distributionData.items) {
    if (!item.warehouseStockId) {
      return { success: false, error: 'Warehouse stock ID is required for each item' };
    }
    if (!item.quantity || item.quantity <= 0) {
      return { success: false, error: 'Valid quantity is required for each item' };
    }
    if (item.quantity > (item.availableQuantity || 0)) {
      return { 
        success: false, 
        error: `Insufficient stock for ${item.hairBrand || 'item'}. Available: ${item.availableQuantity || 0}, Requested: ${item.quantity}` 
      };
    }
  }
  
  try {
    // Use transaction for consistency across multiple documents
    const result = await runTransaction(db, async (transaction) => {
      // 1. Verify and update warehouse stock for all items
      const stockUpdates = [];
      for (const item of distributionData.items) {
        const stockRef = doc(db, 'warehouse', item.warehouseStockId);
        const stockDoc = await transaction.get(stockRef);
        
        if (!stockDoc.exists()) {
          throw new Error(`Warehouse stock not found for ID: ${item.warehouseStockId}`);
        }
        
        const currentData = stockDoc.data();
        const availableQuantity = currentData.availableQuantity || 0;
        
        if (availableQuantity < item.quantity) {
          throw new Error(`Insufficient stock for ${item.hairBrand || 'item'}. Available: ${availableQuantity}, Required: ${item.quantity}`);
        }
        
        const newAvailable = availableQuantity - item.quantity;
        const newDistributed = (currentData.distributedQuantity || 0) + item.quantity;
        
        transaction.update(stockRef, {
          availableQuantity: newAvailable,
          distributedQuantity: newDistributed,
          availableTotalValue: newAvailable * (currentData.importPrice || 0),
          status: newAvailable === 0 ? 'out' : newAvailable < 10 ? 'low' : 'available',
          lastUpdated: serverTimestamp(),
        });
        
        stockUpdates.push({
          ...item,
          importPrice: currentData.importPrice,
          unitPrice: item.unitAgentPrice || currentData.unitPrice
        });
      }
      
      // 2. Calculate totals
      const totalQuantity = stockUpdates.reduce((sum, item) => sum + item.quantity, 0);
      const totalAgentPrice = stockUpdates.reduce((sum, item) => sum + (item.unitAgentPrice * item.quantity), 0);
      
      // 3. Update agent's total owed
      const agentRef = doc(db, 'agents', distributionData.agentId);
      const agentDoc = await transaction.get(agentRef);
      
      if (!agentDoc.exists()) {
        throw new Error(`Agent not found with ID: ${distributionData.agentId}`);
      }
      
      const currentOwed = agentDoc.data().totalOwed || 0;
      transaction.update(agentRef, {
        totalOwed: currentOwed + totalAgentPrice,
        lastUpdated: serverTimestamp(),
      });
      
      // 4. Create distribution record
      const distributionRef = doc(collection(db, 'distributions')); // Create a document reference
      const distributionDoc = {
        ...distributionData,
        agentId: distributionData.agentId,
        agentName: distributionData.agentName || agentDoc.data().name || '',
        items: stockUpdates.map(item => ({
          warehouseStockId: item.warehouseStockId,
          hairBrand: item.hairBrand,
          color: item.color,
          length: item.length,
          quantity: item.quantity,
          unitAgentPrice: item.unitAgentPrice,
          unitPrice: item.unitPrice,
          importPrice: item.importPrice,
          returnedQuantity: 0,
        })),
        totalQuantity,
        totalAgentPrice,
        distributionDate: distributionData.distributionDate || serverTimestamp(),
        status: 'completed',
        returnedQuantity: 0,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        createdBy: distributionData.createdBy || 'system',
        notes: distributionData.notes || '',
      };
      
      transaction.set(distributionRef, distributionDoc);
      
      return { id: distributionRef.id, totalAgentPrice };
    });
    
    // Log successful distribution (async, don't await)
    logDistributionActivity({
      action: 'DISTRIBUTION_CREATED',
      distributionId: result.id,
      agentId: distributionData.agentId,
      totalAmount: result.totalAgentPrice,
      itemsCount: distributionData.items.length
    }).catch(console.error);
    
    return { 
      success: true, 
      id: result.id,
      totalAgentPrice: result.totalAgentPrice,
      message: 'Distribution completed successfully'
    };
    
  } catch (error) {
    console.error('Error adding distribution:', error);
    return { 
      success: false, 
      error: error.message,
      code: error.code || 'DISTRIBUTION_ERROR'
    };
  }
}

export async function getDistributions(agentId = null) {
  try {
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
    // Sort descending
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
// STOCK RETURNS
// ============================================

/**
 * Returns stock from agent to warehouse with proper validation and updates
 * Uses Firestore transactions for data consistency
 */
export async function returnStock(returnData) {
  // Input validation
  if (!returnData) {
    return { success: false, error: 'Return data is required' };
  }
  
  if (!returnData.distributionId) {
    return { success: false, error: 'Distribution ID is required' };
  }
  
  if (!returnData.agentId) {
    return { success: false, error: 'Agent ID is required' };
  }
  
  if (!returnData.returnQuantity || returnData.returnQuantity <= 0) {
    return { success: false, error: 'Valid return quantity is required' };
  }
  
  try {
    const result = await runTransaction(db, async (transaction) => {
      // 1. Get and validate distribution record
      const distRef = doc(db, 'distributions', returnData.distributionId);
      const distSnap = await transaction.get(distRef);
      
      if (!distSnap.exists()) {
        throw new Error('Distribution record not found');
      }
      
      const distribution = distSnap.data();
      
      // Verify agent matches
      if (distribution.agentId !== returnData.agentId) {
        throw new Error('Distribution does not belong to this agent');
      }
      
      // Check if already fully returned
      const totalReturned = distribution.returnedQuantity || 0;
      const totalDistributed = distribution.totalQuantity || 
        distribution.items.reduce((sum, item) => sum + item.quantity, 0);
      const maxReturnable = totalDistributed - totalReturned;
      
      if (maxReturnable <= 0) {
        throw new Error('All items from this distribution have already been returned');
      }
      
      if (returnData.returnQuantity > maxReturnable) {
        throw new Error(`Cannot return more than ${maxReturnable} units (already returned: ${totalReturned})`);
      }
      
      // 2. Calculate returns per item
      let remainingToReturn = returnData.returnQuantity;
      let totalRefund = 0;
      const updatedItems = [...distribution.items];
      
      // Proportional return across all items
      const returnRatio = returnData.returnQuantity / totalDistributed;
      
      for (let i = 0; i < updatedItems.length; i++) {
        if (remainingToReturn <= 0) break;
        
        const item = updatedItems[i];
        const itemReturned = item.returnedQuantity || 0;
        const itemAvailable = item.quantity - itemReturned;
        let itemReturnQty = Math.floor(itemAvailable * returnRatio);
        
        // Ensure we don't exceed remaining
        itemReturnQty = Math.min(itemReturnQty, remainingToReturn);
        itemReturnQty = Math.min(itemReturnQty, itemAvailable);
        
        if (itemReturnQty > 0) {
          // Update warehouse stock
          const warehouseRef = doc(db, 'warehouse', item.warehouseStockId);
          const warehouseSnap = await transaction.get(warehouseRef);
          
          if (warehouseSnap.exists()) {
            const wData = warehouseSnap.data();
            const newAvailable = (wData.availableQuantity || 0) + itemReturnQty;
            const newDistributed = Math.max(0, (wData.distributedQuantity || 0) - itemReturnQty);
            
            transaction.update(warehouseRef, {
              availableQuantity: newAvailable,
              distributedQuantity: newDistributed,
              availableTotalValue: newAvailable * (wData.importPrice || 0),
              status: newAvailable === 0 ? 'out' : newAvailable < 10 ? 'low' : 'available',
              lastUpdated: serverTimestamp(),
            });
          }
          
          // Update item in distribution
          item.returnedQuantity = (item.returnedQuantity || 0) + itemReturnQty;
          const itemRefund = itemReturnQty * (item.unitAgentPrice || 0);
          totalRefund += itemRefund;
          remainingToReturn -= itemReturnQty;
          
          updatedItems[i] = item;
        }
      }
      
      // Handle any remaining quantity (due to rounding)
      if (remainingToReturn > 0 && updatedItems.length > 0) {
        const lastItem = updatedItems[updatedItems.length - 1];
        const lastItemAvailable = lastItem.quantity - (lastItem.returnedQuantity || 0);
        const additionalReturn = Math.min(remainingToReturn, lastItemAvailable);
        
        if (additionalReturn > 0) {
          const warehouseRef = doc(db, 'warehouse', lastItem.warehouseStockId);
          const warehouseSnap = await transaction.get(warehouseRef);
          
          if (warehouseSnap.exists()) {
            const wData = warehouseSnap.data();
            const newAvailable = (wData.availableQuantity || 0) + additionalReturn;
            const newDistributed = Math.max(0, (wData.distributedQuantity || 0) - additionalReturn);
            
            transaction.update(warehouseRef, {
              availableQuantity: newAvailable,
              distributedQuantity: newDistributed,
              availableTotalValue: newAvailable * (wData.importPrice || 0),
              lastUpdated: serverTimestamp(),
            });
          }
          
          lastItem.returnedQuantity = (lastItem.returnedQuantity || 0) + additionalReturn;
          totalRefund += additionalReturn * (lastItem.unitAgentPrice || 0);
          updatedItems[updatedItems.length - 1] = lastItem;
        }
      }
      
      // 3. Update agent's total owed
      const agentRef = doc(db, 'agents', returnData.agentId);
      const agentSnap = await transaction.get(agentRef);
      
      if (!agentSnap.exists()) {
        throw new Error(`Agent not found with ID: ${returnData.agentId}`);
      }
      
      const currentOwed = agentSnap.data().totalOwed || 0;
      const newOwed = Math.max(0, currentOwed - totalRefund);
      
      transaction.update(agentRef, {
        totalOwed: newOwed,
        lastUpdated: serverTimestamp(),
      });
      
      // 4. Update distribution record
      const newTotalReturned = (distribution.returnedQuantity || 0) + returnData.returnQuantity;
      const isFullyReturned = newTotalReturned >= totalDistributed;
      
      transaction.update(distRef, {
        items: updatedItems,
        returnedQuantity: newTotalReturned,
        status: isFullyReturned ? 'fully_returned' : 'partially_returned',
        lastUpdated: serverTimestamp(),
      });
      
      // 5. Create return record
      const returnRef = doc(collection(db, 'stockReturns'));
      const returnRecord = {
        agentId: returnData.agentId,
        agentName: returnData.agentName || agentSnap.data().name || '',
        distributionId: returnData.distributionId,
        returnQuantity: returnData.returnQuantity,
        totalRefund,
        returnDate: serverTimestamp(),
        recordedBy: returnData.recordedBy || 'system',
        notes: returnData.notes || '',
        createdAt: serverTimestamp(),
      };
      
      transaction.set(returnRef, returnRecord);
      
      return { 
        totalRefund, 
        newOwed,
        returnedQuantity: returnData.returnQuantity,
        isFullyReturned 
      };
    });
    
    // Log successful return (async)
    logDistributionActivity({
      action: 'STOCK_RETURNED',
      distributionId: returnData.distributionId,
      agentId: returnData.agentId,
      returnQuantity: result.returnedQuantity,
      totalRefund: result.totalRefund,
      newBalance: result.newOwed
    }).catch(console.error);
    
    return { 
      success: true, 
      ...result,
      message: result.isFullyReturned ? 'All items returned successfully' : 'Stock returned successfully'
    };
    
  } catch (error) {
    console.error('Error returning stock:', error);
    return { 
      success: false, 
      error: error.message,
      code: error.code || 'RETURN_ERROR'
    };
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