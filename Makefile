# ============================================================
# SANVI COMPUTER AND TRADERS — Makefile
# Ek hi jagah se sab kuch chalao.
# Usage: make <target>
# ============================================================

.PHONY: help install ensure-env run dev all backend website build stop clean status

SHELL := /bin/bash

# Default target — show help
.DEFAULT_GOAL := help

# ============================================================
# Help
# ============================================================
help: ## Show this help screen
	@echo ""
	@echo "╔══════════════════════════════════════════════════╗"
	@echo "║   SANVI COMPUTER AND TRADERS — Makefile Commands ║"
	@echo "╚══════════════════════════════════════════════════╝"
	@echo ""
	@echo "━━━━━━━━━━━━ Setup ━━━━━━━━━━━━"
	@awk 'BEGIN {FS = ":.*## "}; /^[a-zA-Z_-]+:.*## / {printf "  make %-18s %s\n", $$1, $$2}' $(MAKEFILE_LIST) | grep -E '^  make (install|ensure-env) '
	@echo ""
	@echo "━━━━━━━━━━━━ Run (Day-to-day) ━━━━━━━━━━━━"
	@awk 'BEGIN {FS = ":.*## "}; /^[a-zA-Z_-]+:.*## / {printf "  make %-18s %s\n", $$1, $$2}' $(MAKEFILE_LIST) | grep -E '^  make (run|dev|all|backend|website) '
	@echo ""
	@echo "━━━━━━━━━━━━ Build / Clean ━━━━━━━━━━━━"
	@awk 'BEGIN {FS = ":.*## "}; /^[a-zA-Z_-]+:.*## / {printf "  make %-18s %s\n", $$1, $$2}' $(MAKEFILE_LIST) | grep -E '^  make (build|stop|clean|status) '
	@echo ""

# ============================================================
# Setup
# ============================================================
install: ensure-env ## 1. Fresh install — root + backend + website deps
	@echo "▶ npm install (root, backend, website)..."
	@npm run install:all
	@echo ""
	@echo "✅ Install done. Ab 'make run' se sab chalao."

ensure-env: ## Create backend/.env from .env.example if missing
	@if [ ! -f backend/.env ]; then \
	  cp backend/.env.example backend/.env; \
	  echo "✅ Created backend/.env from .env.example"; \
	fi

# ============================================================
# Run (primary targets you'll use every day)
# ============================================================
run: dev ## ⭐ Default — start backend + website together
dev: all ## Alias for 'make all'
all: ensure-env ## Start backend + website together (concurrently, color-coded). Ctrl+C to stop all.
	@echo ""
	@echo "╔═══════════════════════════════════════════════════╗"
	@echo "║  SANVI COMPUTER AND TRADERS — Starting services   ║"
	@echo "║  Backend  → http://localhost:5050  (magenta)      ║"
	@echo "║  Website  → http://localhost:5173  (cyan)         ║"
	@echo "║                                                   ║"
	@echo "║  Press Ctrl+C ONCE to stop EVERYTHING cleanly     ║"
	@echo "╚═══════════════════════════════════════════════════╝"
	@echo ""
	@npm run dev:all

backend: ensure-env ## Only run backend (port 5050)
	@npm run dev:backend

website: ## Only run website (port 5173)
	@npm run dev:website

# ============================================================
# Build / Clean
# ============================================================
build: ## Production build of website
	@npm run build

stop: ## Kill backend (5050) + website (5173) dev servers
	@npm run stop --silent
	@echo "✅ Stopped processes on ports 5050 and 5173."

clean: ## Remove node_modules + dist
	@rm -rf node_modules backend/node_modules website/node_modules website/dist
	@echo "✅ Cleaned build artifacts and node_modules."

status: ## Quick status — ports
	@if nc -z localhost 5050 2>/dev/null; then echo "✅ Backend : running on http://localhost:5050"; else echo "◻️  Backend : not running on :5050"; fi
	@if nc -z localhost 5173 2>/dev/null; then echo "✅ Website : running on http://localhost:5173"; else echo "◻️  Website : not running on :5173"; fi
