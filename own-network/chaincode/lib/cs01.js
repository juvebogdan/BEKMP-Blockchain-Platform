'use strict';

// SDK Library to asset with writing the logic 
const { Contract } = require('fabric-contract-api');

/**
 * ToDo
 * - couchDB implementation
 */
class Cs01Contract extends Contract {

    constructor(){
      super('Cs01Contract');
      this.TxId = ''
    }

    /**
     * is done befor the transaction starts
     * @param {*} ctx 
     */
    async beforeTransaction(ctx) {
      // default implementation is do nothing
      this.TxId = ctx.stub.getTxID();
      console.log(`Logging for ${this.TxId} !!`)
    }

    /**
     * is done after the transaction ends
     * @param {*} ctx 
     * @param {*} result 
     */
    async afterTransaction(ctx, result) {
      // default implementation is do nothing
      console.log(`TX ${this.TxId} done !!`)
    }

    /**
     * store a new state
     * @param {*} ctx 
     * @param {*} deviceid 
     * @param {*} certificate
     */
    async storeCertificate(ctx, deviceid, certificate) {
      
      // compose our model
      let model = {
        deviceid : deviceid,
        certificate : certificate,
        txId: this.TxId
      }

      try {
      
        // store the composite key with a the value
        let indexName = 'deviceid~crt'
        
        let crtIndex = await ctx.stub.createCompositeKey(indexName, [deviceid, 'crt']);

        // store the new state
        await ctx.stub.putState(crtIndex, Buffer.from(JSON.stringify(model)));

        // compose the return values
        return {
          key: deviceid+'~crt'
        };

      } catch(e){
        throw new Error(`The tx ${this.TxId} can not be stored: ${e}`);
      }
    }

   /**
     * store a new state
     * @param {*} ctx 
     * @param {*} deviceid 
     * @param {*} clusterhead 
     * @param {*} key
     */
   async storeKey(ctx, deviceid, clusterhead, key) {
      
    // compose our model
    let model = {
      deviceid : deviceid,
      clusterhead: clusterhead,
      key : key,
      txId: this.TxId
    }

    try {
    
      // store the composite key with a the value
      let indexName = 'deviceid~clusterhead~key'
      
      let crtIndex = await ctx.stub.createCompositeKey(indexName, [deviceid, clusterhead, 'key']);

      // store the new state
      await ctx.stub.putState(crtIndex, Buffer.from(JSON.stringify(model)));

      // compose the return values
      return {
        key: deviceid + '~' + clusterhead + '~key'
      };

    } catch(e){
      throw new Error(`The tx ${this.TxId} can not be stored: ${e}`);
    }
  }

   /**
     * store a allowed device id
     * @param {*} ctx 
     * @param {*} deviceid 
     * @param {*} key
     */
   async storeDevice(ctx, deviceid, status) {
      
    // compose our model
    let model = {
      deviceid : deviceid,
      status: status,
      txId: this.TxId
    }

    try {
    
      // store the composite key with a the value
      let indexName = 'deviceid~allowed'
      
      let crtIndex = await ctx.stub.createCompositeKey(indexName, [deviceid, 'allowed']);

      // store the new state
      await ctx.stub.putState(crtIndex, Buffer.from(JSON.stringify(model)));

      // compose the return values
      return {
        key: deviceid + '~allowed'
      };

    } catch(e){
      throw new Error(`The tx ${this.TxId} can not be stored: ${e}`);
    }
  }

    /**
     * get all in a given year and month 
     * 
     * @param {*} ctx 
     * @param {*} deviceid 
     */
    async getCertificate(ctx){

      // we use the args option
      const args = ctx.stub.getArgs();

      let deviceid = args[1];
      
      // do the query
      let indexName = 'deviceid~crt'
      let crtIndex = await ctx.stub.createCompositeKey(indexName, [deviceid, 'crt']);
      let assetAsBuffer = await ctx.stub.getState(crtIndex);
      
      if(!assetAsBuffer || assetAsBuffer.length === 0) {
        return {
            found: false
        }
      }
      let res = JSON.parse(assetAsBuffer);

      return {
        found: true,
        data: res
      }
    }

    /**
     * get all in a given year and month 
     * 
     * @param {*} ctx 
     * @param {*} deviceid 
     */
    async getKey(ctx) {

      // we use the args option
      const args = ctx.stub.getArgs();

      let clusterhead = args[1];
      let deviceid = args[2];
      
      // do the query
      let indexName = 'deviceid~clusterhead~key'
      let crtIndex = await ctx.stub.createCompositeKey(indexName, [deviceid, clusterhead, 'key']);
      let assetAsBuffer = await ctx.stub.getState(crtIndex);
      
      if(!assetAsBuffer || assetAsBuffer.length === 0) {
        return {
            found: false
        }
      }
      let res = JSON.parse(assetAsBuffer);

      return {
        found: true,
        data: res
      }
    }

