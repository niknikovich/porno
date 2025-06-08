import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBookingSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all movies
  app.get("/api/movies", async (req, res) => {
    try {
      const movies = await storage.getMovies();
      res.json(movies);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch movies" });
    }
  });

  // Get movie by ID
  app.get("/api/movies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const movie = await storage.getMovie(id);
      if (!movie) {
        return res.status(404).json({ message: "Movie not found" });
      }
      res.json(movie);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch movie" });
    }
  });

  // Get all cinemas
  app.get("/api/cinemas", async (req, res) => {
    try {
      const cinemas = await storage.getCinemas();
      res.json(cinemas);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cinemas" });
    }
  });

  // Get showtimes for a movie
  app.get("/api/movies/:id/showtimes", async (req, res) => {
    try {
      const movieId = parseInt(req.params.id);
      const showtimes = await storage.getShowtimesByMovie(movieId);
      
      // Enrich showtimes with cinema and hall data
      const enrichedShowtimes = await Promise.all(
        showtimes.map(async (showtime) => {
          const hall = await storage.getHall(showtime.hallId);
          const cinema = hall ? await storage.getCinema(hall.cinemaId) : null;
          const bookedSeats = await storage.getBookedSeats(showtime.id);
          
          return {
            ...showtime,
            hall,
            cinema,
            bookedSeats
          };
        })
      );

      res.json(enrichedShowtimes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch showtimes" });
    }
  });

  // Get showtime details with seat availability
  app.get("/api/showtimes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const showtime = await storage.getShowtime(id);
      
      if (!showtime) {
        return res.status(404).json({ message: "Showtime not found" });
      }

      const hall = await storage.getHall(showtime.hallId);
      const cinema = hall ? await storage.getCinema(hall.cinemaId) : null;
      const bookedSeats = await storage.getBookedSeats(showtime.id);
      const movie = await storage.getMovie(showtime.movieId);

      res.json({
        ...showtime,
        hall,
        cinema,
        movie,
        bookedSeats
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch showtime details" });
    }
  });

  // Create booking
  app.post("/api/bookings", async (req, res) => {
    try {
      const validatedData = insertBookingSchema.parse(req.body);
      
      // Check if seats are still available
      const bookedSeats = await storage.getBookedSeats(validatedData.showtimeId);
      const conflictingSeats = validatedData.seats.filter(seat => bookedSeats.includes(seat));
      
      if (conflictingSeats.length > 0) {
        return res.status(409).json({ 
          message: "Some seats are no longer available",
          conflictingSeats 
        });
      }

      const booking = await storage.createBooking(validatedData);
      res.status(201).json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid booking data",
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  // Get booking by ID
  app.get("/api/bookings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const booking = await storage.getBooking(id);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Enrich booking with showtime, movie, hall, and cinema data
      const showtime = await storage.getShowtime(booking.showtimeId);
      const movie = showtime ? await storage.getMovie(showtime.movieId) : null;
      const hall = showtime ? await storage.getHall(showtime.hallId) : null;
      const cinema = hall ? await storage.getCinema(hall.cinemaId) : null;

      res.json({
        ...booking,
        showtime,
        movie,
        hall,
        cinema
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
