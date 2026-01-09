#!/usr/bin/env python3
"""
CSV to Elasticsearch Import Utility (Python Version)

Usage:
    python scripts/import_csv.py <csv-file-path> [--index <index-name>]

Example:
    python scripts/import_csv.py ./data/cohorts.csv
    python scripts/import_csv.py ./data/cohorts.csv --index cohort_centric
    
Requirements:
    pip install elasticsearch pandas
"""

import sys
import os
import argparse
import pandas as pd
from typing import Dict, List, Any, Optional
from elasticsearch import Elasticsearch
from elasticsearch.helpers import bulk

# Configuration
ES_HOSTS = os.getenv("ES_HOSTS", "http://localhost:9200").split(",")
DEFAULT_INDEX = os.getenv("COHORT_INDEX_NAME", "cohort_centric")


def parse_boolean(value: Any) -> Optional[bool]:
    """Parse boolean values from various formats."""
    if pd.isna(value):
        return None
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        lower_val = value.lower().strip()
        if lower_val in ["true", "yes", "1"]:
            return True
        if lower_val in ["false", "no", "0"]:
            return False
    return None


def parse_list(value: Any, separator: str = "|") -> Optional[List[str]]:
    """Parse list values from delimited strings."""
    if pd.isna(value) or value == "":
        return None
    if isinstance(value, str):
        items = [item.strip() for item in value.replace(";", separator).split(separator)]
        return [item for item in items if item]
    return None


def parse_integer(value: Any) -> Optional[int]:
    """Parse integer values safely."""
    if pd.isna(value):
        return None
    try:
        return int(float(value))
    except (ValueError, TypeError):
        return None


def clean_dict(obj: Any) -> Any:
    """Remove None, empty strings, and empty dicts/lists recursively."""
    if isinstance(obj, dict):
        cleaned = {}
        for key, value in obj.items():
            cleaned_value = clean_dict(value)
            if cleaned_value is not None and cleaned_value != "" and cleaned_value != {}:
                cleaned[key] = cleaned_value
        return cleaned if cleaned else None
    elif isinstance(obj, list):
        cleaned = [clean_dict(item) for item in obj]
        return [item for item in cleaned if item is not None and item != ""] or None
    return obj


