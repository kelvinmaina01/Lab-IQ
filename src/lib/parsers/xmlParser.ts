/**
 * XML Parser
 * Parses XML files for health data ingestion
 * 
 * Supports:
 * - Standard XML structures
 * - HL7/FHIR-like health data formats
 * - Nested arrays and objects
 * - Attribute handling
 */

import { ColumnInfo, ParserOptions, DataType } from './types';

// =============================================================================
// TYPES
// =============================================================================

interface XMLParseOptions extends ParserOptions {
    /** Root element to use as data source (optional) */
    rootElement?: string;
    /** Whether to preserve attributes as separate columns */
    preserveAttributes?: boolean;
    /** Flatten nested objects to dot-notation columns */
    flattenNested?: boolean;
    /** Maximum nesting depth to flatten */
    maxFlattenDepth?: number;
}

interface XMLParserResult {
    success: boolean;
    data: Record<string, unknown>[];
    columns: Partial<ColumnInfo>[];
    rowCount: number;
    errors?: string[];
    warnings?: string[];
    metadata?: Record<string, unknown>;
}

// =============================================================================
// XML PARSER CLASS
// =============================================================================

export class XMLParser {
    private options: XMLParseOptions;

    constructor(options: Partial<XMLParseOptions> = {}) {
        this.options = {
            hasHeader: true,
            preserveAttributes: true,
            flattenNested: true,
            maxFlattenDepth: 3,
            ...options,
        };
    }

