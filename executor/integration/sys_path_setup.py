import sys
import os
from pathlib import Path

# The base directory of the project
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# The modules_unzipped directory
MODULES_DIR = BASE_DIR / "modules_unzipped"

# Paths to add to sys.path
PATHS_TO_ADD = [
    MODULES_DIR / "endpoint_discovery",
    MODULES_DIR / "api-crawler-module",
    MODULES_DIR / "TLL-alpha" / "TLL-alpha-b4d22e2ae8d804a9767ba8bf13dcac18cf77be8e",
    MODULES_DIR / "Jwt-Role-Testing" / "TLL-alpha-jwt_role_testing" / "jwt_role_testing"
]

def setup_paths():
    """Add unzipped module paths to sys.path so they can be imported."""
    for path in PATHS_TO_ADD:
        path_str = str(path)
        if path_str not in sys.path:
            sys.path.insert(0, path_str)
