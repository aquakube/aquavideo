from flask import Blueprint, jsonify

import config

mod = Blueprint('groups', __name__)

@mod.route('/api/groups', methods=['GET'])
def groups():
    return jsonify(config.GROUP_MAP)