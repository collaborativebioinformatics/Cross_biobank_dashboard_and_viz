"""
Controller for federated cohort discovery.

This orchestrates the collection of cohort metadata from multiple biobank sites.
"""
from typing import Dict, List

from nvflare.apis.client import Client
from nvflare.apis.controller_spec import ClientTask, Task
from nvflare.apis.dxo import from_shareable
from nvflare.apis.fl_constant import ReturnCode
from nvflare.apis.fl_context import FLContext
from nvflare.apis.impl.controller import Controller
from nvflare.apis.shareable import Shareable
from nvflare.apis.signal import Signal


class CohortDiscoveryController(Controller):
    """
    Controller for federated cohort metadata collection.
    
    This is NOT a federated statistics controller - it simply collects
    cohort metadata from each site without computing global statistics.
    """
    
    def __init__(
        self,
        output_path: str = "cohort_catalog.json",
        min_clients: int = 1,
        wait_time_after_min_received: int = 1
    ):
        """
        Args:
            output_path: Where to save collected cohort metadata
            min_clients: Minimum number of clients to wait for
            wait_time_after_min_received: Seconds to wait after min clients respond
        """
        super().__init__()
        self.output_path = output_path
        self.min_clients = min_clients
        self.wait_time_after_min_received = wait_time_after_min_received
        self.cohort_metadata: List[Dict] = []
    
    def start_controller(self, fl_ctx: FLContext):
        """Called when controller starts."""
        self.log_info(fl_ctx, "Cohort Discovery Controller started")
    
    def control_flow(self, abort_signal: Signal, fl_ctx: FLContext):
        """Main control flow - request cohort metadata from all sites."""
        self.log_info(fl_ctx, "Requesting cohort metadata from all sites...")
        
        # Create task
        task = Task(
            name="extract_cohort_metadata",
            data=Shareable(),
            result_received_cb=self._result_callback
        )
        
        # Broadcast to all clients
        self.broadcast_and_wait(
            task=task,
            targets=None,  # All clients
            min_responses=self.min_clients,
            fl_ctx=fl_ctx,
            wait_time_after_min_received=self.wait_time_after_min_received,
            abort_signal=abort_signal
        )
        
        self.log_info(
            fl_ctx,
            f"Received cohort metadata from {len(self.cohort_metadata)} sites"
        )
    
    def stop_controller(self, fl_ctx: FLContext):
        """Called when controller stops - save collected metadata."""
        import json
        from pathlib import Path
        
        output_file = Path(fl_ctx.get_engine().get_workspace().get_root_dir()) / self.output_path
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_file, 'w') as f:
            json.dump(self.cohort_metadata, f, indent=2)
        
        self.log_info(fl_ctx, f"Cohort catalog saved to {output_file}")
    
    def _result_callback(self, client_task: ClientTask, fl_ctx: FLContext):
        """Handle result from a client."""
        client_name = client_task.client.name
        result = client_task.result
        rc = result.get_return_code()
        
        if rc == ReturnCode.OK:
            dxo = from_shareable(result)
            cohort_data = dxo.data
            self.cohort_metadata.append(cohort_data)
            self.log_info(
                fl_ctx,
                f"Received cohort metadata from {client_name}: "
                f"{cohort_data.get('cohort_name', 'Unknown')}"
            )
        else:
            self.log_error(
                fl_ctx,
                f"Failed to get cohort metadata from {client_name}: {rc}"
            )
    
    def process_result_of_unknown_task(
        self,
        client: Client,
        task_name: str,
        client_task_id: str,
        result: Shareable,
        fl_ctx: FLContext
    ):
        """Handle unknown task results."""
        self.log_warning(fl_ctx, f"Received unknown task: {task_name}")

