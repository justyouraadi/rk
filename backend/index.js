import express from "express";
import cors from "cors";
import apiRoutes from "./src/routes/index.js";
import { ServerConfig } from "./src/config/index.js";


const app = express();



app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", apiRoutes)

app.listen(ServerConfig.Base.PORT, () => {
    console.log(`Server running on http://localhost:${ServerConfig.Base.PORT}`)
})