from flask import request, jsonify
from services.attendance_service import AttendanceService

class AttendanceController:
    """Controller for attendance management"""
    
    def __init__(self):
        self.attendance_service = AttendanceService()
    
    def get_staff_assigned_classes(self):
        """Handle get staff assigned classes request"""
        try:
            staff_id = request.args.get('staff_id')
            clerk_user_id = request.args.get('clerk_user_id')
            
            if not staff_id and not clerk_user_id:
                return jsonify({"success": False, "error": "staff_id or clerk_user_id is required"}), 400
            
            # Find staff member
            from services.user_service import UserService
            user_service = UserService()
            
            staff_member = None
            if staff_id:
                staff_member = user_service.get_user_by_id(staff_id)
                if staff_member and staff_member.discriminator != 'staff':
                    staff_member = None
            elif clerk_user_id:
                staff_member = user_service.get_user_by_clerk_id(clerk_user_id)
                if staff_member and staff_member.discriminator != 'staff':
                    staff_member = None
            
            if not staff_member:
                return jsonify({"success": False, "error": "Staff member not found"}), 404
            
            # Get assigned classes
            classes = self.attendance_service.get_staff_assigned_classes(staff_member.id)
            
            return jsonify({
                "success": True,
                "classes": classes
            })
            
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    def get_staff_booked_classes(self):
        """Handle get staff booked classes request (classes they enrolled in as student)"""
        try:
            staff_id = request.args.get('staff_id')
            clerk_user_id = request.args.get('clerk_user_id')
            
            if not staff_id and not clerk_user_id:
                return jsonify({"success": False, "error": "staff_id or clerk_user_id is required"}), 400
            
            # Find staff member
            from services.user_service import UserService
            user_service = UserService()
            
            staff_member = None
            if staff_id:
                staff_member = user_service.get_user_by_id(staff_id)
                if staff_member and staff_member.discriminator != 'staff':
                    staff_member = None
            elif clerk_user_id:
                staff_member = user_service.get_user_by_clerk_id(clerk_user_id)
                if staff_member and staff_member.discriminator != 'staff':
                    staff_member = None
            
            if not staff_member:
                return jsonify({"success": False, "error": "Staff member not found"}), 404
            
            # Get booked classes
            classes = self.attendance_service.get_staff_booked_classes(staff_member.id)
            
            return jsonify({
                "success": True,
                "classes": classes
            })
            
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    def mark_attendance(self):
        """Handle mark attendance request"""
        try:
            data = request.get_json()
            if not data:
                return jsonify({"success": False, "error": "Missing JSON body"}), 400
            
            enrollment_id = data.get('enrollment_id')
            status = data.get('status')
            staff_id = data.get('staff_id')
            clerk_user_id = data.get('clerk_user_id')
            
            if not enrollment_id or not status:
                return jsonify({"success": False, "error": "enrollment_id and status are required"}), 400
            
            if status not in ['attended', 'missed']:
                return jsonify({"success": False, "error": "Status must be 'attended' or 'missed'"}), 400
            
            if not staff_id and not clerk_user_id:
                return jsonify({"success": False, "error": "staff_id or clerk_user_id is required"}), 400
            
            # Find staff member
            from services.user_service import UserService
            user_service = UserService()
            
            staff_member = None
            if staff_id:
                staff_member = user_service.get_user_by_id(staff_id)
                if staff_member and staff_member.discriminator != 'staff':
                    staff_member = None
            elif clerk_user_id:
                staff_member = user_service.get_user_by_clerk_id(clerk_user_id)
                if staff_member and staff_member.discriminator != 'staff':
                    staff_member = None
            
            if not staff_member:
                return jsonify({"success": False, "error": "Staff member not found"}), 404
            
            # Mark attendance
            self.attendance_service.mark_student_attendance(enrollment_id, status, staff_member.id)
            
            return jsonify({
                "success": True,
                "message": f"Attendance marked as {status}"
            })
            
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    def get_class_roster(self, instance_id):
        """Handle get class roster request"""
        try:
            staff_id = request.args.get('staff_id')
            clerk_user_id = request.args.get('clerk_user_id')
            
            if not staff_id and not clerk_user_id:
                return jsonify({"success": False, "error": "staff_id or clerk_user_id is required"}), 400
            
            # Find staff member
            from services.user_service import UserService
            user_service = UserService()
            
            staff_member = None
            if staff_id:
                staff_member = user_service.get_user_by_id(staff_id)
                if staff_member and staff_member.discriminator != 'staff':
                    staff_member = None
            elif clerk_user_id:
                staff_member = user_service.get_user_by_clerk_id(clerk_user_id)
                if staff_member and staff_member.discriminator != 'staff':
                    staff_member = None
            
            if not staff_member:
                return jsonify({"success": False, "error": "Staff member not found"}), 404
            
            # Get roster
            roster = self.attendance_service.get_class_roster(instance_id, staff_member.id)
            
            return jsonify({
                "success": True,
                "roster": roster
            })
            
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500 