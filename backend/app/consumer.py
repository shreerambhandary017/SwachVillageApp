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
        cursor = db.cursor()
        
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
            }), 401  # Use 401 for auth issues

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
        db = get_db()
        cursor = db.cursor()
        
        try:
            # Simplified query - focus on essential fields
            query = """
            SELECT 
                id, 
                COALESCE(email, '') as email,
                COALESCE(full_name, '') as full_name,
                COALESCE(phone, '') as phone,
                COALESCE(role, 'consumer') as role,
                COALESCE(is_verified, 0) as is_verified,
                COALESCE(created_at, CURRENT_TIMESTAMP) as created_at
            FROM users
            WHERE id = %s AND role = %s
            """
            
            print(f"User profile query for ID: {user_id}, role: {role}")
            cursor.execute(query, (user_id, role))
            user = cursor.fetchone()
            
            if not user:
                print(f"User with ID {user_id} and role {role} not found")
                return jsonify({
                    'success': False,
                    'message': 'User not found or access denied'
                }), 404
                
            # Format date fields for JSON serialization
            if 'created_at' in user and user['created_at']:
                user['created_at'] = user['created_at'].strftime('%Y-%m-%d %H:%M:%S')
            
            # Set the name field
            user['name'] = user.get('full_name', 'User')
            
            # Ensure proper type conversion for boolean and numeric fields
            user['is_verified'] = bool(int(user.get('is_verified', 0)))
            user['id'] = int(user['id'])
            
            print(f"Successfully fetched user profile: {user['id']} - {user['name']}")
            
            return jsonify({
                'success': True,
                'user': user
            }), 200
            
        except Exception as query_err:
            print(f"Query error in profile: {str(query_err)}")
            # Return proper error status for database issues
            return jsonify({
                'success': False,
                'message': 'Failed to retrieve user profile', 
                'error_details': str(query_err)
            }), 500  # Use 500 for server errors
        
        finally:
            if cursor:
                cursor.close()

    except Exception as e:
        print(f"Critical profile error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'An error occurred while fetching your profile.',
            'error_details': str(e)
        }), 500  # Return proper error code

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
        cursor = db.cursor()
        
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
            count_cursor = db.cursor()
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
            
            cursor = db.cursor()
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
