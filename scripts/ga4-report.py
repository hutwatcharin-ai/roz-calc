"""Read rozerothai.com's GA4 numbers straight from the Data API.

Usage:  python scripts/ga4-report.py [days]        (default 7)

Needs the service-account key at ~/.config/claude-seo/service_account.json
(the kidkrob one; it was added as Viewer on this property on 4 Sep 2026).
Prints: totals, sessions by content group, top pages, tool_use by tool,
searches by term. Anything the property has not seen yet prints as empty --
that is the property being young, not the script failing.
"""
import os
import sys
from pathlib import Path

from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    DateRange,
    Dimension,
    Filter,
    FilterExpression,
    Metric,
    OrderBy,
    RunReportRequest,
)
from google.oauth2 import service_account

PROPERTY = "properties/552516626"
KEY = Path.home() / ".config" / "claude-seo" / "service_account.json"
DAYS = int(sys.argv[1]) if len(sys.argv) > 1 else 7


def client() -> BetaAnalyticsDataClient:
    creds = service_account.Credentials.from_service_account_file(
        str(KEY), scopes=["https://www.googleapis.com/auth/analytics.readonly"]
    )
    return BetaAnalyticsDataClient(credentials=creds)


def run(c, dims, mets, event=None, order=None, limit=15):
    req = RunReportRequest(
        property=PROPERTY,
        date_ranges=[DateRange(start_date=f"{DAYS}daysAgo", end_date="today")],
        dimensions=[Dimension(name=d) for d in dims],
        metrics=[Metric(name=m) for m in mets],
        limit=limit,
    )
    if event:
        req.dimension_filter = FilterExpression(
            filter=Filter(field_name="eventName", string_filter=Filter.StringFilter(value=event))
        )
    if order:
        req.order_bys = [OrderBy(metric=OrderBy.MetricOrderBy(metric_name=order), desc=True)]
    resp = c.run_report(req)
    return [([d.value for d in r.dimension_values], [m.value for m in r.metric_values]) for r in resp.rows]


def section(title, rows):
    print(f"\n== {title} ==")
    if not rows:
        print("  (no rows)")
    for dims, mets in rows:
        print("  " + " | ".join(dims) + "  ->  " + " / ".join(mets))


def main():
    c = client()
    print(f"rozerothai.com, last {DAYS} days")
    section("totals", run(c, [], ["activeUsers", "sessions", "screenPageViews", "eventCount"]))
    section("sessions by content group", run(c, ["contentGroup"], ["sessions", "screenPageViews"], order="sessions"))
    section("top pages", run(c, ["pagePath"], ["screenPageViews", "activeUsers"], order="screenPageViews", limit=20))
    section("tool_use by tool", run(c, ["customEvent:tool"], ["eventCount", "activeUsers"], event="tool_use", order="eventCount"))
    section("search terms", run(c, ["customEvent:search_term", "customEvent:source"], ["eventCount"], event="search", order="eventCount", limit=30))
    section("events", run(c, ["eventName"], ["eventCount"], order="eventCount"))


if __name__ == "__main__":
    os.environ.setdefault("PYTHONIOENCODING", "utf-8")
    main()
