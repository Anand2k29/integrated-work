"""
Endpoint Discovery Module
Team Alpha — Task 6

Provides logic for parsing OpenAPI and Swagger specifications to map API endpoints.
"""

import json
import logging
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─── Models ───────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class DiscoveredEndpoint:
    """Represents an API endpoint found during discovery."""
    path: str               # e.g., "/api/v1/users/{id}"
    method: str             # GET, POST, etc.
    parameters: List[Dict[str, Any]] = field(default_factory=list)  # Header, Query, and Path params
    request_body_schema: Optional[Dict[str, Any]] = None            # Expected JSON structure
    source: str = "openapi"

    def __repr__(self):
        return f"[{self.method}] {self.path} ({self.source})"

@dataclass
class DiscoveryResult:
    """Summary of a discovery session."""
    base_url: str
    endpoints: List[DiscoveredEndpoint] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)
    timestamp: str = ""


# ─── OpenAPI Parser ───────────────────────────────────────────────────────────

class OpenAPIParser:
    """Parses OpenAPI 3.0 or Swagger 2.0 specifications."""

    def __init__(self, spec_data: Dict[str, Any]):
        self.spec = spec_data
        self.endpoints: List[DiscoveredEndpoint] = []

    @classmethod
    def from_file(cls, filepath: str) -> "OpenAPIParser":
        """Loads a specification from a JSON file."""
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return cls(data)

    def parse(self) -> List[DiscoveredEndpoint]:
        """
        Main entry point to extract endpoints, methods, and metadata.
        Normalizes discovered data into standard internal objects.
        """
        paths = self.spec.get("paths", {})
        discovered = []

        for path, methods in paths.items():
            for method, details in methods.items():
                if method.lower() in ['get', 'post', 'put', 'delete', 'patch']:
                    endpoint = DiscoveredEndpoint(
                        path=path,
                        method=method.upper(),
                        parameters=details.get("parameters", []),
                        request_body_schema=self._extract_body_schema(details),
                        source="openapi"
                    )
                    discovered.append(endpoint)

        self.endpoints = discovered
        logger.info(f"Successfully parsed {len(discovered)} endpoints from specification.")
        return discovered

    def _extract_body_schema(self, method_details: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Extracts JSON request body schema for mutation and testing."""
        # OpenAPI 3.x structure
        content = method_details.get("requestBody", {}).get("content", {})
        if "application/json" in content:
            return content["application/json"].get("schema")

        # Swagger 2.0 structure
        for param in method_details.get("parameters", []):
            if param.get("in") == "body":
                return param.get("schema")

        return None
