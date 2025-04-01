"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
// Make a basic express server
const app = (0, express_1.default)();
const port = 3000;
// Serve static files
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
// Route to HTML file
app.get('/', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../public/html/index.html'));
});
// Listen to the port
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
