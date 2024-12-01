import path from "path";
import express from "express";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";
import fs from "fs";
import multer, { diskStorage } from "multer";
import { pool } from "./config.js";

const allowedMimeTypes = [
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
	"image/svg+xml",
	"image/bmp",
	"image/tiff",
	"application/pdf",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"application/vnd.ms-excel",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	"application/vnd.ms-powerpoint",
	"application/vnd.openxmlformats-officedocument.presentationml.presentation",
	"application/vnd.oasis.opendocument.text",
	"application/vnd.oasis.opendocument.spreadsheet",
	"application/vnd.oasis.opendocument.presentation",
	"application/rtf",
	"text/plain",
	"audio/mpeg",
	"audio/wav",
	"audio/ogg",
	"audio/aac",
	"audio/midi",
	"video/mp4",
	"video/webm",
	"video/ogg",
	"video/avi",
	"video/quicktime",
	"video/x-matroska",
	"application/zip",
	"application/x-tar",
	"application/gzip",
	"application/x-7z-compressed",
	"application/json",
	"application/xml",
	"text/csv",
	"text/html",
	"text/css",
	"application/javascript",
	"font/woff",
	"font/woff2",
	"application/vnd.ms-access",
	"application/jwk+json",
];

// Initialize app
const PORT = 4000;
const app = express();

// Setup CORS
app.use(
	cors({
		origin: "*",
		methods: ["GET", "POST"],
		allowedHeaders: ["Content-Type", "x-api-key", "filePath"],
	})
);

// Middleware for parsing JSON
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ limit: "500mb", extended: true }));

