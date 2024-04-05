from dataclasses import asdict
from uuid import uuid4
from datetime import datetime, timezone
import threading
from multiprocessing import Queue

from models.subscription import Subscription

_event_queue = Queue()
_event_lock = threading.Lock()

def push_subscription(event: Subscription):
    global _event_queue

    with _event_lock:
        timestamp = datetime.utcnow().replace(tzinfo=timezone.utc).isoformat()
        cloudevent = {
            "context": {
                "version": "1.0.0",
                "id": str(uuid4()),
                "timestamp": timestamp,
                "type": "aquavid.subscription.event",
                "source": "/aquavid/subscription",
                "action": "update",
                "dataschema": "http://schema.foreveroceans.io/v1/aquavid/subscription-1.0.0.json",
                "datacontenttype": "json",
            },
            "data": asdict(event)
        }
        _event_queue.put_nowait(cloudevent)


def listen() -> 'dict | None':
    """
    Listen to the event queue, timeout after 5 seconds and
    return None if no event is received.
    """
    global _event_queue

    try:
        return _event_queue.get(block=True, timeout=5)
    except:
        # normal in timeout when queue is empty
        return None