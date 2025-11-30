# Phase 1 Implementation Plan: Data Foundation

**Duration:** 4 weeks  
**Goal:** Build production-ready data ingestion and processing pipeline  
**Priority:** CRITICAL - Blocks all other features

---

## 🎯 OBJECTIVES

By the end of Phase 1, Lab-IQ will be able to:
1. ✅ Accept file uploads (CSV, Excel, JSON, XML)
2. ✅ Parse and validate data automatically
3. ✅ Detect schema and data types
4. ✅ Store data in Supabase with proper structure
5. ✅ Calculate data quality scores
6. ✅ Perform basic statistical analysis
7. ✅ Display real data in charts and tables

---

## 📋 WEEK 1: File Upload & Parsing

### **Task 1.1: CSV Parser Implementation**
**Files to create/modify:**
- `src/lib/parsers/csvParser.ts`
- `src/lib/parsers/types.ts`

**Dependencies to install:**
```bash
npm install papaparse @types/papaparse
```

**Implementation:**
```typescript
// src/lib/parsers/types.ts
export interface ParsedData {
  headers: string[];
  rows: Record<string, any>[];
  rowCount: number;
  columnCount: number;
  dataTypes: Record<string, DataType>;
  errors: ParseError[];
}

export type DataType = 'string' | 'number' | 'boolean' | 'date' | 'null';

export interface ParseError {
  row: number;
  column: string;
  message: string;
}

// src/lib/parsers/csvParser.ts
import Papa from 'papaparse';

export async function parseCSV(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = processParseResults(results);
        resolve(parsed);
      },
      error: (error) => reject(error)
    });
  });
}

function processParseResults(results: any): ParsedData {
  // Detect data types
  // Validate data
  // Return structured data
}
```

**Testing:**
- Test with 100-row CSV
- Test with 10,000-row CSV
- Test with malformed CSV
- Test with missing values
- Test with special characters

---

### **Task 1.2: Excel Parser Implementation**
**Files to create:**
- `src/lib/parsers/excelParser.ts`

**Dependencies:**
```bash
npm install xlsx
```

**Implementation:**
```typescript
import * as XLSX from 'xlsx';

export async function parseExcel(file: File): Promise<ParsedData> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet);
  
  return processData(jsonData);
}
```

---

### **Task 1.3: JSON & XML Parsers**
**Files to create:**
- `src/lib/parsers/jsonParser.ts`
- `src/lib/parsers/xmlParser.ts`

**Dependencies:**
```bash
npm install fast-xml-parser
```

---

### **Task 1.4: Schema Detection**
**Files to create:**
- `src/lib/analysis/schemaDetector.ts`

**Implementation:**
```typescript
export interface SchemaInfo {
  columnName: string;
  dataType: DataType;
  nullable: boolean;
  unique: boolean;
  min?: number;
  max?: number;
  avgLength?: number;
  sampleValues: any[];
}

export function detectSchema(data: Record<string, any>[]): SchemaInfo[] {
  // Analyze each column
  // Detect data type (string, number, date, boolean)
  // Calculate statistics
  // Identify unique columns
  // Return schema information
}
```

---

## 📋 WEEK 2: Data Storage & Database Schema

### **Task 2.1: Enhanced Database Schema**
**Files to create:**
- `supabase/migrations/20250130_enhanced_schema.sql`

**Tables to create/enhance:**

```sql
-- Enhanced datasets table
CREATE TABLE IF NOT EXISTS datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  row_count INTEGER,
  column_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'processing', -- processing, ready, error
  error_message TEXT
);

-- Dataset columns (schema)
CREATE TABLE IF NOT EXISTS dataset_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  column_name TEXT NOT NULL,
  column_index INTEGER NOT NULL,
  data_type TEXT NOT NULL,
  nullable BOOLEAN DEFAULT true,
  unique_values BOOLEAN DEFAULT false,
  min_value NUMERIC,
  max_value NUMERIC,
  avg_value NUMERIC,
  std_dev NUMERIC,
  null_count INTEGER DEFAULT 0,
  sample_values JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dataset rows (actual data)
CREATE TABLE IF NOT EXISTS dataset_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  row_index INTEGER NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data quality metrics
CREATE TABLE IF NOT EXISTS dataset_quality (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  completeness_score NUMERIC, -- 0-100
  consistency_score NUMERIC,
  accuracy_score NUMERIC,
  overall_score NUMERIC,
  missing_values_count INTEGER,
  duplicate_rows_count INTEGER,
  outliers_count INTEGER,
  quality_issues JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_datasets_user_id ON datasets(user_id);
CREATE INDEX idx_dataset_columns_dataset_id ON dataset_columns(dataset_id);
CREATE INDEX idx_dataset_rows_dataset_id ON dataset_rows(dataset_id);
CREATE INDEX idx_dataset_quality_dataset_id ON dataset_quality(dataset_id);
```

---

### **Task 2.2: Data Storage Service**
**Files to create:**
- `src/lib/services/datasetService.ts`

