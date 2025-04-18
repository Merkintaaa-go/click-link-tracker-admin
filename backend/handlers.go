
package main

import (
	"context"
	"crypto/rand"
	"fmt"
	"math/big"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4/pgxpool"
)

// Handler holds the database connection
type Handler struct {
	db *pgxpool.Pool
}

// NewHandler creates a new handler with the provided database connection
func NewHandler(db *pgxpool.Pool) *Handler {
	return &Handler{db: db}
}

// GetLinks returns all links with pagination
func (h *Handler) GetLinks(c *gin.Context) {
	// Get pagination parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	
	// Calculate offset
	offset := (page - 1) * pageSize

	// Query database
	rows, err := h.db.Query(context.Background(), 
		"SELECT id, code, white_url, black_url, created_at FROM links ORDER BY id DESC LIMIT $1 OFFSET $2", 
		pageSize, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch links"})
		return
	}
	defer rows.Close()

	// Parse results
	var links []Link
	for rows.Next() {
		var link Link
		if err := rows.Scan(&link.ID, &link.Code, &link.WhiteURL, &link.BlackURL, &link.CreatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan links"})
			return
		}
		links = append(links, link)
	}

	// Get total count for pagination
	var totalCount int
	err = h.db.QueryRow(context.Background(), "SELECT COUNT(*) FROM links").Scan(&totalCount)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count links"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": links,
		"pagination": gin.H{
			"total": totalCount,
			"page": page,
			"pageSize": pageSize,
		},
	})
}

