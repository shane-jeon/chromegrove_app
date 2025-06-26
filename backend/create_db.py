from app import app
from models import db, User, StudioClass, SlidingScaleOption

def prepopulate_sliding_scale_options():
    if SlidingScaleOption.query.count() == 0:
        options = [
            SlidingScaleOption(
                tier_name='Drop-in (Student)',
                price_min=10,
                price_max=10,
                description='Drop-in rate for students.'
            ),
            SlidingScaleOption(
                tier_name='Sliding Scale: Very Stressed',
                price_min=15,
                price_max=24,
                description='Very stressed about money, extremely limited disposable income.'
            ),
            SlidingScaleOption(
                tier_name='Sliding Scale: Moderate',
                price_min=25,
                price_max=35,
                description='Has to budget and be mindful of spending, but has moderate disposable income.'
            ),
            SlidingScaleOption(
                tier_name='Sliding Scale: Comfortable',
                price_min=36,
                price_max=60,
                description='Not as worried about money, has lots of disposable income/wealth.'
            ),
        ]
        db.session.bulk_save_objects(options)
        db.session.commit()

with app.app_context():
    db.create_all()
    prepopulate_sliding_scale_options()
    print("Database and tables created!") 