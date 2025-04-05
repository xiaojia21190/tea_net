import "dotenv/config";

import { createWalletClient, http, publicActions, parseEther, defineChain, getContract, parseAbi } from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { appendFileSync, readFileSync } from 'fs';

// 你的私钥，用于签署交易（请勿在生产环境中硬编码私钥！）
const PRIVATE_KEY = process.env.PRIVATE_KEY
const rpcUrl = 'https://tea-sepolia.g.alchemy.com/public'; // Public RPC URL for Tea Sepolia
const tokenContractAddress = "0x02E54245375ac8c00b568D1E0b2857dC65346178";
const amountTran = '0.0000001';    //以Token decimals 为单位 (例如，18 decimals, 1 = 1 * 10^18)

// 检查私钥是否存在
if (!PRIVATE_KEY) {
  throw new Error('PRIVATE_KEY environment variable is not set');
}

// 定义 tea 链
const teaChain = defineChain({
  id: 10218,      // Chain ID for Tea Sepolia
  name: 'TeaSepolia',   // Network Name
  network: 'Tea Sepolia',  // Network Name
  nativeCurrency: {
    decimals: 18,
    name: 'TEA',     // Currency Symbol
    symbol: 'TEA'    // Currency Symbol
  },
  rpcUrls: {
    default: { http: [rpcUrl] }, // Use the updated rpcUrl
  },
});

const erc20Abi = parseAbi([
  'function initializeFarm(address player, uint256 plotCount) external',
]);

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

  // 3. 输出到account.txt文件中
  try {
    // 先读取文件
    const content = readFileSync('account.txt', 'utf-8');
    // 追加写入数据
    const data = `${privateKey},${address}\n`; // 数据内容
    appendFileSync('account.txt', data, { flag: 'a' }); // 追加写入
  } catch (err) {
    console.error('写入account.txt文件失败:', err);
  }

  return {
    privateKey,
    address,
  };
}

async function transfer() {
  while (true) {
    try {
      // 获取当前账户余额
      const balance = await client.getBalance({ address: account.address });
      const amountToSend = parseEther(amountTran);

      // 检查余额是否足够
      if (balance < amountToSend) {
        console.log("余额不足，等待充值...");
        await sleep(1000 * 60); // 等待1分钟后重试
        continue;
      }

      const randomAddress = await generateRandomAddress();
      console.log("目标地址:", randomAddress.address);
      console.log("目标私钥:", randomAddress.privateKey);

      await sleep(1000 * 5);

      const tx = await client.sendTransaction({
        to: randomAddress.address,
        value: amountToSend,
      });

      console.log("交易哈希:", tx);

      // 等待交易确认
      const receipt = await client.waitForTransactionReceipt({ hash: tx });
      console.log("交易已确认，区块号:", receipt.blockNumber);

      //交互合约 初始化农场
      console.log("开始初始化农场");
      const tokenContract = getContract({
        address: tokenContractAddress,
        abi: erc20Abi,
        client: client
      })

      const hash = await tokenContract.write.initializeFarm([randomAddress.address, BigInt(10)]);

      console.log('交易哈希:', hash);

      // 等待交易确认并添加重试机制
      let retries = 3;
      while (retries > 0) {
        try {
          const receipt = await client.waitForTransactionReceipt({ hash });
          console.log('交易已确认，区块号:', receipt);
          retries = 0; // 成功后退出重试循环
        } catch (error) {
          retries--;
          if (retries === 0) throw error;
          await sleep(1000 * 5); // 等待5秒后重试
        }
      }

      // 成功后等待一段时间再进行下一次交易
      await sleep(1000 * 10);

    } catch (error) {
      console.error("交易失败:", error);
      // 发生错误时等待较长时间后重试
      await sleep(1000 * 30);
    }
  }
}

export default transfer;
