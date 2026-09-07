"""Prints Search Console's Thai query rows as JSON, for mine-thai-aliases.mjs.

Needs the same service-account key the GA4 script uses
(~/.config/claude-seo/service_account.json), added as a user on the
rozerothai.com property.

Run:  python scripts/gsc-thai-queries.py [days] | node scripts/mine-thai-aliases.mjs
"""
import datetime as dt
import json
import sys
from pathlib import Path

from google.oauth2 import service_account
from googleapiclient.discovery import build

SITE = "sc-domain:rozerothai.com"
DAYS = int(sys.argv[1]) if len(sys.argv) > 1 else 90

creds = service_account.Credentials.from_service_account_file(
    str(Path.home() / ".config" / "claude-seo" / "service_account.json"),
    scopes=["https://www.googleapis.com/auth/webmasters.readonly"],
)
svc = build("searchconsole", "v1", credentials=creds)
end = dt.date.today()
start = end - dt.timedelta(days=DAYS)
rows = (
    svc.searchanalytics()
    .query(
        siteUrl=SITE,
        body={
            "startDate": start.isoformat(),
            "endDate": end.isoformat(),
            "dimensions": ["query", "page"],
            "rowLimit": 5000,
        },
    )
    .execute()
    .get("rows", [])
)
thai = [r for r in rows if any("฀" <= c <= "๿" for c in r["keys"][0])]
print(json.dumps(thai, ensure_ascii=False))
