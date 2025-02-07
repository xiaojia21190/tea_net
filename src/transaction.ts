import "dotenv/config";

import { createWalletClient, http, publicActions, parseEther, defineChain } from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";

// 你的私钥，用于签署交易（请勿在生产环境中硬编码私钥！）
const PRIVATE_KEY = process.env.PRIVATE_KEY
const rpcUrl = 'https://assam-rpc.tea.xyz/'; // 替换为你的 RPC URL (tea 链)
const amountTran = '0.00001';    //以Token decimals 为单位 (例如，18 decimals, 1 = 1 * 10^18)

// 检查私钥是否存在
if (!PRIVATE_KEY) {
  throw new Error('PRIVATE_KEY environment variable is not set');
}

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

// 创建账户
const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);

const client = createWalletClient({
  account: account,
  chain: teaChain,
  transport: http(),
}).extend(publicActions);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateRandomAddress() {
  // 1. 生成随机私钥
  const privateKey = generatePrivateKey();

  // 2. 从私钥派生 Account object
  const account = privateKeyToAccount(privateKey);

  const address = account.address;

  return {
    privateKey,
    address,
  };
}

async function transfer() {
  while (true) {
    try {
      const randomAddress = await generateRandomAddress();
      console.log(randomAddress);
      await sleep(1000 * 5);
      const tx = await client.sendTransaction({
        to: randomAddress.address,
        value: parseEther(amountTran),
      });
      console.log("tx", tx);
      console.log("Transaction completed");
    } catch (error) {
      console.error("Failed to create swap:", error);
    }
  }
}

export default transfer;
