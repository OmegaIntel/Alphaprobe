# /api/logging_config.py

import os
import logging
from logging.handlers import RotatingFileHandler

LOG_FILE = os.getenv("LOG_FILE", "/app/logs/app.log")

handler = RotatingFileHandler(
    LOG_FILE,
    maxBytes=10 * 1024 * 1024,
    backupCount=5,
)
formatter = logging.Formatter(
    "%(asctime)s %(levelname)s %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
handler.setFormatter(formatter)

root = logging.getLogger()
root.setLevel(logging.DEBUG)
root.addHandler(handler)

# Also echo to stdout so container logs capture it
stream_handler = logging.StreamHandler()
stream_handler.setFormatter(formatter)
root.addHandler(stream_handler)

for noisy in (
    "botocore",
    "boto3",
    "urllib3",
    "s3transfer",
    "passlib",
    "passlib.utils.compat",
    "passlib.registry",
    "httpcore",
    "httpx",
    "python_multipart",
):
    logging.getLogger(noisy).setLevel(logging.WARNING)