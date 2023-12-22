
#!/bin/bash

# Check if the number of nodes is passed as an argument
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <number_of_nodes>"
    exit 1
fi

SCRIPT_DIR=$(dirname "$0")

NUM_NODES=$1

# Step 1: Clean up
docker-compose down -v
rm -Rf organizations
rm -Rf channel-artifacts
rm -rf system-genesis-block/

# Step 2: Set environment variables
export FABRIC_CFG_PATH=$PWD/configtx
export CHANNEL_NAME=channel1 
export SYS_CHANNEL_NAME=sys-channel
export PATH=${PWD}/../bin:$PATH

# Step 3: Generate crypto material
cryptogen generate --config=./crypto-config.yaml --output organizations

# Step 4: Create necessary directories
mkdir -p channel-artifacts
mkdir -p system-genesis-block

# Step 5: Generate genesis block and channel transactions
configtxgen -profile ${NUM_NODES}OrgsOrdererGenesis -channelID $SYS_CHANNEL_NAME -outputBlock ./system-genesis-block/genesis.block
configtxgen -profile ${NUM_NODES}OrgsChannel -outputCreateChannelTx ./channel-artifacts/channel_$CHANNEL_NAME.tx -channelID $CHANNEL_NAME

for i in $(seq 1 $NUM_NODES); do
    configtxgen -profile ${NUM_NODES}OrgsChannel -outputAnchorPeersUpdate ./channel-artifacts/Org${i}MSPanchors.tx -channelID $CHANNEL_NAME -asOrg Org${i}MSP
done

# Step 6: Start the network
export FABRIC_CFG_PATH=$PWD/../config/
export ORDERER_CA=${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

docker-compose up -d

# Wait for Docker containers to start
echo "Waiting for Docker containers to start..."
sleep 10

# Step 7: Create and join channel for each org
for i in $(seq 1 $NUM_NODES); do
    . "$SCRIPT_DIR/org${i}.env"
    if [ $i -eq 1 ]; then
        peer channel create -o localhost:7050 -c $CHANNEL_NAME --ordererTLSHostnameOverride orderer.example.com -f ./channel-artifacts/channel_${CHANNEL_NAME}.tx --outputBlock ./channel-artifacts/${CHANNEL_NAME}.block --tls --cafile $ORDERER_CA
    fi
    peer channel join -b ./channel-artifacts/$CHANNEL_NAME.block
    peer channel update -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com -c $CHANNEL_NAME -f ./channel-artifacts/Org${i}MSPanchors.tx --tls --cafile $ORDERER_CA
done

# Step 8: Install and approve chaincode for each org
for i in $(seq 1 $NUM_NODES); do
    . "$SCRIPT_DIR/org${i}.env"
    peer lifecycle chaincode install basic.tar.gz
    if [ $i -eq 1 ]; then
        export PKGID=basic:30b86b90a41c23fa3e46b9231040e652d6904a0f5913e0094d379ae35215516b
        peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile $ORDERER_CA --channelID $CHANNEL_NAME --name basic --version 1 --package-id $PKGID --sequence 1
    else
        peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile $ORDERER_CA --channelID $CHANNEL_NAME --name basic --version 1 --package-id $PKGID --sequence 1
    fi
done

echo "Waiting for install..."
sleep 5

# Step 9: Commit the chaincode
commit_command="peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --channelID $CHANNEL_NAME --name basic --version 1 --sequence 1 --tls --cafile $ORDERER_CA"

for i in $(seq 1 $NUM_NODES); do
    if [ $i -eq 1 ]; then
        port=7051
    elif [ $i -eq 2 ]; then
        port=9051
    else
        port=$((10051 + 1000 * (i - 3)))
    fi

    commit_command+=" --peerAddresses localhost:${port} --tlsRootCertFiles $PWD/organizations/peerOrganizations/org${i}.example.com/peers/peer0.org${i}.example.com/tls/ca.crt"
done

# Print the commit command
echo "Executing commit command:"
echo "$commit_command"

# Execute the commit command
eval "$commit_command"
