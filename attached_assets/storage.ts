import { 
  movies, 
  cinemas, 
  halls, 
  showtimes, 
  bookings,
  users,
  type Movie, 
  type InsertMovie,
  type Cinema,
  type InsertCinema,
  type Hall,
  type InsertHall,
  type Showtime,
  type InsertShowtime,
  type Booking,
  type InsertBooking,
  type User,
  type UpsertUser
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Movies
  getMovies(): Promise<Movie[]>;
  getMovie(id: number): Promise<Movie | undefined>;
  createMovie(movie: InsertMovie): Promise<Movie>;

  // Cinemas
  getCinemas(): Promise<Cinema[]>;
  getCinema(id: number): Promise<Cinema | undefined>;
  createCinema(cinema: InsertCinema): Promise<Cinema>;

  // Halls
  getHalls(): Promise<Hall[]>;
  getHallsByCinema(cinemaId: number): Promise<Hall[]>;
  getHall(id: number): Promise<Hall | undefined>;
  createHall(hall: InsertHall): Promise<Hall>;

  // Showtimes
  getShowtimes(): Promise<Showtime[]>;
  getShowtimesByMovie(movieId: number): Promise<Showtime[]>;
  getShowtime(id: number): Promise<Showtime | undefined>;
  createShowtime(showtime: InsertShowtime): Promise<Showtime>;

  // Bookings
  getBookings(): Promise<Booking[]>;
  getBookingsByShowtime(showtimeId: number): Promise<Booking[]>;
  getBooking(id: number): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBookedSeats(showtimeId: number): Promise<string[]>;
}

export class MemStorage implements IStorage {
  private movies: Map<number, Movie>;
  private cinemas: Map<number, Cinema>;
  private halls: Map<number, Hall>;
  private showtimes: Map<number, Showtime>;
  private bookings: Map<number, Booking>;
  private currentMovieId: number;
  private currentCinemaId: number;
  private currentHallId: number;
  private currentShowtimeId: number;
  private currentBookingId: number;

  constructor() {
    this.movies = new Map();
    this.cinemas = new Map();
    this.halls = new Map();
    this.showtimes = new Map();
    this.bookings = new Map();
    this.currentMovieId = 1;
    this.currentCinemaId = 1;
    this.currentHallId = 1;
    this.currentShowtimeId = 1;
    this.currentBookingId = 1;

    this.initializeData();
  }

