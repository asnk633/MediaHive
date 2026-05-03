// src/server/knowledgeGraph/index.ts
// Knowledge Graph Core Module

export interface KnowledgeGraphNode {
  id: string;
  type: 'institution' | 'branch' | 'department' | 'task' | 'event' | 'user' | 'asset' | 'activity' | 'rule';
  name: string;
  properties: Record<string, any>;
  relationships: KnowledgeGraphRelationship[];
}

export interface KnowledgeGraphRelationship {
  from: string;
  to: string;
  type: string;
  properties?: Record<string, any>;
}

// Simple embedding interface for semantic search
interface Embedding {
  id: string;
  vector: number[];
}

export class KnowledgeGraph {
  private nodes: Map<string, KnowledgeGraphNode> = new Map();
  private relationships: Map<string, KnowledgeGraphRelationship> = new Map();
  private embeddings: Map<string, Embedding> = new Map();

  // Add a node to the knowledge graph
  addNode(node: KnowledgeGraphNode): void {
    this.nodes.set(node.id, node);
    // Generate embedding for the node for semantic search
    this.generateEmbedding(node);
  }

  // Get a node by ID
  getNode(id: string): KnowledgeGraphNode | undefined {
    return this.nodes.get(id);
  }

  // Add a relationship between nodes
  addRelationship(relationship: KnowledgeGraphRelationship): void {
    const key = `${relationship.from}-${relationship.to}-${relationship.type}`;
    this.relationships.set(key, relationship);
    
    // Add relationship to both nodes
    const fromNode = this.nodes.get(relationship.from);
    const toNode = this.nodes.get(relationship.to);
    
    if (fromNode) {
      fromNode.relationships.push(relationship);
    }
    
    if (toNode) {
      toNode.relationships.push(relationship);
    }
  }

  // Simple embedding generation (in a real implementation, this would use a neural network)
  private generateEmbedding(node: KnowledgeGraphNode): void {
    // Create a simple vector based on node properties
    const text = `${node.name} ${Object.values(node.properties).join(' ')}`;
    const vector = this.textToVector(text);
    this.embeddings.set(node.id, { id: node.id, vector });
  }

  // Simple text to vector conversion (cosine similarity approximation)
  private textToVector(text: string): number[] {
    // Simple hash-based vector generation for demonstration
    const vector: number[] = new Array(128).fill(0);
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      vector[i % 128] += charCode;
    }
    
    // Normalize the vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      return vector.map(val => val / magnitude);
    }
    return vector;
  }

  // Cosine similarity calculation
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }

  // Search nodes by keyword and type
  search(keyword: string, type?: string): KnowledgeGraphNode[] {
    const results: KnowledgeGraphNode[] = [];
    
    for (const node of this.nodes.values()) {
      // Filter by type if specified
      if (type && node.type !== type) {
        continue;
      }
      
      // Search in name and properties
      if (node.name.toLowerCase().includes(keyword.toLowerCase())) {
        results.push(node);
      } else {
        // Search in properties
        for (const propValue of Object.values(node.properties)) {
          if (typeof propValue === 'string' && propValue.toLowerCase().includes(keyword.toLowerCase())) {
            results.push(node);
            break;
          }
        }
      }
    }
    
    return results;
  }

  // Semantic search using embeddings
  semanticSearch(query: string, type?: string, threshold = 0.3): KnowledgeGraphNode[] {
    const queryVector = this.textToVector(query);
    const results: { node: KnowledgeGraphNode; similarity: number }[] = [];
    
    for (const [nodeId, embedding] of this.embeddings.entries()) {
      const node = this.nodes.get(nodeId);
      if (!node) continue;
      
      // Filter by type if specified
      if (type && node.type !== type) {
        continue;
      }
      
      const similarity = this.cosineSimilarity(queryVector, embedding.vector);
      if (similarity >= threshold) {
        results.push({ node, similarity });
      }
    }
    
    // Sort by similarity and return nodes
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .map(item => item.node);
  }

  // Get related nodes
  getRelatedNodes(nodeId: string, relationshipType?: string): KnowledgeGraphNode[] {
    const node = this.nodes.get(nodeId);
    if (!node) return [];
    
    const relatedNodes: KnowledgeGraphNode[] = [];
    const processedIds = new Set<string>();
    
    for (const relationship of node.relationships) {
      // Filter by relationship type if specified
      if (relationshipType && relationship.type !== relationshipType) {
        continue;
      }
      
      // Get the related node (the one that's not the current node)
      const relatedNodeId = relationship.from === nodeId ? relationship.to : relationship.from;
      
      // Avoid duplicates
      if (processedIds.has(relatedNodeId)) {
        continue;
      }
      
      const relatedNode = this.nodes.get(relatedNodeId);
      if (relatedNode) {
        relatedNodes.push(relatedNode);
        processedIds.add(relatedNodeId);
      }
    }
    
    return relatedNodes;
  }

  // Build relationships automatically from data
  buildAutomaticRelationships(): void {
    // Clear existing relationships
    this.relationships.clear();
    
    // Build relationships based on data patterns
    for (const node of this.nodes.values()) {
      switch (node.type) {
        case 'task':
          // Connect tasks to their creators
          if (node.properties.createdById) {
            this.addRelationship({
              from: node.id,
              to: `user-${node.properties.createdById}`,
              type: 'created_by'
            });
          }
          
          // Connect tasks to their assignees
          if (node.properties.assignedToId) {
            this.addRelationship({
              from: node.id,
              to: `user-${node.properties.assignedToId}`,
              type: 'assigned_to'
            });
          }
          
          // Connect tasks to their institutions
          if (node.properties.institution_id) {
            this.addRelationship({
              from: node.id,
              to: `institution-${node.properties.institution_id}`,
              type: 'belongs_to'
            });
          }
          break;
          
        case 'event':
          // Connect events to their creators
          if (node.properties.createdById) {
            this.addRelationship({
              from: node.id,
              to: `user-${node.properties.createdById}`,
              type: 'created_by'
            });
          }
          
          // Connect events to their institutions
          if (node.properties.institution_id) {
            this.addRelationship({
              from: node.id,
              to: `institution-${node.properties.institution_id}`,
              type: 'belongs_to'
            });
          }
          break;
          
        case 'user':
          // Connect users to their institutions
          if (node.properties.institution_id) {
            this.addRelationship({
              from: node.id,
              to: `institution-${node.properties.institution_id}`,
              type: 'works_at'
            });
          }
          break;
          
        case 'asset':
          // Connect assets to their owners
          if (node.properties.uploadedById) {
            this.addRelationship({
              from: node.id,
              to: `user-${node.properties.uploadedById}`,
              type: 'owned_by'
            });
          }
          
          // Connect assets to their institutions
          if (node.properties.institution_id) {
            this.addRelationship({
              from: node.id,
              to: `institution-${node.properties.institution_id}`,
              type: 'belongs_to'
            });
          }
          break;
      }
    }
    
    console.log('Built automatic relationships:', this.relationships.size);
  }

  // Clear the graph
  clear(): void {
    this.nodes.clear();
    this.relationships.clear();
    this.embeddings.clear();
  }

  // Get statistics
  getStats(): { nodes: number; relationships: number; embeddings: number } {
    return {
      nodes: this.nodes.size,
      relationships: this.relationships.size,
      embeddings: this.embeddings.size
    };
  }
}

// Export singleton instance
export const knowledgeGraph = new KnowledgeGraph();
