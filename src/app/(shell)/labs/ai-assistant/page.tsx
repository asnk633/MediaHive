'use client';

import React from 'react';
import { AssistantPanel } from '@/components/AI/AssistantPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Sparkles } from 'lucide-react';

export default function AIAssistantPage() {
    return (
        <div className="space-y-6">
            <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bot className="text-indigo-400" />
                        Smart Assistant
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted mb-6">
                        Testing AI-driven task generation and notification summaries.
                        This module interacts with the defined OpenAI/Anthropic providers on the backend.
                    </p>
                    <AssistantPanel />
                </CardContent>
            </Card>
        </div>
    );
}
