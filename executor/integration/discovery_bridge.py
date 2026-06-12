import logging
from typing import List, Any
import json

from executor.integration.sys_path_setup import setup_paths
setup_paths()

from endpoint_discovery.parser import OpenAPIParser
from executor.api.schemas import TaskSubmit

logger = logging.getLogger(__name__)

class DiscoveryBridge:
    """
    Bridges the endpoint_discovery module with the Async Execution System.
    Parses an OpenAPI spec and generates standard execution tasks (API Crawler tasks).
    """

    # Errors/warnings from the most recent parse, so callers can surface a
    # descriptive validation message to the user instead of a silent no-op.
    last_parse_errors: List[str] = []
    
    @staticmethod
    def generate_tasks_from_spec(spec_source: str, base_url: str = "") -> List[TaskSubmit]:
        """
        Takes a URL or file path to an OpenAPI spec, runs the endpoint_discovery parser,
        and generates a list of base TaskSubmit objects.
        """
        logger.info(f"Running endpoint discovery on {spec_source}")
        
        spec_source = spec_source.strip()

        if not spec_source:
            raise ValueError("OpenAPI specification is empty.")
        
        spec = spec_source.lstrip()

        if spec_source.startswith(("http://", "https://")):
            parser = OpenAPIParser.from_url(spec_source)
        
        elif spec.startswith("{"):
            parser = OpenAPIParser.from_content(
                spec_source,
                source_name="inline_json"
            )
        
        elif spec.startswith(("openapi:", "swagger:")):
            parser = OpenAPIParser.from_content(
                spec_source,
                source_name="inline_yaml"
            )
        
        else:
            parser = OpenAPIParser.from_file(spec_source)
        
        result = parser.parse()
        logger.info(json.dumps(result, indent=2))
        if result.get("errors_encountered"):
            logger.warning(
                f"Parser errors: {result['errors_encountered']}"
            )
        endpoints = result.get("endpoints", [])
        DiscoveryBridge.last_parse_errors = result.get("errors_encountered", []) or []
        
        logger.info(
            f"Discovered {len(endpoints)} endpoints from spec."
        )
        
        if len(endpoints) == 0:
            raise ValueError(
                f"No endpoints discovered. Parser errors: {DiscoveryBridge.last_parse_errors}"
            )
        
        tasks = []
        for ep in endpoints:
            # Generate a base url by combining base_url and path
            # Remove trailing slash from base_url if path starts with it
            target_url = base_url.rstrip("/") + "/" + ep["path"].lstrip("/") if base_url else ep["path"]
            
            # Simple payload generation based on schema (can be extended with fuzzing)
            payload = None
            if ep.get("request_body_required") and ep.get("request_body_schema"):
                # Use a dummy JSON if schema is present
                payload = {"_comment": "Auto-generated dummy payload for crawler"}
                
            task = TaskSubmit(
                method=ep["method"],
                url=target_url,
                headers={"Content-Type": "application/json"} if payload else {},
                payload=payload,
                retry_count=3,
                priority_level="P3"  # Base crawler tasks run on medium priority
            )
            
            # Store some metadata in the task if needed (not directly supported by TaskSubmit, 
            # but we can use headers or wrap it)
            # We'll rely on the orchestrator to check `ep["has_auth"]` later, 
            # so we'll just return a tuple of (task, endpoint_dict) if we want to pass it back.
            
            tasks.append((task, ep))
            
        return tasks
