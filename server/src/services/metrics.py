import threading
import logging
import time
import requests
from distutils.util import strtobool
from datetime import datetime, timezone
from dateutil.parser import parse
from uuid import uuid4

import config
from clients import cache
from clients import kube


def query_pings():
    query = 'last_over_time(ping_monitor{groups=~".*(otaq|axis).*"}[5m])'

    url = f'{config.PROMETHEUS_URL}/api/v1/query'

    response = requests.get(url, params={'query': query}, timeout=5)
    response =  response.json()
    results = response['data']['result']
    camera_pings = {}

    for result in results:
        camera_pings[result['metric']['hostname']] = int(result['value'][1])

    return camera_pings


def query_bitrates():
    query = 'last_over_time(bitrate_Mbps[5m])'

    url = f'{config.PROMETHEUS_URL}/api/v1/query'

    response = requests.get(url, params={'query': query}, timeout=5)
    response =  response.json()
    results = response['data']['result']
    camera_bitrates = {}

    for result in results:
        camera_bitrates[result['metric']['service_name']] = float(result['value'][1])

    return camera_bitrates


class MetricsPoller(threading.Thread):


    def __init__(self):
        super().__init__(daemon=True, name='metrics_poller')
        self.stop_event = threading.Event()


    def stop(self):
        self.stop_event.set()


    def run(self):
        start_time = time.time()

        while not self.stop_event.is_set():
            try:    
                metrics = {}

                # query prometheus for metrics
                pings = query_pings()
                bitrates = query_bitrates()

                videos = kube.list_managed_videos()
                utcnow = datetime.utcnow()
                utcnow = utcnow.replace(tzinfo=timezone.utc)
                
                # gather the status of the video CRs
                status = {} 
                for video in videos['items']:
                    birth = parse(video['metadata']['creationTimestamp'], tzinfos={'UTC': 0})
                    age = utcnow - birth
                    age = int(age.total_seconds())
                    available = strtobool(video['status'].get('available', 'False'))
                    video_name = video['metadata']['name']
                    status[video_name] = {
                        'age': age,
                        'available': available,
                    }
                
                # generate a list of all camera names
                camera_names = set(pings.keys()) | set(bitrates.keys()) | set(status.keys())

                # generate metrics for each camera, default to None if not found
                for camera_name in camera_names:
                    if camera_name not in metrics:
                        metrics[camera_name] = {
                            'age': None,
                            'available': None,
                            'bitrate': None,
                            'ping': None,
                        }

                    metrics[camera_name]['ping'] = pings.get(camera_name, None)
                    metrics[camera_name]['bitrate'] = bitrates.get(camera_name, None)
                    metrics[camera_name]['age'] = status.get(camera_name, {}).get('age', None)
                    metrics[camera_name]['available'] = status.get(camera_name, {}).get('available', None)

                event = {
                    'context': {
                        "version": "1.0.0",
                        "id": str(uuid4()),
                        "timestamp": datetime.utcnow().replace(tzinfo=timezone.utc).isoformat(),
                        "type": "aquavid.metrics.event",
                        "source": "/aquavid/metrics",
                        "action": "update",
                        "dataschema": "http://schema.foreveroceans.io/v1/aquavid/metrics-1.0.0.json",
                        "datacontenttype": "json",
                    },
                    'data': metrics
                }

                cache.update_metrics_event(event)
            except:
                logging.exception('error polling metrics')


            elasped = time.time() - start_time
            sleep_time = max(0, config.METRICS_POLL_INTERVAL - elasped)
            time.sleep(sleep_time)
            start_time = time.time()