  private initializeData() {
    // Initialize movies
    const moviesData = [
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

    moviesData.forEach(movie => {
      this.createMovie(movie);
    });

    // Initialize cinemas
    const cinemasData = [
      { name: "КиноПарк Центр", location: "ул. Ленина, 45" },
      { name: "КиноМакс Плаза", location: "пр. Мира, 123" }
    ];

    cinemasData.forEach(cinema => {
      this.createCinema(cinema);
    });

    // Initialize halls
    const hallsData = [
      {
        cinemaId: 1,
        name: "Зал 1",
        isVip: false,
        seatLayout: {
          rows: ["A", "B", "C", "D"],
          seatsPerRow: 10,
          aisles: [4], // Aisle after seat 4
          occupiedSeats: ["A3", "A4", "B7", "B8", "C10"]
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
          occupiedSeats: ["A3", "A4", "B7", "B8", "C10", "E5", "E6"]
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

    hallsData.forEach(hall => {
      this.createHall(hall);
    });

    // Initialize showtimes for today and next few days
    const today = new Date();
    const dates: string[] = [];
    for (let i = 0; i < 4; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }

    const times = ["10:00", "13:30", "16:15", "19:45", "22:30"];
    const movieIds = [1, 2, 3, 4];
    
    movieIds.forEach(movieId => {
      dates.forEach(date => {
        times.forEach((time, timeIndex) => {
          const hallId = (timeIndex % 6) + 1; // Distribute across halls
          const hall = this.halls.get(hallId);
          const basePrice = hall?.isVip ? 650 : hallId <= 2 ? 350 : hallId <= 4 ? 450 : 750;
          
          this.createShowtime({
            movieId,
            hallId,
            showDate: date,
            showTime: time,
            basePrice,
            vipPrice: hall?.isVip ? 650 : null
          });
        });
      });
    });
  }

  async getMovies(): Promise<Movie[]> {
    return Array.from(this.movies.values());
  }

  async getMovie(id: number): Promise<Movie | undefined> {
    return this.movies.get(id);
  }

  async createMovie(insertMovie: InsertMovie): Promise<Movie> {
    const id = this.currentMovieId++;
    const movie: Movie = { ...insertMovie, id };
    this.movies.set(id, movie);
    return movie;
  }

  async getCinemas(): Promise<Cinema[]> {
    return Array.from(this.cinemas.values());
  }

  async getCinema(id: number): Promise<Cinema | undefined> {
    return this.cinemas.get(id);
  }

  async createCinema(insertCinema: InsertCinema): Promise<Cinema> {
    const id = this.currentCinemaId++;
    const cinema: Cinema = { ...insertCinema, id };
    this.cinemas.set(id, cinema);
    return cinema;
  }

  async getHalls(): Promise<Hall[]> {
    return Array.from(this.halls.values());
  }

  async getHallsByCinema(cinemaId: number): Promise<Hall[]> {
    return Array.from(this.halls.values()).filter(hall => hall.cinemaId === cinemaId);
  }

  async getHall(id: number): Promise<Hall | undefined> {
    return this.halls.get(id);
  }

  async createHall(insertHall: InsertHall): Promise<Hall> {
    const id = this.currentHallId++;
    const hall: Hall = { 
      ...insertHall, 
      id,
      isVip: insertHall.isVip ?? false
    };
    this.halls.set(id, hall);
    return hall;
  }

  async getShowtimes(): Promise<Showtime[]> {
    return Array.from(this.showtimes.values());
  }

  async getShowtimesByMovie(movieId: number): Promise<Showtime[]> {
    return Array.from(this.showtimes.values()).filter(showtime => showtime.movieId === movieId);
  }

  async getShowtime(id: number): Promise<Showtime | undefined> {
    return this.showtimes.get(id);
  }

  async createShowtime(insertShowtime: InsertShowtime): Promise<Showtime> {
    const id = this.currentShowtimeId++;
    const showtime: Showtime = { 
      ...insertShowtime, 
      id,
      vipPrice: insertShowtime.vipPrice ?? null
    };
    this.showtimes.set(id, showtime);
    return showtime;
  }

  async getBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values());
  }

  async getBookingsByShowtime(showtimeId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(booking => booking.showtimeId === showtimeId);
  }

  async getBooking(id: number): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = this.currentBookingId++;
    const bookingNumber = `KB${new Date().getFullYear()}-${String(id).padStart(6, '0')}`;
    const booking: Booking = { 
      ...insertBooking, 
      id, 
      bookingNumber,
      status: insertBooking.status ?? "confirmed",
      createdAt: new Date()
    };
    this.bookings.set(id, booking);
    return booking;
  }

  async getBookedSeats(showtimeId: number): Promise<string[]> {
    const bookings = await this.getBookingsByShowtime(showtimeId);
    const bookedSeats: string[] = [];
    bookings.forEach(booking => {
      if (booking.status === 'confirmed') {
        bookedSeats.push(...booking.seats);
      }
    });
    return bookedSeats;
  }
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getMovies(): Promise<Movie[]> {
    const movieList = await db.select().from(movies);
    return movieList;
  }

  async getMovie(id: number): Promise<Movie | undefined> {
    const [movie] = await db.select().from(movies).where(eq(movies.id, id));
    return movie;
  }

  async createMovie(insertMovie: InsertMovie): Promise<Movie> {
    const [movie] = await db
      .insert(movies)
      .values(insertMovie)
      .returning();
    return movie;
  }

  async getCinemas(): Promise<Cinema[]> {
    const cinemaList = await db.select().from(cinemas);
    return cinemaList;
  }

  async getCinema(id: number): Promise<Cinema | undefined> {
    const [cinema] = await db.select().from(cinemas).where(eq(cinemas.id, id));
    return cinema;
  }

  async createCinema(insertCinema: InsertCinema): Promise<Cinema> {
    const [cinema] = await db
      .insert(cinemas)
      .values(insertCinema)
      .returning();
    return cinema;
  }

  async getHalls(): Promise<Hall[]> {
    const hallList = await db.select().from(halls);
    return hallList;
  }

  async getHallsByCinema(cinemaId: number): Promise<Hall[]> {
    const hallList = await db.select().from(halls).where(eq(halls.cinemaId, cinemaId));
    return hallList;
  }

  async getHall(id: number): Promise<Hall | undefined> {
    const [hall] = await db.select().from(halls).where(eq(halls.id, id));
    return hall;
  }

  async createHall(insertHall: InsertHall): Promise<Hall> {
    const [hall] = await db
      .insert(halls)
      .values(insertHall)
      .returning();
    return hall;
  }

  async getShowtimes(): Promise<Showtime[]> {
    const showtimeList = await db.select().from(showtimes);
    return showtimeList;
  }

  async getShowtimesByMovie(movieId: number): Promise<Showtime[]> {
    const showtimeList = await db.select().from(showtimes).where(eq(showtimes.movieId, movieId));
    return showtimeList;
  }

  async getShowtime(id: number): Promise<Showtime | undefined> {
    const [showtime] = await db.select().from(showtimes).where(eq(showtimes.id, id));
    return showtime;
  }

  async createShowtime(insertShowtime: InsertShowtime): Promise<Showtime> {
    const [showtime] = await db
      .insert(showtimes)
      .values(insertShowtime)
      .returning();
    return showtime;
  }

  async getBookings(): Promise<Booking[]> {
    const bookingList = await db.select().from(bookings);
    return bookingList;
  }

  async getBookingsByShowtime(showtimeId: number): Promise<Booking[]> {
    const bookingList = await db.select().from(bookings).where(eq(bookings.showtimeId, showtimeId));
    return bookingList;
  }

  async getBooking(id: number): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const bookingNumber = `KB${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const [booking] = await db
      .insert(bookings)
      .values({
        ...insertBooking,
        userId: insertBooking.userId ?? null,
        bookingNumber,
        status: "confirmed"
      })
      .returning();
    return booking;
  }

  async getBookedSeats(showtimeId: number): Promise<string[]> {
    const bookingList = await this.getBookingsByShowtime(showtimeId);
    const bookedSeats: string[] = [];
    bookingList.forEach(booking => {
      if (booking.status === 'confirmed') {
        bookedSeats.push(...booking.seats);
      }
    });
    return bookedSeats;
  }
}

export const storage = new DatabaseStorage();
