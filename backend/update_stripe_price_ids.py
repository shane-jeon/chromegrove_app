from app import app
from models import db, SlidingScaleOption

def update_stripe_price_ids():
    price_ids = {
        # Drop-In Classes
        ("Tier A", "drop-in"): "price_1RekigQMVtli2slTXAOJdoBj",
        ("Tier B", "drop-in"): "price_1RekigQMVtli2slTA8Dc7tpz",
        ("Tier C", "drop-in"): "price_1RekigQMVtli2slTeMZj6VKW",
        ("Tier D", "drop-in"): "price_1RekigQMVtli2slTJX8R7Jzm",
        # Memberships
        ("Tier A", "membership"): "price_1Rekm5QMVtli2slTt74rujNH",
        ("Tier B", "membership"): "price_1Rekm5QMVtli2slTqQGciRg6",
        ("Tier C", "membership"): "price_1Rekm5QMVtli2slTu69bwbJ7",
        ("Tier D", "membership"): "price_1Rekm5QMVtli2slT5MeLlD1e",
    }

    for (tier_name, category), stripe_price_id in price_ids.items():
        option = SlidingScaleOption.query.filter_by(tier_name=tier_name, category=category).first()
        if option:
            option.stripe_price_id = stripe_price_id
            print(f"Updated {tier_name} ({category}) with Stripe price ID: {stripe_price_id}")
        else:
            print(f"WARNING: No SlidingScaleOption found for {tier_name} ({category})")

    db.session.commit()
    print("All Stripe price IDs updated.")

if __name__ == "__main__":
    with app.app_context():
        update_stripe_price_ids() 