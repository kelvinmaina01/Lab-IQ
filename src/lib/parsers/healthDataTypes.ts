/**
 * Health Data Types - EHR and Public Health Data Patterns
 * Optimized for Electronic Health Records, clinical data, and public health analysis
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type HealthDataCategory =
    | 'demographics'      // Patient demographics (age, gender, race)
    | 'clinical'          // Clinical observations & vitals
    | 'laboratory'        // Lab results and tests
    | 'epidemiological'   // Disease surveillance & outbreak data
    | 'administrative'    // Claims, billing, encounters
    | 'genomic'           // Genetic/genomic data
    | 'survey'            // Health surveys (BRFSS, NHANES style)
    | 'environmental'     // Environmental health factors
    | 'pharmacy'          // Medication & prescription data
    | 'imaging'           // Radiology/imaging metadata
    | 'general';          // Non-health-specific data

export type HealthDataType =
    // Standard types
    | 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'null' | 'mixed'
    // Clinical code types
    | 'icd10_code' | 'icd9_code' | 'cpt_code' | 'loinc_code' | 'snomed_code'
    | 'rxnorm_code' | 'ndc_code' | 'hcpcs_code'
    // Identifier types
    | 'mrn' | 'npi' | 'patient_id' | 'encounter_id' | 'facility_id'
    // Clinical types
    | 'vital_sign' | 'lab_result' | 'diagnosis' | 'procedure' | 'medication'
    // Demographic types
    | 'age' | 'gender' | 'race_ethnicity' | 'geographic'
    // PHI indicators (Protected Health Information)
    | 'phi_name' | 'phi_address' | 'phi_ssn' | 'phi_dob' | 'phi_contact' | 'phi_mrn';

export interface HealthFieldInfo {
    name: string;
    detectedType: HealthDataType;
    category: HealthDataCategory;
    isPHI: boolean;
    confidence: number; // 0-1
    standardCode?: string; // e.g., "LOINC:12345-6"
    description?: string;
}

export interface HealthMetadata {
    category: HealthDataCategory;
    phiFields: string[];
    clinicalCodes: { column: string; codeType: string; sampleValues: string[] }[];
    sensitivityLevel: 'public' | 'limited' | 'restricted' | 'phi';
    detectedStandards: string[]; // e.g., ["HL7", "FHIR", "CDISC"]
    recommendations: string[];
}

// =============================================================================
// EHR FIELD PATTERNS - Column Name Detection
// =============================================================================

export const EHR_FIELD_PATTERNS: Record<string, { pattern: RegExp; type: HealthDataType; category: HealthDataCategory; isPHI: boolean }> = {
    // === IDENTIFIERS ===
    medical_record_number: {
        pattern: /^(mrn|medical_record|patient_id|patientid|pt_id|subject_id|person_id)$/i,
        type: 'mrn',
        category: 'administrative',
        isPHI: true
    },
    encounter_id: {
        pattern: /^(encounter_id|visit_id|admission_id|case_id|episode_id)$/i,
        type: 'encounter_id',
        category: 'administrative',
        isPHI: false
    },
    provider_npi: {
        pattern: /^(npi|national_provider|provider_npi|physician_npi)$/i,
        type: 'npi',
        category: 'administrative',
        isPHI: false
    },

    // === DEMOGRAPHICS (PHI) ===
    patient_name: {
        pattern: /^(name|patient_name|first_name|last_name|full_name|given_name|family_name)$/i,
        type: 'phi_name',
        category: 'demographics',
        isPHI: true
    },
    date_of_birth: {
        pattern: /^(dob|birth_date|date_of_birth|birthdate|birth_dt|patient_dob)$/i,
        type: 'phi_dob',
        category: 'demographics',
        isPHI: true
    },
    ssn: {
        pattern: /^(ssn|social_security|social_security_number|ss_number)$/i,
        type: 'phi_ssn',
        category: 'demographics',
        isPHI: true
    },
    address: {
        pattern: /^(address|street|street_address|home_address|addr|address_line)$/i,
        type: 'phi_address',
        category: 'demographics',
        isPHI: true
    },
    contact: {
        pattern: /^(phone|telephone|mobile|cell|email|e_mail|fax|contact)$/i,
        type: 'phi_contact',
        category: 'demographics',
        isPHI: true
    },

    // === DEMOGRAPHICS (Non-PHI) ===
    age: {
        pattern: /^(age|patient_age|age_years|age_at_visit|age_at_diagnosis|age_group)$/i,
        type: 'age',
        category: 'demographics',
        isPHI: false
    },
    gender: {
        pattern: /^(sex|gender|biological_sex|patient_sex|patient_gender)$/i,
        type: 'gender',
        category: 'demographics',
        isPHI: false
    },
    race_ethnicity: {
        pattern: /^(race|ethnicity|race_ethnicity|ethnic_group|racial_group)$/i,
        type: 'race_ethnicity',
        category: 'demographics',
        isPHI: false
    },
    geographic: {
        pattern: /^(zip|zipcode|postal_code|county|fips|state|region|country|city)$/i,
        type: 'geographic',
        category: 'demographics',
        isPHI: false // Note: ZIP+4 or small areas can be PHI
    },

    // === VITAL SIGNS ===
    blood_pressure: {
        pattern: /^(bp|blood_pressure|systolic|diastolic|sbp|dbp|bp_systolic|bp_diastolic)$/i,
        type: 'vital_sign',
        category: 'clinical',
        isPHI: false
    },
    heart_rate: {
        pattern: /^(hr|heart_rate|pulse|pulse_rate|bpm)$/i,
        type: 'vital_sign',
        category: 'clinical',
        isPHI: false
    },
    temperature: {
        pattern: /^(temp|temperature|body_temp|body_temperature)$/i,
        type: 'vital_sign',
        category: 'clinical',
        isPHI: false
    },
    weight: {
        pattern: /^(wt|weight|body_weight|mass|patient_weight)$/i,
        type: 'vital_sign',
        category: 'clinical',
        isPHI: false
    },
    height: {
        pattern: /^(ht|height|body_height|stature|patient_height)$/i,
        type: 'vital_sign',
        category: 'clinical',
        isPHI: false
    },
    bmi: {
        pattern: /^(bmi|body_mass_index)$/i,
        type: 'vital_sign',
        category: 'clinical',
        isPHI: false
    },
    respiratory_rate: {
        pattern: /^(rr|resp_rate|respiratory_rate|breathing_rate)$/i,
        type: 'vital_sign',
        category: 'clinical',
        isPHI: false
    },
    oxygen_saturation: {
        pattern: /^(spo2|o2_sat|oxygen_sat|oxygen_saturation|pulse_ox)$/i,
        type: 'vital_sign',
        category: 'clinical',
        isPHI: false
    },

    // === LAB RESULTS ===
    glucose: {
        pattern: /^(glucose|blood_sugar|blood_glucose|fasting_glucose|hba1c|a1c|glycated_hgb)$/i,
        type: 'lab_result',
        category: 'laboratory',
        isPHI: false
    },
    cholesterol: {
        pattern: /^(chol|cholesterol|total_cholesterol|ldl|hdl|triglycerides|lipid)$/i,
        type: 'lab_result',
        category: 'laboratory',
        isPHI: false
    },
    hemoglobin: {
        pattern: /^(hgb|hemoglobin|hematocrit|hct|rbc|wbc|platelet)$/i,
        type: 'lab_result',
        category: 'laboratory',
        isPHI: false
    },
    creatinine: {
        pattern: /^(creatinine|creat|bun|gfr|egfr|kidney)$/i,
        type: 'lab_result',
        category: 'laboratory',
        isPHI: false
    },
    liver_enzymes: {
        pattern: /^(alt|ast|alp|bilirubin|albumin|liver)$/i,
        type: 'lab_result',
        category: 'laboratory',
        isPHI: false
    },

    // === CLINICAL CODES ===
    icd10_diagnosis: {
        pattern: /^(icd10|icd_10|diagnosis_code|dx_code|icd10_code|primary_diagnosis)$/i,
        type: 'icd10_code',
        category: 'clinical',
        isPHI: false
    },
    icd9_diagnosis: {
        pattern: /^(icd9|icd_9|icd9_code)$/i,
        type: 'icd9_code',
        category: 'clinical',
        isPHI: false
    },
    cpt_procedure: {
        pattern: /^(cpt|cpt_code|procedure_code|proc_code)$/i,
        type: 'cpt_code',
        category: 'clinical',
        isPHI: false
    },
    loinc_lab: {
        pattern: /^(loinc|loinc_code|test_code|lab_code)$/i,
        type: 'loinc_code',
        category: 'laboratory',
        isPHI: false
    },
    medication: {
        pattern: /^(medication|drug|rx|prescription|med_name|drug_name|rxnorm|ndc)$/i,
        type: 'medication',
        category: 'pharmacy',
        isPHI: false
    },

    // === DATES & TIMES ===
    service_date: {
        pattern: /^(service_date|visit_date|admission_date|discharge_date|encounter_date|dos)$/i,
        type: 'datetime',
        category: 'administrative',
        isPHI: false
    },
    diagnosis_date: {
        pattern: /^(diagnosis_date|dx_date|onset_date|symptom_date)$/i,
        type: 'datetime',
        category: 'clinical',
        isPHI: false
    },

    // === EPIDEMIOLOGICAL ===
    case_status: {
        pattern: /^(case_status|confirmed|probable|suspected|case_classification)$/i,
        type: 'string',
        category: 'epidemiological',
        isPHI: false
    },
    disease: {
        pattern: /^(disease|condition|illness|reportable_condition|notifiable_disease)$/i,
        type: 'string',
        category: 'epidemiological',
        isPHI: false
    },
    outbreak: {
        pattern: /^(outbreak|cluster|epidemic|event_id)$/i,
        type: 'string',
        category: 'epidemiological',
        isPHI: false
    }
};

// =============================================================================
// CLINICAL CODE VALUE PATTERNS - Content Detection
// =============================================================================

export const CLINICAL_CODE_PATTERNS: Record<string, { pattern: RegExp; description: string }> = {
    ICD10: {
        pattern: /^[A-TV-Z][0-9][0-9AB]\.?[0-9A-TV-Z]{0,4}$/,
        description: 'ICD-10-CM/PCS diagnosis/procedure code'
    },
    ICD9: {
        pattern: /^[0-9]{3}\.?[0-9]{0,2}$|^[VE][0-9]{2}\.?[0-9]{0,2}$/,
        description: 'ICD-9-CM diagnosis code'
    },
    CPT: {
        pattern: /^[0-9]{5}[A-Z]?$/,
        description: 'CPT procedure code'
    },
    HCPCS: {
        pattern: /^[A-V][0-9]{4}$/,
        description: 'HCPCS Level II code'
    },
    LOINC: {
        pattern: /^[0-9]{4,5}-[0-9]$/,
        description: 'LOINC laboratory/clinical code'
    },
    SNOMED: {
        pattern: /^[0-9]{6,18}$/,
        description: 'SNOMED CT concept ID'
    },
    RxNorm: {
        pattern: /^[0-9]{5,7}$/,
        description: 'RxNorm medication code'
    },
    NDC: {
        pattern: /^[0-9]{4,5}-[0-9]{3,4}-[0-9]{1,2}$/,
        description: 'National Drug Code'
    },
    NPI: {
        pattern: /^[0-9]{10}$/,
        description: 'National Provider Identifier'
    }
};

// =============================================================================
// PHI DETECTION - For Compliance Awareness
// =============================================================================

export const PHI_INDICATORS: Record<string, { pattern: RegExp; riskLevel: 'high' | 'medium' | 'low' }> = {
    name: {
        pattern: /^(name|patient_name|first_name|last_name|full_name|given_name|family_name)$/i,
        riskLevel: 'high'
    },
    address: {
        pattern: /^(address|street|street_address|home_address|addr|city|state|zip|postal)$/i,
        riskLevel: 'high'
    },
    ssn: {
        pattern: /^(ssn|social_security|social_security_number|ss_number|ss_num)$/i,
        riskLevel: 'high'
    },
    phone: {
        pattern: /^(phone|telephone|mobile|cell|fax|contact_number)$/i,
        riskLevel: 'high'
    },
    email: {
        pattern: /^(email|e_mail|email_address|electronic_mail)$/i,
        riskLevel: 'high'
    },
    dob: {
        pattern: /^(dob|birth_date|date_of_birth|birthdate)$/i,
        riskLevel: 'high'
    },
    mrn: {
        pattern: /^(mrn|medical_record|patient_id|patientid|chart_number)$/i,
        riskLevel: 'high'
    },
    account: {
        pattern: /^(account|account_number|member_id|insurance_id|policy_number)$/i,
        riskLevel: 'medium'
    },
    provider_name: {
        pattern: /^(provider_name|physician_name|doctor_name|attending)$/i,
        riskLevel: 'low'
    }
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Detect health data type from column name
 */
