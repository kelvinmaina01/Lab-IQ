/**
 * Anonymization Service - PHI/PII Detection and Masking
 * 
 * Per Blueprint Phase 1, Step 3: Anonymization
 * Detects and masks Protected Health Information (PHI) and 
 * Personally Identifiable Information (PII)
 * 
 * IMPORTANT: This is a helper tool for compliance awareness.
 * It is NOT a HIPAA certification tool.
 */

import CryptoJS from 'crypto-js';

// =============================================================================
// TYPES
// =============================================================================

export interface PHIDetectionResult {
    phiFields: string[];
    piiFields: string[];
    sensitivityLevel: 'public' | 'limited' | 'restricted' | 'phi';
    warnings: string[];
}

export interface AnonymizationResult {
    anonymizedRows: Record<string, any>[];
    fieldsAnonymized: string[];
    anonymizationLog: AnonymizationLogEntry[];
}

export interface AnonymizationLogEntry {
    field: string;
    method: 'hash' | 'mask' | 'generalize' | 'suppress';
    originalType: string;
    timestamp: string;
}

export type AnonymizationMethod = 'hash' | 'mask' | 'generalize' | 'suppress';

// =============================================================================
// PHI/PII PATTERNS
// =============================================================================

const PHI_COLUMN_PATTERNS: Record<string, RegExp> = {
    // Direct Identifiers
    name: /^(name|patient_name|first_name|last_name|full_name|given_name|family_name|middle_name)$/i,
    ssn: /^(ssn|social_security|social_security_number|ss_number)$/i,
    mrn: /^(mrn|medical_record|medical_record_number|patient_id|patientid|hospital_id)$/i,

    // Contact Information
    phone: /^(phone|telephone|mobile|cell|fax|contact_number|phone_number)$/i,
    email: /^(email|e_mail|email_address|mail|electronic_mail)$/i,
    address: /^(address|street|street_address|home_address|mailing_address|addr|residence)$/i,

    // Geographic (Smaller than State)
    zipcode: /^(zip|zipcode|zip_code|postal|postal_code)$/i,
    city: /^(city|town|municipality)$/i,

    // Dates
    dob: /^(dob|birth_date|date_of_birth|birthdate|born|birthday)$/i,
    admission_date: /^(admission_date|admit_date|admission|discharge_date)$/i,
    death_date: /^(death_date|deceased_date|date_of_death|dod)$/i,

    // Other Identifiers
    device_id: /^(device_id|device_identifier|serial_number|imei|mac_address)$/i,
    ip_address: /^(ip|ip_address|ipv4|ipv6|client_ip)$/i,
    account_number: /^(account|account_number|account_id|member_id|subscriber_id)$/i,

    // Biometric
    fingerprint: /^(fingerprint|biometric|face_id|retina)$/i,
    photo: /^(photo|image|picture|photograph|headshot)$/i,

    // Genetic
    genetic: /^(dna|genetic|genome|genotype)$/i
};

const PII_VALUE_PATTERNS: Record<string, RegExp> = {
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    phone: /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/,
    ssn: /^\d{3}-?\d{2}-?\d{4}$/,
    creditCard: /^\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}$/,
    ipv4: /^(\d{1,3}\.){3}\d{1,3}$/,
    zipcode: /^\d{5}(-\d{4})?$/,
};

// =============================================================================
// ANONYMIZATION SERVICE CLASS
// =============================================================================

class AnonymizationService {
    private salt: string;

    constructor() {
        // Generate a random salt for hashing (in production, this would be stored securely)
        this.salt = 'labiq_' + Date.now().toString(36);
    }

