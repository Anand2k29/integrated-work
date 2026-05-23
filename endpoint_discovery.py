"""
Endpoint Discovery & API Crawling Module
Team Alpha — Task 6

Consolidated logic for OpenAPI parsing and dynamic API crawling.
"""

import json
import re
import logging
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Set
from urllib.parse import urljoin

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─── Models ───────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class DiscoveredEndpoint:
    """Represents an API endpoint found during discovery."""
    path: str               # e.g., "/api/v1/users/{id}"
    method: str             # GET, POST, etc.
    parameters: List[Dict[str, Any]] = field(default_factory=list)
    request_body_schema: Optional[Dict[str, Any]] = None
    source: str = "manual"  # "openapi", "crawler"

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
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return cls(data)

    def parse(self) -> List[DiscoveredEndpoint]:
        """Extracts endpoints from the specification."""
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
        return discovered

    def _extract_body_schema(self, method_details: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        # OpenAPI 3.x
        content = method_details.get("requestBody", {}).get("content", {})
        if "application/json" in content:
            return content["application/json"].get("schema")

        # Swagger 2.0
        for param in method_details.get("parameters", []):
            if param.get("in") == "body":
                return param.get("schema")
        return None


# ─── API Crawler ──────────────────────────────────────────────────────────────

class APICrawler:
    """
    Spiders a target API to discover endpoints by following links
    and analyzing JSON response structures.
    """

    def __init__(self, base_url: str, max_depth: int = 3, headers: Optional[Dict[str, str]] = None):
        self.base_url = base_url.rstrip('/')
        self.max_depth = max_depth
        self.headers = headers or {}
        self.visited_urls: Set[str] = set()
        self.discovered_endpoints: List[DiscoveredEndpoint] = []
        self.path_regex = re.compile(r'"(/[a-zA-Z0-9\-_/]+)"')

    async def crawl(self, client: Any, start_path: str = "/"):
        """
        Starts the crawling process using an external HTTP client (e.g. httpx).
        """
        queue = [(start_path, 0)]

        while queue:
            current_path, depth = queue.pop(0)
            full_url = urljoin(self.base_url, current_path)

            if full_url in self.visited_urls or depth > self.max_depth:
                continue

            self.visited_urls.add(full_url)
            logger.info(f"Crawling: {full_url}")

            try:
                # Assuming client has an async .get method
                response = await client.get(full_url, headers=self.headers)

                self.discovered_endpoints.append(
                    DiscoveredEndpoint(path=current_path, method="GET", source="crawler")
                )

                if response.status_code == 200:
                    # Look for more paths in the response
                    text = response.text
                    potential_paths = self.path_regex.findall(text)
                    for p in potential_paths:
                        if p.startswith('/') and len(p) > 1:
                            queue.append((p, depth + 1))
            except Exception as e:
                logger.error(f"Error crawling {full_url}: {e}")

        return self.discovered_endpoints
