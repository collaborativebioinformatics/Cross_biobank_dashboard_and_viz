# FedViz: Federated Biomedical Cohort Visualization
<img width="1024" height="559" alt="image" src="https://github.com/user-attachments/assets/bd170d99-4652-4da3-a96e-050865b293fb" />


## CMU × NVIDIA Federated Learning Hackathon (Jan 7–9, 2026) 
CMU × NVIDIA Federated Learning Hackathon (Jan 7–9, 2026) Empowering international biobank collaboration through transparent data harmonization and federated readiness auditing.

### Team: Visualization Tool for Multiple Datasets

---

## Project introduction (dashboard + biobank visualization)

This project delivers a unified dashboard for exploring and communicating results derived from large-scale biobank data. It is designed to make cross-cohort evidence easier to interpret, compare, and act upon by bringing harmonized metrics, study outputs, and validation summaries into a single, consistent visualization layer. The dashboard supports interactive exploration across biobanks and subpopulations, enabling stakeholders to move from high-level summaries to cohort- and site-specific details without losing methodological context.
![Dashboard](./Dashboard.PNG)

## 🖼️ Dashboard Architecture
The FedViz dashboard is designed for clinical research credibility and actionable insight.

1. Federated Lineage (Sankey Chart)
Visualizes the flow of data from 14 International Cohorts → Individual Variables → Scientific Domains (Demographics, Clinical, Lifestyle, etc.). This tracks how diverse site data converges into a unified training set.

2. Harmonization Surface (Presence Matrix)
A high-density heatmap revealing the "Surface Area" of the federation. It identifies "Feature Bundles" that travel together across sites, essential for selecting robust FL model features.

3. Interactive KPIs & Readiness
Readiness Index: Currently 1.04%—revealing that of 11,511 unique variables, only a fraction are immediately compatible across all nodes.

Global Registry: A searchable index of all federated variables with real-time statistics (Mean, Count, Null-rates) derived from site metadata.

🏗️ Technical Stack
Frontend: React, TypeScript, Recharts, and Apache ECharts for high-performance scientific visualization.

Backend: Python + Elasticsearch (7.17.x) for fast metadata indexing and search retrieval.

ML Integration: NVIDIA FLARE (NVFlare) for federated training simulations and cross-site evaluation metrics.

## Methods

The system is built on Elasticsearch to index clinical metadata. The frontend is a React and TypeScript. The implementation builds on top of the IHCC UI.

For data discovery, the dashboard shows how many features are shared across sites. After training a federated model, evaluation results from each site can be visualized, including confusion matrices and other performance metrics, to provide a clearer view of model performance across cohorts.

## Sample Use Case

Our audit of the 14 international nodes revealed that only 120 variables (1.04%) are currently harmonized for immediate federated training. The dashboard successfully visualized this "Harmonization Gap." In a proof of concept study, we used the matrix to select a common feature space for metabolic disease research. This allowed us to filter out 98% of the unharmonized noise and focus on the high quality features that ensure model stability.
!<img width="1229" height="486" alt="Screenshot 2026-01-09 at 2 01 06 PM" src="https://github.com/user-attachments/assets/f7fcd94e-aff0-455c-b63d-da88064ec1c7" />
 
The 1.04% readiness index is the current baseline for international federated genomics. This low percentage highlights the difficulty of aligning different biobank standards. Our dashboard provides a way to measure this gap and select the most reliable data for AI. We chose the MIT License so that any biobank can deploy this discovery tool to audit their own internal readiness.

This project is currently under active development. We are in the process of adding more informative graphs, including site density comparisons and multimodal data distributions. A major focus for the final stage is the integration of automated semantic mapping using large language models to suggest synonyms for unharmonized clinical terms. This is expected to increase the readiness index from 1.04% to over 5% by bridging the gap between different site terminologies.

---

## Discussion / Future Directions


For results, we want to show performance statistics and visualization that are specific to fedarated learning across the biobank. This is separated into model type: classification, clustering, and feature importance, including at the server node and the client nodes.

For example, a confusion matrix for classification model that also show the individual cohort True Positive, True Negative, False Positive, False Negative. Graph that show the performance of the federated model on each cohorts such as accuracy and the ROC curve.

## How to setup the system

1. First, install npm and docker

2. Then, run the ihcc-api server:
```
cd ihcc-api
# run elasticsearch
# Run Elasticsearch 7.x (compatible with Arranger)
docker run -d \
  --name elasticsearch \
  -p 9200:9200 \
  -p 9300:9300 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  docker.elastic.co/elasticsearch/elasticsearch:7.17.10

# run the api server
npm run build
npm run prod
```

3. Load your data (in a new terminal):
```
# Install Python dependencies
pip install -r ihcc-api/scripts/requirements.txt

# Import your CSV file
python ihcc-api/scripts/import_csv.py your_cohorts.csv

# Or try the example data
python ihcc-api/scripts/import_csv.py ihcc-api/scripts/example_cohorts.csv
```

See [DATA_IMPORT_GUIDE.md](./DATA_IMPORT_GUIDE.md) for CSV format details.

4. Then, open another terminal, run the ihcc-ui:
```
cd ihcc-ui
cp .schema.env .env
npm run buildAndServe
```
## 📜 License & Citation
Released under the MIT License.

Manolio, T. A., et al. (2020). The International HundredK+ Cohorts Consortium: Integrating Large-scale Cohorts for Global Health. Gene, 738, 144491.

## FedViz — Bridging the gap between raw biobank heterogeneity and robust federated model training.

## Contributors

- Hieu (Henry) Ngo
- Yuan-Ting Hsieh
- Aditya Kumar Karna
