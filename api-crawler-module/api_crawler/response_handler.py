import logging


class ScanResponse:

    def __init__(
        self,
        url,
        method,
        status_code,
        response_body
    ):

        self.url = url
        self.method = method
        self.status_code = status_code
        self.response_body = response_body

    def to_dict(self):

        return {
            "url": self.url,
            "method": self.method,
            "status_code": self.status_code,
            "response_body": self.response_body
        }


class ResponseHandler:

    def __init__(self):

        self.responses = []

    def add_response(
        self,
        url,
        method,
        status_code,
        response_body
    ):

        response = ScanResponse(
            url,
            method,
            status_code,
            response_body
        )

        self.responses.append(response)

        logging.info(
            f"Response stored for {url}"
        )

    def get_all_responses(self):

        return [
            response.to_dict()
            for response in self.responses
        ]
