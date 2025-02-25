import "dotenv/config";
import { createPublicClient, createWalletClient, http, getContract, parseAbi } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { defineChain } from 'viem'; // 导入defineChain
import { ethers } from 'ethers';

// 配置你的账户和 RPC
const privateKey = process.env.PRIVATE_KEY
const rpcUrl = 'https://assam-rpc.tea.xyz/'; // 替换为你的 RPC URL (tea 链)
const tokenContractAddress = '0xDc31fCb2A1FdE8627266DD72A6a51Ce68C19A4f5'; // 替换为你要发送的代币的合约地址
const amountToSend = '0.00001';    //以Token decimals 为单位 (例如，18 decimals, 1 = 1 * 10^18)


// 定义 tea 链
const teaChain = defineChain({
  id: 93384,      // 请替换 tea 网络的 Chain ID
  name: 'TeaAssam',   // 请替换 tea 网络名称
  network: 'tea-assam',  // 可选： 如果 `tea` 有网络名称
  nativeCurrency: {  // 请替换 tea 的原生代币
    decimals: 18,
    name: '$TEA',
    symbol: '$TEA'
  },
  rpcUrls: {
    default: { http: [rpcUrl] },
  },
});

// 创建 viem 客户端
const publicClient = createPublicClient({
  chain: teaChain,
  transport: http(rpcUrl)
});

const account = privateKeyToAccount(privateKey as `0x${string}`);
const walletClient = createWalletClient({
  account: account,
  chain: teaChain,
  transport: http(rpcUrl)
});

// ERC-20 代币合约 ABI
const erc20Abi = parseAbi([
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function decimals() public view returns (uint8)',
  'function balanceOf(address account) external view returns (uint256)'
]);


async function sendToken(address: `0x${string}`) {
  try {
    const tokenContract = getContract({
      address: tokenContractAddress,
      abi: erc20Abi,
      client: walletClient
    })

    // 检查发送者余额
    const balance = await tokenContract.read.balanceOf([account.address]);
    const decimals = await tokenContract.read.decimals();
    const amount = ethers.parseUnits(amountToSend, decimals);

    if (balance < amount) {
      throw new Error('余额不足');
    }

    // 发送代币
    const hash = await tokenContract.write.transfer([address, amount]);
    console.log('Transaction Hash:', hash);

    // 等待交易确认并添加重试机制
    let retries = 3;
    while (retries > 0) {
      try {
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log('Transaction Receipt:', receipt);
        return receipt;
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
        await sleep(1000 * 5); // 等待5秒后重试
      }
    }
  } catch (error) {
    console.error('发送代币失败:', error);
    throw error; // 向上传递错误
  }
}

async function send() {
  const maxAttempts = 100; // 设置最大尝试次数
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const randomAddress = await generateRandomAddress();
      console.log('生成的随机地址:', randomAddress);
      await sleep(1000 * 5);
      await sendToken(randomAddress.address);
      attempts++;
    } catch (error) {
      console.error('发送失败:', error);
      await sleep(1000 * 10); // 发生错误时等待更长时间
    }
  }
  console.log('达到最大尝试次数，程序结束');
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateRandomAddress() {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  const address = account.address;

  return {
    privateKey,
    address,
  };
}

export default send;


