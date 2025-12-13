import React from 'react';
import { Download, FileText, Image as ImageIcon, File } from 'lucide-react';

interface FileCardProps {
    name: string;
    size: string;
    type: 'pdf' | 'image' | 'doc' | 'other';
    date?: string;
    variant?: 'card' | 'row';
}

export const FileCard = ({ name, size, type, date, variant = 'card' }: FileCardProps) => {
    const icons = {
        pdf: { icon: FileText, color: 'text-red-500', bg: 'bg-red-50' },
        image: { icon: ImageIcon, color: 'text-blue-500', bg: 'bg-blue-50' },
        doc: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
        other: { icon: File, color: 'text-gray-500', bg: 'bg-gray-100' }
    };

    const style = icons[type] || icons.other;
    const Icon = style.icon;

    if (variant === 'row') {
        return (
            <div className="flex items-center p-3 hover:bg-gray-50 border-b border-gray-100 transition-colors">
                <div className={`w-8 h-8 rounded-lg ${style.bg} ${style.color} flex items-center justify-center mr-3`}>
                    <Icon size={16} />
                </div>
                <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                    <span className="col-span-4 font-medium text-sm text-gray-900 truncate">{name}</span>
                    <span className="col-span-3 text-xs text-gray-500">{date}</span>
                    <span className="col-span-2 text-xs text-uppercase text-gray-500">{type}</span>
                    <span className="col-span-2 text-xs text-gray-500">{size}</span>
                    <div className="col-span-1 flex justify-end">
                        <button className="p-1.5 hover:bg-white rounded-full shadow-sm text-gray-400 hover:text-blue-500"><Download size={16} /></button>
                    </div>
                </div>
            </div>
        );
    }

    // Mobile Card Variant
    return (
        <div className="flex items-center p-4 bg-white rounded-2xl border border-[var(--color-border)] shadow-sm hover:border-blue-300 transition-all">
            <div className={`w-12 h-12 rounded-xl ${style.bg} ${style.color} flex items-center justify-center mr-4`}>
                <Icon size={24} />
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-[var(--color-text-primary)] truncate">{name}</h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{size} • {date}</p>
            </div>
            <button className="p-2 text-blue-500 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors">
                <Download size={18} />
            </button>
        </div>
    );
};
