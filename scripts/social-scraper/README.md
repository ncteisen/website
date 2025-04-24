# Social Media Data Fetcher

This script fetches data from various social media platforms and saves it to a JSON file that can be used by the website.

## Setup

1. Install dependencies:
```bash
pip install -r ../../requirements.txt
```

2. Run the script:
```bash
python fetch_social_data.py
```

## Output

The script generates a JSON file at `public/data/social_data.json` with the following structure:

```json
{
  "last_updated": "2024-03-21T10:00:00",
  "github": {},
  "twitter": {},
  "linkedin": {}
}
```

## GitHub Workflow

A GitHub Action runs this script daily at 3 AM Pacific Time (10 AM UTC) and automatically commits any changes to the data file.

## Adding New Platforms

To add a new social media platform:

1. Create a new function in `fetch_social_data.py` to fetch data from that platform
2. Add the platform's data to the `data` dictionary in the `main()` function
3. Update the GitHub workflow if additional dependencies are needed 