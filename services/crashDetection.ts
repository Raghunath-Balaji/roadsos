import { Accelerometer } from 'expo-sensors';
import { Platform } from 'react-native';

/**
 * Crash Detection Service
 * Uses the device accelerometer to monitor for sudden impacts.
 */

const CRASH_THRESHOLD = 4.0; // G-force threshold (4G is typical for a car crash)
const UPDATE_INTERVAL = 100; // ms

let subscription: any = null;
let onCrashDetectedCallback: (() => void) | null = null;

/**
 * Starts monitoring the accelerometer for sudden surges.
 */
export const startCrashDetection = (onCrash: () => void) => {
  onCrashDetectedCallback = onCrash;
  
  Accelerometer.setUpdateInterval(UPDATE_INTERVAL);
  
  subscription = Accelerometer.addListener(accelerometerData => {
    const { x, y, z } = accelerometerData;
    
    // Calculate total G-force
    // Accelerometer values are in Gs
    const totalForce = Math.sqrt(x * x + y * y + z * z);
    
    if (totalForce >= CRASH_THRESHOLD) {
      console.log(`[CrashDetection] Possible crash detected! Force: ${totalForce.toFixed(2)}G`);
      if (onCrashDetectedCallback) {
        onCrashDetectedCallback();
      }
    }
  });
};

/**
 * Stops the accelerometer monitoring.
 */
export const stopCrashDetection = () => {
  if (subscription) {
    subscription.remove();
    subscription = null;
  }
  onCrashDetectedCallback = null;
};

/**
 * Returns true if monitoring is currently active.
 */
export const isMonitoring = () => {
  return subscription !== null;
};
