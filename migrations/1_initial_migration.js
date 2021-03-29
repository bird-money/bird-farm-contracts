const Migrations = artifacts.require("Migrations");

module.exports = function (deployer) {
  await deployer.deploy(Migrations);
  console.log('Migrations.address: ', Migrations.address);
};