    /**
     * Detect PHI/PII fields in dataset
     */
    detectPHI(
        columnNames: string[],
        sampleRows: Record<string, any>[]
    ): PHIDetectionResult {
        const phiFields: string[] = [];
        const piiFields: string[] = [];
        const warnings: string[] = [];

        // Check column names against PHI patterns
        for (const colName of columnNames) {
            for (const [phiType, pattern] of Object.entries(PHI_COLUMN_PATTERNS)) {
                if (pattern.test(colName)) {
                    phiFields.push(colName);
                    warnings.push(`Column "${colName}" appears to contain ${phiType.replace(/_/g, ' ')}`);
                    break;
                }
            }
        }

        // Check sample values for PII patterns
        for (const colName of columnNames) {
            if (phiFields.includes(colName)) continue;

            const sampleValues = sampleRows
                .map(row => row[colName])
                .filter(v => v != null && v !== '')
                .slice(0, 50);

            for (const [piiType, pattern] of Object.entries(PII_VALUE_PATTERNS)) {
                const matches = sampleValues.filter(v =>
                    typeof v === 'string' && pattern.test(v)
                );

                if (matches.length > sampleValues.length * 0.3) {
                    piiFields.push(colName);
                    warnings.push(`Column "${colName}" contains values matching ${piiType} pattern`);
                    break;
                }
            }
        }

        // Determine sensitivity level
        let sensitivityLevel: 'public' | 'limited' | 'restricted' | 'phi' = 'public';
        if (phiFields.length > 0) {
            sensitivityLevel = 'phi';
        } else if (piiFields.length > 0) {
            sensitivityLevel = 'restricted';
        } else if (this.hasQuasiIdentifiers(columnNames)) {
            sensitivityLevel = 'limited';
        }

        return { phiFields, piiFields, sensitivityLevel, warnings };
    }

    /**
     * Check for quasi-identifiers (can be combined to identify individuals)
     */
    private hasQuasiIdentifiers(columnNames: string[]): boolean {
        const quasiPatterns = [
            /age/i, /gender/i, /sex/i, /race/i, /ethnicity/i,
            /occupation/i, /education/i, /income/i
        ];

        let count = 0;
        for (const col of columnNames) {
            if (quasiPatterns.some(p => p.test(col))) {
                count++;
            }
        }

        return count >= 3; // 3+ quasi-identifiers = re-identification risk
    }

    /**
     * Anonymize data by applying appropriate methods to PHI fields
     */
    anonymizeData(
        rows: Record<string, any>[],
        phiFields: string[],
        methods?: Record<string, AnonymizationMethod>
    ): AnonymizationResult {
        const log: AnonymizationLogEntry[] = [];
        const defaultMethods: Record<string, AnonymizationMethod> = {};

        // Determine default method for each field
        for (const field of phiFields) {
            if (PHI_COLUMN_PATTERNS.name?.test(field)) {
                defaultMethods[field] = 'mask';
            } else if (PHI_COLUMN_PATTERNS.dob?.test(field)) {
                defaultMethods[field] = 'generalize';
            } else if (PHI_COLUMN_PATTERNS.ssn?.test(field)) {
                defaultMethods[field] = 'hash';
            } else if (PHI_COLUMN_PATTERNS.email?.test(field)) {
                defaultMethods[field] = 'mask';
            } else if (PHI_COLUMN_PATTERNS.phone?.test(field)) {
                defaultMethods[field] = 'mask';
            } else if (PHI_COLUMN_PATTERNS.address?.test(field)) {
                defaultMethods[field] = 'suppress';
            } else if (PHI_COLUMN_PATTERNS.zipcode?.test(field)) {
                defaultMethods[field] = 'generalize';
            } else {
                defaultMethods[field] = 'hash';
            }
        }

        const methodsToUse = { ...defaultMethods, ...methods };

        // Apply anonymization
        const anonymizedRows = rows.map(row => {
            const newRow = { ...row };

            for (const field of phiFields) {
                const value = row[field];
                if (value == null) continue;

                const method = methodsToUse[field] || 'hash';
                newRow[field] = this.applyAnonymization(value, method, field);
            }

            return newRow;
        });

        // Create log entries
        for (const field of phiFields) {
            log.push({
                field,
                method: methodsToUse[field] || 'hash',
                originalType: typeof rows[0]?.[field],
                timestamp: new Date().toISOString()
            });
        }

        return {
            anonymizedRows,
            fieldsAnonymized: phiFields,
            anonymizationLog: log
        };
    }

