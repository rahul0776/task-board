package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
)

// CORS restricts cross-origin access to the origins configured via
// CORS_ORIGIN (comma-separated). A value of "*" allows any origin but
// never together with credentials, which browsers reject anyway.
func CORS(corsOrigin string) gin.HandlerFunc {
	allowAll := corsOrigin == "" || corsOrigin == "*"
	allowed := make(map[string]bool)
	for _, o := range strings.Split(corsOrigin, ",") {
		if o = strings.TrimSpace(strings.TrimSuffix(o, "/")); o != "" {
			allowed[o] = true
		}
	}

	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")

		if allowAll {
			c.Header("Access-Control-Allow-Origin", "*")
		} else if allowed[origin] {
			c.Header("Access-Control-Allow-Origin", origin)
			c.Header("Access-Control-Allow-Credentials", "true")
			c.Header("Vary", "Origin")
		}

		c.Header("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With, X-Anonymous-User-Id")
		c.Header("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
