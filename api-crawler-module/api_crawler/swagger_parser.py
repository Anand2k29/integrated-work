import requests
import logging


class SwaggerParser:

    def __init__(self, swagger_url):

        self.swagger_url = swagger_url

    def fetch_swagger_json(self):

        try:

            response = requests.get(self.swagger_url)

            response.raise_for_status()

            logging.info(
                "Swagger JSON fetched successfully"
            )

            return response.json()

        except requests.exceptions.RequestException as e:

            logging.error(
                f"Failed to fetch Swagger JSON: {e}"
            )

            return None

    def extract_endpoints(self):

        data = self.fetch_swagger_json()

        if not data:
            return []

        endpoints = []

        paths = data.get("paths", {})

        for path, methods in paths.items():

            for method in methods.keys():

                endpoints.append({
                    "url": path,
                    "method": method.upper()
                })

        logging.info(
            f"Extracted {len(endpoints)} endpoints"
        )

        return endpoints
