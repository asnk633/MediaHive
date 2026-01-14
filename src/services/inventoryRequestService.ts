import { db } from "@/firebase/client";
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, orderBy, serverTimestamp, setDoc } from "firebase/firestore";
import { InventoryRequest } from "@/types/inventory";

const COLLECTION = "inventory_requests";

export const inventoryRequestService = {
    // Create Request (Guest)
    create: async (data: Omit<InventoryRequest, 'id' | 'createdAt' | 'status'>) => {
        const payload = {
            ...data,
            status: 'pending',
            createdAt: serverTimestamp(),
        };
        const docRef = await addDoc(collection(db, COLLECTION), payload);
        return docRef.id;
    },

    // Get All Requests (Admin) - Scoped
    getAll: async (institutionId: string) => {
        const q = query(
            collection(db, COLLECTION),
            where("institutionId", "==", institutionId),
            orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryRequest));
    },

    // Get My Requests (Guest) - Scoped
    getMyRequests: async (uid: string, institutionId: string) => {
        const q = query(
            collection(db, COLLECTION),
            where("userId", "==", uid),
            where("institutionId", "==", institutionId), // Ensure scoping query matches rules
            orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryRequest));
    },

    // Approve Request (Admin)
    approve: async (id: string, adminUid: string) => {
        const ref = doc(db, COLLECTION, id);
        await updateDoc(ref, {
            status: 'approved',
            approvedBy: adminUid,
            approvedAt: serverTimestamp()
        });
    },

    // Reject Request (Admin)
    reject: async (id: string, reason: string) => {
        const ref = doc(db, COLLECTION, id);
        await updateDoc(ref, {
            status: 'rejected',
            rejectionReason: reason
        });
    },

    // Mark as Issued (System/Admin) - Links request to issue
    markAsIssued: async (id: string, issueId: string) => {
        const ref = doc(db, COLLECTION, id);
        await updateDoc(ref, {
            status: 'issued',
            issuedIssueId: issueId
        });
    }
};
