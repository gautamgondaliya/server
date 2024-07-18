# Use Node.js 21 as the base image
FROM node:21-alpine AS build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose port 5000 (or the port your backend uses)
EXPOSE 5000

# Start the backend application
CMD ["npm","run","dev"]