   /**
     * get all in a given year and month 
     * 
     * @param {*} ctx 
     * @param {*} deviceid 
     */
   async getDevice(ctx){

    // we use the args option
    const args = ctx.stub.getArgs();

    let deviceid = args[1];
    
    // do the query
    let indexName = 'deviceid~allowed'
    let crtIndex = await ctx.stub.createCompositeKey(indexName, [deviceid, 'allowed']);
    let assetAsBuffer = await ctx.stub.getState(crtIndex);
    
    if(!assetAsBuffer || assetAsBuffer.length === 0) {
      return {
          found: false
      }
    }
    let res = JSON.parse(assetAsBuffer);

    return {
      found: true,
      data: res
    }
  }

  async storeMeasurement(ctx, nodeId, measurement, energyLevel, timestamp) {
      const N = 50; // Choose your window size
      const threshold = 2; // Choose your threshold for excluding outliers
      
      // Validate input
      measurement = Number(measurement);
      energyLevel = Number(energyLevel);
      if (isNaN(measurement) || isNaN(energyLevel)) {
        throw new Error('Invalid input: measurement and energyLevel must be numbers');
      }
      
      // Retrieve existing measurements
      let assetAsBuffer = await ctx.stub.getState(`measures_${nodeId}`);
      if (!assetAsBuffer || assetAsBuffer.length === 0) {
        assetAsBuffer = '[]';
      }
      let existingMeasurements = JSON.parse(assetAsBuffer);
      
      // Retrieve existing energy levels
      let energyBuffer = await ctx.stub.getState(`energy_${nodeId}`);
      if (!energyBuffer || energyBuffer.length === 0) {
        energyBuffer = '[]';
      }
      let existingEnergyLevels = JSON.parse(energyBuffer);
      
      // Update measurements and keep only the most recent N
      existingMeasurements.push(measurement);
      if (existingMeasurements.length > N) {
        existingMeasurements = existingMeasurements.slice(-N);
      }
      
      // Update energy levels and keep only the most recent N
      existingEnergyLevels.push({ level: energyLevel, timestamp: timestamp });
      if (existingEnergyLevels.length > N) {
        existingEnergyLevels = existingEnergyLevels.slice(-N);
      }
      
      // Calculate mean and standard deviation for measurements
      const n = existingMeasurements.length;
      const mean = existingMeasurements.reduce((a, b) => a + b, 0) / n;
      const stdDev = Math.sqrt(existingMeasurements.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / n);
      
      // Store updated measurements, statistics, and energy levels in the ledger
      await ctx.stub.putState(`measures_${nodeId}`, JSON.stringify(existingMeasurements));
      await ctx.stub.putState(`stats_${nodeId}`, JSON.stringify({ mean: mean, stdDev: stdDev }));
      await ctx.stub.putState(`energy_${nodeId}`, JSON.stringify(existingEnergyLevels));
  } 
    
    async updateEnergyTrust(ctx, nodeId, threshold) {
      // Retrieve existing energy levels and timestamps
      let energyBuffer = await ctx.stub.getState(`energy_${nodeId}`);
      if (!energyBuffer || energyBuffer.length === 0) {
        throw new Error('No energy data available for this node');
      }
      const existingEnergyLevels = JSON.parse(energyBuffer);
      
      const n = existingEnergyLevels.length;
      if (n < 2) {
        throw new Error('Insufficient data to calculate energy consumption rate');
      }
      
      // Calculate the timeWindow using the timestamps of the most recent and oldest energy readings
      const beforeTimestamp = new Date(existingEnergyLevels[n-2].timestamp);
      const mostRecentTimestamp = new Date(existingEnergyLevels[n-1].timestamp);
      const timeWindow = (mostRecentTimestamp - beforeTimestamp) / 1000; // timeWindow in seconds
      
      // Calculate re, the current energy consumption rate
      const deltaE = Math.abs(existingEnergyLevels[n - 1].level - existingEnergyLevels[n-2].level);
      const re = deltaE / timeWindow;
      
      // Calculate rN, the mean past energy consumption rate
      let totalRate = 0;
      for (let i = 1; i < n-1; i++) {
        const deltaE = Math.abs(existingEnergyLevels[i].level - existingEnergyLevels[i-1].level);
        const deltaTime = (new Date(existingEnergyLevels[i].timestamp) - new Date(existingEnergyLevels[i-1].timestamp)) / 1000; // in seconds
        const rate = deltaE / deltaTime;
        totalRate += rate;
      }
      const rN = totalRate / (n - 2);
      
      // Calculate Energy Trust Te
      let Te;
      if (existingEnergyLevels[n - 1].level < threshold) {
        Te = 0;
      } else {
        Te = 1 - Math.abs(re - rN);
      }
      
      // Store the calculated Energy Trust Te into the ledger
      await ctx.stub.putState(`energyTrust_${nodeId}`, JSON.stringify(Te));
    } 
   
