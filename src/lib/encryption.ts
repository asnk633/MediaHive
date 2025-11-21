// src/lib/encryption.ts
// Utility functions for encrypting/decrypting sensitive data

import { config } from '@/lib/config';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

/**
 * Encrypts data using AES-256-CBC
 * @param data The data to encrypt
 * @returns Encrypted data as base64 string
 */
export function encryptData(data: string): string {
  try {
    const key = crypto.createHash('sha256').update(config.APP_SECRET).digest();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return iv.toString('base64') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts data using AES-256-CBC
 * @param encryptedData The encrypted data as base64 string
 * @returns Decrypted data as string
 */
export function decryptData(encryptedData: string): string {
  try {
    const key = crypto.createHash('sha256').update(config.APP_SECRET).digest();
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'base64');
    const encrypted = parts.slice(1).join(':');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
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