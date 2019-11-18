import jwt from "jsonwebtoken";
import { combineResolvers } from "graphql-resolvers";
import { AuthenticationError, UserInputError } from "apollo-server";
import cloudinary from "cloudinary";
import { authenticateGoogle } from "../passport";
import bcrypt from "bcrypt";
import { sendRefreshToken } from "../sendRefreshToken";

import { isAdmin } from "./authorization";
import { createAccessToken, createRefreshToken } from "../auth";

cloudinary.config({
  cloud_name: "da91pbpmj",
  api_key: "446621691525293",
  api_secret: "a676b67565c6767a6767d6767f676fe1"
});

export default {
  Query: {
    users: async (parent, args, { models }) => {
      return await models.User.findAll();
    },
    user: async (parent, { id }, { models }) => {
      return await models.User.findByPk(id);
    },
    me: async (parent, args, { models, me, req }) => {
      const authorization = await req.headers["authorization"];
      if (!authorization) {
        return null;
      }
      try {
        const token = await authorization.split(" ")[1];
        console.log(token);
        const payload = await jwt.verify(token, process.env.ACCESS_SECRET);
        return await models.User.findByPk(payload.id);
      } catch (err) {
        console.log(err);
        return null;
      }
      // if (!me) {
      //   return null;
      // }

      // return await models.User.findByPk(me.id);
    }
  },

  Mutation: {
    signUp: async (
      parent,
      { username, email, password },
      { models, secret }
    ) => {
      const user = await models.User.create({
        username,
        email,
        password
      });

      return {
        token: createAccessToken(user)
      };
    },

    signIn: async (
      parent,
      { login, password },
      { models, secret, req, res }
    ) => {
      const user = await models.User.findByLogin(login);
      const { id, username, email, role } = user;
      if (!user) {
        throw new UserInputError("No user found with this login credentials.");
      }

      const isValid = await user.validatePassword(password);

      if (!isValid) {
        throw new AuthenticationError("Invalid password.");
      }

      const refreshToken = await createRefreshToken(user);
      sendRefreshToken(res, refreshToken);
      const accessToken = await createAccessToken(user);
      return {
        accessToken,
        user
      };
    },

    authGoogle: async (_, { input: { accessToken } }, { models, req, res }) => {
      req.body = {
        ...req.body,
        access_token: accessToken
      };
      try {
        const { data, info } = await authenticateGoogle(req, res);
        const { profile } = await data;
        console.log(profile.emails[0].value);

        let user = await models.User.findByLogin(profile.emails[0].value);

        if (user) {
          const refreshToken = await createRefreshToken(user);
          sendRefreshToken(res, refreshToken);
          return {
            accessToken: createAccessToken(user),
            user
          };
        }

        user = await models.User.create({
          username: profile.id,
          email: profile.emails[0].value,
          password: profile.id
        });

        const refreshToken = await createRefreshToken(user);
        await sendRefreshToken(res, refreshToken);
        const accessToken = await createAccessToken(user);
        return {
          accessToken,
          user
        };
      } catch (err) {
        return err;
      }
    },

    signOut: async (_, args, { req, res }) => {
      sendRefreshToken(res, "");

      return true;
    },

    updateProfile: async (
      parent,
      { id, username, email, homepage, bio },
      { models },
      info
    ) => {
      try {
        await models.User.update(
          { username, email, homepage, bio },
          { where: { id, username }, returning: true }
        );
        const user = await models.User.findOne({ where: { id, username } });
        return await user;
      } catch (err) {
        console.log(user);
        handleError(err);
      }
    },

    deleteUser: combineResolvers(
      isAdmin,
      async (parent, { id }, { models }) => {
        return await models.User.destroy({
          where: { id }
        });
      }
    ),

    revokeRefreshTokensForUser: async (_, { userId }, { models }) => {
      const user = await models.User.findByPk(userId);
      user.increment("tokenVersion", { by: 1 });

      return true;
    },

    uploadAvatar: async (parent, { id, imageUrl }, { models }, info) => {
      console.log(`file: ${imageUrl} ID: ${id}`);
      const user = await models.User.update({
        where: { id }
      });

      user.avatar = await imageUrl;

      return await user;
    }
  },

  User: {
    messages: async (user, args, { models }) => {
      console.log(user);
      return await models.Message.findAll({
        where: {
          userId: user.id
        }
      });
    }
  }
};
