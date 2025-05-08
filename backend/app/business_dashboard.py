import os
import json
from flask import Blueprint, request, jsonify
from .database import get_db_connection
from .auth_middleware import token_required

business_dashboard_bp = Blueprint('business_dashboard', __name__)

@business_dashboard_bp.route('/dashboard', methods=['GET'])
@token_required(roles=['business'])
def get_dashboard_data(user_id, role):
    """
    Get business certification dashboard data for the authenticated business user.
    Shows certification status, progress, and completion details.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get business certification data
        cursor.execute("""
            SELECT 
                bc.business_name,
                bc.status AS application_status,
                bc.business_details IS NOT NULL AS has_business_details,
                bc.owner_name IS NOT NULL AS has_owner_details,
                bc.vendor_compliance IS NOT NULL AS has_vendor_compliance,
                bc.cleanliness_rating IS NOT NULL AS has_cleanliness_hygiene,
                bc.cruelty_free IS NOT NULL AS has_cruelty_free,
                bc.sustainability IS NOT NULL AS has_sustainability,
                bc.audit_required,
                CASE 
                    WHEN bc.photos IS NULL THEN 0
                    WHEN JSON_LENGTH(bc.photos) IS NULL THEN 0
                    ELSE JSON_LENGTH(bc.photos)
                END AS document_count,
                bc.updated_at
            FROM business_certification bc
            WHERE bc.user_id = %s
        """, (user_id,))

        cert_data = cursor.fetchone()

        if not cert_data:
            # No certification data found
            return jsonify({
                'message': 'No certification data found',
                'data': None
            }), 404

        # Calculate completion percentage based on completed sections
        completed_fields = 0
        total_fields = 6  # Total number of required sections

        if cert_data['has_business_details']:
            completed_fields += 1
        if cert_data['has_owner_details']:
            completed_fields += 1
        if cert_data['has_vendor_compliance']:
            completed_fields += 1
        if cert_data['has_cleanliness_hygiene']:
            completed_fields += 1
        if cert_data['has_cruelty_free']:
            completed_fields += 1
        if cert_data['has_sustainability']:
            completed_fields += 1

        completion_percentage = int((completed_fields / total_fields) * 100)

        # Prepare response data
        dashboard_data = {
            'business_name': cert_data['business_name'],
            'application_status': cert_data['application_status'],
            'completion_percentage': completion_percentage,
            'sections': {
                'business_details': bool(cert_data['has_business_details']),
                'owner_details': bool(cert_data['has_owner_details']),
                'vendor_compliance': bool(cert_data['has_vendor_compliance']),
                'cleanliness_hygiene': bool(cert_data['has_cleanliness_hygiene']),
                'cruelty_free': bool(cert_data['has_cruelty_free']),
                'sustainability': bool(cert_data['has_sustainability'])
            },
            'document_uploads': cert_data['document_count'],
            'audit_required': bool(cert_data['audit_required']),
            'last_updated': cert_data['updated_at'].isoformat() if cert_data['updated_at'] else None
        }

        return jsonify({
            'message': 'Dashboard data retrieved successfully',
            'data': dashboard_data
        }), 200

    except Exception as e:
        return jsonify({'message': f'Error: {str(e)}'}), 500
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()


@business_dashboard_bp.route('/feedback', methods=['GET'])
@token_required(roles=['business'])
def get_business_feedback(user_id, role):
    """
    Get all feedback related to the business's products.
    Joins product and feedback tables to get relevant data.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get business products and their feedback
        cursor.execute("""
            SELECT 
                p.id AS product_id,
                p.product_name,
                f.id AS feedback_id,
                f.feedback_text,
                f.rating,
                f.upvotes,
                f.created_at,
                f.photos,
                u.full_name AS consumer_name
            FROM products p
            LEFT JOIN feedback f ON p.id = f.product_id
            LEFT JOIN users u ON f.consumer_id = u.id
            WHERE p.business_id = %s
            ORDER BY f.created_at DESC
        """, (user_id,))

        feedback_data = cursor.fetchall()

        # Process and organize feedback by product
        products = {}
        for item in feedback_data:
            product_id = item['product_id']
            
            # Add product to dict if not exists
            if product_id not in products:
                products[product_id] = {
                    'product_id': product_id,
                    'product_name': item['product_name'],
                    'feedback': [],
                    'average_rating': 0,
                    'feedback_count': 0
                }
            
            # Add feedback if it exists
            if item['feedback_id']:
                feedback_item = {
                    'id': item['feedback_id'],
                    'text': item['feedback_text'],
                    'rating': item['rating'],
                    'upvotes': item['upvotes'],
                    'created_at': item['created_at'].isoformat() if item['created_at'] else None,
                    'consumer_name': item['consumer_name'],
                    'photos': [] if not item['photos'] else json.loads(item['photos'])
                }
                products[product_id]['feedback'].append(feedback_item)
                products[product_id]['feedback_count'] += 1
        
        # Calculate average ratings for each product
        product_list = []
        for product_id, product in products.items():
            if product['feedback_count'] > 0:
                total_rating = sum(feedback['rating'] for feedback in product['feedback'])
                product['average_rating'] = round(total_rating / product['feedback_count'], 1)
            product_list.append(product)
        
        # Sort products by average rating (highest first)
        product_list.sort(key=lambda x: x['average_rating'], reverse=True)
        
        # Get overall business rating
        overall_rating = 0
        total_feedback = sum(p['feedback_count'] for p in product_list)
        if total_feedback > 0:
            sum_ratings = sum(p['average_rating'] * p['feedback_count'] for p in product_list)
            overall_rating = round(sum_ratings / total_feedback, 1)

        return jsonify({
            'message': 'Feedback retrieved successfully',
            'data': {
                'overall_rating': overall_rating,
                'total_feedback': total_feedback,
                'products': product_list
            }
        }), 200

    except Exception as e:
        return jsonify({'message': f'Error: {str(e)}'}), 500
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()


