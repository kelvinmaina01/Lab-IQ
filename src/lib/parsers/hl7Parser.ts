/**
 * HL7 v2.x Parser
 * Parses HL7 messages into structured JSON
 */

export interface HL7Segment {
    name: string;
    fields: string[];
}

export interface HL7Message {
    segments: HL7Segment[];
    raw: string;
}

export const parseHL7 = async (file: File): Promise<any[]> => {
    const text = await file.text();
    // HL7 usually delimits segments with \r, but sometimes \n or \r\n are used in processed files
    const lines = text.split(/\r\n|\r|\n/).filter(line => line.trim().length > 0);

    const segments: HL7Segment[] = lines.map(line => {
        // Standard HL7 field separator is |
        const fields = line.split('|');
        const name = fields[0];
        // Remove the segment name from the fields list for cleaner indexing if desired, 
        // but standard usually keeps them or treats the first pipe as field separator.
        // For MSF, the separator itself is a field. 
        // We'll just keep simple split for now.
        return {
            name,
            fields: fields.slice(1)
        };
    });

    // Convert to a flat tabular format for the "dataset" view
    // We'll attempt to flatten common segments like PID, OBR, OBX
    const rows: any[] = [];

    // Simple heuristic: One row per OBX (Observation) or just specific segments
    // For general data analysis, we try to create a table where each row is a message or an observation

    // Strategy: Flatten segments into columns
    // e.g. MSH.7 (Date), PID.3 (ID), PID.5 (Name)

    const parsedData: any = {};

    segments.forEach((seg, index) => {
        // Handle repeating segments by appending index or creating arrays
        // For simple CSV-like conversion, we might just take the first instance of each
        if (!parsedData[seg.name]) {
            parsedData[seg.name] = seg.fields;
        } else {
            // If duplicate segment (like OBX), make it an array
            if (!Array.isArray(parsedData[seg.name][0])) {
                parsedData[seg.name] = [parsedData[seg.name]];
            }
            parsedData[seg.name].push(seg.fields);
        }
    });

    // Better approach for Data Analysis: Return the raw segments as a JSON structure 
    // AND a normalized "preview" row

    // We will return a list of "messages" if the file contains multiple MSH segments
    // But usually one file = one message?
    // If multiple MSH, split by MSH

    // Simple: Return list of objects, one per line (Segment View)
    // Or return fields. 

    // Let's return a "Segment Table"
    return segments.map(seg => ({
        Segment: seg.name,
        ...seg.fields.reduce((acc, field, i) => ({ ...acc, [`Field_${i + 1}`]: field }), {})
    }));
};
