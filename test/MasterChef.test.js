const { expectRevert, time } = require('@openzeppelin/test-helpers');
const MasterChef = artifacts.require('MasterChef');
const MockBEP20 = artifacts.require('MockERC20');

contract('MasterChef', ([alice, bob, carol, dev, minter]) => {
  beforeEach(async () => {
    this.usdt = await MockBEP20.new('USDT', 'USDT', '100000000000', {
      from: minter,
    });

    this.chef = await MasterChef.new(this.usdt.address, {
      from: minter,
    });
    await this.usdt.transfer(this.chef.address, '1000000', { from: minter });

    this.lp1 = await MockBEP20.new('LPToken', 'LP1', '1000000', {
      from: minter,
    });

    this.lp2 = await MockBEP20.new('LPToken', 'LP2', '1000000', {
      from: minter,
    });

    this.lp3 = await MockBEP20.new('LPToken', 'LP3', '1000000', {
      from: minter,
    });

    await this.lp1.transfer(bob, '2000', { from: minter });
    await this.lp2.transfer(bob, '2000', { from: minter });
    await this.lp3.transfer(bob, '2000', { from: minter });

    await this.lp1.transfer(alice, '2000', { from: minter });
    await this.lp2.transfer(alice, '2000', { from: minter });
    await this.lp3.transfer(alice, '2000', { from: minter });
  });
  it('real case', async () => {
    this.lp4 = await MockBEP20.new('LPToken', 'LP1', '1000000', {
      from: minter,
    });
    this.lp5 = await MockBEP20.new('LPToken', 'LP2', '1000000', {
      from: minter,
    });
    this.lp6 = await MockBEP20.new('LPToken', 'LP3', '1000000', {
      from: minter,
    });
    this.lp7 = await MockBEP20.new('LPToken', 'LP1', '1000000', {
      from: minter,
    });
    this.lp8 = await MockBEP20.new('LPToken', 'LP2', '1000000', {
      from: minter,
    });
    this.lp9 = await MockBEP20.new('LPToken', 'LP3', '1000000', {
      from: minter,
    });
    await this.chef.add('2000', this.lp1.address, true, { from: minter });
    // await this.chef.add('1000', this.lp2.address, true, { from: minter });
    // await this.chef.add('500', this.lp3.address, true, { from: minter });

    await this.lp1.approve(this.chef.address, '1000', { from: alice });
    await this.lp3.approve(this.chef.address, '1000', { from: alice });
    assert.equal((await this.usdt.balanceOf(alice)).toString(), '0');
    console.log(
      'alice balance usdt before deposit lp tokens: ',
      (await this.usdt.balanceOf(alice)).toString()
    );

    await this.chef.deposit(0, '10', { from: alice });
    //await this.chef.deposit(0, '10', { from: alice });
    //await this.chef.pendingRewardToken(0, alice);
    await this.chef.harvestPendingReward(0, { from: alice });
    // await this.chef.deposit(1, '20', { from: alice });
    // await this.chef.withdraw(1, '10', { from: alice });
    console.log(
      'alice balance usdt after deposit lp tokens: ',
      (await this.usdt.balanceOf(alice)).toString()
    );

    // await this.chef.add('100', this.lp1.address, true, { from: minter });
    // await this.lp1.approve(this.chef.address, '1000', { from: alice });
    // await this.chef.deposit(10, '20', { from: alice });

    //assert.equal((await this.usdt.balanceOf(alice)).toString(), '778');

    // assert.equal((await this.chef.getPoolPoint(0, { from: minter })).toString(), '1900');
  });
});
