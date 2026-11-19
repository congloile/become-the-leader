import json
from pathlib import Path
import sys

print("Python:", sys.executable)

file_path = Path(__file__).with_name("scenarios.json")

with open(file_path, "r", encoding="utf-8") as file:
    scenarios = json.load(file)

print("Scenarios:", len(scenarios))
print("Choices:", sum(len(s["choices"]) for s in scenarios))
