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
        print(f"Fetching feedback for user ID: {user_id}, role: {role}")
        db = get_db()
        query_user_id = request.args.get('user_id')
        
        # If no user_id provided in the query, use the authenticated user's ID
        if not query_user_id:
            query_user_id = user_id
            
        print(f"Using user_id: {query_user_id} for feedback query")
        
        # Initialize empty feedback list
        feedback_items = []
        
        # First, check if the feedback table exists and what columns it has
        cursor = db.cursor(dictionary=True)
        
        try:
            # Get table structure
            cursor.execute("DESCRIBE feedback")
            columns = {row['Field']: row for row in cursor.fetchall()}
            print(f"Feedback table columns: {list(columns.keys())}")
            
            # Build a query based on the actual table structure
            has_consumer_id = 'consumer_id' in columns
            has_business_id = 'business_id' in columns
            has_user_id = 'user_id' in columns
            has_feedback_text = 'feedback_text' in columns
            has_comment = 'comment' in columns
            
            # Construct dynamic query based on available columns
            select_clause = ["f.id", "f.rating"]
            join_clause = []
            where_clause = []
            
            # Handle comment/feedback_text field
            if has_feedback_text and has_comment:
                select_clause.append("COALESCE(f.comment, f.feedback_text, '') as comment")
            elif has_feedback_text:
                select_clause.append("COALESCE(f.feedback_text, '') as comment")
            elif has_comment:
                select_clause.append("COALESCE(f.comment, '') as comment")
            else:
                select_clause.append("'' as comment")
            
            # Add created_at
            select_clause.append("f.created_at")
            
            # Handle business name via joins
            if has_business_id:
                select_clause.append("COALESCE(b.business_name, 'Unknown Business') as business_name")
                join_clause.append("LEFT JOIN businesses b ON f.business_id = b.id")
            else:
                select_clause.append("'Unknown Business' as business_name")
            
            # Build WHERE clause based on available ID columns
            if has_consumer_id:
                where_clause.append("f.consumer_id = %s")
            if has_user_id:
                where_clause.append("OR f.user_id = %s")
            
            # If no valid ID columns found, use a placeholder that will return no results
            if not where_clause:
                where_clause.append("1=0")
            
            # Build the final query
            query = f"""
            SELECT 
                {', '.join(select_clause)}
            FROM 
                feedback f
                {' '.join(join_clause)}
            WHERE 
                {' '.join(where_clause)}
            ORDER BY 
                f.created_at DESC
            """
            
            print(f"Dynamic query built: {query}")
            
            # Prepare parameters based on where clause
            params = []
            if has_consumer_id:
                params.append(query_user_id)
            if has_user_id:
                params.append(query_user_id)
                
            cursor.execute(query, tuple(params) if params else None)
            feedback_items = cursor.fetchall()
            print(f"Query executed, found {len(feedback_items)} feedback items")
            
            # Format dates to string for JSON serialization
            for item in feedback_items:
                if 'created_at' in item and item['created_at']:
                    item['created_at'] = item['created_at'].strftime('%Y-%m-%d %H:%M:%S')
        
        except Exception as query_error:
            print(f"Detailed feedback query error: {query_error}")
            # Return empty results rather than error
            feedback_items = []
        
        finally:
            if cursor:
                cursor.close()
        
        # Always return success, with either feedback items or empty list
        return jsonify({
            'success': True,
            'feedback': feedback_items,
            'has_feedback': len(feedback_items) > 0
        }), 200
        
    except Exception as e:
        print(f"Critical error in get_user_feedback: {e}")
        # Return a user-friendly error that still allows frontend to show the no-feedback message
        return jsonify({
            'success': True,  # Set as true to not trigger error UI
            'feedback': [],
            'has_feedback': False,
            'error_message': 'An error occurred while fetching your feedback.'
        }), 200  # Return 200 to ensure frontend shows no-feedback message

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
        print(f"Getting profile for user_id: {user_id}, role: {role}")
        
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'User ID is required'
            }), 400

        # Validate user_id is an integer
        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            print(f"Invalid user ID format: {user_id}")
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
        
        # Check users table structure
        cursor = db.cursor(dictionary=True)
        
        try:
            # Get table structure
            cursor.execute("DESCRIBE users")
            columns = {row['Field']: row for row in cursor.fetchall()}
            print(f"Users table columns: {list(columns.keys())}")
            
            # Construct a query based on available columns
            select_fields = ["id"]
            
            # Add other fields with COALESCE to handle NULL values
            available_fields = {
                'username': "COALESCE(username, '') as username",
                'email': "COALESCE(email, '') as email",
                'first_name': "COALESCE(first_name, '') as first_name",
                'last_name': "COALESCE(last_name, '') as last_name",
                'phone': "COALESCE(phone, '') as phone",
                'full_name': "COALESCE(full_name, '') as full_name",
                'role': "COALESCE(role, 'consumer') as role",
                'created_at': "COALESCE(created_at, CURRENT_TIMESTAMP) as created_at",
                'is_verified': "COALESCE(is_verified, 0) as is_verified"
            }
            
            # Add existing columns to select clause
            for col_name, col_expr in available_fields.items():
                if col_name in columns:
                    select_fields.append(col_expr)
            
            # Build the final query
            query = f"""
            SELECT
                {', '.join(select_fields)}
            FROM users
            WHERE id = %s
            """
            
            print(f"User profile query: {query}")
            cursor.execute(query, (user_id,))
            user = cursor.fetchone()
            
            if not user:
                print(f"User with ID {user_id} not found")
                return jsonify({
                    'success': False,
                    'message': 'User not found'
                }), 404
                
            # Format date fields for JSON serialization
            if 'created_at' in user and user['created_at']:
                user['created_at'] = user['created_at'].strftime('%Y-%m-%d %H:%M:%S')
                
            # Ensure all expected fields exist with defaults
            default_fields = {
                'id': user_id,
                'username': 'user',
                'email': '',
                'first_name': '',
                'last_name': '',
                'full_name': '',
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
            if 'password' in user or 'password_hash' in user:
                user.pop('password', None)
                user.pop('password_hash', None)

            # Add a name field for convenience based on available name fields
            if 'full_name' in user and user['full_name']:
                user['name'] = user['full_name']
            elif ('first_name' in user and user['first_name']) or ('last_name' in user and user['last_name']):
                user['name'] = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
            else:
                user['name'] = user.get('username', 'User')

            # Ensure proper type conversion for boolean and numeric fields
            user['is_verified'] = bool(int(user.get('is_verified', 0)))
            user['id'] = int(user['id'])
            
            return jsonify({
                'success': True,
                'user': user
            }), 200
            
        except Exception as query_err:
            print(f"Query error in profile: {str(query_err)}")
            # Create a default user profile as fallback
            default_user = {
                'id': user_id,
                'username': 'user',
                'email': '',
                'name': 'User',
                'phone': '',
                'role': role or 'consumer',
                'created_at': '',
                'is_verified': False
            }
            
            return jsonify({
                'success': True,  # Return success with default data
                'user': default_user,
                'error_details': str(query_err)
            }), 200  # Return 200 to not break the frontend
        
        finally:
            if cursor:
                cursor.close()

    except Exception as e:
        print(f"Critical profile error: {str(e)}")
        # Return default user profile in case of critical error
        default_user = {
            'id': user_id if user_id else 0,
            'username': 'user',
            'email': '',
            'name': 'User',
            'phone': '',
            'role': role or 'consumer',
            'created_at': '',
            'is_verified': False
        }
        
        return jsonify({
            'success': True,  # Return success with default data
            'user': default_user,
            'error_message': 'An error occurred while fetching your profile.'
        }), 200  # Return 200 to not break the frontend

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
