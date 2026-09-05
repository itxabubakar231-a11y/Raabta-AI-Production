# Multi-stage Dockerfile for Raabta AI (Full-Stack Production)

# --- Stage 1: Build Frontend Assets ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# --- Stage 2: Production Python Backend ---
FROM python:3.11-slim
WORKDIR /app

# System dependencies for audio/image processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code and static files
COPY backEnd/ ./backEnd/
COPY api/ ./api/
COPY --from=frontend-builder /app/frontend/dist ./dist

# Environment settings
ENV PORT=5000
ENV PYTHONUNBUFFERED=1
EXPOSE 5000

# Start production server
CMD ["gunicorn", "--chdir", "backEnd", "app:app", "--workers", "2", "--bind", "0.0.0.0:5000", "--timeout", "120"]
