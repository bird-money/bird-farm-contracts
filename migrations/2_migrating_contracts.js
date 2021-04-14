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
  const usdtAddr = '0xD86054bE96C0443209E06564784866c9A8fCb84f';
  const lpAddr = '0xD86054bE96C0443209E06564784866c9A8fCb84f';
  await deployer.deploy(BirdFarm, usdtAddr);

  console.log('LP Token address: ', lpAddr);
  console.log('USDT address: ', usdtAddr);
  console.log('BirdFarm address: ', BirdFarm.address);

  const usdt = await PinkToken.at(usdtAddr);
  await usdt.mint(BirdFarm.address, toWei('100000'));

  const farm = await BirdFarm.deployed();
  await farm.addPool(
    '1000', // Allocpoint
    lpAddr, // LP Token
    true // withUpdate
  );

  const birdEthLP = '0xF1719564AE1A46bA7A53164191D1dc8De31ECB79';
  await farm.addPool(
    '1000', // Allocpoint
    birdEthLP, // LP Token
    true // withUpdate
  );

  await farm.setUpEndRewardBlock();
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
