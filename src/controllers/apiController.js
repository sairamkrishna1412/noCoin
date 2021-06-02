const axios = require("axios");
const Blockchain = require("../blockchain");
const noCoin = new Blockchain();
const nodeUrl = process.argv[3];

exports.getBlockchain = function (req, res) {
    res.status(200).json({
        status: "success",
        data: noCoin,
    });
};

exports.newTransaction = function (req, res) {
    const { transaction } = req.body;
    const blockIndex = noCoin.addTransactionToPending(transaction);
    res.status(200).json({
        status: "success",
        message: `Transaction is added to the block with index : ${blockIndex}`,
    });
};

exports.mineBlock = function (req, res) {
    const prevBlock = noCoin.getLatestBlock();
    const prevHash = prevBlock.hash;
    const data = {
        transactions: noCoin.pendingTransactions,
        index: prevBlock.index + 1,
    };

    const nonce = noCoin.proofOfWork(prevHash, data);
    const hash = noCoin.hashBlock(prevHash, data, nonce);
    // noCoin.createNewTransaction(50, "0", "blockMiner");
    const newBlock = noCoin.createNewBlock(nonce, prevHash, hash);

    const addedBlocks = [];
    noCoin.networkNodes.forEach((node, ind) => {
        const response = axios({
            method: "POST",
            url: `${node}/api/v1/add-block`,
            data: {
                newBlock,
            },
        });
        addedBlocks.push(response);
    });

    Promise.all(addedBlocks)
        .then(() => {
            const response = axios({
                method: "POST",
                url: `${noCoin.nodeUrl}/api/v1/transaction/broadcast`,
                data: {
                    amount: 50,
                    sender: "0",
                    recipient: `${noCoin.nodeUrl}`,
                },
            });
            response.then(() => {
                res.status(200).json({
                    status: "success",
                    message: `block added to blockchain. index : ${newBlock.index}`,
                    data: {
                        block: newBlock,
                    },
                });
            });
        })
        .catch((err) => {
            res.status(400).json({
                status: "fail",
                message: "something went wrong. please try again.",
                stack: err.stack,
            });
        });
};

exports.registerNode = function (req, res) {
    //get nodeUrl of node to be registered
    const { nodeUrl } = req.body;
    if (
        noCoin.networkNodes.indexOf(nodeUrl) == -1 &&
        noCoin.nodeUrl !== nodeUrl
    ) {
        //add nodeUrl to this.networkNodes
        noCoin.networkNodes.push(nodeUrl);
        //end request-response cycle
        res.status(200).json({
            status: "success",
            message: `${nodeUrl} registered succesfully.`,
        });
    } else {
        res.status(400).json({
            status: "fail",
            message: "something went wrong. please try again.",
        });
    }
};
exports.registerBulkNodes = function (req, res) {
    //get already existing nodes from another node
    const { networkNodes } = req.body;
    //for each item in networkNodes add them to this.networkNodes
    networkNodes.forEach((nodeUrl, ind) => {
        if (
            noCoin.networkNodes.indexOf(nodeUrl) == -1 &&
            noCoin.nodeUrl !== nodeUrl
        ) {
            noCoin.networkNodes.push(nodeUrl);
        }
    });
    //end request-response cycle
    res.status(200).json({
        status: "success",
        message: "blockchain nodes registered",
    });
};
exports.registerBroadcastNode = function (req, res) {
    //register node with self
    const { nodeUrl } = req.body;
    if (
        noCoin.networkNodes.indexOf(nodeUrl) == -1 &&
        noCoin.nodeUrl !== nodeUrl
    ) {
        noCoin.networkNodes.push(nodeUrl);
    }

    //register node with other nodes
    const networkNodeRegister = [];
    noCoin.networkNodes.forEach((existingNode) => {
        if (existingNode !== nodeUrl) {
            const response = axios({
                method: "POST",
                url: `${existingNode}/api/v1/register-node`,
                data: {
                    nodeUrl,
                },
            });
            networkNodeRegister.push(response);
        }
    });

    Promise.all(networkNodeRegister)
        .then(() => {
            console.log(`all nodes acknowleged ${nodeUrl}`);
        })
        .catch((err) => {
            console.error(`something went wrong`);
        });

    //bulk-register all existing nodes into new node
    // console.log([...noCoin.networkNodes, noCoin.nodeUrl]);
    const bulkResponse = axios({
        method: "POST",
        url: `${nodeUrl}/api/v1/register-bulk-nodes`,
        data: {
            networkNodes: [...noCoin.networkNodes, noCoin.nodeUrl],
        },
    });

    bulkResponse.then(() => {
        res.status(200).json({
            status: "success",
            message: "node registered successfully in blockchain",
            data: {
                nodeUrl,
            },
        });
    });
};

