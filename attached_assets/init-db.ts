import { db } from "./db";
import { movies, cinemas, halls, showtimes } from "@shared/schema";

async function initializeDatabase() {
  console.log("Initializing database with sample data...");

  try {
    // Check if data already exists
    const existingMovies = await db.select().from(movies);
    if (existingMovies.length > 0) {
      console.log("Database already contains data, skipping initialization.");
      return;
    }

    // Insert movies
    const movieData = [
      {
        title: "Квантовый разлом",
        genre: "Фантастика, Боевик",
        ageRating: "16+",
        description: "Захватывающий научно-фантастический триллер о команде ученых, которые открывают портал в параллельную вселенную.",
        duration: 142,
        rating: "8.2",
        posterUrl: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600"
      },
      {
        title: "Случайная встреча",
        genre: "Романтическая комедия",
        ageRating: "12+",
        description: "Легкая комедия о двух незнакомцах, которые встречаются в аэропорту во время задержки рейса.",
        duration: 98,
        rating: "7.8",
        posterUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600"
      },
      {
        title: "Тени прошлого",
        genre: "Триллер, Драма",
        ageRating: "18+",
        description: "Психологический триллер о детективе, расследующем серию загадочных убийств в небольшом городе.",
        duration: 125,
        rating: "8.5",
        posterUrl: "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600"
      },
      {
        title: "Волшебный лес",
        genre: "Семейный, Приключения",
        ageRating: "6+",
        description: "Семейное приключение о девочке, которая находит магический портал в заколдованный лес.",
        duration: 105,
        rating: "7.9",
        posterUrl: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600"
      }
    ];

    await db.insert(movies).values(movieData);
    console.log("Movies inserted successfully");

    // Insert cinemas
    const cinemaData = [
      { name: "КиноПарк Центр", location: "ул. Ленина, 45" },
      { name: "КиноМакс Плаза", location: "пр. Мира, 123" }
    ];

    await db.insert(cinemas).values(cinemaData);
    console.log("Cinemas inserted successfully");

    // Insert halls
    const hallData = [
      {
        cinemaId: 1,
        name: "Зал 1",
        isVip: false,
        seatLayout: {
          rows: ["A", "B", "C", "D"],
          seatsPerRow: 10,
          aisles: [4],
          occupiedSeats: []
        }
      },
      {
        cinemaId: 1,
        name: "Зал 2",
        isVip: false,
        seatLayout: {
          rows: ["A", "B", "C", "D"],
          seatsPerRow: 10,
          aisles: [4],
          occupiedSeats: []
        }
      },
      {
        cinemaId: 1,
        name: "Зал 3 VIP",
        isVip: true,
        seatLayout: {
          rows: ["A", "B", "C", "D", "E", "F"],
          seatsPerRow: 10,
          aisles: [4],
          vipRows: ["E", "F"],
          vipSeatsPerRow: 8,
          occupiedSeats: []
        }
      },
      {
        cinemaId: 2,
        name: "Зал 4",
        isVip: false,
        seatLayout: {
          rows: ["A", "B", "C", "D"],
          seatsPerRow: 10,
          aisles: [4],
          occupiedSeats: []
        }
      },
      {
        cinemaId: 2,
        name: "Зал 5",
        isVip: false,
        seatLayout: {
          rows: ["A", "B", "C", "D"],
          seatsPerRow: 10,
          aisles: [4],
          occupiedSeats: []
        }
      },
      {
        cinemaId: 2,
        name: "Зал 6 IMAX",
        isVip: false,
        seatLayout: {
          rows: ["A", "B", "C", "D"],
          seatsPerRow: 12,
          aisles: [4, 8],
          occupiedSeats: []
        }
      }
    ];

    await db.insert(halls).values(hallData);
    console.log("Halls inserted successfully");

    // Insert showtimes for today and next few days
    const today = new Date();
    const dates: string[] = [];
    for (let i = 0; i < 4; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }

    const times = ["10:00", "13:30", "16:15", "19:45", "22:30"];
    const movieIds = [1, 2, 3, 4];
    
    const showtimeData: any[] = [];
    
    movieIds.forEach(movieId => {
      dates.forEach(date => {
        times.forEach((time, timeIndex) => {
          const hallId = (timeIndex % 6) + 1;
          const isVipHall = hallId === 3;
          const basePrice = isVipHall ? 650 : hallId <= 2 ? 350 : hallId <= 4 ? 450 : 750;
          
          showtimeData.push({
            movieId,
            hallId,
            showDate: date,
            showTime: time,
            basePrice,
            vipPrice: isVipHall ? 650 : null
          });
        });
      });
    });

    await db.insert(showtimes).values(showtimeData);
    console.log("Showtimes inserted successfully");

    console.log("Database initialization completed successfully!");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}

// Initialize the database
initializeDatabase()
  .then(() => console.log("Database initialization script completed"))
  .catch((error) => {
    console.error("Database initialization failed:", error);
  });

export { initializeDatabase };