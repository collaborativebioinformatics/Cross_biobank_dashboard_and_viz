"""
Widget to collect cohort metadata and write catalog files.

This runs on the server side and collects metadata from all sites.
"""
import csv
import json
from pathlib import Path
from typing import Dict, List

from nvflare.apis.event_type import EventType
from nvflare.apis.fl_context import FLContext
from nvflare.widgets.widget import Widget


class CatalogWriter(Widget):
    """
    Collects cohort metadata from all sites and writes catalog files.
    
    Outputs:
    - JSON file: Array of cohort metadata dictionaries
    - CSV file: Flattened cohort data for Elasticsearch import
    """
    
    def __init__(self, output_path: str = "cohort_catalog"):
        """
        Args:
            output_path: Base path for output files (without extension)
        """
        super().__init__()
        self.output_path = output_path
        self.cohort_data: List[Dict] = []
    
    def handle_event(self, event_type: str, fl_ctx: FLContext):
        """Handle FL events."""
        if event_type == EventType.END_RUN:
            self._save_catalog(fl_ctx)
    
    def _save_catalog(self, fl_ctx: FLContext):
        """Save collected cohort metadata to JSON and CSV."""
        # Get workspace directory
        workspace = fl_ctx.get_engine().get_workspace()
        output_dir = Path(workspace.get_root_dir())
        
        # Get cohort data from controller
        controller = fl_ctx.get_engine().get_component("controller")
        if hasattr(controller, 'cohort_metadata'):
            self.cohort_data = controller.cohort_metadata
        
        if not self.cohort_data:
            self.log_warning(fl_ctx, "No cohort data collected")
            return
        
        self.log_info(fl_ctx, f"Saving catalog with {len(self.cohort_data)} cohorts")
        
        # Save JSON
        json_path = output_dir / f"{self.output_path}.json"
        with open(json_path, 'w') as f:
            json.dump(self.cohort_data, f, indent=2)
        self.log_info(fl_ctx, f"JSON catalog saved to {json_path}")
        
        # Save CSV
        csv_path = output_dir / f"{self.output_path}.csv"
        self._write_csv(csv_path, fl_ctx)
        self.log_info(fl_ctx, f"CSV catalog saved to {csv_path}")
    
    def _write_csv(self, csv_path: Path, fl_ctx: FLContext):
        """Write cohort data to CSV in format expected by import_csv.py."""
        if not self.cohort_data:
            return
        
        # Flatten all cohorts
        flattened = [self._flatten_cohort(c) for c in self.cohort_data]
        
        # Get all unique column names
        all_columns = set()
        for row in flattened:
            all_columns.update(row.keys())
        columns = sorted(all_columns)
        
        # Write CSV
        with open(csv_path, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=columns)
            writer.writeheader()
            writer.writerows(flattened)
    
    def _flatten_cohort(self, cohort: Dict) -> Dict:
        """
        Flatten cohort data to match import_csv.py expected format.
        
        import_csv.py expects specific column names and handles nesting itself.
        """
        flat = {
            # Basic fields
            'cohort_name': cohort.get('cohort_name'),
            'countries': '|'.join(cohort.get('countries', [])),
            'current_enrollment': cohort.get('current_enrollment'),
            'target_enrollment': cohort.get('target_enrollment'),
            'pi_lead': cohort.get('pi_lead'),
            'website': cohort.get('website'),
            'dictionary_harmonized': cohort.get('dictionary_harmonized'),
            'irb_approved_data_sharing': cohort.get('irb_approved_data_sharing'),
            'enrollment_period': cohort.get('enrollment_period'),
        }
        
        # Available data types
        avail_data = cohort.get('available_data_types', {})
        flat.update({
            'biospecimens': avail_data.get('biospecimens'),
            'genomic_data': avail_data.get('genomic_data'),
            'genomic_data_wgs': avail_data.get('genomic_data_wgs'),
            'genomic_data_wes': avail_data.get('genomic_data_wes'),
            'genomic_data_array': avail_data.get('genomic_data_array'),
            'genomic_data_other': avail_data.get('genomic_data_other'),
            'demographic_data': avail_data.get('demographic_data'),
            'imaging_data': avail_data.get('imaging_data'),
            'participants_address_or_geocode_data': avail_data.get('participants_address_or_geocode_data'),
            'electronic_health_record_data': avail_data.get('electronic_health_record_data'),
            'phenotypic_clinical_data': avail_data.get('phenotypic_clinical_data'),
        })
        
        # Cohort ancestry
        ancestry = cohort.get('cohort_ancestry', {})
        flat.update({
            'cohort_ancestry_asian': ancestry.get('asian'),
            'cohort_ancestry_black_african_american_or_african': ancestry.get('black_african_american_or_african'),
            'cohort_ancestry_european_or_white': ancestry.get('european_or_white'),
            'cohort_ancestry_hispanic_latino_or_spanish': ancestry.get('hispanic_latino_or_spanish'),
            'cohort_ancestry_middle_eastern_or_north_african': ancestry.get('middle_eastern_or_north_african'),
            'cohort_ancestry_other': ancestry.get('other'),
        })
        
        # Type of cohort
        cohort_type = cohort.get('type_of_cohort', {})
        flat.update({
            'type_of_cohort_case_control': cohort_type.get('case_control'),
            'type_of_cohort_cross_sectional': cohort_type.get('cross_sectional'),
            'type_of_cohort_longitudinal': cohort_type.get('longitudinal'),
            'type_of_cohort_health_records': cohort_type.get('health_records'),
            'type_of_cohort_other': cohort_type.get('other'),
        })
        
        # Questionnaire survey data
        survey = cohort.get('questionnaire_survey_data', {})
        if 'diseases' in survey:
            flat['questionnaire_survey_data_diseases'] = '|'.join(survey['diseases'])
        if 'lifestyle_and_behaviours' in survey:
            flat['questionnaire_survey_data_lifestyle_and_behaviours'] = '|'.join(survey['lifestyle_and_behaviours'])
        if 'medication' in survey:
            flat['questionnaire_survey_data_medication'] = '|'.join(survey['medication'])
        
        # Biosample
        biosample = cohort.get('biosample', {})
        if 'sample_types' in biosample:
            flat['biosample_sample_types'] = '|'.join(biosample['sample_types'])
        
        return flat

