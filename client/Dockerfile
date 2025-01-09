# Use the official Node.js 20 LTS image as the base image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Build the Remix app
RUN npm run build

# Expose the port the app runs on
EXPOSE 5173

# Start the Remix development server
CMD ["npm", "run", "dev"]
