// src/lib/config.ts
// Configuration and feature flags for the application

export const config = {
  // Feature flags
  FEATURE_FINANCE: process.env.FEATURE_FINANCE?.toLowerCase() !== 'false', // Default: true (enabled)
  FEATURE_MEDIA_ANALYZER: process.env.FEATURE_MEDIA_ANALYZER?.toLowerCase() !== 'false', // Default: true (enabled)
  FEATURE_FACE_RECOGNITION: process.env.FEATURE_FACE_RECOGNITION?.toLowerCase() !== 'false', // Default: true (enabled)
  
  // External API settings
  ENABLE_EXTERNAL_APIS: process.env.ENABLE_EXTERNAL_APIS?.toLowerCase() === 'true', // Default: false (disabled)
  
  // Media analyzer settings
  OPENCV_ENABLED: process.env.OPENCV_ENABLED?.toLowerCase() === 'true', // Default: false (disabled)
  MEDIA_UPLOAD_RETENTION_DAYS: parseInt(process.env.MEDIA_UPLOAD_RETENTION_DAYS || '30', 10),
  
  // Face recognition settings
  FACE_PYTHON_SERVICE: process.env.FACE_PYTHON_SERVICE?.toLowerCase() !== 'false', // Default: true (enabled)
  VIP_MATCH_THRESHOLD: parseFloat(process.env.VIP_MATCH_THRESHOLD || '0.65'),
  
  // Security settings
  APP_SECRET: process.env.APP_SECRET || 'fallback-secret-key-for-dev-only',
  
  // File upload settings
  MAX_UPLOAD_SIZE: parseInt(process.env.MAX_UPLOAD_SIZE || '10485760', 10), // 10MB default
};

export default config;
