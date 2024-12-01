## File Management System - README

### Project Overview

This project provides a file management system where users can upload, download, list, and delete files. The system uses Express.js to handle API requests and Multer for file uploads. It integrates with a MySQL database to track uploaded files and their metadata, and supports functionalities like file listing, deletion, and fetching download tokens.

### Features:

- **File Upload**: Upload files to user-specific directories.
- **File Download**: Download files by providing a valid token.
- **File Listing**: List files and directories in a user-defined folder.
- **File Deletion**: Delete files or entire directories.
- **Token-based Authentication**: Use unique tokens for secure file access.

### Tech Stack:

- **Backend**: Node.js, Express.js
- **File Handling**: Multer
- **Database**: MySQL (for storing file metadata)
- **File Storage**: Local filesystem (in `uploads/` directory)
- **Authentication**: Token-based system

---

### Installation Instructions

#### Prerequisites

- Node.js (>=14.x.x)
- MySQL
- NPM or Yarn

#### 1. Clone the repository

```bash
git clone https://github.com/Equation-Tracker/custom_cloud.git
cd custom_cloud
```

#### 2. Install dependencies

Run the following command to install the required dependencies:

```bash
npm install
```

#### 3. Set up MySQL Database

Create a MySQL database and run the following SQL commands to set up the required tables.

```sql
CREATE DATABASE file_management;

USE file_management;

CREATE TABLE tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(255) NOT NULL,
    fileName VARCHAR(255) NOT NULL,
    fullPath VARCHAR(255) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4. Configure Database Connection

Edit the `config.js` file to configure your MySQL connection:

```js
import mysql from "mysql2/promises";

export const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "yourpassword",
  database: "file_management",
});
```

#### 5. Run the Application

To start the server, run:

```bash
npm start
```

The server will be running on `http://localhost:4000`.

---

### API Endpoints

#### 1. **File Upload**

- **URL**: `POST /upload`
- **Description**: Upload a file to the server.
- **Headers**:
  - `filePath`: User-defined path to store the file.
- **Body**: Form-data with the file field (name `file`).

#### 2. **File Download**

- **URL**: `POST /download/:fileName`
- **Description**: Download a file by providing the file name and a valid token.
- **Body**: JSON with the token.

#### 3. **List Files**

- **URL**: `POST /listFiles`
- **Description**: List all files in the root directory (`uploads/`).
- **Body**: None

#### 4. **List Files in Directory**

- **URL**: `POST /listFiles/:dirName`
- **Description**: List files in a specific directory.
- **Body**: None

#### 5. **Delete File/Directory**

- **URL**: `POST /delete`
- **Description**: Delete a file or directory.
- **Body**: JSON with the path of the file or directory to be deleted.

#### 6. **Get File Token**

- **URL**: `POST /getToken`
- **Description**: Retrieve a token to access a file.
- **Body**: JSON with the `path` of the file.

---

### Frontend Instructions

#### 1. File Upload:

The frontend sends a POST request to `/upload` to upload a file. The file is uploaded using `FormData` and headers are sent to specify the path for storage.

#### 2. File Listing:

The frontend lists the files from the server by sending a POST request to `/listFiles`. It dynamically renders the file structure and allows the user to navigate through directories and view file names.

#### 3. File Download:

To download a file, the frontend sends a POST request to `/getToken` with the file path to obtain a valid token. This token is then appended to the download URL for secure access.

#### 4. File Deletion:

The frontend provides an option to delete a file or directory. It sends a POST request to `/delete` with the path of the file or directory to be deleted.

---

## Project Structure

```
|-- uploads/                  # File storage directory
|-- config.js                 # Database configuration
|-- server.js                 # Main server file
|-- package.json              # Project metadata
|-- README.md                 # Documentation
```

---

### Troubleshooting

1. **CORS Issues**: If you're encountering CORS-related errors, make sure that the frontend is running on a different port than the backend and ensure the backend has the correct CORS settings.

2. **Missing Files or Directories**: Make sure that the `uploads/` directory exists and that it has the appropriate permissions for file storage.

3. **Database Issues**: Ensure that MySQL is running and the database schema is set up correctly. Check the database connection settings in `config.js`.
