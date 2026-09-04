# ☕ Brewed

Brewed is a **MERN stack** web application built with MongoDB, Express.js, React, and Node.js.

The project is structured into separate **frontend** and **backend** applications, each with its own dependencies and configuration.

---

## 🛠️ Tech Stack

### Frontend

- **React.js** — UI library
- **Tailwind CSS** — Utility-first CSS framework
- **DaisyUI** — Tailwind CSS component library
- **Axios** — HTTP client for API requests
- **Lucide React** — Icon library
- **React Router DOM** — Client-side routing
- **React Hot Toast** — Toast notifications

### Backend

- **Node.js** — JavaScript runtime
- **Express.js** — Backend web framework
- **MongoDB** — Database
- **Mongoose** — MongoDB ODM
- **JSON Web Token (JWT)** — Authentication
- **Cookie Parser** — Cookie handling
- **CORS** — Cross-origin resource sharing
- **Dotenv** — Environment variable management
- **Multer** — File upload handling

---

## 📁 Project Structure

```text
brewed/
├── backend/
│   ├── src/
│   ├── package.json
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Webiverse-Labs/brewed.git
cd brewed
```

### 2. Install Backend Dependencies

Navigate to the backend directory:

```bash
cd backend
```

Install all required dependencies:

```bash
npm install
```

You **do not need to install each dependency individually**. `npm install` reads the `package.json` file and installs all dependencies listed there.

### 3. Configure Backend Environment Variables

Create a `.env` file inside the `backend` directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Add any additional environment variables required by the application.

> **Important:** Never commit your `.env` file to Git. Make sure `.env` is included in `.gitignore`.

---

### 4. Start the Backend

From the `backend` directory:

```bash
npm run dev
```

The backend should start on the configured port, for example:

```text
http://localhost:4000
```

---

### 5. Install Frontend Dependencies

Open a new terminal and navigate to the frontend:

```bash
cd frontend
```

Install all frontend dependencies:

```bash
npm install
```

Again, `npm install` automatically installs everything specified in the frontend's `package.json`.

---

### 6. Start the Frontend

```bash
npm run dev
```

The frontend will usually be available at:

```text
http://localhost:5173
```

---

## 📦 Dependencies

The project's dependencies are defined in their respective `package.json` files.

### Backend Dependencies

```text
cookie-parser
cors
dotenv
express
jsonwebtoken
mongoose
multer
```

### Frontend Dependencies

```text
react
tailwindcss
daisyui
axios
lucide-react
react-router-dom
react-hot-toast
```

You generally **should not manually install these one by one** when setting up the project. Running `npm install` inside each project directory is enough.

For example:

```bash
cd backend
npm install

cd ../frontend
npm install
```

---

## 🔐 Environment Variables

Environment variables are used to store configuration and sensitive information.

The backend requires a `.env` file.

Example:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Do not share or commit real credentials, secrets, or database connection strings.

For new contributors, consider providing a `.env.example` file:

```env
PORT=5000
MONGODB_URI=
JWT_SECRET=
```

They can then create their own `.env` based on it.

---

## 🧑‍💻 Development Workflow

After cloning the project:

**Terminal 1 — Backend**

```bash
cd backend
npm install
npm run dev
```

**Terminal 2 — Frontend**

```bash
cd frontend
npm install
npm run dev
```

Both applications need to be running during development.

---

## 📝 Notes

- Run `npm install` whenever dependencies are added or changed.
- Keep `package.json` and `package-lock.json` committed to the repository.
- Do not commit `.env` files.
- Make sure MongoDB is available and the connection string is correctly configured.
- The frontend communicates with the backend through API requests.

---

## 📌 Project Status

🚧 **Brewed is currently under development.**

More features, API endpoints, authentication, database models, and UI components will be added as development continues.

---

## 👥 Contributors

Enriquez, Shan - Frontend Developer
Juanitez, James - Backend Developer
Pangilinan, Rodge - Project Manager and QA
Quintela, Wion - Tech Lead and Fullstack Developer
Seraspe, Ren - Fullstack Developer

---
