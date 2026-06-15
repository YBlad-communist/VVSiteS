import sys
from pathlib import Path

path = str(Path(__file__).resolve().parent)
if path not in sys.path:
    sys.path.append(path)

from app import app as application
