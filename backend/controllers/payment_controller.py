from flask import request, jsonify
from services.payment_service import PaymentService

class PaymentController:
    """Controller for payment-related HTTP requests"""
    
    def __init__(self):
        self.payment_service = PaymentService()
    
    def get_sliding_scale_options(self):
        """Handle get sliding scale options request"""
        try:
            options = self.payment_service.get_sliding_scale_options()
            
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
    
    def get_all_sliding_scale_options(self):
        """Handle get all sliding scale options request"""
        try:
            options = self.payment_service.get_all_sliding_scale_options()
            
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
                        "stripe_price_id": option.stripe_price_id,
                        "is_active": option.is_active
                    }
                    for option in options
                ]
            })
            
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    def create_sliding_scale_option(self):
        """Handle create sliding scale option request"""
        try:
            data = request.get_json()
            if not data:
                return jsonify({"success": False, "error": "Missing JSON body"}), 400
            
            option = self.payment_service.create_sliding_scale_option(data)
            
            return jsonify({
                "success": True,
                "option": {
                    "id": option.id,
                    "tier_name": option.tier_name,
                    "price_min": option.price_min,
                    "price_max": option.price_max,
                    "description": option.description,
                    "category": option.category,
                    "stripe_price_id": option.stripe_price_id,
                    "is_active": option.is_active
                }
            }), 201
            
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500 