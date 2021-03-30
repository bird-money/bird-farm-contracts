const localDeployScript = async (
  deployer,
  [alice, bob, carol, dev, minter]
) => {
  await deployer.deploy(MockERC20, 'USDT', 'USDT', '100000000000', {
    from: minter,
  });
  console.log('MockERC20.address: ', MockERC20.address);

  await deployer.deploy(
    MasterChef,
    MockERC20.address,
    //dev,
    '1000', // reward tokens per block
    '100', //start reward block
    '10000', //end reward block
    '150', //end bonus reward block
    {
      from: minter,
    }
  );
  console.log('MasterChef.address: ', MasterChef.address);
};

const kovanDeployScript = async (
  deployer,
  [alice, bob, carol, dev, minter]
) => {
  await deployer.deploy(MockERC20, 'USDT', 'USDT', toWei('100'));
  console.log('LP Token MockERC20.address: ', MockERC20.address);

  const usdt = await MockERC20.at('0x3Da9E82d842b6343e1b6b452C5bbBa8B994b1D7C');
  console.log('usdt.address: ', usdt.address);

  await deployer.deploy(
    MasterChef,
    usdt.address,
    //dev,
    '1000', // reward tokens per block
    '100', //start reward block
    '10000', //end reward block
    '150' //end bonus reward block
  );
  console.log('MasterChef.address: ', MasterChef.address);
};

const mainnetDeployScript = async (
  deployer,
  [alice, bob, carol, dev, minter]
) => {
  const usdt = await MockERC20.at('0xdac17f958d2ee523a2206206994597c13d831ec7');
  console.log('usdt.address: ', usdt.address);

  await deployer.deploy(
    MasterChef,
    usdt.address,
    //dev,
    '1000', // reward tokens per block
    '100', //start reward block
    '10000', //end reward block
    '150' //end bonus reward block
  );
  console.log('MasterChef.address: ', MasterChef.address);
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

const toWei = (w) => web3.utils.toWei(w);

const MasterChef = artifacts.require('MasterChef');
const MockERC20 = artifacts.require('MockERC20');