def transform_row(row: pd.Series) -> Dict[str, Any]:
    """Transform CSV row to Elasticsearch document."""
    doc = {
        "cohort_name": row.get("cohort_name") or row.get("name"),
        "pi_lead": row.get("pi_lead") or row.get("pi"),
        "website": row.get("website"),
        "dictionary_harmonized": parse_boolean(row.get("dictionary_harmonized")),
        "irb_approved_data_sharing": row.get("irb_approved_data_sharing"),
        "countries": parse_list(row.get("countries")),
        "current_enrollment": parse_integer(row.get("current_enrollment")),
        "target_enrollment": parse_integer(row.get("target_enrollment")),
        "enrollment_period": row.get("enrollment_period"),
    }

    # Available data types (nested object)
    doc["available_data_types"] = {
        "biospecimens": row.get("biospecimens") or row.get("available_data_types_biospecimens"),
        "genomic_data": row.get("genomic_data") or row.get("available_data_types_genomic_data"),
        "genomic_data_wgs": row.get("genomic_data_wgs") or row.get("available_data_types_genomic_data_wgs"),
        "genomic_data_wes": row.get("genomic_data_wes") or row.get("available_data_types_genomic_data_wes"),
        "genomic_data_array": row.get("genomic_data_array") or row.get("available_data_types_genomic_data_array"),
        "genomic_data_other": row.get("genomic_data_other") or row.get("available_data_types_genomic_data_other"),
        "demographic_data": row.get("demographic_data") or row.get("available_data_types_demographic_data"),
        "imaging_data": row.get("imaging_data") or row.get("available_data_types_imaging_data"),
        "participants_address_or_geocode_data": row.get("participants_address_or_geocode_data") or row.get("available_data_types_participants_address_or_geocode_data"),
        "electronic_health_record_data": row.get("electronic_health_record_data") or row.get("available_data_types_electronic_health_record_data"),
        "phenotypic_clinical_data": row.get("phenotypic_clinical_data") or row.get("available_data_types_phenotypic_clinical_data"),
    }

    # Biosample (nested object)
    biosample_types = parse_list(row.get("biosample_sample_types"))
    if biosample_types:
        doc["biosample"] = {
            "sample_types": biosample_types,
            "biosample_variables": parse_list(row.get("biosample_biosample_variables")),
        }

    # Cohort ancestry (nested object)
    doc["cohort_ancestry"] = {
        "asian": row.get("cohort_ancestry_asian"),
        "black_african_american_or_african": row.get("cohort_ancestry_black_african_american_or_african"),
        "european_or_white": row.get("cohort_ancestry_european_or_white"),
        "hispanic_latino_or_spanish": row.get("cohort_ancestry_hispanic_latino_or_spanish"),
        "middle_eastern_or_north_african": row.get("cohort_ancestry_middle_eastern_or_north_african"),
        "other": row.get("cohort_ancestry_other"),
    }

    # Type of cohort (nested object)
    doc["type_of_cohort"] = {
        "case_control": row.get("type_of_cohort_case_control"),
        "cross_sectional": row.get("type_of_cohort_cross_sectional"),
        "longitudinal": row.get("type_of_cohort_longitudinal"),
        "health_records": row.get("type_of_cohort_health_records"),
        "other": row.get("type_of_cohort_other"),
    }

    # Questionnaire survey data (nested object)
    doc["questionnaire_survey_data"] = {
        "diseases": parse_list(row.get("questionnaire_survey_data_diseases")),
        "healthcare_information": parse_list(row.get("questionnaire_survey_data_healthcare_information")),
        "lifestyle_and_behaviours": parse_list(row.get("questionnaire_survey_data_lifestyle_and_behaviours")),
        "medication": parse_list(row.get("questionnaire_survey_data_medication")),
        "non_pharmacological_interventions": parse_list(row.get("questionnaire_survey_data_non_pharmacological_interventions")),
        "perception_of_health_and_quality_of_life": parse_list(row.get("questionnaire_survey_data_perception_of_health_and_quality_of_life")),
        "physical_environment": parse_list(row.get("questionnaire_survey_data_physical_environment")),
        "physiological_measurements": parse_list(row.get("questionnaire_survey_data_physiological_measurements")),
        "socio_demographic_and_economic_characteristics": parse_list(row.get("questionnaire_survey_data_socio_demographic_and_economic_characteristics")),
        "survey_administration": parse_list(row.get("questionnaire_survey_data_survey_administration")),
        "other_questionnaire_survey_data": parse_list(row.get("questionnaire_survey_data_other_questionnaire_survey_data")),
    }

    # Laboratory measures (nested object)
    doc["laboratory_measures"] = {
        "genomic_variables": parse_list(row.get("laboratory_measures_genomic_variables")),
        "microbiology": parse_list(row.get("laboratory_measures_microbiology")),
    }

    # Clean up empty values
    return clean_dict(doc)


def create_index_mapping():
    """Define Elasticsearch index mapping."""
    return {
        "settings": {
            "number_of_shards": 1,
            "number_of_replicas": 0,
        },
        "mappings": {
            "properties": {
                "cohort_name": {"type": "keyword"},
                "countries": {"type": "keyword"},
                "current_enrollment": {"type": "integer"},
                "target_enrollment": {"type": "integer"},
                "enrollment_period": {"type": "keyword"},
                "pi_lead": {"type": "text"},
                "website": {"type": "keyword"},
                "dictionary_harmonized": {"type": "boolean"},
                "irb_approved_data_sharing": {"type": "keyword"},
                "available_data_types": {
                    "properties": {
                        "biospecimens": {"type": "keyword"},
                        "genomic_data": {"type": "keyword"},
                        "genomic_data_wgs": {"type": "keyword"},
                        "genomic_data_wes": {"type": "keyword"},
                        "genomic_data_array": {"type": "keyword"},
                        "genomic_data_other": {"type": "keyword"},
                        "demographic_data": {"type": "keyword"},
                        "imaging_data": {"type": "keyword"},
                        "participants_address_or_geocode_data": {"type": "keyword"},
                        "electronic_health_record_data": {"type": "keyword"},
                        "phenotypic_clinical_data": {"type": "keyword"},
                    }
                },
                "biosample": {
                    "properties": {
                        "sample_types": {"type": "keyword"},
                        "biosample_variables": {"type": "keyword"},
                    }
                },
                "cohort_ancestry": {
                    "properties": {
                        "asian": {"type": "keyword"},
                        "black_african_american_or_african": {"type": "keyword"},
                        "european_or_white": {"type": "keyword"},
                        "hispanic_latino_or_spanish": {"type": "keyword"},
                        "middle_eastern_or_north_african": {"type": "keyword"},
                        "other": {"type": "keyword"},
                    }
                },
                "type_of_cohort": {
                    "properties": {
                        "case_control": {"type": "keyword"},
                        "cross_sectional": {"type": "keyword"},
                        "longitudinal": {"type": "keyword"},
                        "health_records": {"type": "keyword"},
                        "other": {"type": "keyword"},
                    }
                },
                "questionnaire_survey_data": {
                    "properties": {
                        "diseases": {"type": "keyword"},
                        "healthcare_information": {"type": "keyword"},
                        "lifestyle_and_behaviours": {"type": "keyword"},
                        "medication": {"type": "keyword"},
                        "non_pharmacological_interventions": {"type": "keyword"},
                        "perception_of_health_and_quality_of_life": {"type": "keyword"},
                        "physical_environment": {"type": "keyword"},
                        "physiological_measurements": {"type": "keyword"},
                        "socio_demographic_and_economic_characteristics": {"type": "keyword"},
                        "survey_administration": {"type": "keyword"},
                        "other_questionnaire_survey_data": {"type": "keyword"},
                    }
                },
                "laboratory_measures": {
                    "properties": {
                        "genomic_variables": {"type": "keyword"},
                        "microbiology": {"type": "keyword"},
                    }
                },
            }
        },
    }


