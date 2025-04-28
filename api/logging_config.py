# logging_config.py
import logging
from logging.handlers import RotatingFileHandler

LOG_FILE = "/app/logs/app.log"
handler = RotatingFileHandler(LOG_FILE, maxBytes=10*1024*1024, backupCount=5)
handler.setLevel(logging.DEBUG) 
fmt = "%(asctime)s %(levelname)s %(name)s — %(message)s"
handler.setFormatter(logging.Formatter(fmt, datefmt="%Y-%m-%d %H:%M:%S"))

root = logging.getLogger() 
root.setLevel(logging.DEBUG)
root.addHandler(handler)



for name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
    log = logging.getLogger(name)
    log.setLevel(logging.DEBUG)
    log.addHandler(handler)
