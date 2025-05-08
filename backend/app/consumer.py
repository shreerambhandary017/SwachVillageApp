from flask import Blueprint, request, jsonify, g
from marshmallow import Schema, fields, ValidationError
from .database import get_db_connection as get_db
from .auth_middleware import token_required

# Create a Blueprint for consumer routes
consumer_bp = Blueprint('consumer', __name__)

# ---------------------- Consumer API Routes ---------------------- #

@consumer_bp.route('/feedback', methods=['GET'])
@token_required(roles=['consumer'])
def get_user_feedback(user_id, role):
    """Get all feedback submitted by a specific consumer"""
    try:
        db = get_db()
        query_user_id = request.args.get('user_id')
        
        # If no user_id provided in the query, use the authenticated user's ID
        if not query_user_id:
            query_user_id = user_id
            
        # Use a simplified query that works with any schema
        try:
            # Try the new schema first
            query = """
            SELECT f.id, f.rating, 
                   COALESCE(f.comment, f.feedback_text) as comment, 
                   f.created_at, b.business_name
            FROM feedback f
            JOIN businesses b ON f.business_id = b.id
            WHERE f.user_id = %s
            ORDER BY f.created_at DESC
            """
            
            cursor = db.cursor(dictionary=True)
            cursor.execute(query, (query_user_id,))
            feedback_items = cursor.fetchall()
            
            if feedback_items:
                return jsonify({
                    'success': True,
                    'feedback': feedback_items
                }), 200
        except Exception as schema_error:
            print(f"First query attempt failed: {schema_error}")
            # If the first query fails, try the fallback query
            pass
        
        try:
            # Fallback query for old schema
            fallback_query = """
            SELECT f.id, f.rating, 
                   COALESCE(f.comment, f.feedback_text) as comment, 
                   f.created_at, 
                   COALESCE(b.business_name, u.username) as business_name
            FROM feedback f
            LEFT JOIN businesses b ON f.business_id = b.id
            LEFT JOIN users u ON f.consumer_id = u.id
            WHERE f.consumer_id = %s OR f.user_id = %s
            ORDER BY f.created_at DESC
            """
            
            cursor = db.cursor(dictionary=True)
            cursor.execute(fallback_query, (query_user_id, query_user_id))
            feedback_items = cursor.fetchall()
        except Exception as fallback_error:
            print(f"Fallback query failed: {fallback_error}")
            # If both queries fail, return empty results
            feedback_items = []
            
        cursor.close()
        
        return jsonify({
            'success': True,
            'feedback': feedback_items
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to fetch feedback: {str(e)}'
        }), 500

