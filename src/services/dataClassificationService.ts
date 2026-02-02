'use client';

export type DataClassification = 'PHI' | 'PII' | 'PCI' | 'SENSITIVE' | 'OPERATIONAL' | 'PUBLIC';

export interface FieldMetadata {
    fieldName: string;
    classification: DataClassification;
    retentionYears: number;
    maskingRule: 'none' | 'partial' | 'full';
    encryptionRequired: boolean;
}

export const DATA_REGISTRY: Record<string, Record<string, FieldMetadata>> = {
    user: {
        email: { fieldName: 'email', classification: 'PII', retentionYears: 7, maskingRule: 'partial', encryptionRequired: true },
        displayName: { fieldName: 'displayName', classification: 'PII', retentionYears: 7, maskingRule: 'none', encryptionRequired: false },
        role: { fieldName: 'role', classification: 'OPERATIONAL', retentionYears: 7, maskingRule: 'none', encryptionRequired: false }
    },
    task: {
        title: { fieldName: 'title', classification: 'OPERATIONAL', retentionYears: 7, maskingRule: 'none', encryptionRequired: false },
        description: { fieldName: 'description', classification: 'SENSITIVE', retentionYears: 7, maskingRule: 'none', encryptionRequired: true },
        comments: { fieldName: 'comments', classification: 'SENSITIVE', retentionYears: 7, maskingRule: 'none', encryptionRequired: true }
    }
};

/**
 * DataClassificationService: Enforces regulatory data handling rules.
 */
export class DataClassificationService {
    /**
     * Mask data based on registry rules for UI display.
     */
    static maskValue(entityType: string, fieldName: string, value: any): any {
        const field = DATA_REGISTRY[entityType]?.[fieldName];
        if (!field || field.maskingRule === 'none') return value;

        if (typeof value !== 'string') return value;

        if (field.maskingRule === 'full') return '********';

        if (field.maskingRule === 'partial') {
            if (value.includes('@')) { // Mask email
                const [parts, domain] = value.split('@');
                return `${parts[0]}***@${domain}`;
            }
            return value.slice(0, 2) + '***' + value.slice(-2);
        }

        return value;
    }

    /**
     * Check if a field requires field-level encryption.
     */
    static requiresEncryption(entityType: string, fieldName: string): boolean {
        return DATA_REGISTRY[entityType]?.[fieldName]?.encryptionRequired ?? false;
    }
}
