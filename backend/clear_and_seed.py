from models import db, SlidingScaleOption
from app import app

def clear_and_seed_sliding_scale_options():
    with app.app_context():
        # Clear existing sliding scale options
        print("Clearing existing sliding scale options...")
        SlidingScaleOption.query.delete()
        db.session.commit()
        
        # Re-seed with clean data
        print("Re-seeding sliding scale options...")
        from seed_data import seed_sliding_scale_options
        seed_sliding_scale_options()
        
        # Verify the data
        drop_in_options = SlidingScaleOption.query.filter_by(category='drop-in').all()
        membership_options = SlidingScaleOption.query.filter_by(category='membership').all()
        
        print(f"✅ Seeded {len(drop_in_options)} drop-in options:")
        for option in drop_in_options:
            print(f"  - {option.tier_name}: ${option.price_min}-${option.price_max}")
        
        print(f"✅ Seeded {len(membership_options)} membership options:")
        for option in membership_options:
            print(f"  - {option.tier_name}: ${option.price_min}-${option.price_max}")

if __name__ == "__main__":
    clear_and_seed_sliding_scale_options() 