Blockchain network for BEKMP with multiple nodes ranging up to 10

To create a network run setup_network with number of nodes as a parameter

```bash
bash setup_network 3
```

Chaincode folder contains the smart contract code for all functions of the system

The current smart contract is already compiled. If any changes are made the new one can be compiled as

```bash
peer lifecycle chaincode package basic.tar.gz --path ./chaincode/ --lang node --label basic
```

To access smart contracts the myapp code is used:
Compile the code then import identity and create connection profile

```bash
npm install
node addToWallet.js
node genConfig.js
```
Copy connection profile to organization 1 folder

To test accessing blockchain from the myapp folder:

```bash
node ledgerActions.js storeKey
```

To keep API running:

```bash
node api.js
```
