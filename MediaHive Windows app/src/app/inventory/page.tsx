"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Box, Plus, Search, Camera, Lightbulb, Mic,
  ClipboardList, CheckCircle2, AlertCircle, Loader2,
  X, Wrench, RotateCcw, PackagePlus, ArrowUpDown, Filter,
  List, Grid, Clock, Download, ChevronDown, ChevronRight,
  MoreVertical, Calendar, Info, Trash2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContextProvider";
import { supabase } from "@/lib/supabaseClient";
import { AnimatedList } from "@/components/ui/animated-list";

// ─── Types ────────────────────────────────────────────────────────────────────
interface EquipmentItem {
  id: string;
  name: string;
  category: string;
  serial_number: string;
  status: "Available" | "Checked Out" | "Maintenance";
  assignee_name: string | null;
  due_date: string | null;
  condition: "Good" | "Fair" | "Poor" | "Damaged" | "Need Repair";
  quantity: number;
  location: string | null;
  description: string | null;
  image_url: string | null;
}

interface BookingItem {
  id: string;
  equipment_id: string;
  item_name: string;
  requested_by: string;
  user_name: string;
  purpose: string;
  requested_date: string;
  due_date: string | null;
  status: "pending" | "approved" | "declined" | "completed";
}

interface Toast {
  type: "success" | "error" | "loading";
  message: string;
}

const CATEGORIES = ["All", "Cameras", "Lighting", "Audio", "Rigging", "Accessories"];

const FALLBACK_ITEMS: EquipmentItem[] = [];

