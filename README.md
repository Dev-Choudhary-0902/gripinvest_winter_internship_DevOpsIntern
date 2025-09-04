Fruits Project – Dockerized Deployment

About the Project:
Fruits is a simple full-stack application (frontend + backend).  
I picked up this existing project as a base to practice and demonstrate DevOps containerization workflows. My primary focus was not on developing the application itself, but on making it production-ready using Docker.

My Contribution:
I handled the DevOps side of the project by:
- Writing clean and efficient Dockerfiles for both frontend and backend services.
- Building Docker images and ensuring smooth containerization.
- Running the application in isolated containers to verify consistency and portability.
- Simplifying the deployment process so the project can run anywhere without dependency issues.

Why Docker?
Using Docker allowed me to:
- Standardize environments and remove compatibility issues.
- Streamline deployment across different systems.
- Learn how to build and optimize Docker images for multi-service apps.
- Strengthen my understanding of containerization, networking, and DevOps workflows.

Key Learnings
- Writing Dockerfiles from scratch for frontend and backend.
- Building and tagging images effectively.
- Managing containers and service communication.
- Gaining hands-on experience with real-world deployment practices.

What it taught me?
This project gave me practical exposure to Docker and DevOps fundamentals and helped me understand how to take an existing codebase and transform it into a portable, easily deployable application.

How to Run (with Docker)

1. Build Images
docker build -t image1 ./backend
docker build -t image ./frontend

2. Create a Docker Network (for container communication)
docker network create fruits-net

3. Run Containers
# Run backend container on port 8800 with MongoDB URL
docker run -d --name fruits-backend --network fruits-net -p 8800:8800 \
  -e URL="mongodb+srv://rajendra0968jangid:Rajendra0968@cluster0.wyu84.mongodb.net/myfruits" \
  -e PORT=8800 \
  image1

# Run frontend container on port 5173 with backend URL
docker run -d --name fruits-frontend --network fruits-net -p 5173:5173 \
  -e VITE_BACKEND_URL=http://fruits-backend:8800 \
  image

4. Access the App
Frontend: http://localhost:5173  
Backend: http://localhost:8800