exports.transactBroadcast = function (req, res) {
    const { amount, sender, recipient } = req.body;
    const transaction = noCoin.createNewTransaction(amount, sender, recipient);
    const blockIndex = noCoin.addTransactionToPending(transaction);
    const sentTransactions = [];
    noCoin.networkNodes.forEach((nodeUrl) => {
        const response = axios({
            method: "POST",
            url: `${nodeUrl}/api/v1/transaction`,
            data: {
                transaction,
            },
        });
        sentTransactions.push(response);
    });
    Promise.all(sentTransactions)
        .then(() => {
            res.status(200).json({
                status: "success",
                message: `Transaction is added to the block with ID : ${blockIndex}`,
            });
        })
        .catch((err) => {
            res.status(400).json({
                status: "fail",
                message: `Something went wrong. please try again.`,
            });
        });
};

exports.addBlock = function (req, res) {
    //get block from req.body
    const { newBlock } = req.body;
    const latestBlock = noCoin.getLatestBlock();
    //verify transaction
    const data = {
        transactions: noCoin.pendingTransactions,
        index: latestBlock.index + 1,
    };
    const evalHash = noCoin.hashBlock(newBlock.prevHash, data, newBlock.nonce);
    //add to blockchain if verified
    if (
        evalHash === newBlock.hash &&
        latestBlock.hash === newBlock.prevHash &&
        newBlock.index == latestBlock.index + 1
    ) {
        noCoin.chain.push(newBlock);
        noCoin.pendingTransactions = [];
        res.status(200).json({
            status: "success",
            message: `new block is added to the blockchain with index : ${newBlock.index}`,
        });
    } else {
        res.status(400).json({
            status: "fail",
            message: `Something went wrong. please try again.`,
        });
    }
};

exports.checkConsensus = function (req, res) {
    const currentChain = noCoin.chain;
    //check if current chain is longestChain;
    const blockchains = [];
    noCoin.networkNodes.forEach((node, ind) => {
        const response = axios({
            method: "GET",
            url: `${node}/api/v1/blockchain`,
        });
        blockchains.push(response);
    });

    Promise.all(blockchains)
        .then((values) => {
            values.forEach((value) => {
                const blockchain = value.data.data;
                const chain = blockchain.chain;
                if (chain.length > currentChain.length) {
                    if (noCoin.isValidchain(chain)) {
                        noCoin.chain = chain;
                        noCoin.pendingTransactions =
                            blockchain.pendingTransactions;
                        return res.status(200).json({
                            status: "success",
                            message: "chain is updated!",
                            chain,
                        });
                    }
                }
            });
            res.status(200).json({
                status: "success",
                message: "Your chain is the longest and most up to date!",
                chain: currentChain,
            });
        })
        .catch((err) => {
            res.status(400).json({
                status: "fail",
                message: `Something went wrong. please try again.`,
                stack: err.stack,
            });
        });
};

exports.getBlockByHash = function (req, res) {
    const { hash } = req.params;
    const block = noCoin.findByHash(hash);
    if (!block) {
        res.status(400).json({
            status: "fail",
            message: "no block with that hash",
        });
    } else {
        res.status(200).json({
            status: "success",
            data: {
                block,
            },
        });
    }
};

exports.getTransactionById = function (req, res) {
    const { id } = req.params;
    const transaction = noCoin.findByTransactionId(id);
    if (!transaction) {
        res.status(400).json({
            status: "fail",
            message: "no transaction with that id",
        });
    } else {
        res.status(200).json({
            status: "success",
            data: {
                transaction,
            },
        });
    }
};
exports.getTransactionsByAddress = function (req, res) {
    const { address } = req.params;
    const data = noCoin.findByAddress(address);
    if (!data) {
        res.status(400).json({
            status: "fail",
            message: "no user with that name",
        });
    } else {
        res.status(200).json({
            status: "success",
            data,
        });
    }
};
