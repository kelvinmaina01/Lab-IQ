/**
 * XML Parser Service
 * Handles parsing of various XML formats (HL7-like, Clinical Data, Experiment Results)
 * Converts to JSON for system processing
 */

export interface ParsedXMLResult {
    success: boolean;
    type?: string;
    data?: any;
    error?: string;
}

class XMLParser {
    private static instance: XMLParser;
    private parser: DOMParser;

    private constructor() {
        this.parser = new DOMParser();
    }

    public static getInstance(): XMLParser {
        if (!XMLParser.instance) {
            XMLParser.instance = new XMLParser();
        }
        return XMLParser.instance;
    }

    /**
     * Parse raw XML string into JSON object
     */
    public parse(xmlString: string): ParsedXMLResult {
        try {
            const xmlDoc = this.parser.parseFromString(xmlString, "text/xml");

            // Check for parse errors
            const parseError = xmlDoc.getElementsByTagName("parsererror");
            if (parseError.length > 0) {
                return { success: false, error: "XML Parse Error: " + parseError[0].textContent };
            }

            // Determine root type
            const root = xmlDoc.documentElement;
            const rootName = root.nodeName;

            let data;
            if (rootName === 'clinical_data') {
                data = this.parseClinicalData(root);
            } else if (rootName === 'experiment_results') {
                data = this.parseExperimentResults(root);
            } else {
                // Generic parse
                data = this.xmlToJson(root);
            }

            return {
                success: true,
                type: rootName,
                data: data
            };

        } catch (error) {
            console.error('XML Parser Error:', error);
            return {
                success: false,
                error: String(error)
            };
        }
    }

    /**
     * Generic XML to JSON converter (Recursive)
     */
    private xmlToJson(xml: Node): any {
        // Create the return object
        let obj: any = {};

        if (xml.nodeType === 1) { // element
            const element = xml as Element;

            // Attributes
            if (element.attributes.length > 0) {
                obj["@attributes"] = {};
                for (let j = 0; j < element.attributes.length; j++) {
                    const attribute = element.attributes.item(j);
                    if (attribute) {
                        obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
                    }
                }
            }
        }
        else if (xml.nodeType === 3) { // text
            obj = xml.nodeValue?.trim();
        }

        // Children
        if (xml.hasChildNodes()) {
            for (let i = 0; i < xml.childNodes.length; i++) {
                const item = xml.childNodes.item(i);
                const nodeName = item.nodeName;

                if (nodeName === '#text') {
                    const textContent = item.nodeValue?.trim();
                    if (textContent) {
                        // If element has text content, handle mixed content or just text
                        if (Object.keys(obj).length === 0) {
                            obj = textContent;
                        } else {
                            if (!obj['#text']) obj['#text'] = [];
                            obj['#text'].push(textContent);
                        }
                    }
                    continue;
                }

                const json = this.xmlToJson(item);

                // If the key already exists, convert to array
                if (typeof obj[nodeName] === "undefined") {
                    obj[nodeName] = json;
                } else {
                    if (typeof obj[nodeName].push === "undefined") {
                        const old = obj[nodeName];
                        obj[nodeName] = [];
                        obj[nodeName].push(old);
                    }
                    obj[nodeName].push(json);
                }
            }
        }

        return obj;
    }

    /**
     * Specialized parser for clinical data structure
     */
    private parseClinicalData(root: Element): any {
        const patients = [];
        const patientNodes = root.getElementsByTagName('patient');

        for (let i = 0; i < patientNodes.length; i++) {
            const node = patientNodes[i];
            const patient: any = {
                id: node.getAttribute('id'),
                vitals: {},
                labs: []
            };

            // Vitals
            const vitalsNode = node.getElementsByTagName('vitals')[0];
            if (vitalsNode) {
                for (let j = 0; j < vitalsNode.children.length; j++) {
                    const vital = vitalsNode.children[j];
                    patient.vitals[vital.nodeName] = {
                        value: vital.textContent,
                        unit: vital.getAttribute('unit')
                    };
                }
            }

            // Labs
            const labsNode = node.getElementsByTagName('lab_results')[0];
            if (labsNode) {
                const results = labsNode.getElementsByTagName('result');
                for (let j = 0; j < results.length; j++) {
                    const result = results[j];
                    patient.labs.push({
                        test: result.getAttribute('test'),
                        value: result.textContent,
                        unit: result.getAttribute('unit'),
                        flag: result.getAttribute('flag')
                    });
                }
            }

            patients.push(patient);
        }

        return { patients };
    }

    /**
     * Specialized parser for experiment results
     */
    private parseExperimentResults(root: Element): any {
        const experiment = {
            id: root.getAttribute('id'),
            date: root.getAttribute('date'),
            samples: [] as any[]
        };

        const samples = root.getElementsByTagName('sample');
        for (let i = 0; i < samples.length; i++) {
            const sample = samples[i];
            const measurements: any = {};

            const measureNodes = sample.getElementsByTagName('measurement');
            for (let j = 0; j < measureNodes.length; j++) {
                const m = measureNodes[j];
                measurements[m.getAttribute('type') || 'unknown'] = {
                    value: parseFloat(m.textContent || '0'),
                    unit: m.getAttribute('unit')
                };
            }

            experiment.samples.push({
                id: sample.getAttribute('id'),
                measurements
            });
        }

        return experiment;
    }
}

export const xmlParser = XMLParser.getInstance();
