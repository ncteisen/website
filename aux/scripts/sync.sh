#!/bin/bash

set -ex

# ensure we are at root
cd "$(dirname "$0")/../.."

aws s3 sync src/ s3://noaheisen.com  --exclude ".git/*" --exclude ".gitignore" --exclude "*.DS_Store"