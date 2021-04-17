const { expectRevert, time } = require('@openzeppelin/test-helpers');
const { MAX_UINT256 } = require('@openzeppelin/test-helpers/src/constants');
const BirdFarm = artifacts.require('BirdFarm');
const MockBEP20 = artifacts.require('MockERC20');

contract('BirdFarm', ([alice, bob, carol, dev, minter]) => {
  it('real case', async () => {
    this.usdt = await MockBEP20.new('USDT', 'USDT', millionTokens(), {
      from: minter,
    });

    this.lp1 = await MockBEP20.new('LPToken', 'LP1', millionTokens(), {
      from: minter,
    });

    this.chef = await BirdFarm.new(this.usdt.address, {
      from: minter,
    });

    await this.lp1.transfer(alice, toWei('30'), { from: minter });

    //BEFORE: await this.usdt.transfer(this.chef.address, '8000000000000000000', { from: minter });
    //NOW:
    // const rewardSupply = toWei('30000');
    const rewardSupply = toWei('0.2');
    await this.usdt.approve(this.chef.address, MAX_UINT256, { from: minter });
    await this.chef.addRewardTokensToContract(rewardSupply, { from: minter });

    await this.lp1.approve(this.chef.address, MAX_UINT256, { from: alice });
    await this.chef.add('2000', this.lp1.address, true, { from: minter });
    console.log('Starting');
    console.log(
      fromWei(await this.chef.rewardPerBlock()).toString(),
      ' Reward Tokens Per Block'
    );
    await seeBalances(alice);

    await this.chef.deposit('0', toWei('30'), { from: alice });
    console.log('After deposit');
    await seeBalances(alice);

    await time.advanceBlock();
    console.log('After 1x block');
    await seeBalances(alice);

    console.log('After adding 0.2 tokens');
    await this.chef.addRewardTokensToContract(toWei('2'), { from: minter });
    await seeBalances(alice);

    await run10x(time.advanceBlock);
    console.log('After 10x blocks');
    await seeBalances(alice);

    await this.chef.harvest(0, { from: alice });
    console.log('After >> Harvest >>');
    await seeBalances(alice);

    await run10x(time.advanceBlock);
    console.log('After 10x blocks');
    await seeBalances(alice);

    await this.chef.withdraw(0, toWei('30'), { from: alice });
    console.log('I Did withdraw');
    await seeBalances(alice);

    await this.chef.harvest(0, { from: alice });
    console.log('After >> Harvest >>');
    await seeBalances(alice);

    //   // 0.01 eth 1 eth rew per block
  });
});

const seeBalances = async acc => {
  console.log(
    fromWei((await this.usdt.balanceOf(this.chef.address)).toString()),
    ' MasterChef Reward Tokens'
  );
  console.log(
    fromWei((await this.usdt.balanceOf(acc)).toString()),
    ' Alice Reward Tokens'
  );
  console.log(
    fromWei((await this.lp1.balanceOf(acc)).toString()),
    ' Alice Pool Tokens'
  );
  console.log(
    fromWei((await this.chef.userInfo('0', acc)).amount.toString()),
    ' Alice Staked Pool Tokens'
  );
  console.log(
    fromWei((await this.chef.pendingRewardToken('0', acc)).toString()),
    ' Alice Pending Reward Tokens'
  );
  console.log('');
};

const run10x = async func => {
  for (let i = 0; i < 10; i++) await func();
};

const fromWei = w => web3.utils.fromWei(w);
const toWei = w => web3.utils.toWei(w);
const millionTokens = () => toWei('1000000');
