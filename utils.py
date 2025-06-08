from functools import wraps
from flask import session, flash, redirect, url_for
import random
import string
from datetime import datetime

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Пожалуйста, войдите в систему', 'warning')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def generate_booking_number():
    """Generate a unique booking number"""
    now = datetime.now()
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"KB{now.strftime('%Y%m%d')}{random_part}"

def format_time(time_obj):
    """Format time object to string"""
    return time_obj.strftime('%H:%M')

def format_date(date_obj):
    """Format date object to Russian string"""
    months = {
        1: 'января', 2: 'февраля', 3: 'марта', 4: 'апреля',
        5: 'мая', 6: 'июня', 7: 'июля', 8: 'августа',
        9: 'сентября', 10: 'октября', 11: 'ноября', 12: 'декабря'
    }
    day = date_obj.day
    month = months[date_obj.month]
    return f"{day} {month}"

# Make utility functions available in templates
from app import app

@app.template_filter('format_time')
def format_time_filter(time_obj):
    return format_time(time_obj)

@app.template_filter('format_date')
def format_date_filter(date_obj):
    return format_date(date_obj)
