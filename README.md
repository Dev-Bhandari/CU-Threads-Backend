# CU Threads Backend

CU Threads Backend is the server-side application for CU Threads, a social media platform designed for the Chandigarh University community. This backend handles user authentication, thread, post, comment creation, and other essential functionalities. It is built with Node.js, Express, and MongoDB.

## Features

- User authentication using JWT and email verification
- Thread, post, comment creation
- Upvote and downvote functionality
- Media upload support (images, videos) via cloudinary

## Technology Used

- Node.js
- Express.js
- MongoDB
  

## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/Dev-Bhandari/CU-Threads-Backend.git
    cd CU-Threads-Backend
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Create a `.env` file in the root directory and add the environment variables in .env.sample

4. Start the server:

    ```bash
    npm start
    ```

    The server will start on `http://localhost:3000`.

## API Endpoints

### Users

- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Log in an existing user
- `POST /api/users/verify-email` - Verify a user email
- `POST /api/users/get-new-link` - Sends a new verification link to user email
- `POST /api/users/refresh-token` - Generates a new access token
- `POST /api/users/change-password` - Changes user password
- `PATCH /api/users/change-avatar` - Changes user avatar
- `GET /api/users/get-current-user` - Gets current user Info

### Threads

- `POST /api/threads/create-thread` - Create a new thread
- `POST /api/threads/change-description/:threadName` - Changes the thread description
- `PATCH /api/threads/change-avatar/:threadName` - Changes the thread avatar
- `PATCH /api/threads/change-banner/:threadName` - Changes the thread banner
- `POST /api/threads/verify-member/:threadName` - Verify if a user is a member of the thread
- `POST /api/threads/create-member/:threadName` - Makes the user a member of the thread
- `DELETE /api/threads/delete-member/:threadName` - User is no longer a member of the thread
- `GET /api/threads/get-onethread/:threadName` - Gets info of one thread
- `GET /api/threads/get-threads` - Gets info of a list of threads
- `GET /api/threads/get-allthreads` - Gets info of all threads

### Posts

- `POST /api/posts/create-post/:threadName` - Create a new post for a thread
- `PATCH /api/posts/create-upvote` - Creates an upvote on  a post
- `PATCH /api/posts/delete-upvote` - Removes an upvote on  a post
- `PATCH /api/posts/create-downvote` - Creates a downvote on  a post
- `PATCH /api/posts/delete-downvote` - Removes a downvote on  a post
- `GET /api/posts/get-allposts/:threadName` - Gets all posts of a thread
- `GET /api/posts/get-allposts` - Gets all posts for home page

### Comments

- `POST /api/comments/create-comment` - Creates new comment for a post
- `GET /api/comments/get-allcomments` - Gets all comments of a post

## Folder Structure

```plaintext
CU-Threads-Backend/
├── config/           # Config files for database, nodemailer and server
├── controllers/      # Controllers for handling requests
├── models/           # Database models
├── routes/           # API routes
├── middleware/       # Custom middleware functions
├── utils/            # Utility functions
├── .env              # Environment variables
├── app.js            # Main application file
├── constants.js      # File contains constants
├── index.js          # Connects database and runs application
├── package.json      # Project dependencies and scripts
└── README.md         # Project documentation
```

## Contibuting 
Contributions are welcome! Please open an issue or submit a pull request for any bugs, feature requests, or improvements.

## License
This project is licensed under the MIT License. See the LICENSE file for details.

