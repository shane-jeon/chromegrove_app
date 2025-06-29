from models import db, SlidingScaleOption
from app import app

print("Seeding script started")

def seed_sliding_scale_options():
    print("Preparing sliding scale options...")
    options = [
        # Drop-in Tiers
        SlidingScaleOption(
            tier_name="Tier A",
            price_min=15,
            price_max=24,
            description="You regularly struggle to make ends meet comfortably and are often stressed about money. You may have little or no savings. You might be supporting relatives financially, managing student loans or medical debt, and/or working multiple jobs to support yourself.",
            category="drop-in"
        ),
        SlidingScaleOption(
            tier_name="Tier B",
            price_min=25,
            price_max=35,
            description="You can comfortably make ends meet most of the time. You may have a safety net or financial support from family. You have enough disposable income or wealth to pay for events or go out to eat at least a few times a month without it being stressful, but have to regularly be mindful to stay within your budget.",
            category="drop-in"
        ),
        SlidingScaleOption(
            tier_name="Tier C",
            price_min=36,
            price_max=60,
            description="You can comfortably take multiple vacations and save or invest money throughout the year. You can attend events, participate in hobbies, and go out to eat as often as you want without thinking about your bank statement. You might be a very high income earner or have inherited wealth.",
            category="drop-in"
        ),
        # Membership Tiers
        SlidingScaleOption(
            tier_name="Tier A",
            price_min=45,
            price_max=45,
            description="You regularly struggle to make ends meet comfortably and are often stressed about money. You may have little or no savings. You might be supporting relatives financially, managing student loans or medical debt, and/or working multiple jobs to support yourself.",
            category="membership",
            stripe_price_id="price_1Rekm5QMVtli2slTt74rujNH"
        ),
        SlidingScaleOption(
            tier_name="Tier B",
            price_min=100,
            price_max=100,
            description="Students.",
            category="membership",
            stripe_price_id="price_1Rekm5QMVtli2slTqQGciRg6"
        ),
        SlidingScaleOption(
            tier_name="Tier C",
            price_min=200,
            price_max=200,
            description="You can comfortably make ends meet most of the time. You may have a safety net or financial support from family. You have enough disposable income or wealth to pay for events or go out to eat at least a few times a month without it being stressful, but have to regularly be mindful to stay within your budget.",
            category="membership",
            stripe_price_id="price_1Rekm5QMVtli2slTu69bwbJ7"
        ),
        SlidingScaleOption(
            tier_name="Tier D",
            price_min=400,
            price_max=400,
            description="You can comfortably take multiple vacations and save or invest money throughout the year. You can attend events, participate in hobbies, and go out to eat as often as you want without thinking about your bank statement. You might be a very high income earner or have inherited wealth.",
            category="membership",
            stripe_price_id="price_1Rekm5QMVtli2slT5MeLlD1e"
        ),
    ]
    print(f"Prepared {len(options)} options. Adding to session...")
    db.session.bulk_save_objects(options)
    print("Objects added to session. Committing...")
    db.session.commit()
    print("Seeded SlidingScaleOption table with drop-in and membership tiers.")

if __name__ == "__main__":
    print("Entering app context...")
    with app.app_context():
        print("App context entered. Seeding now...")
        seed_sliding_scale_options()
    print("Seeding script finished.") 