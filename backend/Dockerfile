FROM python:3.12-slim

WORKDIR /app

# System deps (optional aber gut)
RUN apt-get update && apt-get install -y gcc

# Copy only backend folder
COPY . .

# Install dependencies
RUN pip install --upgrade pip
RUN pip install -e .

EXPOSE 8000

CMD ["uvicorn", "edge_lab.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
