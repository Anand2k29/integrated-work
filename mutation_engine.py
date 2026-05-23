"""
Mutation Engine
Team Alpha — Task 6

Logic to mutate API requests for vulnerability testing (BOLA, BFLA, etc).
"""

import re
import copy
from typing import List, Dict, Any, Optional

class MutationEngine:
    """
    Mutates baseline requests into challenger requests.
    """

    @staticmethod
    def swap_path_ids(path: str, new_id: str) -> str:
        """/api/users/1 -> /api/users/2"""
        id_pattern = re.compile(r'/(\d+|[a-f0-9\-]{36})(?=/|$)')
        return id_pattern.sub(f'/{new_id}', path)

    @staticmethod
    def mutate_body(body: Dict[str, Any], target_key: str, new_value: Any) -> Dict[str, Any]:
        """Modifies a specific key in a JSON body."""
        new_body = copy.deepcopy(body)

        def _recursive_replace(obj):
            if isinstance(obj, dict):
                if target_key in obj:
                    obj[target_key] = new_value
                for k, v in obj.items():
                    _recursive_replace(v)
            elif isinstance(obj, list):
                for item in obj:
                    _recursive_replace(item)

        _recursive_replace(new_body)
        return new_body

    @staticmethod
    def swap_tokens(headers: Dict[str, str], new_token: str) -> Dict[str, str]:
        """Replaces Authorization header."""
        new_headers = copy.deepcopy(headers)
        auth_key = next((k for k in new_headers if k.lower() == "authorization"), "Authorization")
        new_headers[auth_key] = f"Bearer {new_token}"
        return new_headers
