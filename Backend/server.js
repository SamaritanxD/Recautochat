const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
const Multer = require("multer");

const app = express();
app.use(cors());

// Initialize Firebase Admin SDK
const serviceAccount = require("./config/serviceaccountkey.json"); // Replace with the path to your service account key JSON file
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Initialize Firebase Storage
const bucket = admin.storage().bucket("gs://chatbox-a584f"); // This will use the default storage bucket associated with your Firebase project

// Configure Multer for file uploads
const multer = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // Limit file size to 10MB (adjust as needed)
  },
});

// API endpoint to receive audio messages
app.post("/api/messages", multer.single("audio"), (req, res, next) => {
  const audioFile = req.file; // Assuming the audio data is sent in the "audio" field

  if (!audioFile) {
    return res.status(400).json({ error: "No audio file provided" });
  }

  // Generate a unique filename for the audio file
  const filename = `${Date.now()}-${audioFile.originalname}`;

  // Create a write stream to Firebase Storage
  const fileStream = bucket.file(filename).createWriteStream({
    contentType: audioFile.mimetype,
  });

  // Handle any errors during the upload
  fileStream.on("error", (error) => {
    console.error("Error uploading audio:", error);
    return res.status(500).json({ error: "Failed to upload audio" });
  });

  // Handle the completion of the upload
  fileStream.on("finish", () => {
    // Get the public URL of the uploaded file
    const fileUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

    // Add your logic to process and store the file URL as needed

    // Send a response back to the client
    res
      .status(200)
      .json({ message: "Audio message uploaded successfully", fileUrl });
  });

  // Pipe the audio data into the write stream
  fileStream.end(audioFile.buffer);
});

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
