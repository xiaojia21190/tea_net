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
  'function decimals() public view returns (uint8)' // 获取精度
]);


async function sendToken(address: `0x${string}`) {
  try {
    // 创建ERC-20合约实例
    const tokenContract = getContract({
      address: tokenContractAddress,
      abi: erc20Abi,
      client: walletClient
    })

    // 获取 Token 精度
    const decimals = await tokenContract.read.decimals();
    const amount = ethers.parseUnits(amountToSend, decimals)
    // 直接调用合约的 transfer 方法
    const hash = await tokenContract.write.transfer([address, amount])
    console.log('Transaction Hash:', hash);
    // 等待交易确认
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log('Transaction Receipt:', receipt)
  } catch (error) {
    console.error('Error sending token:', error);
  }
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

async function send() {
  while (true) {
    try {
      const randomAddress = await generateRandomAddress();
      console.log(randomAddress);
      await sleep(1000 * 5);
      sendToken(randomAddress.address);
    } catch (error) {
      console.error('Error sending token:', error);
    }
  }
}


export default send;


