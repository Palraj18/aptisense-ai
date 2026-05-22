FROM python:3.12-slim

WORKDIR /app/ml-service

COPY ml-service/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY ml-service /app/ml-service
