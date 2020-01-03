import "dotenv/config";
import cors from "cors";
import http from "http";
import jwt from "jsonwebtoken";
import DataLoader from "dataloader";
import express from "express";
import cookieParser from "cookie-parser";
import { ApolloServer, AuthenticationError } from "apollo-server-express";
import morgan from "morgan";
import avatarsMiddleware from "adorable-avatars";
import cloudinary from "cloudinary";
import multer from "multer";
import cloudinaryStorage from "multer-storage-cloudinary";

import schema from "./schema";
import resolvers from "./resolvers";
import models, { sequelize } from "./models";
import loaders from "./loaders";
import { createRefreshToken, createAccessToken } from "./auth";
import { getMe } from "./auth/getMe";
import auth from "./passport";
import { sendRefreshToken } from "./sendRefreshToken";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true
  })
);
app.use(cookieParser());
app.use(morgan("dev"));
app.use("/myAvatars", avatarsMiddleware);
app.use(auth.passport.initialize());
app.use(auth.passport.session());

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
const imageFilter = function(req, file, cb) {
  // accept image files only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error("Only image files are allowed!"), false);
  }
  cb(null, true);
};
const upload = multer({ storage: storage, fileFilter: imageFilter });

const parser = multer({ storage: storage });
// GOOGLE
app.get(
  "/google",
  auth.passport.authenticate("google", {
    session: false,
    scope: ["profile", "email"]
  })
);

app.get("/auth/google/callback", async (req, res, next) => {
  auth.passport.authenticate(
    "google",
    {
      failureRedirect: `${process.env.CLIENTURL}/login`
      // successRedirect: `${process.env.CLIENTURL}/index`,
    },
    (err, data, info) => {
      req.logIn(data, async function(err) {
        if (err) {
          return next(err);
        }
        console.log(data);
        res.cookie("gtoken", data.token, {});
        return res.redirect(process.env.CLIENTURL);
      });
    }
  )(req, res, next);
});

app.post("/refresh_token", async (req, res) => {
  const token = await req.cookies.jid;
  if (!token) {
    return res.send({ ok: false, accessToken: "" });
  }

  let payload = null;
  try {
    payload = await jwt.verify(token, process.env.REFRESH_SECRET);
  } catch (err) {
    console.log(err);
    return res.send({ ok: false, accessToken: "" });
  }

  // token is valid and we can send back an access token
  const user = await models.User.findByPk(payload.id);
  if (!user) {
    return res.send({ ok: false, accessToken: "" });
  }

  if (user.tokenVersion !== payload.tokenVersion) {
    return res.send({ ok: false, accessToken: "" });
  }
  const newAccessToken = await createAccessToken(user);

  const refreshToken = await createRefreshToken(user);
  sendRefreshToken(res, refreshToken);

  return res.send({ ok: true, accessToken: newAccessToken });
});

app.post(
  "/api/portfolio/uploadImage",
  upload.single("file"),
  async (req, res, next) => {
    console.log(req.userId);
    const result = await cloudinary.v2.uploader.upload(req.file.path, {
      folder: `filmit/portfolio/${req.file.userId}`
    });
    console.log(result);

    return res.send(result);
  }
);

// const getMe = async req => {
//   const token = req.headers["x-token"];

//   if (token) {
//     try {
//       return await jwt.verify(token, process.env.ACCESS_SECRET);
//     } catch (e) {
//       throw new AuthenticationError("Your session expired. Sign in again.");
//     }
//   }
// };

const server = new ApolloServer({
  typeDefs: schema,
  resolvers,
  formatError: error => {
    // remove the internal sequelize error message
    // leave only the important validation error
    const message = error.message
      .replace("SequelizeValidationError: ", "")
      .replace("Validation error: ", "");

    return {
      ...error,
      message
    };
  },
  context: async ({ req, res, connection }) => {
    if (connection) {
      return {
        models,
        loaders: {
          user: new DataLoader(keys => loaders.user.batchUsers(keys, models))
        }
      };
    }

    if (req) {
      const me = await getMe(req);

      return {
        models,
        req,
        res,
        me,
        secret: process.env.ACCESS_SECRET,
        loaders: {
          user: new DataLoader(keys => loaders.user.batchUsers(keys, models))
        }
      };
    }
  }
});

server.applyMiddleware({ app, cors: false, path: "/graphql" });

const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);

const isTest = !!process.env.TEST_DATABASE;
const port = 8000;

sequelize.sync().then(async () => {
  httpServer.listen({ port }, () => {
    console.log(
      `Server 📦 is running 🏃 at port  http://localhost:${port}/graphql`
    );
    console.log(
      `🚀 Subscriptions ready at ws://localhost:${port}${server.subscriptionsPath}`
    );
  });
});