// Configure Multer
const storage = diskStorage({
	destination: (request, file, callback) => {
		const userPath = request.headers.filepath.replace(/\.\.\//g, "") || ""; // User-defined path
		const sanitizedPath = path.join(process.cwd(), "uploads", userPath);

		// Ensure the directory exists
		if (!fs.existsSync(sanitizedPath)) {
			fs.mkdirSync(sanitizedPath, { recursive: true });
		}
		callback(null, sanitizedPath);
	},
	filename: (request, file, callback) => {
		const fileName = `${Date.now()}-${uuidv4()}${path.extname(
			file.originalname
		)}`;
		callback(null, fileName);
	},
});

// Storage handler
const storageManager = multer({
	storage,
	fileFilter: (request, file, callback) => {
		if (!allowedMimeTypes.includes(file.mimetype))
			return callback(new Error("File type not allowed."), false);
		callback(null, true);
	},
});

// Utility function to delete empty parent directories
const deleteEmptyDirectories = (directory, stopAt) => {
	if (directory === stopAt) return; // Stop when reaching the root directory
	try {
		const files = fs.readdirSync(directory);
		if (files.length === 0) {
			fs.rmdirSync(directory); // Remove the empty directory
			// Call recursively for the parent directory
			deleteEmptyDirectories(path.dirname(directory), stopAt);
		} else return;
	} catch (error) {
		console.error(`Error deleting directory ${directory}:`, error);
	}
};

// API to upload file
app.post(
	"/upload",
	storageManager.single("file"),
	async (request, response) => {
		if (!request.file) {
			return response.status(400).json({ error: "No file uploaded." });
		}
		const userPath = request.headers.filepath.replace(/\.\.\//g, "") || "";
		const fullPath = path.join(userPath, request.file.filename);
		const token = `${new Date().toISOString()}-${uuidv4()}`;
		try {
			const res = await pool.query(
				"INSERT INTO tokens (token, fileName, fullPath) VALUES (?, ?, ?)",
				[token, request.file.originalname, fullPath]
			);
		} catch (error) {
			console.error(error);
			const sanitizedPath = path.join(process.cwd(), "uploads", userPath, request.file.filename);
			try {
				if (fs.existsSync(sanitizedPath)) {
					fs.unlinkSync(sanitizedPath);
				}
				deleteEmptyDirectories(path.dirname(sanitizedPath), path.join(process.cwd(), "uploads"));
			} catch (err) {
				console.error("Error deleting file and directory", err);
			}
			return response.status(500).json({ error: "Database error." });
		}
		return response.status(201).json({
			message: "File uploaded successfully.",
			filePath: fullPath,
			url: `/storage/${fullPath.replace("\\", "/")}?token=${token}`,
		});
	}
);

// API to view file
app.get("/storage/*", async (request, response) => {
	const file = request.params[0].replaceAll(/\.\.\//g, "", /\//g, "\\") || "";
	const { token } = request.query;
	if (!token) {
		return response.status(403).json({ error: "Invalid or missing token" });
	}
	const [results] = await pool.query("SELECT * FROM tokens WHERE token = ?", [
		token,
	]);
	if (
		results?.length === 0 ||
		results[0]?.fullPath !== file.replaceAll("/", "\\")
	) {
		return response.status(403).json({ error: "Invalid or missing token" });
	}
	const filePath = path.join(process.cwd(), "uploads", file);
	if (!fs.existsSync(filePath)) {
		return response.status(404).json({ error: "File not found" });
	}
	// Serve the file
	response.sendFile(filePath, (error) => {
		if (error) return response.status(404).json(error);
	});
});

// API to download file
app.post("/download/*", async (request, response) => {
	const file = request.params[0].replaceAll(/\.\.\//g, "", /\//g, "\\") || "";
	const { token } = request.query;
	if (!token) {
		return response.status(403).json({ error: "Invalid or missing token" });
	}
	const [rows] = await pool.query("SELECT * FROM tokens WHERE token = ?", [
		token,
	]);
	if (rows.length === 0 || rows[0]?.fullPath !== file.replaceAll("/", "\\")) {
		return response.status(403).json({ error: "Invalid or missing token" });
	}
	const filePath = path.join(process.cwd(), "uploads", file);
	if (!fs.existsSync(filePath)) {
		return response.status(404).json({ error: "File not found" });
	}
	// Download the file
	response.download(filePath, file, (error) => {
		if (error)
			return response.status(404).json({ error: "Failed to download." });
	});
});

// List all files
app.post("/listFiles/*", async (request, response) => {
	const userPath = request.params[0].replaceAll(/\.\.\//g, "", /\//g, "\\") || "";
	const dir = path.join(process.cwd(), "uploads", userPath);
	if (!fs.existsSync(dir)) {
		return response
			.status(404)
			.json({ message: `Path: ${userPath}, doesn't exists.` });
	}
	const files = fs.readdirSync(dir, { withFileTypes: true });
	if (!files.length) {
		return response.status(404).json({ message: "No file exists." });
	}
	const filesWithTypes = await Promise.all(files.map(async (dirent) => {
		if (dirent.isFile()) {
			const [row] = await pool.query("SELECT * FROM tokens WHERE fullPath = ?",
				path.relative(path.join(process.cwd(), "uploads"), `${dirent.path}\\${dirent.name}`)
			);
			return ({ type: "file", fileName: row[0].fileName, ...dirent });
		}
		return ({ type: "directory", fileName: dirent.name, ...dirent })
	}));
	return response
		.status(201)
		.send({ message: "Files listed successfully.", files: filesWithTypes });
});
app.post("/listFiles", async (request, response) => {
	const dir = path.join(process.cwd(), "uploads");
	const files = fs.readdirSync(dir, { withFileTypes: true });
	const filesWithTypes = await Promise.all(files.map(async (dirent) => {
		if (dirent.isFile()) {
			const [row] = await pool.query("SELECT * FROM tokens WHERE fullPath = ?",
				path.relative(path.join(process.cwd(), "uploads"), `${dirent.path}\\${dirent.name}`)
			);
			return ({ type: "file", fileName: row[0].fileName, ...dirent });
		}
		return ({ type: "directory", fileName: dirent.name, ...dirent })
	}));
	if (!files.length) {
		return response.status(404).json({ message: "No file exists." });
	}
	return response
		.status(201)
		.send({ message: "Files listed successfully.", files: filesWithTypes });
});

// Get File Token
app.post("/getToken", async (request, response) => {
	const userPath = request.body.path?.replaceAll(/\.\.\//g, "", /\//g, "\\") || "";
	if (!userPath) {
		return response.status(403).json({ message: "File path is required." });
	}
	if (!fs.existsSync(process.cwd(), "uploads", userPath)) {
		return response.status(404).json({ message: "File not found." });
	}
	const [result] = await pool.query("SELECT * FROM tokens WHERE fullPath = ?", [
		userPath.replaceAll("/", "\\"),
	]);
	return response
		.status(201)
		.json({
			token: result[0]?.token,
			message: "Token fetched successfully.",
			url:
				"http://localhost:4000/storage/" +
				userPath +
				"?token=" +
				result[0]?.token,
			downloadURL: `http://localhost:4000/download/${userPath}?token=${result[0]?.token}`
		});
});

// Delete a file or directory
app.post("/delete", async (request, response) => {
	const userPath = request.body.path?.replaceAll(/\.\.\//g, "");
	if (!userPath) return response.status(403).json({ message: "Path is missing." });
	if (!fs.existsSync(path.join(process.cwd(), "uploads", userPath))) {
		return response.status(404).json({ message: "File or folder doesn't exists." });
	}
	const root = path.join(process.cwd(), "uploads", (userPath.replaceAll("/", "\\")));
	console.log(userPath.replaceAll("/", "\\"));
	if (fs.statSync(root).isDirectory()) {
		const files = fs.readdirSync(root, { recursive: true, withFileTypes: true });
		await Promise.all(files.map(async file => {
			if (file.isFile()) {
				const [row] = await pool.query("DELETE FROM tokens WHERE fullPath = ?", [
					path.relative(path.join(process.cwd(), "uploads"), `${file.path}\\${file.name}`)
				]);
			}
		}))
	} else {
		await pool.query("DELETE FROM tokens WHERE fullPath = ?", [userPath.replaceAll("/", "\\")]);
	}
	fs.rmSync(root, { force: true, recursive: true });
	return response.status(201).json({ message: `File deleted successfully.` });
});

// Start server
app.listen(PORT, () => {
	console.log("Server running on http://localhost:" + PORT);
});
