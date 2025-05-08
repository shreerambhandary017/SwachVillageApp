import os
import jwt
import datetime
from flask import Blueprint, request, jsonify
import bcrypt
from .database import get_db_connection

auth_bp = Blueprint('auth', __name__)

# Generate JWT token
def generate_token(user_id, email, role):
    payload = {
        'user_id': user_id,
        'email': email,
        'role': role,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)
    }
    token = jwt.encode(
        payload,
        os.getenv('JWT_SECRET_KEY', 'jwt_dev_key'),
        algorithm='HS256'
    )
    return token

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data:
        return jsonify({'message': 'No data provided'}), 400
    
    # Get login credentials
    identifier = data.get('identifier')
    password = data.get('password')
    role = data.get('role')
    
    if not identifier or not password or not role:
        return jsonify({'message': 'Missing required fields'}), 400
    
    # Check if using email or phone for login
    is_email = '@' in identifier
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Query for user with the provided identifier
        if is_email:
            cursor.execute(
                "SELECT * FROM users WHERE email = %s", 
                (identifier,)
            )
        else:
            cursor.execute(
                "SELECT * FROM users WHERE phone = %s", 
                (identifier,)
            )
        
        user = cursor.fetchone()
        
        # Close database connection
        cursor.close()
        conn.close()
        
        if not user:
            return jsonify({'message': 'Invalid credentials'}), 401
        
        # Check if the role matches
        if user['role'] != role:
            return jsonify({'message': f'User is not registered as a {role}'}), 403
        
        # Verify password
        if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            return jsonify({'message': 'Invalid credentials'}), 401
        
        # Generate JWT token
        token = generate_token(user['id'], user['email'], user['role'])
        
        # Return user data and token
        return jsonify({
            'token': token,
            'user': {
                'id': user['id'],
                'name': user['full_name'],
                'email': user['email'],
                'role': user['role'],
                'is_verified': user['is_verified']
            }
        }), 200
    
    except Exception as e:
        return jsonify({'message': f'Error: {str(e)}'}), 500

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if not data:
        return jsonify({'message': 'No data provided'}), 400
    
    # Get registration data
    full_name = data.get('full_name')
    email = data.get('email')
    phone = data.get('phone')
    password = data.get('password')
    role = data.get('role')
    
    if not full_name or not email or not phone or not password or not role:
        return jsonify({'message': 'Missing required fields'}), 400
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if email already exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'message': 'Email already registered'}), 400
        
        # Check if phone already exists
        cursor.execute("SELECT id FROM users WHERE phone = %s", (phone,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'message': 'Phone number already registered'}), 400
        
        # Hash the password
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Insert new user
        cursor.execute(
            "INSERT INTO users (full_name, email, phone, password_hash, role) VALUES (%s, %s, %s, %s, %s)",
            (full_name, email, phone, password_hash, role)
        )
        
        user_id = cursor.lastrowid
        conn.commit()
        
        # If role is business, create business certification entry
        if role == 'business':
            cursor.execute(
                "INSERT INTO business_certification (user_id, business_name, owner_name) VALUES (%s, %s, %s)",
                (user_id, data.get('business_name', full_name + "'s Business"), full_name)
            )
            conn.commit()
        
        cursor.close()
        conn.close()
        
        # Generate token for the new user
        token = generate_token(user_id, email, role)
        
        return jsonify({
            'token': token,
            'user': {
                'id': user_id,
                'name': full_name,
                'email': email,
                'role': role,
                'is_verified': False
            },
            'message': 'Registration successful'
        }), 201
        
    except Exception as e:
        return jsonify({'message': f'Error: {str(e)}'}), 500

@auth_bp.route('/verify-token', methods=['GET'])
def verify_token():
    auth_header = request.headers.get('Authorization')
    
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'valid': False, 'message': 'No token provided'}), 401
    
    token = auth_header.split(' ')[1]
    
    try:
        payload = jwt.decode(
            token, 
            os.getenv('JWT_SECRET_KEY', 'jwt_dev_key'),
            algorithms=['HS256']
        )
        
        return jsonify({
            'valid': True, 
            'user': {
                'id': payload['user_id'],
                'email': payload['email'],
                'role': payload['role']
            }
        }), 200
        
    except jwt.ExpiredSignatureError:
        return jsonify({'valid': False, 'message': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'valid': False, 'message': 'Invalid token'}), 401 