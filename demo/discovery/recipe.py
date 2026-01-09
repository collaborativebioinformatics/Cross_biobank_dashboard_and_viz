"""
Recipe for federated cohort discovery.

This recipe collects cohort metadata from multiple biobank sites
without sharing raw patient data.
"""
from typing import List

from nvflare.job_config.api import FedJob
from nvflare.recipe.spec import Recipe

from writer import CatalogWriter
from controller import CohortDiscoveryController
from executor import CohortMetadataExtractor


class CohortDiscoveryRecipe(Recipe):
    """
    Recipe for federated cohort discovery workflow.
    
    CohortDiscoveryRecipe facilitates the collection of cohort metadata
    across multiple federated biobank sites. It creates and configures a
    discovery job that gathers cohort information (enrollment, ancestry,
    available data types) without sharing raw patient data.
    
    The recipe sets up server-side components (controller and catalog writer)
    and client-side executors that extract and return cohort metadata.
    
    Args:
        name (str): The name of the cohort discovery job.
        data_root_dir (str): Root directory containing site data. Each site's
            data should be in {data_root_dir}/{site_name}/{data_filename}.
        data_filename (str): Name of the CSV file at each site containing
            patient data. Defaults to "patients.csv".
        output_path (str): Base path for output files (without extension).
            Will generate both JSON and CSV outputs.
        min_clients (int): Minimum number of clients to wait for. Defaults to 1.
            Set this to the number of sites for complete discovery.
    
    Example:
        >>> from cohort_discovery_recipe import CohortDiscoveryRecipe
        >>> from nvflare.recipe.sim_env import SimEnv
        >>>
        >>> recipe = CohortDiscoveryRecipe(
        ...     name="my_discovery",
        ...     data_root_dir="/data/biobanks",
        ...     output_path="cohort_catalog"
        ... )
        >>>
        >>> sites = ["site-1", "site-2", "site-3"]
        >>> env = SimEnv(clients=sites)
        >>> recipe.execute(env)
    """
    
    def __init__(
        self,
        name: str,
        data_root_dir: str = "/tmp/nvflare/cross_bio_bank",
        data_filename: str = "patients.csv",
        output_path: str = "cohort_catalog",
        min_clients: int = 1
    ):
        self.data_root_dir = data_root_dir
        self.data_filename = data_filename
        self.output_path = output_path
        self.min_clients = min_clients
        
        # Create federated job
        job = FedJob(name=name)
        
        # Server-side controller
        controller = CohortDiscoveryController(
            output_path=f"{output_path}.json",
            min_clients=min_clients
        )
        
        # Server-side writer (collects and saves cohort data)
        writer = CatalogWriter(output_path=output_path)
        
        # Add to server
        job.to_server(controller)
        job.to_server(writer, id="catalog_writer")
        
        # Client-side executor
        executor = CohortMetadataExtractor(
            data_root_dir=data_root_dir,
            filename=data_filename
        )
        
        # Add to all clients
        job.to_clients(executor, tasks=["extract_cohort_metadata"])
        
        # Initialize Recipe base class
        Recipe.__init__(self, job)
