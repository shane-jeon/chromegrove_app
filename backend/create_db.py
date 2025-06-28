from app import app
from models import db, User, StudioClass, SlidingScaleOption, ClassInstance, ClassEnrollment, Announcement, BulletinBoard
from datetime import datetime, timedelta

def prepopulate_sliding_scale_options():
    if SlidingScaleOption.query.count() == 0:
        options = [
            SlidingScaleOption(
                tier_name='Drop-in (Student)',
                price_min=10,
                price_max=10,
                description='Drop-in rate for students.',
                category='drop-in'
            ),
            SlidingScaleOption(
                tier_name='Sliding Scale: Very Stressed',
                price_min=15,
                price_max=24,
                description='Very stressed about money, extremely limited disposable income.',
                category='drop-in'
            ),
            SlidingScaleOption(
                tier_name='Sliding Scale: Moderate',
                price_min=25,
                price_max=35,
                description='Has to budget and be mindful of spending, but has moderate disposable income.',
                category='drop-in'
            ),
            SlidingScaleOption(
                tier_name='Sliding Scale: Comfortable',
                price_min=36,
                price_max=60,
                description='Not as worried about money, has lots of disposable income/wealth.',
                category='drop-in'
            ),
        ]
        db.session.bulk_save_objects(options)
        db.session.commit()
        print("✅ Sliding scale options created!")

def create_sample_bulletin_boards():
    if BulletinBoard.query.count() == 0:
        boards = [
            BulletinBoard(board_type='student'),
            BulletinBoard(board_type='staff')
        ]
        db.session.bulk_save_objects(boards)
        db.session.commit()
        print("✅ Bulletin boards created!")

def create_sample_announcements():
    if Announcement.query.count() == 0:
        # Get the student bulletin board
        student_board = BulletinBoard.query.filter_by(board_type='student').first()
        if student_board:
            announcements = [
                Announcement(
                    title='Welcome to Our Studio!',
                    body='Welcome to our dance studio! We\'re excited to have you join our community. Check out our class schedule and don\'t hesitate to reach out if you have any questions.',
                    author_id=1,  # Assuming there's a management user with ID 1
                    board_id=student_board.id
                ),
                Announcement(
                    title='New Class Schedule Available',
                    body='Our updated class schedule for the upcoming month is now available. We\'ve added several new classes including advanced pole techniques and beginner-friendly sessions.',
                    author_id=1,
                    board_id=student_board.id
                )
            ]
            db.session.bulk_save_objects(announcements)
            db.session.commit()
            print("✅ Sample announcements created!")

def create_sample_studio_classes():
    if StudioClass.query.count() == 0:
        # Create some sample studio classes
        classes = [
            StudioClass(
                class_name='Intro to Pole',
                description='Perfect for beginners! Learn the fundamentals of pole dancing in a supportive environment.',
                start_time=datetime.now() + timedelta(days=1, hours=10),  # Tomorrow at 10 AM
                duration=60,
                instructor_id=1,  # Assuming there's an instructor with ID 1
                max_capacity=12,
                requirements='No experience required',
                recommended_attire='Comfortable athletic wear',
                recurrence_pattern='weekly'
            ),
            StudioClass(
                class_name='Advanced Pole Techniques',
                description='For experienced dancers looking to master advanced moves and combinations.',
                start_time=datetime.now() + timedelta(days=2, hours=14),  # Day after tomorrow at 2 PM
                duration=90,
                instructor_id=1,
                max_capacity=8,
                requirements='Intermediate pole experience required',
                recommended_attire='Pole shorts and sports bra',
                recurrence_pattern='weekly'
            ),
            StudioClass(
                class_name='Pole Fitness',
                description='A fitness-focused class combining pole work with strength training.',
                start_time=datetime.now() + timedelta(days=3, hours=18),  # 3 days from now at 6 PM
                duration=75,
                instructor_id=1,
                max_capacity=15,
                requirements='Basic fitness level',
                recommended_attire='Workout clothes',
                recurrence_pattern='bi-weekly'
            )
        ]
        db.session.bulk_save_objects(classes)
        db.session.commit()
        print("✅ Sample studio classes created!")
        
        # Create class instances for these classes
        for studio_class in classes:
            from app import create_class_instances
            create_class_instances(studio_class)
        print("✅ Class instances created!")

with app.app_context():
    db.create_all()
    prepopulate_sliding_scale_options()
    create_sample_bulletin_boards()
    create_sample_announcements()
    create_sample_studio_classes()
    print("🎉 Database and tables created with sample data!") 