const {
    bufToStr,
    getBalance,
    htlcArrayToObj,
    isSha256Hash,
    newSecretHashPair,
    nowSeconds,
    random32,
    txContractId,
    txGas,
    txLoggedArgs,
} = require('./helper/utils');
var Web3 = require('web3');
// sets up web3.js
if (typeof web3 !== 'undefined')  {
    web3 = new Web3(web3.currentProvider);
} else {
    web3 = new Web3('http://localhost:7545');
    // const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:7545"));
}
var provider = new Web3.providers.HttpProvider("http://localhost:7545");

// const fs = require("fs");
// const solc = require('solc');
// let source = fs.readFileSync('../contracts/HashedTimelock.sol', 'utf8');
// let compiledContract = solc.compile(source, 1);
// let abi = compiledContract.contracts['nameContract'].interface;
let abi = [
    {
        "constant": false,
        "inputs": [
            {
                "name": "_receiver",
                "type": "address"
            },
            {
                "name": "_hashlock",
                "type": "bytes32"
            },
            {
                "name": "_timelock",
                "type": "uint256"
            }
        ],
        "name": "newContract",
        "outputs": [
            {
                "name": "contractId",
                "type": "bytes32"
            }
        ],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "_contractId",
                "type": "bytes32"
            }
        ],
        "name": "refund",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "_contractId",
                "type": "bytes32"
            },
            {
                "name": "_preimage",
                "type": "bytes32"
            }
        ],
        "name": "withdraw",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "contractId",
                "type": "bytes32"
            },
            {
                "indexed": true,
                "name": "sender",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "receiver",
                "type": "address"
            },
            {
                "indexed": false,
                "name": "amount",
                "type": "uint256"
            },
            {
                "indexed": false,
                "name": "hashlock",
                "type": "bytes32"
            },
            {
                "indexed": false,
                "name": "timelock",
                "type": "uint256"
            }
        ],
        "name": "LogHTLCNew",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "contractId",
                "type": "bytes32"
            }
        ],
        "name": "LogHTLCWithdraw",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "contractId",
                "type": "bytes32"
            }
        ],
        "name": "LogHTLCRefund",
        "type": "event"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "_contractId",
                "type": "bytes32"
            }
        ],
        "name": "getContract",
        "outputs": [
            {
                "name": "sender",
                "type": "address"
            },
            {
                "name": "receiver",
                "type": "address"
            },
            {
                "name": "amount",
                "type": "uint256"
            },
            {
                "name": "hashlock",
                "type": "bytes32"
            },
            {
                "name": "timelock",
                "type": "uint256"
            },
            {
                "name": "withdrawn",
                "type": "bool"
            },
            {
                "name": "refunded",
                "type": "bool"
            },
            {
                "name": "preimage",
                "type": "bytes32"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }
];
// let bytecode = compiledContract.contracts['nameContract'].bytecode;
let bytecode = "608060405234801561001057600080fd5b506111fb806100206000396000f3fe608060405260043610610062576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff168063335ef5bd1461006757806363615149146100d35780637249fbb614610130578063e16c7d9814610183575b600080fd5b6100bd6004803603606081101561007d57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291908035906020019092919080359060200190929190505050610263565b6040518082815260200191505060405180910390f35b3480156100df57600080fd5b50610116600480360360408110156100f657600080fd5b81019080803590602001909291908035906020019092919050505061074a565b604051808215151515815260200191505060405180910390f35b34801561013c57600080fd5b506101696004803603602081101561015357600080fd5b8101908080359060200190929190505050610c26565b604051808215151515815260200191505060405180910390f35b34801561018f57600080fd5b506101bc600480360360208110156101a657600080fd5b8101908080359060200190929190505050611049565b604051808973ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020018873ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200187815260200186815260200185815260200184151515158152602001831515151581526020018281526020019850505050505050505060405180910390f35b600080341115156102dc576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260158152602001807f6d73672e76616c7565206d757374206265203e2030000000000000000000000081525060200191505060405180910390fd5b81428111151561037a576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260238152602001807f74696d656c6f636b2074696d65206d75737420626520696e207468652066757481526020017f757265000000000000000000000000000000000000000000000000000000000081525060400191505060405180910390fd5b60023386348787604051602001808673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166c010000000000000000000000000281526014018573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166c01000000000000000000000000028152601401848152602001838152602001828152602001955050505050506040516020818303038152906040526040518082805190602001908083835b6020831015156104675780518252602082019150602081019050602083039250610442565b6001836020036101000a038019825116818451168082178552505050505050905001915050602060405180830381855afa1580156104a9573d6000803e3d6000fd5b5050506040513d60208110156104be57600080fd5b810190808051906020019092919050505091506104da8261115e565b1561054d576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260178152602001807f436f6e747261637420616c72656164792065786973747300000000000000000081525060200191505060405180910390fd5b610100604051908101604052803373ffffffffffffffffffffffffffffffffffffffff1681526020018673ffffffffffffffffffffffffffffffffffffffff168152602001348152602001858152602001848152602001600015158152602001600015158152602001600060010281525060008084815260200190815260200160002060008201518160000160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555060208201518160010160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555060408201518160020155606082015181600301556080820151816004015560a08201518160050160006101000a81548160ff02191690831515021790555060c08201518160050160016101000a81548160ff02191690831515021790555060e082015181600601559050508473ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16837f329a8316ed9c3b2299597538371c2944c5026574e803b1ec31d6113e1cd67bde34888860405180848152602001838152602001828152602001935050505060405180910390a4819150509392505050565b6000826107568161115e565b15156107ca576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260198152602001807f636f6e7472616374496420646f6573206e6f742065786973740000000000000081525060200191505060405180910390fd5b8383600281604051602001808281526020019150506040516020818303038152906040526040518082805190602001908083835b60208310151561082357805182526020820191506020810190506020830392506107fe565b6001836020036101000a038019825116818451168082178552505050505050905001915050602060405180830381855afa158015610865573d6000803e3d6000fd5b5050506040513d602081101561087a57600080fd5b810190808051906020019092919050505060008084815260200190815260200160002060030154141515610916576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601c8152602001807f686173686c6f636b206861736820646f6573206e6f74206d617463680000000081525060200191505060405180910390fd5b853373ffffffffffffffffffffffffffffffffffffffff1660008083815260200190815260200160002060010160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff161415156109ef576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601a8152602001807f776974686472617761626c653a206e6f7420726563656976657200000000000081525060200191505060405180910390fd5b6000151560008083815260200190815260200160002060050160009054906101000a900460ff161515141515610a8d576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601f8152602001807f776974686472617761626c653a20616c72656164792077697468647261776e0081525060200191505060405180910390fd5b4260008083815260200190815260200160002060040154111515610b3f576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260318152602001807f776974686472617761626c653a2074696d656c6f636b2074696d65206d75737481526020017f20626520696e207468652066757475726500000000000000000000000000000081525060400191505060405180910390fd5b6000806000898152602001908152602001600020905086816006018190555060018160050160006101000a81548160ff0219169083151502179055508060010160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166108fc82600201549081150290604051600060405180830381858888f19350505050158015610be9573d6000803e3d6000fd5b50877fd6fd4c8e45bf0c70693141c7ce46451b6a6a28ac8386fca2ba914044e0e2391660405160405180910390a260019550505050505092915050565b600081610c328161115e565b1515610ca6576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260198152602001807f636f6e7472616374496420646f6573206e6f742065786973740000000000000081525060200191505060405180910390fd5b823373ffffffffffffffffffffffffffffffffffffffff1660008083815260200190815260200160002060000160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16141515610d7f576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260168152602001807f726566756e6461626c653a206e6f742073656e6465720000000000000000000081525060200191505060405180910390fd5b6000151560008083815260200190815260200160002060050160019054906101000a900460ff161515141515610e1d576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601c8152602001807f726566756e6461626c653a20616c726561647920726566756e6465640000000081525060200191505060405180910390fd5b6000151560008083815260200190815260200160002060050160009054906101000a900460ff161515141515610ebb576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601d8152602001807f726566756e6461626c653a20616c72656164792077697468647261776e00000081525060200191505060405180910390fd5b426000808381526020019081526020016000206004015411151515610f6e576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260238152602001807f726566756e6461626c653a2074696d656c6f636b206e6f74207965742070617381526020017f736564000000000000000000000000000000000000000000000000000000000081525060400191505060405180910390fd5b6000806000868152602001908152602001600020905060018160050160016101000a81548160ff0219169083151502179055508060000160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166108fc82600201549081150290604051600060405180830381858888f1935050505015801561100f573d6000803e3d6000fd5b50847f989b3a845197c9aec15f8982bbb30b5da714050e662a7a287bb1a94c81e2e70e60405160405180910390a260019350505050919050565b600080600080600080600080600015156110628a61115e565b151514156110a35760008060008060008060008087975086965085955084600102945083935080600102905097509750975097509750975097509750611153565b60008060008b815260200190815260200160002090508060000160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff168160010160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff168260020154836003015484600401548560050160009054906101000a900460ff168660050160019054906101000a900460ff16876006015487975086965098509850985098509850985098509850505b919395975091939597565b60008073ffffffffffffffffffffffffffffffffffffffff1660008084815260200190815260200160002060000160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff161415905080905091905056fea165627a7a72305820d7e2118992b788935cea023fc638215b1e3c908ced3001126fe2e73c975816930029";