    /**
     * Parse XML string to structured data
     */
    async parse(xmlString: string): Promise<XMLParserResult> {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(xmlString, 'application/xml');

            // Check for parse errors
            const parseError = doc.querySelector('parsererror');
            if (parseError) {
                throw new Error(`XML Parse Error: ${parseError.textContent}`);
            }

            // Find the root data element
            const rootElement = this.findDataRoot(doc);
            if (!rootElement) {
                throw new Error('Could not find data root element in XML');
            }

            // Extract rows from repeating elements
            const rows = this.extractRows(rootElement);
            if (rows.length === 0) {
                return {
                    success: true,
                    data: [],
                    columns: [],
                    rowCount: 0,
                    warnings: ['No data rows found in XML'],
                };
            }

            // Infer columns from the data
            const columns = this.inferColumns(rows);

            // Normalize rows to match column structure
            const normalizedRows = rows.map(row => this.normalizeRow(row, columns));

            return {
                success: true,
                data: normalizedRows,
                columns,
                rowCount: normalizedRows.length,
                metadata: {
                    format: 'xml',
                    rootElement: rootElement.tagName,
                    originalRowCount: rows.length,
                },
            };
        } catch (error) {
            return {
                success: false,
                data: [],
                columns: [],
                rowCount: 0,
                errors: [error instanceof Error ? error.message : 'Unknown XML parsing error'],
            };
        }
    }

    /**
     * Parse XML file
     */
    async parseFile(file: File): Promise<XMLParserResult> {
        try {
            const text = await file.text();
            const result = await this.parse(text);

            return {
                ...result,
                metadata: {
                    ...result.metadata,
                    fileName: file.name,
                    fileSize: file.size,
                },
            };
        } catch (error) {
            return {
                success: false,
                data: [],
                columns: [],
                rowCount: 0,
                errors: [error instanceof Error ? error.message : 'Failed to read XML file'],
            };
        }
    }

    /**
     * Find the root element containing data rows
     */
    private findDataRoot(doc: Document): Element | null {
        // If user specified a root element, use that
        if (this.options.rootElement) {
            return doc.querySelector(this.options.rootElement);
        }

        // Common health data root elements
        const commonRoots = [
            'records', 'data', 'dataset', 'entries', 'items',
            'patients', 'observations', 'measurements', 'readings',
            'Bundle', 'feed', 'results', 'rows', 'table'
        ];

        for (const rootName of commonRoots) {
            const element = doc.querySelector(rootName);
            if (element && element.children.length > 0) {
                return element;
            }
        }

        // Fall back to document element if it has repeating children
        const docElement = doc.documentElement;
        if (docElement && docElement.children.length > 1) {
            // Check if children have the same tag name (repeating elements)
            const firstChildTag = docElement.children[0]?.tagName;
            const isRepeating = Array.from(docElement.children).every(
                child => child.tagName === firstChildTag
            );
            if (isRepeating) {
                return docElement;
            }
        }

        return docElement;
    }

    /**
     * Extract rows from repeating child elements
     */
    private extractRows(rootElement: Element): Record<string, unknown>[] {
        const children = Array.from(rootElement.children);

        if (children.length === 0) {
            return [];
        }

        // Find the most common child tag name (these are our rows)
        const tagCounts = new Map<string, number>();
        children.forEach(child => {
            const count = tagCounts.get(child.tagName) || 0;
            tagCounts.set(child.tagName, count + 1);
        });

        // Get the tag with most occurrences
        let maxTag = '';
        let maxCount = 0;
        tagCounts.forEach((count, tag) => {
            if (count > maxCount) {
                maxCount = count;
                maxTag = tag;
            }
        });

        // Extract data from each row element
        const rowElements = children.filter(child => child.tagName === maxTag);
        return rowElements.map(el => this.elementToObject(el));
    }

    /**
     * Convert an XML element to a JavaScript object
     */
    private elementToObject(element: Element, depth: number = 0): Record<string, unknown> {
        const obj: Record<string, unknown> = {};
        const maxDepth = this.options.maxFlattenDepth || 3;

        // Handle attributes
        if (this.options.preserveAttributes && element.attributes.length > 0) {
            Array.from(element.attributes).forEach(attr => {
                obj[`@${attr.name}`] = this.parseValue(attr.value);
            });
        }

        // Handle child elements
        const children = Array.from(element.children);

        if (children.length === 0) {
            // Leaf node - get text content
            const textContent = element.textContent?.trim();
            if (textContent) {
                return { value: this.parseValue(textContent) };
            }
            return obj;
        }

        // Group children by tag name
        const childGroups = new Map<string, Element[]>();
        children.forEach(child => {
            const existing = childGroups.get(child.tagName) || [];
            existing.push(child);
            childGroups.set(child.tagName, existing);
        });

        childGroups.forEach((elements, tagName) => {
            if (elements.length === 1) {
                // Single element
                const childObj = this.elementToObject(elements[0], depth + 1);

                // Flatten or nest based on options and depth
                if (this.options.flattenNested && depth < maxDepth) {
                    if (Object.keys(childObj).length === 1 && 'value' in childObj) {
                        obj[tagName] = childObj.value;
                    } else {
                        // Flatten nested object with dot notation
                        Object.entries(childObj).forEach(([key, value]) => {
                            obj[`${tagName}.${key}`] = value;
                        });
                    }
                } else {
                    obj[tagName] = childObj;
                }
            } else {
                // Multiple elements with same tag - create array
                obj[tagName] = elements.map(el => {
                    const childObj = this.elementToObject(el, depth + 1);
                    if (Object.keys(childObj).length === 1 && 'value' in childObj) {
                        return childObj.value;
                    }
                    return childObj;
                });
            }
        });

        return obj;
    }

    /**
     * Parse a string value to appropriate type
     */
    private parseValue(value: string): unknown {
        const trimmed = value.trim();

        // Boolean
        if (trimmed.toLowerCase() === 'true') return true;
        if (trimmed.toLowerCase() === 'false') return false;

        // Null
        if (trimmed.toLowerCase() === 'null' || trimmed === '') return null;

        // Number
        const num = Number(trimmed);
        if (!isNaN(num) && trimmed !== '') return num;

        // Date (ISO format)
        if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
            const date = new Date(trimmed);
            if (!isNaN(date.getTime())) {
                return date.toISOString();
            }
        }

        // String
        return trimmed;
    }

    /**
     * Infer column information from parsed rows
     */
    private inferColumns(rows: Record<string, unknown>[]): ColumnInfo[] {
        const columnMap = new Map<string, ColumnInfo>();

        rows.forEach(row => {
            Object.entries(row).forEach(([key, value]) => {
                if (!columnMap.has(key)) {
                    columnMap.set(key, {
                        name: key,
                        column_name: key,
                        data_type: this.inferDataType(value),
                        nullable: value === null || value === undefined,
                        unique_values_count: 0,
                    });
                } else {
                    // Update nullable if we see null values
                    const existing = columnMap.get(key)!;
                    if (value === null || value === undefined) {
                        existing.nullable = true;
                    }
                }
            });
        });

        return Array.from(columnMap.values());
    }

    /**
     * Infer data type from a value
     */
    private inferDataType(value: unknown): string {
        if (value === null || value === undefined) return 'string';
        if (typeof value === 'boolean') return 'boolean';
        if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'float';
        if (Array.isArray(value)) return 'array';
        if (typeof value === 'object') return 'object';

        // Check if string looks like a date
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
            return 'datetime';
        }

        return 'string';
    }

    /**
     * Normalize a row to match the column structure
     */
    private normalizeRow(row: Record<string, unknown>, columns: ColumnInfo[]): Record<string, unknown> {
        const normalized: Record<string, unknown> = {};

        columns.forEach(col => {
            normalized[col.name] = row[col.name] ?? null;
        });

        return normalized;
    }
}

// =============================================================================
// CONVENIENCE FUNCTION
// =============================================================================

/**
 * Parse XML string to data array
 */
export async function parseXML(
    xmlString: string,
    options?: Partial<XMLParseOptions>
): Promise<XMLParserResult> {
    const parser = new XMLParser(options);
    return parser.parse(xmlString);
}

/**
 * Parse XML file to data array
 */
export async function parseXMLFile(
    file: File,
    options?: Partial<XMLParseOptions>
): Promise<XMLParserResult> {
    const parser = new XMLParser(options);
    return parser.parseFile(file);
}

export default XMLParser;
