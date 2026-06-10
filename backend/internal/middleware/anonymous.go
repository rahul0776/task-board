package middleware

import (
	"fmt"
	"log"
	"net/http"
	"regexp"
	"task-board/internal/domain"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// The frontend generates v4 UUIDs (see frontend/src/services/anonymous.ts).
// Enforcing the format here keeps arbitrary strings out of the identity
// namespace and bounds what gets stored in the users table.
var anonymousIDPattern = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`)

func AnonymousUserMiddleware(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		anonymousUserID := c.GetHeader("X-Anonymous-User-Id")
		if anonymousUserID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "X-Anonymous-User-Id header required"})
			c.Abort()
			return
		}

		if !anonymousIDPattern.MatchString(anonymousUserID) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "X-Anonymous-User-Id must be a UUID"})
			c.Abort()
			return
		}

		// Use UUID as unique identifier in email field
		userEmail := fmt.Sprintf("%s@anonymous.local", anonymousUserID)

		var user domain.User
		result := db.Where("email = ?", userEmail).First(&user)

		if result.Error == gorm.ErrRecordNotFound {
			// Create new anonymous user
			username := fmt.Sprintf("User_%s", anonymousUserID[:8])
			user = domain.User{
				Email:     userEmail,
				Username:  username,
				Password:  "anonymous", // Password not used for anonymous users
				FirstName: "Anonymous",
				LastName:  "User",
			}

			if err := db.Create(&user).Error; err != nil {
				log.Printf("failed to create anonymous user: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create anonymous user"})
				c.Abort()
				return
			}
		} else if result.Error != nil {
			log.Printf("anonymous user lookup failed: %v", result.Error)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
			c.Abort()
			return
		}

		c.Set("user_id", user.ID)
		c.Next()
	}
}
