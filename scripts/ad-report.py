"""The monthly report an advertiser gets, from GA4.

Impressions come from the browser (banner_impression, fired when the slot is
actually on screen) and clicks from our own redirect (/go/ad, banner_click
through the Measurement Protocol). Ad blockers hide the first and not the
second, so the report says which number is which -- an advertiser deciding
whether to renew deserves that, and inflating it would cost the renewal.

The per-ad breakdown needs ad_id, ad_slot and advertiser registered as custom
dimensions in GA4 (Admin > Custom definitions). Without them Google keeps the
event parameters but will not report on them, and this prints the totals with
a note instead of pretending it split them.

Usage:
  python scripts/ad-report.py                 # last 30 days, every ad
  python scripts/ad-report.py 2026-10-01 2026-10-30
  python scripts/ad-report.py 2026-10-01 2026-10-30 --ad top-shopname
"""
import sys
from pathlib import Path

from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    DateRange,
    Dimension,
    Filter,
    FilterExpression,
    Metric,
    RunReportRequest,
)
from google.api_core.exceptions import InvalidArgument
from google.oauth2 import service_account

PROPERTY = "properties/552516626"
KEY = Path.home() / ".config" / "claude-seo" / "service_account.json"
OUT = Path.home() / "Downloads"

dates = [a for a in sys.argv[1:] if not a.startswith("--") and "-" in a]
START, END = (dates + ["30daysAgo", "today"])[:2] if len(dates) < 2 else dates[:2]
AD = None
if "--ad" in sys.argv:
    AD = sys.argv[sys.argv.index("--ad") + 1]


def client():
    creds = service_account.Credentials.from_service_account_file(
        str(KEY), scopes=["https://www.googleapis.com/auth/analytics.readonly"]
    )
    return BetaAnalyticsDataClient(credentials=creds)


def rows(c, dims, event):
    req = RunReportRequest(
        property=PROPERTY,
        date_ranges=[DateRange(start_date=START, end_date=END)],
        dimensions=[Dimension(name=d) for d in dims],
        metrics=[Metric(name="eventCount")],
        dimension_filter=FilterExpression(
            filter=Filter(field_name="eventName", string_filter=Filter.StringFilter(value=event))
        ),
        limit=100,
    )
    resp = c.run_report(req)
    return [([d.value for d in r.dimension_values], int(r.metric_values[0].value)) for r in resp.rows]


def counts(c, event):
    """Per ad when the custom dimensions exist, one total when they do not."""
    try:
        return rows(c, ["customEvent:ad_id", "customEvent:ad_slot"], event), True
    except InvalidArgument:
        return rows(c, [], event), False


def main():
    c = client()
    impressions, split = counts(c, "banner_impression")
    clicks, _ = counts(c, "banner_click")
    click_of = {tuple(d): n for d, n in clicks}

    lines = [
        f"# รายงานแบนเนอร์ rozerothai.com",
        "",
        f"ช่วงวันที่ {START} ถึง {END}",
        "",
    ]
    if not split:
        lines += [
            "> ยังไม่ได้ตั้งค่ามิติที่กำหนดเองใน GA4 (ad_id, ad_slot, advertiser)",
            "> ตัวเลขด้านล่างจึงเป็นยอดรวมทุกแบนเนอร์ ไม่ได้แยกรายลูกค้า",
            "",
        ]
    lines += ["| แบนเนอร์ | ตำแหน่ง | ยอดเห็น | ยอดคลิก | อัตราคลิก |", "|---|---|---|---|---|"]
    total_impressions = total_clicks = 0
    for dims, n in impressions or [([], 0)]:
        if AD and dims and dims[0] != AD:
            continue
        clicks_here = click_of.get(tuple(dims), 0)
        total_impressions += n
        total_clicks += clicks_here
        rate = f"{100 * clicks_here / n:.2f}%" if n else "—"
        name = dims[0] if dims else "ทุกแบนเนอร์"
        slot = dims[1] if len(dims) > 1 else "—"
        lines.append(f"| {name} | {slot} | {n:,} | {clicks_here:,} | {rate} |")

    lines += [
        "",
        "**หมายเหตุ**",
        "",
        "- ยอดเห็นนับเมื่อแบนเนอร์เลื่อนเข้ามาอยู่ในจอจริงเท่านั้น ไม่ได้นับตอนเปิดหน้า",
        "- ยอดเห็นมาจาก Google Analytics ซึ่งนับได้ต่ำกว่าความจริงราว 10-20% เพราะผู้อ่านบางส่วนใช้ตัวบล็อกโฆษณา",
        "- ยอดคลิกนับที่เว็บเราเอง ตัวบล็อกโฆษณาบล็อกไม่ได้ จึงเป็นตัวเลขเต็ม",
        f"- รวมทั้งหมด: เห็น {total_impressions:,} ครั้ง คลิก {total_clicks:,} ครั้ง",
    ]

    name = f"ad-report-{START}-to-{END}".replace("daysAgo", "d") + ".md"
    path = OUT / name
    path.write_text("\n".join(lines) + "\n", encoding="utf8")
    print("\n".join(lines))
    print(f"\nwrote {path}")


if __name__ == "__main__":
    main()
