import express, { urlencoded } from "express"
import "dotenv/config"
import  routeruser from "./route/User.Routes.js";

const app = express();
app.use(express.json());
app.use(urlencoded({ extended: true}));

app.use("/user", routeruser);

export default app;