import subprocess
import sys

packages = [
    # Web backend
    "fastapi",
    "uvicorn[standard]",
    "sqlalchemy",
    "sqlmodel",
    "psycopg[binary]",
    "alembic",
    "python-dotenv",
    "pydantic",
    "pydantic-settings",
    "httpx",
    "requests",

    # Data / utility
    "pandas",
    "numpy",
    "scikit-learn",
    "tqdm",

    # LLM / NLP
    "openai",
    "transformers",
    "datasets",
    "sentencepiece",
    "accelerate",
    "tokenizers",
    "safetensors",

    # Adversarial / evaluation related
    "textattack",
    "garak",

    # Optional but often useful
    "jinja2",
    "python-multipart",
    "typing-extensions"
]

def install(pkg: str):
    print(f"\n>>> Installing {pkg} ...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", pkg])

def main():
    print("Upgrading pip...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade", "pip"])

    failed = []

    for pkg in packages:
        try:
            install(pkg)
        except subprocess.CalledProcessError:
            print(f"!!! Failed to install: {pkg}")
            failed.append(pkg)

    print("\n========== INSTALL RESULT ==========")
    if not failed:
        print("All packages installed successfully.")
    else:
        print("Some packages failed:")
        for pkg in failed:
            print(f" - {pkg}")

if __name__ == "__main__":
    main()