@consumer_bp.route('/feedback', methods=['POST'])
@token_required(roles=['consumer'])
def submit_feedback(user_id, role):
    """Submit feedback for a business"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not all(key in data for key in ['business_id', 'rating']):
            return jsonify({
                'success': False,
                'message': 'Missing required fields: business_id and rating are required'
            }), 400
            
        # User ID is already available from the token_required decorator
        
        # Extract data
        business_id = data.get('business_id')
        rating = data.get('rating')
        comment = data.get('comment', '')
        
        # Validate rating is between 1 and 5
        if not isinstance(rating, (int, float)) or rating < 1 or rating > 5:
            return jsonify({
                'success': False,
                'message': 'Rating must be between 1 and 5'
            }), 400
            
        db = get_db()
        cursor = db.cursor()
        
        # Check if business exists
        cursor.execute("SELECT id FROM businesses WHERE id = %s", (business_id,))
        if not cursor.fetchone():
            cursor.close()
            return jsonify({
                'success': False,
                'message': 'Business not found'
            }), 404
            
        # Insert feedback
        query = """
        INSERT INTO feedback (user_id, business_id, rating, comment)
        VALUES (%s, %s, %s, %s)
        """
        
        cursor.execute(query, (user_id, business_id, rating, comment))
        db.commit()
        
        # Get the inserted feedback ID
        feedback_id = cursor.lastrowid
        cursor.close()
        
        return jsonify({
            'success': True,
            'message': 'Feedback submitted successfully',
            'feedback_id': feedback_id
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to submit feedback: {str(e)}'
        }), 500

# Add a route to fetch all businesses
@consumer_bp.route('/profile', methods=['GET'])
@token_required(roles=['consumer'])
def get_user_profile(user_id, role):
    """Get the profile information for the current user"""
    try:
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'User ID is required'
            }), 400

        # Validate user_id is an integer
        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            return jsonify({
                'success': False,
                'message': 'Invalid user ID format'
            }), 400
            
        # Get database connection
        try:
            db = get_db()
        except Exception as db_err:
            print(f"Database connection error: {str(db_err)}")
            return jsonify({
                'success': False,
                'message': 'Database connection error'
            }), 500
        
        # Get basic user information with NULL handling for all fields
        query = """
        SELECT 
            id, 
            COALESCE(username, '') as username, 
            COALESCE(email, '') as email, 
            COALESCE(first_name, '') as first_name, 
            COALESCE(last_name, '') as last_name, 
            COALESCE(phone, '') as phone,
            COALESCE(role, 'consumer') as role, 
            COALESCE(created_at, CURRENT_TIMESTAMP) as created_at,
            COALESCE(is_verified, 0) as is_verified
        FROM users
        WHERE id = %s
        """
        
        try:
            cursor = db.cursor(dictionary=True)
            cursor.execute(query, (user_id,))
            user = cursor.fetchone()
            cursor.close()
        except Exception as query_err:
            print(f"Query error: {str(query_err)}")
            return jsonify({
                'success': False,
                'message': 'Failed to query user data',
                'error': str(query_err)
            }), 500
        
        if not user:
            print(f"User with ID {user_id} not found")
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        # Ensure all fields exist with defaults if missing
        default_fields = {
            'id': user_id,
            'username': 'user',
            'email': '',
            'first_name': '',
            'last_name': '',
            'phone': '',
            'role': role or 'consumer',
            'created_at': '',
            'is_verified': 0
        }
        
        # Merge default fields with actual user data
        for key, default_value in default_fields.items():
            if key not in user or user[key] is None:
                user[key] = default_value
                
        # Remove sensitive information
        if 'password' in user:
            del user['password']
            
        # Add a name field for convenience
        if user['first_name'] or user['last_name']:
            user['name'] = f"{user['first_name']} {user['last_name']}".strip()
        else:
            user['name'] = user['username']

        # Ensure proper type conversion for boolean and numeric fields
        user['is_verified'] = bool(user['is_verified'])
        user['id'] = int(user['id'])
            
        return jsonify({
            'success': True,
            'user': user
        }), 200
        
    except Exception as e:
        print(f"Profile error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch user profile',
            'error': str(e)
        }), 500

@consumer_bp.route('/verify-product', methods=['POST'])
@token_required(roles=['consumer'])
def verify_product(user_id, role):
    """Verify a product by its barcode or product code"""
    try:
        data = request.get_json()
        
        if not data or not ('product_code' in data or 'barcode' in data):
            return jsonify({
                'success': False,
                'message': 'Product code or barcode is required'
            }), 400
            
        product_code = data.get('product_code') or data.get('barcode')
        db = get_db()
        cursor = db.cursor(dictionary=True)
        
        # Find the product
        query = """
        SELECT p.id, p.product_name, p.product_code, p.category, p.description, 
               p.certification_status, p.certification_date, b.business_name, b.id as business_id
        FROM products p
        JOIN businesses b ON p.business_id = b.id
        WHERE p.product_code = %s
        """
        
        cursor.execute(query, (product_code,))
        product = cursor.fetchone()
        
        if not product:
            return jsonify({
                'success': False,
                'message': 'Product not found or not certified'
            }), 404
            
        # Record the verification
        log_query = """
        INSERT INTO product_verifications (product_id, user_id, verification_method)
        VALUES (%s, %s, %s)
        """
        
        method = 'barcode_scan' if 'barcode' in data else 'manual_code'
        cursor.execute(log_query, (product['id'], user_id, method))
        db.commit()
        
        cursor.close()
        
        return jsonify({
            'success': True,
            'product': product
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to verify product: {str(e)}'
        }), 500

@consumer_bp.route('/businesses', methods=['GET'])
def get_businesses():
    """Get all businesses (paginated)"""
    try:
        db = get_db()
        
        # Pagination parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        offset = (page - 1) * limit
        
        try:
            # Get total count
            count_cursor = db.cursor(dictionary=True)
            count_cursor.execute("SELECT COUNT(*) as count FROM businesses")
            result = count_cursor.fetchone()
            total_count = result['count'] if result else 0
            count_cursor.close()
            
            # Get businesses with average rating
            query = """
            SELECT b.id, b.business_name, 
                   COALESCE(b.description, '') as description, 
                   COALESCE(b.certification_status, 'pending') as certification_status,
                   COALESCE(AVG(f.rating), 0) as rating
            FROM businesses b
            LEFT JOIN feedback f ON b.id = f.business_id
            GROUP BY b.id
            ORDER BY b.business_name
            LIMIT %s OFFSET %s
            """
            
            cursor = db.cursor(dictionary=True)
            cursor.execute(query, (limit, offset))
            businesses = cursor.fetchall()
            cursor.close()
            
            # Ensure all businesses have the required fields
            for business in businesses:
                business['id'] = business.get('id', 0)
                business['business_name'] = business.get('business_name', '')
                business['description'] = business.get('description', '')
                business['certification_status'] = business.get('certification_status', 'pending')
                business['rating'] = float(business.get('rating', 0))
            
            return jsonify({
                'success': True,
                'businesses': businesses,
                'total': total_count,
                'page': page,
                'total_pages': max(1, (total_count + limit - 1) // limit)
            }), 200
            
        except Exception as db_error:
            print(f"Database error: {db_error}")
            # Fallback: return empty results instead of error
            return jsonify({
                'success': True,
                'businesses': [],
                'total': 0,
                'page': 1,
                'total_pages': 1,
                'error_details': str(db_error)
            }), 200
        
    except Exception as e:
        print(f"Critical error in get_businesses: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch businesses',
            'error_details': str(e)
        }), 500
