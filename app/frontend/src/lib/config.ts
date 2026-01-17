// Runtime configuration - SIMPLIFIED (removed blocking /api/config fetch)
console.log('🔧 CONFIG: Initializing configuration module');

// Default configuration - no external fetch needed
const defaultConfig = {
  API_BASE_URL: 'http://127.0.0.1:8000',
};

console.log('🔧 CONFIG: Using default configuration:', defaultConfig);

// Get current configuration
export function getConfig() {
  console.log('🔧 CONFIG: getConfig() called');
  
  // Try Vite environment variables first (for local development)
  if (import.meta.env.VITE_API_BASE_URL) {
    const viteConfig = {
      API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    };
    console.log('🔧 CONFIG: Using Vite environment config:', viteConfig);
    return viteConfig;
  }
  
  // Fall back to default
  console.log('🔧 CONFIG: Using default config');
  return defaultConfig;
}

// Dynamic API_BASE_URL getter
export function getAPIBaseURL(): string {
  const url = getConfig().API_BASE_URL;
  console.log('🔧 CONFIG: getAPIBaseURL() returning:', url);
  return url;
}

export const config = {
  get API_BASE_URL() {
    return getAPIBaseURL();
  },
};

console.log('🔧 CONFIG: Configuration module loaded successfully');