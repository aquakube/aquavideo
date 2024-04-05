import os
import json
from distutils.util import strtobool

from kubernetes import config as k8s_config

PROMETHEUS_URL = 'http://prometheus.monitoring.svc.cluster.local:9090'
KAFKA_BROKERS = 'localhost:9092'
KAFKA_MAX_BLOCK_MS = 1000
KAKFA_RETRIES = 3
HTTP_PORT = 80
CAMERA_MAP = {}
GROUP_MAP = {}
METRICS_POLL_INTERVAL = 5
KAFKA_EVENTS_TOPIC = 'aquavid.events'
LOCAL = False

def required_env(key):
    value = os.getenv(key)
    
    if value is None:
        raise Exception(f'{key} is not set in environment variables')
    
    return value


def initialize():
    global KAFKA_BROKERS, HTTP_PORT, CAMERA_MAP, METRICS_POLL_INTERVAL
    global KAFKA_EVENTS_TOPIC, LOCAL, GROUP_MAP, PROMETHEUS_URL

    PROMETHEUS_URL = os.environ.get('PROMETHEUS_URL', PROMETHEUS_URL)
    KAFKA_BROKERS = os.environ.get('KAFKA_BROKERS', KAFKA_BROKERS)
    HTTP_PORT = os.environ.get('HTTP_PORT', HTTP_PORT)
    CAMERA_MAP = json.loads(os.environ.get('CAMERA_MAP', '{}'))
    GROUP_MAP = json.loads(os.environ.get('GROUP_MAP', '{}'))
    METRICS_POLL_INTERVAL = int(os.environ.get('METRICS_POLL_INTERVAL', METRICS_POLL_INTERVAL))
    KAFKA_EVENTS_TOPIC = os.environ.get('KAFKA_EVENTS_TOPIC', KAFKA_EVENTS_TOPIC)
    LOCAL = strtobool(os.environ.get('LOCAL', 'False'))

    if LOCAL:
        with open('../bin/camera_map.json', 'r') as f:
            CAMERA_MAP = json.load(f)

    k8s_config.load_config()