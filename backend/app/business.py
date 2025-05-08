import os
from flask import Blueprint, request, jsonify
from .database import get_db_connection
from .auth_middleware import token_required

business_bp = Blueprint('business', __name__)

@business_bp.route('/certification', methods=['POST'])
@token_required(roles=['business'])
def submit_certification(user_id, role):
    data = request.get_json()
    
    if not data:
        return jsonify({'message': 'No data provided'}), 400
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if business certification already exists
        cursor.execute("SELECT * FROM business_certification WHERE user_id = %s", (user_id,))
        existing_cert = cursor.fetchone()
        
        # Get the current step being submitted
        current_step = data.get('step', 'full_submission')
        
        if existing_cert:
            # Handle step-by-step updates
            if current_step == 'business_details':
                cursor.execute("""
                    UPDATE business_certification SET 
                    business_name = %s,
                    registration_number = %s,
                    pan_card = %s,
                    aadhaar_card = %s,
                    gst_number = %s,
                    updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = %s
                """, (
                    data.get('business_name'),
                    data.get('registration_number', ''),
                    data.get('pan_card', ''),
                    data.get('aadhaar_card', ''),
                    data.get('gst_number', ''),
                    user_id
                ))
            elif current_step == 'owner_details':
                cursor.execute("""
                    UPDATE business_certification SET 
                    owner_name = %s,
                    citizenship = %s,
                    owner_mobile = %s,
                    owner_email = %s,
                    pan_card_owner = %s,
                    aadhaar_card_owner = %s,
                    updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = %s
                """, (
                    data.get('owner_name'),
                    data.get('citizenship', ''),
                    data.get('owner_mobile', ''),
                    data.get('owner_email', ''),
                    data.get('pan_card_owner', ''),
                    data.get('aadhaar_card_owner', ''),
                    user_id
                ))
            elif current_step == 'vendor_compliance':
                cursor.execute("""
                    UPDATE business_certification SET 
                    vendor_count = %s,
                    vendor_certification = %s,
                    updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = %s
                """, (
                    data.get('vendor_count', 0),
                    data.get('vendor_certification', ''),
                    user_id
                ))
            elif current_step == 'cleanliness':
                cursor.execute("""
                    UPDATE business_certification SET 
                    cleanliness_rating = %s,
                    photos = %s,
                    sanitation_practices = %s,
                    waste_management = %s,
                    updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = %s
                """, (
                    data.get('cleanliness_rating', 0),
                    data.get('photos', '[]'),
                    data.get('sanitation_practices', False),
                    data.get('waste_management', False),
                    user_id
                ))
            elif current_step == 'cruelty_free':
                cursor.execute("""
                    UPDATE business_certification SET 
                    is_vegetarian = %s,
                    is_vegan = %s,
                    cruelty_free = %s,
                    updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = %s
                """, (
                    data.get('is_vegetarian', False),
                    data.get('is_vegan', False),
                    data.get('cruelty_free', False),
                    user_id
                ))
            elif current_step == 'sustainability':
                cursor.execute("""
                    UPDATE business_certification SET 
                    sustainability = %s,
                    updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = %s
                """, (
                    data.get('sustainability', ''),
                    user_id
                ))
            else:
                # Full submission (fallback)
                cursor.execute("""
                    UPDATE business_certification SET 
                    business_name = %s,
                    registration_number = %s,
                    pan_card = %s,
                    aadhaar_card = %s,
                    gst_number = %s,
                    owner_name = %s,
                    citizenship = %s,
                    cruelty_free = %s,
                    sustainability = %s,
                    status = 'pending',
                    updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = %s
                """, (
                    data.get('business_name'),
                    data.get('registration_number', ''),
                    data.get('pan_card', ''),
                    data.get('aadhaar_card', ''),
                    data.get('gst_number', ''),
                    data.get('owner_name'),
                    data.get('citizenship', ''),
                    data.get('cruelty_free', False),
                    data.get('sustainability', ''),
                    user_id
                ))
        else:
            # For new certification, create entry with available fields
            cursor.execute("""
                INSERT INTO business_certification (
                    user_id, business_name, registration_number, pan_card, 
                    aadhaar_card, gst_number, owner_name, citizenship,
                    owner_mobile, owner_email, pan_card_owner, aadhaar_card_owner,
                    vendor_count, vendor_certification, cleanliness_rating,
                    photos, sanitation_practices, waste_management,
                    is_vegetarian, is_vegan, cruelty_free, sustainability
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                user_id,
                data.get('business_name', ''),
                data.get('registration_number', ''),
                data.get('pan_card', ''),
                data.get('aadhaar_card', ''),
                data.get('gst_number', ''),
                data.get('owner_name', ''),
                data.get('citizenship', ''),
                data.get('owner_mobile', ''),
                data.get('owner_email', ''),
                data.get('pan_card_owner', ''),
                data.get('aadhaar_card_owner', ''),
                data.get('vendor_count', 0),
                data.get('vendor_certification', ''),
                data.get('cleanliness_rating', 0),
                data.get('photos', '[]'),
                data.get('sanitation_practices', False),
                data.get('waste_management', False),
                data.get('is_vegetarian', False),
                data.get('is_vegan', False),
                data.get('cruelty_free', False),
                data.get('sustainability', '')
            ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'message': 'Business certification submitted successfully',
            'status': 'pending'
        }), 201
        
    except Exception as e:
        return jsonify({'message': f'Error: {str(e)}'}), 500

@business_bp.route('/certification', methods=['GET'])
@token_required(roles=['business'])
def get_certification(user_id, role):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # First get the user details from the users table
        cursor.execute(
            "SELECT email, phone FROM users WHERE id = %s", 
            (user_id,)
        )
        user = cursor.fetchone()
        
        # Then get the certification details
        cursor.execute(
            "SELECT * FROM business_certification WHERE user_id = %s", 
            (user_id,)
        )
        
        certification = cursor.fetchone()
        cursor.close()
        conn.close()
        
        # Store user email and phone for later use
        user_email = user['email'] if user else ''
        user_phone = user['phone'] if user else ''
        
        if not certification:
            return jsonify({'message': 'No certification found'}), 404
        
        # Create a certification dictionary with safe null handling
        cert_data = {
            'id': certification['id'],
            'business_name': certification['business_name'] or '',
            'registration_number': certification['registration_number'] or '',
            'pan_card': certification['pan_card'] or '',
            'aadhaar_card': certification['aadhaar_card'] or '',
            'gst_number': certification['gst_number'] or '',
            'owner_name': certification['owner_name'] or '',
            'citizenship': certification['citizenship'] or 'Indian',
            'owner_mobile': certification['owner_mobile'] or user_phone or '',
            'owner_email': certification['owner_email'] or user_email or '',
            'pan_card_owner': certification['pan_card_owner'] or certification['pan_card'] or '',
            'aadhaar_card_owner': certification['aadhaar_card_owner'] or certification['aadhaar_card'] or '',
            'vendor_count': int(certification['vendor_count']) if certification['vendor_count'] is not None else 0,
            'vendor_certification': certification['vendor_certification'] or '',
            'cleanliness_rating': int(certification['cleanliness_rating']) if certification['cleanliness_rating'] is not None else 0,
            'photos': certification['photos'] or '[]',
            'sanitation_practices': bool(certification['sanitation_practices']),
            'waste_management': bool(certification['waste_management']),
            'is_vegetarian': bool(certification['is_vegetarian']),
            'is_vegan': bool(certification['is_vegan']),
            'cruelty_free': bool(certification['cruelty_free']),
            'sustainability': certification['sustainability'] or '',
            'status': certification['status'] or 'pending',
            'created_at': certification['created_at'].isoformat() if certification['created_at'] else None,
            'updated_at': certification['updated_at'].isoformat() if certification['updated_at'] else None
        }
        
        # Print the owner details for debugging
        print(f"Owner details: {cert_data['owner_name']}, {cert_data['owner_mobile']}, {cert_data['owner_email']}")
        
        return jsonify({
            'certification': cert_data
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Error: {str(e)}'}), 500 

@business_bp.route('/dashboard', methods=['GET'])
@token_required(roles=['business'])
def get_dashboard_data(user_id, role):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get comprehensive business certification data
        cursor.execute("""
            SELECT 
                bc.id, 
                bc.business_name,
                bc.status AS certification_status,
                bc.cleanliness_rating,
                bc.is_vegetarian,
                bc.is_vegan,
                bc.cruelty_free,
                bc.created_at,
                bc.updated_at,
                -- Check completion of each section by checking if essential fields are filled
                CASE WHEN bc.business_name IS NOT NULL AND 
                          bc.registration_number IS NOT NULL 
                     THEN 1 ELSE 0 END AS business_details_complete,
                CASE WHEN bc.owner_name IS NOT NULL AND 
                          bc.owner_mobile IS NOT NULL AND 
                          bc.owner_email IS NOT NULL 
                     THEN 1 ELSE 0 END AS owner_details_complete,
                CASE WHEN bc.vendor_count > 0 OR 
                          bc.vendor_certification IS NOT NULL 
                     THEN 1 ELSE 0 END AS vendor_compliance_complete,
                CASE WHEN bc.cleanliness_rating > 0 OR
                          bc.sanitation_practices = TRUE OR
                          bc.waste_management = TRUE 
                     THEN 1 ELSE 0 END AS cleanliness_complete,
                CASE WHEN bc.cruelty_free = TRUE 
                     THEN 1 ELSE 0 END AS cruelty_free_complete,
                CAST(IFNULL((SELECT COUNT(*) FROM feedback f 
                 JOIN products p ON f.product_id = p.id 
                 WHERE p.business_id = bc.user_id), 0) AS UNSIGNED) AS total_feedback,
                CAST(IFNULL((SELECT AVG(f.rating) FROM feedback f 
                 JOIN products p ON f.product_id = p.id 
                 WHERE p.business_id = bc.user_id), 0) AS DECIMAL(10,2)) AS average_rating
            FROM business_certification bc
            WHERE bc.user_id = %s
        """, (user_id))
        
        columns = [col[0] for col in cursor.description]
        result = cursor.fetchone()
        
        business_data = None
        if result:
            business_data = dict(zip(columns, result))
        else:
            # No data found at all, return default
            return jsonify({
                'stats': {
                    'total_scans': 0,
                    'total_feedback': 0,
                    'average_rating': 0,
                    'certification_status': 'not_submitted',
                    'cleanliness_rating': 0,
                    'business_name': 'Your Business'
                },
                'progress': {
                    'business_details': False,
                    'owner_details': False,
                    'vendor_compliance': False,
                    'cleanliness': False,
                    'cruelty_free': False
                },
                'completion_percentage': 0,
                'recent_activity': [],
                'certification_complete': False
            }), 200
            
        # Progress data from the certification fields - convert to boolean for frontend consistency
        progress = {
            'business_details': bool(business_data.get('business_details_complete')),
            'owner_details': bool(business_data.get('owner_details_complete')),
            'vendor_compliance': bool(business_data.get('vendor_compliance_complete')),
            'cleanliness': bool(business_data.get('cleanliness_complete')),
            'cruelty_free': bool(business_data.get('cruelty_free_complete'))
        }
        
        # Debug output
        print(f"Progress data: {progress}")
        print(f"Business data keys: {business_data.keys()}")
        print(f"Business details complete: {business_data.get('business_details_complete')}")
        print(f"Owner details complete: {business_data.get('owner_details_complete')}")
        
        # Calculate completion percentage
        completed_steps = sum(1 for step in progress.values() if step)
        completion_percentage = int((completed_steps / 5) * 100)
        
        # Get recent products for this business
        cursor.execute("""
            SELECT 
                p.id, 
                p.product_name,
                p.created_at,
                p.certification_status
            FROM products p
            WHERE p.business_id = %s
            ORDER BY p.created_at DESC
            LIMIT 5
        """, (user_id,))
        
        columns = [col[0] for col in cursor.description]
        products_results = cursor.fetchall()
        
        recent_products = []
        if products_results:
            for res in products_results:
                recent_products.append(dict(zip(columns, res)))
        
        # Get recent feedback
        cursor.execute("""
            SELECT 
                f.id, 
                f.rating,
                f.feedback_text as comment,
                f.created_at,
                u.full_name as consumer_name,
                p.product_name
            FROM feedback f
            JOIN users u ON f.consumer_id = u.id
            JOIN products p ON f.product_id = p.id
            WHERE p.business_id = %s
            ORDER BY f.created_at DESC
            LIMIT 5
        """, (user_id,))
        
        columns = [col[0] for col in cursor.description]
        recent_feedback_results = cursor.fetchall()
        
        recent_feedback = []
        if recent_feedback_results:
            for res in recent_feedback_results:
                recent_feedback.append(dict(zip(columns, res)))
        
        # Combine recent activity
        recent_activity = []
        
        # Add product activity
        for product in recent_products:
            recent_activity.append({
                'id': str(product['id']),
                'type': 'product',
                'product_name': product['product_name'],
                'certification_status': product['certification_status'],
                'timestamp': product['created_at'].isoformat() if product['created_at'] else None
            })
            
        # Add feedback activity
        for feedback in recent_feedback:
            recent_activity.append({
                'id': str(feedback['id']),
                'type': 'feedback',
                'rating': feedback['rating'],
                'comment': feedback['comment'],
                'product_name': feedback['product_name'],
                'consumer_name': feedback['consumer_name'],
                'timestamp': feedback['created_at'].isoformat() if feedback['created_at'] else None
            })
            
        # Sort by timestamp descending
        recent_activity.sort(key=lambda x: x['timestamp'] if x['timestamp'] else '', reverse=True)
        
        # Convert numeric values explicitly to avoid type issues
        try:
            total_feedback = int(business_data.get('total_feedback', 0))
        except (ValueError, TypeError):
            total_feedback = 0
            
        try:
            average_rating = float(business_data.get('average_rating', 0))
        except (ValueError, TypeError):
            average_rating = 0.0
            
        try:
            cleanliness_rating = float(business_data.get('cleanliness_rating', 0) or 0)
        except (ValueError, TypeError):
            cleanliness_rating = 0.0
            
        # Debug information
        print(f"Average rating (raw): {business_data.get('average_rating')}")
        print(f"Average rating (converted): {average_rating}")
            
        response_data = {
            'stats': {
                'total_scans': len(recent_products),
                'total_feedback': total_feedback,
                'average_rating': average_rating,
                'certification_status': business_data.get('certification_status', 'not_submitted'),
                'cleanliness_rating': cleanliness_rating,
                'business_name': business_data.get('business_name', 'Your Business')
            },
            'progress': progress,
            'completion_percentage': completion_percentage,
            'recent_activity': recent_activity[:5],  # Limit to 5 most recent activities
            'certification_complete': business_data.get('certification_status') == 'approved'
        }
        
        return jsonify(response_data), 200
        
    except Exception as e:
        print(f"Dashboard error: {str(e)}")
        return jsonify({'message': f'Error: {str(e)}'}), 500

@business_bp.route('/feedback', methods=['GET'])
@token_required(roles=['business'])
def get_business_feedback(user_id, role):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        print(f"Getting feedback for business ID: {user_id}")
        
        # Get all feedback for this business
        cursor.execute("""
            SELECT 
                f.id, 
                f.rating,
                f.feedback_text,
                f.created_at,
                u.full_name as consumer_name,
                p.product_name
            FROM feedback f
            JOIN users u ON f.consumer_id = u.id
            JOIN products p ON f.product_id = p.id
            WHERE p.business_id = %s
            ORDER BY f.created_at DESC
        """, (user_id,))
        
        columns = [col[0] for col in cursor.description]
        feedback_results = cursor.fetchall()
        
        feedback_list = []
        for result in feedback_results:
            feedback_list.append(dict(zip(columns, result)))
        
        # Transform data for frontend
        feedback_data = []
        for feedback in feedback_list:
            feedback_data.append({
                'id': feedback['id'],
                'rating': feedback['rating'],
                'comment': feedback['feedback_text'],
                'consumer_name': feedback['consumer_name'],
                'product_name': feedback['product_name'],
                'created_at': feedback['created_at'].isoformat() if feedback['created_at'] else None
            })
        
        # Get summary stats
        cursor.execute("""
            SELECT 
                COUNT(*) as total_feedback,
                AVG(rating) as average_rating,
                SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
                SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
                SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
                SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
                SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
            FROM feedback
            WHERE business_id = %s
        """, (user_id,))
        
        columns = [col[0] for col in cursor.description]
        stats_result = cursor.fetchone()
        
        stats = None
        if stats_result:
            stats = dict(zip(columns, stats_result))
        
        # Create summary data
        summary = {
            'total_feedback': stats['total_feedback'] or 0,
            'average_rating': float(stats['average_rating']) if stats['average_rating'] else 0,
            'rating_distribution': {
                '5': stats['five_star'] or 0,
                '4': stats['four_star'] or 0,
                '3': stats['three_star'] or 0,
                '2': stats['two_star'] or 0,
                '1': stats['one_star'] or 0
            }
        }
        
        return jsonify({
            'feedback': feedback_data,
            'summary': summary
        }), 200
        
    except Exception as e:
        print(f"Feedback error: {str(e)}")
        return jsonify({'message': f'Error: {str(e)}'}), 500