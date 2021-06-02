const Blockchain = require("../src/blockchain");

function mine(blockchain) {
    console.log("MINING : ");
    const prevBlock = blockchain.getLatestBlock();
    const prevHash = prevBlock.hash;
    const data = {
        transactions: blockchain.pendingTransactions,
        index: prevBlock.index + 1,
    };

    const nonce = blockchain.proofOfWork(prevHash, data);
    const hash = blockchain.hashBlock(prevHash, data, nonce);
    blockchain.createNewTransaction(50, "0", "blockMiner");
    const newBlock = blockchain.createNewBlock(nonce, prevHash, hash);
    console.log("New block created\n", newBlock);
}

const noCoin = new Blockchain();

noCoin.createNewTransaction(100, "shiva", "sai");
noCoin.createNewTransaction(100, "roop", "varu");
noCoin.createNewTransaction(100, "sai", "roop");
noCoin.createNewTransaction(100, "varu", "shiva");

mine(noCoin);

noCoin.createNewTransaction(31, "sing", "bing");
noCoin.createNewTransaction(26, "ling", "ding");

mine(noCoin);

console.log("no coin");
console.log(noCoin);
