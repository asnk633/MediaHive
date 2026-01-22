'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';

interface AutomationRule {
    id: number;
    name: string;
    description: string;
    triggerType: string;
    triggerConfig?: any;
    conditions: any[];
    actions: any[];
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
}

interface Trigger {
    id: string;
    type: string;
    name: string;
    description: string;
    config?: any;
}

interface Condition {
    id: string;
    type: string;
    field: string;
    operator: string;
    value: any;
}

interface Action {
    id: string;
    type: string;
    config: any;
}

// Template definitions
const TEMPLATES = [
    {
        id: 'urgent-task',
        name: 'Urgent Task Template',
        description: 'Automatically assign urgent tasks to senior team members',
        trigger: { type: 'task_created', name: 'Task Created', description: 'Triggered when a task is created', config: {} },
        conditions: [
            { type: 'field', field: 'priority', operator: 'equals', value: 'urgent' }
        ],
        actions: [
            { type: 'assign_user', config: { role: 'senior' } }
        ]
    },
    {
        id: 'event-reminder',
        name: 'Event Reminder Template',
        description: 'Send reminders for upcoming events',
        trigger: { type: 'event_created', name: 'Event Created', description: 'Triggered when an event is created', config: {} },
        conditions: [
            { type: 'field', field: 'startTime', operator: 'within', value: '24h' }
        ],
        actions: [
            { type: 'send_notification', config: { message: 'Reminder: Event starting soon' } }
        ]
    }
];

