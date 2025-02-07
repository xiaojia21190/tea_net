import send from './sendToken';
import transfer from './transaction';

async function main() {
  await transfer();
  await send()
}

main();
