const Migrations = artifacts.require("Migrations");

module.exports = function (deployer) {
  if (process.env.NODE_ENV === "test") return;
  deployer.deploy(Migrations);
};
