from backend.models import db, User
from sqlalchemy import or_
import re

# Example mapping: {db_id: 'clerk_user_id'}
clerk_id_map = {
    # 2: 'user_2z1phuUnZ4osgHVyFUJLmKASJOw',
    # Add more mappings as needed
}

def is_numeric(s):
    return s is not None and re.fullmatch(r'\d+', s)

def fix_clerk_ids():
    students = User.query.filter(
        User.role == 'student',
        or_(User.clerk_user_id == None, User.clerk_user_id == '', User.clerk_user_id.op('GLOB')('[0-9]*'))
    ).all()

    print(f"Found {len(students)} students with missing or numeric clerk_user_id:")
    for student in students:
        print(f"  id={student.id}, clerk_user_id={student.clerk_user_id}, email={student.email}, name={student.name}")
        # Use mapping if available, else fallback to 'user_' + id
        new_clerk_id = clerk_id_map.get(student.id, f'user_{student.id}')
        print(f"  -> Setting clerk_user_id to {new_clerk_id}")
        student.clerk_user_id = new_clerk_id

    db.session.commit()
    print("Done updating clerk_user_id for students.")

if __name__ == '__main__':
    from backend.app import app
    with app.app_context():
        fix_clerk_ids() 