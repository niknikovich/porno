from app import app, db
from models import User, Movie, Cinema, Hall, Showtime
from datetime import date, time, timedelta
import json

def init_database():
    """Initialize database with sample data"""
    with app.app_context():
        # Create all tables
        db.create_all()
        
        # Check if data already exists
        if Movie.query.first():
            print("Database already contains data. Skipping initialization.")
            return
        
        # Create sample cinemas
        cinema1 = Cinema(
            name="КиноПарк Центр",
            address="ул. Ленина, 45",
            city="Москва"
        )
        
        cinema2 = Cinema(
            name="КиноМакс Плаза",
            address="пр. Мира, 123",
            city="Москва"
        )
        
        db.session.add_all([cinema1, cinema2])
        db.session.commit()
        
        # Create sample halls
        # Hall 1 - Regular
        hall1_layout = {
            "rows": ["A", "B", "C", "D", "E"],
            "seats_per_row": 12,
            "aisles": [4, 8],  # Aisles after seats 4 and 8
            "total_seats": 60
        }
        
        hall1 = Hall(
            cinema_id=cinema1.id,
            name="Зал 1",
            total_seats=60,
            is_vip=False
        )
        hall1.set_seats_layout(hall1_layout)
        
        # Hall 2 - VIP
        hall2_layout = {
            "rows": ["A", "B", "C", "D"],
            "seats_per_row": 8,
            "aisles": [4],
            "total_seats": 32,
            "vip_rows": ["C", "D"]
        }
        
        hall2 = Hall(
            cinema_id=cinema1.id,
            name="Зал 2 VIP",
            total_seats=32,
            is_vip=True
        )
        hall2.set_seats_layout(hall2_layout)
        
        # Hall 3 - Regular
        hall3_layout = {
            "rows": ["A", "B", "C", "D", "E", "F"],
            "seats_per_row": 10,
            "aisles": [5],
            "total_seats": 60
        }
        
        hall3 = Hall(
            cinema_id=cinema2.id,
            name="Зал IMAX",
            total_seats=60,
            is_vip=False
        )
        hall3.set_seats_layout(hall3_layout)
        
        db.session.add_all([hall1, hall2, hall3])
        db.session.commit()
        
        # Create sample movies
        movies_data = [
            {
                "title": "Квантовый разлом",
                "description": "Захватывающий научно-фантастический триллер о команде ученых, которые открывают портал в параллельную вселенную. Когда эксперимент выходит из-под контроля, героям предстоит столкнуться с неожиданными последствиями.",
                "genre": "Фантастика, Боевик",
                "duration": 142,
                "age_rating": "16+",
                "rating": 8.2,
                "poster_url": "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600"
            },
            {
                "title": "Случайная встреча",
                "description": "Легкая романтическая комедия о двух незнакомцах, которые встречаются в аэропорту во время задержки рейса. Их случайное знакомство перерастает в удивительное приключение.",
                "genre": "Романтическая комедия",
                "duration": 98,
                "age_rating": "12+",
                "rating": 7.8,
                "poster_url": "https://images.unsplash.com/photo-1485846234645-a62644f84728?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600"
            },
            {
                "title": "Тени прошлого",
                "description": "Психологический триллер о детективе, расследующем серию загадочных убийств в небольшом городе. Каждая новая улика приближает его к шокирующей правде.",
                "genre": "Триллер, Драма",
                "duration": 125,
                "age_rating": "18+",
                "rating": 8.5,
                "poster_url": "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600"
            },
            {
                "title": "Волшебный лес",
                "description": "Семейное приключение о девочке, которая находит магический портал в заколдованный лес. Ей предстоит спасти волшебный мир от темных сил.",
                "genre": "Семейный, Приключения",
                "duration": 105,
                "age_rating": "6+",
                "rating": 7.9,
                "poster_url": "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600"
            }
        ]
        
        movies = []
        for movie_data in movies_data:
            movie = Movie(**movie_data)
            movies.append(movie)
        
        db.session.add_all(movies)
        db.session.commit()
        
        # Create sample showtimes for the next 7 days
        today = date.today()
        showtimes = []
        
        for days_ahead in range(7):
            show_date = today + timedelta(days=days_ahead)
            
            # Different time slots
            time_slots = [
                time(10, 0),   # 10:00
                time(13, 30),  # 13:30
                time(16, 15),  # 16:15
                time(19, 45),  # 19:45
                time(22, 30)   # 22:30
            ]
            
            for movie in movies:
                for i, show_time in enumerate(time_slots):
                    # Distribute across different halls
                    hall_id = (i % 3) + 1
                    
                    # Different pricing
                    if hall_id == 2:  # VIP hall
                        price = 500
                        vip_price = 800
                    else:
                        price = 350
                        vip_price = None
                    
                    showtime = Showtime(
                        movie_id=movie.id,
                        hall_id=hall_id,
                        show_date=show_date,
                        show_time=show_time,
                        price=price,
                        vip_price=vip_price
                    )
                    showtimes.append(showtime)
        
        db.session.add_all(showtimes)
        db.session.commit()
        
        print("Database initialized successfully!")
        print(f"Created {len(movies)} movies")
        print(f"Created {len(showtimes)} showtimes")

if __name__ == '__main__':
    init_database()
