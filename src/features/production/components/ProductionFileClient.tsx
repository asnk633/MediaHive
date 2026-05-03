'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, Briefcase, CheckSquare, 
  ArrowLeft, Clock, MapPin, ChevronRight,
  ShieldCheck, Info, AlertCircle, FileText,
  Copy, Check, Lock, ChevronDown, ChevronUp,
  CircleDot, PlayCircle, CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReactiveCard } from '@/components/ui/ReactiveCard';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ProductionService, ProductionFile } from '@/services/productionService';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CallSheetModal } from './CallSheetModal';
import { DateSelector } from '@/components/ui/selectors/DateSelector';
import { TimeSelector } from '@/components/ui/selectors/TimeSelector';
import { DropdownSelector } from '@/components/ui/selectors/DropdownSelector';

interface ProductionFileClientProps {
  id: string;
}

const STAGES = [
  { id: 'planning', label: 'Planning', color: 'blue' },
  { id: 'preparation', label: 'Preparation', color: 'amber' },
  { id: 'shooting', label: 'Shooting', color: 'red' },
  { id: 'editing', label: 'Editing', color: 'purple' },
  { id: 'delivery', label: 'Delivery', color: 'emerald' }
];

export const ProductionFileClient: React.FC<ProductionFileClientProps> = ({ id }) => {
  const router = useRouter();
  const [data, setData] = useState<ProductionFile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Call sheet state
  const [isCallSheetOpen, setIsCallSheetOpen] = useState(false);
  
  // UI state
  const [expandedStages, setExpandedStages] = useState<string[]>(['planning', 'preparation', 'shooting', 'editing', 'delivery']);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const file = await ProductionService.getProductionFile(id);
      setData(file);
      if (file?.event) {
        setEditForm({
            title: file.event.title,
            start_at: file.event.start_at,
            end_at: file.event.end_at,
            location: file.event.location || '',
            production_stage: file.event.production_stage || 'planning',
            description: file.event.description || ''
        });
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const tasksByStage = useMemo(() => {
    const groups: Record<string, any[]> = {
      planning: [],
      preparation: [],
      shooting: [],
      editing: [],
      delivery: []
    };
    data?.tasks?.forEach(task => {
        const stage = task.production_stage || 'planning';
        if (groups[stage]) {
            groups[stage].push(task);
        } else {
            // Fallback for unexpected stages
            groups.planning.push(task);
        }
    });
    return groups;
  }, [data?.tasks]);

  const getStageStatus = (stageId: string, index: number) => {
    const tasks = tasksByStage[stageId] || [];
    const isCompleted = tasks.length > 0 && tasks.every(t => t.status === 'done');
    
    // Check if locked
    let isLocked = false;
    if (index > 0) {
      for (let i = 0; i < index; i++) {
        const prevTasks = tasksByStage[STAGES[i].id] || [];
        if (prevTasks.some(t => t.status !== 'done')) {
          isLocked = true;
          break;
        }
      }
    }

    if (isCompleted) return 'completed';
    if (isLocked) return 'locked';
    return 'active';
  };

  const handleCopyId = () => {
    if (!data?.event?.id) return;
    navigator.clipboard.writeText(data.event.id);
    setCopied(true);
    toast.success('Production ID copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!editForm || !data?.event?.id) return;
    setSaving(true);
    
    const { data: updatedEvent, error } = await ProductionService.updateProduction(id, editForm);
    
    if (error) {
        toast.error('Failed to update production data');
    } else {
        toast.success('Production protocol updated successfully');
        setData(prev => prev ? { ...prev, event: updatedEvent } : null);
        setIsEditing(false);
    }
    setSaving(false);
  };

  const handleCancel = () => {
    if (data?.event) {
        setEditForm({
            title: data.event.title,
            start_at: data.event.start_at,
            end_at: data.event.end_at,
            location: data.event.location || '',
            production_stage: data.event.production_stage || 'planning',
            description: data.event.description || ''
        });
    }
    setIsEditing(false);
  };

  const toggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'todo' : 'done';
    
    // Optimistic UI update
    setData(prev => {
        if (!prev) return null;
        return {
            ...prev,
            tasks: prev.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
        };
    });

    const { error } = await ProductionService.updateTask(taskId, { status: newStatus });
    if (error) {
        toast.error('Failed to update task status');
        // Revert on error
        const file = await ProductionService.getProductionFile(id);
        setData(file);
    }
  };

  const toggleStageExpand = (stageId: string) => {
    setExpandedStages(prev => 
      prev.includes(stageId) ? prev.filter(s => s !== stageId) : [...prev, stageId]
    );
  };

  if (loading) {
    return (
      <div className="p-8 space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full bg-white/5" />
          <Skeleton className="h-8 w-64 bg-white/5" />
        </div>
        <div className="space-y-4">
            <Skeleton className="h-20 rounded-3xl bg-white/5" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Skeleton className="h-64 rounded-3xl bg-white/5" />
                    <Skeleton className="h-96 rounded-3xl bg-white/5" />
                </div>
                <div className="space-y-8">
                    <Skeleton className="h-48 rounded-3xl bg-white/5" />
                    <Skeleton className="h-96 rounded-3xl bg-white/5" />
                </div>
            </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-center p-8">
        <div className="p-4 rounded-full bg-red-500/10 text-red-400 mb-6">
          <AlertCircle size={40} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Production Not Found</h2>
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="border-white/10 hover:bg-white/5 text-white"
        >
          <ArrowLeft size={16} className="mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  const { event, crew, equipment, tasks } = data;
  const startDate = new Date(event.start_at);
  const endDate = new Date(event.end_at);

  return (
    <div className="p-8 pb-20 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-5 flex-1">
          <button 
            onClick={() => router.back()}
            className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-white/60 hover:text-white hover:bg-white/[0.08] transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black uppercase tracking-widest text-blue-400">
                Production File
              </span>
              <span className="text-white/20">•</span>
              <div 
                className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors text-white/40 group"
                onClick={handleCopyId}
              >
                <span className="text-xs font-bold font-mono tracking-tight">
                    #{event.id.slice(0, 8)}
                </span>
                {copied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
              </div>
            </div>
            {isEditing ? (
                <input 
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2 text-2xl font-black text-white outline-none focus:border-blue-500/50 transition-all font-sans tracking-tighter"
                />
            ) : (
                <h1 className="text-4xl font-black text-white tracking-tighter">{event.title}</h1>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
            {!isEditing && (
                <Button 
                    onClick={() => setIsCallSheetOpen(true)}
                    variant="outline"
                    className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border-blue-500/20 rounded-xl px-6 font-bold"
                >
                    <FileText size={16} className="mr-2" /> Generate Call Sheet
                </Button>
            )}
            {isEditing ? (
                <>
                    <Button 
                        onClick={handleCancel}
                        disabled={saving}
                        variant="ghost"
                        className="text-white/40 hover:text-white hover:bg-white/5 rounded-xl px-6 font-bold"
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/20 rounded-xl px-6 shadow-lg shadow-emerald-500/20 font-bold"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </>
            ) : (
                <Button 
                    onClick={() => setIsEditing(true)}
                    className="bg-white/5 hover:bg-white/10 text-white border-white/10 rounded-xl px-6 font-bold"
                >
                    Edit Protocol
                </Button>
            )}
        </div>
      </div>

      {/* Production Progress Bar */}
      <div className="mb-12">
        <ReactiveCard className="px-8 py-6 bg-white/[0.02] border-white/5 rounded-[32px]">
            <div className="flex items-center justify-between mb-4 px-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                    <CircleDot size={12} className="text-blue-400" /> Production Workflow
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                    {Math.round((STAGES.filter((_, i) => getStageStatus(STAGES[i].id, i) === 'completed').length / STAGES.length) * 100)}% Overall Progress
                </span>
            </div>
            <div className="relative px-2 py-4">
                <div className="absolute top-[36px] left-0 right-0 h-[2px] bg-white/5 z-0" />
                <div className="grid grid-cols-5 relative z-10">
                    {STAGES.map((stage, index) => {
                        const status = getStageStatus(stage.id, index);
                        return (
                            <div key={stage.id} className="flex flex-col items-center group cursor-default">
                                <div className={cn(
                                    "w-10 h-10 rounded-2xl flex items-center justify-center border-2 transition-all duration-500",
                                    status === 'completed' ? "bg-emerald-500 border-emerald-400 text-white" :
                                    status === 'active' ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20" :
                                    "bg-slate-900 border-white/10 text-white/20"
                                )}>
                                    {status === 'completed' ? <CheckCircle2 size={18} /> : 
                                     status === 'active' ? <PlayCircle size={18} className="animate-pulse" /> : 
                                     <Lock size={16} />}
                                </div>
                                <div className="mt-3.5 flex flex-col items-center h-10">
                                    <span className={cn(
                                        "text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap",
                                        status === 'locked' ? "text-white/20" : "text-white"
                                    )}>
                                        {stage.label}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </ReactiveCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">        {/* Left Column: Details & Stage-based Tasks */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* Main Info Card */}
          <ReactiveCard className="p-6 bg-white/[0.01] border-white/5 rounded-[32px] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <FileText size={160} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4 flex items-center gap-2">
                           <Clock size={12} /> Production Schedule
                        </h3>
                        {isEditing ? (
                            <div className="flex flex-col gap-4 mb-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <DateSelector 
                                        label="Start Date"
                                        date={new Date(editForm.start_at)}
                                        onChange={(date) => {
                                            if (!date) return;
                                            const newDate = new Date(date);
                                            const current = new Date(editForm.start_at);
                                            newDate.setHours(current.getHours());
                                            newDate.setMinutes(current.getMinutes());
                                            setEditForm({ ...editForm, start_at: newDate.toISOString() });
                                        }}
                                    />
                                    <TimeSelector 
                                        label="Start Time"
                                        value={format(new Date(editForm.start_at), "HH:mm")}
                                        onChange={(time) => {
                                            const [h, m] = time.split(':').map(Number);
                                            const newDate = new Date(editForm.start_at);
                                            newDate.setHours(h);
                                            newDate.setMinutes(m);
                                            setEditForm({ ...editForm, start_at: newDate.toISOString() });
                                        }}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <DateSelector 
                                        label="End Date"
                                        date={new Date(editForm.end_at)}
                                        onChange={(date) => {
                                            if (!date) return;
                                            const newDate = new Date(date);
                                            const current = new Date(editForm.end_at);
                                            newDate.setHours(current.getHours());
                                            newDate.setMinutes(current.getMinutes());
                                            setEditForm({ ...editForm, end_at: newDate.toISOString() });
                                        }}
                                    />
                                    <TimeSelector 
                                        label="End Time"
                                        value={format(new Date(editForm.end_at), "HH:mm")}
                                        onChange={(time) => {
                                            const [h, m] = time.split(':').map(Number);
                                            const newDate = new Date(editForm.end_at);
                                            newDate.setHours(h);
                                            newDate.setMinutes(m);
                                            setEditForm({ ...editForm, end_at: newDate.toISOString() });
                                        }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3 mb-4">
                                <p className="text-white font-bold flex items-center gap-3">
                                    <span className="text-blue-400">{format(startDate, 'EEEE, MMMM do')}</span>
                                </p>
                                <p className="text-3xl text-white/90 font-black tracking-tight mb-2">
                                    {format(startDate, 'HH:mm')} — {format(endDate, 'HH:mm')}
                                </p>
                            </div>
                        )}
                    </div>
                    
                    <div className="pt-2">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4 flex items-center gap-2">
                           <MapPin size={12} /> Shoot Location
                        </h3>
                        {isEditing ? (
                            <input 
                                type="text"
                                value={editForm.location}
                                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2 text-sm font-bold text-white outline-none focus:border-blue-500/50"
                                placeholder="Studio / On Location"
                            />
                        ) : (
                            <p className="text-xl text-white font-black tracking-tight">{event.location || 'Studio A / Remote'}</p>
                        )}
                    </div>
                </div>

                <div className="space-y-8">
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4 flex items-center gap-2">
                           <ShieldCheck size={12} /> Current Workflow Stage
                        </h3>
                        <div className="flex flex-wrap gap-2 mb-4 w-full">
                            {isEditing ? (
                                <DropdownSelector 
                                    label="Production Stage"
                                    value={editForm.production_stage}
                                    onChange={(val) => setEditForm({ ...editForm, production_stage: val })}
                                    className="w-full"
                                    options={[
                                        ...STAGES.map(s => ({
                                            id: s.id,
                                            label: s.label,
                                            icon: s.id === 'planning' ? <CheckSquare size={14} /> : 
                                                  s.id === 'preparation' ? <Briefcase size={14} /> :
                                                  s.id === 'shooting' ? <PlayCircle size={14} /> :
                                                  s.id === 'editing' ? <Clock size={14} /> :
                                                  <CheckCircle2 size={14} />
                                        })),
                                        { id: 'archived', label: 'Archived', icon: <Lock size={14} /> }
                                    ]}
                                />
                            ) : (
                                <span className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/10">
                                    In Focus: {event.production_stage}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="pt-2">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4 flex items-center gap-2">
                           <Info size={12} /> Production Brief
                        </h3>
                        {isEditing ? (
                            <textarea 
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white/80 outline-none focus:border-blue-500/50 min-h-[120px] resize-none leading-relaxed"
                                placeholder="Detail the production requirements..."
                            />
                        ) : (
                            <p className="text-sm text-white/60 leading-relaxed font-medium" style={{ lineHeight: '1.5' }}>
                                {event.description || 'No detailed description provided for this production phase.'}
                            </p>
                        )}
                    </div>
                </div>
            </div>
          </ReactiveCard>

          {/* Structured Tasks Section */}
          <div className="space-y-8">
            <h2 className="text-2xl font-black text-white flex items-center gap-3 px-2 mb-6">
                <CheckSquare size={24} className="text-blue-500" />
                Production Control Panel
            </h2>
            
            <div className="space-y-6">
                {STAGES.map((stage, index) => {
                    const stageTasks = tasksByStage[stage.id] || [];
                    const status = getStageStatus(stage.id, index);
                    const isExpanded = expandedStages.includes(stage.id);
                    const completedCount = stageTasks.filter(t => t.status === 'done').length;

                    return (
                        <div key={stage.id} className={cn(
                            "group transition-all duration-500",
                            status === 'locked' ? "opacity-40 grayscale-[0.5]" : "opacity-100"
                        )}>
                            <div 
                                onClick={() => toggleStageExpand(stage.id)}
                                className={cn(
                                    "p-6 rounded-[24px] border flex items-center justify-between cursor-pointer transition-all",
                                    status === 'completed' ? "bg-emerald-500/5 border-emerald-500/20" :
                                    status === 'active' ? "bg-white/[0.03] border-white/10" :
                                    "bg-transparent border-white/5"
                                )}
                            >
                                <div className="flex items-center gap-5">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300",
                                        status === 'completed' ? "bg-emerald-500 border-emerald-400 text-white" :
                                        status === 'active' ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20" :
                                        "bg-white/5 border-white/10 text-white/20"
                                    )}>
                                        {status === 'completed' ? <CheckCircle2 size={18} /> : 
                                         status === 'active' ? <PlayCircle size={18} /> : 
                                         <Lock size={16} />}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-black uppercase tracking-widest text-white">{stage.label}</h3>
                                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                                            {completedCount}/{stageTasks.length} Tasks Finalized
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    {status === 'locked' && (
                                        <span className="text-[9px] font-black uppercase tracking-widest text-white/20 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                            Awaiting Previous Stage
                                        </span>
                                    )}
                                    {isExpanded ? <ChevronUp size={20} className="text-white/20" /> : <ChevronDown size={20} className="text-white/20" />}
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="mt-6 ml-5 pl-10 border-l-2 border-white/5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    {stageTasks.length > 0 ? stageTasks.map((task) => (
                                        <ReactiveCard 
                                            key={task.id} 
                                            className={cn(
                                                "p-5 bg-white/[0.02] border-white/5 hover:bg-white/[0.04] transition-all rounded-[24px] group",
                                                status === 'locked' && "pointer-events-none"
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-5">
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleTask(task.id, task.status);
                                                        }}
                                                        className={cn(
                                                            "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                                            task.status === 'done' ? "bg-emerald-500 border-emerald-500 text-white" : "border-white/20"
                                                        )}
                                                    >
                                                        {task.status === 'done' && <Check size={14} />}
                                                    </button>
                                                    <div className="space-y-1">
                                                        <p className={cn(
                                                            "text-sm font-bold transition-all",
                                                            task.status === 'done' ? "text-white/30 line-through" : "text-white"
                                                        )}>
                                                            {task.title}
                                                        </p>
                                                        <p className="text-[10px] text-white/30 font-black uppercase tracking-widest px-1">
                                                            {task.priority} Priority
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/10 group-hover:text-white/30 transition-colors bg-white/5 px-2 py-1 rounded">
                                                        #{task.id.slice(0, 4)}
                                                    </span>
                                                </div>
                                            </div>
                                        </ReactiveCard>
                                    )) : (
                                        <div className="p-10 text-center bg-white/[0.01] border border-dashed border-white/10 rounded-3xl">
                                            <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">No milestones defined for this stage.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
          </div>
        </div>

        {/* Right Column: Crew & Equipment */}
        <div className="space-y-12">
            {/* Crew Card */}
            <div className="space-y-6">
                <h2 className="text-xl font-black text-white flex items-center gap-3 px-4">
                    <Users size={20} className="text-blue-400" />
                    Assigned Crew
                </h2>
                <ReactiveCard className="bg-white/[0.01] border-white/5 overflow-hidden rounded-[32px]">
                    <div className="divide-y divide-white/5">
                        {crew.length > 0 ? crew.map((member) => (
                            <div key={member.id} className="p-6 flex items-center justify-between hover:bg-white/[0.03] transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold border border-blue-500/10 overflow-hidden shadow-lg shadow-blue-500/5">
                                        {member.profile?.avatar_url ? (
                                            <img src={member.profile.avatar_url} alt={member.profile.full_name} className="w-full h-full object-cover" />
                                        ) : (
                                            member.profile?.full_name?.charAt(0) || '?'
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{member.profile?.full_name}</p>
                                        <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">{member.role || 'Staff'}</p>
                                    </div>
                                </div>
                                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-white/5">
                                    <ChevronRight size={16} className="text-white/40" />
                                </div>
                            </div>
                        )) : (
                            <div className="p-12 text-center bg-white/[0.01]">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Awaiting Assignment</p>
                            </div>
                        )}
                    </div>
                </ReactiveCard>
            </div>

            {/* Equipment Card */}
            <div className="space-y-6">
                <h2 className="text-xl font-black text-white flex items-center gap-3 px-4">
                    <Briefcase size={20} className="text-blue-400" />
                    Reserved Gear
                </h2>
                <ReactiveCard className="bg-white/[0.01] border-white/5 overflow-hidden rounded-[32px]">
                    <div className="divide-y divide-white/5">
                        {equipment.length > 0 ? equipment.map((item) => (
                            <div key={item.id} className="p-6 flex items-center justify-between hover:bg-white/[0.03] transition-all group">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 overflow-hidden group-hover:border-blue-500/20 transition-all shadow-lg shadow-black/20">
                                        {item.inventory?.image_url ? (
                                             <img src={item.inventory.image_url} alt={item.inventory.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Briefcase size={22} className="text-white/10" />
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-white max-w-[140px] truncate">{item.inventory?.name}</p>
                                        <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">{item.inventory?.category || 'Inventory'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[9px] font-black text-blue-400/80 bg-blue-400/10 px-3 py-1.5 rounded-xl uppercase tracking-widest border border-blue-400/10">
                                        READY
                                    </span>
                                </div>
                            </div>
                        )) : (
                            <div className="p-12 text-center bg-white/[0.01]">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/20">No Gear Reserved</p>
                            </div>
                        )}
                    </div>
                </ReactiveCard>
            </div>
        </div>
      </div>

      {data && (
        <CallSheetModal 
            isOpen={isCallSheetOpen}
            onClose={() => setIsCallSheetOpen(false)}
            data={data}
        />
      )}
    </div>
  );
};
