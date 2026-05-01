// =======================
// FIRESTORE IMPORTS
// =======================
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
  runTransaction
} from 'firebase/firestore';


// =======================
// RETURN STOCK (PRODUCTION READY - SINGLE VERSION)
// =======================
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
      // ========== 1. FETCH DISTRIBUTION ==========
      const distRef = doc(db, 'distributions', returnData.distributionId);
      const distSnap = await transaction.get(distRef);

      if (!distSnap.exists()) {
        throw new Error('Distribution record not found');
      }

      const distribution = distSnap.data();

      if (distribution.agentId !== returnData.agentId) {
        throw new Error('Distribution does not belong to this agent');
      }

      // ========== 2. NORMALIZE ITEMS (immutably) ==========
      let items = [];

      if (distribution.items?.length) {
        // Deep copy - no shared references
        items = distribution.items.map(item => ({
          ...item,
          returnedQuantity: item.returnedQuantity || 0
        }));
      } else {
        // Convert flat structure to items array
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

      // ========== 3. VALIDATE RETURN QUANTITY ==========
      const totalDistributed = items.reduce((sum, item) => sum + item.quantity, 0);
      const totalReturnedSoFar = items.reduce((sum, item) => sum + (item.returnedQuantity || 0), 0);
      const maxReturnable = totalDistributed - totalReturnedSoFar;

      if (maxReturnable <= 0) {
        throw new Error('All items have already been returned');
      }

      if (returnQuantity > maxReturnable) {
        throw new Error(`Cannot return more than ${maxReturnable} units (already returned: ${totalReturnedSoFar})`);
      }

      // ========== 4. PROCESS RETURNS ==========
      let remainingToReturn = returnQuantity;
      let totalRefundCents = 0;
      const transactionTimestamp = Timestamp.now();
      
      // Create new arrays (immutable pattern)
      const updatedItems = [];
      const returnedBreakdown = [];

      for (let i = 0; i < items.length && remainingToReturn > 0; i++) {
        const originalItem = items[i];
        const alreadyReturned = originalItem.returnedQuantity || 0;
        const available = originalItem.quantity - alreadyReturned;
        const returnQty = Math.min(remainingToReturn, available);
        
        // Create updated version of this item
        let updatedItem = { ...originalItem };

        if (returnQty > 0) {
          // Validate warehouseStockId exists
          if (!originalItem.warehouseStockId) {
            throw new Error(`Missing warehouseStockId for item: ${originalItem.hairBrand || 'Unknown'}`);
          }

          // Update warehouse stock
          const warehouseRef = doc(db, 'warehouse', originalItem.warehouseStockId);
          const warehouseSnap = await transaction.get(warehouseRef);

          if (!warehouseSnap.exists()) {
            throw new Error(`Warehouse stock not found: ${originalItem.warehouseStockId}`);
          }

          const warehouseData = warehouseSnap.data();
          
          // ✅ Safe defaults for warehouse fields
          const currentDistributed = warehouseData.distributedQuantity || 0;
          const currentAvailable = warehouseData.availableQuantity || 0;
          const importPrice = warehouseData.importPrice || 0;

          // Validate distributed quantity
          if (currentDistributed < returnQty) {
            throw new Error(
              `Stock mismatch for ${originalItem.hairBrand}. ` +
              `Distributed: ${currentDistributed}, Trying to return: ${returnQty}`
            );
          }

          // ✅ Safe math with defaults
          const newAvailable = currentAvailable + returnQty;
          const newDistributed = currentDistributed - returnQty;

          transaction.update(warehouseRef, {
            availableQuantity: newAvailable,
            distributedQuantity: newDistributed,
            availableTotalValue: newAvailable * importPrice,
            status: newAvailable === 0 ? 'out' : newAvailable < 10 ? 'low' : 'available',
            lastUpdated: serverTimestamp()
          });

          // Update item (immutably - create new object)
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

      // Safety check
      if (remainingToReturn > 0) {
        throw new Error(`Failed to process all units. ${remainingToReturn} units remaining.`);
      }

      // ========== 5. UPDATE AGENT ==========
      const agentRef = doc(db, 'agents', returnData.agentId);
      const agentSnap = await transaction.get(agentRef);

      if (!agentSnap.exists()) {
        throw new Error('Agent not found');
      }

      const agentData = agentSnap.data();
      const totalRefund = totalRefundCents / 100;
      
      // ✅ Safe defaults for agent fields
      const currentOwedCents = Math.round((agentData.totalOwed || 0) * 100);
      const newOwedCents = Math.max(0, currentOwedCents - totalRefundCents);
      const newOwed = newOwedCents / 100;

      transaction.update(agentRef, {
        totalOwed: newOwed,
        lastUpdated: serverTimestamp(),
        lastReturnDate: serverTimestamp(),
        lastReturnAmount: totalRefund,
        totalReturned: (agentData.totalReturned || 0) + returnQuantity,
        totalRefunded: (agentData.totalRefunded || 0) + totalRefund
      });

      // ========== 6. UPDATE DISTRIBUTION ==========
      const newTotalReturned = totalReturnedSoFar + returnQuantity;
      const isFullyReturned = newTotalReturned >= totalDistributed;

      transaction.update(distRef, {
        items: updatedItems, // ✅ Immutably created
        returnedQuantity: newTotalReturned,
        status: isFullyReturned ? 'fully_returned' : 'partially_returned',
        lastUpdated: serverTimestamp(),
        lastReturnDate: serverTimestamp(),
        lastReturnedBy: returnData.recordedBy || 'admin',
        lastReturnQuantity: returnQuantity,
        lastReturnAmount: totalRefund
      });

      // ========== 7. CREATE RETURN RECORD ==========
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


// =======================
// GET DISTRIBUTIONS (WITH COMPUTED FIELDS)
// =======================
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
      
      // ✅ Compute maxReturnable from items or flat structure
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


// =======================
// GET STOCK RETURNS
// =======================
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