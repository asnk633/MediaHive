import { z } from 'zod';

export const FileSchema = z.object({
    id: z.string(),
    name: z.string().optional(),
    originalName: z.string().optional(),
    file_name: z.string().optional(),
    size: z.number().optional(),
    fileSize: z.number().optional(),
    type: z.string().optional(),
    fileType: z.string().optional(),
    storageUrl: z.string().optional(),
    fileUrl: z.string().optional(),
    downloadUrl: z.string().optional(),
    storagePath: z.string().optional(),
    uploadedDate: z.string().optional(),
    created_at: z.string().optional(),
    uploaded_by: z.any().optional(),
    tenant_id: z.string().optional(),
    taskId: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
});

export type FileDTO = z.infer<typeof FileSchema>;