// CreateLink creates a new shortened URL
func (h *Handler) CreateLink(c *gin.Context) {
	// Parse request body
	var req struct {
		WhiteURL string `json:"white_url" binding:"required"`
		BlackURL string `json:"black_url" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// Generate a unique code
	code, err := generateUniqueCode(h.db)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate code"})
		return
	}

	// Insert into database
	var link Link
	err = h.db.QueryRow(context.Background(),
		"INSERT INTO links (code, white_url, black_url, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id, code, white_url, black_url, created_at",
		code, req.WhiteURL, req.BlackURL).Scan(&link.ID, &link.Code, &link.WhiteURL, &link.BlackURL, &link.CreatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create link"})
		return
	}

	c.JSON(http.StatusCreated, link)
}

// GetLink retrieves a specific link
func (h *Handler) GetLink(c *gin.Context) {
	// Parse link ID
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid link ID"})
		return
	}

	// Query database
	var link Link
	err = h.db.QueryRow(context.Background(),
		"SELECT id, code, white_url, black_url, created_at FROM links WHERE id = $1", id).Scan(
		&link.ID, &link.Code, &link.WhiteURL, &link.BlackURL, &link.CreatedAt)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Link not found"})
		return
	}

	c.JSON(http.StatusOK, link)
}

// GetLinkStats returns statistics for a specific link
func (h *Handler) GetLinkStats(c *gin.Context) {
	// Parse link ID
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid link ID"})
		return
	}

	// Verify the link exists
	var exists bool
	err = h.db.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM links WHERE id = $1)", id).Scan(&exists)
	if err != nil || !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Link not found"})
		return
	}

	// Get total clicks
	var totalClicks int
	err = h.db.QueryRow(context.Background(), "SELECT COUNT(*) FROM clicks WHERE link_id = $1", id).Scan(&totalClicks)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count clicks"})
		return
	}

	// Get bot clicks
	var botClicks int
	err = h.db.QueryRow(context.Background(), "SELECT COUNT(*) FROM clicks WHERE link_id = $1 AND is_bot = true", id).Scan(&botClicks)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count bot clicks"})
		return
	}

	// Get clicks by country
	rows, err := h.db.Query(context.Background(), 
		"SELECT country, COUNT(*) FROM clicks WHERE link_id = $1 GROUP BY country ORDER BY COUNT(*) DESC", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch country stats"})
		return
	}
	defer rows.Close()

	var countryStats []CountryStatEntry
	for rows.Next() {
		var entry CountryStatEntry
		if err := rows.Scan(&entry.Country, &entry.Count); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan country stats"})
			return
		}
		countryStats = append(countryStats, entry)
	}

	stats := LinkStats{
		TotalClicks:  totalClicks,
		BotClicks:    botClicks,
		CountryStats: countryStats,
	}

	c.JSON(http.StatusOK, stats)
}

// GetClicks returns all clicks with pagination and filters
func (h *Handler) GetClicks(c *gin.Context) {
	// Get pagination parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	
	// Get filter parameters
	country := c.Query("country")
	isBot := c.Query("is_bot")
	
	// Calculate offset
	offset := (page - 1) * pageSize

	// Build query with optional filters
	query := "SELECT id, ip, user_agent, country, is_bot, link_id, created_at FROM clicks WHERE 1=1"
	args := []interface{}{}
	argPosition := 1

	if country != "" {
		query += fmt.Sprintf(" AND country = $%d", argPosition)
		args = append(args, country)
		argPosition++
	}

	if isBot != "" {
		isBotBool, err := strconv.ParseBool(isBot)
		if err == nil {
			query += fmt.Sprintf(" AND is_bot = $%d", argPosition)
			args = append(args, isBotBool)
			argPosition++
		}
	}

	// Add ordering and pagination
	query += " ORDER BY id DESC LIMIT $" + strconv.Itoa(argPosition) + " OFFSET $" + strconv.Itoa(argPosition+1)
	args = append(args, pageSize, offset)

	// Execute query
	rows, err := h.db.Query(context.Background(), query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch clicks"})
		return
	}
	defer rows.Close()

	// Parse results
	var clicks []Click
	for rows.Next() {
		var click Click
		if err := rows.Scan(&click.ID, &click.IP, &click.UserAgent, &click.Country, &click.IsBot, &click.LinkID, &click.CreatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan clicks"})
			return
		}
		clicks = append(clicks, click)
	}

	// Build count query
	countQuery := "SELECT COUNT(*) FROM clicks WHERE 1=1"
	countArgs := []interface{}{}
	countArgPosition := 1

	if country != "" {
		countQuery += fmt.Sprintf(" AND country = $%d", countArgPosition)
		countArgs = append(countArgs, country)
		countArgPosition++
	}

	if isBot != "" {
		isBotBool, err := strconv.ParseBool(isBot)
		if err == nil {
			countQuery += fmt.Sprintf(" AND is_bot = $%d", countArgPosition)
			countArgs = append(countArgs, isBotBool)
		}
	}

	// Get total count for pagination
	var totalCount int
	err = h.db.QueryRow(context.Background(), countQuery, countArgs...).Scan(&totalCount)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count clicks"})
		return
	}

	// Get unique countries for filter dropdown
	var countries []string
	countriesRows, err := h.db.Query(context.Background(), "SELECT DISTINCT country FROM clicks ORDER BY country")
	if err == nil {
		defer countriesRows.Close()
		for countriesRows.Next() {
			var country string
			if err := countriesRows.Scan(&country); err == nil {
				countries = append(countries, country)
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"data": clicks,
		"pagination": gin.H{
			"total": totalCount,
			"page": page,
			"pageSize": pageSize,
		},
		"filters": gin.H{
			"countries": countries,
		},
	})
}

// Generate a unique shortened code
func generateUniqueCode(db *pgxpool.Pool) (string, error) {
	const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	const codeLength = 6
	maxRetries := 5

	for i := 0; i < maxRetries; i++ {
		// Generate random code
		code := make([]byte, codeLength)
		for j := 0; j < codeLength; j++ {
			n, err := rand.Int(rand.Reader, big.NewInt(int64(len(chars))))
			if err != nil {
				return "", err
			}
			code[j] = chars[n.Int64()]
		}
		codeStr := string(code)

		// Check if code already exists
		var exists bool
		err := db.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM links WHERE code = $1)", codeStr).Scan(&exists)
		if err != nil {
			return "", err
		}

		// If code doesn't exist, return it
		if !exists {
			return codeStr, nil
		}
	}

	// If we've tried maxRetries times and failed, return error
	return "", fmt.Errorf("failed to generate unique code after %d attempts", maxRetries)
}
