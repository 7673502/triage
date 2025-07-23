from datetime import datetime, timezone

def parse_time(t: str) -> datetime:
    dt = datetime.fromisoformat(t.replace('Z', '+00:00'))
    return dt.replace(tzinfo=timezone.utc)

def format_time(t: datetime) -> str:
    return t.astimezone(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')