**Implementation:**
```typescript
import { supabase } from '@/integrations/supabase/client';
import { ParsedData } from '@/lib/parsers/types';

export class DatasetService {
  async saveDataset(
    userId: string,
    fileName: string,
    fileSize: number,
    fileType: string,
    parsedData: ParsedData
  ): Promise<string> {
    // 1. Create dataset record
    const { data: dataset, error: datasetError } = await supabase
      .from('datasets')
      .insert({
        user_id: userId,
        name: fileName,
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType,
        row_count: parsedData.rowCount,
        column_count: parsedData.columnCount,
        status: 'processing'
      })
      .select()
      .single();

    if (datasetError) throw datasetError;

    // 2. Save column schema
    await this.saveColumns(dataset.id, parsedData);

    // 3. Save rows (batch insert)
    await this.saveRows(dataset.id, parsedData.rows);

    // 4. Update status to ready
    await supabase
      .from('datasets')
      .update({ status: 'ready' })
      .eq('id', dataset.id);

    return dataset.id;
  }

  private async saveColumns(datasetId: string, parsedData: ParsedData) {
    const columns = Object.entries(parsedData.dataTypes).map(([name, type], index) => ({
      dataset_id: datasetId,
      column_name: name,
      column_index: index,
      data_type: type,
      // Add statistics here
    }));

    const { error } = await supabase
      .from('dataset_columns')
      .insert(columns);

    if (error) throw error;
  }

  private async saveRows(datasetId: string, rows: Record<string, any>[]) {
    // Batch insert in chunks of 1000
    const BATCH_SIZE = 1000;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE).map((row, index) => ({
        dataset_id: datasetId,
        row_index: i + index,
        data: row
      }));

      const { error } = await supabase
        .from('dataset_rows')
        .insert(batch);

      if (error) throw error;
    }
  }
}
```

---

## 📋 WEEK 3: Data Quality & Analysis

### **Task 3.1: Data Quality Analyzer**
**Files to create:**
- `src/lib/analysis/qualityAnalyzer.ts`

**Implementation:**
```typescript
export interface QualityMetrics {
  completenessScore: number; // 0-100
  consistencyScore: number;
  accuracyScore: number;
  overallScore: number;
  missingValuesCount: number;
  duplicateRowsCount: number;
  outliersCount: number;
  qualityIssues: QualityIssue[];
}

export interface QualityIssue {
  type: 'missing' | 'duplicate' | 'outlier' | 'inconsistent';
  severity: 'low' | 'medium' | 'high';
  column?: string;
  row?: number;
  description: string;
}

export class QualityAnalyzer {
  analyze(data: Record<string, any>[]): QualityMetrics {
    const completeness = this.calculateCompleteness(data);
    const consistency = this.checkConsistency(data);
    const duplicates = this.findDuplicates(data);
    const outliers = this.detectOutliers(data);

    return {
      completenessScore: completeness.score,
      consistencyScore: consistency.score,
      accuracyScore: 100, // Placeholder
      overallScore: (completeness.score + consistency.score) / 2,
      missingValuesCount: completeness.missingCount,
      duplicateRowsCount: duplicates.length,
      outliersCount: outliers.length,
      qualityIssues: [
        ...completeness.issues,
        ...consistency.issues,
        ...duplicates,
        ...outliers
      ]
    };
  }

  private calculateCompleteness(data: Record<string, any>[]) {
    let totalCells = 0;
    let missingCells = 0;
    const issues: QualityIssue[] = [];

    data.forEach((row, rowIndex) => {
      Object.entries(row).forEach(([column, value]) => {
        totalCells++;
        if (value === null || value === undefined || value === '') {
          missingCells++;
          issues.push({
            type: 'missing',
            severity: 'medium',
            column,
            row: rowIndex,
            description: `Missing value in column "${column}"`
          });
        }
      });
    });

    const score = ((totalCells - missingCells) / totalCells) * 100;
    return { score, missingCount: missingCells, issues };
  }

  private checkConsistency(data: Record<string, any>[]) {
    // Check data type consistency
    // Check format consistency (dates, numbers)
    // Check range consistency
    return { score: 95, issues: [] };
  }

  private findDuplicates(data: Record<string, any>[]): QualityIssue[] {
    const seen = new Set();
    const duplicates: QualityIssue[] = [];

    data.forEach((row, index) => {
      const key = JSON.stringify(row);
      if (seen.has(key)) {
        duplicates.push({
          type: 'duplicate',
          severity: 'low',
          row: index,
          description: `Duplicate row found`
        });
      }
      seen.add(key);
    });

    return duplicates;
  }

  private detectOutliers(data: Record<string, any>[]): QualityIssue[] {
    // Use IQR method or Z-score
    // Detect outliers in numeric columns
    return [];
  }
}
```

---

### **Task 3.2: Statistical Analysis Engine**
**Files to create:**
- `src/lib/analysis/statisticalAnalyzer.ts`

