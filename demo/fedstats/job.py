"""
Federated Statistics Job - Compute cross-site statistics without sharing raw data.

Example: Compute mean age, BMI distribution across all biobanks.
"""
import argparse

from nvflare.recipe.fedstats import FedStatsRecipe
from nvflare.recipe.sim_env import SimEnv

from client import PatientStatistics


def main():
    parser = argparse.ArgumentParser(description="Federated Statistics")
    parser.add_argument("-n", "--n_clients", type=int, default=4)
    parser.add_argument("-d", "--data_root_dir", type=str, default="/tmp/nvflare/cross_bio_bank")
    parser.add_argument("-o", "--output_path", type=str, default="statistics/patient_stats.json")
    args = parser.parse_args()

    # Configure statistics to compute
    statistic_configs = {
        "count": {},
        "mean": {},
        "sum": {},
        "stddev": {},
        "histogram": {
            "*": {"bins": 20},
            "age": {"bins": 10, "range": [0, 120]}
        },
    }

    # Statistics generator
    stats_generator = PatientStatistics(
        filename="patients.csv",
        data_root_dir=args.data_root_dir
    )

    sites = [f"site-{i + 1}" for i in range(args.n_clients)]

    # Create FedStats recipe (this is the RIGHT use case for FedStatsRecipe!)
    recipe = FedStatsRecipe(
        name="patient_stats",
        stats_output_path=args.output_path,
        sites=sites,
        statistic_configs=statistic_configs,
        stats_generator=stats_generator,
    )

    print(f"\n{'='*60}")
    print("Federated Statistics Job")
    print(f"{'='*60}")
    print(f"Sites: {', '.join(sites)}")
    print(f"Statistics: {', '.join(statistic_configs.keys())}")
    print(f"Output: {args.output_path}")
    print(f"{'='*60}\n")

    # Run
    env = SimEnv(clients=sites, num_threads=args.n_clients)
    recipe.execute(env=env)

    print(f"\n{'='*60}")
    print("✓ Federated statistics complete!")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()