export function detectHealthFieldType(columnName: string): HealthFieldInfo | null {
    const normalizedName = columnName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

    for (const [key, config] of Object.entries(EHR_FIELD_PATTERNS)) {
        if (config.pattern.test(normalizedName) || config.pattern.test(columnName)) {
            return {
                name: columnName,
                detectedType: config.type,
                category: config.category,
                isPHI: config.isPHI,
                confidence: 0.9,
                description: key.replace(/_/g, ' ')
            };
        }
    }

    return null;
}

/**
 * Detect clinical code type from value
 */
export function detectClinicalCodeType(value: string): { codeType: string; description: string } | null {
    const cleanValue = value.trim().toUpperCase();

    for (const [codeType, config] of Object.entries(CLINICAL_CODE_PATTERNS)) {
        if (config.pattern.test(cleanValue)) {
            return { codeType, description: config.description };
        }
    }

    return null;
}

/**
 * Check if column is likely PHI
 */
export function isPotentialPHI(columnName: string): { isPHI: boolean; riskLevel: 'high' | 'medium' | 'low' | 'none' } {
    const normalizedName = columnName.trim().toLowerCase();

    for (const [, config] of Object.entries(PHI_INDICATORS)) {
        if (config.pattern.test(normalizedName)) {
            return { isPHI: true, riskLevel: config.riskLevel };
        }
    }

    return { isPHI: false, riskLevel: 'none' };
}