**Implementation:**
```typescript
export interface StatisticalSummary {
  column: string;
  count: number;
  mean?: number;
  median?: number;
  mode?: any;
  stdDev?: number;
  min?: number;
  max?: number;
  q1?: number;
  q3?: number;
  uniqueCount: number;
  nullCount: number;
  distribution?: { value: any; count: number }[];
}

export class StatisticalAnalyzer {
  analyzeColu mn(data: Record<string, any>[], columnName: string): StatisticalSummary {
    const values = data.map(row => row[columnName]).filter(v => v !== null && v !== undefined);
    
    const isNumeric = values.every(v => typeof v === 'number');
    
    if (isNumeric) {
      return this.analyzeNumericColumn(columnName, values as number[]);
    } else {
      return this.analyzeCategoricalColumn(columnName, values);
    }
  }

  private analyzeNumericColumn(column: string, values: number[]): StatisticalSummary {
    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const median = this.calculateMedian(sorted);
    const stdDev = this.calculateStdDev(values, mean);
    const q1 = this.calculatePercentile(sorted, 25);
    const q3 = this.calculatePercentile(sorted, 75);

    return {
      column,
      count: values.length,
      mean,
      median,
      stdDev,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      q1,
      q3,
      uniqueCount: new Set(values).size,
      nullCount: 0
    };
  }

  private analyzeCategoricalColumn(column: string, values: any[]): StatisticalSummary {
    const distribution = this.calculateDistribution(values);
    const mode = distribution[0]?.value;

    return {
      column,
      count: values.length,
      mode,
      uniqueCount: new Set(values).size,
      nullCount: 0,
      distribution: distribution.slice(0, 10) // Top 10
    };
  }

  private calculateMedian(sorted: number[]): number {
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  private calculateStdDev(values: number[], mean: number): number {
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(variance);
  }

  private calculatePercentile(sorted: number[], percentile: number): number {
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  private calculateDistribution(values: any[]): { value: any; count: number }[] {
    const counts = new Map<any, number>();
    values.forEach(v => counts.set(v, (counts.get(v) || 0) + 1));
    
    return Array.from(counts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);
  }
}
```

---

## 📋 WEEK 4: Integration & UI Updates

### **Task 4.1: Update Upload Page**
**Files to modify:**
- `src/pages/Upload.tsx`

**Changes:**
1. Integrate file parsers
2. Show parsing progress
3. Display schema preview
4. Show quality metrics
5. Save to database
6. Redirect to dataset view

---

### **Task 4.2: Create Dataset View Page**
**Files to create:**
- `src/pages/DatasetView.tsx`
- `src/components/dataset/DataTable.tsx`
- `src/components/dataset/StatisticsPanel.tsx`
- `src/components/dataset/QualityPanel.tsx`

**Features:**
- Paginated data table
- Column statistics
- Quality metrics display
- Download options
- Delete dataset

---

### **Task 4.3: Update Dashboard**
**Files to modify:**
- `src/pages/Dashboard.tsx`

**Changes:**
- Fetch real datasets from Supabase
- Display actual statistics
- Show recent uploads
- Link to dataset views

---

## 🧪 TESTING CHECKLIST

### **Unit Tests**
- [ ] CSV parser with various formats
- [ ] Excel parser with multiple sheets
- [ ] JSON parser with nested structures
- [ ] Schema detector accuracy
- [ ] Quality analyzer metrics
- [ ] Statistical calculations

### **Integration Tests**
- [ ] End-to-end file upload flow
- [ ] Database storage and retrieval
- [ ] Large file handling (10MB+)
- [ ] Concurrent uploads
- [ ] Error handling

### **Performance Tests**
- [ ] 10,000 row CSV parsing time
- [ ] 100,000 row CSV parsing time
- [ ] Database insert performance
- [ ] Query performance with indexes

---

## 📦 DELIVERABLES

### **Code**
- ✅ 4 file parsers (CSV, Excel, JSON, XML)
- ✅ Schema detection system
- ✅ Data quality analyzer
- ✅ Statistical analysis engine
- ✅ Dataset storage service
- ✅ Enhanced database schema
- ✅ Updated Upload page
- ✅ New Dataset View page
- ✅ Updated Dashboard

### **Documentation**
- ✅ API documentation for parsers
- ✅ Database schema documentation
- ✅ User guide for data upload
- ✅ Developer guide for adding new parsers

### **Tests**
- ✅ 50+ unit tests
- ✅ 20+ integration tests
- ✅ Performance benchmarks

---

## 🎯 SUCCESS CRITERIA

1. **Functionality:**
   - Users can upload CSV, Excel, JSON files
   - Data is parsed and stored correctly
   - Quality metrics are calculated
   - Statistics are displayed

2. **Performance:**
   - 10MB file parsed in < 5 seconds
   - 100,000 rows stored in < 30 seconds
   - Dashboard loads in < 2 seconds

3. **Quality:**
   - 0 critical bugs
   - 80%+ test coverage
   - All edge cases handled

4. **User Experience:**
   - Clear error messages
   - Progress indicators
   - Responsive UI
   - Mobile-friendly

---

## 🚀 NEXT PHASE PREVIEW

**Phase 2: AI & ML Integration** will build on this foundation:
- Use stored data for ML training
- Implement AutoML pipeline
- Add prediction capabilities
- Create model comparison tools

**Dependencies on Phase 1:**
- Need structured data storage ✅
- Need schema information ✅
- Need quality metrics ✅
- Need statistical analysis ✅
