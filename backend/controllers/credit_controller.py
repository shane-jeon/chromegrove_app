from flask import request, jsonify
from services.credit_service import CreditService
from services.user_service import UserService

class CreditController:
    """Controller for credit-related operations"""
    
    def __init__(self):
        self.credit_service = CreditService()
        self.user_service = UserService()
    
    def get_student_credits(self):
        """Get available credits for a student"""
        try:
            clerk_user_id = request.args.get('clerk_user_id')
            if not clerk_user_id:
                return jsonify({"success": False, "error": "clerk_user_id is required"}), 400
            
            # Get user
            user = self.user_service.get_user_by_clerk_id(clerk_user_id)
            if not user or user.discriminator != 'student':
                return jsonify({"success": False, "error": "Student not found"}), 404
            
            # Get credit count and available credits
            credit_count = self.credit_service.get_credit_count(user.id)
            available_credits = self.credit_service.get_available_credits(user.id)
            
            return jsonify({
                "success": True,
                "credit_count": credit_count,
                "credits": [
                    {
                        "id": credit.id,
                        "created_at": credit.created_at.isoformat(),
                        "reason": credit.reason
                    }
                    for credit in available_credits
                ]
            })
            
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    def get_credit_history(self):
        """Get credit history for a student"""
        try:
            clerk_user_id = request.args.get('clerk_user_id')
            if not clerk_user_id:
                return jsonify({"success": False, "error": "clerk_user_id is required"}), 400
            
            # Get user
            user = self.user_service.get_user_by_clerk_id(clerk_user_id)
            if not user or user.discriminator != 'student':
                return jsonify({"success": False, "error": "Student not found"}), 404
            
            # Get credit history
            credit_history = self.credit_service.get_credit_history(user.id)
            
            return jsonify({
                "success": True,
                "credits": [
                    {
                        "id": credit.id,
                        "created_at": credit.created_at.isoformat(),
                        "used": credit.used,
                        "used_at": credit.used_at.isoformat() if credit.used_at else None,
                        "reason": credit.reason
                    }
                    for credit in credit_history
                ]
            })
            
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    def use_credit_for_booking(self):
        """Use a credit for booking a class"""
        try:
            data = request.get_json()
            if not data:
                return jsonify({"success": False, "error": "Missing JSON body"}), 400
            
            clerk_user_id = data.get('clerk_user_id')
            if not clerk_user_id:
                return jsonify({"success": False, "error": "clerk_user_id is required"}), 400
            
            # Get user
            user = self.user_service.get_user_by_clerk_id(clerk_user_id)
            if not user or user.discriminator != 'student':
                return jsonify({"success": False, "error": "Student not found"}), 404
            
            # Use a credit
            credit = self.credit_service.use_credit(user.id)
            if not credit:
                return jsonify({"success": False, "error": "No available credits"}), 400
            
            return jsonify({
                "success": True,
                "credit_used": {
                    "id": credit.id,
                    "created_at": credit.created_at.isoformat(),
                    "reason": credit.reason
                },
                "remaining_credits": self.credit_service.get_credit_count(user.id)
            })
            
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500 