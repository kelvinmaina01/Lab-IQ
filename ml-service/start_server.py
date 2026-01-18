import sys
import os

print("Applying compatibility patches for Python 3.13...")

# 1. Monkeypatch colorama
try:
    import colorama
    if not hasattr(colorama, 'init'):
        print("- Patching colorama.init")
        def dummy_init(*args, **kwargs):
            pass
        colorama.init = dummy_init
except ImportError:
    pass

# 2. Monkeypatch pycparser
try:
    import pycparser
    if not hasattr(pycparser, '__version__'):
        print("- Patching pycparser.__version__")
        pycparser.__version__ = '2.22'
except ImportError:
    pass

import uvicorn

if __name__ == "__main__":
    print("Starting Lab-IQ ML Service...")
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True)
