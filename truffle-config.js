var HDWalletProvider = require('@truffle/hdwallet-provider');

require('dotenv').config();
const package = require('./package');
const MNEMONIC = process.env.MNEMONIC;
const token = process.env.INFURA_TOKEN;
const etherscanKey = process.env.ETHERSCAN_KEY;

module.exports = {
  // Uncommenting the defaults below
  // provides for an easier quick-start with Ganache.
  // You can also follow this format for other networks;
  // see <http://truffleframework.com/docs/advanced/configuration>
  // for more details on how to specify configuration options!
  //
  networks: {
    develop: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '*',
      gas: 6721975,
    },
    development: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '*',
      gas: 6721975,
    },
    test: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '*',
    },
    bscTestnet: {
      provider: function () {
        // 0x25449306F743E252720cC03540773423513f5FEf
        //  ganache-cli --fork https://data-seed-prebsc-1-s1.binance.org:8545
        return new HDWalletProvider(
          MNEMONIC,
          'https://data-seed-prebsc-1-s1.binance.org:8545'
        );
      },
      network_id: '97',
      //  gas: 30000000
      //       6721975
    },

    bscMainnet: {
      provider: function () {
        return new HDWalletProvider('', 'https://bsc-dataseed.binance.org');
      },
      network_id: '56',
    },

    ropsten: {
      provider: function () {
        return new HDWalletProvider(
          MNEMONIC,
          'https://ropsten.infura.io/v3/' + token
        );
      },
      network_id: '3',
    },
    kovan: {
      provider: function () {
        return new HDWalletProvider(
          MNEMONIC,
          'https://kovan.infura.io/v3/' + token
        );
      },
      network_id: '42',
      skipDryRun: true,
    },
  },
  plugins: ['truffle-plugin-verify'],
  api_keys: {
    etherscan: etherscanKey, //'HSR39CEBP479H5TBJTXR693XMATW8T68KE', //'VAAPUS45322HIQ4YARV9DJ3S1JYU7HPBGF', //'8R621NFWB6T6RMADTAZT8UGBBC5IATEUEM',
  },
  compilers: {
    solc: {
      version: '0.6.12',
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  },
};