def main():
    parser = argparse.ArgumentParser(
        description="Import CSV data into Elasticsearch for biobank dashboard"
    )
    parser.add_argument("csv_file", help="Path to CSV file")
    parser.add_argument(
        "--index",
        default=DEFAULT_INDEX,
        help=f"Elasticsearch index name (default: {DEFAULT_INDEX})",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force recreate index if it exists",
    )
    args = parser.parse_args()

    # Validate file exists
    if not os.path.exists(args.csv_file):
        print(f"❌ File not found: {args.csv_file}")
        sys.exit(1)

    print(f"📄 Reading CSV file: {args.csv_file}")
    print(f"📊 Target index: {args.index}")
    print(f"🔗 Elasticsearch: {', '.join(ES_HOSTS)}\n")

    # Connect to Elasticsearch
    try:
        es = Elasticsearch(ES_HOSTS)
        if not es.ping():
            raise Exception("Cannot connect to Elasticsearch")
        print("✅ Connected to Elasticsearch\n")
    except Exception as e:
        print(f"❌ Failed to connect to Elasticsearch: {e}")
        sys.exit(1)

    # Create index if needed
    try:
        if es.indices.exists(index=args.index):
            if args.force:
                print(f"🗑️  Deleting existing index: {args.index}")
                es.indices.delete(index=args.index)
            else:
                print(f"⚠️  Index '{args.index}' already exists. Use --force to recreate.")
        
        if not es.indices.exists(index=args.index):
            print(f"Creating index: {args.index}")
            es.indices.create(index=args.index, body=create_index_mapping())
            print(f"✅ Index created\n")
    except Exception as e:
        print(f"❌ Error with index: {e}")
        sys.exit(1)

    # Read CSV
    try:
        df = pd.read_csv(args.csv_file)
        print(f"Parsed {len(df)} rows from CSV\n")
    except Exception as e:
        print(f"❌ Error reading CSV: {e}")
        sys.exit(1)

    # Transform and prepare documents
    print("Transforming data...")
    documents = []
    for idx, row in df.iterrows():
        doc = transform_row(row)
        if doc.get("cohort_name"):  # Only include if has a name
            documents.append({
                "_index": args.index,
                "_source": doc,
            })

    print(f"Prepared {len(documents)} documents\n")

    # Bulk import
    try:
        print("Importing to Elasticsearch...")
        success, failed = bulk(es, documents, raise_on_error=False, stats_only=True)
        
        if failed > 0:
            print(f"⚠️  Imported {success} documents, {failed} failed")
        else:
            print(f"✅ Successfully imported {success} documents")
        
        # Refresh index
        es.indices.refresh(index=args.index)
        
        # Verify count
        count = es.count(index=args.index)["count"]
        print(f"\n📊 Total documents in index: {count}")
        
        print("\n✨ Import complete!")
        print(f"\nTo view your data:")
        print(f"  curl http://localhost:9200/{args.index}/_search?pretty")
        
    except Exception as e:
        print(f"❌ Import failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

