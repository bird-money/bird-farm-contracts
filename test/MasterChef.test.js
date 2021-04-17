const { expectRevert, time } = require('@openzeppelin/test-helpers');
const { MAX_UINT256 } = require('@openzeppelin/test-helpers/src/constants');
const MasterChef = artifacts.require('MasterChef');
const MockBEP20 = artifacts.require('MockERC20');

contract('MasterChef', ([alice, bob, carol, dev, minter]) => {
  it('real case', async () => {

    this.usdt = await MockBEP20.new('USDT', 'USDT', '100000000000', {
      from: minter,
    });
    this.lp1 = await MockBEP20.new('LPToken', 'LP1', '1000000', {
      from: minter,
    });
   
    this.chef = await MasterChef.new(
      this.usdt.address,
      dev,
      '100',
      '0',
      '0',
      {
        from: minter,
      }
    );

    await this.lp1.transfer(alice, '100', { from: minter });
    await this.usdt.transfer(this.chef.address, '800', { from: minter });
    // await this.chef.configEndRewardBlock({ from: minter });
    await this.lp1.approve(this.chef.address, MAX_UINT256, { from: alice });

    await this.chef.add('2000', this.lp1.address, true, { from: minter });

    console.log('Starting');
    await seeBalances(alice);

    await this.chef.deposit(0, '20', { from: alice });
    console.log('After deposit');
    await seeBalances(alice);

    // await this.chef.setEndRewardBlockFromNow(5, { from: minter });

    await run10x(time.advanceBlock);

    console.log('After 10x blocks and set end reward block');
    await seeBalances(alice);

    await this.chef.withdraw(0, '20', { from: alice });
    console.log('After withdraw');
    await seeBalances(alice);
  });
});

const run10x = async (func) => {
  for(let i = 0; i < 20; i++)
    await func(); 
}

const seeBalances = async (acc) => {
  console.log('Alice LP: ', (await this.lp1.balanceOf(acc)).toString());
  console.log('Alice Expected USDT: ', (await this.chef.pendingRewardToken(0, acc)).toString());
  console.log('Alice USDT: ', (await this.usdt.balanceOf(acc)).toString());
  console.log('');
}
