from flask import Blueprint, jsonify

import config

mod = Blueprint('cameras', __name__)

@mod.route('/api/cameras', methods=['GET'])
def cameras():
    return jsonify(config.CAMERA_MAP)