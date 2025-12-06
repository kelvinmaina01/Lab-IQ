"""
Domain Agent - Handles domain-specific analysis for Biotech, Chemistry, and Clinical data
"""
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from .base_agent import BaseAgent
import logging
import re

logger = logging.getLogger(__name__)

class DomainAgent(BaseAgent):
    """Agent responsible for detecting and analyzing domain-specific data"""
    
    def __init__(self):
        super().__init__("domain_agent", "Domain Expert Agent 🧬")
        self.supported_domains = ["biotech", "chemistry", "general"]
        
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
            "analysis": {}
        }
        
        # 2. Perform Domain-Specific Analysis
        if domain == "biotech" and confidence > 0.6:
            results["analysis"] = self._analyze_biotech(df, domain_info["columns"])
        elif domain == "chemistry" and confidence > 0.6:
            results["analysis"] = self._analyze_chemistry(df, domain_info["columns"])
            
        return results
    
    def _detect_domain(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Heuristic detection of domain based on column names and content
        """
        columns = df.columns.str.lower()
        
        # Biotech Indicators (Sequences)
        bio_keywords = ['sequence', 'seq', 'dna', 'rna', 'protein', 'gene', 'amino_acid']
        bio_cols = [col for col in df.columns if any(k in col.lower() for k in bio_keywords)]
        
        # Check content for DNA/Protein sequences
        bio_content_match = 0
        if bio_cols:
            for col in bio_cols:
                # Check first few non-null rows
                sample = df[col].dropna().head(5).astype(str)
                if sample.empty: continue
                
                # DNA regex (ACTG only, allowing N)
                is_dna = sample.apply(lambda x: bool(re.match(r'^[ACGTN]+$', x, re.IGNORECASE))).all()
                if is_dna: bio_content_match += 1
                
        # Chemistry Indicators (SMILES, InChI)
        chem_keywords = ['smiles', 'inchi', 'structure', 'mol', 'formula']
        chem_cols = [col for col in df.columns if any(k in col.lower() for k in chem_keywords)]
        
        # Check content for SMILES
        chem_content_match = 0
        if chem_cols:
             for col in chem_cols:
                sample = df[col].dropna().head(5).astype(str)
                if sample.empty: continue
                # Simple heuristic: contains typical SMILES chars but not just letters/numbers
                is_smiles = sample.apply(lambda x: len(x) > 3 and any(c in x for c in '=#()[]')).all()
                if is_smiles: chem_content_match += 1

        # Decision Logic
        if bio_content_match > 0 or (bio_cols and len(bio_cols) >= 1):
            return {"domain": "biotech", "confidence": 0.8 if bio_content_match else 0.5, "columns": bio_cols}
        
        if chem_content_match > 0 or (chem_cols and len(chem_cols) >= 1):
             return {"domain": "chemistry", "confidence": 0.8 if chem_content_match else 0.5, "columns": chem_cols}
             
        return {"domain": "general", "confidence": 1.0, "columns": []}

    def _analyze_biotech(self, df: pd.DataFrame, bio_cols: List[str]) -> Dict[str, Any]:
        """Analyze biological sequences"""
        try:
            from Bio.SeqUtils import GC
            from Bio.Seq import Seq
        except ImportError:
            return {"error": "Biopython not installed"}

        analysis = {}
        
        for col in bio_cols:
            # Analyze Sequence Column
            sequences = df[col].dropna().astype(str).tolist()
            if not sequences: continue
            
            # 1. GC Content (for DNA/RNA)
            gc_contents = [GC(Seq(s)) for s in sequences if set(s.upper()).issubset(set('ACGTUN'))]
            avg_gc = np.mean(gc_contents) if gc_contents else 0
            
            # 2. Length Statistics
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
