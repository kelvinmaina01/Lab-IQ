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
    csv: { name: "CSV Spreadsheet", logoUrl: "/logos/excel.png" },
    hl7: { name: "HL7 Message", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/2/25/FHIR_logo.svg" },

    // Databases
    postgresql: { name: "PostgreSQL", logoUrl: "https://cdn.simpleicons.org/postgresql" },
    mysql: { name: "MySQL", logoUrl: "https://cdn.simpleicons.org/mysql" },
    sqlserver: { name: "SQL Server", logoUrl: "/logos/sql-server.png" },
    oracle: { name: "Oracle", logoUrl: "https://cdn.simpleicons.org/oracle" },
    supabase: { name: "Supabase", logoUrl: "https://cdn.simpleicons.org/supabase/3ECF8E" },
    redis: { name: "Redis", logoUrl: "https://cdn.simpleicons.org/redis" },
    vertica: { name: "Vertica", logoUrl: "https://cdn.simpleicons.org/hp/0096D6" },

    // Warehouse
    bigquery: { name: "Google BigQuery", logoUrl: "https://cdn.simpleicons.org/googlecloud" },
    snowflake: { name: "Snowflake", logoUrl: "https://cdn.simpleicons.org/snowflake/29B5E8" },
    databricks: { name: "Databricks", logoUrl: "https://cdn.simpleicons.org/databricks/FF3621" },
    redshift: { name: "AWS Redshift", logoUrl: "https://cdn.simpleicons.org/amazons3" },
    s3: { name: "Amazon S3", logoUrl: "https://cdn.simpleicons.org/amazons3" },
    azure: { name: "Azure Blob", logoUrl: "https://cdn.simpleicons.org/microsoftazure" },

    // Integrations
    googledrive: { name: "Google Drive", logoUrl: "https://cdn.simpleicons.org/googledrive" },
    googlesheets: { name: "Google Sheets", logoUrl: "https://cdn.simpleicons.org/googlesheets/0F9D58" },
    onedrive: { name: "Microsoft OneDrive", logoUrl: "/logos/onedrive.png" },
    sharepoint: { name: "SharePoint", logoUrl: "/logos/sharepoint.png" },
    googleads: { name: "Google Ads", logoUrl: "https://cdn.simpleicons.org/googleads/4285F4" },

    // Clinical / Enterprise
    fhir: { name: "FHIR API", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/2/25/FHIR_logo.svg" },
    epic: { name: "Epic EHR", logoUrl: "/logos/epic.png" },
    cerner: { name: "Oracle Cerner", logoUrl: "/logos/cerner.png" },
    biobank: { name: "UK Biobank", logoUrl: "https://www.ukbiobank.ac.uk/media/3133/uk-biobank-logo.png" },

    // Live Devices
    applehealth: { name: "Apple Health", logoUrl: "https://cdn.simpleicons.org/apple/FF3B30" },
    fitbit: { name: "Fitbit", logoUrl: "https://cdn.simpleicons.org/fitbit/00B0B9" },
    oura: { name: "Oura", logoUrl: "/logos/oura.png" },
    dexcom: { name: "Dexcom", logoUrl: "/logos/dexcom.png" }
};

export const getBrandInfo = (provider: string): BrandInfo | null => {
    return DATA_SOURCE_BRANDS[provider.toLowerCase()] || null;
};
