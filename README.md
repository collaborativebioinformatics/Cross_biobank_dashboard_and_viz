# Federated Visualization of Biomedical Datasets

## CMU × NVIDIA Federated Learning Hackathon (Jan 7–9, 2026)


### Team: Visualization Tool for Multiple Datasets

---

## Introduction
## Project introduction (dashboard + biobank visualization)

This project delivers a unified dashboard for exploring and communicating results derived from large-scale biobank data. It is designed to make cross-cohort evidence easier to interpret, compare, and act on by bringing harmonized metrics, study outputs, and validation summaries into a single, consistent visualization layer. The dashboard supports interactive exploration across biobanks and subpopulations, enabling stakeholders to move from high-level summaries to cohort- and site-specific details without losing methodological context.

A central goal is to showcase how multiple teams are using biobank data to advance medical science—improving reproducibility, accelerating hypothesis testing, and translating population-scale evidence into actionable insights. The platform emphasizes transparent provenance (what data, what method, what cohort), side-by-side comparisons of model and study performance, and standardized evaluation views (e.g., predictive performance, calibration, fairness, and error analysis). By consolidating these outputs and presenting them in a shared analytical interface, the dashboard helps align efforts across teams, highlight high-impact findings, and identify where additional data, validation, or methodological innovation can most effectively “move the needle” in biomedical research.

We developed a real-time Discovery Audit Dashboard to address this lack of global visibility without compromising participant privacy. By scanning clinical metadata across 14 international nodes, our tool quantifies the "Readiness Index" of distributed datasets. This approach allows researchers to identify a surgical "Shared Language" of common features, transforming siloed biobank data into a verified configuration for federated machine learning. 


## Methods

How we built it

The system is built on a containerized stack using Docker and Elasticsearch to index clinical metadata. The frontend is a React and TypeScript application that uses the Nivo library for high performance visualization. We integrated the IHCC API to scan 11,511 unique variables across 14 biobank sites. The backend logic calculates a global readiness score based on how many variables exist in at least 50% of the sites. The project is licensed under the MIT License to allow for broad use by biobanks and industry partners.
---
## How to use

A researcher launches the dashboard to see the global readiness gap. The search bar allows users to filter the 11,511 variables to find specific clinical tracks like BMI or HbA1c. The intersection matrix displays which of the 14 sites possess harmonized versions of these variables. Users can rank sites by their data density to select the best nodes for a federated job. This setup provides the configuration parameters needed for an NVIDIA FLARE federated learning task.

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

3. Then, open another terminal, run the ihcc-ui:
```
cd ihcc-ui
cp .schema.env .env
npm run buildAndServe
```
## Results / Use Case

Our audit of the 14 international nodes revealed that only 120 variables (1.04%) are currently harmonized for immediate federated training. The dashboard successfully visualized this "Harmonization Gap." In a proof of concept study, we used the matrix to select a common feature space for metabolic disease research. This allowed us to filter out 98% of the unharmonized noise and focus on the high quality features that ensure model stability.
! <img width="2934" height="1448" alt="image" src="https://github.com/user-attachments/assets/5e69f922-5e26-4378-91fc-634eab30af90" />
---
## Discussion / Future Directions

The 1.04% readiness index is the current baseline for international federated genomics. This low percentage highlights the difficulty of aligning different biobank standards. Our dashboard provides a way to measure this gap and select the most reliable data for AI. We chose the MIT License so that any biobank can deploy this discovery tool to audit their own internal readiness.

This project is currently under active development. We are in the process of adding more informative graphs, including site density comparisons and multimodal data distributions. A major focus for the final stage is the integration of automated semantic mapping using large language models to suggest synonyms for unharmonized clinical terms. This is expected to increase the readiness index from 1.04% to over 5% by bridging the gap between different site terminologies.

Furthermore, we are preparing to finalize the end-to-end model training workflow. We are adding functionality to export selected "Ready" variables directly into NVIDIA FLARE configuration files. This will allow for the seamless transition from variable discovery to active model training. By the end of the hackathon, we expect to demonstrate a complete pipeline where discovery leads directly to a verified federated training session across all 14 nodes, showing real-time model aggregation and weight updates.

## References (BibTeX)
@article{Roth2022,
  title={{NVIDIA FLARE}: Federated Learning from Simulation to Real-World},
  author={Roth, Holger R and others},
  journal={arXiv preprint arXiv:2210.13291},
  year={2022}
}

@article{Bycroft2018,
  title={The UK Biobank resource with deep phenotyping and genomic data},
  author={Bycroft, Clare and others},
  journal={Nature},
  volume={562},
  year={2018}
}

@article{McMahan2017,
  title={Communication-Efficient Learning of Deep Networks from Decentralized Data},
  author={McMahan, Brendan and others},
  booktitle={Artificial Intelligence and Statistics},
  year={2017}
}

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

