import jwt from "jsonwebtoken";

export const isAuth = ({ req }) => {
  console.log(reg);
  const authorization = req.headers["authorization"];

  console.log("AUTH: " + authorization);

  if (!authorization) {
    throw new Error("Not Authenticated");
  }

  try {
    const token = authorization.split(" ")[1];
    const payload = jwt.verify(token, process.env.ACCESS_SECRET);
    req.payload = payload;
    return req;
  } catch (err) {
    console.log(err);
    throw new Error("Not Authenticated");
  }
};
