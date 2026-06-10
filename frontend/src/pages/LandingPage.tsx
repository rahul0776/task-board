import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { highlight } from '../utils/highlight.tsx';
import './landing.css';

const GITHUB_URL = 'https://github.com/rahul0776/task-board';

/* ---------------- hero data ---------------- */

const HERO_WORDS = ['Task', 'management', 'that', 'moves', 'at', 'the', 'speed', 'of'];

const TECH_CHIPS = [
  'Go 1.23',
  'Gin',
  'GORM',
  'PostgreSQL 15',
  'Redis 7',
  'WebSockets',
  'Docker',
  'React 18',
  'TypeScript',
];

type Prio = 'high' | 'med' | 'low';

interface HeroCard {
  title: string;
  prio: Prio;
}

const HERO_COLUMNS: { label: string; dot: string; count: number; cards: HeroCard[] }[] = [
  {
    label: 'To Do',
    dot: 'todo',
    count: 3,
    cards: [
      { title: 'Add task comments & activity log', prio: 'low' },
      { title: 'Design board sharing flow', prio: 'med' },
      { title: 'Email notifications', prio: 'low' },
    ],
  },
  {
    label: 'In Progress',
    dot: 'doing',
    count: 2,
    cards: [
      { title: 'Redis-backed rate limiting', prio: 'med' },
      { title: 'Unit tests for service layer', prio: 'high' },
    ],
  },
  {
    label: 'Done',
    dot: 'done',
    count: 4,
    cards: [
      { title: 'Goroutine WebSocket hub', prio: 'high' },
      { title: 'JWT auth middleware', prio: 'high' },
      { title: 'Docker multi-stage build', prio: 'med' },
    ],
  },
];

const TOAST_MSGS: React.ReactNode[] = [
  <>event: <b>task_updated</b> {'·'} broadcast to 3 clients</>,
  <>event: <b>task_created</b> {'·'} "Ship v1.1"</>,
  <>event: <b>board_updated</b> {'·'} broadcast to 3 clients</>,
  <>hub: client registered {'·'} <b>4 connected</b></>,
];

/* ---------------- code showcase data ---------------- */

const CODE_CONCURRENCY = `
type Hub struct {
    clients    map[*Client]bool
    broadcast  chan []byte
    register   chan *Client
    unregister chan *Client
}

func (h *Hub) Run() {
    for {
        select {
        case c := <-h.register:
            h.clients[c] = true
        case c := <-h.unregister:
            delete(h.clients, c)
            close(c.send)
        case msg := <-h.broadcast:
            for c := range h.clients {
                c.send <- msg
            }
        }
    }
}
`;

const CODE_REST = `
func (h *TaskHandler) CreateTask(c *gin.Context) {
    var req CreateTaskRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest,
            gin.H{"error": err.Error()})
        return
    }

    userID := c.GetUint("userID") // from auth middleware

    task, err := h.taskService.CreateTask(
        userID, req.BoardID, &req)
    if err != nil {
        c.JSON(http.StatusInternalServerError,
            gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusCreated, gin.H{"task": task})
}
`;

const CODE_SECURITY = `
// Hash passwords with bcrypt at cost factor 14
hash, err := bcrypt.GenerateFromPassword(
    []byte(req.Password), 14)

// Issue a signed token with a 24h expiry
claims := jwt.MapClaims{
    "user_id": user.ID,
    "exp": jwt.NewNumericDate(
        time.Now().Add(24 * time.Hour)),
}
token := jwt.NewWithClaims(
    jwt.SigningMethodHS256, claims)
signed, err := token.SignedString(
    []byte(cfg.JWTSecret))
`;

const CODE_DOCKER = `
# Stage 1 — compile a static Go binary
FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o main ./cmd/api

# Stage 2 — minimal runtime image
FROM alpine:latest
WORKDIR /root/
COPY --from=builder /app/main .
EXPOSE 8080
CMD ["./main"]
`;

type TabId = 'concurrency' | 'rest' | 'security' | 'docker';

