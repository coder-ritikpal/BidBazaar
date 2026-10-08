# BidBazaar

BidBazaar is a modern, real-time auction platform built with a microservices architecture. It allows users to list products, bid on live auctions, and manage orders with seamless real-time updates.

## Tech Stack

### Frontend
- **Framework**: React.js (Bootstrapped with Vite)
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM

### Backend
- **Framework**: Node.js & Express.js
- **Architecture**: Microservices
- **Database**: MongoDB (Mongoose)
- **Message Broker**: RabbitMQ (for asynchronous event-driven communication)
- **Authentication**: JWT, Google OAuth (Passport.js)

---

## System Architecture

The backend is split into multiple independent microservices to ensure scalability and separation of concerns:

1. **Dashboard Service (BFF)**: Acts as an API Gateway / Backend-for-Frontend, routing requests from the frontend to the appropriate microservices.
2. **Auth Service**: Manages user registration, login, JWT issuance, and Google OAuth.
3. **Inventory Service**: Manages product listings and product details.
4. **Features Service**: Handles the core auction logic, bidding, and cron jobs for resolving ended auctions.
5. **Cart Service**: Manages user carts and automatically creates orders when auctions are won.
6. **Payment Service**: Handles order payments and verification.
7. **Mail Service**: Listens for RabbitMQ events and sends emails (e.g., welcome emails, auction win notifications).

---

## Prerequisites

Before running the project locally, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas URL)
- [RabbitMQ](https://www.rabbitmq.com/) (Local server or CloudAMQP)

---

## Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/your-username/BidBazaar.git
cd BidBazaar
```

### 2. Frontend Setup
Navigate to the frontend directory, install dependencies, and setup your `.env`:
```bash
cd Frontend
npm install
```
Create a `.env` file in the `Frontend/` root (or `.env.development` / `.env.production`):
```env
VITE_API_URL_DASHBOARD=http://localhost:3004/api
VITE_API_URL_AUTH=http://localhost:3000/api
VITE_API_URL_FEATURES=http://localhost:3002/api
# Add other services as required
```

### 3. Backend Setup
Each microservice has its own `package.json` and `.env` file. You will need to install dependencies for each service.

```bash
# Example for Auth service
cd Backend/auth
npm install
```

Create a `.env` file in **each** microservice directory. Example for `Backend/auth/.env`:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/bidbazaar-auth
JWT_SECRET=your_jwt_secret_key
SESSION_SECRET=your_session_secret
RABBITMQ_URL=amqp://localhost
# ... Add specific service variables
```

---

## Running the Application

### Start the Frontend
```bash
cd Frontend
npm run dev
```
The frontend will typically run on `http://localhost:5173`.

### Start the Backend Services
You will need to run each microservice. You can either open multiple terminal tabs or use a tool like `concurrently` (if you set up a root package.json).
```bash
# Terminal 1
cd Backend/auth && npm start
# Terminal 2
cd Backend/dashboard && npm start
# Terminal 3
cd Backend/features && npm start
# ... and so on
```

---

## Testing

The backend contains extensive unit and end-to-end tests using Jest and MongoDB Memory Server.
To run tests in a specific service:
```bash
cd Backend/inventory
npm test
```

---

## License
MIT License
