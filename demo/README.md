# Federated Biobank Demo

Two workflows demonstrating federated data sharing without exposing raw patient data.

## Quick Start

```bash
# 1. Generate mock biobank data
python setup_sites.py
# Creates data at /tmp/nvflare/cross_bio_bank/site-{1..8}/

# 2. Run cohort discovery (builds catalog)
cd discovery && python job.py && cd ..

# 3. Import to dashboard
cd ../ihcc-api/scripts
python import_csv.py /tmp/nvflare/simulation/cohort_discovery/server/cohort_catalog.csv --index demo_index

# 4. (Optional) Run federated statistics
cd ../../demo/fedstats && python job.py && cd ..

# Or run both workflows at once:
./run_both.sh
```

## Workflows

### 1. Cohort Discovery 🗺️

**Purpose:** Build a searchable catalog of available biobank cohorts.

**What it does:**
- Each site extracts cohort metadata (enrollment, ancestry %, data types)
- Server collects all metadata (no aggregation)
- Outputs CSV for Elasticsearch import

**Files:** (`discovery/` folder)
- `recipe.py` - Reusable recipe
- `job.py` - Main script
- `executor.py` - Client-side metadata extraction
- `controller.py` - Server-side collection
- `writer.py` - Output JSON + CSV

**Example usage:**
```python
from discovery.recipe import CohortDiscoveryRecipe
from nvflare.recipe.sim_env import SimEnv

recipe = CohortDiscoveryRecipe(
    name="my_discovery",
    data_root_dir="/data/biobanks"
)

# Sites specified in environment
sites = ["site-1", "site-2", "site-3"]
env = SimEnv(clients=sites)
recipe.execute(env)
```

**Output:** Array of cohort profiles for browsing
```json
[
  {"cohort_name": "Site 1", "enrollment": 10000, "asian": "1-25%"},
  {"cohort_name": "Site 2", "enrollment": 8000, "asian": "51-75%"}
]
```

### 2. Federated Statistics 📊

**Purpose:** Compute global statistics across sites without sharing raw data.

**What it does:**
- Each site computes local statistics (mean, stddev, histogram)
- Server aggregates into global statistics
- Returns single result with cross-site insights

**Files:** (`fedstats/` folder)
- `job.py` - Main orchestrator
- `client.py` - Statistical computation (DFStatisticsCore)

**Output:** Aggregated statistics
```json
{
  "age": {
    "global_mean": 45.3,
    "global_stddev": 12.7,
    "histogram": [...]
  }
}
```

## Architecture

```
demo/
├── discovery/           # Cohort catalog workflow
│   ├── recipe.py       # CohortDiscoveryRecipe
│   ├── job.py          # Main script
│   ├── executor.py     # Client-side extraction
│   ├── controller.py   # Server-side orchestration
│   └── writer.py       # Output JSON + CSV
│
├── fedstats/           # Statistical analysis workflow
│   ├── job.py          # Main script
│   └── client.py       # DFStatisticsCore implementation
│
├── setup_sites.py      # Generate mock data
└── run_both.sh         # Run both workflows
```

**Data Flow:**
```
Biobank Sites              NVFlare Server           Dashboard
┌──────────┐              ┌─────────────┐         ┌──────────┐
│ Site 1   │─────────────▶│  Discovery  │────────▶│ Browse   │
│ Site 2   │─────────────▶│  Collector  │         │ Cohorts  │
│ Site 3   │─────────────▶│             │         │          │
│ Site 4   │─────────────▶│             │         │          │
└──────────┘              └─────────────┘         └──────────┘
     │                    ┌─────────────┐         ┌──────────┐
     └───────────────────▶│  FedStats   │────────▶│ Research │
                          │ Aggregator  │         │ Insights │
                          └─────────────┘         └──────────┘
```

## Key Differences

| Aspect | Discovery | FedStats |
|--------|-----------|----------|
| **Purpose** | Find cohorts | Analyze data |
| **Output** | Array of cohorts | Aggregated stats |
| **Frequency** | Periodic (daily) | On-demand (per query) |
| **Privacy** | Metadata only | Aggregate only |

## Privacy

Both workflows preserve privacy:
- **Raw patient data never leaves sites**
- Discovery shares: Metadata + ranges (e.g., "1-25%" not "17.3%")
- FedStats shares: Aggregated statistics only

## Data Format

Each site needs `patients.csv`:
```csv
patient_id,age,ethnicity,has_genomic_data,has_hypertension,has_diabetes,biosample_type
P001,45,White,Yes,No,No,Blood|DNA
P002,52,Asian,No,Yes,No,Saliva
```

## Advanced Options

```bash
# Discovery with custom output
python discovery_job.py -n 4 -d /path/to/data -o my_catalog

# FedStats with specific statistics
python fedstats_job.py -n 4 -o stats.json

# View results
cat /tmp/nvflare/simulation/cohort_discovery/server/cohort_catalog.json
cat /tmp/nvflare/simulation/patient_stats/server/statistics/patient_stats.json
```

## Requirements

- Python 3.8+
- nvflare
- pandas
- elasticsearch (for dashboard)

## Notes

- Discovery workflow is for **data catalog** (what exists)
- FedStats workflow is for **research** (what we can learn)
- Both use same NVFlare infrastructure
- Can run independently or together
