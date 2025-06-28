from flask import jsonify, request
from services.user_service import UserService
from dtos.user_dto import UserDTO
from typing import Dict, Any


class UserController:
    """Controller for user-related HTTP requests"""
    
    def __init__(self):
        self.user_service = UserService()
    
    def create_user(self):
        """Handle user creation request"""
        try:
            data = request.get_json()
            if not data:
                return jsonify({"success": False, "error": "Missing JSON body"}), 400
            
            user = self.user_service.create_user(data)
            user_dto = UserDTO.from_user(user)
            
            return jsonify({
                "success": True,
                "user": user_dto.to_dict()
            }), 201
            
        except ValueError as e:
            return jsonify({"success": False, "error": str(e)}), 400
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    def get_user_by_clerk_id(self):
        """Handle get user by Clerk ID request"""
        try:
            clerk_user_id = request.args.get('clerk_user_id')
            if not clerk_user_id:
                return jsonify({"success": False, "error": "Missing clerk_user_id parameter"}), 400
            
            user = self.user_service.get_user_by_clerk_id(clerk_user_id)
            if not user:
                return jsonify({"success": False, "error": "User not found"}), 404
            
            user_dto = UserDTO.from_user(user)
            return jsonify({
                "success": True,
                "user": user_dto.to_dict()
            })
            
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    def get_all_users(self):
        """Handle get all users request"""
        try:
            users = self.user_service.get_all_users()
            user_dtos = UserDTO.from_user_list(users)
            
            return jsonify({
                "success": True,
                "users": [dto.to_dict() for dto in user_dtos]
            })
            
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    def search_instructors(self):
        """Handle instructor search request"""
        try:
            query = request.args.get('query', '')
            # Allow empty query to return all instructors
            instructors = self.user_service.search_instructors(query)
            instructor_dtos = UserDTO.from_user_list(instructors)
            
            return jsonify({
                "success": True,
                "instructors": [dto.to_dict() for dto in instructor_dtos]
            })
            
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    def get_user_profile(self, user_id: int):
        """Handle user profile request"""
        try:
            user = self.user_service.get_user_by_id(user_id)
            if not user:
                return jsonify({"success": False, "error": "User not found"}), 404
            
            profile = self.user_service.get_user_profile(user)
            return jsonify({"success": True, "profile": profile})
            
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    def get_all_staff(self):
        """Handle get all staff request"""
        try:
            staff_members = self.user_service.get_all_staff()
            staff_dtos = UserDTO.from_user_list(staff_members)
            
            return jsonify({
                "success": True,
                "staff": [dto.to_dict() for dto in staff_dtos]
            })
            
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    def get_all_students(self):
        """Handle get all students request"""
        try:
            students = self.user_service.get_all_students()
            student_dtos = UserDTO.from_user_list(students)
            
            return jsonify({
                "success": True,
                "students": [dto.to_dict() for dto in student_dtos]
            })
            
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    def get_all_managers(self):
        """Handle get all managers request"""
        try:
            managers = self.user_service.get_all_managers()
            manager_dtos = UserDTO.from_user_list(managers)
            
            return jsonify({
                "success": True,
                "managers": [dto.to_dict() for dto in manager_dtos]
            })
            
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500 