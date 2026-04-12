import insforge from './insforge';

export const subscribeToMealScans = (callback: (payload: any) => void) => {
  insforge.realtime.connect().then(() => {
    insforge.realtime.subscribe('meal_scans');
  });

  const handler = (payload: any) => callback(payload);
  insforge.realtime.on('scan_event', handler);

  return () => {
    insforge.realtime.off('scan_event', handler);
    insforge.realtime.unsubscribe('meal_scans');
  };
};

export const subscribeToPayments = (callback: (payload: any) => void) => {
  insforge.realtime.connect().then(() => {
    insforge.realtime.subscribe('payments');
  });

  const handler = (payload: any) => callback(payload);
  insforge.realtime.on('payment_event', handler);

  return () => {
    insforge.realtime.off('payment_event', handler);
    insforge.realtime.unsubscribe('payments');
  };
};

export const broadcastMealScan = async (payload: any) => {
  return await insforge.realtime.publish('meal_scans', 'scan_event', payload);
};

export const broadcastPayment = async (payload: any) => {
  return await insforge.realtime.publish('payments', 'payment_event', payload);
};
