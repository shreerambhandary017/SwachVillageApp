from flask import Blueprint, request, jsonify, g
from marshmallow import Schema, fields, ValidationError
from .db import get_db
from .auth import token_required

# Create a Blueprint for consumer routes
consumer_bp = Blueprint('consumer', __name__, url_prefix='/api/consumer')

# ---------------------- Consumer API Routes ---------------------- #

@consumer_bp.route('/feedback', methods=['GET'])
@token_required
def get_user_feedback():
    """Get all feedback submitted by a specific consumer"""
    try:
        db = get_db()
        user_id = request.args.get('user_id')
        
        # If no user_id provided, use the current authenticated user
        if not user_id:
            user_id = g.user.get('id')
            
        query = """
        SELECT f.id, f.rating, f.comment, f.created_at, b.business_name
        FROM feedback f
        JOIN businesses b ON f.business_id = b.id
        WHERE f.user_id = %s
        ORDER BY f.created_at DESC
        """
        
        cursor = db.cursor(dictionary=True)
        cursor.execute(query, (user_id,))
        feedback_items = cursor.fetchall()
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
@token_required
def submit_feedback():
    """Submit feedback for a business"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not all(key in data for key in ['business_id', 'rating']):
            return jsonify({
                'success': False,
                'message': 'Missing required fields: business_id and rating are required'
            }), 400
            
        # Get current user ID from the token
        user_id = g.user.get('id')
        
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
@consumer_bp.route('/businesses', methods=['GET'])
def get_businesses():
    """Get all businesses (paginated)"""
    try:
        db = get_db()
        
        # Pagination parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        offset = (page - 1) * limit
        
        # Get total count
        count_cursor = db.cursor()
        count_cursor.execute("SELECT COUNT(*) FROM businesses")
        total_count = count_cursor.fetchone()[0]
        count_cursor.close()
        
        # Get businesses with average rating
        query = """
        SELECT b.id, b.business_name, b.description, b.certification_status,
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
        
        return jsonify({
            'success': True,
            'businesses': businesses,
            'total': total_count,
            'page': page,
            'total_pages': (total_count + limit - 1) // limit
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to fetch businesses: {str(e)}'
        }), 500
