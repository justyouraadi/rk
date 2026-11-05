import jwt from "jsonwebtoken";
import util from "util";
import { ServerConfig } from "../config/index.js";
import path from "path";

const signAsync = util.promisify(jwt.sign);

async function generateJWT(payload) {
    const token = await signAsync(payload, ServerConfig.JWT.SECRET, {
        expiresIn: ServerConfig.JWT.EXPIRY,
    });
    return token;
}

async function verifyJWT(token) {
    const response = jwt.verify(token, ServerConfig.JWT.SECRET);
    return response;
}

function isValidImageExtension(filename) {
    const validExtensions = [".jpg", ".jpeg", ".png", ".svg", ".webp", ".heic", ".heif", ".tiff", ".tif", ".avif", ".avifs"];
    const ext = path.extname(filename).toLowerCase();
    return validExtensions.includes(ext);
}

export default { generateJWT, verifyJWT, isValidImageExtension };