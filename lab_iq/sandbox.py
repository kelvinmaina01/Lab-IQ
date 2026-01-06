
import pandas as pd
import numpy as np
import io
import sys
import matplotlib.pyplot as plt
import base64
import logging
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

logger = logging.getLogger(__name__)

class ExecutionResult(BaseModel):
    success: bool
    output_log: str
    artifacts: Dict[str, Any] = {} # Charts, metrics
    error: Optional[str] = None

class LocalSandbox:
    """
    Executes Python code in a controlled local environment.
    Captures stdout, generated charts, and key variables.
    """

    def __init__(self):
        # Define allowed modules/functions (Safety Layer 1)
        self.allowed_modules = {
            'pd': pd,
            'np': np,
            'plt': plt,
            'io': io,
            'base64': base64
        }

    def execute(self, code: str, dataset_df: pd.DataFrame, context_variables: Dict[str, Any] = {}) -> ExecutionResult:
        """
        Runs the provided pandas code against the dataframe.
        """
        # 1. Setup Environment
        # Create a fresh dictionary for global/local variables
        exec_globals = {
            "df": dataset_df.copy(), # Work on a copy to prevent mutation of source
            **self.allowed_modules,
            **context_variables
        }
        
        # Capture Standard Output (Print statements)
        stdout_capture = io.StringIO()
        original_stdout = sys.stdout
        sys.stdout = stdout_capture

        # Capture Charts
        plt.clf() # Clear previous plots
        
        success = False
        error_msg = None
        artifacts = {}

        try:
            # 2. Strict Execution
            # We wrap code in a try/except block inside the exec if needed, 
            # but here we rely on the outer try/except.
            # Warning: exec() is powerful. In production, consider stronger sandboxing (e.g. docker containers).
            # For this local "Agent", we assume the Agent is non-malicious via Prompt Engineering.
            
            exec(code, exec_globals)
            
            success = True

            # 3. Artifact Extraction
            
            # A. Charts (Matplotlib)
            if plt.get_fignums():
                # Save plot to base64 string
                buf = io.BytesIO()
                plt.savefig(buf, format='png', bbox_inches='tight')
                buf.seek(0)
                img_str = base64.b64encode(buf.read()).decode('utf-8')
                artifacts['chart'] = f"data:image/png;base64,{img_str}"
                plt.clf() # Cleanup

            # B. Metric Extraction logic
            # We look for specific variable names or just return 'result' if it exists
            # Convention: Agent should save key output to 'result' or 'metrics' variable
            if 'metrics' in exec_globals and isinstance(exec_globals['metrics'], (dict, list)):
                artifacts['metrics'] = exec_globals['metrics']
            elif 'result' in exec_globals:
                 artifacts['result'] = str(exec_globals['result'])

        except Exception as e:
            logger.error(f"Sandbox Execution Failed: {str(e)}")
            error_msg = str(e)
            success = False
        
        finally:
            # Restore stdout
            sys.stdout = original_stdout
            output_log = stdout_capture.getvalue()
            stdout_capture.close()

        return ExecutionResult(
            success=success,
            output_log=output_log,
            artifacts=artifacts,
            error=error_msg
        )