// ─── Component ────────────────────────────────────────────────────────────────
export default function InventoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"items" | "schedule">("items");
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "category" | "condition" | "quantity">("name-asc");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [allBookings, setAllBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);

  // Menu control
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Search input ref & keystroke listener
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Add Equipment modal (2-page wizard)
  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({
    name: "",
    category: "Cameras",
    status: "Available" as EquipmentItem["status"],
    condition: "Good" as EquipmentItem["condition"],
    quantity: "1",
    brand: "",
    model: "",
    purchase_price: "",
    serial_number: "",
    location: "",
    purchase_date: "",
    description: "",
  });

  // Request Equipment modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [selectedItem, setSelectedItem] = useState<EquipmentItem | null>(null);
  const [requestForm, setRequestForm] = useState({
    purpose: "",
  });

  // Requests List Modal (Header Action)
  const [showRequestsModal, setShowRequestsModal] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
    }
  };

  const handleImageUpload = async (file: File): Promise<string | null> => {
    if (!user) return null;
    setUploadingImage(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `inventory/${user.institution_id || user.tenant_id}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from("media-library")
        .upload(path, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("media-library")
        .getPublicUrl(path);

      return urlData.publicUrl;
    } catch (err: any) {
      console.error("Storage upload failed:", err);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const showToast = (type: Toast["type"], message: string) => {
    setToast({ type, message });
    if (type !== "loading") {
      setTimeout(() => setToast(prev => prev?.message === message ? null : prev), 3500);
    }
  };

  // ─── Fetch data ────────────────────────────────────────────────────────────
  const fetchInventory = async () => {
    if (!user) return;
    try {
      // 1. Fetch Inventory Items from inventory_items (the real table with 148 items)
      let eqQuery = supabase
        .from("inventory_items")
        .select("*")
        .eq("deleted", false)
        .order("created_at", { ascending: false });
        
      // Fetch global items (null tenant and null institution) OR items matching the user's specific tenant or institution
      if (user.institution_id || user.tenant_id) {
        const filterParts = ["and(tenant_id.is.null,institution_id.is.null)"];
        if (user.tenant_id) filterParts.push(`tenant_id.eq.${user.tenant_id}`);
        if (user.institution_id) filterParts.push(`institution_id.eq.${user.institution_id}`);
        eqQuery = eqQuery.or(filterParts.join(","));
      }

      const { data: eqData, error: eqErr } = await eqQuery;

      if (eqErr) throw eqErr;

      // 2. Fetch Active Assignments to map borrowers & due dates
      const { data: assignmentsData } = await supabase
        .from("inventory_assignments")
        .select("*")
        .is("released_at", null);

      if (eqData && eqData.length > 0) {
        setItems(eqData.map((r: Record<string, any>): EquipmentItem => {
          // Resolve current assignee if Checked Out
          const assignment = assignmentsData?.find(a => a.inventory_item_id === r.id);
          const assigneeName = assignment ? assignment.assigned_to_name : null;
          // Calculate a fallback return date (e.g. 7 days after assigned_at)
          const dueDate = assignment 
            ? new Date(new Date(assignment.assigned_at).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
            : null;

          return {
            id: String(r.id),
            name: r.item_name || r.name || "Unnamed Item",
            category: r.category || "Accessories",
            serial_number: r.serial_number || r.serial || "—",
            status: r.status || "Available",
            assignee_name: assigneeName,
            due_date: dueDate,
            condition: r.condition || "Good",
            quantity: r.quantity || 1,
            location: r.location || r.location_str || null,
            description: r.description || r.notes || null,
            image_url: r.image_url || null
          };
        }));
      } else {
        setItems(FALLBACK_ITEMS);
      }

      // 3. Fetch Booking requests from inventory_requests
      let reqQuery = supabase
        .from("inventory_requests")
        .select("*")
        .order("created_at", { ascending: false });
        
      if (user.institution_id) {
        reqQuery = reqQuery.eq("institution_id", user.institution_id);
      } else if (user.tenant_id) {
        reqQuery = reqQuery.eq("tenant_id", user.tenant_id);
      }

      const { data: reqData } = await reqQuery;

      if (reqData && reqData.length > 0) {
        // Resolve borrower names from profiles
        let profs: Record<string, string> = {};
        try {
          const { data: profsData } = await supabase.from("profiles").select("id, full_name, email");
          if (profsData) {
            profsData.forEach(p => {
              profs[p.id] = p.full_name || p.email || "Unknown User";
            });
          }
        } catch (e) {
          console.warn("Could not fetch profiles for requests:", e);
        }

        setAllBookings(reqData.map((r: Record<string, any>): BookingItem => {
          // Parse item id from notes if present
          const notesText = r.notes || "";
          const match = notesText.match(/\[ID:\s*([^\]]+)\]/);
          const itemId = match ? match[1] : "";
          const cleanPurpose = notesText.replace(/\[ID:\s*[^\]]+\]/, "").trim();

          return {
            id: String(r.id),
            equipment_id: itemId,
            item_name: r.item_name || "Item",
            requested_by: r.user_id || "Unknown User",
            user_name: profs[r.user_id] || "Unknown User",
            purpose: cleanPurpose || "",
            requested_date: r.created_at ? new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) : new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
            due_date: null,
            status: r.status || "pending",
          };
        }));
      } else {
        setAllBookings([]);
      }
    } catch (err: any) {
      console.error("Inventory fetch error:", err);
      showToast("error", err.message || "Failed to load inventory.");
      setItems(FALLBACK_ITEMS);
      setAllBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && (user?.institution_id || user?.tenant_id)) {
      fetchInventory();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleOutsideClick = () => setOpenMenuId(null);
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  // Global Key Down Listener for search focus (Keystrokes)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search bar on '/'
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Blur search bar on 'Escape'
      if (e.key === "Escape" && document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
        setSearch("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ─── Add Equipment ─────────────────────────────────────────────────────────
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim() || !user) return;
    setAdding(true);
    showToast("loading", "Adding equipment...");
    try {
      let finalImageUrl = null;
      if (selectedFile) {
        finalImageUrl = await handleImageUpload(selectedFile);
      }

      const qty = parseInt(addForm.quantity, 10) || 1;

      const { error } = await supabase.from("inventory_items").insert({
        item_name: addForm.name.trim(),
        name: addForm.name.trim(),
        category: addForm.category,
        serial_number: addForm.serial_number.trim() || null,
        status: addForm.status,
        condition: addForm.condition,
        quantity: qty,
        available_quantity: qty,
        image_url: finalImageUrl,
        location: addForm.location.trim() || null,
        description: addForm.description.trim() || null,
        institution_id: user.institution_id || null,
        tenant_id: user.tenant_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        purchase_price: parseFloat(addForm.purchase_price) || null,
        brand: addForm.brand.trim() || null,
        model: addForm.model.trim() || null,
        purchase_date: addForm.purchase_date || null
      });
      if (error) throw error;
      showToast("success", "Equipment added to inventory!");
      setShowAddModal(false);
      setSelectedFile(null);
      setImagePreviewUrl(null);
      setCurrentStep(1);
      setAddForm({
        name: "",
        category: "Cameras",
        status: "Available",
        condition: "Good",
        quantity: "1",
        brand: "",
        model: "",
        purchase_price: "",
        serial_number: "",
        location: "",
        purchase_date: "",
        description: "",
      });
      await fetchInventory();
    } catch (err: any) {
      showToast("error", err.message || "Failed to add equipment.");
    } finally {
      setAdding(false);
    }
  };

  // ─── Request Equipment ──────────────────────────────────────────────────────
  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !user) return;
    setRequesting(true);
    showToast("loading", "Submitting request...");
    try {
      // Append asset ID to notes so we can resolve it upon approval
      const requestNotes = `${requestForm.purpose.trim()} [ID: ${selectedItem.id}]`;

      const { error } = await supabase.from("inventory_requests").insert({
        item_name: selectedItem.name,
        quantity: 1,
        status: "pending",
        notes: requestNotes,
        user_id: user.id,
        institution_id: user.institution_id || null,
        tenant_id: user.tenant_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      showToast("success", "Request submitted successfully!");
      setShowRequestModal(false);
      setRequestForm({ purpose: "" });
      setSelectedItem(null);
      await fetchInventory();
    } catch (err: any) {
      showToast("error", err.message || "Failed to submit request.");
    } finally {
      setRequesting(false);
    }
  };

  // ─── Approve / Decline Request ─────────────────────────────────────────────
  const handleRequestAction = async (req: BookingItem, action: "approve" | "decline") => {
    showToast("loading", action === "approve" ? "Approving request..." : "Declining request...");
    try {
      // 1. Update status in inventory_requests
      const { error: reqError } = await supabase
        .from("inventory_requests")
        .update({
          status: action === "approve" ? "approved" : "declined",
          updated_at: new Date().toISOString(),
        })
        .eq("id", req.id);

      if (reqError) throw reqError;

      // 2. If approved, update item status to Checked Out and insert an assignment
      if (action === "approve" && req.equipment_id) {
        await supabase
          .from("inventory_items")
          .update({
            status: "Checked Out",
            updated_at: new Date().toISOString()
          })
          .eq("id", req.equipment_id);

        await supabase
          .from("inventory_assignments")
          .insert({
            inventory_item_id: req.equipment_id,
            assigned_to_name: req.user_name || "Assigned User",
            assigned_at: new Date().toISOString(),
            notes: req.purpose
          });
      }

      showToast("success", action === "approve" ? "Request approved!" : "Request declined.");
      await fetchInventory();
    } catch (err: any) {
      showToast("error", err.message || "Action failed.");
    }
  };

  // ─── Mark as returned ─────────────────────────────────────────────────────
  const handleMarkReturned = async (item: EquipmentItem) => {
    showToast("loading", "Marking as returned...");
    try {
      // 1. Update status to Available in inventory_items
      const { error } = await supabase
        .from("inventory_items")
        .update({
          status: "Available",
          updated_at: new Date().toISOString()
        })
        .eq("id", item.id);

      if (error) throw error;

      // 2. Complete assignment in inventory_assignments
      await supabase
        .from("inventory_assignments")
        .update({ released_at: new Date().toISOString() })
        .eq("inventory_item_id", item.id)
        .is("released_at", null);

      // 3. Mark the corresponding request as completed in inventory_requests
      const matchingReq = allBookings.find(b => b.equipment_id === item.id && b.status === "approved");
      if (matchingReq) {
        await supabase
          .from("inventory_requests")
          .update({ status: "completed", updated_at: new Date().toISOString() })
          .eq("id", matchingReq.id);
      }

      showToast("success", `${item.name} marked as returned.`);
      await fetchInventory();
    } catch (err: any) {
      showToast("error", err.message || "Failed to return asset.");
    }
  };

  // ─── Delete Asset (Admin) ─────────────────────────────────────────────────
  const handleDeleteAsset = async (item: EquipmentItem) => {
    if (!confirm(`Are you sure you want to delete ${item.name} from the inventory?`)) return;
    showToast("loading", "Deleting asset...");
    try {
      const { error } = await supabase
        .from("inventory_items")
        .update({
          deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq("id", item.id);

      if (error) throw error;
      showToast("success", "Asset deleted successfully.");
      await fetchInventory();
    } catch (err: any) {
      showToast("error", err.message || "Failed to delete asset.");
    }
  };

  // ─── Change Status directly (Admin) ───────────────────────────────────────
  const handleChangeStatus = async (item: EquipmentItem, newStatus: EquipmentItem["status"]) => {
    showToast("loading", "Updating status...");
    try {
      const { error } = await supabase
        .from("inventory_items")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", item.id);

      if (error) throw error;
      showToast("success", `Asset status updated to ${newStatus}.`);
      await fetchInventory();
    } catch (err: any) {
      showToast("error", err.message || "Failed to update status.");
    }
  };

  // ─── Export CSV ────────────────────────────────────────────────────────────
  const handleExport = () => {
    if (items.length === 0) {
      showToast("error", "No inventory items to export.");
      return;
    }
    const headers = ["Asset Name", "Category", "Serial Number", "Status", "Condition", "Quantity", "Location"];
    const rows = items.map(item => [
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.category}"`,
      `"${item.serial_number}"`,
      `"${item.status}"`,
      `"${item.condition}"`,
      item.quantity,
      `"${(item.location || "").replace(/"/g, '""')}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mediahive_inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("success", "Inventory exported to CSV!");
  };

  // ─── Filters & Sorting logic ────────────────────────────────────────────────
  const filteredItems = items.filter(item => {
    const matchCat = filter === "All" || item.category === filter;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.serial_number.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === "name-asc") return a.name.localeCompare(b.name);
    if (sortBy === "name-desc") return b.name.localeCompare(a.name);
    if (sortBy === "category") return a.category.localeCompare(b.category);
    if (sortBy === "condition") return (a.condition || "").localeCompare(b.condition || "");
    if (sortBy === "quantity") return (b.quantity || 0) - (a.quantity || 0);
    return 0;
  });

  const requests = allBookings.filter(b => b.status === "pending");

  const getDisplayCategory = (cat: string) => {
    switch (cat) {
      case "Cameras":
        return "CAMERAS & ACCESSORIES";
      case "Lighting":
        return "LIGHTING & RIGGING";
      case "Audio":
        return "AUDIO & SOUND SYSTEMS";
      case "Rigging":
        return "LIGHTING & RIGGING";
      case "Accessories":
        return "GENERAL ASSET";
      default:
        return cat.toUpperCase() + " ASSET";
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto w-full pb-10">

      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-md text-sm font-semibold ${
              toast.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
              toast.type === "error" ? "bg-red-500/10 border-red-500/30 text-red-400" :
              "bg-zinc-900/80 border-white/10 text-zinc-200"
            }`}
          >
            {toast.type === "success" && <CheckCircle2 size={16} />}
            {toast.type === "error" && <AlertCircle size={16} />}
            {toast.type === "loading" && <Loader2 size={16} className="animate-spin" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Header Section */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white m-0 uppercase font-sans">Inventory</h1>
          <p className="text-zinc-500 m-0 text-xs mt-1 uppercase tracking-wider font-semibold">Manage and request studio assets.</p>
        </div>
        
        <div className="flex items-center gap-2.5">
          {/* Requests Panel Button */}
          <button 
            onClick={() => setShowRequestsModal(true)}
            className="flex items-center gap-2 bg-zinc-950/40 hover:bg-zinc-900/60 border border-white/5 hover:border-white/10 text-zinc-400 hover:text-white text-xs font-semibold px-4.5 py-2.5 rounded-xl transition-all cursor-pointer relative"
          >
            <Clock size={14} />
            Requests
            {requests.length > 0 && (
              <span className="absolute -top-1.5 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-bold text-white shadow-lg animate-pulse">
                {requests.length}
              </span>
            )}
          </button>

          {/* Export Button */}
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-zinc-950/40 hover:bg-zinc-900/60 border border-white/5 hover:border-white/10 text-zinc-400 hover:text-white text-xs font-semibold px-4.5 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            <Download size={14} />
            Export
          </button>

          {/* Add Asset Button */}
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:scale-97 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/15 transition-all cursor-pointer"
          >
            <Plus size={15} />
            Add Asset
          </button>
        </div>
      </header>

      {/* 2. Collapsible Categorization Guide */}
      <div className="glass-panel rounded-2xl relative overflow-hidden transition-all duration-350">
        <button
          onClick={() => setIsGuideOpen(!isGuideOpen)}
          className="w-full flex items-center justify-between px-6 py-4.5 text-left hover:bg-white/2 cursor-pointer transition-colors relative z-10"
        >
          <div className="flex items-center gap-3">
            <Info size={15} className="text-indigo-400" />
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Media Inventory Categorization Guide</span>
          </div>
          <motion.div
            animate={{ rotate: isGuideOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-zinc-500"
          >
            <ChevronDown size={16} />
          </motion.div>
        </button>
        <AnimatePresence initial={false}>
          {isGuideOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden border-t border-white/5 bg-zinc-950/25"
            >
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-[11px] text-zinc-400">
                <div>
                  <h4 className="text-zinc-200 font-bold mb-2 uppercase tracking-wide">Cameras & Accessories</h4>
                  <p className="leading-relaxed">High-definition bodies, cinema rigs, extra lenses, filters, and action cameras (e.g. Sony FX6, GoPro kits).</p>
                </div>
                <div>
                  <h4 className="text-zinc-200 font-bold mb-2 uppercase tracking-wide">Lighting & Rigging</h4>
                  <p className="leading-relaxed">LED panels, softboxes, light stands, c-stands, and clamps to properly illuminate production sets.</p>
                </div>
                <div>
                  <h4 className="text-zinc-200 font-bold mb-2 uppercase tracking-wide">Audio & Sound Systems</h4>
                  <p className="leading-relaxed">Lavalier mics, shotgun microphones, digital sound recorders, sound mixers, and headphone monitors.</p>
                </div>
                <div>
                  <h4 className="text-zinc-200 font-bold mb-2 uppercase tracking-wide">General Assets</h4>
                  <p className="leading-relaxed">Storage media (SD cards, MicroSDs), adapters, rulers, tools, cables, and miscellaneous production supplies.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Tab Pills */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("items")}
          className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
            activeTab === "items"
              ? "bg-gradient-to-br from-indigo-500/10 to-teal-500/10 text-indigo-400 border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.12)]"
              : "bg-zinc-950/20 border-white/5 text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Equipment Items
        </button>
        <button
          onClick={() => setActiveTab("schedule")}
          className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
            activeTab === "schedule"
              ? "bg-gradient-to-br from-indigo-500/10 to-teal-500/10 text-indigo-400 border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.12)]"
              : "bg-zinc-950/20 border-white/5 text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Booking Schedule
        </button>
      </div>

      {/* ─── Active Tab content ─── */}

      {activeTab === "items" && (
        <div className="flex flex-col gap-4">
          {/* 4. Toolbar */}
          <div className="flex flex-col gap-4">
            {/* Full-width Search bar with Visual Keystroke Indicator */}
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search assets by name or serial..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-zinc-950/40 border border-white/5 rounded-2xl pl-12 pr-12 py-3.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all font-sans"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/8 text-[9px] font-mono text-zinc-500 pointer-events-none select-none">
                /
              </div>
            </div>

            {/* Filters and Layout Toggle Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Sort Dropdown */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as any)}
                    className="appearance-none bg-zinc-950/50 border border-white/5 rounded-xl pl-9 pr-8 py-2.5 text-xs text-zinc-300 focus:outline-none cursor-pointer font-sans"
                  >
                    <option className="bg-zinc-900" value="name-asc">Name (A-Z)</option>
                    <option className="bg-zinc-900" value="name-desc">Name (Z-A)</option>
                    <option className="bg-zinc-900" value="category">Category</option>
                    <option className="bg-zinc-900" value="condition">Condition</option>
                    <option className="bg-zinc-900" value="quantity">Quantity</option>
                  </select>
                  <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-3.5 h-3.5 pointer-events-none" />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 w-3.5 h-3.5 pointer-events-none" />
                </div>

                {/* Category Dropdown */}
                <div className="relative">
                  <select
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="appearance-none bg-zinc-950/50 border border-white/5 rounded-xl pl-9 pr-8 py-2.5 text-xs text-zinc-300 focus:outline-none cursor-pointer font-sans"
                  >
                    <option className="bg-zinc-900" value="All">All Categories</option>
                    {CATEGORIES.filter(c => c !== "All").map(cat => (
                      <option key={cat} className="bg-zinc-900" value={cat}>{cat}</option>
                    ))}
                  </select>
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-3.5 h-3.5 pointer-events-none" />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 w-3.5 h-3.5 pointer-events-none" />
                </div>
              </div>

              {/* List / Grid Layout Toggle */}
              <div className="flex items-center gap-1 bg-zinc-950/20 border border-white/5 rounded-xl p-1 shrink-0">
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === "list"
                      ? "bg-zinc-800/60 text-indigo-400"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                  title="List View"
                >
                  <List size={15} />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-zinc-800/60 text-indigo-400"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                  title="Grid View"
                >
                  <Grid size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* 5. Main Content display */}
          {loading ? (
            <div className="flex items-center gap-2 text-zinc-500 text-sm py-10 justify-center">
              <Loader2 size={16} className="animate-spin" /> Loading assets...
            </div>
          ) : viewMode === "list" ? (
            /* Card-Row List (List View) with Staggered Cascading Animations */
            <div className="flex flex-col gap-2">
              {/* Column Headers */}
              <div className="grid gap-4 px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-white/5"
                style={{ gridTemplateColumns: "minmax(0,3fr) minmax(0,1.8fr) minmax(0,1.2fr) minmax(0,1.2fr) minmax(0,1fr) auto" }}>
                <div>Asset Name</div>
                <div>Category</div>
                <div className="text-center">Availability</div>
                <div className="text-center">Condition</div>
                <div className="text-center">Quantity</div>
                <div className="w-24 text-right">Actions</div>
              </div>

              {sortedItems.length === 0 ? (
                <div className="py-10 text-center text-zinc-500 font-medium">
                  No matching assets found.
                </div>
              ) : (
                <AnimatedList className="!gap-1.5" delayOffset={0.02} maxDelay={0.25}>
                  {sortedItems.map(item => (
                    <div key={item.id}
                      className="grid gap-4 items-center px-4 py-3 rounded-xl glass-card transition-all group hover:bg-white/[0.03]"
                      style={{ gridTemplateColumns: "minmax(0,3fr) minmax(0,1.8fr) minmax(0,1.2fr) minmax(0,1.2fr) minmax(0,1fr) auto" }}>
                      
                      {/* Asset Name */}
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-xs font-bold text-zinc-200 truncate">{item.name}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">{item.serial_number}</span>
                      </div>

                      {/* Category */}
                      <div className="whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 text-[9px] font-bold tracking-wider rounded-lg bg-zinc-950/40 border border-white/5 text-zinc-400">
                          {getDisplayCategory(item.category)}
                        </span>
                      </div>

                      {/* Availability */}
                      <div className="text-center whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-0.5 text-[9px] font-bold uppercase rounded-full border ${
                          item.status === "Available" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                          item.status === "Checked Out" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                          "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}>
                          {item.status}
                        </span>
                      </div>

                      {/* Condition */}
                      <div className="text-center whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 text-[9px] font-semibold rounded border ${
                          item.condition === "Good" ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/15" :
                          item.condition === "Fair" ? "bg-zinc-800 text-zinc-300 border-white/5" :
                          item.condition === "Poor" ? "bg-amber-500/5 text-amber-400 border-amber-500/15" :
                          item.condition === "Need Repair" ? "bg-orange-500/5 text-orange-400 border-orange-500/15" :
                          "bg-red-500/5 text-red-400 border-red-500/15"
                        }`}>
                          {item.condition}
                        </span>
                      </div>

                      {/* Quantity */}
                      <div className="text-center whitespace-nowrap text-xs text-zinc-300">
                        {item.quantity} units
                      </div>

                      {/* Actions */}
                      <div className="text-right whitespace-nowrap relative">
                        <div className="flex items-center justify-end gap-2">
                          {item.status === "Available" ? (
                            <button
                              onClick={() => { setSelectedItem(item); setShowRequestModal(true); }}
                              className="flex items-center justify-center p-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 hover:text-teal-300 transition-colors cursor-pointer"
                              title="Request Asset"
                            >
                              <ChevronRight size={14} />
                            </button>
                          ) : item.status === "Checked Out" ? (
                            <button
                              onClick={() => handleMarkReturned(item)}
                              className="flex items-center gap-1 text-[9px] font-bold text-teal-400 hover:text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                              title="Return Asset"
                            >
                              <RotateCcw size={10} /> Return
                            </button>
                          ) : (
                            <Wrench size={12} className="text-red-400 mr-1" />
                          )}
                          
                          {/* Admin Action Menu */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === item.id ? null : item.id);
                              }}
                              className="p-1 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
                            >
                              <MoreVertical size={14} />
                            </button>
                            
                            <AnimatePresence>
                              {openMenuId === item.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  transition={{ duration: 0.1 }}
                                  className="absolute right-0 mt-1 w-44 glass-panel rounded-xl shadow-2xl z-40 p-1 flex flex-col gap-0.5 text-left"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {item.status !== "Maintenance" && (
                                    <button
                                      onClick={() => { handleChangeStatus(item, "Maintenance"); setOpenMenuId(null); }}
                                      className="w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider text-amber-400 hover:bg-white/5 transition-colors cursor-pointer"
                                    >
                                      Send to Repair
                                    </button>
                                  )}
                                  {item.status === "Maintenance" && (
                                    <button
                                      onClick={() => { handleChangeStatus(item, "Available"); setOpenMenuId(null); }}
                                      className="w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider text-emerald-400 hover:bg-white/5 transition-colors cursor-pointer"
                                    >
                                      Mark Available
                                    </button>
                                  )}
                                  <button
                                    onClick={() => { handleDeleteAsset(item); setOpenMenuId(null); }}
                                    className="w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer flex items-center gap-1.5"
                                  >
                                    <Trash2 size={11} /> Delete Asset
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </AnimatedList>
              )}
            </div>
          ) : (
            /* Grid (Card View) wrapped in AnimatedList with Availability & Condition color-coded badges */
            <AnimatedList className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 !w-full" delayOffset={0.03}>
              {sortedItems.map(item => (
                <div key={item.id}
                  className="glass-card p-5 flex flex-col justify-between min-h-[170px] transition-all group hover:shadow-[0_8px_32px_-8px_rgba(99,102,241,0.2)] hover:border-indigo-500/30"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <div className="p-2 rounded-xl bg-zinc-900/60 border border-white/5">
                          {item.category === "Cameras" && <Camera size={14} className="text-teal-400" />}
                          {item.category === "Lighting" && <Lightbulb size={14} className="text-indigo-400" />}
                          {item.category === "Audio" && <Mic size={14} className="text-purple-400" />}
                          {item.category === "Rigging" && <Box size={14} className="text-amber-400" />}
                          {item.category === "Accessories" && <Box size={14} className="text-zinc-400" />}
                        </div>
                        {/* Condition Badge with suitable colors in Card View */}
                        <span className={`inline-flex px-2 py-0.5 text-[9px] font-bold rounded border ${
                          item.condition === "Good" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                          item.condition === "Fair" ? "bg-zinc-800 text-zinc-300 border-zinc-700/50" :
                          item.condition === "Poor" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                          item.condition === "Need Repair" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                          "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}>{item.condition}</span>
                      </div>
                      {/* Availability Badge with suitable colors in Card View */}
                      <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase border rounded-full ${
                        item.status === "Available" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        item.status === "Checked Out" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                        "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}>{item.status}</span>
                    </div>
                    
                    <h4 className="text-sm font-bold text-zinc-200 mt-4 mb-1 truncate">{item.name}</h4>
                    
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-zinc-500 font-mono">{item.serial_number}</span>
                      {item.status === "Available" && (
                        <button
                          onClick={() => { setSelectedItem(item); setShowRequestModal(true); }}
                          className="text-[9px] font-bold text-teal-400 hover:text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 px-2 py-1 rounded transition-colors cursor-pointer"
                        >
                          Request
                        </button>
                      )}
                    </div>
                  </div>

                  {item.status === "Checked Out" && (
                    <div className="mt-4 border-t border-white/5 pt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center text-[9px] font-bold text-indigo-400">
                          {item.assignee_name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                        </div>
                        <span className="text-[10px] text-zinc-400 truncate max-w-[90px]">{item.assignee_name}</span>
                      </div>
                      <button
                        onClick={() => handleMarkReturned(item)}
                        className="flex items-center gap-1 text-[9px] font-bold text-teal-400 hover:text-teal-350 bg-teal-500/10 hover:bg-teal-500/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        <RotateCcw size={10} /> Return
                      </button>
                    </div>
                  )}

                  {item.status === "Maintenance" && (
                    <div className="mt-4 border-t border-white/5 pt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[9px] font-semibold text-red-400">
                        <Wrench size={11} /> Under Repair
                      </div>
                      <button
                        onClick={() => handleChangeStatus(item, "Available")}
                        className="text-[9px] font-bold text-emerald-400 hover:text-emerald-355 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded transition-colors cursor-pointer"
                      >
                        Ready
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </AnimatedList>
          )}
        </div>
      )}

      {/* 6. Booking Schedule view wrapped in AnimatedList */}
      {activeTab === "schedule" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider m-0">Active Bookings</h3>
            <span className="text-[10px] text-zinc-500 font-semibold">{allBookings.length} total</span>
          </div>

          {allBookings.length === 0 ? (
            <div className="glass-panel rounded-2xl p-12 text-center text-zinc-500 text-xs">
              <Calendar size={28} className="mx-auto mb-2 text-zinc-700" />
              No active bookings recorded.
            </div>
          ) : (
            <AnimatedList className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 !w-full" delayOffset={0.03}>
              {allBookings.map(booking => (
                <div key={booking.id} className="glass-card p-5 flex flex-col justify-between min-h-[150px] relative overflow-hidden group hover:border-indigo-500/20">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-[40px] rounded-full pointer-events-none" />
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">Equipment Booking</span>
                        <h4 className="text-sm font-bold text-zinc-200 mt-1 truncate max-w-[200px]">{booking.item_name}</h4>
                      </div>
                      <span className={`px-2 py-0.5 text-[9px] font-bold uppercase border rounded-full ${
                        booking.status === "approved" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        booking.status === "pending" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                        booking.status === "declined" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                        "bg-zinc-800 text-zinc-500 border-white/5"
                      }`}>{booking.status}</span>
                    </div>

                    <div className="text-xs text-zinc-400 mt-4 leading-relaxed">
                      <strong>Borrower:</strong> {booking.user_name}
                      {booking.purpose && (
                        <div className="mt-1 text-zinc-500 leading-normal">
                          <strong>Purpose:</strong> &ldquo;{booking.purpose}&rdquo;
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 border-t border-white/5 pt-3 flex items-center justify-between text-[10px] text-zinc-500 font-medium">
                    <div className="flex items-center gap-1">
                      <Clock size={11} className="text-zinc-650" />
                      <span>{booking.requested_date}</span>
                    </div>
                    {booking.due_date && (
                      <div className="text-teal-400/80">
                        Due: {new Date(booking.due_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </AnimatedList>
          )}
        </div>
      )}


      {/* ─── Modals ─── */}

      {/* Add Equipment Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowAddModal(false)}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg glass-panel rounded-3xl shadow-2xl overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 relative z-10">
                <div>
                  <h2 className="text-base font-bold text-white m-0">Add Asset</h2>
                  <p className="text-[11px] text-zinc-550 m-0 mt-0.5">Step {currentStep} of 2 — Register new equipment</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAdd} className="p-6 flex flex-col gap-4">
                {currentStep === 1 ? (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Equipment Photo</label>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl border border-white/5 bg-zinc-950/40 flex items-center justify-center overflow-hidden">
                          {imagePreviewUrl ? (
                            <img src={imagePreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <Camera size={20} className="text-zinc-650" />
                          )}
                        </div>
                        <label className="cursor-pointer bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 px-3 py-1.5 rounded-lg text-xs text-zinc-300 font-semibold transition-all">
                          Choose File
                          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                        </label>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Equipment Name *</label>
                      <input required type="text" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="e.g. Sony FX6 Cinema Camera"
                        className="bg-zinc-950/60 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none transition-all font-sans" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Category</label>
                        <select value={addForm.category} onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))}
                          className="bg-zinc-950/60 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 focus:outline-none transition-all font-sans cursor-pointer">
                          {CATEGORIES.filter(c => c !== "All").map(c => (
                            <option key={c} value={c} className="bg-zinc-900">{c}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Condition</label>
                        <select value={addForm.condition} onChange={e => setAddForm(f => ({ ...f, condition: e.target.value as any }))}
                          className="bg-zinc-950/60 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 focus:outline-none transition-all font-sans cursor-pointer">
                          <option className="bg-zinc-900" value="Good">Good</option>
                          <option className="bg-zinc-900" value="Fair">Fair</option>
                          <option className="bg-zinc-900" value="Poor">Poor</option>
                          <option className="bg-zinc-900" value="Damaged">Damaged</option>
                          <option className="bg-zinc-900" value="Need Repair">Need Repair</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Status</label>
                        <select value={addForm.status} onChange={e => setAddForm(f => ({ ...f, status: e.target.value as EquipmentItem["status"] }))}
                          className="bg-zinc-950/60 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 focus:outline-none transition-all font-sans cursor-pointer">
                          <option className="bg-zinc-900" value="Available">Available</option>
                          <option className="bg-zinc-900" value="Checked Out">Checked Out</option>
                          <option className="bg-zinc-900" value="Maintenance">Maintenance</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Quantity</label>
                        <input required type="number" min="1" value={addForm.quantity} onChange={e => setAddForm(f => ({ ...f, quantity: e.target.value }))}
                          className="bg-zinc-950/60 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 focus:outline-none transition-all font-sans" />
                      </div>
                    </div>

                    <button type="button" onClick={() => setCurrentStep(2)} disabled={!addForm.name.trim()}
                      className="mt-2 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-teal-500 hover:from-indigo-500 hover:to-teal-400 disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer">
                      Next Details
                    </button>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Brand</label>
                        <input type="text" value={addForm.brand} onChange={e => setAddForm(f => ({ ...f, brand: e.target.value }))}
                          placeholder="e.g. Sony"
                          className="bg-zinc-950/60 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none transition-all font-sans" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Model</label>
                        <input type="text" value={addForm.model} onChange={e => setAddForm(f => ({ ...f, model: e.target.value }))}
                          placeholder="e.g. FX6"
                          className="bg-zinc-950/60 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none transition-all font-sans" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Purchase Price ($)</label>
                        <input type="number" step="0.01" value={addForm.purchase_price} onChange={e => setAddForm(f => ({ ...f, purchase_price: e.target.value }))}
                          placeholder="0.00"
                          className="bg-zinc-950/60 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none transition-all font-sans" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Serial Number</label>
                        <input type="text" value={addForm.serial_number} onChange={e => setAddForm(f => ({ ...f, serial_number: e.target.value }))}
                          placeholder="e.g. SN-FX6-9041"
                          className="bg-zinc-950/60 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none transition-all font-sans" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Location</label>
                        <input type="text" value={addForm.location} onChange={e => setAddForm(f => ({ ...f, location: e.target.value }))}
                          placeholder="e.g. Studio A"
                          className="bg-zinc-950/60 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none transition-all font-sans" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Purchase Date</label>
                        <input type="date" value={addForm.purchase_date} onChange={e => setAddForm(f => ({ ...f, purchase_date: e.target.value }))}
                          className="bg-zinc-950/60 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 focus:outline-none transition-all font-sans [color-scheme:dark]" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Description</label>
                      <textarea value={addForm.description} onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))}
                        rows={2} placeholder="Additional notes about the equipment..."
                        className="bg-zinc-950/60 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none transition-all font-sans resize-none" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <button type="button" onClick={() => setCurrentStep(1)}
                        className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-semibold py-2.5 rounded-xl transition-all cursor-pointer">
                        Back
                      </button>
                      <button type="submit" disabled={adding || uploadingImage}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-teal-500 hover:from-indigo-500 hover:to-teal-400 disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer">
                        {adding || uploadingImage ? <Loader2 size={14} className="animate-spin" /> : <PackagePlus size={14} />}
                        {adding || uploadingImage ? "Saving..." : "Add to Inventory"}
                      </button>
                    </div>
                  </>
                )}
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Request Equipment Modal */}
      <AnimatePresence>
        {showRequestModal && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowRequestModal(false)}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md glass-panel rounded-3xl shadow-2xl overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 relative z-10">
                <div>
                  <h2 className="text-base font-bold text-white m-0">Request Asset</h2>
                  <p className="text-[11px] text-zinc-550 m-0 mt-0.5">Submit checkout booking for approval</p>
                </div>
                <button onClick={() => setShowRequestModal(false)} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer">
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleRequest} className="p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Item Name</label>
                  <div className="bg-zinc-950/60 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-zinc-400 font-bold cursor-not-allowed">
                    {selectedItem.name}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Purpose / Project *</label>
                  <textarea required value={requestForm.purpose} onChange={e => setRequestForm(f => ({ ...f, purpose: e.target.value }))}
                    rows={3} placeholder="Please explain what this asset will be used for..."
                    className="bg-zinc-950/60 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none transition-all font-sans resize-none" />
                </div>
                <button type="submit" disabled={requesting || !requestForm.purpose.trim()}
                  className="mt-2 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-teal-500 hover:from-indigo-500 hover:to-teal-400 disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer font-sans"
                >
                  {requesting ? <Loader2 size={14} className="animate-spin" /> : <ClipboardList size={14} />}
                  {requesting ? "Submitting..." : "Submit Checkout Request"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Requests Modal Panel */}
      <AnimatePresence>
        {showRequestsModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowRequestsModal(false)}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg glass-panel rounded-3xl shadow-2xl overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-72 h-72 bg-teal-500/10 blur-[90px] rounded-full pointer-events-none" />
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 relative z-10">
                <div>
                  <h2 className="text-base font-bold text-white m-0">Checkout Requests</h2>
                  <p className="text-[11px] text-zinc-550 m-0 mt-0.5">
                    {user?.role === "manager"
                      ? "Manage and approve pending equipment checkout requests"
                      : "Track your active and pending equipment checkout requests"
                    }
                  </p>
                </div>
                <button onClick={() => setShowRequestsModal(false)} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 max-h-[450px] overflow-y-auto flex flex-col gap-4">
                {requests.length === 0 ? (
                  <div className="text-center py-10 text-zinc-500 text-xs">
                    <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-600" />
                    No pending requests at this time.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {requests.map(req => {
                      const isAdmin = user?.role === "manager";
                      return (
                        <div key={req.id} className="bg-zinc-950/40 border border-white/5 p-4 rounded-xl flex flex-col gap-3 transition-all">
                          <div>
                            <div className="text-xs font-bold text-zinc-200">{req.item_name}</div>
                            <div className="text-[10px] text-zinc-500 mt-1">
                              Requested by <strong>{req.user_name}</strong>
                              {req.purpose && <span className="text-zinc-500 block mt-0.5">&ldquo;{req.purpose}&rdquo;</span>}
                            </div>
                            <div className="text-[9px] text-zinc-500 mt-1.5">{req.requested_date}</div>
                          </div>
                          
                          {isAdmin ? (
                            <div className="grid grid-cols-2 gap-2 mt-1">
                              <button
                                onClick={() => handleRequestAction(req, "approve")}
                                className="py-2 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/25 text-teal-400 text-[10px] font-bold transition-all cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRequestAction(req, "decline")}
                                className="py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-455 text-[10px] font-bold transition-all cursor-pointer"
                              >
                                Decline
                              </button>
                            </div>
                          ) : (
                            <div className="mt-1 text-[9px] font-semibold text-zinc-500">
                              Status: <span className="text-amber-400 uppercase">Pending Review</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
