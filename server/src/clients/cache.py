import json
from dataclasses import dataclass
from threading import Lock

from models.subscription import Subscription
import config
from clients import events

# cache to store who is subscribed to which camera
_sub_lock = Lock()
_sub_cache = {}

# cache to store metrics like bitrate and ping
_metric_lock = Lock()
_metric_cache = {}

def update_metrics_event(event: dict):
    """Updates the metrics for the specified camera"""
    global _metric_cache, _metric_lock
    with _metric_lock:
        _metric_cache = event


def get_metrics_event():
    """Retrieves all metrics for all cameras"""
    global _metric_cache, _metric_lock
    with _metric_lock:
        return _metric_cache


def get_subscribed_cameras():
    """Returns the list of cameras that have subscribers"""
    with _sub_lock:
        return list(_sub_cache.keys())


def update_subscribed_cameras(cameras: list):
    """
    Updates the list of cameras that have subscribers. Will
    add cameras that are not in the cache and increment the
    subscriber count for cameras that are already in the cache.
    Sends a subscription event to the event stream.
    """
    with _sub_lock:
        for camera in cameras:
            if camera not in _sub_cache:
                _sub_cache[camera] = { 'subscribers': 1 }
            else:
                _sub_cache[camera]['subscribers'] += 1

            events.push_subscription(Subscription(
                type='subscribe',
                camera=camera,
                subscribers=_sub_cache[camera]['subscribers']
            ))


def unsubscribe_cameras(cameras: list):
    """
    Decrements the subscriber count for the specified cameras
    and removes the camera from the cache if the subscriber
    count is zero. Sends an unsubscribe event to the event
    """
    with _sub_lock:
        for camera in cameras:
            if camera in _sub_cache:
                _sub_cache[camera]['subscribers'] -= 1
                if _sub_cache[camera]['subscribers'] <= 0:
                    del _sub_cache[camera]

                # set subscribers to 0 if we were the last subscriber.
                subscribers = 0 if camera not in _sub_cache else _sub_cache[camera]['subscribers']

                events.push_subscription(Subscription(
                    type='unsubscribe',
                    camera=camera,
                    subscribers=subscribers
                ))