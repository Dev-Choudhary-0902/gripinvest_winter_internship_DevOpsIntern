# Product Requirements Document (PRD)

**Project Title:** Grip Invest - Mini Investment Platform

**Version:** 1.0

**Project Goal:**
To develop a full-stack, AI-enhanced mini investment platform for interns to demonstrate their skills in backend, frontend, and DevOps. The platform will simulate core features of an investment service, including user authentication, product management, and portfolio tracking.

---

### 1. Backend Requirements

**1.1. User Authentication**
* **API Endpoints:**
    * `POST /api/auth/signup`: User registration.
    * `POST /api/auth/login`: User login.
    * `POST /api/auth/password-reset`: Initiates password reset (OTP/email).
* **AI Integration:** The signup endpoint will provide real-time feedback on password strength and suggestions for improvement (e.g., "Add a number," "Use a special character").

**1.2. Investment Products CRUD**
* **API Endpoints:**
    * `POST /api/products` (Admin only): Create a new product.
    * `PUT /api/products/:id` (Admin only): Update an existing product.
    * `DELETE /api/products/:id` (Admin only): Delete a product.
    * `GET /api/products`: Fetch a list of all products.
* **AI Integration:**
    * **Auto-generation:** A field in the product creation request will be sent to an AI model to generate a descriptive text for the `description` field.
    * **Recommendations:** A `GET /api/products/recommendations` endpoint will use an AI algorithm to suggest products based on the authenticated user's `risk_appetite` and historical data.

**1.3. Investments**
* **API Endpoints:**
    * `POST /api/investments`: User invests in a product. Business rules must be applied (e.g., check user balance).
    * `GET /api/investments/portfolio`: Fetch the authenticated user's investment portfolio.
* **AI Integration:** The portfolio endpoint will include an AI-generated summary of the user's portfolio, highlighting risk distribution and offering diversification advice.

**1.4. Transaction Logger**
* **API Endpoints:**
    * `GET /api/logs/user/:userId`: Fetch logs for a specific user.
    * `GET /api/logs/summary/:userId`: Fetch an AI-generated summary of errors for a user.
* **Functionality:** Every API call (including failures) will be logged in the `transaction_logs` table.

**1.5. Testing**
* **Tool:** Jest.
* **Coverage:** Minimum of 75% unit test coverage for all backend modules.

---

### 2. Frontend Requirements

**2.1. User Interface (UI)**
* **Design:** Clean, minimalist, and user-friendly. Responsive design is a must.
* **Pages:**
    * **Landing Page:** Simple welcome screen with links to Login and Signup.
    * **Authentication:** Signup/Login forms with a live password strength meter and AI feedback.
    * **Dashboard:** A snapshot of total portfolio value, investment count, and a dedicated card for AI-powered insights. 
    * **Products:** A page to browse products with filtering options and a prominent "AI Recommendations" button.
    * **Investments:** A form to invest in a product and a detailed portfolio page with charts (using Recharts or Chart.js) and an AI summary.
    * **Transaction Logs:** A filterable table displaying API logs, with an option to view the AI-summarized error report.
    * **Profile:** A page to view/update user details and risk appetite, which influences AI recommendations.

**2.2. Technology Stack**
* **Framework:** React.js/Next.js.
* **Styling:** TailwindCSS or Material UI.
* **Charts:** Recharts or Chart.js.
* **Authentication:** JWT for handling secure sessions.
* **Testing:**
    * **Tool:** Jest and React Testing Library (RTL).
    * **Coverage:** Minimum of 75% unit test coverage.

---

### 3. DevOps Requirements

**3.1. Containerization**
* **Backend:** `Dockerfile` for the Node.js backend.
* **Frontend:** `Dockerfile` for the Next.js/React.js frontend.
* **Database:** Use an official MySQL image.
* **Orchestration:** A `docker-compose.yml` file to run all three services (`backend`, `frontend`, `mysql`) together.

**3.2. Health Checks and Logging**
* The backend will expose a `/health` endpoint to check its status and the database connection.
* All container logs must be accessible via `docker logs`.

**3.3. Documentation**
* A `README.md` file will be provided with comprehensive instructions on:
    * How to run the application using Docker Compose.
    * How to seed the database with initial data.
    * How to access the frontend and backend services.
    * A dedicated section outlining how AI was used in the project and its benefits.

---

### 4. Deliverables

* **1. Working backend APIs with Postman collection.**
* **2. Fully functional frontend integrated with backend APIs.**
* **3. SQL schema + seed data.**
* **4. Logs and monitoring endpoints.**
* **5. Docker setup (backend, frontend, MySQL).**
* **6. Documentation (README + AI usage notes).**