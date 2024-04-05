import threading
import json
import logging

from kafka import KafkaProducer

import clients.events as events
import config

class EventsConsumer(threading.Thread):


    def __init__(self):
        super().__init__(daemon=True, name='events_consumer')

        logging.info(f'initializing kafka producer at {config.KAFKA_BROKERS}')

        self.producer = KafkaProducer(
            bootstrap_servers=config.KAFKA_BROKERS,
            max_block_ms=config.KAFKA_MAX_BLOCK_MS,
            retries=config.KAKFA_RETRIES,
            acks='all',
        )
        self.stop_event = threading.Event()


    def stop(self):
        self.stop_event.set()


    def run(self):
        while not self.stop_event.is_set():
            try:
                event = events.listen()
                if event is not None:

                    logging.info(f'event received: {event}')

                    # publish event to kafka
                    cloudevent = bytes(json.dumps(event), 'utf-8')
                    future = self.producer.send(config.KAFKA_EVENTS_TOPIC, cloudevent)
                    future.get()
            except:
                logging.exception('failed to publish event to kafka')