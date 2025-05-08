import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def create_app():
    app = Flask(__name__)
    CORS(app)
    
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
    
    @app.route('/api/health')
    def health_check():
        return {'status': 'OK', 'message': 'Swach Village API is running'}
    
    return app 