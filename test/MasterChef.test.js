const { expectRevert, time } = require('@openzeppelin/test-helpers');
const BirdFarm = artifacts.require('BirdFarm');
const MockBEP20 = artifacts.require('MockERC20');

contract('BirdFarm', ([alice, bob, carol, dev, minter]) => {
  beforeEach(async () => {
    this.usdt = await MockBEP20.new('USDT', 'USDT', '100000000000', {
      from: minter,
    });

    this.chef = await BirdFarm.new(this.usdt.address, {
      from: minter,
    });
    await this.usdt.transfer(this.chef.address, '1000000', {
      from: minter,
    });

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
    await this.chef.addPool('2000', this.lp1.address, true, {
      from: minter,
    });

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

    // await this.chef.addPool('100', this.lp1.address, true, { from: minter });
    // await this.lp1.approve(this.chef.address, '1000', { from: alice });
    // await this.chef.deposit(10, '20', { from: alice });

    //assert.equal((await this.usdt.balanceOf(alice)).toString(), '778');

    // assert.equal((await this.chef.getPoolPoint(0, { from: minter })).toString(), '1900');
  });

  it('2 people deposit tokens to 2 pools and checkreward, harvest reward, withdraw tokens. add tokens again checkreward, harvest reward, withdraw tokens ', async () => {
    await this.chef.addPool('2000', this.lp1.address, true, {
      from: minter,
    });
    await this.chef.addPool('2000', this.lp2.address, true, {
      from: minter,
    });

    await this.lp1.approve(this.chef.address, '1000', { from: alice });
    await this.lp2.approve(this.chef.address, '1000', { from: alice });
    await this.lp1.approve(this.chef.address, '1000', { from: bob });
    await this.lp2.approve(this.chef.address, '1000', { from: bob });

    assert.equal((await this.usdt.balanceOf(alice)).toString(), '0');
    assert.equal((await this.usdt.balanceOf(bob)).toString(), '0');

    console.log(
      'alice balance usdt before deposit lp tokens: ',
      (await this.usdt.balanceOf(alice)).toString()
    );
    await time.advanceBlock();
    await time.advanceBlock();
    await time.advanceBlock();

    await this.chef.deposit(0, '10', { from: alice });
    await this.chef.deposit(1, '10', { from: alice });
    await time.advanceBlock();
    await time.advanceBlock();
    await time.advanceBlock();

    console.log(
      'Alice pending reward pool 0: ',
      (await this.chef.pendingRewardToken(0, alice)).toString()
    );
    console.log(
      'Alice pending reward pool 1: ',
      (await this.chef.pendingRewardToken(1, alice)).toString()
    );
    await this.chef.harvestPendingReward(0, { from: alice });
    await this.chef.harvestPendingReward(1, { from: alice });
    // await time.increase(time.duration.minutes(5));
    await this.chef.withdraw(0, '10', { from: alice });
    await this.chef.withdraw(1, '10', { from: alice });

    console.log(
      'alice balance usdt after deposit lp tokens: ',
      (await this.usdt.balanceOf(alice)).toString()
    );
    assert.equal((await this.usdt.balanceOf(alice)).toString(), '500'); // reward get from both pools after 2 blocks

    console.log(
      'bob balance usdt before deposit lp tokens: ',
      (await this.usdt.balanceOf(bob)).toString()
    );
    await this.chef.deposit(0, '10', { from: bob });
    await this.chef.deposit(1, '10', { from: bob });
    console.log(
      'Bob pending reward pool 0: ',
      (await this.chef.pendingRewardToken(0, bob)).toString()
    );

    console.log(
      'Bob pending reward pool 0: ',
      (await this.chef.pendingRewardToken(0, bob)).toString()
    );
    await this.chef.harvestPendingReward(0, { from: bob });
    console.log(
      'Bob balance usdt after deposit lp tokens: ',
      (await this.usdt.balanceOf(bob)).toString()
    );
    assert.equal((await this.usdt.balanceOf(bob)).toString(), '100'); // reward from 1 pool only
  });
});

// multiple pools multiple people getReward harvestReward deposit with draw
