"""
Executor for extracting cohort metadata at each biobank site.

This runs on the client side to extract and return cohort metadata.
"""
import csv
import random
from collections import Counter
from pathlib import Path
from typing import Dict

from nvflare.apis.dxo import DXO, DataKind
from nvflare.apis.executor import Executor
from nvflare.apis.fl_constant import ReturnCode
from nvflare.apis.fl_context import FLContext
from nvflare.apis.shareable import Shareable
from nvflare.apis.signal import Signal


class CohortMetadataExtractor(Executor):
    """
    Extracts cohort metadata from local biobank data.
    
    This is NOT computing statistics - it's extracting cohort-level
    metadata for data discovery purposes.
    """
    
    def __init__(
        self,
        data_root_dir: str = "/tmp/nvflare/cross_bio_bank",
        filename: str = "patients.csv"
    ):
        """
        Args:
            data_root_dir: Root directory containing site data
            filename: Name of CSV file to read at each site
        """
        super().__init__()
        self.data_root_dir = data_root_dir
        self.filename = filename
    
    def execute(
        self,
        task_name: str,
        shareable: Shareable,
        fl_ctx: FLContext,
        abort_signal: Signal
    ) -> Shareable:
        """
        Execute the cohort metadata extraction task.
        
        Args:
            task_name: Name of the task
            shareable: Input data (empty for this task)
            fl_ctx: FL context
            abort_signal: Abort signal
            
        Returns:
            Shareable containing cohort metadata
        """
        if task_name != "extract_cohort_metadata":
            self.log_error(fl_ctx, f"Unknown task: {task_name}")
            return self._create_error_shareable(f"Unknown task: {task_name}")
        
        try:
            site_name = fl_ctx.get_identity_name()
            self.log_info(fl_ctx, f"Extracting cohort metadata for {site_name}")
            
            # Extract cohort metadata
            cohort_data = self._extract_metadata(site_name, fl_ctx)
            
            # Return as DXO
            dxo = DXO(data_kind=DataKind.COLLECTION, data=cohort_data)
            return dxo.to_shareable()
            
        except Exception as e:
            self.log_exception(fl_ctx, f"Error extracting cohort metadata: {e}")
            return self._create_error_shareable(str(e))
    
    def _extract_metadata(self, site_name: str, fl_ctx: FLContext) -> Dict:
        """Extract cohort metadata from local data."""
        # Read local CSV
        csv_path = Path(self.data_root_dir) / site_name / self.filename
        
        if not csv_path.exists():
            raise FileNotFoundError(f"Data file not found: {csv_path}")
        
        patients = []
        with open(csv_path, 'r') as f:
            reader = csv.DictReader(f)
            patients = list(reader)
        
        total = len(patients)
        self.log_info(fl_ctx, f"Loaded {total} patient records from {csv_path}")
        
        # Compute aggregated statistics
        ethnicity_counts = Counter(p["ethnicity"] for p in patients)
        biosample_types = set()
        for p in patients:
            if p.get("biosample_type"):
                biosample_types.update(p["biosample_type"].split("|"))
        
        genomic_count = sum(1 for p in patients if p.get("has_genomic_data") == "Yes")
        
        # Site name mapping (matches setup_sites.py)
        site_names = {
            "site-1": ("Nordic Biobank", "Sweden"),
            "site-2": ("CHoP Biobank", "United States"),
            "site-3": ("Penn Biobank", "United States"),
            "site-4": ("Japan Biobank", "Japan"),
            "site-5": ("AWS Open Data Program", "Global"),
            "site-6": ("CanPath", "Canada"),
            "site-7": ("Sage NF1 data", "United States"),
            "site-8": ("QIAGEN", "Germany"),
        }
        
        cohort_name, country = site_names.get(site_name, (f"Site {site_name}", "Unknown"))
        
        # Build cohort metadata
        cohort_data = {
            "cohort_name": cohort_name,
            "description": "Biobank cohort",
            "dictionary_harmonized": "Yes",
            "website": f"https://{site_name}.example.org",
            "pi_lead": "Dr. Site Lead",
            "countries": [country],
            "irb_approved_data_sharing": "76-100%",
            "enrollment_period": "2010:-",
            "current_enrollment": total,
            "target_enrollment": total * 2,
            
            "type_of_cohort": {
                "case_control": "No",
                "cross_sectional": "No",
                "longitudinal": "Yes",
                "health_records": "Yes",
                "other": "No"
            },
            
            "cohort_ancestry": {
                "asian": self._to_range(ethnicity_counts.get('Asian', 0) / total * 100),
                "black_african_american_or_african": self._to_range(ethnicity_counts.get('Black', 0) / total * 100),
                "european_or_white": self._to_range(ethnicity_counts.get('White', 0) / total * 100),
                "hispanic_latino_or_spanish": self._to_range(ethnicity_counts.get('Hispanic', 0) / total * 100),
                "middle_eastern_or_north_african": self._to_range(ethnicity_counts.get('Other', 0) / total * 50),
                "other": self._to_range(ethnicity_counts.get('Other', 0) / total * 50)
            },
            
            "available_data_types": {
                "biospecimens": "76-100%",
                "genomic_data": self._to_range(genomic_count / total * 100),
                "genomic_data_wgs": "1-25%",
                "genomic_data_wes": "1-25%",
                "genomic_data_array": self._to_range(genomic_count / total * 100),
                "genomic_data_other": "1-25%",
                "demographic_data": "76-100%",
                "imaging_data": "1-25%",
                "participants_address_or_geocode_data": "76-100%",
                "electronic_health_record_data": "76-100%",
                "phenotypic_clinical_data": "76-100%"
            },
            
            "questionnaire_survey_data": {
                "diseases": [
                    "Cardiovascular diseases",
                    "Endocrine system diseases",
                    "Cancer"
                ],
                "lifestyle_and_behaviours": [
                    "Alcohol use history",
                    "Dietary history",
                    "Physical activity history",
                    "Sleep history",
                    "Tobacco use history"
                ],
                "medication": []
            },
            
            "survey_administration": [
                "Date and time-related information",
                "Unique identifiers"
            ],
            
            "biosample": {
                "sample_types": list(biosample_types) if biosample_types else []
            }
        }
        
        return cohort_data
    
    @staticmethod
    def _to_range(percentage: float) -> str:
        """Convert percentage to privacy-preserving range."""
        if percentage == 0:
            return "0%"
        elif percentage <= 25:
            return "1-25%"
        elif percentage <= 50:
            return "26-50%"
        elif percentage <= 75:
            return "51-75%"
        else:
            return "76-100%"
    
    def _create_error_shareable(self, error_msg: str) -> Shareable:
        """Create shareable with error status."""
        shareable = Shareable()
        shareable.set_return_code(ReturnCode.EXECUTION_EXCEPTION)
        shareable["error"] = error_msg
        return shareable

