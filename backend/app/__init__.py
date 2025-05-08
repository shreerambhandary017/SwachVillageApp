import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # Enable CORS for all routes
    CORS(app)
    
    # Add explicit CORS handling for preflight requests
    @app.before_request
    def handle_preflight():
        if request.method == 'OPTIONS':
            response = jsonify({'status': 'ok'})
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', '*')
            response.headers.add('Access-Control-Allow-Methods', '*')
            response.headers.add('Access-Control-Max-Age', '3600')
            return response, 200
    
    # Configure the app
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev_key')
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt_dev_key')
    
    # Register blueprints
    from .auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    
    from .business import business_bp
    app.register_blueprint(business_bp, url_prefix='/api/business')
    
    from .business_dashboard import business_dashboard_bp
    app.register_blueprint(business_dashboard_bp, url_prefix='/api/business')
    
    from .products import products_bp
    app.register_blueprint(products_bp, url_prefix='/api/products')
    
    from .feedback import feedback_bp
    app.register_blueprint(feedback_bp, url_prefix='/api/feedback')
    
    from .consumer import consumer_bp
    app.register_blueprint(consumer_bp, url_prefix='/api/consumer')
    
    @app.route('/api/health')
    def health_check():
        return {'status': 'OK', 'message': 'Swach Village API is running'}
    
    return app 