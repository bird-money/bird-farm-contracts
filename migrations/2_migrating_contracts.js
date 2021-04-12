const localDeployScript = async (
  deployer,
  [alice, bob, carol, dev, minter]
) => {};

const kovanDeployScript = async (
  deployer,
  [alice, bob, carol, dev, minter]
) => {
  // await deployer.deploy(BlueToken, 'LP', 'LP', toWei('1000'));
  // await deployer.deploy(PinkToken, 'USDT', 'USDT', toWei('1000'));
  await deployer.deploy(BirdFarm, PinkToken.address);

  console.log('LP Token address: ', BlueToken.address);
  console.log('USDT address: ', PinkToken.address);
  console.log('BirdFarm address: ', BirdFarm.address);

  const usdt = await PinkToken.deployed();
  await usdt.mint(BirdFarm.address, toWei('100000'));

  const farm = await BirdFarm.deployed();
  await farm.addPool(
    '1000', // Allocpoint
    BlueToken.address, // LP Token
    true // withUpdate
  );

  const birdEthLP = '0xF1719564AE1A46bA7A53164191D1dc8De31ECB79';
  await farm.addPool(
    '1000', // Allocpoint
    birdEthLP, // LP Token
    true // withUpdate
  );
};

const mainnetDeployScript = async (
  deployer,
  [alice, bob, carol, dev, minter]
) => {
  const usdt = '0xdac17f958d2ee523a2206206994597c13d831ec7';
  console.log('usdt.address: ', usdt);

  await deployer.deploy(BirdFarm, usdt);
  console.log('BirdFarm.address: ', BirdFarm.address);
};

module.exports = async (deployer, network, accounts) => {
  console.log('Deploying to: ', network);

  switch (network) {
    case 'mainnet':
      await mainnetDeployScript(deployer, accounts);
      break;

    case 'kovan':
      await kovanDeployScript(deployer, accounts);
      break;

    case 'develop':
      break;

    case 'development':
    default:
      await localDeployScript(deployer, accounts);
  }
};

const toWei = w => web3.utils.toWei(w);

const BirdFarm = artifacts.require('BirdFarm');
const PinkToken = artifacts.require('PinkToken');
const BlueToken = artifacts.require('BlueToken');
