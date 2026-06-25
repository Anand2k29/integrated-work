import json
import logging
from typing import Any, Dict
from .parser import OpenAPIParser

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def discover_and_save(input_source: str, output_file: str = "discovered_endpoints.json"):
    """Convenience function to parse a spec and save results to a JSON file."""
    if input_source.startswith("http://") or input_source.startswith("https://"):
        parser = OpenAPIParser.from_url(input_source)
    else:
        parser = OpenAPIParser.from_file(input_source)

    result = parser.parse()

    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2)
    except Exception as e:
        logger.error(f"Failed to write output to {output_file}: {e}")

    return result

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        discover_and_save(sys.argv[1])
    else:
        print("Usage: python -m endpoint_discovery.discovery <path_to_openapi_spec>")
