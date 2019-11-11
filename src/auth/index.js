import jwt from "jsonwebtoken";

export const createTokens = (
  { id, email, username, role, count },
  secret,
  expiresIn
) => {
  const accessToken = jwt.sign({ id, email, username, role }, secret, {
    expiresIn
  });

  const refreshToken = jwt.sign({ id, count }, secret, {
    expiresIn
  });

  return { refreshToken, accessToken };
};
