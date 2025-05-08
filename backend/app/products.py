import os
from flask import Blueprint, request, jsonify
from .database import get_db_connection
from .auth_middleware import token_required

products_bp = Blueprint('products', __name__)

@products_bp.route('/verify', methods=['POST'])
@token_required(roles=['consumer'])
def verify_product(user_id, role):
    data = request.get_json()
    
    if not data or 'barcode' not in data:
        return jsonify({'message': 'No barcode provided'}), 400
    
    barcode = data['barcode']
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Find the product by barcode (product_code)
        cursor.execute(
            "SELECT * FROM products WHERE product_code = %s", 
            (barcode,)
        )
        
        product = cursor.fetchone()
        
        if not product:
            return jsonify({
                'message': 'Product not found',
                'status': 'unverified'
            }), 404
        
        # Return the business ID that owns this product
        return jsonify({
            'message': 'Product verified',
            'status': 'success',
            'product_id': product['id'],
            'business_id': product['business_id']
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Error: {str(e)}'}), 500
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()

@products_bp.route('/details', methods=['GET'])
@token_required(roles=['consumer'])
def get_product_details(user_id, role):
    product_code = request.args.get('product_code')
    
    if not product_code:
        return jsonify({'message': 'No product code provided'}), 400
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get product details
        cursor.execute(
            "SELECT * FROM products WHERE product_code = %s", 
            (product_code,)
        )
        
        product = cursor.fetchone()
        
        if not product:
            return jsonify({'message': 'Product not found'}), 404
        
        business_id = product['business_id']
        
        # Get business details
        cursor.execute("""
            SELECT u.id, u.full_name, bc.business_name, bc.status AS certification_status,
                bc.cleanliness_rating, bc.is_vegetarian, bc.is_vegan, bc.cruelty_free,
                bc.photos
            FROM users u
            JOIN business_certification bc ON u.id = bc.user_id
            WHERE u.id = %s
        """, (business_id,))
        
        business = cursor.fetchone()
        
        if not business:
            return jsonify({'message': 'Business not found'}), 404
        
        # Get feedback for the product
        cursor.execute("""
            SELECT f.id, u.full_name AS user_name, f.feedback_text, f.rating, 
                f.upvotes, f.created_at, f.photos
            FROM feedback f
            JOIN users u ON f.consumer_id = u.id
            WHERE f.product_id = %s
            ORDER BY f.created_at DESC
        """, (product['id'],))
        
        feedback = cursor.fetchall()
        
        # Calculate average rating
        average_rating = 0
        if feedback:
            total_rating = sum(item['rating'] for item in feedback)
            average_rating = total_rating / len(feedback)
        
        # Prepare response data
        business_data = {
            'id': business['id'],
            'business_name': business['business_name'],
            'certification_status': business['certification_status'],
            'cleanliness_rating': business['cleanliness_rating'] or 0,
            'is_vegetarian': bool(business['is_vegetarian']),
            'is_vegan': bool(business['is_vegan']),
            'cruelty_free': bool(business['cruelty_free']),
            'photos': [] if not business['photos'] else business['photos'],
            'feedback': [],
            'average_rating': round(average_rating, 1)
        }
        
        # Format feedback data
        for item in feedback:
            feedback_item = {
                'id': item['id'],
                'user_name': item['user_name'],
                'feedback_text': item['feedback_text'],
                'rating': item['rating'],
                'upvotes': item['upvotes'],
                'created_at': item['created_at'].isoformat() if item['created_at'] else None,
                'photos': [] if not item['photos'] else item['photos']
            }
            business_data['feedback'].append(feedback_item)
        
        return jsonify({
            'business': business_data,
            'product': {
                'id': product['id'],
                'product_code': product['product_code'],
                'certification_status': product['certification_status']
            }
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Error: {str(e)}'}), 500
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()

@products_bp.route('/register', methods=['POST'])
@token_required(roles=['business'])
def register_product(user_id, role):
    data = request.get_json()
    
    if not data:
        return jsonify({'message': 'No data provided'}), 400
    
    product_name = data.get('product_name')
    product_code = data.get('product_code')
    
    if not product_name or not product_code:
        return jsonify({'message': 'Product name and code are required'}), 400
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if product code already exists
        cursor.execute(
            "SELECT id FROM products WHERE product_code = %s", 
            (product_code,)
        )
        
        if cursor.fetchone():
            return jsonify({'message': 'Product with this code already exists'}), 400
        
        # Insert new product
        cursor.execute("""
            INSERT INTO products (business_id, product_name, product_code)
            VALUES (%s, %s, %s)
        """, (user_id, product_name, product_code))
        
        conn.commit()
        
        return jsonify({
            'message': 'Product registered successfully',
            'product_name': product_name,
            'product_code': product_code
        }), 201
        
    except Exception as e:
        return jsonify({'message': f'Error: {str(e)}'}), 500
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close() 