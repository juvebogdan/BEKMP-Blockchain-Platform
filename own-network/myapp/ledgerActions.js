/**
 * Ledger - Actions
 */

// node.js includes
const helper = require('./helper')
const path = require('path')
const math = require('mathjs');

// fabric includes
const { Gateway, Wallets } = require('fabric-network');
const walletPath = path.join(__dirname, 'wallet');

// some vars
const identityLabel = 'user1';
const channelName = 'channel1';
const chaincodeName = 'basic';

function normalDistributionFunction(x, mean, stdDev) {
  return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
}

function calculatePacketTrust(vj, mean, stdDev) {
  // Calculate the integral using the error function
  const z = (vj - mean) / (stdDev * Math.sqrt(2));
  const integral = 0.5 * (1 - erf(z));
  const Td = 2 * integral;
  return Td;
}

async function main () {
  try {

    // build CCP
    const ccp = helper.buildCCPOrg1();

    // setup the wallet to hold the credentials of the application user
    let wallet = await helper.buildWallet(Wallets, walletPath);
   
    // Create a new gateway instance for interacting with the fabric network.
    // In a real application this would be done as the backend server session is setup for
    // a user that has been verified.
    const gateway = new Gateway();
      
    // setup the gateway instance
    // The user will now be able to create connections to the fabric network and be able to
    // submit transactions and query. All transactions submitted by this gateway will be
    // signed by this user using the credentials stored in the wallet.

    // using asLocalhost as this gateway is using a fabric network deployed locally
    try {
      await gateway.connect(ccp, {
        wallet,
        identity: identityLabel,
        discovery: { enabled: true, asLocalhost: true } 
      });
    } catch (e){
      throw new Error(e)
    }
    
    // Build a network instance based on the channel where the smart contract is deployed
    const network = await gateway.getNetwork(channelName);

    // Get the contract from the network.
    const contract = network.getContract(chaincodeName);
    
    // import CLI arguments
    let args = process.argv;  

    if(args[2] === 'GetAllAssets'){
      try {
        let result = await contract.evaluateTransaction('GetAllAssets');
        console.log(`${helper.prettyJSONString(result.toString())}`);
      } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
      }      
    } 
    else if(args[2] === 'GetCertificate'){
      let asset = args[3]
      result = await contract.evaluateTransaction('getCertificate', asset);
      console.log(`${helper.prettyJSONString(result.toString())}`);
    }
    else if(args[2] === 'storeCertificate'){
      let r = await contract.submitTransaction('storeCertificate', 'device1234', 'yellow');
      console.log('*** Result: committed', r.toString());
    }
    else if(args[2] === 'storeKey'){
      let r = await contract.submitTransaction('storeKey', '200', '201', 'yellow');
      console.log('*** Result: committed', r.toString());
    }
    else if(args[2] === 'getKey'){
      let device = args[3]
      let cluster = args[4]
      result = await contract.evaluateTransaction('getKey', cluster, device);
      console.log(`${helper.prettyJSONString(result.toString())}`);
    }
    else if(args[2] === 'storeDeviceTrue'){
      let r = await contract.submitTransaction('storeDevice', '200', true);
      console.log('*** Result: committed', r.toString());
    }
    else if(args[2] === 'storeDeviceFalse'){
      let r = await contract.submitTransaction('storeDevice', '200', false);
      console.log('*** Result: committed', r.toString());
    }
    else if(args[2] === 'getDevice'){
      let asset = args[3]
      result = await contract.evaluateTransaction('getDevice', '200');
      console.log(`${helper.prettyJSONString(result.toString())}`);
    }
    else if(args[2] === 'getCurrentStats'){   
      let r = await contract.evaluateTransaction('getCurrentStats', 200);
      console.log(`${helper.prettyJSONString(r.toString())}`);
    }
    else if(args[2] === 'storeMeasurement'){
      let measure = args[3]
      let energy = args[4]
      let times = args[5]
      let r = await contract.submitTransaction('storeMeasurement', '200', measure, energy, times);
      console.log('*** Result: committed', r.toString());
    }
    else if(args[2] === 'getMeasurements'){
      let r = await contract.evaluateTransaction('getMeasurements', 200);
      console.log('*** Result: committed', r.toString());
    }
    else if(args[2] === 'updateCommunicationTrust'){
      let measure = args[3]
      let r = await contract.submitTransaction('updateCommunicationTrust', '200', measure);
      console.log('*** Result: committed', r.toString());
    }
    else if(args[2] === 'getCommunicationTrust'){   
      let r = await contract.evaluateTransaction('getCommunicationTrust', 200);
      console.log(`${helper.prettyJSONString(r.toString())}`);
    }
    else if(args[2] === 'updatePacketTrust') {
      let measure = args[3]
      let r = await contract.submitTransaction('updatePacketTrust', '200', measure);
      console.log('*** Result: committed', r.toString());
    }
    else if(args[2] === 'getPacketTrust') {
      let r = await contract.evaluateTransaction('getPacketTrust', 200);
      console.log(`${helper.prettyJSONString(r.toString())}`);
    }
    else if(args[2] === 'updateEnergyTrust') {
      let measure = args[3]
      let r = await contract.submitTransaction('updateEnergyTrust', '200', measure);
      console.log('*** Result: committed', r.toString());
    }
    else if(args[2] === 'getEnergyTrust') {
      let r = await contract.evaluateTransaction('getEnergyTrust', 200);
      console.log(`${helper.prettyJSONString(r.toString())}`);
    }
    else if(args[2] === 'revokeNodeIfBelowThreshold') {
      let r = await contract.submitTransaction('revokeNodeIfBelowThreshold', '200', 0.33, 0.33, 0.34, 0.9);
      console.log('*** Result: committed', r.toString());
    }
    else {
      console.log('...')
    }
    // disconnect form the network
    gateway.disconnect();
  }
  catch(e){
    throw new Error(e)
  }   
}

// start the CLI process
main()
