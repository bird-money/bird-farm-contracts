const { expectRevert, time } = require('@openzeppelin/test-helpers');
const MasterChef = artifacts.require('MasterChef');
const MockBEP20 = artifacts.require('MockERC20');

contract('MasterChef', ([alice, bob, carol, dev, minter]) => {
  beforeEach(async () => {});
  it('real case', async () => {
    this.usdt = await MockBEP20.new('USDT', 'USDT', '1000000', {
      from: minter,
    });
    this.lp1 = await MockBEP20.new('LPToken', 'LP1', '1000000', {
      from: minter,
    });

    this.chef = await MasterChef.new(
      this.usdt.address,
      dev,
      '1000', // reward per block
      '0', // start reward block
      '0', // bonus end block
      {
        from: minter,
      }
    );
    console.log('MasterChef: ', this.chef.address);
    console.log(
      'rewardTokenPerBlock: ',
      (await this.chef.rewardTokenPerBlock()).toString()
    );

    await this.usdt.transferOwnership(this.chef.address, { from: minter });

    await this.lp1.transfer(bob, '2000', { from: minter });
    await this.lp1.transfer(alice, '2000', { from: minter });
    await this.chef.add('2000', this.lp1.address, true, { from: minter });

    await this.lp1.approve(this.chef.address, '1000', { from: alice });
    assert.equal((await this.usdt.balanceOf(alice)).toString(), '0');

    await this.chef.deposit(0, '1000', { from: alice });
    await this.chef.withdraw(0, '0', { from: alice });
    assert.equal((await this.usdt.balanceOf(alice)).toString(), '1000');
  });
});
