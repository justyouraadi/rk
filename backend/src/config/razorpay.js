import Razorpay from "razorpay";
import ServerConfig from "./server.config.js";

const razorpay = new Razorpay({
  key_id: ServerConfig.Razorpay.KEY_ID,
  key_secret: ServerConfig.Razorpay.KEY_SECRET,
});

export { razorpay };
export default razorpay;
