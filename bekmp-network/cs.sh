#!/bin/bash

# how many tries?
max=100

# start the test
start_time="$(date -u +%s.%N)"

# set some env vars
export FABRIC_CFG_PATH=../config

# do the invoke
for (( i = 0; i <= $max; i++ )) 
do
  key="a$i"
  echo '> TX '"${key}"
  
  # create random revenue between 1000 and 10000
  revenue=$((1000 + $RANDOM % 10000))

  peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile $ORDERER_CA -C $CHANNEL_NAME -n basic --peerAddresses localhost:7051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt --peerAddresses localhost:9051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt  --peerAddresses localhost:10051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt -c '{"function":"storeCertificate","Args":["'$revenue'","devid"]}'
done
# stop the test
end_time="$(date -u +%s.%N)"

# calc the duration and TPS
elapsed="$(bc <<<"$end_time-$start_time")"
tps="$(bc <<< "scale=0; $max/$elapsed")"

# print the result
echo "$max Invokes took a total of $elapsed seconds = $tps TPS"
