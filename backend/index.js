import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import verifyToken from "./middleware/token.js";
import auth from "./routes/auth.js";
import category from "./routes/category.js";
import comment from "./routes/comment.js";
import course from "./routes/course.js";
import payment from "./routes/payment.js";
import user from "./routes/user.js";

const app = express()
const port = process.env.PORT || 3000;
const router = express.Router();

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use('/images', express.static('static/uploads'));
app.use(cors());

app.use("/api",
 router.use("/auth", auth),
 router.use("/user", user),
 router.use("/course", course),
 router.use("/category", category),
 router.use("/comment", comment),
 router.use("/payment", payment)
);

app.get("/", verifyToken,(req, res) => {
  res.send("Welcome our page")
})

app.listen(port, () => {
  console.log(`Server started on port ${port}`)
});