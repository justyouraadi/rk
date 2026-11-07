import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import apiRoutes from "./src/routes/index.js";
import { ServerConfig } from "./src/config/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded assets statically
app.use("/uploads/files", express.static(path.join(__dirname, "public/uploads")));

app.use("/api", apiRoutes);

app.listen(ServerConfig.Base.PORT, () => {
    console.log(`Server running on http://localhost:${ServerConfig.Base.PORT}`)
})