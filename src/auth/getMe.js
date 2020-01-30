import jwt from "jsonwebtoken";
import { AuthenticationError } from "apollo-server-express";

export const getMe = async req => {
  const authorization = await req.headers.authorization;
  if (authorization) {
    const token = await authorization.split(" ")[1];
    try {
      return await jwt.verify(token, process.env.ACCESS_SECRET);
    } catch (e) {
      throw new AuthenticationError("Your session expired. Sign in again.");
    }
  }
};

export const getMeSubscription = async token => {
  try {
    return jwt.verify(token, process.env.ACCESS_SECRET);
  } catch (e) {
    throw new AuthenticationError("Your session expired. Sign in again.");
  }
};
