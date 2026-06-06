import requests
import logging


class AuthHandler:

    def __init__(self, token=None):

        self.session = requests.Session()

        self.token = token

        if self.token:

            self.session.headers.update({
                "Authorization": f"Bearer {self.token}"
            })

            logging.info(
                "Authorization header added"
            )

    def get_session(self):

        return self.session

    def update_token(self, new_token):

        self.token = new_token

        self.session.headers.update({
            "Authorization": f"Bearer {self.token}"
        })

        logging.info(
            "JWT token updated successfully"
        )

    def make_authenticated_request(
        self,
        method,
        url,
        **kwargs
    ):

        try:

            response = self.session.request(
                method=method,
                url=url,
                **kwargs
            )

            logging.info(
                f"Authenticated request sent to {url}"
            )

            return response

        except requests.exceptions.RequestException as e:

            logging.error(
                f"Authenticated request failed: {e}"
            )

            return None
