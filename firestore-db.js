// Firestore Database Operations
// Updated with new pricing structure and Product Catalog support
// Version 3.0 - CLEANED (No duplicates)

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
  runTransaction  // ✅ Added for returnStock
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

// ============================================
// ✅ STOCK RETURNS (ONLY ONE CORRECT VERSION)
// ============================================

export async function returnStock(returnData) {
  // Validation
  if (!returnData?.distributionId) {
    return { success: false, error: 'Distribution ID is required' };
  }
  if (!returnData?.agentId) {
    return { success: false, error: 'Agent ID is required' };
  }

  const returnQuantity = parseInt(returnData.returnQuantity, 10);
  if (isNaN(returnQuantity) || returnQuantity <= 0) {
    return { success: false, error: 'Valid return quantity is required' };
  }

  try {
    const result = await runTransaction(db, async (transaction) => {
      // ========== PHASE 1: READ ALL DOCUMENTS FIRST ==========
      
      // 1. Read distribution
      const distRef = doc(db, 'distributions', returnData.distributionId);
      const distSnap = await transaction.get(distRef);

      if (!distSnap.exists()) {
        throw new Error('Distribution record not found');
      }

      const distribution = distSnap.data();

      if (distribution.agentId !== returnData.agentId) {
        throw new Error('Distribution does not belong to this agent');
      }

      // 2. Normalize items from distribution
      let items = [];

      if (distribution.items?.length) {
        items = distribution.items.map(item => ({
          ...item,
          returnedQuantity: item.returnedQuantity || 0
        }));
      } else {
        items = [{
          warehouseStockId: distribution.warehouseStockId || returnData.warehouseStockId,
          hairBrand: distribution.hairBrand || returnData.hairBrand,
          color: distribution.color || returnData.color,
          length: distribution.length || returnData.length,
          quantity: distribution.quantity || 0,
          unitAgentPrice: distribution.unitAgentPrice || returnData.unitAgentPrice,
          unitPrice: distribution.unitSellingPrice,
          returnedQuantity: distribution.returnedQuantity || 0,
          importPrice: distribution.importPrice
        }];
      }

      // 3. Validate return quantity
      const totalDistributed = items.reduce((sum, item) => sum + item.quantity, 0);
      const totalReturnedSoFar = items.reduce((sum, item) => sum + (item.returnedQuantity || 0), 0);
      const maxReturnable = totalDistributed - totalReturnedSoFar;

      if (maxReturnable <= 0) {
        throw new Error('All items have already been returned');
      }

      if (returnQuantity > maxReturnable) {
        throw new Error(`Cannot return more than ${maxReturnable} units (already returned: ${totalReturnedSoFar})`);
      }

      // 4. READ ALL warehouse documents (collect unique warehouseStockIds)
      const warehouseRefs = [];
      const warehouseItemsMap = new Map(); // Store item info keyed by warehouseStockId
      
      for (const item of items) {
        if (!warehouseRefs.find(ref => ref.id === item.warehouseStockId)) {
          const warehouseRef = doc(db, 'warehouse', item.warehouseStockId);
          warehouseRefs.push(warehouseRef);
          warehouseItemsMap.set(item.warehouseStockId, {
            item: item,
            originalReturned: item.returnedQuantity || 0
          });
        }
      }
      
      // Execute all warehouse reads
      const warehouseSnaps = await Promise.all(
        warehouseRefs.map(ref => transaction.get(ref))
      );
      
      // Store warehouse data
      const warehouseDataMap = new Map();
      for (let i = 0; i < warehouseRefs.length; i++) {
        if (!warehouseSnaps[i].exists()) {
          throw new Error(`Warehouse stock not found: ${warehouseRefs[i].id}`);
        }
        warehouseDataMap.set(warehouseRefs[i].id, warehouseSnaps[i].data());
      }

      // 5. READ agent document
      const agentRef = doc(db, 'agents', returnData.agentId);
      const agentSnap = await transaction.get(agentRef);

      if (!agentSnap.exists()) {
        throw new Error('Agent not found');
      }
      const agentData = agentSnap.data();

      // ========== PHASE 2: PROCESS CALCULATIONS (NO MORE READS) ==========
      
      let remainingToReturn = returnQuantity;
      let totalRefundCents = 0;
      const transactionTimestamp = Timestamp.now();
      const updatedItems = [];
      const returnedBreakdown = [];
      const warehouseUpdates = new Map(); // Store updates keyed by warehouseRef

      for (let i = 0; i < items.length && remainingToReturn > 0; i++) {
        const originalItem = items[i];
        const alreadyReturned = originalItem.returnedQuantity || 0;
        const available = originalItem.quantity - alreadyReturned;
        const returnQty = Math.min(remainingToReturn, available);
        
        let updatedItem = { ...originalItem };

        if (returnQty > 0) {
          if (!originalItem.warehouseStockId) {
            throw new Error(`Missing warehouseStockId for item: ${originalItem.hairBrand || 'Unknown'}`);
          }

          // Get warehouse data from our pre-fetched map
          const warehouseData = warehouseDataMap.get(originalItem.warehouseStockId);
          if (!warehouseData) {
            throw new Error(`Warehouse data missing: ${originalItem.warehouseStockId}`);
          }
          
          const currentDistributed = warehouseData.distributedQuantity || 0;
          const currentAvailable = warehouseData.availableQuantity || 0;
          const importPrice = warehouseData.importPrice || 0;

          if (currentDistributed < returnQty) {
            throw new Error(`Stock mismatch for ${originalItem.hairBrand}`);
          }

          // Calculate new values
          const newAvailable = currentAvailable + returnQty;
          const newDistributed = currentDistributed - returnQty;

          // Store warehouse update for later
          warehouseUpdates.set(originalItem.warehouseStockId, {
            availableQuantity: newAvailable,
            distributedQuantity: newDistributed,
            availableTotalValue: newAvailable * importPrice,
            status: newAvailable === 0 ? 'out' : newAvailable < 10 ? 'low' : 'available',
            lastUpdated: serverTimestamp()
          });

          // Update item
          updatedItem = {
            ...originalItem,
            returnedQuantity: alreadyReturned + returnQty
          };

          // Calculate refund with integer math
          const unitPriceCents = Math.round((originalItem.unitAgentPrice || 0) * 100);
          const itemRefundCents = returnQty * unitPriceCents;
          totalRefundCents += itemRefundCents;

          // Track breakdown
          returnedBreakdown.push({
            warehouseStockId: originalItem.warehouseStockId,
            hairBrand: originalItem.hairBrand,
            color: originalItem.color,
            length: originalItem.length,
            quantity: returnQty,
            unitAgentPrice: originalItem.unitAgentPrice,
            refundAmount: itemRefundCents / 100,
            refundAmountCents: itemRefundCents,
            returnedAt: transactionTimestamp
          });

          remainingToReturn -= returnQty;
        }

        updatedItems.push(updatedItem);
      }

      if (remainingToReturn > 0) {
        throw new Error(`Failed to process all units. ${remainingToReturn} units remaining.`);
      }

      const totalRefund = totalRefundCents / 100;
      const currentOwedCents = Math.round((agentData.totalOwed || 0) * 100);
      const newOwedCents = Math.max(0, currentOwedCents - totalRefundCents);
      const newOwed = newOwedCents / 100;

      const newTotalReturned = totalReturnedSoFar + returnQuantity;
      const isFullyReturned = newTotalReturned >= totalDistributed;

      // ========== PHASE 3: EXECUTE ALL WRITES ==========
      
      // 1. Update all warehouse documents
      for (const [stockId, updateData] of warehouseUpdates) {
        const warehouseRef = doc(db, 'warehouse', stockId);
        transaction.update(warehouseRef, updateData);
      }

      // 2. Update agent document
      transaction.update(agentRef, {
        totalOwed: newOwed,
        lastUpdated: serverTimestamp(),
        lastReturnDate: serverTimestamp(),
        lastReturnAmount: totalRefund,
        totalReturned: (agentData.totalReturned || 0) + returnQuantity,
        totalRefunded: (agentData.totalRefunded || 0) + totalRefund
      });

      // 3. Update distribution document
      transaction.update(distRef, {
        items: updatedItems,
        returnedQuantity: newTotalReturned,
        status: isFullyReturned ? 'fully_returned' : 'partially_returned',
        lastUpdated: serverTimestamp(),
        lastReturnDate: serverTimestamp(),
        lastReturnedBy: returnData.recordedBy || 'admin',
        lastReturnQuantity: returnQuantity,
        lastReturnAmount: totalRefund
      });

      // 4. Create return record document
      const returnRef = doc(collection(db, 'stockReturns'));
      transaction.set(returnRef, {
        agentId: returnData.agentId,
        agentName: returnData.agentName || agentData.name || '',
        distributionId: returnData.distributionId,
        returnQuantity: returnQuantity,
        totalRefund: totalRefund,
        totalRefundCents: totalRefundCents,
        itemsReturned: returnedBreakdown,
        returnDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        recordedBy: returnData.recordedBy || 'admin',
        notes: returnData.notes || ''
      });

      return {
        success: true,
        returnedQuantity: returnQuantity,
        totalRefund: totalRefund,
        isFullyReturned: isFullyReturned,
        itemsProcessed: returnedBreakdown.length
      };
    });

    return result;

  } catch (error) {
    console.error('Return stock error:', error);
    return { 
      success: false, 
      error: error.message,
      code: error.code || 'RETURN_ERROR'
    };
  }
}

