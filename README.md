# File Management System

This project is a file management system with functionalities like uploading, downloading, listing, and deleting files on a server using Node.js and Express. The client-side application interacts with the server via Fetch API.

## Features

- Upload files to the server.
- Retrieve a token-based URL for file access.
- List all files and directories in the server's upload directory.
- Download files via a secure token.
- Delete files and directories with a context menu.
- Handles nested directories and file type validation.

## Technologies Used

- **Backend**: Node.js, Express, Multer, MySQL (via `mysql2` pool).
- **Frontend**: HTML, JavaScript.
- **File Management**: File upload and retrieval with token authentication.
- **Validation**: MIME type checks for uploaded files.

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/your-username/file-management-system.git
   ```
2. Navigate to the project directory:
   ```bash
   cd file-management-system
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Configure the MySQL database in `config.js`.
5. Start the server:
   ```bash
   node server.js
   ```
6. Open the `index.html` in your browser for the client-side interface.

## API Endpoints

### Upload File

**POST** `/upload`

- **Headers**:
  - `filePath`: Path where the file should be stored.
- **Body**:
  - `file`: Form-data file to be uploaded.

### View File

**GET** `/storage/:file`

- **Query**:
  - `token`: Authentication token.

### Download File

**POST** `/download/:file`

- **Query**:
  - `token`: Authentication token.

### List Files

**POST** `/listFiles/:path?`

- **Path Parameter**:
  - `path`: Directory to list files from.

### Delete File or Directory

**POST** `/delete`

- **Body**:
  - `path`: Path to the file or directory.

### Generate Token

**POST** `/getToken`

- **Body**:
  - `path`: Path to the file.

## Usage

1. **Upload a File**:
   - Use the file input and submit button on the client-side interface.
2. **View Files**:
   - Click on directories to explore or files to generate a view URL.
3. **Delete Files**:
   - Right-click on a file or directory to delete it.

## Security

- Prevents directory traversal attacks by sanitizing file paths.
- Validates file MIME types during upload.
- Uses secure token-based access for file operations.

## Future Enhancements

- Add user authentication.
- Provide file previews for supported formats.
- Optimize large file uploads with streaming.
