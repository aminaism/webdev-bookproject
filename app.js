import express from "express";
import { engine } from  "express-handlebars";
import path from "path";
import sqlite3 from "sqlite3";
import bodyParser from "body-parser";

const app = express();
const __dirname = path.resolve();

//Handlebars setup 
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname,"views"));

//Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({extended:true}));

//Routes
import booksRoutes from "./routes/books.js";
import adminRoutes from "./routes/admin.js";
import authRoutes from "./routes/auth.js";

app.use("/", booksRoutes);
app.use("/admin", adminRoutes);
app.use("/auth", authRoutes);

//Start server
const PORT = 3000;
app.listen(PORT, ()=> console.log(`Server running on http://localhost:${PORT}`));