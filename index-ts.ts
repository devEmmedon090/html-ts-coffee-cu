import {
    createWalletClient,
    custom,
    createPublicClient,
    defineChain,
    parseEther,
    formatEther,
    WalletClient,
    PublicClient,
    Chain,
    Address,
    SimulateContractReturnType
} from 'viem';
// import 'viem/window';
import { contractAddress, abi } from './constants-ts';


// Type declarations for window.ethereum
interface EthereumProvider {
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    on: (event: string, handler: (...args: any[]) => void) => void;
    removeListener: (event: string, handler: (...args: any[]) => void) => void;
    isMetaMask?: boolean;
}

declare global {
    interface Window {
        ethereum?: EthereumProvider;
    }
}

// DOM Elements
const connectButton = document.getElementById('connectButton') as HTMLButtonElement;
const fundButton = document.getElementById('fundButton') as HTMLButtonElement;
const ethAmountInput = document.getElementById('ethAmount') as HTMLInputElement;
const balanceButton = document.getElementById('balanceButton') as HTMLButtonElement;
const withdrawButton = document.getElementById('withdrawButton') as HTMLButtonElement;

// Client instances
let walletClient: WalletClient | undefined;
let publicClient: PublicClient | undefined;

// Connect function
async function connect(): Promise<void> {
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

// Get current chain function
async function getCurrentChain(client: WalletClient): Promise<Chain> {
    const chainId = await client.getChainId();
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
    });
    return currentChain;
}

// Fund function
async function fund(): Promise<string | void> {
    const ethAmount = ethAmountInput.value;
    
    // Validate input
    if (!ethAmount || isNaN(parseFloat(ethAmount)) || parseFloat(ethAmount) <= 0) {
        console.error("Please enter a valid ETH amount");
        return;
    }
    
    console.log(`Funding with ${ethAmount} ETH...`);

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
            address: contractAddress as Address,
            abi: abi,
            functionName: 'fund',
            account: connectedAccount as Address,
            chain: currentChain,
            value: parseEther(ethAmount),
        });
        
        const hash = await walletClient.writeContract(request);
        console.log("Transaction hash:", hash);
        return hash;

    } else {
        connectButton.innerHTML = "Please install MetaMask!";
    }
}

// Withdraw function
async function withdraw(): Promise<string | void> {
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
        
        const { request }= await publicClient.simulateContract({
            address: contractAddress as Address,
            abi: abi,
            functionName: 'withdraw',
            account: connectedAccount as Address,
            chain: currentChain,
            // No value parameter needed for withdraw
        });
        
        const hash = await walletClient.writeContract(request);
        console.log("Withdrawal transaction hash:", hash);
        console.log("Withdrawal successful!");
        return hash;
        
    } else {
        console.error("Please install MetaMask!");
        connectButton.innerHTML = "Please install MetaMask!";
    }
}

// Get balance function
async function getBalance(): Promise<void> {
    if (typeof window.ethereum !== 'undefined') {
        publicClient = createPublicClient({
            transport: custom(window.ethereum),
        });
        
        const balance = await publicClient.getBalance({
            address: contractAddress as Address,
        });
        
        console.log(`Contract balance: ${formatEther(balance)} ETH`);
    }
}

// Add null checks and event listeners
if (connectButton && fundButton && ethAmountInput && balanceButton && withdrawButton) {
    connectButton.onclick = connect;
    fundButton.onclick = fund;
    balanceButton.onclick = getBalance;
    withdrawButton.onclick = withdraw;
} else {
    console.error("One or more DOM elements not found!");
}

// Optional: Add type-safe event handlers
const setupEventListeners = (): void => {
    if (connectButton) connectButton.addEventListener('click', connect);
    if (fundButton) fundButton.addEventListener('click', fund);
    if (balanceButton) balanceButton.addEventListener('click', getBalance);
    if (withdrawButton) withdrawButton.addEventListener('click', withdraw);
};

// Call setup if needed
setupEventListeners();

// Export functions if needed for module usage
export {
    connect,
    fund,
    withdraw,
    getBalance,
    getCurrentChain
};