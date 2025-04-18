
package main

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/jackc/pgx/v4/pgxpool"
)

// initDB initializes the database connection
func initDB() (*pgxpool.Pool, error) {
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "5432")
	user := getEnv("DB_USER", "linkuser")
	password := getEnv("DB_PASSWORD", "linkpassword")
	dbname := getEnv("DB_NAME", "linktracker")

	// Connection string
	connStr := fmt.Sprintf("postgres://%s:%s@%s:%s/%s", user, password, host, port, dbname)

	// Connection pool configuration
	config, err := pgxpool.ParseConfig(connStr)
	if err != nil {
		return nil, err
	}

	// Set connection pool settings
	config.MaxConns = 10
	config.MaxConnLifetime = time.Hour
	config.MaxConnIdleTime = 30 * time.Minute

	// Create connection pool
	dbpool, err := pgxpool.ConnectConfig(context.Background(), config)
	if err != nil {
		return nil, err
	}

	// Test connection
	if err := dbpool.Ping(context.Background()); err != nil {
		return nil, err
	}

	fmt.Println("Successfully connected to database")
	return dbpool, nil
}

// Helper function to get environment variable with default fallback
func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

// Link represents a shortened URL entry
type Link struct {
	ID        int       `json:"id"`
	Code      string    `json:"code"`
	WhiteURL  string    `json:"white_url"`
	BlackURL  string    `json:"black_url"`
	CreatedAt time.Time `json:"created_at"`
}

// Click represents a click event on a link
type Click struct {
	ID        int       `json:"id"`
	IP        string    `json:"ip"`
	UserAgent string    `json:"user_agent"`
	Country   string    `json:"country"`
	IsBot     bool      `json:"is_bot"`
	LinkID    int       `json:"link_id"`
	CreatedAt time.Time `json:"created_at"`
}

// LinkStats represents statistics for a specific link
type LinkStats struct {
	TotalClicks  int                `json:"total_clicks"`
	BotClicks    int                `json:"bot_clicks"`
	CountryStats []CountryStatEntry `json:"country_stats"`
}

// CountryStatEntry represents click count by country
type CountryStatEntry struct {
	Country string `json:"country"`
	Count   int    `json:"count"`
}
