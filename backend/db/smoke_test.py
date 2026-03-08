"""One-command DB smoke test (init -> seed -> export).

Run from backend/:
  python -m db.smoke_test
"""

try:
    from db.init_db import main as init
    from db.demo_seed import main as seed
    from db.export import main as export_main
except ImportError:  # pragma: no cover
    from .init_db import main as init
    from .demo_seed import main as seed
    from .export import main as export_main

import sys

def main():
    init()
    seed()
    # emulate CLI args for export
    sys.argv = ["export", "--format", "csv", "--out", "../data/exports/styleattack.csv"]
    export_main()
    sys.argv = ["export", "--format", "json", "--out", "../data/exports/styleattack.json"]
    export_main()
    print("✅ Smoke test complete.")

if __name__ == "__main__":
    main()
