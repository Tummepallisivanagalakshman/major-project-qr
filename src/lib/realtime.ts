import insforge from './insforge';

/**
 * InsForge Realtime Wrapper
 * Replaces Socket.IO implementation
 */

export const subscribeToMealScans = (callback: (payload: any) => void) => {
  // Subscribe to 'meal_scanned' channel
  const subscription = insforge.realtime
    .subscribe('meal_scans', (payload) => {
      callback(payload);
    });

  return () => {
    insforge.realtime.disconnect();
  };
};

export const subscribeToPayments = (callback: (payload: any) => void) => {
  const subscription = insforge.realtime
    .subscribe('payments', (payload) => {
      callback(payload);
    });

  return () => {
    insforge.realtime.disconnect();
  };
};

export const broadcastMealScan = async (payload: any) => {
  return await insforge.realtime.publish('meal_scans', 'scan_event', payload);
};

export const broadcastPayment = async (payload: any) => {
  return await insforge.realtime.publish('payments', 'payment_event', payload);
};
