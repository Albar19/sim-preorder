import { ethers, EventLog } from 'ethers';

// Contract ABI for StatusLogger
const STATUS_LOGGER_ABI = [
    'event OrderStatusLogged(string orderId, string status, uint256 timestamp, string description)',
    'function logStatus(string memory orderId, string memory status, string memory description) public',
];

// Get provider - defaults to Sepolia testnet
function getProvider() {
    const rpcUrl = process.env.SEPOLIA_RPC_URL;
    if (!rpcUrl || rpcUrl.includes('YOUR_INFURA_KEY')) {
        console.warn('Web3: No RPC URL configured, blockchain logging disabled');
        return null;
    }
    return new ethers.JsonRpcProvider(rpcUrl);
}

// Get signer for transactions
function getSigner() {
    const provider = getProvider();
    if (!provider) return null;

    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey || privateKey.includes('YOUR_PRIVATE_KEY')) {
        console.warn('Web3: No private key configured, blockchain logging disabled');
        return null;
    }
    return new ethers.Wallet(privateKey, provider);
}

// Get contract instance
function getContract() {
    const contractAddress = process.env.CONTRACT_ADDRESS;
    if (!contractAddress || contractAddress === '') {
        console.warn('Web3: No contract address configured, blockchain logging disabled');
        return null;
    }

    const signer = getSigner();
    if (!signer) return null;

    return new ethers.Contract(contractAddress, STATUS_LOGGER_ABI, signer);
}

/**
 * Log order status to blockchain
 * Returns transaction hash if successful, null if Web3 not configured
 */
export async function logOrderStatusToBlockchain(
    orderId: string,
    status: string,
    description: string
): Promise<string | null> {
    try {
        const contract = getContract();
        if (!contract) {
            console.log('Web3: Blockchain logging skipped (not configured)');
            return null;
        }

        console.log(`Web3: Logging status for order ${orderId}...`);
        const tx = await contract.logStatus(orderId, status, description);
        const receipt = await tx.wait();

        console.log(`Web3: Status logged, tx hash: ${receipt.hash}`);
        return receipt.hash;
    } catch (error) {
        console.error('Web3: Error logging to blockchain:', error);
        return null;
    }
}

/**
 * Get order status logs from blockchain
 * Returns array of log events
 */
export async function getOrderLogsFromBlockchain(orderId: string) {
    try {
        const contract = getContract();
        if (!contract) return [];

        const filter = contract.filters.OrderStatusLogged(orderId);
        const events = await contract.queryFilter(filter);

        return events
            .filter((event): event is EventLog => event instanceof EventLog)
            .map((event) => ({
                orderId: event.args[0],
                status: event.args[1],
                timestamp: Number(event.args[2]),
                description: event.args[3],
                txHash: event.transactionHash,
            }));
    } catch (error) {
        console.error('Web3: Error reading from blockchain:', error);
        return [];
    }
}

/**
 * Check if Web3 is configured and ready
 */
export function isWeb3Configured(): boolean {
    const rpcUrl = process.env.SEPOLIA_RPC_URL;
    const privateKey = process.env.PRIVATE_KEY;
    const contractAddress = process.env.CONTRACT_ADDRESS;

    return !!(
        rpcUrl &&
        !rpcUrl.includes('YOUR_INFURA_KEY') &&
        privateKey &&
        !privateKey.includes('YOUR_PRIVATE_KEY') &&
        contractAddress &&
        contractAddress !== ''
    );
}
