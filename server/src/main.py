import logging

from flask import Flask
from flask_cors import CORS

logging.basicConfig(
    format='%(asctime)s %(levelname)s %(message)s',
)

app = Flask(__name__)
cors = CORS(app,
    resources={r"/*": {"origins": "*"}},
    supports_credentials=True
)

import config

config.initialize()

from routes import camera_events
from routes import subscriptions
from routes import cameras
from routes import groups
from routes import healthz

app.register_blueprint(camera_events.mod)
app.register_blueprint(subscriptions.mod)
app.register_blueprint(cameras.mod)
app.register_blueprint(groups.mod)
app.register_blueprint(healthz.mod)

@app.route('/')
def index():
    return app.send_static_file('index.html')

from services.events import EventsConsumer
from services.metrics import MetricsPoller

def main():
    events_consumer = EventsConsumer()
    events_consumer.start()

    metrics_poller = MetricsPoller()
    metrics_poller.start()

    app.run(
        host='0.0.0.0',
        port=config.HTTP_PORT,
        threaded=True,
        debug=False
    )


if __name__ == '__main__':
    main()