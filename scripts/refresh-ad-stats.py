"""Refresh the traffic figures on /advertise from GA4.

data/ads.json carries the numbers the media kit quotes. They are a selling
document, so they have to be the real ones and they have to say which period
they cover -- a figure nobody can date is not evidence. This writes both.

Slot reach is counted the way the slots are actually placed:
  top     every page view on the site
  inline  the three pages that carry the in-content slot
  detail  the detail pages: a monster, item, card, costume or equipment page

Usage:  python scripts/refresh-ad-stats.py [days]     (default 28)
        python scripts/refresh-ad-stats.py --dry-run  (print, write nothing)

Needs the service-account key at ~/.config/claude-seo/service_account.json,
the same one scripts/ga4-report.py uses.
"""
import json
import re
import sys
from datetime import date
from pathlib import Path

from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    DateRange,
    Dimension,
    Metric,
    RunReportRequest,
)
from google.oauth2 import service_account

PROPERTY = "properties/552516626"
KEY = Path.home() / ".config" / "claude-seo" / "service_account.json"
ADS_JSON = Path(__file__).resolve().parent.parent / "data" / "ads.json"
INLINE_PAGES = {"/database/monsters", "/database/equipment", "/tools/leveling-spots"}
DETAIL_PATH = re.compile(r"^/database/(monsters|items|cards|costumes|equipment)/[^/]+$")

args = [a for a in sys.argv[1:] if not a.startswith("--")]
DAYS = int(args[0]) if args else 28
DRY = "--dry-run" in sys.argv


def client():
    creds = service_account.Credentials.from_service_account_file(
        str(KEY), scopes=["https://www.googleapis.com/auth/analytics.readonly"]
    )
    return BetaAnalyticsDataClient(credentials=creds)


def report(c, dims, mets, limit=100000):
    resp = c.run_report(
        RunReportRequest(
            property=PROPERTY,
            date_ranges=[DateRange(start_date=f"{DAYS}daysAgo", end_date="today")],
            dimensions=[Dimension(name=d) for d in dims],
            metrics=[Metric(name=m) for m in mets],
            limit=limit,
        )
    )
    return [([d.value for d in r.dimension_values], [float(m.value) for m in r.metric_values]) for r in resp.rows]


def main():
    c = client()
    totals = report(c, [], ["activeUsers", "sessions", "screenPageViews", "averageSessionDuration",
                            "screenPageViewsPerSession"])[0][1]
    users, sessions, views, seconds, per_session = totals

    by_device = {d[0]: m[0] for d, m in report(c, ["deviceCategory"], ["sessions"])}
    desktop_share = round(100 * by_device.get("desktop", 0) / max(1, sum(by_device.values())))

    by_country = {d[0]: m[0] for d, m in report(c, ["country"], ["sessions"])}
    thai_share = round(100 * by_country.get("Thailand", 0) / max(1, sum(by_country.values())))

    pages = report(c, ["pagePath"], ["screenPageViews"])
    inline_views = sum(m[0] for d, m in pages if d[0].split("?")[0] in INLINE_PAGES)
    detail_views = sum(m[0] for d, m in pages if DETAIL_PATH.match(d[0].split("?")[0]))

    stats = {
        "asOf": date.today().isoformat(),
        "periodDays": DAYS,
        "users": int(users),
        "sessions": int(sessions),
        "pageViews": int(views),
        "pagesPerSession": round(per_session, 1),
        "avgMinutes": round(seconds / 60),
        "desktopShare": desktop_share,
        "thaiShare": thai_share,
        "topSlotViews": int(views),
        "inlineSlotViews": int(inline_views),
        "detailSlotViews": int(detail_views),
    }

    data = json.loads(ADS_JSON.read_text(encoding="utf8"))
    before = data["stats"]
    for key, value in stats.items():
        mark = "" if before.get(key) == value else f"  (was {before.get(key)})"
        print(f"{key:18} {value}{mark}")
    if DRY:
        print("\n--dry-run: data/ads.json not written")
        return
    data["stats"] = stats
    ADS_JSON.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    print(f"\nwrote {ADS_JSON}. Deploy for the page to show it.")


if __name__ == "__main__":
    main()
