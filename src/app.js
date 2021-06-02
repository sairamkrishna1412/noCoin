const express = require("express");
const axios = require("axios");
const morgan = require("morgan");

const apiRouter = require("./routes/apiRouter");

const app = express();

app.use(express.json({ limit: "10kb" }));
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

app.use("/api/v1/", apiRouter);

const PORT = process.argv[2];

app.listen(PORT, (err) => {
    if (err) {
        console.log("app crash");
    } else {
        console.log(`listening request at port : ${PORT}`);
    }
});
