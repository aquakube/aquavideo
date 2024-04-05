from flask import Blueprint, jsonify

from clients import cache

mod = Blueprint('subscriptions', __name__)

@mod.route('/api/subscriptions', methods=['GET'])
def subscriptions():
    subscriptions = cache.get_subscribed_cameras()
    return jsonify(subscriptions)