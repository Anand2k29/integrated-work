import unittest
import json
import os
from endpoint_discovery import OpenAPIParser

class TestEdgeCases(unittest.TestCase):

    def test_missing_paths_section(self):
        """Should return empty list, not crash when 'paths' is missing."""
        spec = {
            "openapi": "3.0.0",
            "info": {"title": "Test API", "version": "1.0.0"}
        }
        parser = OpenAPIParser(spec)
        result = parser.parse()
        self.assertEqual(result["endpoints"], [])
        self.assertIn("Missing 'paths' section in specification.", result["errors_encountered"])

    def test_empty_paths_object(self):
        """Should return empty list when 'paths' is empty."""
        spec = {
            "openapi": "3.0.0",
            "paths": {}
        }
        parser = OpenAPIParser(spec)
        result = parser.parse()
        self.assertEqual(result["endpoints"], [])
        self.assertEqual(result["total_endpoints"], 0)

    def test_missing_request_body(self):
        """Should default gracefully when request body is missing."""
        spec = {
            "openapi": "3.0.0",
            "paths": {
                "/users": {
                    "post": {
                        "responses": {"200": {"description": "OK"}}
                    }
                }
            }
        }
        parser = OpenAPIParser(spec)
        result = parser.parse()
        self.assertEqual(len(result["endpoints"]), 1)
        self.assertFalse(result["endpoints"][0]["request_body_required"])

    def test_duplicate_endpoints(self):
        """Should deduplicate and log warning."""
        spec = {
            "openapi": "3.0.0",
            "paths": {
                "/users/": {
                    "get": {"responses": {"200": {"description": "OK"}}}
                },
                "/users": {
                    "get": {"responses": {"200": {"description": "OK"}}}
                }
            }
        }
        parser = OpenAPIParser(spec)
        result = parser.parse()
        # Should be 1 because /users/ and /users normalize to the same path
        self.assertEqual(len(result["endpoints"]), 1)
        self.assertEqual(result["total_endpoints"], 1)
        self.assertTrue(any("Duplicate endpoint detected" in err for err in result["errors_encountered"]))

    def test_invalid_http_method(self):
        """Should skip invalid method, continue parsing others."""
        spec = {
            "openapi": "3.0.0",
            "paths": {
                "/users": {
                    "heads": {"responses": {"200": {"description": "OK"}}},
                    "get": {"responses": {"200": {"description": "OK"}}}
                }
            }
        }
        parser = OpenAPIParser(spec)
        result = parser.parse()
        self.assertEqual(len(result["endpoints"]), 1)
        self.assertEqual(result["endpoints"][0]["method"], "GET")
        self.assertTrue(any("Invalid HTTP method 'heads'" in err for err in result["errors_encountered"]))

    def test_path_normalization(self):
        """Test various path normalization scenarios."""
        parser = OpenAPIParser({})
        self.assertEqual(parser._normalize_path("//api///users"), "/api/users")
        self.assertEqual(parser._normalize_path("/api/users/"), "/api/users")
        self.assertEqual(parser._normalize_path("api/users"), "/api/users")
        self.assertEqual(parser._normalize_path("/"), "/")
        self.assertEqual(parser._normalize_path(""), "/")

    def test_invalid_json_graceful_error(self):
        """Test that invalid JSON doesn't crash from_file."""
        test_file = "invalid_spec.json"
        with open(test_file, "w") as f:
            f.write("{ invalid json")

        try:
            parser = OpenAPIParser.from_file(test_file)
            result = parser.parse()
            self.assertEqual(result["endpoints"], [])
            self.assertTrue(any("Could not load file" in err for err in result["errors_encountered"]))
        finally:
            if os.path.exists(test_file):
                os.remove(test_file)

if __name__ == '__main__':
    unittest.main()
