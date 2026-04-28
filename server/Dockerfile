# Use the official Playwright image which includes all browser dependencies
FROM mcr.microsoft.com/playwright:v1.49.0-jammy

# Set working directory
WORKDIR /app

# Copy package files from the server directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the server code
COPY . .

# Build the project (compiles TypeScript to JavaScript)
RUN npm run build

# Expose the port the app runs on
EXPOSE 3001

# Start the server
CMD ["npm", "start"]
