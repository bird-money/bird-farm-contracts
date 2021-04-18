const { MAX_UINT256 } = require('@openzeppelin/test-helpers/src/constants');

const kovanDeployScript = async (deployer, acc) => {
  //await deployer.deploy(LPToken, 'LP', 'LP', toWei('1000'));
  //const usdt = await deployer.deploy(USDT, 'USDT', 'USDT', toWei('1000'));
  const usdt = await USDT.deployed();
  const birdEthLP = '0xF1719564AE1A46bA7A53164191D1dc8De31ECB79';

  const farm = await deployer.deploy(BirdFarm, USDT.address);

  await usdt.approve(BirdFarm.address, MAX_UINT256);
  await usdt.mint(acc, millionTokens());
  await farm.addRewardTokensToContract(toWei('30000'));

  await farm.add( // addPool
    '1000', // Allocpoint
    LPToken.address, // LP Token
    true // withUpdate
  );

  await farm.add( // addPool
    '1000', // Allocpoint
    birdEthLP, // LP Token
    true // withUpdate
  );

  console.log('LP Token address: ', LPToken.address);
  console.log('USDT address: ', USDT.address);
  console.log('BirdFarm address: ', BirdFarm.address);
};

const mainnetDeployScript = async deployer => {
  const usdtAddr = '0xdac17f958d2ee523a2206206994597c13d831ec7';
  console.log('usdt.address: ', usdtAddr);

  await deployer.deploy(BirdFarm, usdtAddr);
  console.log('BirdFarm.address: ', BirdFarm.address);
};

const localDeployScript = async deployer => {};

module.exports = async (deployer, network, accounts) => {
  await deployer.deploy(Migrations);
  console.log('Deploying to: ', network);

  switch (network) {
    case 'mainnet':
      await mainnetDeployScript(deployer);
      break;

    case 'kovan':
      await kovanDeployScript(deployer, accounts[0]);
      break;

    case 'develop':
      break;

    case 'development':
    default:
      await localDeployScript(deployer);
  }
};

const fromWei = w => web3.utils.fromWei(w);
const toWei = w => web3.utils.toWei(w);
const millionTokens = () => toWei('1000000');

const BirdFarm = artifacts.require('BirdFarm');
const USDT = artifacts.require('USDT');
const LPToken = artifacts.require('LPToken');
const Migrations = artifacts.require('Migrations');
