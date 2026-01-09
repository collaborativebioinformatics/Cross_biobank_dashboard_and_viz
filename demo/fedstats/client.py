from pathlib import Path
from typing import Dict, Optional

import pandas as pd

from nvflare.app_opt.statistics.df.df_core_statistics import DFStatisticsCore


class PatientStatistics(DFStatisticsCore):
    """
    Computes statistics on patient data using pandas DataFrames.
    
    This is the CORRECT use of DFStatistics - computing actual statistical
    measures (mean, stddev, histograms) on numerical features.
    """
    
    def __init__(
        self,
        data_root_dir: str = "/tmp/nvflare/cross_bio_bank",
        filename: str = "patients.csv"
    ):
        """
        Args:
            data_root_dir: Root directory containing site data
            filename: Name of CSV file to read at each site
        """
        super().__init__()
        self.data_root_dir = data_root_dir
        self.filename = filename
        self.data: Optional[Dict[str, pd.DataFrame]] = None
    
    def initialize(self, fl_ctx):
        """Load data when executor initializes."""
        # Get site name
        site_name = fl_ctx.get_identity_name()
        
        # Load CSV
        csv_path = Path(self.data_root_dir) / site_name / self.filename
        df = pd.read_csv(csv_path)
        
        # Convert categorical to numerical for statistics
        # Map Yes/No to 1/0 for computing statistics on these fields
        for col in df.columns:
            if df[col].dtype == 'object' and set(df[col].unique()).issubset({'Yes', 'No'}):
                df[col] = (df[col] == 'Yes').astype(int)
        
        # Store as dataset dictionary (DFStatistics expects this format)
        self.data = {"patients": df}
        
        self.log_info(fl_ctx, f"Loaded {len(df)} records from {csv_path}")
        self.log_info(fl_ctx, f"Features: {list(df.columns)}")