/**
 * Analyze dataset and generate health metadata
 */
export function analyzeHealthData(
    columns: string[],
    sampleRows: Record<string, any>[]
): HealthMetadata {
    const phiFields: string[] = [];
    const clinicalCodes: { column: string; codeType: string; sampleValues: string[] }[] = [];
    const detectedStandards: string[] = [];
    const recommendations: string[] = [];

    let primaryCategory: HealthDataCategory = 'general';
    const categoryCounts: Record<HealthDataCategory, number> = {} as Record<HealthDataCategory, number>;

    // Analyze each column
    for (const column of columns) {
        // Check column name patterns
        const fieldInfo = detectHealthFieldType(column);
        if (fieldInfo) {
            categoryCounts[fieldInfo.category] = (categoryCounts[fieldInfo.category] || 0) + 1;

            if (fieldInfo.isPHI) {
                phiFields.push(column);
            }
        }

        // Check sample values for clinical codes
        const sampleValues = sampleRows
            .slice(0, 20)
            .map(row => row[column])
            .filter(v => v != null && v !== '')
            .map(v => String(v));

        if (sampleValues.length > 0) {
            const codeDetection = detectClinicalCodeType(sampleValues[0]);
            if (codeDetection) {
                // Verify with more samples
                const matchCount = sampleValues.filter(v =>
                    CLINICAL_CODE_PATTERNS[codeDetection.codeType]?.pattern.test(v.trim().toUpperCase())
                ).length;

                if (matchCount / sampleValues.length > 0.7) {
                    clinicalCodes.push({
                        column,
                        codeType: codeDetection.codeType,
                        sampleValues: sampleValues.slice(0, 5)
                    });
                    detectedStandards.push(codeDetection.codeType);
                }
            }
        }
    }

    // Determine primary category
    const sortedCategories = Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a);

    if (sortedCategories.length > 0 && sortedCategories[0][1] > 0) {
        primaryCategory = sortedCategories[0][0] as HealthDataCategory;
    }

    // Determine sensitivity level
    let sensitivityLevel: 'public' | 'limited' | 'restricted' | 'phi' = 'public';
    if (phiFields.length > 0) {
        sensitivityLevel = 'phi';
    } else if (clinicalCodes.some(c => ['ICD10', 'CPT', 'LOINC'].includes(c.codeType))) {
        sensitivityLevel = 'limited';
    }

    // Generate recommendations
    if (phiFields.length > 0) {
        recommendations.push(`⚠️ ${phiFields.length} potential PHI field(s) detected. Consider de-identification before sharing.`);
    }
    if (clinicalCodes.length > 0) {
        recommendations.push(`📊 Clinical codes detected: ${[...new Set(clinicalCodes.map(c => c.codeType))].join(', ')}`);
    }
    if (primaryCategory === 'laboratory') {
        recommendations.push('🧪 Lab data detected. Consider using LOINC mapping for standardization.');
    }
    if (primaryCategory === 'epidemiological') {
        recommendations.push('📈 Epidemiological data detected. Suitable for outbreak analysis and trend monitoring.');
    }

    return {
        category: primaryCategory,
        phiFields,
        clinicalCodes,
        sensitivityLevel,
        detectedStandards: [...new Set(detectedStandards)],
        recommendations
    };
}