export default function AutomationsClient() {
    const [rules, setRules] = useState<AutomationRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
    const [activeTab, setActiveTab] = useState<'list' | 'builder'>('list');
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

    // Form state for the rule builder
    const [ruleForm, setRuleForm] = useState({
        name: '',
        description: '',
        trigger: { type: 'task_created', name: 'Task Created', description: 'Triggered when a task is created', config: {}, id: 'trigger-1' } as Trigger,
        conditions: [] as Condition[],
        actions: [] as Action[],
        enabled: true
    });

    // Fetch automation rules
    useEffect(() => {
        const fetchRules = async () => {
            try {
                const data = await apiClient('/api/automation-rules', {
                    method: 'GET'
                });
                setRules(data.rules);
            } catch (error) {
                console.error('Failed to fetch automation rules:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRules();
    }, []);

    // Handle template selection
    const handleTemplateSelect = (templateId: string) => {
        const template = TEMPLATES.find(t => t.id === templateId);
        if (template) {
            setRuleForm({
                name: template.name,
                description: template.description,
                trigger: { ...template.trigger, id: 'trigger-1' },
                conditions: template.conditions.map((c, i) => ({ ...c, id: `condition-${i}` })),
                actions: template.actions.map((a, i) => ({ ...a, id: `action-${i}` })),
                enabled: true
            });
            setSelectedTemplate(templateId);
            setActiveTab('builder');
        }
    };

    // Create or update a rule
    const handleSaveRule = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const url = editingRule ? `/api/automation-rules/${editingRule.id}` : '/api/automation-rules';
            const method = editingRule ? 'PUT' : 'POST';

            const data = await apiClient(url, {
                method,
                body: JSON.stringify({
                    name: ruleForm.name,
                    description: ruleForm.description,
                    triggerType: ruleForm.trigger.type,
                    triggerConfig: ruleForm.trigger.config,
                    conditions: ruleForm.conditions,
                    actions: ruleForm.actions,
                    enabled: ruleForm.enabled
                }),
            });

            if (editingRule) {
                setRules(rules.map(rule => rule.id === editingRule.id ? data.rule : rule));
            } else {
                setRules([...rules, data.rule]);
            }
            resetForm();
            setActiveTab('list');
        } catch (error) {
            console.error('Failed to save automation rule:', error);
        }
    };

    // Edit a rule
    const editRule = (rule: AutomationRule) => {
        setEditingRule(rule);
        setRuleForm({
            name: rule.name,
            description: rule.description,
            trigger: { type: rule.triggerType, name: 'Trigger', description: 'Rule trigger', config: rule.triggerConfig || {}, id: 'trigger-1' },
            conditions: rule.conditions.map((c, i) => ({ ...c, id: `condition-${i}` })),
            actions: rule.actions.map((a, i) => ({ ...a, id: `action-${i}` })),
            enabled: rule.enabled
        });
        setActiveTab('builder');
    };

    // Toggle rule enabled status
    const toggleRuleStatus = async (ruleId: number, enabled: boolean) => {
        try {
            const data = await apiClient(`/api/automation-rules/${ruleId}`, {
                method: 'PATCH',
                body: JSON.stringify({ enabled: !enabled }),
            });

            setRules(rules.map(rule =>
                rule.id === ruleId ? { ...rule, enabled: data.rule.enabled } : rule
            ));
        } catch (error) {
            console.error('Failed to update automation rule:', error);
        }
    };

    // Delete a rule
    const deleteRule = async (ruleId: number) => {
        if (!confirm('Are you sure you want to delete this automation rule?')) {
            return;
        }

        try {
            await apiClient(`/api/automation-rules/${ruleId}`, {
                method: 'DELETE',
            });

            setRules(rules.filter(rule => rule.id !== ruleId));
        } catch (error) {
            console.error('Failed to delete automation rule:', error);
        }
    };

    // Reset form
    const resetForm = () => {
        setRuleForm({
            name: '',
            description: '',
            trigger: { type: 'task_created', name: 'Task Created', description: 'Triggered when a task is created', config: {}, id: 'trigger-1' },
            conditions: [],
            actions: [],
            enabled: true
        });
        setEditingRule(null);
        setSelectedTemplate(null);
    };

    // Add a condition
    const addCondition = () => {
        setRuleForm({
            ...ruleForm,
            conditions: [
                ...ruleForm.conditions,
                {
                    id: `condition-${Date.now()}`,
                    type: 'field',
                    field: '',
                    operator: 'equals',
                    value: ''
                }
            ]
        });
    };

    // Update a condition
    const updateCondition = (id: string, field: keyof Condition, value: any) => {
        setRuleForm({
            ...ruleForm,
            conditions: ruleForm.conditions.map(cond =>
                cond.id === id ? { ...cond, [field]: value } : cond
            )
        });
    };

    // Remove a condition
    const removeCondition = (id: string) => {
        setRuleForm({
            ...ruleForm,
            conditions: ruleForm.conditions.filter(cond => cond.id !== id)
        });
    };

    // Add an action
    const addAction = () => {
        setRuleForm({
            ...ruleForm,
            actions: [
                ...ruleForm.actions,
                {
                    id: `action-${Date.now()}`,
                    type: 'send_notification',
                    config: {}
                }
            ]
        });
    };

    // Update an action
    const updateAction = (id: string, field: string, value: any) => {
        setRuleForm({
            ...ruleForm,
            actions: ruleForm.actions.map(action =>
                action.id === id ? { ...action, [field]: value } : action
            )
        });
    };

    // Remove an action
    const removeAction = (id: string) => {
        setRuleForm({
            ...ruleForm,
            actions: ruleForm.actions.filter(action => action.id !== id)
        });
    };

    if (loading) {
        return <div>Loading automation rules...</div>;
    }

    return (
        <div className="automations-page p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Automation Rules</h1>
                <div className="flex space-x-2">
                    <button
                        onClick={() => {
                            resetForm();
                            setActiveTab('builder');
                        }}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Create New Rule
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'list'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Rule List
                    </button>
                    <button
                        onClick={() => setActiveTab('builder')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'builder'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Rule Builder
                    </button>
                </nav>
            </div>

            {/* Rule List Tab */}
            {activeTab === 'list' && (
                <div>
                    <div className="bg-white shadow-md rounded">
                        <table className="min-w-full">
                            <thead>
                                <tr>
                                    <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                                        Trigger
                                    </th>
                                    <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {rules.map((rule) => (
                                    <tr key={rule.id}>
                                        <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                                            <div className="text-sm leading-5 font-medium text-gray-900">{rule.name}</div>
                                            <div className="text-sm leading-5 text-gray-500">{rule.description}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                                            <div className="text-sm leading-5 text-gray-900">{rule.triggerType}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${rule.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {rule.enabled ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200 text-sm leading-5 text-gray-500">
                                            {new Date(rule.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200 text-sm leading-5 font-medium">
                                            <button
                                                onClick={() => editRule(rule)}
                                                className="text-blue-600 hover:text-blue-900 mr-3"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => toggleRuleStatus(rule.id, rule.enabled)}
                                                className="text-yellow-600 hover:text-yellow-900 mr-3"
                                            >
                                                {rule.enabled ? 'Disable' : 'Enable'}
                                            </button>
                                            <button
                                                onClick={() => deleteRule(rule.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {rules.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-gray-500">No automation rules found.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Rule Builder Tab */}
            {activeTab === 'builder' && (
                <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">
                            {editingRule ? 'Edit Automation Rule' : 'Create New Automation Rule'}
                        </h2>
                        <button
                            onClick={() => {
                                resetForm();
                                setActiveTab('list');
                            }}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            Back to List
                        </button>
                    </div>

                    {/* Templates */}
                    {!editingRule && (
                        <div className="mb-8">
                            <h3 className="text-lg font-medium mb-4">Start with a Template</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {TEMPLATES.map((template) => (
                                    <div
                                        key={template.id}
                                        className={`border rounded-lg p-4 cursor-pointer ${selectedTemplate === template.id
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        onClick={() => handleTemplateSelect(template.id)}
                                    >
                                        <h4 className="font-medium">{template.name}</h4>
                                        <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSaveRule}>
                        {/* Rule Name and Description */}
                        <div className="mb-6">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                                Rule Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={ruleForm.name}
                                onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                required
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                                Description
                            </label>
                            <textarea
                                id="description"
                                value={ruleForm.description}
                                onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                rows={2}
                            />
                        </div>

                        {/* Trigger Section */}
                        <div className="mb-8">
                            <h3 className="text-lg font-medium mb-4">Trigger</h3>
                            <div className="border rounded-lg p-4">
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        Trigger Type
                                    </label>
                                    <select
                                        value={ruleForm.trigger.type}
                                        onChange={(e) => setRuleForm({
                                            ...ruleForm,
                                            trigger: { ...ruleForm.trigger, type: e.target.value }
                                        })}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    >
                                        <option value="task_created">Task Created</option>
                                        <option value="task_deadline">Task Nearing Deadline</option>
                                        <option value="event_created">Event Created</option>
                                        <option value="video_uploaded">Video Uploaded</option>
                                        <option value="teacher_request">Teacher Request Submitted</option>
                                        <option value="notification_received">Notification Received</option>
                                    </select>
                                </div>

                                {/* Trigger Configuration */}
                                <div className="mt-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        Configuration
                                    </label>
                                    <div className="text-sm text-gray-500">
                                        {ruleForm.trigger.type === 'task_deadline' ? (
                                            <div>
                                                <label className="block mb-2">Time before deadline</label>
                                                <input
                                                    type="number"
                                                    placeholder="Hours"
                                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                />
                                            </div>
                                        ) : (
                                            <p>No additional configuration needed for this trigger type.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Conditions Section */}
                        <div className="mb-8">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium">Conditions</h3>
                                <button
                                    type="button"
                                    onClick={addCondition}
                                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-sm"
                                >
                                    Add Condition
                                </button>
                            </div>

                            {ruleForm.conditions.length === 0 ? (
                                <div className="text-center py-4 text-gray-500">
                                    No conditions added. Click "Add Condition" to create one.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {ruleForm.conditions.map((condition) => (
                                        <div key={condition.id} className="border rounded-lg p-4">
                                            <div className="flex justify-between items-start mb-3">
                                                <h4 className="font-medium">Condition</h4>
                                                <button
                                                    type="button"
                                                    onClick={() => removeCondition(condition.id)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    Remove
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                                        Field
                                                    </label>
                                                    <select
                                                        value={condition.field}
                                                        onChange={(e) => updateCondition(condition.id, 'field', e.target.value)}
                                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                    >
                                                        <option value="priority">Priority</option>
                                                        <option value="status">Status</option>
                                                        <option value="institution">Institution</option>
                                                        <option value="assignedUser">Assigned User</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                                        Operator
                                                    </label>
                                                    <select
                                                        value={condition.operator}
                                                        onChange={(e) => updateCondition(condition.id, 'operator', e.target.value)}
                                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                    >
                                                        <option value="equals">Equals</option>
                                                        <option value="not_equals">Not Equals</option>
                                                        <option value="contains">Contains</option>
                                                        <option value="greater_than">Greater Than</option>
                                                        <option value="less_than">Less Than</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                                        Value
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={condition.value}
                                                        onChange={(e) => updateCondition(condition.id, 'value', e.target.value)}
                                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Actions Section */}
                        <div className="mb-8">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium">Actions</h3>
                                <button
                                    type="button"
                                    onClick={addAction}
                                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-sm"
                                >
                                    Add Action
                                </button>
                            </div>

                            {ruleForm.actions.length === 0 ? (
                                <div className="text-center py-4 text-gray-500">
                                    No actions added. Click "Add Action" to create one.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {ruleForm.actions.map((action) => (
                                        <div key={action.id} className="border rounded-lg p-4">
                                            <div className="flex justify-between items-start mb-3">
                                                <h4 className="font-medium">Action</h4>
                                                <button
                                                    type="button"
                                                    onClick={() => removeAction(action.id)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    Remove
                                                </button>
                                            </div>

                                            <div className="mb-4">
                                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                                    Action Type
                                                </label>
                                                <select
                                                    value={action.type}
                                                    onChange={(e) => updateAction(action.id, 'type', e.target.value)}
                                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                >
                                                    <option value="send_notification">Send Notification</option>
                                                    <option value="create_task">Create Task</option>
                                                    <option value="assign_user">Assign User</option>
                                                    <option value="auto_tag">Auto-tag</option>
                                                    <option value="auto_update_status">Auto-update Status</option>
                                                </select>
                                            </div>

                                            {/* Action Configuration */}
                                            <div>
                                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                                    Configuration
                                                </label>
                                                {action.type === 'send_notification' ? (
                                                    <textarea
                                                        placeholder="Notification message"
                                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                        rows={3}
                                                    />
                                                ) : action.type === 'create_task' ? (
                                                    <div>
                                                        <input
                                                            type="text"
                                                            placeholder="Task title"
                                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2"
                                                        />
                                                        <textarea
                                                            placeholder="Task description"
                                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                            rows={2}
                                                        />
                                                    </div>
                                                ) : action.type === 'assign_user' ? (
                                                    <div>
                                                        <select className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2">
                                                            <option value="">Select user or role</option>
                                                            <option value="admin">Admin</option>
                                                            <option value="team">Team</option>
                                                            <option value="senior">Senior Team Member</option>
                                                        </select>
                                                        <input
                                                            type="text"
                                                            placeholder="Or specify user ID"
                                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                        />
                                                    </div>
                                                ) : (
                                                    <p>Configuration options for this action type will appear here.</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Status Toggle */}
                        <div className="mb-6">
                            <div className="flex items-center">
                                <input
                                    id="enabled"
                                    type="checkbox"
                                    checked={ruleForm.enabled}
                                    onChange={(e) => setRuleForm({ ...ruleForm, enabled: e.target.checked })}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="enabled" className="ml-2 block text-sm text-gray-900">
                                    Enable this automation rule
                                </label>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => {
                                    resetForm();
                                    setActiveTab('list');
                                }}
                                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            >
                                {editingRule ? 'Update Rule' : 'Create Rule'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