    async updateCommunicationTrust(ctx, nodeId, isSuccess) { 
      // Convert to boolean if it's a string
      if (typeof isSuccess === 'string') {
        isSuccess = isSuccess.toLowerCase() === 'true';
      }
      
      let assetAsBuffer = await ctx.stub.getState(`commTrust_${nodeId}`);
      
      if (!assetAsBuffer || assetAsBuffer.length === 0) {
        assetAsBuffer = '{"success": 0, "fail": 0}';
      }
      const existingCommHistory = JSON.parse(assetAsBuffer);
      
      if (isSuccess) {
        existingCommHistory.success++;
      } else {
        existingCommHistory.fail++;
      }
      
      const s = existingCommHistory.success;
      const f = existingCommHistory.fail;
      const b = s / (s + f + 1);
      const u = 1 / (s + f + 1);
      existingCommHistory.Tc = b + (u / 2);
      
      await ctx.stub.putState(`commTrust_${nodeId}`, JSON.stringify(existingCommHistory));
    } 
   
    async updatePacketTrust(ctx, nodeId, packetValue) {
      // Retrieve the stored statistics
      let statsBuffer = await ctx.stub.getState(`stats_${nodeId}`);
      if (!statsBuffer || statsBuffer.length === 0) {
        statsBuffer = '{"mean": 0, "stdDev": 1}';
      }
      const { mean: expectedMean, stdDev: expectedStd} = JSON.parse(statsBuffer);
      
      const z = Math.abs(packetValue - expectedMean) / (expectedStd * Math.sqrt(2));
      const Td = 2 * (0.5 - 0.5 * math.erf(z));
      
      // Retrieve existing Packet Trusts
      let packetTrustBuffer = await ctx.stub.getState(`packetTrust_${nodeId}`);
      if (!packetTrustBuffer || packetTrustBuffer.length === 0) {
        packetTrustBuffer = '[]';
      }
      let existingPacketTrusts = JSON.parse(packetTrustBuffer);
      
      // Store the new Packet Trust value
      existingPacketTrusts.push(Td);
      if (existingPacketTrusts.length > 50) { // Assuming you want to keep the last 50 records
        existingPacketTrusts = existingPacketTrusts.slice(-50);
      }
      await ctx.stub.putState(`packetTrust_${nodeId}`, JSON.stringify(existingPacketTrusts));
    } 
   