// =============================================================================
// FILE TYPE DETECTION
// =============================================================================

export const HEALTH_FILE_TYPES = {
    CSV: { extensions: ['.csv'], mimeTypes: ['text/csv'] },
    EXCEL: { extensions: ['.xlsx', '.xls'], mimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'] },
    JSON: { extensions: ['.json'], mimeTypes: ['application/json'] },
    HL7: { extensions: ['.hl7', '.hl7v2'], mimeTypes: ['application/hl7-v2'] },
    FHIR: { extensions: ['.fhir.json', '.ndjson'], mimeTypes: ['application/fhir+json', 'application/x-ndjson'] },
    XML: { extensions: ['.xml', '.cda'], mimeTypes: ['application/xml', 'text/xml'] },
    TSV: { extensions: ['.tsv', '.txt'], mimeTypes: ['text/tab-separated-values'] }
};

/**
 * Detect health file format from file object
 */
export function detectHealthFileFormat(file: File): { format: string; isHealthFormat: boolean } {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const mimeType = file.type.toLowerCase();

    for (const [format, config] of Object.entries(HEALTH_FILE_TYPES)) {
        if (config.extensions.includes(extension) || config.mimeTypes.includes(mimeType)) {
            const isHealthFormat = ['HL7', 'FHIR', 'CDA'].includes(format);
            return { format, isHealthFormat };
        }
    }

    return { format: 'UNKNOWN', isHealthFormat: false };
}
