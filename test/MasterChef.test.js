const { expectRevert, time } = require('@openzeppelin/test-helpers');
const { MAX_UINT256 } = require('@openzeppelin/test-helpers/src/constants');
const BirdFarm = artifacts.require('BirdFarm');
const PinkToken = artifacts.require('PinkToken');
const BlueToken = artifacts.require('BlueToken');

contract('BirdFarm', ([alice, bob, carol, dev, minter]) => {
  it('real case', async () => {
    this.usdt = await PinkToken.new('USDT', 'USDT', bigWei(), {
      from: minter,
    });

    this.lp1 = await BlueToken.new('LPToken', 'LP1', toWei('1000000'), {
      from: minter,
    });

    this.lp2 = await BlueToken.new('LPToken', 'LP2', toWei('1000000'), {
      from: minter,
    });

    this.chef = await BirdFarm.new(this.usdt.address, {
      from: minter,
    });

    await this.lp1.transfer(bob, toWei('100'), { from: minter });
    await this.lp1.transfer(alice, toWei('100'), { from: minter });

    await this.chef.addPool('2000', this.lp1.address, true, {
      from: minter,
    });

    await this.usdt.approve(this.chef.address, MAX_UINT256, { from: minter });
    console.log(
      'End Reward Block: ',
      (await this.chef.endRewardBlock()).toString()
    );

    await this.chef.addRewardTokensToContract(toWei('100000'), {
      from: minter,
    });

    await this.chef.setEndRewardBlockFromNow(10, {
      from: minter,
    });
    console.log(
      'End Reward Block: ',
      (await this.chef.endRewardBlock()).toString()
    );

    await this.lp1.approve(this.chef.address, MAX_UINT256, { from: alice });

    assert.equal((await this.usdt.balanceOf(alice)).toString(), '0');
    

    await seeBalances(alice);

    await this.chef.deposit(0, toWei('10'), { from: alice });
    await time.advanceBlock();
    await seeBalances(alice);

    await this.chef.withdraw(0, toWei('10'), { from: alice });
    await seeBalances(alice);

    await this.chef.harvestPendingReward(0, { from: alice });
    await seeBalances(alice);
    
  });
});

// multiple pools multiple people getReward harvestReward deposit with draw

const toWei = w => web3.utils.toWei(w);
const fromWei = w => web3.utils.fromWei(w);
const bigWei = w => toWei(toWei('1'));
const seeBalances = async acc => {
  console.log(
    '\nalice pending reward: ',
    fromWei(await this.chef.pendingRewardToken(0, acc)).toString()
  );
  console.log(
    'alice usdt: ',
    fromWei(await this.usdt.balanceOf(acc)).toString(), "\n"
  );
}
