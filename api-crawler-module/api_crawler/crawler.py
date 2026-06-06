import requests
import logging


class APICrawler:

    def __init__(self, endpoints, headers=None, timeout=5):

        self.endpoints = endpoints
        self.headers = headers or {}
        self.timeout = timeout

    def crawl(self):

        results = []

        logging.info("Crawler Started")

        for endpoint_data in self.endpoints:

            url = endpoint_data.get("url")
            method = endpoint_data.get("method", "GET")

            try:

                logging.info(
                    f"Crawling {method}: {url}"
                )

                response = requests.request(
                    method=method,
                    url=url,
                    headers=self.headers,
                    timeout=self.timeout
                )

                results.append({
                    "url": url,
                    "method": method,
                    "status_code": response.status_code,
                    "response_body": response.text[:300]
                })

                logging.info(
                    f"Success: {url} "
                    f"({response.status_code})"
                )

            except requests.exceptions.Timeout:

                logging.error(
                    f"Timeout Error: {url}"
                )

            except requests.exceptions.RequestException as e:

                logging.error(
                    f"Request Failed: {url} | {e}"
                )

        logging.info("Crawling Finished")

        return results
