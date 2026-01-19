"""
Domain Agent - Handles domain-specific analysis for Biotech, Chemistry, Public Health, and Clinical data
"""
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from .base_agent import BaseAgent
import logging
import re

logger = logging.getLogger(__name__)


# =============================================================================
# EHR/HEALTH FIELD PATTERNS
# =============================================================================

EHR_COLUMN_PATTERNS = {
    # Identifiers (PHI)
    'mrn': re.compile(r'^(mrn|medical_record|patient_id|patientid|pt_id|subject_id|person_id)$', re.I),
    'ssn': re.compile(r'^(ssn|social_security|ss_number)$', re.I),
    'name': re.compile(r'^(name|patient_name|first_name|last_name|full_name)$', re.I),
    'dob': re.compile(r'^(dob|birth_date|date_of_birth|birthdate)$', re.I),
    'address': re.compile(r'^(address|street|home_address|city|state|zip|postal)$', re.I),
    'contact': re.compile(r'^(phone|telephone|mobile|email|fax)$', re.I),
    
    # Demographics
    'age': re.compile(r'^(age|patient_age|age_years|age_at_visit|age_group)$', re.I),
    'gender': re.compile(r'^(sex|gender|biological_sex|patient_sex)$', re.I),
    'race': re.compile(r'^(race|ethnicity|race_ethnicity)$', re.I),
    
    # Vital Signs
    'vital_bp': re.compile(r'^(bp|blood_pressure|systolic|diastolic|sbp|dbp)$', re.I),
    'vital_hr': re.compile(r'^(hr|heart_rate|pulse|bpm)$', re.I),
    'vital_temp': re.compile(r'^(temp|temperature|body_temp)$', re.I),
    'vital_weight': re.compile(r'^(wt|weight|body_weight|mass)$', re.I),
    'vital_height': re.compile(r'^(ht|height|body_height|stature)$', re.I),
    'vital_bmi': re.compile(r'^(bmi|body_mass_index)$', re.I),
    'vital_rr': re.compile(r'^(rr|resp_rate|respiratory_rate)$', re.I),
    'vital_spo2': re.compile(r'^(spo2|o2_sat|oxygen_sat|pulse_ox)$', re.I),
    
    # Clinical Codes
    'icd10': re.compile(r'^(icd10|icd_10|diagnosis_code|dx_code|primary_diagnosis)$', re.I),
    'cpt': re.compile(r'^(cpt|cpt_code|procedure_code|proc_code)$', re.I),
    'loinc': re.compile(r'^(loinc|loinc_code|test_code|lab_code)$', re.I),
    'medication': re.compile(r'^(medication|drug|rx|prescription|med_name|rxnorm|ndc)$', re.I),
    
    # Lab Results
    'lab_glucose': re.compile(r'^(glucose|blood_sugar|fasting_glucose|hba1c|a1c)$', re.I),
    'lab_lipids': re.compile(r'^(chol|cholesterol|ldl|hdl|triglycerides)$', re.I),
    'lab_cbc': re.compile(r'^(hgb|hemoglobin|hematocrit|rbc|wbc|platelet)$', re.I),
    'lab_renal': re.compile(r'^(creatinine|creat|bun|gfr|egfr)$', re.I),
    'lab_liver': re.compile(r'^(alt|ast|alp|bilirubin|albumin)$', re.I),
    
    # Epidemiological
    'case_status': re.compile(r'^(case_status|confirmed|probable|suspected|case_classification)$', re.I),
    'disease': re.compile(r'^(disease|condition|illness|reportable_condition)$', re.I),
    'outbreak': re.compile(r'^(outbreak|cluster|epidemic|event_id)$', re.I),
}

# Clinical code value patterns
CLINICAL_CODE_PATTERNS = {
    'ICD10': re.compile(r'^[A-TV-Z][0-9][0-9AB]\.?[0-9A-TV-Z]{0,4}$'),
    'ICD9': re.compile(r'^[0-9]{3}\.?[0-9]{0,2}$|^[VE][0-9]{2}\.?[0-9]{0,2}$'),
    'CPT': re.compile(r'^[0-9]{5}[A-Z]?$'),
    'LOINC': re.compile(r'^[0-9]{4,5}-[0-9]$'),
    'SNOMED': re.compile(r'^[0-9]{6,18}$'),
    'NPI': re.compile(r'^[0-9]{10}$'),
}