    async revokeNodeIfBelowThreshold(ctx, nodeId, w1, w2, w3, compositeThreshold) {
      // Convert all parameters to numbers
      w1 = Number(w1);
      w2 = Number(w2);
      w3 = Number(w3);
      compositeThreshold = Number(compositeThreshold);
      
      // Validate inputs
      if (isNaN(w1) || isNaN(w2) || isNaN(w3) || isNaN(compositeThreshold)) {
        throw new Error('Invalid input: All trust values, weights, and the threshold must be numbers');
      }
      
      // Check that weights sum to 1
      if (Math.abs(w1 + w2 + w3 - 1) > 1e-9) {
        throw new Error('Weights must sum to 1');
      }
    
      let assetAsBuffer = await ctx.stub.getState(`commTrust_${nodeId}`);
      
      if(!assetAsBuffer || assetAsBuffer.length === 0) {
        assetAsBuffer = '{"success": 0, "fail": 0}';
      }
      const existingCommHistory = JSON.parse(assetAsBuffer);
      let Tc = Number(existingCommHistory.Tc || 0)
    
      let packetBuffer = await ctx.stub.getState(`packetTrust_${nodeId}`);
      
      if(!packetBuffer || packetBuffer.length === 0) {
        packetBuffer = '[]';
      }
      const existingPacketTrust = JSON.parse(packetBuffer); 
      // Return the most recent Packet Trust value, or 0 if none exists
      let Td = existingPacketTrust.length > 0 ? existingPacketTrust[existingPacketTrust.length - 1] : 1;
    
      let energyBuffer = await ctx.stub.getState(`energyTrust_${nodeId}`);
      
      if(!energyBuffer || energyBuffer.length === 0) {
        energyBuffer = '[]';
      }
      const existingEnergyTrust = JSON.parse(energyBuffer); 
      // Return the most recent Packet Trust value, or 0 if none exists
      let Te = existingEnergyTrust.length > 0 ? existingEnergyTrust : 1;
      
      // Check that trust values are in valid ranges (based on their definition)
      if (Tc < 0 || Tc > 1 || Td < 0 || Td > 1 || Te < 0 || Te > 1) {
        throw new Error('Invalid trust values: Trust values must be between 0 and 1');
      }
      
      // Calculate composite trust
      const compositeTrust = w1 * Tc + w2 * Td + w3 * Te;
      
      // Check composite threshold
      if (compositeTrust < compositeThreshold) {
        // Add node to revoked list
        let revokedListJSON = await ctx.stub.getState('revokedList');
        let revokedList = [];
        if (revokedListJSON && revokedListJSON.length > 0) {
          revokedList = JSON.parse(revokedListJSON.toString());
        }
        revokedList.push(nodeId);
        await ctx.stub.putState('revokedList', Buffer.from(JSON.stringify(revokedList)));
        return {
          'res': `Node ${nodeId} has been revoked.`,
          'Tc': Tc,
          'Td': Td,
          'Te': Te
        };
      }
      return {
        'res': `Node ${nodeId} is still valid.`,
        'Tc': Tc,
        'Td': Td,
        'Te': Te
      };
    } 
   
    // Function to get Communication Trust for a node
    async getCommunicationTrust(ctx, nodeId) {
      let assetAsBuffer = await ctx.stub.getState(`commTrust_${nodeId}`);
      
      if(!assetAsBuffer || assetAsBuffer.length === 0) {
        assetAsBuffer = '{"success": 0, "fail": 0}';
      }
      const existingCommHistory = JSON.parse(assetAsBuffer);
      return {
        'success': existingCommHistory.success,
        'failed': existingCommHistory.fail,
        'Tc': existingCommHistory.Tc || 0
      };
    }
   
    // Function to get Packet Trust for a node
    async getPacketTrust(ctx, nodeId) {
      let assetAsBuffer = await ctx.stub.getState(`packetTrust_${nodeId}`);
      
      if(!assetAsBuffer || assetAsBuffer.length === 0) {
        assetAsBuffer = '[]';
      }
      const existingPacketTrust = JSON.parse(assetAsBuffer); 
      // Return the most recent Packet Trust value, or 0 if none exists
      return existingPacketTrust.length > 0 ? existingPacketTrust[existingPacketTrust.length - 1] : 1;
    }
   
    // Function to get Packet Trust for a node
    async getEnergyTrust(ctx, nodeId) {
      let assetAsBuffer = await ctx.stub.getState(`energyTrust_${nodeId}`);
      
      if(!assetAsBuffer || assetAsBuffer.length === 0) {
        assetAsBuffer = '[]';
      }
      const existingEnergyTrust = JSON.parse(assetAsBuffer); 
      // Return the most recent Packet Trust value, or 0 if none exists
      return existingEnergyTrust.length > 0 ? existingEnergyTrust : 1;
    }
   
    async getCurrentStats(ctx, nodeId) {
      let assetAsBuffer = await ctx.stub.getState(`stats_${nodeId}`);
      
      if(!assetAsBuffer || assetAsBuffer.length === 0) {
        assetAsBuffer = '{"mean": 0, "stdDev": 1}';
      }
      const { mean, stdDev } = JSON.parse(assetAsBuffer);
      return { mean, stdDev };
    }
   
    async getMeasurements(ctx, nodeId) {
      // Retrieve existing measurements
      let measurementsBuffer = await ctx.stub.getState(`measures_${nodeId}`);
      if (!measurementsBuffer || measurementsBuffer.length === 0) {
        throw new Error(`No measurements found for node ${nodeId}`);
      }
      let existingMeasurements = JSON.parse(measurementsBuffer);
      
      // Retrieve existing energy levels
      let energyBuffer = await ctx.stub.getState(`energy_${nodeId}`);
      if (!energyBuffer || energyBuffer.length === 0) {
        throw new Error(`No energy levels found for node ${nodeId}`);
      }
      let existingEnergyLevels = JSON.parse(energyBuffer);
      
      // Return the retrieved data
      return {
        measurements: existingMeasurements,
        energyLevels: existingEnergyLevels
      };
    }
};

module.exports = Cs01Contract
