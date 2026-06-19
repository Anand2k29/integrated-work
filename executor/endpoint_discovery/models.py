from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class DiscoveredEndpoint:
    """Represents a single discovered API endpoint."""
    method: str
    path: str
    request_body_required: bool = False
    has_auth: bool = False
    parameters: List[Dict[str, Any]] = field(default_factory=list)
    request_body_schema: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "method": self.method,
            "path": self.path,
            "request_body_required": self.request_body_required,
            "has_auth": self.has_auth,
            "parameters": self.parameters,
            "request_body_schema": self.request_body_schema,
        }