    /**
     * Apply specific anonymization method
     */
    private applyAnonymization(
        value: any,
        method: AnonymizationMethod,
        fieldName: string
    ): any {
        const strValue = String(value);

        switch (method) {
            case 'hash':
                return this.hashValue(strValue);

            case 'mask':
                return this.maskValue(strValue, fieldName);

            case 'generalize':
                return this.generalizeValue(value, fieldName);

            case 'suppress':
                return '[REDACTED]';

            default:
                return this.hashValue(strValue);
        }
    }

    /**
     * Hash a value using SHA-256
     */
    private hashValue(value: string): string {
        const hash = CryptoJS.SHA256(value + this.salt).toString();
        return hash.substring(0, 16); // Return first 16 chars
    }

    /**
     * Mask a value (partial redaction)
     */
    private maskValue(value: string, fieldName: string): string {
        const lower = fieldName.toLowerCase();

        // Email masking: j***@example.com
        if (lower.includes('email') && value.includes('@')) {
            const [local, domain] = value.split('@');
            return local[0] + '***@' + domain;
        }

        // Phone masking: ***-***-1234
        if (lower.includes('phone') || lower.includes('mobile')) {
            const digits = value.replace(/\D/g, '');
            if (digits.length >= 4) {
                return '***-***-' + digits.slice(-4);
            }
        }

        // Name masking: J. Doe
        if (lower.includes('name')) {
            const parts = value.split(' ').filter(p => p);
            if (parts.length >= 2) {
                return parts[0][0] + '. ' + parts[parts.length - 1];
            } else if (parts.length === 1) {
                return parts[0][0] + '***';
            }
        }

        // Default: show first char, mask rest
        if (value.length <= 2) return '**';
        return value[0] + '*'.repeat(value.length - 2) + value[value.length - 1];
    }

    /**
     * Generalize a value (reduce precision)
     */
    private generalizeValue(value: any, fieldName: string): any {
        const lower = fieldName.toLowerCase();

        // DOB → Age bracket
        if (lower.includes('dob') || lower.includes('birth')) {
            try {
                const birthDate = new Date(value);
                const today = new Date();
                const age = today.getFullYear() - birthDate.getFullYear();

                if (age < 18) return '0-17';
                if (age < 30) return '18-29';
                if (age < 45) return '30-44';
                if (age < 60) return '45-59';
                if (age < 75) return '60-74';
                return '75+';
            } catch {
                return 'Unknown';
            }
        }

        // Zipcode → 3-digit prefix
        if (lower.includes('zip')) {
            const zip = String(value).replace(/\D/g, '');
            if (zip.length >= 3) {
                return zip.substring(0, 3) + '00';
            }
        }

        // Age → Bracket
        if (lower === 'age') {
            const age = parseInt(value, 10);
            if (isNaN(age)) return 'Unknown';

            const bracket = Math.floor(age / 10) * 10;
            return `${bracket}-${bracket + 9}`;
        }

        return '[GENERALIZED]';
    }

    /**
     * Generate an anonymization report for compliance
     */
    generateAnonymizationReport(
        datasetId: string,
        result: AnonymizationResult
    ): string {
        const report = `
# Anonymization Report

**Dataset ID:** ${datasetId}  
**Generated:** ${new Date().toISOString()}  

## Summary

| Field | Method | Original Type |
|-------|--------|--------------|
${result.anonymizationLog.map(entry =>
            `| ${entry.field} | ${entry.method} | ${entry.originalType} |`
        ).join('\n')}

## Methods Applied

- **Hash**: SHA-256 with salt (irreversible)
- **Mask**: Partial redaction preserving format
- **Generalize**: Reduce precision (e.g., age brackets)
- **Suppress**: Complete removal

## Compliance Notes

This anonymization uses HIPAA Safe Harbor methodology where applicable.
For expert determination, consult a qualified statistician.

---
*This report was automatically generated by LabIQ Health.*
    `.trim();

        return report;
    }
}

export const anonymizationService = new AnonymizationService();
