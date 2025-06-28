from flask import jsonify, request
from services.class_service import ClassService
from services.user_service import UserService
from dtos.class_dto import StudioClassDTO, ClassInstanceDTO
from dtos.user_dto import UserDTO
from typing import Dict, Any


class ClassController:
    """Controller for class-related HTTP requests"""
    
    @staticmethod
    def create_studio_class():
        """Handle studio class creation request"""
        try:
            data = request.get_json()
            if not data:
                return jsonify({"success": False, "error": "Missing JSON body"}), 400
            
            studio_class = ClassService.create_studio_class(data)
            class_dto = StudioClassDTO.from_studio_class(studio_class)
            
            return jsonify({
                "success": True,
                "studio_class": class_dto.to_dict()
            }), 201
            
        except ValueError as e:
            return jsonify({"success": False, "error": str(e)}), 400
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    @staticmethod
    def list_studio_classes():
        """Handle list studio classes request"""
        try:
            instances = ClassService.get_upcoming_classes()
            
            # Get studio classes for context
            studio_classes = {}
            for instance in instances:
                if instance.class_id not in studio_classes:
                    studio_class = ClassService.get_class_by_id(instance.class_id)
                    if studio_class:
                        studio_classes[instance.class_id] = studio_class
            
            # Create DTOs
            class_dtos = []
            for instance in instances:
                studio_class = studio_classes.get(instance.class_id)
                instance_dto = ClassInstanceDTO.from_instance(instance, studio_class)
                class_dtos.append(instance_dto.to_dict())
            
            return jsonify({
                "success": True,
                "classes": class_dtos
            })
            
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    @staticmethod
    def get_class_templates():
        """Handle get class templates request"""
        try:
            templates = ClassService.get_class_templates()
            template_dtos = StudioClassDTO.from_studio_class_list(templates)
            
            return jsonify({
                "success": True,
                "templates": [dto.to_dict() for dto in template_dtos]
            })
            
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    @staticmethod
    def book_class():
        """Handle class booking request"""
        try:
            data = request.get_json()
            if not data:
                return jsonify({"success": False, "error": "Missing JSON body"}), 400
            
            student_id = data.get('student_id')
            clerk_user_id = data.get('clerk_user_id')
            instance_id = data.get('instance_id')
            
            if not instance_id:
                return jsonify({"success": False, "error": "Missing instance_id"}), 400
            
            # Find student
            student = None
            if student_id:
                student = UserService.get_user_by_id(student_id)
                if student and student.discriminator != 'student':
                    student = None
            elif clerk_user_id:
                student = UserService.get_user_by_clerk_id(clerk_user_id)
                if student and student.discriminator != 'student':
                    student = None
            
            if not student:
                return jsonify({"success": False, "error": "Student not found"}), 404
            
            # Book the class
            ClassService.book_class(student.id, instance_id)
            
            return jsonify({
                "success": True,
                "message": "Class booked successfully"
            })
            
        except ValueError as e:
            return jsonify({"success": False, "error": str(e)}), 400
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    @staticmethod
    def get_student_enrolled_classes():
        """Handle get student enrolled classes request"""
        try:
            student_id = request.args.get('student_id')
            clerk_user_id = request.args.get('clerk_user_id')
            
            # Find student
            student = None
            if student_id:
                student = UserService.get_user_by_id(student_id)
                if student and student.discriminator != 'student':
                    student = None
            elif clerk_user_id:
                student = UserService.get_user_by_clerk_id(clerk_user_id)
                if student and student.discriminator != 'student':
                    student = None
            
            if not student:
                return jsonify({"success": False, "error": "Student not found"}), 404
            
            # Get enrollments
            enrollments = ClassService.get_student_enrollments(student.id)
            
            # Get instances and studio classes
            instances = []
            studio_classes = {}
            enrollment_map = {}
            
            for enrollment in enrollments:
                instance = ClassService.get_instance_by_id(enrollment.instance_id)
                if instance:
                    instances.append(instance)
                    enrollment_map[instance.instance_id] = enrollment
                    
                    if instance.class_id not in studio_classes:
                        studio_class = ClassService.get_class_by_id(instance.class_id)
                        if studio_class:
                            studio_classes[instance.class_id] = studio_class
            
            # Create DTOs
            class_dtos = []
            for instance in instances:
                studio_class = studio_classes.get(instance.class_id)
                enrollment = enrollment_map.get(instance.instance_id)
                instance_dto = ClassInstanceDTO.from_instance(
                    instance, 
                    studio_class, 
                    True, 
                    enrollment.id if enrollment else None
                )
                class_dtos.append(instance_dto.to_dict())
            
            return jsonify({
                "success": True,
                "classes": class_dtos
            })
            
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    @staticmethod
    def cancel_enrollment():
        """Handle enrollment cancellation request"""
        try:
            data = request.get_json()
            if not data:
                return jsonify({"success": False, "error": "Missing JSON body"}), 400
            
            student_id = data.get('student_id')
            clerk_user_id = data.get('clerk_user_id')
            instance_id = data.get('instance_id')
            
            if not instance_id:
                return jsonify({"success": False, "error": "Missing instance_id"}), 400
            
            # Find student
            student = None
            if student_id:
                student = UserService.get_user_by_id(student_id)
                if student and student.discriminator != 'student':
                    student = None
            elif clerk_user_id:
                student = UserService.get_user_by_clerk_id(clerk_user_id)
                if student and student.discriminator != 'student':
                    student = None
            
            if not student:
                return jsonify({"success": False, "error": "Student not found"}), 404
            
            # Cancel enrollment
            ClassService.cancel_enrollment(student.id, instance_id)
            
            return jsonify({
                "success": True,
                "message": "Enrollment cancelled successfully"
            })
            
        except ValueError as e:
            return jsonify({"success": False, "error": str(e)}), 400
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    @staticmethod
    def get_class_staff(class_id):
        """Handle get class staff request"""
        try:
            studio_class = ClassService.get_class_by_id(class_id)
            if not studio_class:
                return jsonify({"success": False, "error": "Class not found"}), 404
            
            staff_members = studio_class.get_assigned_staff_list()
            staff_dtos = UserDTO.from_user_list(staff_members)
            
            return jsonify({
                "success": True,
                "staff": [dto.to_dict() for dto in staff_dtos]
            })
            
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    @staticmethod
    def add_class_staff(class_id):
        """Handle add class staff request"""
        try:
            data = request.get_json()
            if not data:
                return jsonify({"success": False, "error": "Missing JSON body"}), 400
            
            staff_id = data.get('staff_id')
            if not staff_id:
                return jsonify({"success": False, "error": "staff_id is required"}), 400
            
            ClassService.add_staff_to_class(class_id, staff_id)
            
            return jsonify({
                "success": True,
                "message": "Staff member added successfully"
            })
            
        except ValueError as e:
            return jsonify({"success": False, "error": str(e)}), 400
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    @staticmethod
    def remove_class_staff(class_id, staff_id):
        """Handle remove class staff request"""
        try:
            ClassService.remove_staff_from_class(class_id, staff_id)
            
            return jsonify({
                "success": True,
                "message": "Staff member removed successfully"
            })
            
        except ValueError as e:
            return jsonify({"success": False, "error": str(e)}), 400
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    @staticmethod
    def change_class_instructor(class_id):
        """Handle change class instructor request"""
        try:
            data = request.get_json()
            if not data:
                return jsonify({"success": False, "error": "Missing JSON body"}), 400
            
            new_instructor_id = data.get('instructor_id')
            if not new_instructor_id:
                return jsonify({"success": False, "error": "instructor_id is required"}), 400
            
            ClassService.change_class_instructor(class_id, new_instructor_id)
            
            return jsonify({
                "success": True,
                "message": "Instructor changed successfully"
            })
            
        except ValueError as e:
            return jsonify({"success": False, "error": str(e)}), 400
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500 