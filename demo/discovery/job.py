"""
Federated Cohort Discovery Job

Collects cohort metadata from multiple biobank sites without sharing raw patient data.
"""
import argparse

from recipe import CohortDiscoveryRecipe
from nvflare.recipe.sim_env import SimEnv


def main():
    parser = argparse.ArgumentParser(description="Federated Cohort Discovery")
    parser.add_argument("-n", "--n_clients", type=int, default=8)
    parser.add_argument("-d", "--data_root_dir", type=str, default="/tmp/nvflare/cross_bio_bank")
    parser.add_argument("-o", "--output_path", type=str, default="cohort_catalog")
    args = parser.parse_args()
    
    # Generate site names
    sites = [f"site-{i + 1}" for i in range(args.n_clients)]
    
    # Create recipe
    recipe = CohortDiscoveryRecipe(
        name="cohort_discovery",
        data_root_dir=args.data_root_dir,
        output_path=args.output_path,
        min_clients=args.n_clients  # Wait for all sites
    )
    
    print(f"\n{'='*60}")
    print("Federated Cohort Discovery")
    print(f"{'='*60}")
    print(f"Sites: {', '.join(sites)}")
    print(f"Data directory: {args.data_root_dir}")
    print(f"Output: {args.output_path}.json and {args.output_path}.csv")
    print(f"{'='*60}\n")
    
    # Execute with simulation environment
    env = SimEnv(clients=sites, num_threads=args.n_clients)
    recipe.execute(env)

    print(f"\n{'='*60}")
    print("✓ Cohort discovery complete!")
    print(f"{'='*60}")
    print(f"Output location:")
    print(f"  /tmp/nvflare/simulation/cohort_discovery/server/")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
