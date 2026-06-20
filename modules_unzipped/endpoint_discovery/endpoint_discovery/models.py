from dataclasses import dataclass, field
import re
from typing import Any, Dict, List, Optional

@dataclass(frozen=True)
class DiscoveredEndpoint:
    """Represents an API endpoint found during discovery."""
    method: str             # GET, POST, etc.
    path: str               # e.g., "/api/v1/users/{id}"
    request_body_required: bool = False
    has_auth: bool = False
    parameters: List[Dict[str, Any]] = field(default_factory=list, hash=False)
    request_body_schema: Optional[Dict[str, Any]] = None
    source: str = "openapi"

    def __repr__(self):
        return f"[{self.method}] {self.path} ({self.source})"

    @property
    def dynamic_parameters(self) -> List[str]:
        """Extracts names of path parameters from the path (e.g., {userId})."""
        return re.findall(r'\{([^}]+)\}', self.path)

    def to_dict(self):
        """Standardized output for other teams."""
        return {
            "method": self.method,
            "path": self.path,
            "request_body_required": self.request_body_required,
            "has_auth": self.has_auth,
            "parameters": self.parameters,
            "request_body_schema": self.request_body_schema,
            "source": self.source,
            "dynamic_parameters": self.dynamic_parameters
        }
