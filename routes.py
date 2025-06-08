from flask import render_template, request, redirect, url_for, flash, session
from app import app, db
from models import User, Movie, Cinema, Hall, Showtime, Booking
from utils import login_required, generate_booking_number
from datetime import datetime, date, timedelta
import json

@app.route('/')
def index():
    movies = Movie.query.all()
    return render_template('index.html', movies=movies)

@app.route('/movie/<int:movie_id>')
def movie_detail(movie_id):
    movie = Movie.query.get_or_404(movie_id)
    
    # Get showtimes for the next 7 days
    today = date.today()
    end_date = today + timedelta(days=7)
    
    showtimes = Showtime.query.filter(
        Showtime.movie_id == movie_id,
        Showtime.show_date >= today,
        Showtime.show_date <= end_date
    ).order_by(Showtime.show_date, Showtime.show_time).all()
    
    # Group showtimes by date
    showtimes_by_date = {}
    for showtime in showtimes:
        show_date = showtime.show_date
        if show_date not in showtimes_by_date:
            showtimes_by_date[show_date] = []
        showtimes_by_date[show_date].append(showtime)
    
    return render_template('movie_detail.html', movie=movie, showtimes_by_date=showtimes_by_date)

@app.route('/showtime/<int:showtime_id>')
def showtime_detail(showtime_id):
    if 'user_id' not in session:
        flash('Пожалуйста, войдите в систему для бронирования билетов', 'warning')
        return redirect(url_for('login'))
    
    showtime = Showtime.query.get_or_404(showtime_id)
    hall = showtime.hall
    
    # Get booked seats for this showtime
    bookings = Booking.query.filter_by(showtime_id=showtime_id, booking_status='confirmed').all()
    booked_seats = []
    for booking in bookings:
        booked_seats.extend(booking.get_seats())
    
    seats_layout = hall.get_seats_layout()
    
    return render_template('showtime_detail.html', 
                         showtime=showtime, 
                         hall=hall, 
                         seats_layout=seats_layout,
                         booked_seats=booked_seats)

@app.route('/booking/confirm', methods=['POST'])
@login_required
def booking_confirm():
    showtime_id = request.form.get('showtime_id')
    selected_seats = request.form.getlist('seats')
    
    if not selected_seats:
        flash('Пожалуйста, выберите места', 'error')
        return redirect(url_for('showtime_detail', showtime_id=showtime_id))
    
    showtime = Showtime.query.get_or_404(showtime_id)
    
    # Check if seats are still available
    bookings = Booking.query.filter_by(showtime_id=showtime_id, booking_status='confirmed').all()
    booked_seats = []
    for booking in bookings:
        booked_seats.extend(booking.get_seats())
    
    if any(seat in booked_seats for seat in selected_seats):
        flash('Некоторые из выбранных мест уже заняты', 'error')
        return redirect(url_for('showtime_detail', showtime_id=showtime_id))
    
    # Calculate total price
    hall = showtime.hall
    total_price = 0
    for seat in selected_seats:
        if hall.is_vip and showtime.vip_price:
            total_price += showtime.vip_price
        else:
            total_price += showtime.price
    
    return render_template('booking_confirm.html', 
                         showtime=showtime, 
                         selected_seats=selected_seats,
                         total_price=total_price)

@app.route('/booking/create', methods=['POST'])
@login_required
def create_booking():
    showtime_id = request.form.get('showtime_id')
    selected_seats = request.form.getlist('seats')
    
    if not selected_seats:
        flash('Пожалуйста, выберите места', 'error')
        return redirect(url_for('showtime_detail', showtime_id=showtime_id))
    
    showtime = Showtime.query.get_or_404(showtime_id)
    
    # Double-check seat availability
    bookings = Booking.query.filter_by(showtime_id=showtime_id, booking_status='confirmed').all()
    booked_seats = []
    for booking in bookings:
        booked_seats.extend(booking.get_seats())
    
    if any(seat in booked_seats for seat in selected_seats):
        flash('Некоторые из выбранных мест уже заняты', 'error')
        return redirect(url_for('showtime_detail', showtime_id=showtime_id))
    
    # Calculate total price
    hall = showtime.hall
    total_price = 0
    for seat in selected_seats:
        if hall.is_vip and showtime.vip_price:
            total_price += showtime.vip_price
        else:
            total_price += showtime.price
    
    # Create booking
    booking = Booking(
        user_id=session['user_id'],
        showtime_id=showtime_id,
        total_price=total_price,
        booking_number=generate_booking_number()
    )
    booking.set_seats(selected_seats)
    
    db.session.add(booking)
    db.session.commit()
    
    return redirect(url_for('booking_success', booking_id=booking.id))

@app.route('/booking/success/<int:booking_id>')
@login_required
def booking_success(booking_id):
    booking = Booking.query.filter_by(id=booking_id, user_id=session['user_id']).first_or_404()
    return render_template('booking_success.html', booking=booking)

@app.route('/my-bookings')
@login_required
def user_bookings():
    bookings = Booking.query.filter_by(user_id=session['user_id']).order_by(Booking.created_at.desc()).all()
    return render_template('user_bookings.html', bookings=bookings)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            session['user_id'] = user.id
            session['username'] = user.username
            flash('Добро пожаловать!', 'success')
            return redirect(url_for('index'))
        else:
            flash('Неверное имя пользователя или пароль', 'error')
    
    return render_template('auth/login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        first_name = request.form['first_name']
        last_name = request.form['last_name']
        phone = request.form['phone']
        
        # Check if user already exists
        if User.query.filter_by(username=username).first():
            flash('Пользователь с таким именем уже существует', 'error')
            return render_template('auth/register.html')
        
        if User.query.filter_by(email=email).first():
            flash('Пользователь с таким email уже существует', 'error')
            return render_template('auth/register.html')
        
        # Create new user
        user = User(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            phone=phone
        )
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        flash('Регистрация прошла успешно! Теперь вы можете войти в систему.', 'success')
        return redirect(url_for('login'))
    
    return render_template('auth/register.html')

@app.route('/logout')
def logout():
    session.clear()
    flash('Вы вышли из системы', 'info')
    return redirect(url_for('index'))
