import sys
import subprocess

print("Installing Flask using:", sys.executable)

# Install pip if it is missing
try:
    import pip
except ImportError:
    subprocess.check_call([
        sys.executable, "-m", "ensurepip", "--upgrade"
    ])

# Install Flask
subprocess.check_call([
    sys.executable, "-m", "pip", "install", "flask"
])

print("Flask installation completed!")
