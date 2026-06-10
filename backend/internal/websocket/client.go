package websocket

import (
	"log"
	"net/http"
	"strings"

	"github.com/gorilla/websocket"
)

const maxMessageSize = 65536 // 64KB cap on inbound frames

// allowedOrigins holds the origins permitted to open WebSocket connections,
// populated from CORS_ORIGIN at startup via SetAllowedOrigins. Empty or "*"
// allows any origin.
var allowedOrigins map[string]bool

func SetAllowedOrigins(corsOrigin string) {
	if corsOrigin == "" || corsOrigin == "*" {
		allowedOrigins = nil
		return
	}
	allowedOrigins = make(map[string]bool)
	for _, o := range strings.Split(corsOrigin, ",") {
		if o = strings.TrimSpace(strings.TrimSuffix(o, "/")); o != "" {
			allowedOrigins[o] = true
		}
	}
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		if allowedOrigins == nil {
			return true
		}
		origin := r.Header.Get("Origin")
		if origin == "" {
			// Non-browser clients (no Origin header) are not subject to CSRF.
			return true
		}
		return allowedOrigins[strings.TrimSuffix(origin, "/")]
	},
}

func (h *Hub) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	client := &Client{
		hub:  h,
		conn: conn,
		send: make(chan []byte, 256),
	}

	h.Register(client)

	// Start goroutines for reading and writing
	go client.writePump()
	go client.readPump()
}

func (c *Client) readPump() {
	defer func() {
		c.hub.Unregister(c)
		c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMessageSize)

	for {
		_, _, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}
	}
}

func (c *Client) writePump() {
	defer c.conn.Close()

	for {
		select {
		case message, ok := <-c.send:
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
				log.Printf("WebSocket write error: %v", err)
				return
			}
		}
	}
}
