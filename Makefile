.PHONY: help install server client app clean stop

# Default target
help:
	@echo "Available targets:"
	@echo "  install  - Install all dependencies (conda + npm)"
	@echo "  server   - Start FastAPI server (port 8000)"
	@echo "  client   - Start React dev server (port 5173)"
	@echo "  app      - Start both server and client"
	@echo "  clean    - Clean node_modules and __pycache__"
	@echo "  stop     - Stop all running processes"

# Install dependencies
install:
	@echo "Installing Python dependencies..."
	pip install -r requirements.txt
	@echo "Installing Node.js dependencies..."
	cd client && npm install

venv:
	conda create -n sandbox python=3.11 && conda activate sandbox

# Start FastAPI server
server:
	@echo "Starting FastAPI server on http://localhost:8000"
	cd server && conda run -n sandbox uvicorn app:app --reload --port 8000

# Start React client
client:
	@echo "Starting React dev server on http://localhost:5173"
	cd client && npm run dev

# Start both services in parallel
app:
	@echo "Starting both server and client..."
	@echo "Server: http://localhost:8000"
	@echo "Client: http://localhost:5173"
	@echo "Press Ctrl+C to stop both services"
	make server & make client & wait

# Clean up build artifacts
clean:
	@echo "Cleaning up..."
	rm -rf client/node_modules
	rm -rf client/dist
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

# Stop all processes (kills by port)
stop:
	@echo "Stopping all services..."
	-pkill -f "uvicorn app:app"
	-pkill -f "vite"
	@echo "Services stopped"