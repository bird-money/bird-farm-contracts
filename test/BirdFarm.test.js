const { expectRevert, time } = require('@openzeppelin/test-helpers');
const { MAX_UINT256 } = require('@openzeppelin/test-helpers/src/constants');
const BirdFarm = artifacts.require('BirdFarm');
const MockBEP20 = artifacts.require('MockERC20');

contract('BirdFarm', ([alice, bob, carol, dev, minter]) => {
  it('real case', async () => {
    this.usdt = await MockBEP20.new('USDT', 'USDT', '100000000000', {
      from: minter,
    });
    this.lp1 = await MockBEP20.new('LPToken', 'LP1', '1000000', {
      from: minter,
    });

    this.chef = await BirdFarm.new(this.usdt.address, {
      from: minter,
    });

    await this.lp1.transfer(alice, '100', { from: minter });
    await this.usdt.transfer(this.chef.address, '800', { from: minter });
    await this.lp1.approve(this.chef.address, MAX_UINT256, { from: alice });
    await this.chef.add('2000', this.lp1.address, true, { from: minter });
    console.log('Starting');
    await seeBalances(alice);

    await this.chef.deposit(0, '20', { from: alice });
    console.log('After deposit');
    await seeBalances(alice);

    await time.advanceBlock();
    console.log('After 1x block');
    await seeBalances(alice);

    await this.chef.withdraw(0, '20', { from: alice });
    console.log('After withdraw');
    await seeBalances(alice);

    await run10x(time.advanceBlock);
    console.log('After 10x blocks');
    await seeBalances(alice);

    // 0.01 eth 1 eth rew per block
  });
});

const run10x = async func => {
  for (let i = 0; i < 10; i++) await func();
};

const seeBalances = async acc => {
  console.log(
    (await this.usdt.balanceOf(this.chef.address)).toString(),
    ' MasterChef Reward Tokens'
  );
  console.log(
    (await this.usdt.balanceOf(acc)).toString(),
    ' Alice Reward Tokens'
  );
  console.log((await this.lp1.balanceOf(acc)).toString(), ' Alice Pool Tokens');
  console.log(
    (await this.chef.userInfo(0, acc)).amount.toString(),
    ' Alice Staked Pool Tokens'
  );
  console.log(
    (await this.chef.pendingRewardToken(0, acc)).toString(),
    ' Alice Pending Reward Tokens'
  );
  console.log('');
};
