from api_crawler.logger import (
    setup_logger
)

from api_crawler.swagger_parser import (
    SwaggerParser
)

from api_crawler.crawler import (
    APICrawler
)

from api_crawler.response_handler import (
    ResponseHandler
)

from api_crawler.config import (
    SWAGGER_URL
)

import logging


# Initialize Logger
setup_logger()

logging.info("Starting API Crawler")


# Parse Swagger/OpenAPI
parser = SwaggerParser(SWAGGER_URL)

endpoints = parser.extract_endpoints()


# Start Crawling
crawler = APICrawler(endpoints)

results = crawler.crawl()


# Store Responses
response_handler = ResponseHandler()

for result in results:

    response_handler.add_response(
        url=result["url"],
        method=result["method"],
        status_code=result["status_code"],
        response_body=result["response_body"]
    )


# Print Results
stored_responses = (
    response_handler.get_all_responses()
)

for response in stored_responses:

    print(response)


logging.info("API Crawling Completed")
