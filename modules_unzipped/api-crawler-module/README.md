
# API Crawler Module

## Overview

The API Crawler Module is part of Team Alpha's
API Security Scanner pipeline.

The module is responsible for:
- crawling API endpoints
- handling authenticated requests
- collecting API responses
- parsing Swagger/OpenAPI documentation
- preparing structured request data

---

## Features

- Swagger/OpenAPI Parsing
- Endpoint Extraction
- JWT/Bearer Authentication
- Automated API Crawling
- Response Collection
- Logging & Error Handling

---

## Technologies Used

- Python 3.11
- requests
- JSON
- Swagger/OpenAPI
- logging
- PyJWT

---

## Project Structure

api_crawler/
│
├── crawler.py
├── swagger_parser.py
├── auth_handler.py
├── response_handler.py
├── logger.py
├── config.py

tests/
│
└── test_crawler.py

requirements.txt
README.md
main.py

---

## Working of the Module

1. Extract endpoints from Swagger/OpenAPI
2. Handle authenticated requests
3. Crawl API endpoints automatically
4. Collect API responses
5. Store structured response data
6. Log crawler activity and errors

---

## Future Improvements

- Async crawling support
- Retry and timeout management
- Database integration
- Mutation Engine integration
- Distributed crawling
- Response Diff Engine integration

---

## Author
Ananya  
Module 2 — API Crawler  
Team Alpha
