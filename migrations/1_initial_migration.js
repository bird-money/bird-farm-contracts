const Migrations = artifacts.require('Migrations');

module.exports = async (deployer) => {
  await deployer.deploy(Migrations);
  console.log('Migrations.address: ', Migrations.address);
};
