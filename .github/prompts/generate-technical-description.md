## Objective
Generate a comprehensive technical description for a full-stack application based on the provided User Story and Implementation Plan below.

## Context & Constraints
*   **Application Type:** [e.g., Single Page Application (SPA), Mobile-First Web App]
*   **Core User Goal:** [e.g., Allow users to track their daily habits with a calendar view.]
*   **Key Technical Constraint:** [e.g., Must be simple to deploy, use a SQLite database for simplicity.]

## Source Materials
**User Story:**
"As a user, I want to log my daily workouts, including type, duration, and intensity, so that I can track my progress over time in a visual dashboard."

**Implementation Plan:**
1.  Set up a React frontend with Vite.
2.  Create a Node.js/Express backend API.
3.  Design a SQLite database schema for workouts.
4.  Implement CRUD endpoints for workout data.
5.  Build a form in React to create new workouts.
6.  Build a dashboard component with a chart to visualize progress.

## Technical Description Request
Please structure the technical description with the following sections:

1.  **Application Overview:** A brief summary of the application's purpose and architecture.
2.  **Technology Stack:** Specify the proposed technologies for the frontend, backend, and database.
3.  **Project Folder Structure:** Outline the key directories and files for the project. Use a tree format for clarity.
4.  **Data Models:** Define the core data entities and their properties (e.g., `Workout` model with `id`, `type`, `date`, `duration_minutes`, `intensity`).
5.  **API Endpoint Specification:** List the key RESTful API endpoints (Method, Path, Description). For example:
    *   `POST /api/workouts` - Creates a new workout.
    *   `GET /api/workouts` - Retrieves a list of all workouts for the dashboard.
6.  **Frontend Component Hierarchy:** Outline the main React components and their relationship (e.g., `App` -> `Dashboard` -> `WorkoutList` & `WorkoutChart` & `AddWorkoutForm`).

### 3. Project Folder Structure

STEPPERGO/
├── client/ # React frontend
│ ├── public/
│ │ └── index.html
│ ├── src/
│ │ ├── components/
│ │ │ ├── Dashboard/
│ │ │ │ ├── Dashboard.jsx
│ │ │ │ └── Dashboard.css
│ │ │ ├── WorkoutList/
│ │ │ │ ├── WorkoutList.jsx
│ │ │ │ └── WorkoutList.css
│ │ │ ├── WorkoutChart/
│ │ │ │ ├── WorkoutChart.jsx
│ │ │ │ └── WorkoutChart.css
│ │ │ └── AddWorkoutForm/
│ │ │ ├── AddWorkoutForm.jsx
│ │ │ └── AddWorkoutForm.css
│ │ ├── services/ # API service functions
│ │ │ └── api.js
│ │ ├── App.jsx
│ │ ├── App.css
│ │ └── main.jsx
│ ├── package.json
│ └── vite.config.js
├── server/ # Node.js/Express backend
│ ├── controllers/
│ │ └── workoutController.js
│ ├── models/
│ │ └── Workout.js # Database model and schema
│ ├── routes/
│ │ └── workoutRoutes.js
│ ├── data/
│ │ └── database.db # SQLite database file
│ ├── package.json
│ └── server.js # Main server entry point
└── README.md

