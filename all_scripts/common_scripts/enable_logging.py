# logger_setup.py
import logging
import os
import inspect
from logging.handlers import RotatingFileHandler

def _create_logger():
    # Determine caller filename one level up from where import happens
    # But since we want to create logger on import, get the main script filename instead
    import __main__
    main_file = getattr(__main__, '__file__', None)
    if main_file:
        caller_filename = os.path.splitext(os.path.basename(main_file))[0]
    else:
        # Fallback if run interactively (like in REPL or Jupyter)
        caller_filename = 'interactive_session'

    # Define log directory
    home_dir = os.path.expanduser("~")
    log_dir = os.path.join(home_dir, "Desktop", "log")
    os.makedirs(log_dir, exist_ok=True)

    log_file_path = os.path.join(log_dir, f"{caller_filename}.log")

    logger = logging.getLogger(caller_filename)
    logger.setLevel(logging.DEBUG)

    if not logger.handlers:
        # Rotating file handler with 5MB size limit and 3 backup files
        fh = RotatingFileHandler(log_file_path, maxBytes=100 * 1024 * 1024, backupCount=100)
        fh.setLevel(logging.DEBUG)

        ch = logging.StreamHandler()
        ch.setLevel(logging.WARNING)

        formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
        fh.setFormatter(formatter)
        ch.setFormatter(formatter)

        logger.addHandler(fh)
        logger.addHandler(ch)

    return logger

# Create a global logger variable at import time
_logger = _create_logger()

def print_log(message, level='info'):
    """
    Simple function to log a message at a specified level.
    Usage:
        print_log("message")
        print_log("warning message", level="warning")
    """
    level = level.lower()
    if level == 'debug':
        _logger.debug(message)
    elif level == 'warning':
        _logger.warning(message)
    elif level == 'error':
        _logger.error(message)
    elif level == 'critical':
        _logger.critical(message)
    else:
        _logger.info(message)  
