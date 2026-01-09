#!/bin/bash
# Run both federated workflows

echo "================================"
echo "Federated Biobank Demo"
echo "================================"
echo ""

# Setup
echo "1. Generating mock biobank data..."
python setup_sites.py
echo "✓ Generated 8 biobank sites"
echo ""

# Discovery workflow
echo "2. Running Cohort Discovery workflow..."
cd discovery && python job.py && cd ..
echo "✓ Cohort catalog created"
echo ""

# FedStats workflow  
echo "3. Running Federated Statistics workflow..."
cd fedstats && python job.py && cd ..
echo "✓ Statistics computed"
echo ""

# Show outputs
echo "================================"
echo "Outputs:"
echo "================================"
echo "Cohort Catalog (JSON):"
echo "  /tmp/nvflare/simulation/cohort_discovery/server/cohort_catalog.json"
echo ""
echo "Cohort Catalog (CSV for import):"
echo "  /tmp/nvflare/simulation/cohort_discovery/server/cohort_catalog.csv"
echo ""
echo "Federated Statistics:"
echo "  /tmp/nvflare/simulation/patient_stats/server/simulate_job/statistics/patient_stats.json"
echo ""
echo "================================"
echo "Next Steps:"
echo "================================"
echo "Import to dashboard:"
echo "  python ../ihcc-api/scripts/import_csv.py \\"
echo "    /tmp/nvflare/simulation/cohort_discovery/server/cohort_catalog.csv \\"
echo "    --index demo_index"
echo ""

