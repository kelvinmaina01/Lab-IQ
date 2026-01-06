/**
 * Branding Utility - Centralized logos and names for Lab-IQ data sources.
 */

export interface BrandInfo {
    name: string;
    logoUrl: string;
    color?: string;
}

export const DATA_SOURCE_BRANDS: Record<string, BrandInfo> = {
    // Files
    csv: { name: "CSV Spreadsheet", logoUrl: "https://cdn.simpleicons.org/microsoftexcel" },
    hl7: { name: "HL7 Message", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/2/25/FHIR_logo.svg" },

    // Databases
    postgresql: { name: "PostgreSQL", logoUrl: "https://cdn.simpleicons.org/postgresql" },
    mysql: { name: "MySQL", logoUrl: "https://cdn.simpleicons.org/mysql" },
    sqlserver: { name: "SQL Server", logoUrl: "https://cdn.simpleicons.org/microsoftsqlserver" },
    oracle: { name: "Oracle", logoUrl: "https://cdn.simpleicons.org/oracle" },
    supabase: { name: "Supabase", logoUrl: "https://cdn.simpleicons.org/supabase/3ECF8E" },
    redis: { name: "Redis", logoUrl: "https://cdn.simpleicons.org/redis" },

    // Warehouse
    bigquery: { name: "Google BigQuery", logoUrl: "https://cdn.simpleicons.org/googlecloud" },
    snowflake: { name: "Snowflake", logoUrl: "https://cdn.simpleicons.org/snowflake/29B5E8" },
    redshift: { name: "AWS Redshift", logoUrl: "https://cdn.simpleicons.org/amazons3" },
    s3: { name: "Amazon S3", logoUrl: "https://cdn.simpleicons.org/amazons3" },
    azure: { name: "Azure Blob", logoUrl: "https://cdn.simpleicons.org/microsoftazure" },

    // Clinical / Enterprise
    fhir: { name: "FHIR API", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/2/25/FHIR_logo.svg" },
    epic: { name: "Epic EHR", logoUrl: "https://www.vectorlogo.zone/logos/epic/epic-icon.svg" },
    cerner: { name: "Oracle Cerner", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/c/c5/Oracle_Cerner_logo.svg" },
    googledrive: { name: "Google Drive", logoUrl: "https://cdn.simpleicons.org/googledrive" },
    biobank: { name: "UK Biobank", logoUrl: "https://www.ukbiobank.ac.uk/media/3133/uk-biobank-logo.png" },

    // Live Devices
    applehealth: { name: "Apple Health", logoUrl: "https://cdn.simpleicons.org/apple/FF3B30" },
    fitbit: { name: "Fitbit", logoUrl: "https://cdn.simpleicons.org/fitbit/00B0B9" },
    oura: { name: "Oura", logoUrl: "https://cdn.simpleicons.org/ouraring" },
    dexcom: { name: "Dexcom", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Dexcom_logo.svg/1024px-Dexcom_logo.svg.png" }
};

export const getBrandInfo = (provider: string): BrandInfo | null => {
    return DATA_SOURCE_BRANDS[provider.toLowerCase()] || null;
};
