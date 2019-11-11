export function handlePassportError(err, req, res, next) {
  if (err) {
    let data = {};
    if (!(process.env.NODE_ENV === "production")) {
      data.err = err;
      res.status(500).send(errSchema(data, 500));
    }
  } else return next();
}
