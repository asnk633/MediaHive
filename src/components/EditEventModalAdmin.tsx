import { DateSelector } from "@/components/ui/selectors/DateSelector";
import { TimeSelector } from "@/components/ui/selectors/TimeSelector";
import { DropdownSelector } from "@/components/ui/selectors/DropdownSelector";
import { format } from "date-fns";
import { Users } from "lucide-react";
import { useFormState } from "@/hooks/useFormState";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { DraftIndicator } from "@/components/ui/DraftIndicator";

export default function EditEventModalAdmin({
  open,
  onClose,
  eventId = "default-id" // Default ID since it's mock
}: {
  open: boolean;
  onClose: () => void;
  eventId?: string;
}) {
  const { state: formData, setState: setFormData, clearDraft, isDraftSaved } = useFormState({
    key: `draft:event:${eventId}`,
    initialState: {
      title: "Quarterly Media Strategy Meeting",
      desc: "Review of Q3 performance and planning for Q4 content calendar and campaigns.",
      start: "2023-10-26T10:00",
      end: "2023-10-26T11:30",
      loc: "https://meet.google.com/tha-iba-grdn",
      visibility: "Media Team",
      resources: "Conference Room A"
    }
  });

  const { title, desc, start, end, loc, visibility, resources } = formData;
  const setTitle = (val: string) => setFormData(prev => ({ ...prev, title: val }));
  const setDesc = (val: string) => setFormData(prev => ({ ...prev, desc: val }));
  const setStart = (val: string) => setFormData(prev => ({ ...prev, start: val }));
  const setEnd = (val: string) => setFormData(prev => ({ ...prev, end: val }));
  const setLoc = (val: string) => setFormData(prev => ({ ...prev, loc: val }));
  const setVisibility = (val: string) => setFormData(prev => ({ ...prev, visibility: val }));
  const setResources = (val: string) => setFormData(prev => ({ ...prev, resources: val }));

  if (!open) return null;

  const submitUpdate = async () => {
    // Save logic
    await new Promise(resolve => setTimeout(resolve, 500)); // Mock network delay
  };

  const { isSubmitting, handleSubmit } = useFormSubmit({
    onSubmit: submitUpdate,
    onSuccess: () => {
      clearDraft();
      onClose();
    }
  });

  const handleSave = async () => {
    await handleSubmit(undefined);
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-x-0 bottom-0 z-[70] mx-auto max-w-xl rounded-t-2xl bg-[#1E1E1E] p-4">
        <header className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold">Edit Event</h3>
            <DraftIndicator isSaved={isDraftSaved} />
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">✕</button>
        </header>

        <div className="space-y-6">
          {/* Title / Description */}
          <section className="rounded-lg bg-[#2c2c2c] p-4 shadow-lg">
            <label className="flex flex-col">
              <p className="pb-2 text-base font-bold">Event Title</p>
              <input
                className="h-12 rounded-lg bg-[#121212] px-4 focus:outline-none focus:ring-2 focus:ring-[#00BFA6]"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>

            <label className="mt-4 flex flex-col">
              <p className="pb-2 text-base font-bold">Description</p>
              <textarea
                rows={4}
                className="rounded-lg bg-[#121212] p-4 focus:outline-none focus:ring-2 focus:ring-[#00BFA6]"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </label>
          </section>

          {/* Time + Location */}
          <section className="rounded-lg bg-[#2c2c2c] p-4 shadow-lg">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <DateSelector 
                  label="Start Date"
                  date={new Date(start)}
                  onChange={(date) => {
                    if (!date) return;
                    const newDate = new Date(date);
                    const current = new Date(start);
                    newDate.setHours(current.getHours());
                    newDate.setMinutes(current.getMinutes());
                    setStart(newDate.toISOString());
                  }}
                />
                <TimeSelector 
                  label="Start Time"
                  value={format(new Date(start), "HH:mm")}
                  onChange={(time) => {
                    const [h, m] = time.split(':').map(Number);
                    const newDate = new Date(start);
                    newDate.setHours(h);
                    newDate.setMinutes(m);
                    setStart(newDate.toISOString());
                  }}
                />
              </div>
              <div className="space-y-4">
                <DateSelector 
                  label="End Date"
                  date={new Date(end)}
                  onChange={(date) => {
                    if (!date) return;
                    const newDate = new Date(date);
                    const current = new Date(end);
                    newDate.setHours(current.getHours());
                    newDate.setMinutes(current.getMinutes());
                    setEnd(newDate.toISOString());
                  }}
                />
                <TimeSelector 
                  label="End Time"
                  value={format(new Date(end), "HH:mm")}
                  onChange={(time) => {
                    const [h, m] = time.split(':').map(Number);
                    const newDate = new Date(end);
                    newDate.setHours(h);
                    newDate.setMinutes(m);
                    setEnd(newDate.toISOString());
                  }}
                />
              </div>
            </div>

            <label className="mt-4 flex flex-col">
              <p className="pb-2 text-base font-bold">Location / Meeting Link</p>
              <input value={loc} onChange={(e) => setLoc(e.target.value)} className="h-12 rounded-lg bg-[#121212] px-4" />
            </label>
          </section>

          {/* Admin-only extras */}
          <section className="rounded-lg bg-[#2c2c2c] p-4 shadow-lg">
            <div className="space-y-0.5">
              <DropdownSelector 
                label="Visibility / Audience"
                value={visibility}
                onChange={(val) => setVisibility(val)}
                options={[
                  { id: 'All Employees', label: 'All Employees', icon: <Users size={14} /> },
                  { id: 'Media Team', label: 'Media Team', icon: <Users size={14} /> },
                  { id: 'Branch Heads', label: 'Branch Heads', icon: <Users size={14} /> },
                  { id: 'Custom', label: 'Custom', icon: <Users size={14} /> },
                ]}
              />
            </div>

            <label className="mt-4 flex flex-col">
              <p className="pb-2 text-base font-bold">Resources / Rooms</p>
              <input value={resources} onChange={(e) => setResources(e.target.value)} className="h-12 rounded-lg bg-[#121212] px-4" />
            </label>
          </section>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button onClick={handleSave} disabled={isSubmitting} className="h-12 flex-1 rounded-lg bg-[#00BFA6] font-bold text-black flex items-center justify-center gap-2 disabled:opacity-50">
                {isSubmitting && <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />}
                Save Changes
            </button>
            <button onClick={onClose} disabled={isSubmitting} className="h-12 flex-1 rounded-lg border border-white/30 disabled:opacity-50">Cancel</button>
          </div>
        </div>
      </div>
    </>
  );
}
