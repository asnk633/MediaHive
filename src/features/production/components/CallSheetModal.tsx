'use client';

import React, { useRef } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Printer, 
  Copy, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Briefcase, 
  CheckSquare,
  FileText,
  Info
} from 'lucide-react';
import { format, subMinutes } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CallSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    event: any;
    crew: any[];
    equipment: any[];
    tasks: any[];
  };
}

const STATIC_ROLES = [
  'Director',
  'Producer',
  'Camera Operator',
  'Audio Engineer',
  'Lighting Lead',
  'Production Assistant'
];

export const CallSheetModal: React.FC<CallSheetModalProps> = ({ isOpen, onClose, data }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const { event, crew, equipment, tasks } = data;
  
  const startDate = new Date(event.start_at);
  const endDate = new Date(event.end_at);
  const arrivalDate = subMinutes(startDate, 30);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Call sheet link copied to clipboard');
  };

  // Map existing crew to static roles
  const structuredCrew = STATIC_ROLES.map(role => {
    const assigned = crew.find(c => c.role?.toLowerCase() === role.toLowerCase());
    return {
      role,
      name: assigned?.profile?.full_name || '—'
    };
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[210mm] max-h-[95vh] overflow-y-auto bg-slate-950 border-white/10 text-white p-0 rounded-none md:rounded-[32px] overflow-x-hidden no-print-dialog">
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/10 p-6 flex items-center justify-between no-print">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
              <FileText className="text-blue-500" /> Production Call Sheet
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={handleCopyLink}
              className="bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-xl h-10 px-4 font-bold"
            >
              <Copy size={16} className="mr-2" /> Copy Link
            </Button>
            <Button 
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-500 text-white border-blue-400/20 rounded-xl h-10 px-6 shadow-lg shadow-blue-500/20 font-bold"
            >
              <Printer size={16} className="mr-2" /> Print / PDF
            </Button>
          </div>
        </div>

        {/* Scrollable Document Area */}
        <div className="bg-slate-900/50 p-0 min-h-full">
          <style jsx global>{`
            @media print {
              @page { 
                size: A4; 
                margin: 20mm; 
                counter-increment: page;
              }
              
              /* 1. Global Visibility Reset */
              body * {
                visibility: hidden !important;
              }

              /* 2. Unbind Modal & Container Constraints */
              html, body, #__next, main, [role="dialog"], .no-print-dialog, [data-state="open"], .modal, .modal-content, .dialog, .container {
                visibility: visible !important;
                background: white !important;
                overflow: visible !important;
                max-height: none !important;
                height: auto !important;
                min-height: auto !important;
                position: static !important;
                width: 100% !important;
                max-width: none !important; /* Critical Fix */
                margin: 0 !important;
                padding: 0 !important;
                transform: none !important;
              }

              /* 3. The Print Target - Full A4 Parity */
              #print-call-sheet {
                visibility: visible !important;
                display: block !important;
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 210mm !important; 
                max-width: none !important; /* Critical Fix */
                height: auto !important;
                min-height: auto !important;
                background: white !important;
                padding: 0 !important;
                margin: 0 auto !important;
                z-index: 1000 !important;
              }

              #print-call-sheet * {
                visibility: visible !important;
                box-shadow: none !important;
                text-shadow: none !important;
                filter: none !important;
              }

              .no-print {
                display: none !important;
              }

              /* 4. Section Integrity & Hierarchy */
              .print-section {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
                margin-bottom: 32px !important;
              }

              .section-title {
                font-size: 11px !important;
                font-weight: 600 !important;
                text-transform: uppercase !important;
                letter-spacing: 0.08em !important;
                border-bottom: 2.5px solid black !important;
                padding-bottom: 6px !important;
                margin-bottom: 16px !important;
              }

              /* 5. Production Bar (Professional Grid) */
              .production-bar {
                display: grid !important;
                grid-template-columns: 2fr 1fr 1fr 1fr 1fr !important;
                width: 100% !important;
                border: 2px solid black !important;
              }

              .production-bar-item {
                border-right: 1px solid black !important;
                padding: 10px 14px !important;
              }

              .production-bar-item:last-child {
                border-right: none !important;
              }

              /* 6. Grids */
              .call-sheet-grid {
                display: grid !important;
                grid-template-columns: 1fr 1fr !important;
                gap: 28px !important;
              }

              .production-tasks-grid {
                display: grid !important;
                grid-template-columns: 1fr 1fr !important;
                gap: 18px !important;
              }

              * { 
                -webkit-print-color-adjust: exact !important; 
                print-color-adjust: exact !important; 
              }
            }
            .font-mono-custom { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
          `}</style>

          <div id="print-call-sheet" className="mx-auto w-full md:w-[210mm] bg-white text-slate-950 p-6 md:p-10 lg:p-14 space-y-12 shadow-xl print:shadow-none min-h-full">
            {/* 1. TOP PRODUCTION BAR */}
            <div className="production-bar grid grid-cols-[2fr_1fr_1fr_1fr_1fr] border-2 border-black mb-10 overflow-hidden">
              <div className="production-bar-item border-r border-black p-4 bg-slate-50">
                <span className="text-[8px] font-black uppercase text-slate-500 block mb-1">Project</span>
                <span className="text-xs font-bold uppercase truncate block text-slate-900">{event.title}</span>
              </div>
              <div className="production-bar-item border-r border-black p-4">
                <span className="text-[8px] font-black uppercase text-slate-500 block mb-1 text-center">Date</span>
                <span className="text-xs font-bold uppercase block text-slate-900 text-center">{format(startDate, 'MMM dd, yyyy')}</span>
              </div>
              <div className="production-bar-item border-r border-black p-4">
                <span className="text-[8px] font-black uppercase text-slate-500 block mb-1 text-center">Call Time</span>
                <span className="text-xs font-bold uppercase block text-blue-600 text-center">{format(startDate, 'HH:mm')}</span>
              </div>
              <div className="production-bar-item border-r border-black p-4">
                <span className="text-[8px] font-black uppercase text-slate-500 block mb-1 text-center">Wrap</span>
                <span className="text-xs font-bold uppercase block text-slate-900 text-center">{format(endDate, 'HH:mm')}</span>
              </div>
              <div className="production-bar-item p-4">
                <span className="text-[8px] font-black uppercase text-slate-500 block mb-1 text-right">Location</span>
                <span className="text-xs font-bold uppercase truncate block text-slate-900 text-right">{event.location || 'Studio A'}</span>
              </div>
            </div>

            {/* 2. HEADER BLOCK */}
            <div className="print-section border-b-2 border-slate-200 pb-10 flex justify-between items-start">
              <div className="max-w-[75%]">
                <h1 className="text-5xl font-black text-slate-900 leading-tight uppercase tracking-tight">{event.title}</h1>
                <div className="flex gap-8 text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mt-4">
                  <span>{format(startDate, 'MMMM do, yyyy')}</span>
                  <span>Call: {format(startDate, 'HH:mm')}</span>
                  <span>Wrap: {format(endDate, 'HH:mm')}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="p-5 border-[3px] border-slate-900 rounded-2xl shadow-sm">
                  <span className="text-[10px] font-black uppercase block mb-1 text-slate-400">Production Ref</span>
                  <span className="font-mono-custom font-bold text-sm uppercase text-slate-900">#{event.id.slice(0, 12)}</span>
                </div>
              </div>
            </div>

            {/* 3. SECTION 1 GRID */}
            <div className="call-sheet-grid grid grid-cols-2 gap-8 mb-10">
              {/* Location */}
              <div className="print-section space-y-4">
                <h3 className="section-title">
                  <MapPin size={12} className="inline mr-2" /> Shoot Location
                </h3>
                <div className="p-8 bg-slate-50 border border-slate-100 rounded-3xl">
                  <p className="text-2xl font-black text-slate-900 mb-6 leading-tight">{event.location || 'Studio A / Base Location'}</p>
                  <div className="pt-6 border-t border-slate-200 flex justify-between items-baseline">
                    <span className="text-[10px] font-black uppercase text-slate-400">Arrival Time</span>
                    <p className="text-xl font-black text-slate-900">{format(arrivalDate, 'HH:mm')} <span className="text-sm font-bold text-slate-400">(-30m)</span></p>
                  </div>
                </div>
              </div>

              {/* Brief */}
              <div className="print-section space-y-4">
                <h3 className="section-title">
                  <FileText size={12} className="inline mr-2" /> Production Brief
                </h3>
                <div className="text-base font-medium leading-relaxed text-slate-700 min-h-[100px]">
                  {event.description || 'No detailed instructions provided.'}
                </div>
                <div className="p-5 border-l-4 border-blue-500 bg-blue-50/20 rounded-xl">
                  <h4 className="text-[10px] font-black uppercase text-blue-500 mb-2">Operational Notes</h4>
                  <ul className="text-xs font-bold space-y-2 text-slate-600">
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0"/> Confirm technical redundancy.</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0"/> Battery and media clear audit.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 4. SECTION 2 GRID */}
            <div className="call-sheet-grid grid grid-cols-2 gap-8 mb-10">
              {/* Crew */}
              <div className="print-section space-y-4">
                <h3 className="section-title">
                  <Users size={12} className="inline mr-2" /> Personnel
                </h3>
                <div className="divide-y divide-slate-100">
                  {structuredCrew.map((member, idx) => (
                    <div key={idx} className="py-4 flex justify-between items-center transition-colors hover:bg-slate-50">
                      <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider font-mono-custom">{member.role}</span>
                      <span className="font-bold text-slate-900 text-sm">{member.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resources */}
              <div className="print-section space-y-4">
                <h3 className="section-title">
                  <Briefcase size={12} className="inline mr-2" /> Allocated Gear
                </h3>
                <div className="space-y-3">
                  {equipment.length > 0 ? equipment.map(item => (
                    <div key={item.id} className="p-4 border border-slate-100 flex justify-between items-center bg-white rounded-2xl shadow-sm">
                      <span className="text-sm font-bold text-slate-800">{item.inventory?.name}</span>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 border border-slate-200 rounded text-slate-400">Reserved</span>
                    </div>
                  )) : <div className="p-10 border-4 border-dashed border-slate-50 rounded-[40px] text-center italic text-slate-300">No hardware assigned.</div>}
                </div>
              </div>
            </div>

            {/* 5. TASKS BLOCK */}
            <div className="print-section pt-10 border-t-2 border-slate-900">
              <h3 className="section-title">
                <CheckSquare size={12} className="inline mr-2" /> Production Tasks
              </h3>
              <div className="production-tasks-grid grid grid-cols-2 gap-4">
                {tasks.map(task => (
                  <div key={task.id} className="flex items-start gap-5 p-4 border border-slate-100 rounded-2xl bg-white shadow-sm">
                    <div className="mt-1 w-5 h-5 border-2 border-slate-300 rounded-lg shrink-0" />
                    <div className="space-y-1">
                      <p className="text-base font-bold text-slate-800 leading-tight">{task.title}</p>
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{task.production_stage}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. FOOTER */}
            <div className="print-section mt-auto pt-10 border-t-2 border-slate-100">
              <div className="flex justify-between items-end text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">
                <div>
                  <p>Generated by MediaHive Workflow</p>
                  <p className="text-slate-900 font-mono-custom mt-2 tracking-tighter text-xs">P-ID: {event.id}</p>
                </div>
                <div className="text-right">
                  <p>Issued: {format(new Date(), 'MMM dd, yyyy HH:mm')}</p>
                  <p className="text-blue-600 mt-2 tracking-[0.6em]">CONFIDENTIAL PRODUCTION DOCUMENT</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
