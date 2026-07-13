// src/lib/encryption.ts
// Utility functions for encrypting/decrypting sensitive data

import { config } from '@/lib/config';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

/**
 * Encrypts data using AES-256-GCM with PBKDF2 key derivation
 * @param data The data to encrypt
 * @returns Encrypted data as base64 string
 */
export function encryptData(data: string): string {
  try {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = crypto.pbkdf2Sync(config.APP_SECRET, salt, ITERATIONS, KEY_LENGTH, 'sha256');
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const authTag = cipher.getAuthTag();
    
    return [
      salt.toString('base64'),
      iv.toString('base64'),
      authTag.toString('base64'),
      encrypted
    ].join(':');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts data using AES-256-GCM or legacy AES-256-CBC
 * @param encryptedData The encrypted data as base64 string
 * @returns Decrypted data as string
 */
export function decryptData(encryptedData: string): string {
  try {
    const parts = encryptedData.split(':');
    
    if (parts.length === 4) {
      // AES-256-GCM with PBKDF2 (new format)
      const salt = Buffer.from(parts[0], 'base64');
      const iv = Buffer.from(parts[1], 'base64');
      const tag = Buffer.from(parts[2], 'base64');
      const encrypted = parts[3];
      
      const key = crypto.pbkdf2Sync(config.APP_SECRET, salt, ITERATIONS, KEY_LENGTH, 'sha256');
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    }
    
    if (parts.length === 2) {
      // Legacy AES-256-CBC fallback
      console.warn('[Security Warning] Decrypting legacy AES-CBC data without authentication tag');
      const iv = Buffer.from(parts[0], 'base64');
      const encrypted = parts[1];
      const key = crypto.createHash('sha256').update(config.APP_SECRET).digest();
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    }
    
    throw new Error('Invalid encrypted data format');
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Hashes data using SHA-256
 * @param data The data to hash
 * @returns Hashed data as hex string
 */
export function hashData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}
