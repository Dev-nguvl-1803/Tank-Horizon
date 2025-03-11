import express from 'express';
import path from 'path';

// Make a basic express server
const app = express();
const port = 3000;

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Route to HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/html/index.html'));
});

// Listen to the port
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});