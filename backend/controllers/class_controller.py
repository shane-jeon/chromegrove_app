from flask import jsonify, request
from services.class_service import ClassService
from services.user_service import UserService
from services.membership_service import MembershipService
from dtos.class_dto import StudioClassDTO, ClassInstanceDTO
from dtos.user_dto import UserDTO
from typing import Dict, Any


class ClassController:
    """Controller for class-related HTTP requests"""
    
    def __init__(self):
        self.class_service = ClassService()
        self.user_service = UserService()
        self.membership_service = MembershipService()
    
    def create_studio_class(self):
        """Handle studio class creation request"""
        try:
            data = request.get_json()
            if not data:
                return jsonify({"success": False, "error": "Missing JSON body"}), 400
            
            studio_class = self.class_service.create_studio_class(data)
            class_dto = StudioClassDTO.from_studio_class(studio_class)
            
            return jsonify({
                "success": True,
                "studio_class": class_dto.to_dict()
            }), 201
            
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    def list_studio_classes(self):
        """Handle list studio classes request"""
        try:
            instances = self.class_service.get_upcoming_classes()
            
            # Get studio classes for context
            studio_classes = {}
            for instance in instances:
                if instance.class_id not in studio_classes:
                    studio_class = self.class_service.get_class_by_id(instance.class_id)
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
    
    def get_class_templates(self):
        """Handle get class templates request"""
        try:
            templates = self.class_service.get_class_templates()
            template_dtos = StudioClassDTO.from_studio_class_list(templates)
            
            return jsonify({
                "success": True,
                "templates": [dto.to_dict() for dto in template_dtos]
            })
            
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    def book_class(self):
        """Book a class for a student"""
        try:
            data = request.get_json()
            print("[book_class] Incoming booking request:", data)
            if not data:
                print("[book_class] ❌ Missing JSON body")
                return jsonify({"success": False, "error": "Missing JSON body"}), 400
            
            student_id = data.get('student_id')
            clerk_user_id = data.get('clerk_user_id')
            instance_id = data.get('instance_id')
            payment_id = data.get('payment_id')
            payment_type = data.get('payment_type', 'drop-in')  # 'drop-in', 'membership', 'staff'
            print(f"[book_class] clerk_user_id from request: {clerk_user_id}")
            print(f"[book_class] student_id from request: {student_id}")
            print(f"[book_class] instance_id from request: {instance_id}")
            print(f"[book_class] payment_type from request: {payment_type}")
            
            if not instance_id:
                print("[book_class] ❌ Missing instance_id")
                return jsonify({"success": False, "error": "Missing instance_id"}), 400
            
            # Get student
            student = None
            if student_id:
                print(f"[book_class] Looking up student by student_id: {student_id}")
                student = self.user_service.get_user_by_id(student_id)
                print(f"[book_class] Student lookup result by id: {student}")
                if student and student.discriminator != 'student':
                    print(f"[book_class] ❌ User with id {student_id} is not a student")
                    student = None
            elif clerk_user_id:
                print(f"[book_class] Looking up student by clerk_user_id: {clerk_user_id}")
                student = self.user_service.get_user_by_clerk_id(clerk_user_id)
                print(f"[book_class] Student lookup result by clerk_user_id: {student}")
                if student and student.discriminator != 'student':
                    print(f"[book_class] ❌ User with clerk_user_id {clerk_user_id} is not a student")
                    student = None
            
            if not student:
                print(f"[book_class] ❌ Student not found for clerk_user_id: {clerk_user_id} or student_id: {student_id}")
                return jsonify({"success": False, "error": "Student not found"}), 404
            print(f"[book_class] ✅ Found student: id={student.id}, clerk_user_id={student.clerk_user_id}, membership_id={student.membership_id}, type={getattr(student, 'discriminator', None)}")
            
            # If payment_type is 'membership', check membership status
            if payment_type == 'membership':
                membership_status = self.membership_service.get_membership_status(student.clerk_user_id)
                print(f"[book_class] Membership status: {membership_status}")
                if not membership_status.get('has_membership', False) or not membership_status.get('is_active', False):
                    print("[book_class] ❌ Membership expired or inactive. Requires drop-in payment.")
                    return jsonify({
                        "success": False,
                        "error": "Membership expired or inactive. Please use drop-in payment.",
                        "requires_payment": True
                    }), 400
            # Always allow drop-in bookings
            print(f"[book_class] Proceeding to book class for student_id={student.id}, instance_id={instance_id}, payment_type={payment_type}")
            try:
                success = self.class_service.book_class(
                    student.id, 
                    instance_id, 
                    payment_id,
                    payment_type
                )
                print(f"[book_class] Booking result: {success}")
            except Exception as e:
                print(f"[book_class] ❌ Exception during booking: {e}")
                import traceback
                print(traceback.format_exc())
                return jsonify({"success": False, "error": str(e)}), 500
            
            if success:
                print(f"[book_class] ✅ Class booked successfully for student_id={student.id}, instance_id={instance_id}")
                return jsonify({
                    "success": True,
                    "message": "Class booked successfully"
                })
            else:
                print(f"[book_class] ❌ Failed to book class for student_id={student.id}, instance_id={instance_id}")
                return jsonify({"success": False, "error": "Failed to book class"}), 400
                
        except Exception as e:
            print(f"[book_class] ❌ Exception: {e}")
            import traceback
            print(traceback.format_exc())
            return jsonify({"success": False, "error": str(e)}), 500
    
    def book_class_for_staff(self):
        """Handle staff class booking request (no payment required)"""
        try:
            data = request.get_json()
            if not data:
                return jsonify({"success": False, "error": "Missing JSON body"}), 400
            
            staff_id = data.get('staff_id')
            clerk_user_id = data.get('clerk_user_id')
            instance_id = data.get('instance_id')
            
            if not instance_id:
                return jsonify({"success": False, "error": "Missing instance_id"}), 400
            
            # Find staff member
            staff_member = None
            if staff_id:
                staff_member = self.user_service.get_user_by_id(staff_id)
                if staff_member and staff_member.discriminator != 'staff':
                    staff_member = None
            elif clerk_user_id:
                staff_member = self.user_service.get_user_by_clerk_id(clerk_user_id)
                if staff_member and staff_member.discriminator != 'staff':
                    staff_member = None
            
            if not staff_member:
                return jsonify({"success": False, "error": "Staff member not found"}), 404
            
            # Get class instance to check if it exists
            class_instance = self.class_service.get_instance_by_id(instance_id)
            if not class_instance:
                return jsonify({"success": False, "error": "Class instance not found"}), 404
            
            # Book the class for staff (no payment required)
            self.class_service.book_class_for_staff(staff_member.id, instance_id)
            
            return jsonify({
                "success": True,
                "message": "Class booked successfully for staff member",
                "staff_member": {
                    "id": staff_member.id,
                    "name": staff_member.name,
                    "email": staff_member.email
                }
            })
            
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    def get_student_enrolled_classes(self):
        """Handle get student enrolled classes request"""
        try:
            student_id = request.args.get('student_id')
            clerk_user_id = request.args.get('clerk_user_id')
            print(f"[get_student_enrolled_classes] clerk_user_id: {clerk_user_id}, student_id: {student_id}")
            
            # Find student
            student = None
            if student_id:
                student = self.user_service.get_user_by_id(student_id)
                if student and student.discriminator != 'student':
                    print(f"[get_student_enrolled_classes] ❌ User with id {student_id} is not a student")
                    student = None
            elif clerk_user_id:
                student = self.user_service.get_user_by_clerk_id(clerk_user_id)
                if student and student.discriminator != 'student':
                    print(f"[get_student_enrolled_classes] ❌ User with clerk_user_id {clerk_user_id} is not a student")
                    student = None
            
            if not student:
                print(f"[get_student_enrolled_classes] ❌ Student not found for clerk_user_id: {clerk_user_id} or student_id: {student_id}")
                return jsonify({"success": False, "error": "Student not found"}), 404
            print(f"[get_student_enrolled_classes] ✅ Found student: id={student.id}, clerk_user_id={student.clerk_user_id}, membership_id={student.membership_id}")
            
            # Get enrollments
            enrollments = self.class_service.get_student_enrollments(student.id)
            print(f"[get_student_enrolled_classes] Found {len(enrollments)} enrollments for student_id={student.id}")
            for e in enrollments:
                print(f"  Enrollment: id={e.id}, instance_id={e.instance_id}, payment_type={e.payment_type}, status={e.status}")
            
            # Get instances and studio classes
            instances = []
            studio_classes = {}
            enrollment_map = {}
            
            for enrollment in enrollments:
                instance = self.class_service.get_instance_by_id(enrollment.instance_id)
                if instance:
                    instances.append(instance)
                    enrollment_map[instance.instance_id] = enrollment
                    
                    if instance.class_id not in studio_classes:
                        studio_class = self.class_service.get_class_by_id(instance.class_id)
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
            print(f"[get_student_enrolled_classes] Returning {len(class_dtos)} class DTOs for student_id={student.id}")
            return jsonify({
                "success": True,
                "classes": class_dtos
            })
            
        except Exception as e:
            print(f"[get_student_enrolled_classes] ❌ Exception: {e}")
            return jsonify({"success": False, "error": str(e)}), 500
    
    def cancel_enrollment(self):
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
                student = self.user_service.get_user_by_id(student_id)
                if student and student.discriminator != 'student':
                    student = None
            elif clerk_user_id:
                student = self.user_service.get_user_by_clerk_id(clerk_user_id)
                if student and student.discriminator != 'student':
                    student = None
            
            if not student:
                return jsonify({"success": False, "error": "Student not found"}), 404
            
            # Cancel enrollment
            self.class_service.cancel_enrollment(student.id, instance_id)
            
            return jsonify({
                "success": True,
                "message": "Enrollment cancelled successfully"
            })
            
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    def get_class_staff(self, class_id):
        """Handle get class staff request"""
        try:
            studio_class = self.class_service.get_class_by_id(class_id)
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
    
    def add_class_staff(self, class_id):
        """Handle add class staff request"""
        try:
            data = request.get_json()
            if not data:
                return jsonify({"success": False, "error": "Missing JSON body"}), 400
            
            staff_id = data.get('staff_id')
            if not staff_id:
                return jsonify({"success": False, "error": "staff_id is required"}), 400
            
            self.class_service.add_staff_to_class(class_id, staff_id)
            
            return jsonify({
                "success": True,
                "message": "Staff member added successfully"
            })
            
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    def remove_class_staff(self, class_id, staff_id):
        """Handle remove class staff request"""
        try:
            self.class_service.remove_staff_from_class(class_id, staff_id)
            
            return jsonify({
                "success": True,
                "message": "Staff member removed successfully"
            })
            
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    def change_class_instructor(self, class_id):
        """Handle change class instructor request"""
        try:
            data = request.get_json()
            if not data:
                return jsonify({"success": False, "error": "Missing JSON body"}), 400
            
            new_instructor_id = data.get('instructor_id')
            if not new_instructor_id:
                return jsonify({"success": False, "error": "instructor_id is required"}), 400
            
            self.class_service.change_class_instructor(class_id, new_instructor_id)
            
            return jsonify({
                "success": True,
                "message": "Instructor changed successfully"
            })
            
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    def get_future_instances(self):
        """Handle get future instances request"""
        try:
            instances = self.class_service.get_future_instances()
            
            # Get studio classes for context
            studio_classes = {}
            for instance in instances:
                if instance.class_id not in studio_classes:
                    studio_class = self.class_service.get_class_by_id(instance.class_id)
                    if studio_class:
                        studio_classes[instance.class_id] = studio_class
            
            # Create DTOs with studio class data
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
    
    def get_all_classes(self):
        """Handle get all classes request"""
        try:
            classes = self.class_service.get_all_classes()
            class_dtos = StudioClassDTO.from_studio_class_list(classes)
            
            return jsonify({
                "success": True,
                "classes": [dto.to_dict() for dto in class_dtos]
            })
            
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    def get_class_by_id(self, class_id: int):
        """Handle get class by ID request"""
        try:
            studio_class = self.class_service.get_class_by_id(class_id)
            if not studio_class:
                return jsonify({"success": False, "error": "Class not found"}), 404
            
            class_dto = StudioClassDTO.from_studio_class(studio_class)
            return jsonify({"success": True, "class": class_dto.to_dict()})
            
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    def get_instance_by_id(self, instance_id: str):
        """Handle get instance by ID request"""
        try:
            instance = self.class_service.get_instance_by_id(instance_id)
            if not instance:
                return jsonify({"success": False, "error": "Instance not found"}), 404
            
            instance_dto = ClassInstanceDTO.from_instance(instance)
            return jsonify({"success": True, "instance": instance_dto.to_dict()})
            
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    def get_available_instances(self):
        """Handle get available instances request"""
        try:
            instances = self.class_service.get_available_instances()
            instance_dtos = ClassInstanceDTO.from_instance_list(instances)
            
            return jsonify({
                "success": True,
                "classes": [dto.to_dict() for dto in instance_dtos]
            })
            
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    def check_booking_eligibility(self):
        """Check if student can book a class for free based on membership expiration"""
        try:
            data = request.get_json()
            if not data:
                return jsonify({"success": False, "error": "Missing JSON body"}), 400
            
            clerk_user_id = data.get('clerk_user_id')
            instance_id = data.get('instance_id')
            
            if not clerk_user_id or not instance_id:
                return jsonify({"success": False, "error": "Missing clerk_user_id or instance_id"}), 400
            
            # Find student
            student = self.user_service.get_user_by_clerk_id(clerk_user_id)
            if not student or student.discriminator != 'student':
                return jsonify({"success": False, "error": "Student not found"}), 404
            
            # Get class instance to check start time
            class_instance = self.class_service.get_instance_by_id(instance_id)
            if not class_instance:
                return jsonify({"success": False, "error": "Class instance not found"}), 404
            
            # Check booking eligibility
            booking_eligibility = self.membership_service.can_book_class_for_free(
                clerk_user_id, 
                class_instance.start_time
            )
            
            return jsonify({
                "success": True,
                "booking_eligibility": booking_eligibility,
                "class_info": {
                    "instance_id": instance_id,
                    "class_name": class_instance.studio_class.class_name if class_instance.studio_class else "Unknown",
                    "start_time": class_instance.start_time.isoformat()
                }
            })
            
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    def cancel_staff_booking(self):
        """Handle staff booking cancellation request"""
        try:
            data = request.get_json()
            if not data:
                return jsonify({"success": False, "error": "Missing JSON body"}), 400
            
            staff_id = data.get('staff_id')
            clerk_user_id = data.get('clerk_user_id')
            instance_id = data.get('instance_id')
            
            if not instance_id:
                return jsonify({"success": False, "error": "Missing instance_id"}), 400
            
            # Find staff member
            staff = None
            if staff_id:
                staff = self.user_service.get_user_by_id(staff_id)
                if staff and staff.discriminator != 'staff':
                    staff = None
            elif clerk_user_id:
                staff = self.user_service.get_user_by_clerk_id(clerk_user_id)
                if staff and staff.discriminator != 'staff':
                    staff = None
            
            if not staff:
                return jsonify({"success": False, "error": "Staff member not found"}), 404
            
            # Cancel enrollment
            self.class_service.cancel_enrollment(staff.id, instance_id)
            
            return jsonify({
                "success": True,
                "message": "Booking cancelled successfully"
            })
            
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    def cancel_class(self):
        """Handle class cancellation request for management users"""
        try:
            data = request.get_json()
            if not data:
                return jsonify({"success": False, "error": "Missing JSON body"}), 400
            
            instance_id = data.get('instance_id')
            scope = data.get('scope', 'single')  # 'single' or 'future'
            
            if not instance_id:
                return jsonify({"success": False, "error": "Missing instance_id"}), 400
            
            if scope not in ['single', 'future']:
                return jsonify({"success": False, "error": "Invalid scope. Must be 'single' or 'future'"}), 400
            
            # Cancel the class(es) and add credits for eligible students
            if scope == 'single':
                self.class_service.cancel_single_instance(instance_id)
            else:
                self.class_service.cancel_future_instances(instance_id)
            
            return jsonify({
                "success": True,
                "message": f"Class{'es' if scope == 'future' else ''} cancelled successfully"
            })
            
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500 