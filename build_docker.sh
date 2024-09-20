#!/bin/bash

export DOCKER_BUILDKIT=1

mkdir -p data
mkdir -p database

cp .env.example .env

cd frontend
cp .env.example .env
#REACT_APP_API_BASE_URL=http://52.91.51.105:8004  # REMOTE, SUCH AS AWS
cd ..

docker compose run frontend npm install react-scripts

docker compose up --build
