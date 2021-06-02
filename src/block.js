class Block {
    constructor(index, timestamp, transactions, prevHash, nonce, hash) {
        this.index = index;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.prevHash = prevHash;
        this.nonce = nonce;
        this.hash = hash;
    }
}

module.exports = Block;
