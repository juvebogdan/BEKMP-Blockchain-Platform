const { Wallets, X509WalletMixin } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function main() {
    const wallet = await Wallets.newFileSystemWallet('./wallet');

    const certPath = path.join(__dirname, '..', 'organizations', 'peerOrganizations', 'org1.example.com', 'users', 'Admin@org1.example.com', 'msp', 'signcerts', 'cert.pem');
    const cert = fs.readFileSync(certPath).toString();

    const keyPath = path.join(__dirname, '..', 'organizations', 'peerOrganizations', 'org1.example.com', 'users', 'Admin@org1.example.com', 'msp', 'keystore', 'key.pem');
    const key = fs.readFileSync(keyPath).toString();

    const identity = {
        credentials: {
            certificate: cert,
            privateKey: key,
        },
        mspId: 'Org1MSP',
        type: 'X.509',
    };

    await wallet.put('user1', identity);
}

main();
