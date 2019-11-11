import "dotenv/config";
import cors from "cors";
import http from "http";
import jwt from "jsonwebtoken";
import DataLoader from "dataloader";
import express from "express";
import cookieParser from "cookie-parser";
import { ApolloServer, AuthenticationError } from "apollo-server-express";
import morgan from "morgan";

import schema from "./schema";
import resolvers from "./resolvers";
import models, { sequelize } from "./models";
import loaders from "./loaders";
import { createTokens } from "./auth";
import auth from "./passport";

const app = express();

app.use(cors());
app.use(cookieParser());
app.use(morgan("combined"));
app.use(auth.passport.initialize());
app.use(auth.passport.session());

// GOOGLE
app.get(
  "/google",
  auth.passport.authenticate("google", {
    scope: ["profile", "email"]
  })
);

app.get(
  "/auth/google/callback",
  auth.passport.authenticate(
    "google",
    {
      failureRedirect: `${process.env.CLIENTURL}/login`,
      successRedirect: `${process.env.CLIENTURL}/`
    },
    async user => {
      // todo redirect users to client accordingly
      console.log(user);
    }
  )
);

app.get("/api/greeting", (req, res) => {
  const name = req.query.name || "World";
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify({ greeting: `Hello ${name}!` }));
});

const getMe = async req => {
  const token = req.headers["x-token"];
  const refreshToken = req.headers["refresh-token"];
  if (token && refreshToken) {
    try {
      // Lets get data from tokens
      let dataToken = jwt.verify(token, process.env.SECRET, (err, decoded) => {
        if (err) {
          return jwt.verify(
            refreshToken,
            process.env.SECRET,
            (err, decoded) => {
              if (err) {
                return jwt.decode(refreshToken, process.env.SECRET);
              }
              return decoded;
            }
          );
        }
        return decoded;
      });
      const user = await models.User.findByPk(dataToken.id);

      // Compare if user exist and if count is same as count in DB
      if (!user || user.count !== dataToken.count) {
        // models.User.findByPk(dataToken.id).then(user => {
        //   return user.increment("count", { by: 1 });
        // });
        throw new AuthenticationError("tokens not valid");
      }

      // Creates the new tokens if user exist
      const tokens = createTokens(dataToken, process.env.SECRET, "15d");

      user.data = jwt.verify(tokens.accessToken, process.env.SECRET);

      return {
        id: user.data.id,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      };
    } catch (e) {
      console.log(e);
      throw new AuthenticationError("Tokens expired");
    }
  }
};

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
        me,
        req,
        res,
        secret: process.env.SECRET,
        loaders: {
          user: new DataLoader(keys => loaders.user.batchUsers(keys, models))
        }
      };
    }
  }
});

server.applyMiddleware({ app, path: "/graphql" });

const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);

const isTest = !!process.env.TEST_DATABASE;
const port = 8000;

sequelize.sync().then(async () => {
  httpServer.listen({ port }, () => {
    console.log(
      `Server 📦 is running 🏃 at port  http://localhost:${port}/graphql`
    );
  });
});
