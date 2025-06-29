from flask import request, jsonify
from services.membership_service import MembershipService
from services.user_service import UserService

class MembershipController:
    """Controller for membership-related HTTP requests"""
    
    def __init__(self):
        self.membership_service = MembershipService()
        self.user_service = UserService()
    
    def get_membership_status(self):
        """Handle get membership status request"""
        try:
            data = request.get_json()
            print(f"[membership_controller] Received request data: {data}")
            if not data:
                print("[membership_controller] No JSON body provided")
                return jsonify({"success": False, "error": "Missing JSON body"}), 400
            
            clerk_user_id = data.get('clerk_user_id')
            print(f"[membership_controller] Clerk user ID: {clerk_user_id}")
            if not clerk_user_id:
                print("[membership_controller] Missing clerk_user_id")
                return jsonify({"success": False, "error": "Missing clerk_user_id"}), 400
            
            membership_status = self.membership_service.get_membership_status(clerk_user_id)
            print(f"[membership_controller] Membership status: {membership_status}")
            
            return jsonify({
                "success": True,
                "membership": membership_status
            })
            
        except Exception as e:
            print(f"[membership_controller] Exception: {e}")
            return jsonify({"success": False, "error": str(e)}), 500
    
    def create_membership(self):
        """Handle create membership request"""
        try:
            data = request.get_json()
            if not data:
                return jsonify({"success": False, "error": "Missing JSON body"}), 400
            
            clerk_user_id = data.get('clerk_user_id')
            option_id = data.get('option_id')
            custom_amount = data.get('custom_amount')
            
            if not clerk_user_id or not option_id:
                return jsonify({"success": False, "error": "Missing required fields"}), 400
            
            # Create membership payment and Stripe session
            session_data = self.membership_service.create_membership_payment(
                clerk_user_id, option_id, custom_amount
            )
            
            return jsonify({
                "success": True,
                "session_id": session_data['session_id'],
                "url": session_data['url']
            })
            
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    def cancel_membership(self):
        """Handle cancel membership request"""
        try:
            data = request.get_json()
            if not data:
                return jsonify({"success": False, "error": "Missing JSON body"}), 400
            
            clerk_user_id = data.get('clerk_user_id')
            if not clerk_user_id:
                return jsonify({"success": False, "error": "Missing clerk_user_id"}), 400
            
            result = self.membership_service.cancel_membership(clerk_user_id)
            
            return jsonify({
                "success": True,
                "message": "Membership cancellation scheduled successfully",
                "details": result
            })
            
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    def get_membership_options(self):
        """Handle get membership options request"""
        try:
            options = self.membership_service.get_membership_options()
            
            return jsonify({
                "success": True,
                "options": [
                    {
                        "id": option.id,
                        "tier_name": option.tier_name,
                        "price_min": option.price_min,
                        "price_max": option.price_max,
                        "description": option.description,
                        "category": option.category,
                        "stripe_price_id": option.stripe_price_id
                    }
                    for option in options
                ]
            })
            
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500 