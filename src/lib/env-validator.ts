// src/lib/env-validator.ts
// Environment variable validation utility

type EnvVarType = 'string' | 'number' | 'boolean' | 'url';

interface EnvVarConfig {
  name: string;
  type: EnvVarType;
  required: boolean;
  defaultValue?: string | number | boolean;
  description?: string;
}

class EnvValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvValidationError';
  }
}

/**
 * Validate environment variables
 */
export function validateEnvVars(config: EnvVarConfig[]): void {
  const errors: string[] = [];
  
  for (const { name, type, required, defaultValue, description } of config) {
    const value = process.env[name];
    
    // Check if required variable is missing
    if (required && (value === undefined || value === '')) {
      errors.push(`Missing required environment variable: ${name}${description ? ` (${description})` : ''}`);
      continue;
    }
    
    // Skip validation if value is not set and not required
    if (value === undefined || value === '') {
      continue;
    }
    
    // Type validation
    switch (type) {
      case 'number':
        if (isNaN(Number(value))) {
          errors.push(`Environment variable ${name} must be a number${description ? ` (${description})` : ''}`);
        }
        break;
        
      case 'boolean':
        if (value !== 'true' && value !== 'false') {
          errors.push(`Environment variable ${name} must be 'true' or 'false'${description ? ` (${description})` : ''}`);
        }
        break;
        
      case 'url':
        try {
          new URL(value);
        } catch {
          errors.push(`Environment variable ${name} must be a valid URL${description ? ` (${description})` : ''}`);
        }
        break;
        
      case 'string':
        // String validation - just check if it's not empty when required
        if (required && value.trim() === '') {
          errors.push(`Environment variable ${name} must not be empty${description ? ` (${description})` : ''}`);
        }
        break;
    }
  }
  
  if (errors.length > 0) {
    throw new EnvValidationError(`Environment validation failed:\n${errors.join('\n')}`);
  }
}

/**
 * Get environment variable with type conversion
 */
export function getEnvVar(name: string, type: EnvVarType = 'string', defaultValue?: string | number | boolean): any {
  const value = process.env[name];
  
  if (value === undefined || value === '') {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    return undefined;
  }
  
  switch (type) {
    case 'number':
      return Number(value);
    case 'boolean':
      return value === 'true';
    case 'url':
      return new URL(value);
    default:
      return value;
  }
}

/**
 * Initialize and validate environment variables
 */
export function initEnv(): void {
  const envConfig: EnvVarConfig[] = [
    // Database
    { name: 'DATABASE_URL', type: 'url', required: true, description: 'Database connection URL' },
    { name: 'TURSO_CONNECTION_URL', type: 'url', required: true, description: 'Turso database connection URL' },
    { name: 'TURSO_AUTH_TOKEN', type: 'string', required: true, description: 'Turso database authentication token' },
    
    // Supabase
    { name: 'SUPABASE_URL', type: 'url', required: true, description: 'Supabase project URL' },
    { name: 'SUPABASE_SERVICE_KEY', type: 'string', required: true, description: 'Supabase service role key' },
    
    // Security
    { name: 'APP_SECRET', type: 'string', required: true, description: 'Application secret for JWT signing' },
    { name: 'SESSION_MAX_AGE', type: 'number', required: false, defaultValue: 604800, description: 'Session token max age in seconds (default: 7 days)' },
    { name: 'REFRESH_TOKEN_MAX_AGE', type: 'number', required: false, defaultValue: 2592000, description: 'Refresh token max age in seconds (default: 30 days)' },
    
    // Rate limiting
    { name: 'RATE_LIMIT_WINDOW', type: 'number', required: false, defaultValue: 900, description: 'Rate limit window in seconds (default: 15 minutes)' },
    { name: 'RATE_LIMIT_MAX', type: 'number', required: false, defaultValue: 100, description: 'Max requests per window (default: 100)' },
    
    // Feature flags
    { name: 'FEATURE_FINANCE', type: 'boolean', required: false, defaultValue: false },
    { name: 'FEATURE_MEDIA_ANALYZER', type: 'boolean', required: false, defaultValue: true },
    { name: 'FEATURE_FACE_RECOGNITION', type: 'boolean', required: false, defaultValue: true },
    
    // External APIs
    { name: 'ENABLE_EXTERNAL_APIS', type: 'boolean', required: false, defaultValue: false },
    
    // File uploads
    { name: 'MAX_UPLOAD_SIZE', type: 'number', required: false, defaultValue: 10485760, description: 'Max upload size in bytes (default: 10MB)' },
  ];
  
  validateEnvVars(envConfig);
}

// Run validation immediately when module is imported
try {
  initEnv();
} catch (error) {
  if (error instanceof EnvValidationError) {
    console.error('❌ Environment validation failed:');
    console.error(error.message);
    console.error('\nPlease check your environment variables and try again.');
    if (process.env.NODE_ENV !== 'production') {
      console.error('\n💡 Tip: Copy .env.example to .env and fill in the required values');
    }
    process.exit(1);
  }
  throw error;
}