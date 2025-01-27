
import { ethers } from 'ethers'
import fs from 'fs/promises'
import readline from 'readline'
import log from './utils/logger.js'
import LayerEdge from './utils/socket.js';
import { readFile } from './utils/helper.js';

function createNewWallet() {
    const wallet = ethers.Wallet.createRandom();

    const walletDetails = {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic.phrase
    };

    log.info("New Ethereum Wallet created Address:", walletDetails.address);

    return walletDetails;
}


async function saveWalletToFile(walletDetails) {
    try {
        await fs.appendFile("wallets.json", JSON.stringify(walletDetails) + "\n");
        log.info("Wallet saved to wallets.json");
    } catch (err) {
        log.error("Error writing to wallets.json:", err);
    }
}

// Function to ask a question 
async function askQuestion(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

async function autoRegister() {
    const proxies = await readFile('proxy.txt');
    if (proxies.length === 0) {
        log.warn('No proxies found, running without proxy...');
    }
    const numberOfWallets = await askQuestion("How many wallets/ref do you want to create? ");
    const refCode = await askQuestion("Enter Your Referral code example => O8Ijyqih: ");
    for (let i = 0; i < numberOfWallets; i++) {
        const proxy = proxies[i % proxies.length] || null;
        try {
            log.info(`Create and Registering Wallets: ${i + 1}/${numberOfWallets} Using Proxy:`, proxy);
            const walletDetails = createNewWallet();
            const socket = new LayerEdge(proxy, walletDetails.privateKey, refCode);
            await socket.checkInvite()
            const isRegistered = await socket.registerWallet();
            if (isRegistered) {
                saveWalletToFile(walletDetails);
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            log.error('Error creating wallet:', error.message);
        }
    }
}

autoRegister()
