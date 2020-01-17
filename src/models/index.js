import Sequelize from "sequelize";

const sequelize = new Sequelize(
  process.env.TEST_DATABASE || DATABASE,
  process.env.DATABASE_USER,
  process.env.DATABASE_PASSWORD,
  {
    port: 4444,
    dialect: "postgres"
  }
);

const models = {
  User: sequelize.import("./user"),
  Message: sequelize.import("./message"),
  Post: sequelize.import("./post"),
  Channel: sequelize.import("./channel"),
  Text: sequelize.import("./text"),
  Notification: sequelize.import("./notification")
};

Object.keys(models).forEach(key => {
  if ("associate" in models[key]) {
    models[key].associate(models);
  }
});

export { sequelize };

export default models;
