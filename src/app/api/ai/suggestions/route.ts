// src/app/api/ai/suggestions/route.ts
// AI Suggestions API endpoint

import { NextRequest, NextResponse } from 'next/server';
import { authorizeByPermission } from '@/app/api/_lib/rbac';
import { aiService } from '@/server/ai/service';


export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Authorize user with RBAC
    const user = await authorizeByPermission(req, 'read:tasks');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await req.json();
    const { query, type } = body;

    // Validate required fields
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    let suggestions = [];
    
    // Generate suggestions based on type
    switch (type) {
      case 'task':
        suggestions = await aiService.generateTaskSuggestions(query, user.id, user.tenantId);
        break;
        
      case 'event':
        suggestions = await aiService.generateEventSuggestions(query, user.id, user.tenantId);
        break;
        
      case 'summary':
        const summary = await aiService.summarizeWeeklyActivity(user.id, user.tenantId);
        suggestions = [{
          type: 'summary',
          title: 'Weekly Activity Summary',
          description: summary
        }];
        break;
        
      case 'team':
        const teamSuggestion = await aiService.suggestTeamAllocation(user.id, user.tenantId, query);
        suggestions = [{
          type: 'team',
          title: 'Team Allocation Suggestion',
          description: teamSuggestion.reason,
          suggestedAssignee: teamSuggestion.userName,
          availability: teamSuggestion.availability
        }];
        break;
        
      case 'recommendation':
        suggestions = await aiService.generateRecommendations(user.id, user.tenantId, query);
        break;
        
      default:
        // Generate all types of suggestions
        const taskSuggestions = await aiService.generateTaskSuggestions(query, user.id, user.tenantId);
        const eventSuggestions = await aiService.generateEventSuggestions(query, user.id, user.tenantId);
        const teamSuggestionDefault = await aiService.suggestTeamAllocation(user.id, user.tenantId, query);
        suggestions = [
          ...taskSuggestions.map((s: any) => ({ ...s, type: 'task' })),
          ...eventSuggestions.map((s: any) => ({ ...s, type: 'event' })),
          {
            type: 'team',
            title: 'Team Allocation Suggestion',
            description: teamSuggestionDefault.reason,
            suggestedAssignee: teamSuggestionDefault.userName,
            availability: teamSuggestionDefault.availability
          }
        ];
    }

    return NextResponse.json(
      { suggestions },
      { status: 200 }
    );
  } catch (error) {
    console.error('[POST /api/ai/suggestions]', error);
    return NextResponse.json(
      { error: 'Failed to generate AI suggestions' },
      { status: 500 }
    );
  }
}
