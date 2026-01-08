# Federated Visualization of Biomedical Datasets

## CMU × NVIDIA Federated Learning Hackathon (Jan 7–9, 2026)


### Team: Visualization Tool for Multiple Datasets

---

## Introduction
## Project introduction (dashboard + biobank visualization)

This project delivers a unified dashboard for exploring and communicating results derived from large-scale biobank data. It is designed to make cross-cohort evidence easier to interpret, compare, and act upon by bringing harmonized metrics, study outputs, and validation summaries into a single, consistent visualization layer. The dashboard supports interactive exploration across biobanks and subpopulations, enabling stakeholders to move from high-level summaries to cohort- and site-specific details without losing methodological context.

## Methods

The system is built on a containerized stack using Docker and Elasticsearch to index clinical metadata. The frontend is a React and TypeScript application that uses the Nivo library for data visualization. The implementation builds on top of the IHCC UI. For data discovery, the dashboard shows how many features are shared across sites. After training a federated model, evaluation results from each site can be visualized, including confusion matrices and other performance metrics, to provide a clearer view of model performance across cohorts.

## Sample Use Case

Our audit of the 14 international nodes revealed that only 120 variables (1.04%) are currently harmonized for immediate federated training. The dashboard successfully visualized this "Harmonization Gap." In a proof of concept study, we used the matrix to select a common feature space for metabolic disease research. This allowed us to filter out 98% of the unharmonized noise and focus on the high quality features that ensure model stability.
! <img width="2934" height="1448" alt="image" src="https://github.com/user-attachments/assets/5e69f922-5e26-4378-91fc-634eab30af90" />
The 1.04% readiness index is the current baseline for international federated genomics. This low percentage highlights the difficulty of aligning different biobank standards. Our dashboard provides a way to measure this gap and select the most reliable data for AI. We chose the MIT License so that any biobank can deploy this discovery tool to audit their own internal readiness.

This project is currently under active development. We are in the process of adding more informative graphs, including site density comparisons and multimodal data distributions. A major focus for the final stage is the integration of automated semantic mapping using large language models to suggest synonyms for unharmonized clinical terms. This is expected to increase the readiness index from 1.04% to over 5% by bridging the gap between different site terminologies.

---

## Discussion / Future Directions



Furthermore, we are preparing to export selected variables/statistics directly into NVIDIA FLARE configuration files. This will allow for the seamless transition from model training to visualization. By the end of the hackathon, we expect to demonstrate a complete pipeline where discovery leads directly to a visualized dashboard, showing real-time model aggregation, weight updates, and results.

For results, we want to show performance statistics and visualization that are specific to fedarated learning across the biobank. This is separated into model type: classification, clustering, and feature importance, including at the server node and the client nodes.



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

3. Then, open another terminal, run the ihcc-ui:
```
cd ihcc-ui
cp .schema.env .env
npm run buildAndServe
```

## References (BibTeX)
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

@article{Roth2022,
  title={{NVIDIA FLARE}: Federated Learning from Simulation to Real-World},
  author={Roth, Holger R. and Cheng, Yan and Wen, Yuhong and Yang, Isaac and Xu, Ziyue and Hsieh, Yuan-Ting and others},
  journal={arXiv preprint arXiv:2210.13291},
  year={2022},
  url={https://arxiv.org/abs/2210.13291}
}
