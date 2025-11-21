// src/lib/faceRecognition.ts
// VIP face recognition service using local/open-source methods

import { config } from '@/lib/config';
import { encryptData, decryptData } from '@/lib/encryption';
import { db } from '@/db';
import { vipEmbeddings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import axios from 'axios';
import path from 'path';
import fs from 'fs/promises';

// Types for face recognition
export interface FaceEmbedding {
  id?: number;
  label: string; // VIP name/label
  userId?: number; // Optional association with user
  embedding: number[]; // 128-d vector
  createdBy?: number; // Admin who created the embedding
  createdAt?: string;
}

export interface FaceMatch {
  id: number;
  label: string;
  similarity: number;
  userId?: number;
}

export interface FaceRecognitionResult {
  matches: FaceMatch[];
  processingTime: number;
}

/**
 * Enrolls a VIP by computing and storing face embeddings
 * @param imagePath Path to the VIP image
 * @param label VIP name/label
 * @param userId Optional user ID association
 * @param createdBy Admin user ID
 * @returns Stored embedding ID
 */
export async function enrollVIP(
  imagePath: string,
  label: string,
  userId: number | undefined,
  createdBy: number
): Promise<number> {
  try {
    // Compute face embedding
    const embedding = await computeFaceEmbedding(imagePath);
    
    // Encrypt the embedding for storage
    const encryptedEmbedding = encryptData(JSON.stringify(embedding));
    
    // Store in database
    const [result] = await db
      .insert(vipEmbeddings)
      .values({
        label,
        userId,
        embedding: encryptedEmbedding,
        createdBy,
        createdAt: new Date().toISOString(),
      })
      .returning({ id: vipEmbeddings.id });
    
    return result.id;
  } catch (error: unknown) {
    console.error('VIP enrollment error:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to enroll VIP: ${error.message}`);
    } else {
      throw new Error('Failed to enroll VIP: Unknown error');
    }
  }
}

/**
 * Matches a face in an image against enrolled VIPs
 * @param imagePath Path to the image to match
 * @returns Face recognition results
 */
export async function matchFace(imagePath: string): Promise<FaceRecognitionResult> {
  const startTime = Date.now();
  
  try {
    // Compute face embedding for the input image
    const inputEmbedding = await computeFaceEmbedding(imagePath);
    
    // Retrieve all stored embeddings
    const storedEmbeddings = await db
      .select()
      .from(vipEmbeddings);
    
    // Match against all stored embeddings
    const matches: FaceMatch[] = [];
    
    for (const stored of storedEmbeddings) {
      try {
        // Decrypt the stored embedding
        const decryptedEmbeddingStr = decryptData(stored.embedding as string);
        const decryptedEmbedding = JSON.parse(decryptedEmbeddingStr) as number[];
        
        // Calculate similarity
        const similarity = cosineSimilarity(inputEmbedding, decryptedEmbedding);
        
        // Only include matches above threshold
        if (similarity >= config.VIP_MATCH_THRESHOLD) {
          matches.push({
            id: stored.id,
            label: stored.label,
            similarity,
            userId: stored.userId || undefined,
          });
        }
      } catch (decryptError: unknown) {
        console.warn(`Failed to decrypt embedding ${stored.id}:`, decryptError);
      }
    }
    
    // Sort by similarity (highest first)
    matches.sort((a, b) => b.similarity - a.similarity);
    
    const processingTime = Date.now() - startTime;
    
    return {
      matches,
      processingTime,
    };
  } catch (error: unknown) {
    console.error('Face matching error:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to match face: ${error.message}`);
    } else {
      throw new Error('Failed to match face: Unknown error');
    }
  }
}

/**
 * Lists all enrolled VIPs
 * @returns List of enrolled VIPs
 */
export async function listVIPs(): Promise<{ id: number; label: string; userId?: number; createdAt: string }[]> {
  try {
    const results = await db
      .select({
        id: vipEmbeddings.id,
        label: vipEmbeddings.label,
        userId: vipEmbeddings.userId,
        createdAt: vipEmbeddings.createdAt,
      })
      .from(vipEmbeddings);
    
    // Convert null userId to undefined
    return results.map(result => ({
      id: result.id,
      label: result.label,
      userId: result.userId !== null ? result.userId : undefined,
      createdAt: result.createdAt,
    }));
  } catch (error: unknown) {
    console.error('VIP listing error:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to list VIPs: ${error.message}`);
    } else {
      throw new Error('Failed to list VIPs: Unknown error');
    }
  }
}

/**
 * Deletes a VIP enrollment
 * @param id VIP embedding ID
 */
export async function deleteVIP(id: number): Promise<void> {
  try {
    await db
      .delete(vipEmbeddings)
      .where(eq(vipEmbeddings.id, id));
  } catch (error: unknown) {
    console.error('VIP deletion error:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to delete VIP: ${error.message}`);
    } else {
      throw new Error('Failed to delete VIP: Unknown error');
    }
  }
}

/**
 * Computes face embedding using either Python microservice or JS library
 * @param imagePath Path to the image
 * @returns Face embedding vector
 */
async function computeFaceEmbedding(imagePath: string): Promise<number[]> {
  if (config.FACE_PYTHON_SERVICE && config.ENABLE_EXTERNAL_APIS) {
    // Use Python microservice if enabled and external APIs are allowed
    return await computeFaceEmbeddingPython(imagePath);
  } else {
    // Use JS-based face recognition (simplified implementation)
    return await computeFaceEmbeddingJS(imagePath);
  }
}

/**
 * Computes face embedding using Python microservice
 * @param imagePath Path to the image
 * @returns Face embedding vector
 */
async function computeFaceEmbeddingPython(imagePath: string): Promise<number[]> {
  try {
    // Read image file
    const imageBuffer = await fs.readFile(imagePath);
    const imageBase64 = imageBuffer.toString('base64');
    
    // Call Python microservice
    const response = await axios.post('http://localhost:5000/compute-embedding', {
      image: imageBase64,
    });
    
    if (response.data && Array.isArray(response.data.embedding)) {
      return response.data.embedding;
    } else {
      throw new Error('Invalid response from Python service');
    }
  } catch (error: unknown) {
    console.error('Python face embedding error:', error);
    throw new Error('Failed to compute face embedding using Python service');
  }
}

/**
 * Computes face embedding using JS library (simplified)
 * @param imagePath Path to the image
 * @returns Face embedding vector (placeholder)
 */
async function computeFaceEmbeddingJS(imagePath: string): Promise<number[]> {
  // This is a placeholder implementation
  // In a real implementation, you would use a library like face-api.js
  // For now, we'll generate a random 128-d vector as a placeholder
  
  const embedding: number[] = [];
  for (let i = 0; i < 128; i++) {
    embedding.push(Math.random() * 2 - 1); // Random value between -1 and 1
  }
  
  return embedding;
}

/**
 * Calculates cosine similarity between two vectors
 * @param a First vector
 * @param b Second vector
 * @returns Cosine similarity (0-1)
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }
  
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);
  
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }
  
  return dotProduct / (magnitudeA * magnitudeB);
}