class DomainAgent(BaseAgent):
    """Agent responsible for detecting and analyzing domain-specific data"""
    
    def __init__(self):
        super().__init__("domain_agent", "Domain Expert Agent 🧬")
        self.supported_domains = ["biotech", "chemistry", "public_health", "clinical", "general"]
        
        # Biological plausible ranges (lower, upper)
        self.bio_ranges = {
            'vital_bp': (30, 300),          # Blood Pressure (Systolic usually max ~250)
            'vital_hr': (20, 250),          # Heart Rate
            'vital_temp': (30, 45),         # Temperature (Celsius)
            'vital_weight': (0.5, 600),     # Weight (kg) - broad range for infants to adults
            'vital_height': (20, 300),      # Height (cm)
            'vital_spo2': (50, 100),        # Oxygen Saturation
            'lab_glucose': (10, 2000),      # Glucose (mg/dL) - 2000 is extreme hyperglycemic coma
            'lab_cholesterol': (50, 1000)   # Cholesterol
        }

    async def execute(self, data: Any, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Detect domain and perform specific analysis
        """
        df = pd.DataFrame(data)
        
        # 1. Detect Domain
        domain_info = self._detect_domain(df)
        domain = domain_info["domain"]
        confidence = domain_info["confidence"]
        
        results = {
            "domain_detected": domain,
            "confidence": confidence,
            "analysis": {},
            "phi_fields": [],
            "clinical_codes": [],
            "recommendations": [],
            "consistency_issues": [],
            "range_violations": []
        }
        
        # 2. Perform Domain-Specific Analysis
        # Always run consistency checks for health domains
        if domain in ["public_health", "clinical", "general"]:
             # Heuristic: even if 'general', it might have some health columns
             consistency_report = self._check_consistency(df, domain_info)
             results["consistency_issues"] = consistency_report.get("logic_errors", [])
             results["range_violations"] = consistency_report.get("range_violations", [])
        if domain == "biotech" and confidence > 0.6:
            results["analysis"] = self._analyze_biotech(df, domain_info["columns"])
        elif domain == "chemistry" and confidence > 0.6:
            results["analysis"] = self._analyze_chemistry(df, domain_info["columns"])
        elif domain in ["public_health", "clinical"] and confidence > 0.6:
            health_analysis = self._analyze_health_data(df, domain_info)
            results["analysis"] = health_analysis.get("analysis", {})
            results["phi_fields"] = health_analysis.get("phi_fields", [])
            results["clinical_codes"] = health_analysis.get("clinical_codes", [])
            results["recommendations"] = health_analysis.get("recommendations", [])
            
            # Merge recommendations
            if results["consistency_issues"]:
                 results["recommendations"].append(f"⚠️ Found {len(results['consistency_issues'])} logical consistency issues (e.g., Male + Pregnant).")
            if results["range_violations"]:
                 results["recommendations"].append(f"⚠️ Found {len(results['range_violations'])} biological range violations.")
            
        return results
    
    def _detect_domain(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Heuristic detection of domain based on column names and content
        """
        columns = df.columns.str.lower()
        
        # === PUBLIC HEALTH / CLINICAL DETECTION ===
        health_matches = {
            'phi': [],
            'demographics': [],
            'vitals': [],
            'clinical_codes': [],
            'labs': [],
            'epidemiological': []
        }
        
        for col in df.columns:
            col_lower = col.lower()
            
            # Check PHI patterns
            for pattern_name, pattern in EHR_COLUMN_PATTERNS.items():
                if pattern.match(col_lower):
                    if pattern_name in ['mrn', 'ssn', 'name', 'dob', 'address', 'contact']:
                        health_matches['phi'].append(col)
                    elif pattern_name in ['age', 'gender', 'race']:
                        health_matches['demographics'].append(col)
                    elif pattern_name.startswith('vital_'):
                        health_matches['vitals'].append(col)
                    elif pattern_name in ['icd10', 'cpt', 'loinc', 'medication']:
                        health_matches['clinical_codes'].append(col)
                    elif pattern_name.startswith('lab_'):
                        health_matches['labs'].append(col)
                    elif pattern_name in ['case_status', 'disease', 'outbreak']:
                        health_matches['epidemiological'].append(col)
        
        # Check for clinical code values in data
        code_columns = []
        for col in df.columns:
            sample = df[col].dropna().head(20).astype(str)
            if sample.empty:
                continue
            for code_type, pattern in CLINICAL_CODE_PATTERNS.items():
                matches = sample.apply(lambda x: bool(pattern.match(x.strip().upper())))
                if matches.sum() / len(sample) > 0.7:
                    code_columns.append({'column': col, 'code_type': code_type})
                    break
        
        total_health_matches = sum(len(v) for v in health_matches.values()) + len(code_columns)
        
        # Determine if this is health data
        if total_health_matches >= 3 or len(health_matches['clinical_codes']) >= 1 or len(code_columns) >= 1:
            # Determine sub-category
            if len(health_matches['epidemiological']) > 0:
                return {
                    "domain": "public_health",
                    "confidence": min(0.9, 0.5 + total_health_matches * 0.1),
                    "columns": health_matches,
                    "code_columns": code_columns
                }
            else:
                return {
                    "domain": "clinical",
                    "confidence": min(0.9, 0.5 + total_health_matches * 0.1),
                    "columns": health_matches,
                    "code_columns": code_columns
                }
        
        # === BIOTECH DETECTION ===
        bio_keywords = ['sequence', 'seq', 'dna', 'rna', 'protein', 'gene', 'amino_acid']
        bio_cols = [col for col in df.columns if any(k in col.lower() for k in bio_keywords)]
        
        bio_content_match = 0
        if bio_cols:
            for col in bio_cols:
                sample = df[col].dropna().head(5).astype(str)
                if sample.empty: continue
                is_dna = sample.apply(lambda x: bool(re.match(r'^[ACGTN]+$', x, re.IGNORECASE))).all()
                if is_dna: bio_content_match += 1
                
        if bio_content_match > 0 or (bio_cols and len(bio_cols) >= 1):
            return {"domain": "biotech", "confidence": 0.8 if bio_content_match else 0.5, "columns": bio_cols}
        
        # === CHEMISTRY DETECTION ===
        chem_keywords = ['smiles', 'inchi', 'structure', 'mol', 'formula']
        chem_cols = [col for col in df.columns if any(k in col.lower() for k in chem_keywords)]
        
        chem_content_match = 0
        if chem_cols:
             for col in chem_cols:
                sample = df[col].dropna().head(5).astype(str)
                if sample.empty: continue
                is_smiles = sample.apply(lambda x: len(x) > 3 and any(c in x for c in '=#()[]')).all()
                if is_smiles: chem_content_match += 1

        if chem_content_match > 0 or (chem_cols and len(chem_cols) >= 1):
             return {"domain": "chemistry", "confidence": 0.8 if chem_content_match else 0.5, "columns": chem_cols}
             
        return {"domain": "general", "confidence": 1.0, "columns": []}

    def _check_consistency(self, df: pd.DataFrame, domain_info: Dict) -> Dict[str, List[str]]:
        """Check for logical errors and biological range violations"""
        logic_errors = []
        range_violations = []
        
        cols = domain_info.get("columns", {})
        
        # 1. Biological Range Checks
        vitals = cols.get('vitals', [])
        labs = cols.get('labs', [])
        
        for category, col_list in [('vitals', vitals), ('labs', labs)]:
            for col in col_list:
                # Find matching range rule
                rule_key = None
                for key in self.bio_ranges:
                    # Simple fuzzy match: if key suffix is in column name
                    # e.g. 'vital_bp' rule matches 'systolic_bp' column? 
                    # This is naive, let's look at the mapping logic in domain extraction maybe?
                    # For now, let's try to match the regex patterns from EHR_COLUMN_PATTERNS
                    
                    # Better: We know which pattern matched this column in _detect_domain
                    # But we lost that specific mapping. Re-check.
                    if any(part in col.lower() for part in key.split('_')[1:]):
                         rule_key = key
                         break
                
                if rule_key and col in df.columns:
                    min_val, max_val = self.bio_ranges[rule_key]
                    numeric_col = pd.to_numeric(df[col], errors='coerce')
                    violations = numeric_col[(numeric_col < min_val) | (numeric_col > max_val)]
                    
                    if not violations.empty:
                        count = len(violations)
                        examples = violations.head(3).tolist()
                        range_violations.append(
                            f"Column '{col}' has {count} values outside biological range ({min_val}-{max_val}). Examples: {examples}"
                        )

        # 2. Logic/Consistency Checks
        
        # Gender vs Pregnancy
        # Find gender column
        gender_cols = cols.get('demographics', [])
        gender_col = next((c for c in gender_cols if 'gender' in c.lower() or 'sex' in c.lower()), None)
        
        # Find pregnancy column (heuristic)
        preg_col = next((c for c in df.columns if 'preg' in c.lower()), None)
        
        if gender_col and preg_col:
            # Assume 'Male'/'M' and 'Yes'/'True' for pregnancy
            males = df[df[gender_col].astype(str).str.match(r'^(male|m)$', case=False, na=False)]
            pregnant_males = males[males[preg_col].astype(str).str.match(r'^(yes|true|1|positive)$', case=False, na=False)]
            
            if not pregnant_males.empty:
                logic_errors.append(f"Found {len(pregnant_males)} records with Gender='Male' and Pregnancy='Yes'")
        
        # Age vs Pediatric Vitals (Advanced todo)
        
        return {
            "logic_errors": logic_errors,
            "range_violations": range_violations
        }

    def _analyze_health_data(self, df: pd.DataFrame, domain_info: Dict) -> Dict[str, Any]:
        """Analyze health/clinical data"""
        health_cols = domain_info.get("columns", {})
        code_columns = domain_info.get("code_columns", [])
        
        analysis = {
            "row_count": len(df),
            "column_count": len(df.columns),
            "data_categories": {}
        }
        
        # Categorize data
        if health_cols.get('phi'):
            analysis["data_categories"]["phi"] = {
                "fields": health_cols['phi'],
                "count": len(health_cols['phi']),
                "warning": "Contains potential PHI - handle with care"
            }
        
        if health_cols.get('demographics'):
            analysis["data_categories"]["demographics"] = {
                "fields": health_cols['demographics'],
                "count": len(health_cols['demographics'])
            }
            
        if health_cols.get('vitals'):
            vitals_stats = {}
            for col in health_cols['vitals']:
                if col in df.columns:
                    numeric_col = pd.to_numeric(df[col], errors='coerce')
                    if not numeric_col.isna().all():
                        vitals_stats[col] = {
                            "mean": float(numeric_col.mean()),
                            "std": float(numeric_col.std()),
                            "min": float(numeric_col.min()),
                            "max": float(numeric_col.max())
                        }
            analysis["data_categories"]["vitals"] = {
                "fields": health_cols['vitals'],
                "statistics": vitals_stats
            }
            
        if health_cols.get('labs'):
            lab_stats = {}
            for col in health_cols['labs']:
                if col in df.columns:
                    numeric_col = pd.to_numeric(df[col], errors='coerce')
                    if not numeric_col.isna().all():
                        lab_stats[col] = {
                            "mean": float(numeric_col.mean()),
                            "std": float(numeric_col.std()),
                            "non_null_count": int(numeric_col.notna().sum())
                        }
            analysis["data_categories"]["laboratory"] = {
                "fields": health_cols['labs'],
                "statistics": lab_stats
            }
        
        # Clinical codes analysis
        clinical_codes_info = []
        for code_info in code_columns:
            col = code_info['column']
            code_type = code_info['code_type']
            if col in df.columns:
                unique_codes = df[col].dropna().unique()
                clinical_codes_info.append({
                    "column": col,
                    "code_type": code_type,
                    "unique_count": len(unique_codes),
                    "sample_codes": list(unique_codes[:5])
                })
        
        # Generate recommendations
        recommendations = []
        if health_cols.get('phi'):
            recommendations.append(f"⚠️ {len(health_cols['phi'])} PHI field(s) detected. Consider de-identification before sharing.")
        if code_columns:
            code_types = list(set([c['code_type'] for c in code_columns]))
            recommendations.append(f"📊 Clinical codes detected: {', '.join(code_types)}")
        if health_cols.get('vitals'):
            recommendations.append("💓 Vital signs detected. Data suitable for clinical trend analysis.")
        if health_cols.get('labs'):
            recommendations.append("🧪 Laboratory results detected. Consider reference range analysis.")
        if domain_info.get("domain") == "public_health":
            recommendations.append("📈 Epidemiological data detected. Suitable for outbreak analysis.")
        
        return {
            "analysis": analysis,
            "phi_fields": health_cols.get('phi', []),
            "clinical_codes": clinical_codes_info,
            "recommendations": recommendations
        }

    def _analyze_biotech(self, df: pd.DataFrame, bio_cols: List[str]) -> Dict[str, Any]:
        """Analyze biological sequences"""
        try:
            from Bio.SeqUtils import GC
            from Bio.Seq import Seq
        except ImportError:
            return {"error": "Biopython not installed"}

        analysis = {}
        
        for col in bio_cols:
            sequences = df[col].dropna().astype(str).tolist()
            if not sequences: continue
            
            gc_contents = [GC(Seq(s)) for s in sequences if set(s.upper()).issubset(set('ACGTUN'))]
            avg_gc = np.mean(gc_contents) if gc_contents else 0
            lengths = [len(s) for s in sequences]
            
            analysis[col] = {
                "type": "Sequence",
                "count": len(sequences),
                "avg_length": float(np.mean(lengths)),
                "min_length": int(np.min(lengths)),
                "max_length": int(np.max(lengths)),
                "avg_gc_content": float(avg_gc) if gc_contents else None,
                "composition": self._get_composition_summary(sequences)
            }
            
        return analysis

    def _get_composition_summary(self, sequences: List[str]) -> Dict[str, float]:
        """Calculate nucleotide/amino acid composition"""
        total_len = sum(len(s) for s in sequences)
        if total_len == 0: return {}
        
        from collections import Counter
        counts = Counter()
        for s in sequences:
            counts.update(s.upper())
            
        return {k: round(v / total_len * 100, 2) for k, v in counts.most_common(5)}

    def _analyze_chemistry(self, df: pd.DataFrame, chem_cols: List[str]) -> Dict[str, Any]:
        """Analyze chemical structures (SMILES)"""
        try:
            from rdkit import Chem
            from rdkit.Chem import Descriptors, Lipinski
        except ImportError:
            return {"error": "RDKit not installed"}
            
        analysis = {}
        
        for col in chem_cols:
            mol_data = []
            valid_mols = 0
            
            for smiles in df[col].astype(str):
                mol = Chem.MolFromSmiles(smiles)
                if mol:
                    valid_mols += 1
                    mol_data.append({
                        "mw": Descriptors.MolWt(mol),
                        "logp": Descriptors.MolLogP(mol),
                        "hbd": Lipinski.NumHDonors(mol),
                        "hba": Lipinski.NumHAcceptors(mol),
                        "tpsa": Descriptors.TPSA(mol)
                    })
            
            if not mol_data: continue
            
            mol_df = pd.DataFrame(mol_data)
            
            analysis[col] = {
                "valid_structures": valid_mols,
                "valid_percentage": round(valid_mols / len(df) * 100, 2),
                "properties": {
                    "avg_molecular_weight": float(mol_df["mw"].mean()),
                    "avg_logp": float(mol_df["logp"].mean()),
                    "avg_h_donors": float(mol_df["hbd"].mean()),
                    "avg_h_acceptors": float(mol_df["hba"].mean()),
                    "avg_tpsa": float(mol_df["tpsa"].mean())
                },
                "drug_likeness": {
                    "lipinski_rule_of_5_pass_rate": self._calculate_rule_of_5(mol_df)
                }
            }
            
        return analysis

    def _calculate_rule_of_5(self, mol_df: pd.DataFrame) -> float:
        """Calculate percentage of molecules passing Lipinski's Rule of 5"""
        passes = (
            (mol_df["mw"] <= 500) &
            (mol_df["logp"] <= 5) &
            (mol_df["hbd"] <= 5) &
            (mol_df["hba"] <= 10)
        )
        return float(passes.mean() * 100)

