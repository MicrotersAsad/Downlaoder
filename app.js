const express = require("express");
const cors = require("cors");
const requestIp = require("request-ip");
const UAParser = require("ua-parser-js");
require("dotenv").config();

const PORT_NO = process.env.PORT || 3030;

const app = express();

app.use(express.json());
app.use(cors());
app.use(requestIp.mw());

// Import your routes
const publicRoutes = require("./routes/public");

// Middleware to attach user object to request
app.use((req, res, next) => {
  const useragent = req.headers["user-agent"];
  let parser = new UAParser(useragent);
  let parserResults = parser.getResult();


  // Simulate user object creation
  const user = {
    ip: req.clientIp,
    deviceInfo: parserResults,
    activity: [],
  };

  // Attach the user object to the request object
  req.user = user;

  next();
});

// Use your routes
app.use(publicRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
  if (!res.headersSent) {
    res.status(error.httpStatusCode || 500).json({
      status: "error",
      message: error.message || "An unexpected error occurred.",
    });
  }
});


// Start the server
app.listen(PORT_NO, () => {
  console.log(`Server Running On Port ${PORT_NO}`);
});
