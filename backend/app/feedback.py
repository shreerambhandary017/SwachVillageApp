import os
import json
from flask import Blueprint, request, jsonify
from .database import get_db_connection
from .auth_middleware import token_required

feedback_bp = Blueprint('feedback', __name__)

@feedback_bp.route('/submit', methods=['POST'])
@token_required(roles=['consumer'])
def submit_feedback(user_id, role):
    data = request.get_json()
    
    if not data:
        return jsonify({'message': 'No data provided'}), 400
    
    # Required fields
    product_code = data.get('product_code')
    business_id = data.get('business_id')
    feedback_text = data.get('feedback_text')
    rating = data.get('rating')
    
    # Optional fields
    photos = data.get('photos')
    
    if not product_code or not feedback_text or not rating:
        return jsonify({'message': 'Missing required fields'}), 400
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Find product by code
        cursor.execute(
            "SELECT id FROM products WHERE product_code = %s", 
            (product_code,)
        )
        
        product = cursor.fetchone()
        
        if not product:
            return jsonify({'message': 'Product not found'}), 404
        
        product_id = product['id']
        
        # Check if user already submitted feedback for this product
        cursor.execute(
            "SELECT id FROM feedback WHERE product_id = %s AND consumer_id = %s", 
            (product_id, user_id)
        )
        
        existing_feedback = cursor.fetchone()
        
        if existing_feedback:
            # Update existing feedback
            cursor.execute("""
                UPDATE feedback 
                SET feedback_text = %s, rating = %s, photos = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (
                feedback_text,
                rating,
                photos,
                existing_feedback['id']
            ))
            
            feedback_id = existing_feedback['id']
            message = 'Feedback updated successfully'
        else:
            # Insert new feedback
            cursor.execute("""
                INSERT INTO feedback (product_id, consumer_id, feedback_text, rating, photos)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                product_id,
                user_id,
                feedback_text,
                rating,
                photos
            ))
            
            feedback_id = cursor.lastrowid
            message = 'Feedback submitted successfully'
        
        conn.commit()
        
        return jsonify({
            'message': message,
            'feedback_id': feedback_id
        }), 201
        
    except Exception as e:
        return jsonify({'message': f'Error: {str(e)}'}), 500
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()

@feedback_bp.route('/upvote/<int:feedback_id>', methods=['POST'])
@token_required(roles=['consumer'])
def upvote_feedback(user_id, role, feedback_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if feedback exists
        cursor.execute(
            "SELECT * FROM feedback WHERE id = %s", 
            (feedback_id,)
        )
        
        feedback = cursor.fetchone()
        
        if not feedback:
            return jsonify({'message': 'Feedback not found'}), 404
        
        # Update upvote count
        cursor.execute(
            "UPDATE feedback SET upvotes = upvotes + 1 WHERE id = %s", 
            (feedback_id,)
        )
        
        conn.commit()
        
        return jsonify({
            'message': 'Feedback upvoted successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Error: {str(e)}'}), 500
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()

@feedback_bp.route('/get/<int:product_id>', methods=['GET'])
@token_required(roles=['consumer', 'business'])
def get_product_feedback(user_id, role, product_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get feedback for product
        cursor.execute("""
            SELECT f.id, u.full_name AS user_name, f.feedback_text, f.rating, 
                f.upvotes, f.created_at, f.photos
            FROM feedback f
            JOIN users u ON f.consumer_id = u.id
            WHERE f.product_id = %s
            ORDER BY f.created_at DESC
        """, (product_id,))
        
        feedback = cursor.fetchall()
        
        # Calculate average rating
        average_rating = 0
        if feedback:
            total_rating = sum(item['rating'] for item in feedback)
            average_rating = total_rating / len(feedback)
        
        feedback_list = []
        for item in feedback:
            feedback_item = {
                'id': item['id'],
                'user_name': item['user_name'],
                'feedback_text': item['feedback_text'],
                'rating': item['rating'],
                'upvotes': item['upvotes'],
                'created_at': item['created_at'].isoformat() if item['created_at'] else None,
                'photos': [] if not item['photos'] else json.loads(item['photos'])
            }
            feedback_list.append(feedback_item)
        
        return jsonify({
            'feedback': feedback_list,
            'average_rating': round(average_rating, 1),
            'count': len(feedback)
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Error: {str(e)}'}), 500
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close() 