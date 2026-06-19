import logging
from typing import List, Dict

from executor.integration.sys_path_setup import setup_paths
setup_paths()

from role_swapper import generate_test_cases
from executor.api.schemas import TaskSubmit

logger = logging.getLogger(__name__)

class JWTBridge:
    """
    Bridges the jwt_role_testing module with the Async Execution System.
    Generates test cases by swapping JWT roles against endpoints that require auth.
    """
    
    @staticmethod
    def generate_jwt_tasks(endpoints: List[Dict], tokens: Dict[str, str], base_url: str = "") -> List[TaskSubmit]:
        """
        Takes a list of endpoint definition dicts (from discovery) and a dict of tokens,
        and uses the role_swapper to generate TaskSubmit objects.
        
        `endpoints` format expected by role_swapper:
        [{"path": "/api/x", "method": "GET", "expected_role": "admin"}, ...]
        
        We adapt the DiscoveredEndpoint dict to this format.
        """
        logger.info(f"Generating JWT test cases for {len(endpoints)} endpoints")
        
        # Prepare endpoints for role_swapper
        swapper_endpoints = []
        for ep in endpoints:
            if not ep.get("has_auth"):
                continue # Skip endpoints that do not require auth
                
            path = ep["path"]
            # We can't know the expected role just from OpenAPI easily unless it's documented in a specific way.
            # We default to 'admin' to trigger maximum BOLA checking, or we can leave it as None and TLL Alpha will figure it out.
            swapper_endpoints.append({
                "path": path,
                "method": ep["method"],
                "expected_role": "admin"  # Default assumption for testing
            })
            
        if not swapper_endpoints:
            logger.info("No endpoints requiring authentication found.")
            return []
            
        # Run role swapper
        test_cases = generate_test_cases(base_url, swapper_endpoints, tokens)
        logger.info(f"Generated {len(test_cases)} JWT role swapping test cases")
        
        # Map to TaskSubmit
        tasks = []
        for tc in test_cases:
            task = TaskSubmit(
                method=tc["method"],
                url=tc["url"],
                headers={"Content-Type": "application/json"},
                payload=None, # Or standard payload if we have one
                auth_token=tc["token"],
                retry_count=3,
                priority_level="P2" # JWT tests run on high priority (P2)
            )
            tasks.append(task)
            
        return tasks
