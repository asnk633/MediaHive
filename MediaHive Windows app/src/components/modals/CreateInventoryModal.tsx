"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContextProvider";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, AlertCircle, Check } from "lucide-react";

interface CreateInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateInventoryModal({ isOpen, onClose }: CreateInventoryModalProps) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: "",
    model: "",
    brand: "",
    category: "Camera",
    serial_number: "",
    status: "Available",
    condition: "Good",
    quantity: "1",
    location: "",
    description: "",
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && user) {
      setForm({
        name: "",
        model: "",
        brand: "",
        category: "Camera",
        serial_number: "",
        status: "Available",
        condition: "Good",
        quantity: "1",
        location: "",
        description: "",
      });
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !user) return;

    const qty = parseInt(form.quantity, 10) || 1;
    if (qty < 1) {
      setError("Quantity must be at least 1.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        item_name: form.name.trim(),
        name: form.name.trim(),
        category: form.category,
        serial_number: form.serial_number.trim() || null,
        status: form.status,
        condition: form.condition,
        quantity: qty,
        available_quantity: qty,
        image_url: null,
        location: form.location.trim() || null,
        description: form.description.trim() || null,
        institution_id: user.institution_id || null,
        tenant_id: user.tenant_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        brand: form.brand.trim() || null,
        model: form.model.trim() || null,
      };

      const { error: insertError } = await supabase.from("inventory_items").insert(payload);
      if (insertError) throw insertError;

      setSuccess(true);
      window.dispatchEvent(new CustomEvent("mediahive:dashboard-refresh"));
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to add asset. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="studio-panel border-white/10 max-w-md w-full text-zinc-100 p-6 shadow-2xl !flex !flex-col !gap-4 max-h-[90vh] overflow-y-auto !h-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-wide text-white">
            Add Equipment
          </DialogTitle>
          <DialogDescription className="sr-only">
            Add new physical equipment/asset to inventory.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-xs">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)]">
              <Check size={24} strokeWidth={2.5} />
            </div>
            <span className="text-sm font-semibold text-[var(--accent)]">Asset added successfully!</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Equipment Name *
              </label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Sony FX3 Cinema Camera"
                disabled={saving}
                className="glass-form-input placeholder:text-zinc-500 w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Brand
                </label>
                <input
                  type="text"
                  value={form.brand}
                  onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                  placeholder="e.g. Sony"
                  disabled={saving}
                  className="glass-form-input placeholder:text-zinc-500 w-full"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Model
                </label>
                <input
                  type="text"
                  value={form.model}
                  onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                  placeholder="e.g. FX3"
                  disabled={saving}
                  className="glass-form-input placeholder:text-zinc-500 w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  disabled={saving}
                  className="glass-form-input cursor-pointer w-full"
                >
                  <option className="bg-zinc-950 text-white" value="Camera">Camera</option>
                  <option className="bg-zinc-950 text-white" value="Lens">Lens</option>
                  <option className="bg-zinc-950 text-white" value="Audio">Audio</option>
                  <option className="bg-zinc-950 text-white" value="Lighting">Lighting</option>
                  <option className="bg-zinc-950 text-white" value="Support">Support / Tripod</option>
                  <option className="bg-zinc-950 text-white" value="Accessories">Accessories</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                  placeholder="1"
                  disabled={saving}
                  className="glass-form-input w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  disabled={saving}
                  className="glass-form-input cursor-pointer w-full"
                >
                  <option className="bg-zinc-950 text-white" value="Available">Available</option>
                  <option className="bg-zinc-950 text-white" value="Checked Out">Checked Out</option>
                  <option className="bg-zinc-950 text-white" value="Maintenance">Maintenance</option>
                  <option className="bg-zinc-950 text-white" value="Retired">Retired</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Condition
                </label>
                <select
                  value={form.condition}
                  onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}
                  disabled={saving}
                  className="glass-form-input cursor-pointer w-full"
                >
                  <option className="bg-zinc-950 text-white" value="New">New</option>
                  <option className="bg-zinc-950 text-white" value="Good">Good</option>
                  <option className="bg-zinc-950 text-white" value="Fair">Fair</option>
                  <option className="bg-zinc-950 text-white" value="Poor">Poor</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Serial Number / Asset Tag
              </label>
              <input
                type="text"
                value={form.serial_number}
                onChange={(e) => setForm((f) => ({ ...f, serial_number: e.target.value }))}
                placeholder="e.g. SN-88273619"
                disabled={saving}
                className="glass-form-input placeholder:text-zinc-500 w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Storage Location
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="e.g. Cabinet B, Shelf 2"
                disabled={saving}
                className="glass-form-input placeholder:text-zinc-500 w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Additional notes about purchase, accessories, or lens mounts..."
                rows={2}
                disabled={saving}
                className="glass-form-input placeholder:text-zinc-500 w-full resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving || !form.name.trim()}
              className="mt-2 w-full flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 text-sm font-semibold py-2.5 rounded-full active:scale-[0.98] transition-all cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Adding Asset...</span>
                </>
              ) : (
                <span>Add Equipment</span>
              )}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

