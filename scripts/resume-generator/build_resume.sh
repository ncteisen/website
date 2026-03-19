#!/usr/bin/env bash
set -e

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

echo "Generating resume.tex from resume_data.json..."
python3 "$REPO_ROOT/scripts/resume-generator/generate_resume.py"

echo "Compiling PDF..."
cd "$REPO_ROOT/resume"
xelatex -interaction=nonstopmode resume.tex

echo "Copying PDF to public/..."
cp "$REPO_ROOT/resume/resume.pdf" "$REPO_ROOT/public/resume.pdf"

echo "Done. resume.pdf updated."
