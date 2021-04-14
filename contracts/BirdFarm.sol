// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// BirdFarm is the master of RewardToken. He can make RewardToken and he is a fair guy.
//
// Note that it's ownable and the owner wields tremendous power. The ownership
// will be transferred to a governance smart contract once REWARD_TOKEN is sufficiently
// distributed and the community can show to govern itself.
//
// Have fun reading it. Hopefully it's bug-free. God bless.

/// @title Farming service for pool tokens
/// @author Bird Money
/// @notice You can use this contract to deposit pool tokens and get rewards
/// @dev Admin can add a new Pool, users can deposit pool tokens, harvestReward, withdraw pool tokens
contract BirdFarm is Ownable {
    using SafeMath for uint256;

    /// @notice user can get reward and unstake after this time only.
    /// @dev No froze time initially, if needed it can be added and informed to community.
    uint256 public unstakeFrozenTime = 0 seconds;

    /// @dev No froze time initially, if needed it can be added and informed to community.
    uint256 public rewardFrozenTime = 0 seconds;

    /// @dev The block number when REWARD_TOKEN distribution starts.
    uint256 public startRewardBlock = 0;

    /// @dev The block number when REWARD_TOKEN distribution stops.
    uint256 public endRewardBlock = MAX_UINT; // MAX UINT

    /// @dev REWARD_TOKEN tokens created per block.
    uint256 public rewardTokenPerBlock = 100 ether;

    /// @dev The REWARD_TOKEN TOKEN!
    IERC20 public rewardToken;

    /// @dev Info of each pool.
    PoolInfo[] public poolInfo;

    /// @dev To prevent a token to added in multiple pools
    mapping(IERC20 => bool) public uniqueTokenInPool;

    /// @dev Info of each user that staked tokens.
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;

    mapping(address => mapping(uint256 => uint256)) private pendingRewardOf;

    /// @dev Total allocation poitns. Must be the sum of all allocation points in all pools.
    uint256 public totalAllocPoint = 0;

    /// @dev max number used to set some variable like reward ending block initially
    uint256 public constant MAX_UINT = type(uint256).max;

    /// @dev deposit tokens in contract to get reward
    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);

    /// @dev withdraw deposit tokens in contract to get reward
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);

    /// @dev harvest tokens from contract to get reward
    event Harvest(address indexed user, uint256 indexed pid, uint256 amount);

    /// @dev emergeny withdraw of pool tokens from contract
    event EmergencyWithdraw(
        address indexed user,
        uint256 indexed pid,
        uint256 amount
    );

    /// @dev emergeny withdraw of pool tokens from contract
    /// @param _rewardToken the token in which reward will be givenss
    constructor(IERC20 _rewardToken) public {
        rewardToken = _rewardToken;
    }

    // Info of each user.
    struct UserInfo {
        uint256 amount; // How many pool tokens the user has staked
        uint256 rewardDebt; // Reward debt. See explanation below.
        uint256 unstakeTime; // user can unstake pool tokens at this time or after this time to get reward
        //
        // We do some fancy math here. Basically, any point in time, the amount of REWARD_TOKENs
        // entitled to a user but is pending to be distributed is:
        //
        //   pending reward = (user.amount * pool.accRewardTokenPerShare) - user.rewardDebt
        //
        // Whenever a user deposits or withdraws pool tokens to a pool. Here's what happens:
        //   1. The pool's `accRewardTokenPerShare` (and `lastRewardBlock`) gets updated.
        //   2. User pnding reward saved to this contract.
        //   3. User's `amount` gets updated.
        //   4. User's `rewardDebt` gets updated.
    }

    // Info of each pool.
    struct PoolInfo {
        IERC20 poolToken; // Address of pool token contract.
        uint256 allocPoint; // How many allocation points assigned to this pool. REWARD_TOKENs to distribute per block.
        uint256 lastRewardBlock; // Last block number that REWARD_TOKENs distribution occurs.
        uint256 accRewardTokenPerShare; // Accumulated REWARD_TOKENs per share, times 1e12. See below.
    }

    /// @notice Adds a new pool. Can only be called by the owner.
    /// @dev Only adds unique pool token
    /// @param _allocPoint The weight of this pool. The more it is the more percentage of reward per block it will get for its users with respect to other pools. But the total reward per block remains same.
    /// @param _poolToken The Liquidity Pool Token of this pool
    /// @param _withUpdate if true then it updates the reward tokens to be given for each of the tokens staked
    function addPool(
        uint256 _allocPoint,
        IERC20 _poolToken,
        bool _withUpdate
    ) external onlyOwner {
        require(!uniqueTokenInPool[_poolToken], "Token already added");
        if (_withUpdate) {
            massUpdatePools();
        }
        uint256 lastRewardBlock =
            block.number > startRewardBlock ? block.number : startRewardBlock;
        totalAllocPoint = totalAllocPoint.add(_allocPoint);
        poolInfo.push(
            PoolInfo({
                poolToken: _poolToken,
                allocPoint: _allocPoint,
                lastRewardBlock: lastRewardBlock,
                accRewardTokenPerShare: 0
            })
        );
        uniqueTokenInPool[_poolToken] = true;
        emit PoolAdded(_allocPoint, _poolToken, _withUpdate);
    }

    event PoolAdded(uint256 allocPoint, IERC20 poolToken, bool withUpdate);

    /// @notice Update the given pool's REWARD_TOKEN pool weight. Can only be called by the owner.
    /// @dev it can change weight of pool with repect to other pools
    /// @param _pid pool id
    /// @param _allocPoint The weight of this pool. The more it is the more percentage of reward per block it will get for its users with respect to other pools. But the total reward per block remains same.
    /// @param _withUpdate if true then it updates the reward tokens to be given for each of the tokens staked
    function setAllocPoint(
        uint256 _pid,
        uint256 _allocPoint,
        bool _withUpdate
    ) external onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        totalAllocPoint = totalAllocPoint.sub(poolInfo[_pid].allocPoint).add(
            _allocPoint
        );
        poolInfo[_pid].allocPoint = _allocPoint;
    }

    /// @notice Tells the number of blocks eligible for rewards.
    /// @dev Return reward multiplier over the given _from to _to block
    /// @param _from start block
    /// @param _to end block
    /// @return number of blocks eligible for rewards

    function getMultiplier(uint256 _from, uint256 _to)
        internal
        view
        returns (uint256)
    {
        uint256 from = _from < startRewardBlock ? startRewardBlock : _from;
        uint256 to = _to > endRewardBlock ? endRewardBlock : _to;
        return to.sub(from);
    }

    /// @notice get reward tokens to show on UI
    /// @dev calculates reward tokens of a user with repect to pool id
    /// @param _pid the pool id
    /// @param _user the user who is calls this function
    /// @return pending reward token of a user
    // View function to see pending REWARD_TOKENs on frontend.
    function pendingRewardToken(uint256 _pid, address _user)
        external
        view
        returns (uint256)
    {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accRewardTokenPerShare = pool.accRewardTokenPerShare;
        uint256 poolSupply = pool.poolToken.balanceOf(address(this));

        uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
        uint256 rewardTokenReward =
            multiplier.mul(rewardTokenPerBlock).mul(pool.allocPoint).div(
                totalAllocPoint
            );

        if (poolSupply != 0)
            accRewardTokenPerShare = accRewardTokenPerShare.add(
                rewardTokenReward.mul(1e12).div(poolSupply)
            );

        return
            getReward(_pid) +
            user.amount.mul(accRewardTokenPerShare).div(1e12).sub(
                user.rewardDebt
            );
    }

    /// @notice updates different variables needed for reward calculation for all pools
    /// @dev updates lastRewardBlock and accRewardTokenPerShare of all pools. Be careful of gas spending!
    function massUpdatePools() internal {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    /// @notice updates different variables needed for reward calculation
    /// @dev updates lastRewardBlock and accRewardTokenPerShare of a pool
    /// @param _pid pool id
    function updatePool(uint256 _pid) internal {
        PoolInfo storage pool = poolInfo[_pid];

        if (block.number < startRewardBlock || block.number > endRewardBlock) {
            return;
        }

        uint256 poolSupply = pool.poolToken.balanceOf(address(this));
        if (poolSupply == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
        uint256 rewardTokenReward =
            multiplier.mul(rewardTokenPerBlock).mul(pool.allocPoint).div(
                totalAllocPoint
            );
        pool.accRewardTokenPerShare = pool.accRewardTokenPerShare.add(
            rewardTokenReward.mul(1e12).div(poolSupply)
        );
        pool.lastRewardBlock = block.number;
    }

    /// @notice deposit tokens to get rewards
    /// @dev deposit pool tokens to BirdFarm for reward tokens allocation.
    /// @param _pid pool id
    /// @param _amount how many tokens you want to stake
    function deposit(uint256 _pid, uint256 _amount) external {
        require(_amount > 0, "Must deposit amount more than ZERO");

        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(
            pool.poolToken.balanceOf(msg.sender) >= _amount,
            "Must deposit amount more than ZERO"
        );

        updatePool(_pid);

        uint256 pending =
            user.amount.mul(pool.accRewardTokenPerShare).div(1e12).sub(
                user.rewardDebt
            );
        savePendingReward(msg.sender, _pid, pending);
        if (user.amount == 0) user.unstakeTime = now + unstakeFrozenTime;

        user.amount = user.amount.add(_amount);
        user.rewardDebt = user.amount.mul(pool.accRewardTokenPerShare).div(
            1e12
        );
        require(
            pool.poolToken.transferFrom(
                address(msg.sender),
                address(this),
                _amount
            ),
            "Error in deposit of pool tokens."
        );
        emit Deposit(msg.sender, _pid, _amount);
    }

    /// @notice get the tokens back from BardFarm
    /// @dev withdraw or unstake pool tokens from BidFarm
    /// @param _pid pool id
    /// @param _amount how many pool tokens you want to unstake
    function withdraw(uint256 _pid, uint256 _amount) external {
        require(_amount > 0, "Must withdraw amount more than ZERO");
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(
            user.amount >= _amount,
            "You have less pool tokens available than requested."
        );
        require(now >= user.unstakeTime, "Can not unstake at this time.");

        updatePool(_pid);
        uint256 pending =
            user.amount.mul(pool.accRewardTokenPerShare).div(1e12).sub(
                user.rewardDebt
            );
        savePendingReward(msg.sender, _pid, pending);
        user.amount = user.amount.sub(_amount);
        user.rewardDebt = user.amount.mul(pool.accRewardTokenPerShare).div(
            1e12
        );
        require(
            pool.poolToken.transfer(address(msg.sender), _amount),
            "Error in withdraw pool tokens."
        );
        emit Withdraw(msg.sender, _pid, _amount);
    }

    /// @notice harvest reward tokens from BardFarm
    /// @dev harvest reward tokens from BidFarm and update pool variables
    /// @param _pid pool id

    function harvestPendingReward(uint256 _pid) external {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(
            now >= rewardFrozenTime,
            "Can not collect reward at this time."
        );

        updatePool(_pid);
        uint256 pending =
            user.amount.mul(pool.accRewardTokenPerShare).div(1e12).sub(
                user.rewardDebt
            );

        savePendingReward(msg.sender, _pid, pending);

        uint256 reward = getReward(_pid);
        require(reward > 0, "You have no pending reward.");

        user.rewardDebt = user.amount.mul(pool.accRewardTokenPerShare).div(
            1e12
        );

        require(
            rewardToken.balanceOf(address(this)) > reward,
            "This contract has not enough balance"
        );

        // User has collected the reward so pending reward is ZERO
        clearPendingReward(msg.sender, _pid);

        require(
            rewardToken.transfer(msg.sender, reward),
            "Error in transferring reward."
        );
        emit Harvest(msg.sender, _pid, reward);
    }

    /// @notice get the tokens which user staked. In case of EMERGENCY ONLY.
    /// @dev get the pool tokens back from BardFarm without caring about rewards. EMERGENCY ONLY.
    /// @param _pid pool id
    function emergencyWithdraw(uint256 _pid) external {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        user.amount = 0;
        user.rewardDebt = 0;
        require(
            pool.poolToken.transfer(address(msg.sender), user.amount),
            "Error in emergency withdraw of staked tokens."
        );
        emit EmergencyWithdraw(msg.sender, _pid, user.amount);
    }

    /// @notice save pending reward tokens
    /// @dev save pending reward tokens so user can harvest reward later when needed
    /// @param _user the user
    /// @param _pid pool id
    /// @param _amount amount of reward tokens
    function savePendingReward(
        address _user,
        uint256 _pid,
        uint256 _amount
    ) internal {
        pendingRewardOf[_user][_pid] = pendingRewardOf[_user][_pid] + _amount;
    }

    function clearPendingReward(address _user, uint256 _pid) internal {
        pendingRewardOf[_user][_pid] = 0;
    }

    /// @notice gets previous rewards of a user
    /// @dev gets the previous rewards of user so that we can add more rewards to it and save
    /// @param _pid pool id
    /// @return saved number of rewards of user
    function getReward(uint256 _pid) internal view returns (uint256) {
        return pendingRewardOf[msg.sender][_pid];
    }

    /// @notice gets previous rewards of a user
    /// @dev gets the previous rewards of user so that we can add more rewards to it and save
    /// @return total number of pools
    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    /// @notice owner puts reward tokens in contract
    /// @dev owner can add reward token to contract so that it can be distributed to users
    /// @param _amount amount of reward tokens
    function addRewardTokensToContract(uint256 _amount) external onlyOwner {
        require(
            rewardToken.transferFrom(msg.sender, address(this), _amount),
            "Error in adding reward tokens in contract."
        );
        emit AddedRewardTokensToContract(_amount);
    }

    event AddedRewardTokensToContract(uint256 amount);

    /// @notice owner withdraws reward tokens from contract
    /// @dev owner can withdraw reward token from contract
    /// @param _amount amount of reward tokens
    function withdrawRewardTokensFromContract(uint256 _amount)
        external
        onlyOwner
    {
        require(
            rewardToken.transfer(msg.sender, _amount),
            "Error in getting reward tokens from contract."
        );
        emit WithdrawnRewardTokensFromContract(_amount);
    }

    event WithdrawnRewardTokensFromContract(uint256 amount);

    // setters

    /// @notice owner can set multiple values at once
    /// @dev owner can set multiple values at once so it may save gas cost
    /// @param _rewardToken the token in which rewards are given
    /// @param _rewardTokenPerBlock rewards distributed per block to community or users
    /// @param _startRewardBlock the block at which reward token distribution starts
    /// @param _endRewardBlock the block at which reward token distribution ends
    /// @param _unstakeFrozenTime the block at which user can unstake
    /// @param _rewardFrozenTime the block at which user can harvest reward
    function setAll(
        IERC20 _rewardToken,
        uint256 _rewardTokenPerBlock,
        uint256 _startRewardBlock,
        uint256 _endRewardBlock,
        uint256 _unstakeFrozenTime,
        uint256 _rewardFrozenTime
    ) external onlyOwner {
        rewardToken = _rewardToken;
        rewardTokenPerBlock = _rewardTokenPerBlock;
        startRewardBlock = _startRewardBlock;
        endRewardBlock = _endRewardBlock;
        unstakeFrozenTime = _unstakeFrozenTime;
        rewardFrozenTime = _rewardFrozenTime;
        emit ManyValuesChanged(
            _rewardToken,
            _rewardTokenPerBlock,
            _startRewardBlock,
            _endRewardBlock,
            _unstakeFrozenTime,
            rewardFrozenTime
        );
    }

    event ManyValuesChanged(
        IERC20 rewardToken,
        uint256 rewardTokenPerBlock,
        uint256 startRewardBlock,
        uint256 endRewardBlock,
        uint256 unstakeFrozenTime,
        uint256 rewardFrozenTime
    );

    /// @notice owner can change reward token
    /// @dev owner can set reward token
    /// @param _rewardToken the token in which rewards are given

    function setRewardToken(IERC20 _rewardToken) external onlyOwner {
        rewardToken = _rewardToken;
        emit RewardTokenChanged(_rewardToken);
    }

    event RewardTokenChanged(IERC20 rewardToken);

    /// @notice owner can change unstake frozen time
    /// @dev owner can set unstake frozen time
    /// @param _unstakeFrozenTime the block at which user can unstake
    function setUnstakeFrozenTime(uint256 _unstakeFrozenTime)
        external
        onlyOwner
    {
        unstakeFrozenTime = _unstakeFrozenTime;
        emit UnstakeFrozenTimeChanged(_unstakeFrozenTime);
    }

    event UnstakeFrozenTimeChanged(uint256 unstakeFrozenTime);

    /// @notice owner can change reward frozen time
    /// @dev owner can set reward frozen time
    /// @param _rewardFrozenTime the block at which user can harvest reward
    function setRewardFrozenTime(uint256 _rewardFrozenTime) external onlyOwner {
        rewardFrozenTime = _rewardFrozenTime;
        emit RewardFrozenTimeChanged(_rewardFrozenTime);
    }

    event RewardFrozenTimeChanged(uint256 rewardFrozenTime);

    /// @notice owner can change reward token per block
    /// @dev owner can set reward token per block
    /// @param _rewardTokenPerBlock rewards distributed per block to community or users
    function setRewardTokenPerBlock(uint256 _rewardTokenPerBlock)
        external
        onlyOwner
    {
        rewardTokenPerBlock = _rewardTokenPerBlock;
        emit RewardTokenPerBlockChanged(_rewardTokenPerBlock);
    }

    event RewardTokenPerBlockChanged(uint256 rewardTokenPerBlock);

    /// @notice owner can change start reward block
    /// @dev owner can set start reward block
    /// @param _startRewardBlock the block at which reward token distribution starts
    function setStartRewardBlock(uint256 _startRewardBlock) external onlyOwner {
        require(
            _startRewardBlock <= endRewardBlock,
            "Start block must be less or equal to end reward block."
        );
        startRewardBlock = _startRewardBlock;
        emit StartRewardBlockChanged(_startRewardBlock);
    }

    event StartRewardBlockChanged(uint256 startRewardBlock);

    /// @notice owner can change end reward block
    /// @dev owner can set end reward block
    /// @param _endRewardBlock the block at which reward token distribution ends

    function setEndRewardBlock(uint256 _endRewardBlock) external onlyOwner {
        require(
            startRewardBlock <= _endRewardBlock,
            "End reward block must be greater or equal to start reward block."
        );
        endRewardBlock = _endRewardBlock;
        emit EndRewardBlockChanged(_endRewardBlock);
    }

    event EndRewardBlockChanged(uint256 endRewardBlock);

    /// @notice util function to get reward token balance of this contract
    function balanceOf() external view returns (uint256) {
        return balanceOf(msg.sender);
    }

    /// @notice util function to get reward token balance of this contract
    /// @param _user how much reward tokens this user has
    function balanceOf(address _user) public view returns (uint256) {
        return rewardToken.balanceOf(_user);
    }

    // migrator
    IMigratorChef public migrator;

    /// @notice owner can set a migrator contract
    /// @dev owner can set a migrator contract to migrate pool tokens
    /// @param _migrator the migrator contract
    function setMigrator(IMigratorChef _migrator) external onlyOwner {
        migrator = _migrator;
    }

    /// @notice the migarting logic
    /// @dev  Migrate pool token to another pool token contract. Can be called by anyone. We trust that migrator contract is good.
    /// @param _pid the pool id
    function migrate(uint256 _pid) external {
        require(address(migrator) != address(0), "migrate: no migrator");
        PoolInfo storage pool = poolInfo[_pid];
        IERC20 poolToken = pool.poolToken;
        uint256 bal = poolToken.balanceOf(address(this));
        poolToken.approve(address(migrator), bal);
        IERC20 newpoolToken = migrator.migrate(poolToken);
        require(bal == newpoolToken.balanceOf(address(this)), "migrate: bad");
        pool.poolToken = newpoolToken;
    }

    /// @dev owner can change last reward block so that when supply ends no more rewards generated
    function setUpEndRewardBlock()
        external
        onlyOwner
    {
        uint256 blocksInWhichRewardWillEnd =
            balanceOf(address(this)).div(rewardTokenPerBlock);
        endRewardBlock = block.number + blocksInWhichRewardWillEnd;

        emit EndRewardBlockChanged(endRewardBlock);
    }
}

interface IMigratorChef {
    /// @notice the migarting logic
    /// @dev  Migrate pool token to another pool token contract. Can be called by anyone. We trust that migrator contract is good.
    // Perform pool token migration from legacy UniswapV2 to BirdFarm.
    // Take the current pool token address and return the new pool token address.
    // Migrator should have full access to the caller's pool token.
    // Return the new pool token address.
    //
    // Migrator must have allowance access to UniswapV2 LP tokens
    // Bird Money must mint EXACTLY the same amount of BirdMoney BLP tokens
    /// @param token the pool token
    function migrate(IERC20 token) external returns (IERC20);
}

// todo Bird Money BLP Tokens discuss todo
