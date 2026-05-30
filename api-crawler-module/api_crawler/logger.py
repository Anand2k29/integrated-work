import logging


def setup_logger():

    logging.basicConfig(
        level=logging.INFO,

        format=(
            "%(asctime)s - "
            "%(levelname)s - "
            "%(message)s"
        ),

        filename="crawler.log",

        filemode="a"
    )

    console = logging.StreamHandler()

    console.setLevel(logging.INFO)

    formatter = logging.Formatter(
        "%(asctime)s - "
        "%(levelname)s - "
        "%(message)s"
    )

    console.setFormatter(formatter)

    logging.getLogger().addHandler(console)

    logging.info("Logger Initialized")
