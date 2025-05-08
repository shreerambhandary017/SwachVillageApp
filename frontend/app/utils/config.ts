// API configuration with environment support
const DEV_IP = '10.0.2.2'; // Use this for Android emulator to connect to host machine
const LOCALHOST = 'localhost';
const FALLBACK_IP = '192.168.1.100'; // Fallback IP if others fail

// Determine the appropriate base URL based on environment
const getBaseUrl = () => {
  // For development, try using localhost first
  return `http://${LOCALHOST}:5000`;
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  API_URL: `${getBaseUrl()}/api`,
};

// This tells Expo Router to ignore this file as a route
export default function ConfigPage() {
  return null;
}
