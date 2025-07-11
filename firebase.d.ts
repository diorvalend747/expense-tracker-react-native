// This file declares types for the Firebase SDK specifically for React Native.
// It helps TypeScript recognize 'getReactNativePersistence' which might not be
// directly exported in the default 'firebase/auth' module's type declarations
// due to different platform bundles.

// Import necessary types from Firebase Auth
import { Persistence, ReactNativeAsyncStorage } from 'firebase/auth';

// Extend the 'firebase/auth' module to declare 'getReactNativePersistence'
// as an exported function. This tells TypeScript that this function exists
// within the 'firebase/auth' module.
declare module 'firebase/auth' {
  /**
   * Returns a Persistence instance for React Native.
   * This is used with `initializeAuth` to specify how authentication state
   * should be stored (e.g., using AsyncStorage).
   * @param storage An instance of `ReactNativeAsyncStorage` (typically from `@react-native-async-storage/async-storage`).
   * @returns A `Persistence` instance.
   */
  export function getReactNativePersistence(
    storage: ReactNativeAsyncStorage
  ): Persistence;
}
