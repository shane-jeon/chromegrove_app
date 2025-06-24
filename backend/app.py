from flask import Flask, jsonify
from flask_cors import CORS
from models import db

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db.sqlite3'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
CORS(app)

@app.route('/api/ping')
def ping():
    return jsonify({"message": "pong"})

if __name__ == '__main__':
    app.run(debug=True)
