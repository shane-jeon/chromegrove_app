#!/usr/bin/env python3
"""
Test backend startup and basic functionality
"""
import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """Test if all imports work"""
    print("🔍 Testing imports...")
    
    try:
        from flask import Flask
        print("✅ Flask imported")
    except Exception as e:
        print(f"❌ Flask import failed: {e}")
        return False
    
    try:
        from models import db, User, StudioClass, SlidingScaleOption, Payment, ClassInstance, ClassEnrollment
        print("✅ Models imported")
    except Exception as e:
        print(f"❌ Models import failed: {e}")
        return False
    
    try:
        from services.user_service import UserService
        from services.class_service import ClassService
        from services.payment_service import PaymentService
        print("✅ Services imported")
    except Exception as e:
        print(f"❌ Services import failed: {e}")
        return False
    
    try:
        from controllers.user_controller import UserController
        from controllers.class_controller import ClassController
        from controllers.payment_controller import PaymentController
        print("✅ Controllers imported")
    except Exception as e:
        print(f"❌ Controllers import failed: {e}")
        return False
    
    return True

def test_database_connection(app):
    """Test database connection"""
    print("\n🔍 Testing database connection...")
    
    try:
        from models import db
        with app.app_context():
            # Test a simple query
            from models import SlidingScaleOption
            options = SlidingScaleOption.query.all()
            print(f"✅ Database connection successful, found {len(options)} sliding scale options")
            return True
            
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def test_service_instantiation(app):
    """Test if services can be instantiated"""
    print("\n🔍 Testing service instantiation...")
    
    try:
        from services.class_service import ClassService
        with app.app_context():
            service = ClassService()
            print("✅ ClassService instantiated")
            # Test a simple method
            instances = service.get_future_instances()
            print(f"✅ get_future_instances() returned {len(instances)} instances")
        return True
        
    except Exception as e:
        print(f"❌ Service instantiation failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_controller_instantiation(app):
    """Test if controllers can be instantiated"""
    print("\n🔍 Testing controller instantiation...")
    
    try:
        from controllers.class_controller import ClassController
        with app.app_context():
            controller = ClassController()
            print("✅ ClassController instantiated")
            # Test if the method exists
            if hasattr(controller, 'get_future_instances'):
                print("✅ get_future_instances method exists")
            else:
                print("❌ get_future_instances method missing")
                return False
        return True
        
    except Exception as e:
        print(f"❌ Controller instantiation failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🧪 Testing backend components...")
    
    if not test_imports():
        print("\n❌ Import tests failed")
        sys.exit(1)
    
    from flask import Flask
    from models import db
    app = Flask(__name__)
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance', 'db.sqlite3')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)

    if not test_database_connection(app):
        print("\n❌ Database connection failed")
        sys.exit(1)
    if not test_service_instantiation(app):
        print("\n❌ Service tests failed")
        sys.exit(1)
    if not test_controller_instantiation(app):
        print("\n❌ Controller tests failed")
        sys.exit(1)
    print("\n✅ All tests passed!") 