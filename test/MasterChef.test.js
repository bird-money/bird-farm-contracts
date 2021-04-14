const { expectRevert, time } = require('@openzeppelin/test-helpers');
const { MAX_UINT256 } = require('@openzeppelin/test-helpers/src/constants');
const BirdFarm = artifacts.require('BirdFarm');
const MockBEP20 = artifacts.require('MockERC20');

contract('BirdFarm', ([alice, bob, carol, dev, minter]) => {
  beforeEach(async () => {
    this.usdt = await MockBEP20.new('USDT', 'USDT', toWei('100000000'), {
      from: minter,
    });

    this.chef = await BirdFarm.new(this.usdt.address, {
      from: minter,
    });

    await this.usdt.mint(this.chef.address, toWei('1000000'), {
      from: minter,
    });

    this.lp1 = await MockBEP20.new('LPToken', 'LP1', toWei('1000000'), {
      from: minter,
    });

    this.lp2 = await MockBEP20.new('LPToken', 'LP2', toWei('1000000'), {
      from: minter,
    });

    await this.lp1.transfer(bob, toWei('2000'), { from: minter });
    await this.lp2.transfer(bob, toWei('2000'), { from: minter });

    await this.lp1.transfer(alice, toWei('2000'), { from: minter });
    await this.lp2.transfer(alice, toWei('2000'), { from: minter });
  });

  it('real case', async () => {
    await this.chef.addPool('2000', this.lp1.address, true, {
      from: minter,
    });

    await this.chef.addPool('2000', this.lp2.address, true, {
      from: minter,
    });

    await this.lp1.approve(this.chef.address, MAX_UINT256, { from: alice });
    // await this.lp2.approve(this.chef.address, MAX_UINT256, { from: alice });

    assert.equal((await this.usdt.balanceOf(alice)).toString(), '0');
    console.log(
      'alice balance usdt before deposit lp tokens: ',
      (await this.usdt.balanceOf(alice)).toString()
    );

    await this.chef.deposit(0, toWei('10'), { from: alice });
    await time.advanceBlock();
    await time.advanceBlock();
    await this.chef.withdraw(0, toWei('10'), { from: alice });

    // await this.chef.harvestPendingReward(0, { from: alice });

    console.log(
      '\npending reward token: ',
      fromWei(await this.chef.pendingRewardToken(0, alice)).toString()
    );
    console.log(
      'alice balance: ',
      fromWei(await this.usdt.balanceOf(alice)).toString()
    );

    await time.advanceBlock();
    await time.advanceBlock();
    await this.chef.harvestPendingReward(0, { from: alice });

    console.log(
      '\npending reward token: ',
      fromWei(await this.chef.pendingRewardToken(0, alice)).toString()
    );
    console.log(
      'alice balance: ',
      fromWei(await this.usdt.balanceOf(alice)).toString()
    );

    await time.advanceBlock();
    await time.advanceBlock();
    // await this.chef.harvestPendingReward(0, { from: alice });

    console.log(
      '\npending reward token: ',
      fromWei(await this.chef.pendingRewardToken(0, alice)).toString()
    );
    console.log(
      'alice balance: ',
      fromWei(await this.usdt.balanceOf(alice)).toString()
    );
  });
});

// multiple pools multiple people getReward harvestReward deposit with draw

const toWei = w => web3.utils.toWei(w);
const fromWei = w => web3.utils.fromWei(w);
