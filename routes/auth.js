const router = require("express").Router();
const CryptoJS = require("crypto-js");
const crypto = require("crypto");

const nodemailer = require("nodemailer");

const jwt = require("jsonwebtoken");
const User = require("../models/User");

//const URL = "https://password-reset-link.netlify.app";
const URL = "http://localhost:5000";

const pass = "9791627920";
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "noreplydummy123@gmail.com",
    pass: pass,
  },
});

//register
router.post("/register", async (req, res) => {
  const newUser = new User({
    username: req.body.username,
    email: req.body.email,
    firstName: req.body.firstName || "",
    lastName: req.body.lastName || "",
    password: CryptoJS.AES.encrypt(
      req.body.password,
      process.env.SECRET_KEY
    ).toString(),
  });
  try {
    const user = await newUser.save();

    crypto.randomBytes(32, (err, buffer) => {
      if (err) {
        console.log(err);
      }
      const token = buffer.toString("hex");

      User.findOne({ email: req.body.email }).then((user) => {
        if (!user) {
          return res
            .status(422)
            .json({ error: "User does not exists with that email" });
        }
        user.activateToken = token;
        user
          .save()
          .then((result) => {
            transporter.sendMail({
              to: user.email,
              from: "noreplydummy123@gmail.com",
              subject: "Activation link",
              html: `<p>You requested for activation</p><h5>click in this <a href="${URL}/activation/${token}">link</a> to activate your account</h5>                     `,
            });
            res.json({
              message: "Check your email and click the Activation link",
            });
          })
          .catch((error) => console.log(error));
      });
    });
  } catch (error) {
    res.status(500).json(error);
  }
});

//login
router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    !user && res.status(401).json("Wrong password or username!");
    !user.isActivated &&
      res.status(401).json("User is not activated, check your email!");
    const bytes = CryptoJS.AES.decrypt(user.password, process.env.SECRET_KEY);
    const originalPassword = bytes.toString(CryptoJS.enc.Utf8);

    originalPassword !== req.body.password &&
      res.status(401).json("Wrong password or username!");

    const accessToken = jwt.sign({ id: user._id }, process.env.SECRET_KEY, {
      expiresIn: "5d",
    });
    const { password, ...info } = user._doc;
    res.status(200).json({ ...info, accessToken });
  } catch (error) {
    res.status(500).json(error);
  }
});

router.post("/reset-password", (req, res) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
    }
    const token = buffer.toString("hex");
    User.findOne({ email: req.body.email }).then((user) => {
      if (!user) {
        return res
          .status(422)
          .json({ error: "User does not exists with that email" });
      }
      user.resetToken = token;
      user.expireToken = Date.now() + 3600000;
      user
        .save()
        .then((result) => {
          transporter.sendMail({
            to: user.email,
            from: "noreplydummy123@gmail.com",
            subject: "Password reset",
            html: `<p>You requested for password reset</p><h5>click in this <a href="${URL}/new-password/${token}">link</a> to reset password</h5>                     `,
          });
          res.json({ message: "Check your email and click that reset link" });
        })
        .catch((error) => console.log(error));
    });
  });
});

router.post("/new-password", (req, res) => {
  const newPassword = req.body.password;
  const sentToken = req.body.token;
  User.findOne({ resetToken: sentToken, expireToken: { $gt: Date.now() } })
    .then((user) => {
      if (!user) {
        return res.status(422).json({ error: "Try again session expired" });
      }
      user.password = CryptoJS.AES.encrypt(
        newPassword,
        process.env.SECRET_KEY
      ).toString();
      user.resetToken = undefined;
      user.expireToken = undefined;
      user.save().then((saveduser) => {
        res.json({ message: "Password updated successfully" });
      });
    })
    .catch((err) => {
      console.log(err);
    });
});

router.post("/activation", (req, res) => {
  const activateToken = req.body.token;
  User.findOne({ activateToken: activateToken })
    .then((user) => {
      if (!user) {
        return res.status(422).json({ error: "User does not exists " });
      }
      user.isActivated = true;
      user.activateToken = undefined;
      user.save().then((saveduser) => {
        res.json({ message: "Account activation successfully done!" });
      });
    })
    .catch((err) => {
      console.log(err);
    });
});

module.exports = router;