const TABS: {
  id: TabId;
  label: string;
  file: string;
  lang: 'go' | 'docker';
  code: string;
  aside: React.ReactNode;
}[] = [
  {
    id: 'concurrency',
    label: 'Concurrency',
    file: 'internal/websocket/hub.go',
    lang: 'go',
    code: CODE_CONCURRENCY,
    aside: (
      <>
        <h3>A goroutine-powered WebSocket hub</h3>
        <p>
          Every connected browser registers with one central hub running in its own goroutine.
          Task events fan out to all clients the moment they happen.
        </p>
        <ul>
          <li>
            <b>Channels, not locks</b> — register, unregister and broadcast are serialized
            through one <code>select</code> loop, so the hot path needs no mutex.
          </li>
          <li>
            <b>Concurrent-safe by construction</b> — only the hub goroutine touches the client
            map.
          </li>
          <li>
            <b>Fan-out broadcast</b> — one event, N clients, instant sync.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'rest',
    label: 'REST API',
    file: 'internal/handler/task_handler.go',
    lang: 'go',
    code: CODE_REST,
    aside: (
      <>
        <h3>Gin handlers that stay thin</h3>
        <p>
          Handlers do exactly three things: validate input, call the service, translate the
          result to HTTP. All business logic lives a layer down.
        </p>
        <ul>
          <li>
            <b>Declarative validation</b> — <code>ShouldBindJSON</code> rejects malformed
            payloads before any logic runs.
          </li>
          <li>
            <b>Identity from middleware</b> — the user ID is injected into context by the JWT
            layer, never trusted from the body.
          </li>
          <li>
            <b>Honest status codes</b> — 400 / 401 / 201 / 500, mapped consistently across 14
            REST endpoints.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'security',
    label: 'Security',
    file: 'internal/service/auth_service.go',
    lang: 'go',
    code: CODE_SECURITY,
    aside: (
      <>
        <h3>Stateless JWT auth, bcrypt at cost 14</h3>
        <p>
          Authentication is token-based end to end: no server-side sessions, nothing to
          replicate between instances.
        </p>
        <ul>
          <li>
            <b>bcrypt cost 14</b> — well above the common default of 10; brute-forcing a leaked
            hash is impractical.
          </li>
          <li>
            <b>Middleware-guarded routes</b> — every board and task endpoint sits behind token
            validation.
          </li>
          <li>
            <b>Secrets from the environment</b> — no credentials in code, configurable per
            deployment.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'docker',
    label: 'Docker',
    file: 'backend/Dockerfile',
    lang: 'docker',
    code: CODE_DOCKER,
    aside: (
      <>
        <h3>A ~20 MB production image</h3>
        <p>
          Multi-stage builds keep the Go toolchain out of production: the final image carries
          one static binary and nothing else.
        </p>
        <ul>
          <li>
            <b>~20 MB vs ~300 MB</b> — the builder stage is discarded; only the compiled binary
            ships.
          </li>
          <li>
            <b>Static binary</b> — <code>CGO_ENABLED=0</code> means no system dependencies at
            runtime.
          </li>
          <li>
            <b>One-command stack</b> — Docker Compose orchestrates PostgreSQL, Redis, API and
            frontend with health-checked startup.
          </li>
        </ul>
      </>
    ),
  },
];

/* ---------------- small pieces ---------------- */

const TermDots: React.FC = () => (
  <>
    <span className="term-dot r" />
    <span className="term-dot y" />
    <span className="term-dot g" />
  </>
);

const HeroBoardCard: React.FC<HeroCard & { className?: string }> = ({
  title,
  prio,
  className = '',
}) => (
  <div className={`bcard ${className}`}>
    <div className="bcard-title">{title}</div>
    <div className="bcard-meta">
      <span className={`prio prio-${prio}`}>{prio}</span>
      <span className="bcard-avatar" />
    </div>
  </div>
);

/* ---------------- page ---------------- */

const LandingPage: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<TabId>('concurrency');
  const [toastIdx, setToastIdx] = useState(0);

  // Scroll reveal — base state visible; hide-then-reveal only when JS runs
  // and the user has no reduced-motion preference.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const els = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    els.forEach((el) => {
      el.classList.add('js-reveal');
      const d = el.getAttribute('data-reveal-delay');
      if (d) el.style.transitionDelay = `${d}ms`;
    });

    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // WebSocket toast cycle (4.5s), gated behind prefers-reduced-motion.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => {
      setToastIdx((i) => (i + 1) % TOAST_MSGS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const active = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="landing" ref={rootRef}>
      {/* ====================== NAV ====================== */}
      <nav className="nav">
        <div className="wrap nav-inner">
          <a className="nav-logo" href="#top">
            <span className="nav-logo-mark">
              <span />
            </span>
            TaskBoard
          </a>
          <div className="nav-links">
            <a href="#overview">Overview</a>
            <a href="#architecture">Architecture</a>
            <a href="#code">Go in depth</a>
            <a href="#screenshots">Screenshots</a>
          </div>
          <div className="nav-cta">
            <a className="btn btn-ghost-dark btn-sm" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <Link className="btn btn-primary btn-sm" to="/dashboard">
              Live demo
            </Link>
          </div>
        </div>
      </nav>

      {/* ====================== HERO ====================== */}
      <header className="hero" id="top">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <span className="hero-eyebrow">
              <span className="live-dot" />
              LIVE — rahultaskboard.onrender.com
            </span>
            <h1 className="hero-title">
              {HERO_WORDS.map((w, i) => (
                <React.Fragment key={i}>
                  <span className="w" style={{ '--i': i } as React.CSSProperties}>
                    {w}
                  </span>{' '}
                </React.Fragment>
              ))}
              <span className="w accent" style={{ '--i': 8 } as React.CSSProperties}>
                Go.
              </span>
            </h1>
            <p className="hero-sub">
              TaskBoard is a real-time Kanban workspace — boards, tasks and live productivity
              metrics, synced instantly across every open client. Behind the React front end
              sits a <strong>production-grade Go backend</strong>: a Gin REST API, a
              goroutine-powered WebSocket hub, JWT authentication and PostgreSQL.
            </p>
            <div className="hero-ctas">
              <Link className="btn btn-primary" to="/dashboard">
                Try the live demo →
              </Link>
              <a className="btn btn-ghost-dark" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                View source on GitHub
              </a>
            </div>
            <p className="hero-note">
              Free to explore — this is a portfolio build, not a paid product.
            </p>
            <div className="hero-stack">
              {TECH_CHIPS.map((c) => (
                <span className="chip" key={c}>
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div className="hero-visual">
            <div className="board-scene">
              <div className="board-cols">
                {HERO_COLUMNS.map((col) => (
                  <div className="bcol" key={col.dot}>
                    <div className="bcol-head">
                      <span className={`bcol-dot ${col.dot}`} />
                      {col.label.replace(' ', ' ')}
                      <span className="bcol-count">{col.count}</span>
                    </div>
                    {col.cards.map((card) => (
                      <HeroBoardCard key={card.title} {...card} />
                    ))}
                  </div>
                ))}
              </div>
              <HeroBoardCard
                title="Implement drag & drop"
                prio="high"
                className="bcard-ghost"
              />
              <div className="ws-toast is-swap" key={toastIdx}>
                <span className="live-dot" />
                <span>{TOAST_MSGS[toastIdx]}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ====================== OVERVIEW ====================== */}
      <section className="section" id="overview">
        <div className="wrap">
          <div data-reveal>
            <p className="kicker">The product</p>
            <h2>A real-time Kanban workspace.</h2>
            <p className="lede">
              Organize projects into color-coded boards, move tasks through a To{' '}Do →
              In{' '}Progress → Done workflow, and watch every change land on every open
              screen — instantly.
            </p>
          </div>
          <div className="feature-grid">
            <div className="feature" data-reveal>
              <div className="feature-icon">01</div>
              <h3>Boards &amp; tasks</h3>
              <p>
                Multiple boards per account, Kanban columns, priority levels and task metadata —
                backed by PostgreSQL with proper relations and cascade deletes.
              </p>
            </div>
            <div className="feature" data-reveal data-reveal-delay="100">
              <div className="feature-icon">02</div>
              <h3>Live everywhere</h3>
              <p>
                A WebSocket hub broadcasts <code>task_created</code>, <code>task_updated</code>{' '}
                and <code>task_deleted</code> events to every connected client — no refresh, no
                polling.
              </p>
            </div>
            <div className="feature" data-reveal data-reveal-delay="200">
              <div className="feature-icon">03</div>
              <h3>Dashboard analytics</h3>
              <p>
                Total boards, active tasks, completed tasks and a productivity percentage —
                computed live and updated in real time as work moves.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ====================== ARCHITECTURE ====================== */}
      <section className="section" id="architecture">
        <div className="wrap arch-grid">
          <div className="arch-copy" data-reveal>
            <p className="kicker">Under the hood</p>
            <h2>Clean architecture, layer by layer.</h2>
            <p className="lede">
              Every request flows through the same disciplined path. Each layer has one job,
              depends only on the layer below it, and can be tested in isolation.
            </p>
            <ul className="arch-points">
              <li>
                <b>Standard Go project layout</b>
                <span>
                  <code>cmd/</code>, <code>internal/</code> and <code>pkg/</code> — internal
                  packages are compiler-enforced private to the module.
                </span>
              </li>
              <li>
                <b>Interface-driven repositories</b>
                <span>
                  Data access sits behind Go interfaces, so PostgreSQL can be swapped for a mock
                  in tests without touching business logic.
                </span>
              </li>
              <li>
                <b>Explicit dependency injection</b>
                <span>
                  No globals. Handlers receive services, services receive repositories — wiring
                  is visible in <code>main.go</code>.
                </span>
              </li>
              <li>
                <b>Stateless by design</b>
                <span>
                  JWT auth means any instance can serve any request — the API scales
                  horizontally behind a load balancer.
                </span>
              </li>
            </ul>
          </div>
          <div className="arch-diagram" data-reveal data-reveal-delay="120">
            <p className="arch-diagram-title">
              <span>request lifecycle</span>
              <span>backend/</span>
            </p>
            <div className="arch-flow">
              <div className="layer layer-entry">
                <span className="layer-name">Client</span>
                <span className="layer-pkg">React 18 + TypeScript</span>
                <span className="layer-desc">
                  SPA with protected routes — talks JSON over REST and frames over WebSocket.
                </span>
              </div>
              <div className="arch-arrow">
                <span>HTTPS {'·'} ws://</span>
              </div>
              <div className="layer">
                <span className="layer-name">Middleware</span>
                <span className="layer-pkg">internal/middleware</span>
                <span className="layer-desc">
                  CORS and JWT validation — unauthenticated requests never reach a handler.
                </span>
              </div>
              <div className="arch-arrow">
                <span>{'▾'}</span>
              </div>
              <div className="layer">
                <span className="layer-name">Handler</span>
                <span className="layer-pkg">internal/handler</span>
                <span className="layer-desc">
                  Gin controllers — bind and validate JSON, map errors to proper HTTP status
                  codes.
                </span>
              </div>
              <div className="arch-arrow">
                <span>{'▾'}</span>
              </div>
              <div className="layer">
                <span className="layer-name">Service</span>
                <span className="layer-pkg">internal/service</span>
                <span className="layer-desc">
                  Business logic and transaction management — pure Go, zero HTTP concerns.
                </span>
              </div>
              <div className="arch-arrow">
                <span>{'▾'}</span>
              </div>
              <div className="layer">
                <span className="layer-name">Repository</span>
                <span className="layer-pkg">internal/repository</span>
                <span className="layer-desc">
                  Interface-based data access over GORM — connection pooling, auto-migrations.
                </span>
              </div>
              <div className="arch-arrow">
                <span>{'▾'}</span>
              </div>
              <div className="layer layer-db">
                <span className="layer-name">Domain {'·'} PostgreSQL 15</span>
                <span className="layer-pkg">internal/domain</span>
                <span className="layer-desc">
                  <code>User</code>, <code>Board</code>, <code>Task</code> entities with
                  foreign-key relationships and ACID guarantees.
                </span>
              </div>
            </div>
            <div className="arch-side">
              <div className="sidebox">
                <span className="layer-pkg">internal/websocket</span>
                <p>Goroutine hub broadcasts task events to every connected client over channels.</p>
              </div>
              <div className="sidebox">
                <span className="layer-pkg">pkg/database {'·'} Redis 7</span>
                <p>Caching layer wired for sessions and rate limiting — ready for horizontal scale.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================== GO IN DEPTH ====================== */}
      <section className="code-section" id="code">
        <div className="wrap">
          <div data-reveal>
            <p className="kicker">Go, in depth</p>
            <h2>Read the code that runs it.</h2>
            <p className="lede">
              Four excerpts from the backend — the parts of Go that matter in production:
              concurrency, clean HTTP handling, security and shipping small.
            </p>
          </div>

          <div className="code-tabs" role="tablist" data-reveal>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className="code-tab"
                role="tab"
                aria-selected={tab.id === activeTab}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="code-panel" key={active.id}>
            <div className="code-window">
              <div className="term-bar">
                <TermDots />
                <span className="term-title">{active.file}</span>
              </div>
              <div className="term-body">
                <pre>{highlight(active.code, active.lang)}</pre>
              </div>
            </div>
            <div className="code-aside">{active.aside}</div>
          </div>
        </div>
      </section>

      {/* ====================== SCREENSHOTS ====================== */}
      <section className="section" id="screenshots" style={{ paddingTop: 104 }}>
        <div className="wrap">
          <div className="shots-head" data-reveal>
            <p className="kicker">See it running</p>
            <h2>The product, in production.</h2>
            <p className="lede">
              Deployed on Render with managed PostgreSQL and Redis. Create an account and try it
              — everything below is live.
            </p>
          </div>
          <div className="shot-main" data-reveal>
            <div className="shot-bar">
              <TermDots />
              <span className="shot-url">rahultaskboard.onrender.com/dashboard</span>
            </div>
            <img
              src="/landing/dashboard-screenshot.png"
              alt="TaskBoard dashboard with live productivity metrics"
            />
          </div>
          <p className="shot-caption">
            Dashboard — boards overview and productivity metrics, updated live over WebSocket.
          </p>
          <div className="shot-grid">
            <div className="shot-cell" data-reveal>
              <img src="/landing/board-view.jpg" alt="TaskBoard Kanban board view" />
              <p className="shot-caption">
                Kanban board — tasks moving To{' '}Do → In{' '}Progress → Done.
              </p>
            </div>
            <div className="shot-cell" data-reveal data-reveal-delay="100">
              <img src="/landing/login.jpg" alt="TaskBoard login screen" />
              <p className="shot-caption">Login — JWT-secured sign-in with registration flow.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ====================== ABOUT ====================== */}
      <section className="section" id="about">
        <div className="wrap">
          <div className="about" data-reveal>
            <div>
              <p className="kicker">About this project</p>
              <h2>Built to be read, not sold.</h2>
              <p>
                TaskBoard was designed and built end-to-end by <strong>Rahul Lotlikar</strong> as
                a deep dive into production Go engineering — clean architecture, goroutine
                concurrency, stateless auth and containerized deployment. There is no pricing
                page and nothing for sale; the product is the codebase.
              </p>
              <p>
                If you're hiring for backend or full-stack roles, the repository is the best
                place to start: a documented architecture, a one-command Docker Compose setup,
                and Go written the way the standard library authors intended.
              </p>
            </div>
            <div className="about-ctas">
              <a className="btn btn-primary" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                Read the code →
              </a>
              <Link className="btn btn-ghost-light" to="/dashboard">
                Try the live demo
              </Link>
            </div>
          </div>
        </div>

        <footer className="footer">
          <div className="wrap footer-inner">
            <span>© 2026 Rahul Lotlikar — TaskBoard, a Go portfolio project.</span>
            <div className="footer-links">
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
              <Link to="/dashboard">Live demo</Link>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
};

export default LandingPage;
