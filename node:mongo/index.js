const express = require("express");
const mongoose = require("mongoose");
const cors = require('cors')
const swaggerUi = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerDocument = require("./swagger.json");

const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postsRoutes");

const app = express();

const swaggerDocs = swaggerJsDoc(swaggerDocument);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use(express.json());
app.use(cors())

app.use("/auth", authRoutes);
app.use("/posts", postRoutes);

mongoose
  .connect("mongodb://localhost:27017/test")
  .then(() => {
    app.listen(3000, () => {
      console.log("Server has been started...");
    });
  })
  .catch((err) => console.log(err));