// ============================================
// ✅ GET DISTRIBUTIONS (WITH COMPUTED FIELDS)
// ============================================

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
      q = query(
        collection(db, 'distributions'),
        orderBy('distributionDate', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    const distributions = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      
      let maxReturnable = 0;
      let totalQuantity = 0;
      let totalReturned = 0;
      
      if (data.items?.length) {
        totalQuantity = data.items.reduce((sum, i) => sum + (i.quantity || 0), 0);
        totalReturned = data.items.reduce((sum, i) => sum + (i.returnedQuantity || 0), 0);
        maxReturnable = totalQuantity - totalReturned;
      } else {
        totalQuantity = data.quantity || 0;
        totalReturned = data.returnedQuantity || 0;
        maxReturnable = totalQuantity - totalReturned;
      }
      
      distributions.push({
        id: docSnap.id,
        ...data,
        computedTotalQuantity: totalQuantity,
        computedTotalReturned: totalReturned,
        maxReturnable: maxReturnable
      });
    }

    return { success: true, data: distributions };
  } catch (error) {
    console.error('Get distributions error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// ✅ GET STOCK RETURNS
// ============================================

export async function getStockReturns(agentId = null) {
  try {
    let q;
    if (agentId) {
      q = query(
        collection(db, 'stockReturns'),
        where('agentId', '==', agentId),
        orderBy('returnDate', 'desc')
      );
    } else {
      q = query(
        collection(db, 'stockReturns'),
        orderBy('returnDate', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    const returns = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { success: true, data: returns };
  } catch (error) {
    console.error('Get stock returns error:', error);
    return { success: false, error: error.message };
  }
}

console.log('✅ Firestore database module loaded (v3.0 - CLEANED)');