import logging
import json
import time

from flask import Blueprint, request, Response

import config
from clients import cache

mod = Blueprint('camera_events', __name__)


def validate_cameras(cameras: str):
    cameras = cameras.split(',') if cameras else None
    cameras = [camera.strip() for camera in cameras] if cameras else None

    if cameras is None:
        # your allowed to subscribe to no cameras
        return []

    for camera in cameras:
        if camera not in config.CAMERA_MAP:
            raise ValueError(f'camera {camera} is not a known camera')
        
    return cameras


@mod.route('/api/camera_events', methods=['GET'])
def camera_events():
    cameras = request.args.get('cameras')

    # validate camera names that were passed in
    try:
        cameras = validate_cameras(cameras)
    except Exception as e:
        logging.exception('error validating cameras')
        return Response(f'error validating cameras: {str(e)}', status=400)

    cache.update_subscribed_cameras(cameras)

    def _events():
        try:
            while True:
                yield f'data: {json.dumps(cache.get_metrics_event())}\n\n'
                time.sleep(2.5)
        except:
            pass
        finally:
            cache.unsubscribe_cameras(cameras)

    return Response(_events(), mimetype='text/event-stream')