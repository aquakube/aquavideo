from flask import Blueprint, Response

mod = Blueprint('healthz', __name__)

@mod.route('/healthz', methods=['GET'])
def healthz():
    return Response(status=200)