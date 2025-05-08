import os
import jwt
from functools import wraps
from flask import request, jsonify

def token_required(roles=None):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            auth_header = request.headers.get('Authorization')
            
            if not auth_header or not auth_header.startswith('Bearer '):
                return jsonify({'message': 'Authorization token is missing'}), 401
            
            token = auth_header.split(' ')[1]
            
            try:
                payload = jwt.decode(
                    token, 
                    os.getenv('JWT_SECRET_KEY', 'jwt_dev_key'),
                    algorithms=['HS256']
                )
                
                # Add user info to kwargs
                kwargs['user_id'] = payload['user_id']
                kwargs['role'] = payload['role']
                
                # Check if user role is in allowed roles
                if roles and kwargs['role'] not in roles:
                    return jsonify({
                        'message': f'Access denied. This endpoint requires one of these roles: {", ".join(roles)}'
                    }), 403
                    
                return f(*args, **kwargs)
            
            except jwt.ExpiredSignatureError:
                return jsonify({'message': 'Token expired'}), 401
            except jwt.InvalidTokenError:
                return jsonify({'message': 'Invalid token'}), 401
        
        return decorated_function
    return decorator 