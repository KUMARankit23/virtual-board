# Virtual Board

A collaborative virtual whiteboard application built with a React frontend and Node.js backend. Draw, annotate, and collaborate in real-time!

## Features

- 🖊️ Draw and annotate on a shared board
- 🔒 User authentication (register/login)
- 💬 Real-time collaboration (multiple users)
- 💾 Session-based storage
- 🎨 Multiple drawing tools and colors

## Demo

> _Add a screenshot or GIF here if you have one!_

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm (comes with Node.js)
- MongoDB (local or cloud)

### Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/KUMARankit23/virtual-board.git
   cd virtual-board
   ```

2. **Install dependencies:**
   ```sh
   cd backend
   npm install
   cd ../frontend
   npm install
   ```

3. **Set up environment variables:**
   - Create a `.env` file in the `backend` directory with your MongoDB URI and any secrets you need:
     ```
     MONGO_URI=your_mongodb_connection_string
     JWT_SECRET=your_jwt_secret
     ```

4. **Run the app:**
   - In one terminal, start the backend:
     ```sh
     cd backend
     npm run dev
     ```
   - In another terminal, start the frontend:
     ```sh
     cd frontend
     npm start
     ```

5. **Open your browser:**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend: [http://localhost:5000](http://localhost:5000)

## Folder Structure

```
virtual-board/
  ├── backend/   # Node.js/Express/MongoDB API
  └── frontend/  # React app
```

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](LICENSE)

---

> Made with ❤️ by [KUMARankit23](https://github.com/KUMARankit23) 