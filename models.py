from app import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import json

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship with bookings
    bookings = db.relationship('Booking', backref='user', lazy=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def __repr__(self):
        return f'<User {self.username}>'

class Movie(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    genre = db.Column(db.String(100))
    duration = db.Column(db.Integer)  # in minutes
    age_rating = db.Column(db.String(10))
    rating = db.Column(db.Float)
    poster_url = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship with showtimes
    showtimes = db.relationship('Showtime', backref='movie', lazy=True)
    
    def __repr__(self):
        return f'<Movie {self.title}>'

class Cinema(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    address = db.Column(db.String(500))
    city = db.Column(db.String(100))
    
    # Relationship with halls
    halls = db.relationship('Hall', backref='cinema', lazy=True)
    
    def __repr__(self):
        return f'<Cinema {self.name}>'

class Hall(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    cinema_id = db.Column(db.Integer, db.ForeignKey('cinema.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    total_seats = db.Column(db.Integer, nullable=False)
    seats_layout = db.Column(db.Text)  # JSON string for seat layout
    is_vip = db.Column(db.Boolean, default=False)
    
    # Relationship with showtimes
    showtimes = db.relationship('Showtime', backref='hall', lazy=True)
    
    def get_seats_layout(self):
        if self.seats_layout:
            return json.loads(self.seats_layout)
        return {}
    
    def set_seats_layout(self, layout):
        self.seats_layout = json.dumps(layout)
    
    def __repr__(self):
        return f'<Hall {self.name}>'

class Showtime(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    movie_id = db.Column(db.Integer, db.ForeignKey('movie.id'), nullable=False)
    hall_id = db.Column(db.Integer, db.ForeignKey('hall.id'), nullable=False)
    show_date = db.Column(db.Date, nullable=False)
    show_time = db.Column(db.Time, nullable=False)
    price = db.Column(db.Float, nullable=False)
    vip_price = db.Column(db.Float)
    
    # Relationship with bookings
    bookings = db.relationship('Booking', backref='showtime', lazy=True)
    
    def __repr__(self):
        return f'<Showtime {self.movie.title} at {self.show_time}>'

class Booking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    showtime_id = db.Column(db.Integer, db.ForeignKey('showtime.id'), nullable=False)
    seats = db.Column(db.Text, nullable=False)  # JSON string for selected seats
    total_price = db.Column(db.Float, nullable=False)
    booking_status = db.Column(db.String(20), default='confirmed')
    booking_number = db.Column(db.String(50), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def get_seats(self):
        return json.loads(self.seats)
    
    def set_seats(self, seats_list):
        self.seats = json.dumps(seats_list)
    
    def __repr__(self):
        return f'<Booking {self.booking_number}>'
