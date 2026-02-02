// src/app/api/search/route.ts
// Unified search API endpoint

import { NextRequest, NextResponse } from 'next/server';
import { authorizeByPermission } from '@/app/api/_lib/rbac';
import { knowledgeGraph } from '@/server/knowledgeGraph';


export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Authorize user with RBAC
    const user = await authorizeByPermission(req, 'read:tasks');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get search parameters
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all';
    const semantic = searchParams.get('semantic') === 'true';

    // Validate query
    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    let results;
    if (semantic) {
      // Perform semantic search in knowledge graph
      results = knowledgeGraph.semanticSearch(query, type === 'all' ? undefined : type);
    } else {
      // Perform regular search in knowledge graph
      results = knowledgeGraph.search(query, type === 'all' ? undefined : type);
    }

    // Return search results
    return NextResponse.json(
      {
        results,
        query,
        type,
        semantic,
        count: results.length,
        metadata: {
          timestamp: new Date().toISOString()
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/search]', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}