const contract_address = "0xe3611ddAFFE4ECAc68bb3FC7582ce961FF2AD479";

let gasEstimate = web3.eth.estimateGas({data: bytecode});

const sender = "0xC1AF5461D55863A987017A4d830D5F366fE1cb04";
const receiver = "0x54C3d57A92c4F2afb8B9c3A2771DB9B961c14c99";
const hourSeconds = 3600;
const timeLock1Hour = nowSeconds() + hourSeconds;
const timelock10Second = nowSeconds() + 10;
const oneEther = web3.utils.toWei(web3.utils.toBN(1), 'ether');
const hashPair = newSecretHashPair();


let send_param = {
    from: sender,
    value: oneEther,
    gas: web3.utils.toHex(150000),
    gasPrice: web3.utils.toHex(web3.utils.toWei('30', 'gwei'))
};



const MyContract = new web3.eth.Contract(
    abi,
    contract_address,
    {
        from: sender, // default from address
        gasPrice: '20000000000', // default gas price in wei, 20 gwei in this case
        gas: 1000000000
    }
);

MyContract.setProvider(provider);



(async () => {
    // let estimatedGas = await MyContract.methods.newContract(
    //     receiver,
    //     hashPair.hash,
    //     timeLock1Hour
    // )
    //     .estimateGas({from: '0xC1AF5461D55863A987017A4d830D5F366fE1cb04', value: oneFinney});
    // console.log(estimatedGas);
    //     // .then(result => console.log(result))
    //     // .catch((err) => console.log(' ' + err));

    let transactionReceipt = await MyContract.methods.newContract(
        receiver,
        hashPair.hash,
        // timeLock1Hour
        timelock10Second
    )
        .send(send_param)
        .catch((err) => console.log(' ' + err));
    let contractId = transactionReceipt.events.LogHTLCNew.returnValues.contractId;
    console.log("New contract id is: ", transactionReceipt.events.LogHTLCNew.returnValues.contractId);


    //
    // MyContract.events.LogHTLCNew({},
    //     function(error, event){ console.log(event); }
    // )
    //     .on('data', function(event){
    //     console.log(event); // same results as the optional callback above
    // })
    //     .on('changed', function(event){
    //         // remove event from local database
    //     })
    //     .on('error', console.error);


    let receiverBalBefore = await getBalance(receiver);
    console.log("receiver's balance before withdraw: " + receiverBalBefore.toString());


    const wrongSecret = bufToStr(random32());

    // receiver calls withdraw with the secret to get the funds
    // let withdrawTx = await MyContract.methods.withdraw
    //     (
    //         contractId,
    //         hashPair.secret,
    //         // wrongSecret
    //     )
    //     .send(
    //         {
    //             from: receiver,
    //             gas: web3.utils.toHex(150000),
    //             gasPrice: web3.utils.toHex(web3.utils.toWei('30', 'gwei'))
    //         }
    //     )
    //
    //     .catch((err) => console.log(' ' + err));
    // console.log(withdrawTx);





    let _contract = await MyContract.methods.getContract(
        contractId
    )
        .call()
        .catch((err) => console.log(' ' + err));
    // console.log(_contract);

    let checkWithdrawPromise = new Promise(
        (resolve, reject) => {
            setTimeout(
                async () => {
                    try {
                        let withdrawTx = await MyContract.methods.withdraw(contractId, hashPair.secret)
                            .send(
                                {
                                    from: receiver,
                                    gas: web3.utils.toHex(150000),
                                    gasPrice: web3.utils.toHex(web3.utils.toWei('30', 'gwei'))
                                }
                            );
                        const expectedBalance = receiverBalBefore
                            .add(oneEther)
                            .sub(web3.utils.toBN(withdrawTx.gasUsed * web3.utils.toHex(web3.utils.toWei('30', 'gwei'))));
                        console.log("Receiver's expected balance: " + expectedBalance.toString());


                        //
                        // before: 99957317470000000000
                        // expected: 99955961240000000000
                        // after:99955961240000000000

                        resolve(

                        )
                    } catch (err) {
                        reject(
                            err
                        )
                    }
                },
                11000 //set this time to control the time when withdraw happened.
            );
    });
    checkWithdrawPromise
    .then( () =>
        {
            console.log("The withdraw is completed before expiration.");
            (async () => {
                let receiverBalanceAfterWithdraw = await getBalance(receiver);
                console.log("Receiver's actual balance after withdraw: " + receiverBalanceAfterWithdraw.toString());
            })();

        }
    )
    .catch(
        (err) =>
        {
            // console.log(err);
            console.log("\nThe withdraw is rejected for expiration.");


            (async () => {
                console.log("Refunding activated.");
                await MyContract.methods.refund(contractId)
                    .send(
                        {
                            from: sender,
                            gas: web3.utils.toHex(150000),
                            gasPrice: web3.utils.toHex(web3.utils.toWei('30', 'gwei'))
                        }
                    );
                let receiverBalanceAfterWithdraw = await getBalance(receiver);
                console.log("Receiver's actual balance after withdraw: " + receiverBalanceAfterWithdraw.toString());
                let senderBalanceAfterWithdraw = await getBalance(sender);
                console.log("Sender's balance after refunding: " + senderBalanceAfterWithdraw.toString());

            })();



        }
    );

})();




//     'wei':          '1',
//     'kwei':         '1000',
//     'ada':          '1000',
//     'femtoether':   '1000',
//     'mwei':         '1000000',
//     'babbage':      '1000000',
//     'picoether':    '1000000',
//     'gwei':         '1000000000',
//     'shannon':      '1000000000',
//     'nanoether':    '1000000000',
//     'nano':         '1000000000',
//     'szabo':        '1000000000000',
//     'microether':   '1000000000000',
//     'micro':        '1000000000000',
//     'finney':       '1000000000000000',
//     'milliether':   '1000000000000000',
//     'milli':        '1000000000000000',
//     'ether':        '1000000000000000000',
//     'kether':       '1000000000000000000000',
//     'grand':        '1000000000000000000000',
//     'einstein':     '1000000000000000000000',
//     'mether':       '1000000000000000000000000',
//     'gether':       '1000000000000000000000000000',
//     'tether':       '1000000000000000000000000000000'
