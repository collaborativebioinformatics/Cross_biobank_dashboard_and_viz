# FedViz: Federated Data Discovery & Visualization for Biobank Collaboration

<img width="1024" height="559" alt="FedViz Dashboard" src="https://github.com/user-attachments/assets/bd170d99-4652-4da3-a96e-050865b293fb" />

## CMU × NVIDIA Federated Learning Hackathon (Jan 7–9, 2026)

**Team: Visualization Tool for Multiple Datasets**

---

## 🎯 The Challenge

**Different biobank sites have heterogeneous datasets, making federated learning nearly impossible without first understanding what data exists across the network.**

Before launching any federated learning project, researchers face critical questions:
- 🔍 What data does each site have?
- 📊 Are the features comparable across sites?
- 🏥 What's the sample size and quality at each location?
- 🤝 Which sites should collaborate on specific research questions?

**Without answers to these questions, FL projects fail before they start.**

---

## 💡 Our Solution: Federated Data Discovery Pipeline

We demonstrate an end-to-end workflow that enables **privacy-preserving data discovery and visualization** to prepare biobank networks for federated learning:

### 1️⃣ **Federated Cohort Discovery**
Each site runs a local data extractor that:
- Reads local patient data (remains on-site, never shared)
- Computes **aggregated cohort metadata** (cohort size, available data types, disease coverage, biospecimen types)
- Sends only the metadata summary to the central catalog

**Privacy preserved:** Raw patient data never leaves the site.

### 2️⃣ **Federated Statistics Computation**
Using **NVIDIA FLARE**, sites compute cross-site statistics:
- Mean age, standard deviation
- Disease prevalence (hypertension, diabetes)
- Genomic data availability
- Data quality metrics

**Privacy preserved:** Only aggregated statistics shared, not individual records.

### 3️⃣ **Interactive Dashboard Visualization**
Centralized dashboard displays:
- **Cohort Atlas**: Browse and search available cohorts with rich metadata
- **Harmonization Matrix**: Visualize which features are available across sites
- **Federated Statistics**: Compare aggregated metrics across the network
- **Readiness Assessment**: Identify which sites can collaborate on specific research questions

### 4️⃣ **Enable FL Collaboration**
Armed with discovery insights, researchers can:
- ✅ Select compatible sites for FL projects
- ✅ Identify harmonization gaps before training
- ✅ Plan data collection strategies
- ✅ Design robust cross-site studies

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Biobank Network                              │
├─────────────┬─────────────┬─────────────┬─────────────────────┤
│   Site 1    │   Site 2    │   Site 3    │   ... Site N         │
│  (Sweden)   │   (USA)     │   (Japan)   │                      │
│             │             │             │                      │
│  Local CSV  │  Local CSV  │  Local CSV  │  Local Databases    │
│     ↓       │     ↓       │     ↓       │        ↓            │
│ Extractor   │ Extractor   │ Extractor   │   Extractor         │
│     ↓       │     ↓       │     ↓       │        ↓            │
│  Metadata   │  Metadata   │  Metadata   │   Metadata          │
└─────┬───────┴─────┬───────┴─────┬───────┴────────┬────────────┘
      │             │             │                │
      └─────────────┴─────────────┴────────────────┘
                          ↓
              ┌───────────────────────┐
              │   NVFlare Server      │
              │  (Federated Catalog)  │
              └───────────┬───────────┘
                          ↓
              ┌───────────────────────┐
              │  Elasticsearch Index  │
              └───────────┬───────────┘
                          ↓
              ┌───────────────────────┐
              │   FedViz Dashboard    │
              │  (React + TypeScript) │
              └───────────────────────┘
```

**Tech Stack:**
- **Federated Orchestration**: NVIDIA FLARE (NVFlare)
- **Backend**: Node.js + Python, Elasticsearch 7.17.x
- **Frontend**: React + TypeScript, Apache ECharts
- **Data Privacy**: Local computation, aggregated-only sharing

---

## 🚀 Demo Workflow

This demo simulates **8 real-world biobank sites** (Nordic Biobank, CHoP, Penn, Japan Biobank, AWS Open Data, CanPath, Sage NF1, QIAGEN) with heterogeneous patient data.

### Step 1: Setup Mock Sites
```bash
cd demo
python setup_sites.py
```
Generates mock CSV datasets for 8 sites at `/tmp/nvflare/cross_bio_bank/site-{1-8}/patients.csv`

### Step 2: Run Federated Workflows
```bash
bash run_both.sh
```

This executes two NVFlare workflows:

#### Workflow A: **Cohort Discovery** (`demo/discovery/`)
- Each site's `CohortMetadataExtractor` reads local `patients.csv`
- Computes cohort profile (name, size, countries, data types, diseases, biospecimens)
- Server's `CatalogWriter` aggregates all site metadata into:
  - `cohort_catalog.json` (rich metadata for dashboard)
  - `cohort_catalog.csv` (flat format for Elasticsearch import)

**Output:**
```
/tmp/nvflare/simulation/cohort_discovery/server/simulate_job/cohort_catalog.json
/tmp/nvflare/simulation/cohort_discovery/server/simulate_job/cohort_catalog.csv
```

#### Workflow B: **Federated Statistics** (`demo/fedstats/`)
- Each site's `PatientStatistics` computes local feature statistics (mean, stddev, histogram)
- NVFlare server aggregates across all sites
- Produces global statistics: mean age, disease prevalence, genomic data rates

**Output:**
```
/tmp/nvflare/simulation/patient_stats/server/simulate_job/statistics/patient_stats.json
```

### Step 3: Import to Dashboard
```bash
# Start Elasticsearch
cd ihcc-api
docker run -d \
  --name elasticsearch \
  -p 9200:9200 \
  -p 9300:9300 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  docker.elastic.co/elasticsearch/elasticsearch:7.17.10

