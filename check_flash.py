import sys
import importlib.util
from pathlib import Path

print("Python:", sys.executable)
print("Python exists:", Path(sys.executable).exists())

if importlib.util.find_spec("flask"):
    print("Flask is installed!")
else:
    print("Flask is NOT installed.")
