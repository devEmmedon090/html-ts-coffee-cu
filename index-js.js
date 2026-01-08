import {createWalletClient, custom, createPublicClient, defineChain, parseEther, formatEther} from 'https://esm.sh/viem';
import { contractAddress, abi } from './constants-js.js';

const connectButton = document.getElementById('connectButton');
const fundButton = document.getElementById('fundButton');
const ethAmountInput = document.getElementById('ethAmount');
const balanceButton = document.getElementById('balanceButton');
const withdrawButton = document.getElementById('withdrawButton');
const checkingFundingAmount = document.getElementById('checkingFundingAmount');

let walletClient;
let publicClient;
let FundMe;

async function connect() {
    if (typeof window.ethereum !== 'undefined') {
        console.log("connecting...");

        walletClient = createWalletClient({
            transport: custom(window.ethereum),
        });
        await walletClient.requestAddresses();
        connectButton.innerHTML = "Connected!";
        console.log("connected");

    } else {
        connectButton.innerHTML = "Please install MetaMask!";
    }
}

async function fund() {
    const ethAmount = ethAmountInput.value;
    console.log(`Funding with ${ethAmount} ETH...`)

        if (typeof window.ethereum !== 'undefined') {

        walletClient = createWalletClient({
            transport: custom(window.ethereum),
        });
        const [connectedAccount] = await walletClient.requestAddresses();
        const currentChain = await getCurrentChain(walletClient);

        publicClient = createPublicClient({
            transport: custom(window.ethereum),
        });
        const {request } = await publicClient.simulateContract({
            address: contractAddress,
            abi: abi,
            functionName: 'fund',
            account: connectedAccount,
            chain: currentChain,
            value: parseEther(ethAmount),
        });
        const hash = await walletClient.writeContract(request);
        console.log("Transaction hash:", hash);

    } else {
        connectButton.innerHTML = "Please install MetaMask!";
    }
}

async function withdraw() {
    console.log('Withdrawing funds...');

    if (typeof window.ethereum !== 'undefined') {
        walletClient = createWalletClient({
            transport: custom(window.ethereum),
        });
        const [connectedAccount] = await walletClient.requestAddresses();
        const currentChain = await getCurrentChain(walletClient);

        publicClient = createPublicClient({
            transport: custom(window.ethereum),
        });
        
        const { request } = await publicClient.simulateContract({
            address: contractAddress,
            abi: abi,
            functionName: 'withdraw',
            account: connectedAccount,
            chain: currentChain,
        });
        const hash = await walletClient.writeContract(request);
        console.log("Withdrawal transaction hash:", hash);
        console.log("Withdrawal successful!");
        return hash;
        
    } else {
        console.error("Please install MetaMask!");
        // You might want to update your UI here
        connectButton.innerHTML = "Please install MetaMask!";
    }
}

async function getCurrentChain(client) {
  const chainId = await client.getChainId()
  const currentChain = defineChain({
    id: chainId,
    name: "Custom Chain",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: {
        http: ["http://localhost:8545"],
      },
    },
  })
  return currentChain
}

async function getBalance(){
      if (typeof window.ethereum !== 'undefined') {
        publicClient = createPublicClient({
            transport: custom(window.ethereum),
        });
        const balance =  await publicClient.getBalance({
          address: contractAddress,
        })
        console.log(`Contract balance: ${formatEther(balance)} ETH`);
}}

async function check() {
    console.log('Checking funding amount...');
        if (typeof window.ethereum !== 'undefined') {
            publicClient = createPublicClient({
                transport: custom(window.ethereum),
            });
            const [accounts] = await publicClient.request({
                method: 'eth_requestAccounts',
            });
            console.log('User Address:', accounts);

            // Calling the smart contract function
            const fundingAmount = await publicClient.readContract({
                address: contractAddress,
                abi: abi,
                functionName: 'getAddressToAmountFunded',
                args: [accounts],
            });

            const amountInEthers = formatEther(fundingAmount);
            console.log(`Funding amount for ${accounts}: ${amountInEthers} ETH`);
        } else {
            console.error("Please install MetaMask!");
            connectButton.innerHTML = "Please install MetaMask!";
        }
}

connectButton.onclick = connect;
fundButton.onclick = fund;
balanceButton.onclick = getBalance;
withdrawButton.onclick = withdraw;
checkingFundingAmount.onclick = check;
