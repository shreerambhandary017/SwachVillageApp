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
        cursor.execute("SELECT id FROM business_certification WHERE user_id = %s", (user_id,))
        existing_cert = cursor.fetchone()
        
        if existing_cert:
            # Update existing certification
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
            # Insert new certification
            cursor.execute("""
                INSERT INTO business_certification (
                    user_id, business_name, registration_number, pan_card, 
                    aadhaar_card, gst_number, owner_name, citizenship,
                    cruelty_free, sustainability
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                user_id,
                data.get('business_name'),
                data.get('registration_number', ''),
                data.get('pan_card', ''),
                data.get('aadhaar_card', ''),
                data.get('gst_number', ''),
                data.get('owner_name'),
                data.get('citizenship', ''),
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
        
        cursor.execute(
            "SELECT * FROM business_certification WHERE user_id = %s", 
            (user_id,)
        )
        
        certification = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not certification:
            return jsonify({'message': 'No certification found'}), 404
        
        return jsonify({
            'certification': {
                'id': certification['id'],
                'business_name': certification['business_name'],
                'registration_number': certification['registration_number'],
                'pan_card': certification['pan_card'],
                'aadhaar_card': certification['aadhaar_card'],
                'gst_number': certification['gst_number'],
                'owner_name': certification['owner_name'],
                'citizenship': certification['citizenship'],
                'cruelty_free': certification['cruelty_free'],
                'sustainability': certification['sustainability'],
                'status': certification['status'],
                'created_at': certification['created_at'].isoformat() if certification['created_at'] else None,
                'updated_at': certification['updated_at'].isoformat() if certification['updated_at'] else None
            }
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Error: {str(e)}'}), 500 