const fs = require('fs');
const path = require('path');

function readCertificate(certPath) {
    return fs.readFileSync(certPath, 'utf8');
}

function getPeerPort(orgDir) {
    // Extract the org number from the directory name
    const orgNumber = parseInt(orgDir.match(/\d+/)[0], 10);

    // Determine the port based on the org number
    if (orgNumber === 1) {
        return 7051; // Org1
    } else if (orgNumber === 2) {
        return 9051; // Org2
    } else {
        return 10051 + (orgNumber - 3) * 1000; // Org3 and onwards
    }
}

function generateNetworkConfig(rootDir) {
    const networkConfig = {
        name: "test-network-org1",
        version: "1.0.0",
        client: {
            organization: "Org1",
            connection: {
                timeout: {
                    peer: {
                        endorser: "300"
                    },
                    orderer: "300"
                }
            }
        },
        organizations: {},
        peers: {},
        certificateAuthorities: {}
    };

    fs.readdirSync(rootDir).forEach(orgDir => {
        const orgPath = path.join(rootDir, orgDir);
        if (fs.lstatSync(orgPath).isDirectory()) {
            const tlscaPath = path.join(orgPath, 'tlsca');
            fs.readdirSync(tlscaPath).forEach(file => {
                if (file.endsWith('-cert.pem')) {
                    const certFile = path.join(tlscaPath, file);
                    const certContent = readCertificate(certFile);

                    const orgName = orgDir.split('.')[0].charAt(0).toUpperCase() + orgDir.split('.')[0].slice(1);
                    const peerPort = getPeerPort(orgDir);

                    networkConfig.organizations[orgName] = {
                        mspid: orgName + "MSP",
                        peers: ['peer0.' + orgDir],
                        certificateAuthorities: ['ca.' + orgDir]
                    };
                    networkConfig.peers['peer0.' + orgDir] = {
                        url: `grpcs://localhost:${peerPort}`,
                        tlsCACerts: {
                            pem: certContent
                        },
                        grpcOptions: {
                            "ssl-target-name-override": 'peer0.' + orgDir
                        }
                    };
                    networkConfig.certificateAuthorities['ca.' + orgDir] = {
                        url: "https://localhost:7054",
                        caName: 'ca-' + orgName.toLowerCase(),
                        tlsCACerts: {
                            pem: [certContent]
                        },
                        httpOptions: {
                            verify: false
                        }
                    };
                }
            });
        }
    });

    fs.writeFileSync('connection-org1.json', JSON.stringify(networkConfig, null, 4));
}

// Absolute path to the organization folder
const orgFolderPath = '/root/fabric-samples/own-network/organizations/peerOrganizations';

// Run the script for the specified directory
generateNetworkConfig(orgFolderPath);
