#!/usr/bin/env python3
"""
Script to add membership options to the database
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models import db, SlidingScaleOption
from app import app

def add_membership_options():
    """Add membership options to the database"""
    with app.app_context():
        # Check if membership options already exist
        existing_memberships = SlidingScaleOption.query.filter_by(category='membership').all()
        if existing_memberships:
            print("Membership options already exist:")
            for option in existing_memberships:
                print(f"  - {option.tier_name}: ${option.price_min}-${option.price_max}")
            return
        
        # Create membership options
        membership_options = [
            {
                'tier_name': 'Monthly Membership',
                'price_min': 80.0,
                'price_max': 120.0,
                'description': 'Unlimited access to all classes for one month. Choose your own price within our sliding scale.',
                'category': 'membership',
                'is_active': True
            },
            {
                'tier_name': 'Annual Membership',
                'price_min': 800.0,
                'price_max': 1200.0,
                'description': 'Unlimited access to all classes for one year. Choose your own price within our sliding scale.',
                'category': 'membership',
                'is_active': True
            }
        ]
        
        for option_data in membership_options:
            option = SlidingScaleOption(**option_data)
            db.session.add(option)
            print(f"Added: {option.tier_name}")
        
        db.session.commit()
        print("Membership options added successfully!")

if __name__ == "__main__":
    add_membership_options() 