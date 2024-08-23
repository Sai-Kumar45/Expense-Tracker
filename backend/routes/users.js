var express = require("express");
var router = express.Router();
var userdata = require("../model/userAuth");
var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
var nodemailer = require("nodemailer");
var token;
var hashedpassword;

/* OTP Settings */
const otpExpirationTime = 15 * 60 * 1000; // 15 minutes
const otpRetryLimit = 3; // Set OTP retry limit
const jwtSecretKey = "secrectkey";

// Nodemailer transporter configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "saekumar56@gmail.com",
    pass: "yqorialqflavwaae",
  },
});

/* User Registration */
router.post("/registration", (req, res) => {
  userdata
    .findOne({ email: req.body.email })
    .then((user) => {
      if (user) {
        res.send("user already existed");
      } else {
        hashedpassword = bcrypt.hashSync(req.body.password, 8);
        var reguser = new userdata({
          username: req.body.username,
          email: req.body.email,
          password: hashedpassword,
        });
        reguser
          .save()
          .then(() => {
            res.send("user register successfully");
          })
          .catch((err) => {
            console.log(err);
          });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

/* Send OTP */
router.post("/send-otp", (req, res) => {
  userdata.findOne({ email: req.body.email }).then((user) => {
    if (user) {
      // Check if user has exceeded OTP retry limit
      if (user.otpRetries >= otpRetryLimit) {
        return res
          .status(429)
          .send("OTP retry limit exceeded. Please try again later.");
      }

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = Date.now() + otpExpirationTime;

      // Update user document with OTP and retry information
      user.otp = otp;
      user.otpExpires = otpExpires;
      user.otpRetries = (user.otpRetries || 0) + 1; // Increment retry count
      user.save();

      // Send OTP to user's email
      transporter.sendMail({
        to: user.email,
        subject: "Your OTP Code",
        text: `Your OTP code is ${otp}. It is valid for 15 minutes.`,
      });

      res.send("OTP sent to your email.");
    } else {
      res.send("User not found.");
    }
  });
});

/* User Login with OTP Validation */
router.post("/login", (req, res) => {
  userdata.findOne({ email: req.body.email }).then((user) => {
    if (user != null) {
      if (bcrypt.compareSync(req.body.password, user.password)) {
        // Check OTP expiration and validity
        if (user.otpExpires < Date.now()) {
          return res.status(401).send("OTP expired. Please request a new OTP.");
        }
        if (user.otp !== req.body.otp) {
          return res.status(401).send("Invalid OTP.");
        }

        // Reset OTP retries after successful login
        user.otpRetries = 0;
        user.save();

        // Generate JWT token
        token = jwt.sign(
          { username: user.username, id: user._id },
          jwtSecretKey,
          { expiresIn: "1d", algorithm: "HS256" } // Token expires in 1 day
        );

        res.send({
          message: "Logged in successfully",
          username: user.username,
          token: token,
        });
      } else {
        res.send("Login failed. Incorrect username or password.");
      }
    } else {
      res.send("Enter valid details.");
    }
  });
});

module.exports = router;
