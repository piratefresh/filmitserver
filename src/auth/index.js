import jwt from "jsonwebtoken";

export const createAccessToken = async user => {
  const { id, email, username, role, tokenVersion } = user;
  return await jwt.sign(
    { id, email, username, role, tokenVersion },
    process.env.ACCESS_SECRET,
    {
      expiresIn: "15min"
    }
  );
};

export const createRefreshToken = async user => {
  const { id, tokenVersion } = user;
  return await jwt.sign({ id, tokenVersion }, process.env.REFRESH_SECRET, {
    expiresIn: "7d"
  });
};
