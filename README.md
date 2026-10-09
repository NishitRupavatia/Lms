# Edemy — Learning Management System (LMS)

Edemy is a full-stack Learning Management System (LMS) designed to provide an interactive online learning experience for students and a course management platform for educators. The application supports course discovery, secure authentication, paid course enrollment, lecture-based learning, progress tracking, course ratings, and educator analytics.

Built using **React, Vite, Node.js, Express, MongoDB, Clerk, Cloudinary, and Stripe**, Edemy demonstrates the integration of modern frontend development, RESTful APIs, authentication, database management, media uploads, and online payment processing.

## Table of Contents

* [Overview](#overview)
* [Key Features](#key-features)
* [Technology Stack](#technology-stack)
* [Application Architecture](#application-architecture)
* [User Roles and Workflows](#user-roles-and-workflows)
* [Core Functionalities](#core-functionalities)
* [API Documentation](#api-documentation)
* [Project Structure](#project-structure)
* [Installation and Setup](#installation-and-setup)
* [Environment Configuration](#environment-configuration)
* [Running the Application](#running-the-application)
* [Authentication and Authorization](#authentication-and-authorization)
* [Payment and Enrollment Workflow](#payment-and-enrollment-workflow)
* [Course Media Management](#course-media-management)
* [Database Design](#database-design)
* [Error Handling and Development Considerations](#error-handling-and-development-considerations)
* [Production Deployment](#production-deployment)
* [Future Enhancements](#future-enhancements)
* [Author](#author)

## Overview

Edemy provides a centralized platform where learners can explore available courses, purchase courses, access lectures, track their learning progress, and rate completed learning experiences. Educators can publish courses, manage their course content, monitor student enrollments, and view dashboard statistics.

The project follows a client-server architecture:

* **Frontend:** React and Vite provide the interactive user interface.
* **Backend:** Node.js and Express expose RESTful APIs for application functionality.
* **Database:** MongoDB stores application data through Mongoose.
* **Authentication:** Clerk manages user authentication and role metadata.
* **Media Storage:** Cloudinary handles course thumbnail uploads.
* **Payment Processing:** Stripe Checkout manages course payments.

The application also includes development-friendly workflows for user synchronization, payment verification, and local thumbnail storage.

## Key Features

### Student Features

* Browse and discover published courses.
* View course details, descriptions, pricing, and lecture information.
* Authenticate securely using Clerk.
* Purchase courses through Stripe Checkout.
* Access enrolled courses and their lectures.
* Track completed lectures and course progress.
* Submit ratings for enrolled courses.
* View personal learning and enrollment information.

### Educator Features

* Switch to educator mode through the application interface.
* Access a dedicated educator dashboard.
* Create and publish courses.
* Upload course thumbnails.
* Organize course content into lectures.
* Manage courses created by the educator.
* View course earnings and enrollment statistics.
* Review enrolled students and completed purchases.

### Backend and Infrastructure Features

* RESTful API architecture.
* MongoDB persistence with Mongoose.
* Authentication and protected API endpoints.
* Role-based authorization for educator functionality.
* Stripe payment verification and enrollment completion.
* Clerk user synchronization.
* Cloudinary integration for course thumbnails.
* Local thumbnail upload fallback during development.
* Webhook support for Clerk and Stripe.
* Health endpoint for basic service and database diagnostics.
* Separate frontend and backend configuration.

## Technology Stack

| Technology   | Purpose                                         |
| ------------ | ----------------------------------------------- |
| React        | Component-based frontend development            |
| Vite         | Frontend development server and build tooling   |
| React Router | Client-side navigation                          |
| Tailwind CSS | Utility-first styling                           |
| Node.js      | Backend JavaScript runtime                      |
| Express.js   | REST API and server-side routing                |
| MongoDB      | NoSQL database                                  |
| Mongoose     | MongoDB object modeling                         |
| Clerk        | Authentication and user metadata                |
| Stripe       | Payment processing and Checkout                 |
| Cloudinary   | Course thumbnail storage                        |
| Multer       | Multipart file upload handling                  |
| Axios        | HTTP communication between frontend and backend |
| Svix         | Webhook signature verification                  |
| dotenv       | Environment variable management                 |
| Nodemon      | Backend development auto-restart                |
| Concurrently | Running frontend and backend together           |

## Application Architecture

Edemy uses a client-server architecture in which the React frontend communicates with the Express backend through HTTP requests.

```text
                    Student / Educator
                            |
                            v
                  React + Vite Frontend
                            |
                  React Router / Axios
                            |
                            v
                   Express REST API
                            |
             +--------------+--------------+
             |              |              |
             v              v              v
         MongoDB          Clerk          Stripe
       (Mongoose)    Authentication    Payments
                            |
                            v
                        Cloudinary
                   Course Thumbnail Media
```

### Request Flow

1. A user interacts with the React frontend.
2. The frontend sends an HTTP request to the appropriate backend endpoint.
3. Clerk authentication middleware verifies the authenticated session for protected operations.
4. The backend checks the required permissions, such as educator access.
5. Mongoose reads or updates application data in MongoDB.
6. External services such as Stripe and Cloudinary are invoked when necessary.
7. The backend returns a response to the frontend.
8. The frontend updates the interface based on the response.

## User Roles and Workflows

### Student Workflow

1. Sign in to the application.
2. Browse available courses.
3. Open a course to review its details.
4. Purchase the course through Stripe Checkout.
5. Complete the payment.
6. Return to the application, where payment verification completes enrollment.
7. Access enrolled courses and lectures.
8. Mark lectures as completed and monitor progress.
9. Rate an enrolled course.

### Educator Workflow

1. Sign in using Clerk.
2. Select **Become Educator** from the navigation bar.
3. The backend updates the user's Clerk public metadata with the educator role.
4. Access the educator dashboard.
5. Create a course and provide the required course information.
6. Upload the course thumbnail and configure lecture content.
7. Publish the course.
8. Review course details, student enrollments, and dashboard statistics.

### Role-Based Access

| Role                  | Permissions                                                                            |
| --------------------- | -------------------------------------------------------------------------------------- |
| Public visitor        | Browse published courses and view course details                                       |
| Authenticated student | Access personal data, enrollments, progress, purchases, and ratings                    |
| Educator              | Create and manage owned courses, view educator analytics, and review enrolled students |

Protected operations are enforced by the backend rather than relying solely on frontend navigation.

## Core Functionalities

### 1. Course Discovery and Details

The course discovery functionality retrieves published courses from the backend. Users can browse the available catalog and inspect individual course information.

The course detail endpoint avoids exposing paid lecture URLs to unauthorized visitors.

### 2. Authentication and User Synchronization

Clerk provides the authentication infrastructure and user session management.

When an authenticated user accesses a protected backend route, the application can synchronize the user's information with MongoDB. This reduces reliance on a publicly reachable Clerk webhook during local development.

### 3. Course Creation and Publishing

Educators can submit course information and thumbnail files through the educator API.

The backend processes multipart uploads, stores the media through Cloudinary when configured, and persists the relevant course information in MongoDB.

### 4. Online Payments

Stripe Checkout provides the payment interface for course purchases.

The backend creates the Checkout session, verifies the completed payment, and updates enrollment records. Payment verification is performed server-side rather than trusting a frontend success message.

### 5. Learning Progress Tracking

Students can retrieve enrolled courses and update lecture completion status.

The application stores course progress and exposes endpoints to retrieve completed lectures and update progress as students move through the learning material.

### 6. Course Ratings

Authenticated students can submit ratings for enrolled courses. The backend provides the corresponding rating endpoint so that course feedback can be associated with the relevant user and course.

### 7. Educator Dashboard and Analytics

The educator dashboard provides information such as earnings, course totals, and enrollment totals.

Educators can also retrieve their own courses and inspect student enrollment information associated with completed purchases.

## API Documentation

The backend exposes RESTful endpoints under the `/api` namespace, along with health-check and webhook endpoints.

### General and Course APIs

| Method | Endpoint          | Access | Description                                                      |
| ------ | ----------------- | ------ | ---------------------------------------------------------------- |
| GET    | `/health`         | Public | Returns basic application configuration and database diagnostics |
| GET    | `/api/course/all` | Public | Retrieves published courses                                      |
| GET    | `/api/course/:id` | Public | Retrieves an individual course while filtering paid lecture URLs |

### Student APIs

| Method | Endpoint                           | Access             | Description                                                   |
| ------ | ---------------------------------- | ------------------ | ------------------------------------------------------------- |
| GET    | `/api/user/data`                   | Authenticated user | Retrieves or synchronizes the current user's database record  |
| GET    | `/api/user/enrolled-courses`       | Authenticated user | Retrieves enrolled courses and associated lecture information |
| POST   | `/api/user/purchase`               | Authenticated user | Creates a Stripe Checkout session                             |
| POST   | `/api/user/verify-purchase`        | Authenticated user | Verifies payment and completes enrollment                     |
| POST   | `/api/user/get-course-progress`    | Authenticated user | Retrieves completed lecture information for a course          |
| POST   | `/api/user/update-course-progress` | Authenticated user | Updates lecture completion status                             |
| POST   | `/api/user/add-rating`             | Authenticated user | Submits a course rating                                       |

### Educator APIs

| Method | Endpoint                          | Access             | Description                                                          |
| ------ | --------------------------------- | ------------------ | -------------------------------------------------------------------- |
| GET    | `/api/educator/update-role`       | Authenticated user | Updates the current user's educator role                             |
| POST   | `/api/educator/add-course`        | Educator           | Creates or publishes a course using multipart form data              |
| GET    | `/api/educator/courses`           | Educator           | Retrieves courses owned by the educator                              |
| GET    | `/api/educator/dashboard`         | Educator           | Retrieves educator dashboard statistics                              |
| GET    | `/api/educator/enrolled-students` | Educator           | Retrieves enrollment and student information for completed purchases |

### Webhook APIs

| Method | Endpoint  | Access                  | Description                     |
| ------ | --------- | ----------------------- | ------------------------------- |
| POST   | `/clerk`  | Verified Clerk webhook  | Processes Clerk webhook events  |
| POST   | `/stripe` | Verified Stripe webhook | Processes Stripe payment events |

**Note:** Protected endpoints require the appropriate authenticated session and permissions. Webhook endpoints require valid signatures when webhook processing is enabled. Request payloads and response structures depend on the implementation of each route.

## Project Structure

The repository is organized into a root project directory containing separate frontend and backend applications.

```text
Lms/
|
|-- client/
|   |-- public/
|   |-- src/
|   |   |-- assets/
|   |   |-- components/
|   |   |-- context/
|   |   |-- pages/
|   |   |-- App.jsx
|   |   |-- main.jsx
|   |-- .env.example
|   |-- package.json
|   |-- vite.config.js
|
|-- server/
|   |-- configs/
|   |-- controllers/
|   |-- middlewares/
|   |-- models/
|   |-- routes/
|   |-- utils/
|   |-- uploads/
|   |-- .env.example
|   |-- package.json
|   |-- server.js
|
|-- package.json
|-- README.md
```

The directory tree above illustrates the intended separation of concerns; individual filenames and subdirectories may vary with the current repository contents.

### Frontend Responsibilities

* Rendering application pages and reusable UI components.
* Handling client-side navigation.
* Managing authentication-aware user interactions.
* Calling backend APIs.
* Displaying course details and learning progress.
* Integrating the payment redirect workflow.

### Backend Responsibilities

* Defining API routes and request handling.
* Authenticating users and enforcing access control.
* Managing MongoDB records.
* Creating and publishing courses.
* Processing file uploads.
* Creating and verifying payment sessions.
* Managing course enrollment and progress.
* Processing external service webhooks.

## Installation and Setup

### Prerequisites

Ensure the following are available before running the project:

* Node.js 18 or later.
* npm.
* A MongoDB database, either local or MongoDB Atlas.
* A Clerk application.
* A Stripe account with test API keys.
* A Cloudinary account for hosted course thumbnails.

### 1. Clone the Repository

```bash
git clone https://github.com/NishitRupavatia/Lms.git
cd Lms
```

### 2. Install Dependencies

From the project root, run:

```bash
npm run install:all
```

This installs the root dependencies and the dependencies for both the frontend and backend.

### 3. Configure Environment Variables

Create environment files from the provided templates.

On Windows Command Prompt:

```bat
copy server\.env.example server\.env
copy client\.env.example client\.env
```

On PowerShell:

```powershell
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env
```

On macOS or Linux:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Open the generated files and replace the placeholder values with your own service credentials.

## Environment Configuration

### Backend: `server/.env`

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net

CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key
CLERK_SECRET_KEY=sk_test_your_secret_key
CLERK_WEBHOOK_SECRET=whsec_your_clerk_webhook_secret

CLOUDINARY_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_SECRET_KEY=your_cloudinary_api_secret

STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret

CURRENCY=INR
PORT=5000
```

**Configuration notes:**

* `MONGODB_URI` should contain the MongoDB connection string without the database name, because the application appends `/lms`.
* Clerk webhook configuration is needed when processing Clerk webhook events.
* Stripe webhook configuration is needed when processing Stripe webhook events.
* Use Stripe test keys for development.
* Keep all secret keys in the backend environment only.
* Do not commit `.env` files or expose credentials in source code.

### Frontend: `client/.env`

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key

VITE_CURRENCY=$

VITE_BACKEND_URL=http://localhost:5000
```

**Configuration notes:**

* `VITE_CLERK_PUBLISHABLE_KEY` must match the Clerk application used by the backend.
* `VITE_CURRENCY` controls the currency symbol displayed by the frontend.
* `VITE_BACKEND_URL` must point to the running Express API.
* Vite exposes variables prefixed with `VITE_` to client-side code. Never place secret keys in these variables.

## Running the Application

### Start Frontend and Backend Together

From the root directory:

```bash
npm run dev
```

The root development script runs the frontend and backend concurrently.

Default local addresses:

| Service         | URL                            |
| --------------- | ------------------------------ |
| Frontend        | `http://localhost:5173`        |
| Backend API     | `http://localhost:5000`        |
| Health endpoint | `http://localhost:5000/health` |

### Run Services Separately

Start the backend:

```bash
npm run server
```

Start the frontend in another terminal:

```bash
npm run client
```

### Build the Frontend

To generate a production frontend build:

```bash
cd client
npm run build
```

To preview the generated build locally:

```bash
npm run preview
```

## Authentication and Authorization

Edemy uses Clerk to manage authentication and user metadata.

### Authentication Flow

1. The user signs in through the Clerk frontend integration.
2. The frontend obtains the authenticated session.
3. Protected API requests are authenticated through the backend's Clerk integration.
4. The backend synchronizes the user record with MongoDB when necessary.
5. The API returns data according to the user's permissions.

### Educator Role Management

The educator role is stored in Clerk's public user metadata.

When the user selects **Become Educator**, the application calls:

```http
GET /api/educator/update-role
```

The backend updates the user's role to `educator`, allowing access to educator-specific operations.

Authorization must be validated on the server for every protected operation. Hiding educator pages in the frontend alone is not sufficient to secure the application.

## Payment and Enrollment Workflow

Stripe Checkout is used to process paid course enrollments.

### Purchase Lifecycle

1. An authenticated student selects a course to purchase.
2. The frontend calls `POST /api/user/purchase`.
3. The backend creates a Stripe Checkout session.
4. The student completes the payment through Stripe.
5. Stripe redirects the browser back to the application.
6. The application sends the Checkout session ID to `POST /api/user/verify-purchase`.
7. The backend verifies the session with Stripe and completes the enrollment.
8. The student can access the enrolled course.

### Idempotent Enrollment Completion

The application supports both Stripe webhook processing and browser-return verification.

A shared `completePurchase` helper is used to make enrollment completion idempotent. This helps prevent duplicate enrollments when the same successful payment is processed through multiple paths.

For local development, the browser-return flow allows payment verification without requiring a publicly accessible webhook URL.

**Important:** The backend must independently verify payment status with Stripe. A successful browser redirect alone must never be treated as proof of payment.

## Course Media Management

Course thumbnails are uploaded through the educator course creation endpoint.

The application supports two storage paths:

1. **Cloudinary:** Preferred for hosted media storage and production use.
2. **Local upload fallback:** Used during development when Cloudinary is not configured or an upload fails.

During local development, uploaded files can be served through the backend at:

```text
/uploads/<filename>
```

The local upload fallback is disabled on Vercel because its filesystem is not suitable for persistent user-uploaded files.

For production deployments, configure Cloudinary correctly and use hosted storage rather than relying on local filesystem persistence.

## Database Design

MongoDB is used as the primary application database, with Mongoose providing schema definitions and database interaction.

The application's data model supports the following logical entities:

| Entity                | Responsibility                                                            |
| --------------------- | ------------------------------------------------------------------------- |
| User                  | Stores application-level user information synchronized with Clerk         |
| Course                | Stores course details, pricing, publication information, and lecture data |
| Enrollment / Purchase | Represents student enrollment associated with a completed purchase        |
| Course Progress       | Tracks completed lectures for a student and course                        |
| Course Rating         | Stores student feedback and course ratings                                |

These entities describe the application's functional data domains. Their exact schemas, field names, and collection relationships are defined in the backend model implementations.

## Error Handling and Development Considerations

### Database Connectivity

Use the `/health` endpoint to inspect basic configuration and database diagnostics when troubleshooting the backend.

Confirm that the MongoDB connection string is valid and that the database is reachable from the development environment.

### Cloudinary Upload Failures

If Cloudinary returns a `403` error indicating insufficient permissions, verify the API key's upload permissions and the account's configuration.

Local development can use the upload fallback, but production should use properly configured persistent media storage.

### Webhook Configuration

Webhook endpoints require valid signatures. When using webhooks locally, configure a supported forwarding mechanism, such as the Stripe CLI for Stripe events, and use the corresponding signing secret.

The browser-return payment verification and Clerk session-based user synchronization paths reduce dependence on externally reachable webhooks during local development.

### Port Configuration

The backend uses port `5000` by default, and Vite normally starts on port `5173`. If the frontend port is occupied, Vite may select another port.

Ensure `VITE_BACKEND_URL` points to the correct backend address.

## Production Deployment

For a production deployment, configure the frontend and backend as separate services or use an architecture appropriate for the hosting provider.

### Frontend

* Build the React application using `npm run build`.
* Configure the production backend URL.
* Configure the correct Clerk publishable key.
* Ensure the deployed frontend origin is allowed in Clerk's configuration.

### Backend

* Configure MongoDB connectivity.
* Set all required server-side environment variables.
* Configure Clerk authentication and webhook verification.
* Configure Stripe credentials and webhook handling.
* Configure Cloudinary for course media uploads.
* Restrict cross-origin requests to trusted frontend origins.
* Enable appropriate production logging and error handling.

### Payment and Security Checks

Before accepting real payments:

* Switch from Stripe test credentials to the appropriate live credentials.
* Configure and verify production webhook endpoints.
* Confirm server-side payment verification.
* Prevent duplicate enrollment processing.
* Verify user ownership and educator permissions.
* Ensure private lecture URLs and secret keys are never exposed to unauthorized users.

## Future Enhancements

Potential improvements to the project include:

* Course search, filtering, and category-based discovery.
* More advanced learning analytics and progress visualizations.
* Course completion certificates.
* Student reviews and educator feedback dashboards.
* Course wishlists and personalized recommendations.
* Administrative dashboards for platform management.
* Automated backend and frontend testing.
* API documentation through Swagger or OpenAPI.
* Improved logging, monitoring, and deployment automation.

These are possible future additions and are not claims about the current implementation.

## Author

**Nishit Rupavatia**

GitHub: [NishitRupavatia](https://github.com/NishitRupavatia)

Project Repository: [Edemy — Learning Management System](https://github.com/NishitRupavatia/Lms)

---

## License

This project currently uses the license configuration present in its repository. Refer to the repository's license file or package metadata for applicable terms before redistributing or reusing the code.
