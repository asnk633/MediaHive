import { db } from "@/firebase/client";
import { collection, doc, getDocs, getDoc, addDoc, updateDoc, query, where, orderBy, serverTimestamp } from "firebase/firestore";
import { InventoryIssue, InventoryCondition } from "@/types/inventory";
import { NotificationService } from "@/services/notificationService";

const COLLECTION = "inventory_issues";

export const inventoryIssueService = {
    // Issue Item (Admin/Team)
    create: async (data: Omit<InventoryIssue, 'id' | 'issuedAt' | 'status'>) => {
        const payload = {
            ...data,
            status: 'issued',
            issuedAt: serverTimestamp(),
        };
        const docRef = await addDoc(collection(db, COLLECTION), payload);

        // Notify User (Async, don't block)
        NotificationService.createNotification({
            userId: data.issuedToUserId,
            type: 'inventory_issued',
            title: 'Equipment Issued',
            message: `You have been issued "${data.itemName}". Due: ${new Date(data.expectedReturnAt).toLocaleDateString()}.`,
            entityType: 'device_request', // Using device_request as closest match
            entityId: docRef.id,
            priority: 'medium',
            actionUrl: '/inventory'
        }).catch(err => console.error("Failed to send issue notification", err));

        return docRef.id;
    },

    // Get Active Issues (For Availability Check)
    getActiveIssues: async (institutionId?: string) => {
        // We only care about items currently 'issued'
        let q = query(collection(db, COLLECTION), where("status", "==", "issued"));

        // Scope by institution if provided (Active Users/Admins should always provide this)
        if (institutionId) {
            q = query(q, where("institutionId", "==", institutionId));
        }

        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryIssue));
    },

    // Get All Issues (History)
    getAll: async (institutionId?: string) => {
        let q = query(collection(db, COLLECTION), orderBy("issuedAt", "desc"));

        // Scope by institution
        if (institutionId) {
            // Note: Compound index might be needed: institutionId ASC, issuedAt DESC
            q = query(collection(db, COLLECTION), where("institutionId", "==", institutionId), orderBy("issuedAt", "desc"));
        }

        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryIssue));
    },

    // Return Item (Admin/Team)
    returnItem: async (id: string, conditionIn: InventoryCondition, returnedAt: Date, remarks?: string) => {
        const ref = doc(db, COLLECTION, id);

        // 1. Fetch details for notification
        let issueData: any = null;
        try {
            const snap = await getDoc(ref);
            if (snap.exists()) issueData = snap.data();
        } catch (e) {
            console.warn("Could not fetch issue for notification", e);
        }

        // 2. Update
        const payload: any = {
            status: 'returned',
            conditionIn,
            returnedAt: returnedAt
        };
        if (remarks) {
            payload.returnRemarks = remarks;
        }
        await updateDoc(ref, payload);

        // 3. Notify
        if (issueData) {
            NotificationService.createNotification({
                userId: issueData.issuedToUserId,
                type: 'inventory_returned',
                title: 'Item Returned',
                message: `Return confirmed for "${issueData.itemName}".`,
                entityType: 'device_request',
                entityId: id,
                priority: 'low',
                actionUrl: '/inventory'
            }).catch(err => console.error("Failed to send return notification", err));
        }
    }
};
