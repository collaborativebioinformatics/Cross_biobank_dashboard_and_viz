#!/usr/bin/env python3
"""
Generate mock CSV data for each site.
Each site has OWL schema and their own patient dataset.
"""

import csv
import random
from pathlib import Path

# Root directory for all biobank data
DATA_ROOT = Path("/tmp/nvflare/cross_bio_bank")

SITES = {
    "site-1": {"name": "Nordic Biobank", "country": "Sweden", "patients": 80000},
    "site-2": {"name": "CHoP Biobank", "country": "United States", "patients": 130000},
    "site-3": {"name": "Penn Biobank", "country": "United States", "patients": 95000},
    "site-4": {"name": "Japan Biobank", "country": "Japan", "patients": 120000},
    "site-5": {"name": "AWS Open Data Program", "country": "Global", "patients": 250000},
    "site-6": {"name": "CanPath", "country": "Canada", "patients": 345000},
    "site-7": {"name": "Sage NF1 data", "country": "United States", "patients": 15000},
    "site-8": {"name": "QIAGEN", "country": "Germany", "patients": 180000},
}

def generate_csv(site_id, site_info, num_samples=1000):
    """Generate random patient CSV for a site."""
    site_dir = DATA_ROOT / site_id
    site_dir.mkdir(parents=True, exist_ok=True)
    
    csv_file = site_dir / "patients.csv"
    
    # Generate random patient data
    ethnicities = ["Asian", "White", "Black", "Hispanic", "Other"]
    biosample_options = ["Blood", "Saliva", "DNA", "Tissue", "Plasma"]
    
    with open(csv_file, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["patient_id", "age", "sex", "ethnicity", "has_hypertension", 
                         "has_diabetes", "has_genomic_data", "enrollment_year", "biosample_type"])
        
        for i in range(num_samples):
            # Generate 1-3 random biosample types
            num_types = random.randint(1, 3)
            biosample_types = "|".join(random.sample(biosample_options, num_types))
            
            writer.writerow([
                f"{site_id}_P{i:06d}",
                random.randint(18, 85),
                random.choice(["M", "F"]),
                random.choice(ethnicities),
                random.choice(["Yes", "No"]),
                random.choice(["Yes", "No"]),
                random.choice(["Yes", "No"]),
                random.randint(2010, 2023),
                biosample_types
            ])
    
    print(f"✅ {site_id}: {csv_file} ({num_samples} sample records, represents {site_info['patients']:,} total)")

def main():
    print("🏥 Setting up mock biobank sites\n")
    print(f"📁 Data root: {DATA_ROOT}\n")
    
    for site_id, site_info in SITES.items():
        generate_csv(site_id, site_info)
    
    print(f"\n✨ Generated {len(SITES)} sites in {DATA_ROOT}")

if __name__ == "__main__":
    main()

