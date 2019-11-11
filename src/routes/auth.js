import { Router } from "express";
import "./../passport";
import passport from "passport";
import { handlePassportError } from "./../../middleware/middleware";
import { resSchema, errSchema } from "./../../utils/schemas/responses";

const router = Router();

// GOOGLE
router.get(
  "/google",
  passport.authenticate("google", {
    session: false,
    scope: ["profile", "email"]
  })
);

router.get(
  "/google/redirect",
  passport.authenticate("google", {
    failureRedirect: process.env.CLIENT_LOGIN,
    session: false
  }),
  (req, res) => {
    // todo redirect users to client accordingly
    if (!req.user) console.log("User not found 404");
    res.cookie("token", req.user.token, {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      httpOnly: true
    });
    console.log(req);
  }
);
