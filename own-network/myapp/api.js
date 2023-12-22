const express = require('express');
const helper = require('./helper');
const path = require('path');
const { Gateway, Wallets } = require('fabric-network');
const walletPath = path.join(__dirname, 'wallet');

const identityLabel = 'user1';
const channelName = 'channel1';
const chaincodeName = 'basic';

const app = express();
app.use(express.json());

async function setupGateway() {
  const ccp = helper.buildCCPOrg1();
  let wallet = await helper.buildWallet(Wallets, walletPath);
  const gateway = new Gateway();
  await gateway.connect(ccp, {
    wallet,
    identity: identityLabel,
    discovery: { enabled: true, asLocalhost: true }
  });
  return gateway;
}

app.get('/GetCertificate/:asset', async (req, res) => {
  const asset = req.params.asset;
  const gateway = await setupGateway();
  const network = await gateway.getNetwork(channelName);
  const contract = network.getContract(chaincodeName);
  try {
    let result = await contract.evaluateTransaction('getCertificate', asset);
    res.json(JSON.parse(result.toString()));
  } catch (error) {
    res.status(500).send(`Failed to evaluate transaction: ${error}`);
  }
  gateway.disconnect();
});

app.post('/storeCertificate', async (req, res) => {
  const { id, color } = req.body;
  const gateway = await setupGateway();
  const network = await gateway.getNetwork(channelName);
  const contract = network.getContract(chaincodeName);
  try {
    let result = await contract.submitTransaction('storeCertificate', id, color);
    res.send(`Result: committed ${result.toString()}`);
  } catch (error) {
    res.status(500).send(`Failed to submit transaction: ${error}`);
  }
  gateway.disconnect();
});


app.post('/storeDevice', async (req, res) => {
  const { id, color } = req.body;
  const gateway = await setupGateway();
  const network = await gateway.getNetwork(channelName);
  const contract = network.getContract(chaincodeName);
  try {
    let result = await contract.submitTransaction('storeDevice', id, color);
    res.send(`Result: committed ${result.toString()}`);
  } catch (error) {
    res.status(500).send(`Failed to submit transaction: ${error}`);
  }
  gateway.disconnect();
});

app.get('/getDevice/:asset', async (req, res) => {
  const asset = req.params.asset;
  const gateway = await setupGateway();
  const network = await gateway.getNetwork(channelName);
  const contract = network.getContract(chaincodeName);
  try {
    let result = await contract.evaluateTransaction('getDevice', asset);
    res.json(JSON.parse(result.toString()));
  } catch (error) {
    res.status(500).send(`Failed to evaluate transaction: ${error}`);
  }
  gateway.disconnect();
});

app.post('/storeKey', async (req, res) => {
    const { device, cluster, color } = req.body;
    const gateway = await setupGateway();
    const network = await gateway.getNetwork(channelName);
    const contract = network.getContract(chaincodeName);
    try {
      let result = await contract.submitTransaction('storeKey', device, cluster, color);
      res.send(`Result: committed ${result.toString()}`);
    } catch (error) {
      res.status(500).send(`Failed to submit transaction: ${error}`);
    }
    gateway.disconnect();
});
  
app.get('/getKey/:device/:cluster', async (req, res) => {
    const { device, cluster } = req.params;
    const gateway = await setupGateway();
    const network = await gateway.getNetwork(channelName);
    const contract = network.getContract(chaincodeName);
    try {
        let result = await contract.evaluateTransaction('getKey', cluster, device);
        res.json(JSON.parse(result.toString()));
    } catch (error) {
        res.status(500).send(`Failed to evaluate transaction: ${error}`);
    }
    gateway.disconnect();
});

// Store a measurement for a node
app.post('/storeMeasurement', async (req, res) => {
  const { nodeId, measurement, energyLevel, timestamp } = req.body;
  const gateway = await setupGateway();
  const network = await gateway.getNetwork(channelName);
  const contract = network.getContract(chaincodeName);
  try {
    await contract.submitTransaction('storeMeasurement', nodeId, measurement, energyLevel, timestamp);
    res.send('Measurement stored successfully');
  } catch (error) {
    res.status(500).send(`Failed to submit transaction: ${error}`);
  }
  gateway.disconnect();
});

// Update energy trust value for a node
app.post('/updateEnergyTrust', async (req, res) => {
  const { nodeId, threshold } = req.body;
  const gateway = await setupGateway();
  const network = await gateway.getNetwork(channelName);
  const contract = network.getContract(chaincodeName);
  try {
    await contract.submitTransaction('updateEnergyTrust', nodeId, threshold);
    res.send('Energy trust updated successfully');
  } catch (error) {
    res.status(500).send(`Failed to submit transaction: ${error}`);
  }
  gateway.disconnect();
});

// Update communication trust value for a node
app.post('/updateCommunicationTrust', async (req, res) => {
  const { nodeId, isSuccess } = req.body;
  const gateway = await setupGateway();
  const network = await gateway.getNetwork(channelName);
  const contract = network.getContract(chaincodeName);
  try {
    await contract.submitTransaction('updateCommunicationTrust', nodeId, isSuccess);
    res.send('Communication trust updated successfully');
  } catch (error) {
    res.status(500).send(`Failed to submit transaction: ${error}`);
  }
  gateway.disconnect();
});

// Update packet trust value for a node
app.post('/updatePacketTrust', async (req, res) => {
  const { nodeId, packetValue } = req.body;
  const gateway = await setupGateway();
  const network = await gateway.getNetwork(channelName);
  const contract = network.getContract(chaincodeName);
  try {
    await contract.submitTransaction('updatePacketTrust', nodeId, packetValue);
    res.send('Packet trust updated successfully');
  } catch (error) {
    res.status(500).send(`Failed to submit transaction: ${error}`);
  }
  gateway.disconnect();
});

// Revoke node if composite trust falls below threshold
app.post('/revokeNodeIfBelowThreshold', async (req, res) => {
  const { nodeId, w1, w2, w3, compositeThreshold } = req.body;
  const gateway = await setupGateway();
  const network = await gateway.getNetwork(channelName);
  const contract = network.getContract(chaincodeName);
  try {
    const result = await contract.submitTransaction('revokeNodeIfBelowThreshold', nodeId, w1, w2, w3, compositeThreshold);
    res.send(`Result: ${result.toString()}`);
  } catch (error) {
    res.status(500).send(`Failed to submit transaction: ${error}`);
  }
  gateway.disconnect();
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