# Install dependencies and import data
pip install -r scripts/requirements.txt
python scripts/import_csv.py /tmp/nvflare/simulation/cohort_discovery/server/simulate_job/cohort_catalog.csv

# Start API server
npm run build
npm run prod
```

### Step 4: Launch Dashboard
```bash
cd ihcc-ui
cp .schema.env .env
npm run buildAndServe
```

### Step 5: Explore at http://localhost:3000/
- **Atlas Tab**: Browse discovered cohorts, filter by country, disease, data types
- **Federated Statistics Tab**: View aggregated cross-site analytics

---

## 📊 Key Insights from Real Data Audit

<img width="1229" height="486" alt="Harmonization Gap" src="https://github.com/user-attachments/assets/f7fcd94e-aff0-455c-b63d-da88064ec1c7" />

Our audit of **14 international biobank nodes** revealed:

🔴 **Only 1.04% of variables are currently harmonized** (120 out of 11,511 unique variables)

This "Harmonization Gap" is why federated learning projects struggle:
- 98.96% of data cannot be used for cross-site training without additional mapping
- Different sites use different terminologies for the same clinical concepts
- No systematic way to discover what's compatible before launching FL

**FedViz addresses this by:**
✅ Making the gap visible through the harmonization matrix  
✅ Enabling targeted harmonization efforts where they matter most  
✅ Allowing researchers to select the 1.04% high-quality feature space for immediate FL pilots  
✅ Providing a roadmap for expanding harmonization to 5%+ through semantic mapping (future work)

---

## 🎯 Impact: Enabling Federated Learning Collaboration

### Before FedViz
❌ Sites operate in silos, unaware of each other's data  
❌ FL projects launch blindly, discover incompatibilities mid-training  
❌ Months wasted on failed harmonization attempts  
❌ No systematic assessment of network readiness

### After FedViz
✅ **Transparent discovery**: See what data exists across the network  
✅ **Informed planning**: Select compatible sites before FL training  
✅ **Targeted harmonization**: Focus efforts on high-value features  
✅ **Accelerated collaboration**: Reduce setup time from months to days

---

## 🔬 Use Case Example: Metabolic Disease Study

**Research Question:** Train a federated model to predict diabetes risk across international cohorts.

**Using FedViz:**

1. **Discovery Phase**:
   - Query dashboard for sites with diabetes diagnosis data
   - Identify 6/8 sites have `has_diabetes` field
   - Check sample sizes: 15K to 345K patients per site
   
2. **Readiness Check**:
   - View federated statistics: diabetes prevalence ranges 8-12% across sites (comparable)
   - Age distributions align (mean 45-52 years)
   - All 6 sites have required covariates (age, BMI, genomic data)

3. **Harmonization Gap Analysis**:
   - Matrix shows 42 shared clinical features across these 6 sites
   - Identifies 3 key features with naming mismatches requiring alignment
   
4. **FL Project Launch**:
   - Select 6 compatible sites for federated training
   - Use harmonized 42-feature set
   - Proceed with confidence, knowing data landscape upfront

**Result:** Project completes in 2 weeks instead of 6 months of trial-and-error.

---

## 🚧 Future Directions

### Automated Semantic Harmonization
- **LLM-powered term mapping**: Automatically suggest synonyms for clinical variables
- **Expected impact**: Increase readiness index from 1.04% → 5%+
- **Example**: Map "HBP_AGE" (Site A) ↔ "hypertension_diagnosis_age" (Site B)

### Real-Time FL Model Performance Tracking
- Display per-site confusion matrices during federated training
- Track convergence metrics across heterogeneous data distributions
- Visualize fairness metrics (performance equity across demographics)

### Multi-Modal Data Support
- Extend beyond tabular data to imaging, genomics, EHR time-series
- Visualize data modality availability matrix
- Enable multi-modal FL project planning

---

## 📜 License & Citation

**MIT License** – Deploy freely at your biobank to audit FL readiness.

### References

**IHCC Consortium:**
```bibtex
@article{IHCC2020,
  title={The International HundredK+ Cohorts Consortium: Integrating Large-scale Cohorts for Global Health},
  author={Manolio, Teri A. and Goodhand, Peter and Lowrance, William and others},
  journal={Gene},
  volume={738},
  pages={144491},
  year={2020},
  publisher={Elsevier},
  doi={10.1016/j.gene.2020.144491}
}
```

**NVIDIA FLARE:**
```bibtex
@article{Roth2022,
  title={{NVIDIA FLARE}: Federated Learning from Simulation to Real-World},
  author={Roth, Holger R. and Cheng, Yan and Wen, Yuhong and Yang, Isaac and Xu, Ziyue and Hsieh, Yuan-Ting and others},
  journal={arXiv preprint arXiv:2210.13291},
  year={2022},
  url={https://arxiv.org/abs/2210.13291}
}
```

---

## 👥 Contributors

- **Hieu (Henry) Ngo**
- **Yuan-Ting Hsieh**
- **Aditya Kumar Karna**

---

**FedViz** — *Bridging the gap between raw biobank heterogeneity and robust federated model training.*