@business_dashboard_bp.route('/profile', methods=['GET'])
@token_required(roles=['business'])
def get_business_profile(user_id, role):
    """
    Get business profile details for the authenticated business user.
    Combines data from users and business_certification tables.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get business profile data
        cursor.execute("""
            SELECT 
                u.id,
                u.full_name,
                u.email,
                u.phone,
                u.role,
                u.created_at AS joined_date,
                bc.business_name,
                bc.registration_number,
                bc.pan_card,
                bc.aadhaar_card,
                bc.gst_number,
                bc.owner_name,
                bc.citizenship,
                bc.cleanliness_rating,
                bc.is_vegetarian,
                bc.is_vegan,
                bc.cruelty_free,
                bc.sustainability,
                bc.status AS certification_status,
                bc.created_at AS certification_date
            FROM users u
            LEFT JOIN business_certification bc ON u.id = bc.user_id
            WHERE u.id = %s
        """, (user_id,))

        profile_data = cursor.fetchone()

        if not profile_data:
            return jsonify({
                'message': 'Profile not found',
                'data': None
            }), 404

        # Format profile data for response
        profile = {
            'user_id': profile_data['id'],
            'full_name': profile_data['full_name'],
            'email': profile_data['email'],
            'phone': profile_data['phone'],
            'role': profile_data['role'],
            'joined_date': profile_data['joined_date'].isoformat() if profile_data['joined_date'] else None,
            'business': {
                'business_name': profile_data['business_name'],
                'registration_number': profile_data['registration_number'],
                'pan_card': profile_data['pan_card'],
                'aadhaar_card': profile_data['aadhaar_card'],
                'gst_number': profile_data['gst_number'],
                'owner_name': profile_data['owner_name'],
                'citizenship': profile_data['citizenship'],
                'cleanliness_rating': profile_data['cleanliness_rating'],
                'is_vegetarian': bool(profile_data['is_vegetarian']),
                'is_vegan': bool(profile_data['is_vegan']),
                'cruelty_free': bool(profile_data['cruelty_free']),
                'sustainability': profile_data['sustainability'],
                'certification_status': profile_data['certification_status'],
                'certification_date': profile_data['certification_date'].isoformat() if profile_data['certification_date'] else None
            }
        }

        return jsonify({
            'message': 'Profile retrieved successfully',
            'data': profile
        }), 200

    except Exception as e:
        return jsonify({'message': f'Error: {str(e)}'}), 500
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close() 