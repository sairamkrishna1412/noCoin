const crypto = require("crypto");
const { v1: uuidv1 } = require("uuid");
const Block = require("./block");
const { DIFFICULTY } = require("../config");
class Blockchain {
    constructor() {
        this.chain = [];
        this.pendingTransactions = [];
        this.createNewBlock(100, "0", "genesis");
        this.networkNodes = [];
        this.nodeUrl = process.argv[3];
    }
    createNewBlock(nonce, prevHash, hash) {
        const newBlock = new Block(
            this.chain.length + 1,
            Date.now(),
            this.pendingTransactions,
            prevHash,
            nonce,
            hash
        );

        this.pendingTransactions = [];
        this.chain.push(newBlock);

        return newBlock;
    }
    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }
    createNewTransaction(amount, sender, recipient) {
        const transaction = {
            amount,
            sender,
            recipient,
            id: uuidv1().split("-").join(""),
        };
        return transaction;
    }
    addTransactionToPending(transaction) {
        this.pendingTransactions.push(transaction);
        // console.log(
        //     `>>> AMOUNT : ${amount},  FROM : ${sender} => TO : ${recipient}`
        // );
        return this.getLatestBlock().index + 1;
    }
    hashBlock(prevHash, data, nonce) {
        const blockData = [prevHash, JSON.stringify(data), nonce]
            .sort()
            .join(" ");
        const hash = crypto
            .createHash("sha256")
            .update(blockData)
            .digest("hex");
        return hash;
    }
    proofOfWork(prevHash, data) {
        let nonce = 0;
        let hash = this.hashBlock();
        while (hash.substring(0, DIFFICULTY) !== "0".repeat(DIFFICULTY)) {
            nonce++;
            hash = this.hashBlock(prevHash, data, nonce);
        }
        return nonce;
    }
    isValidchain(chain) {
        //check genesis block
        const genesis = chain[0];
        if (
            genesis.hash !== "genesis" ||
            genesis.nonce !== 100 ||
            genesis.prevHash !== "0" ||
            genesis.index !== 1 ||
            genesis.transactions.length !== 0
        ) {
            return false;
        }

        //for each block in blockchain evaluate hash and check if it actually matches and check prevhash == hash
        for (let i = 1; i < chain.length; i++) {
            const currentBlock = chain[i];
            const prevBlock = chain[i - 1];

            const data = {
                transactions: currentBlock.transactions,
                index: prevBlock.index + 1,
            };

            const evalHash = this.hashBlock(
                prevBlock.hash,
                data,
                currentBlock.nonce
            );
            if (
                evalHash.substring(0, DIFFICULTY) !== "0".repeat(DIFFICULTY) ||
                evalHash !== currentBlock.hash
            ) {
                return false;
            }
            if (currentBlock.prevHash !== prevBlock.hash) {
                return false;
            }
        }
        return true;
    }
    findByHash(hash) {
        for (let i = 0; i < this.chain.length; i++) {
            const block = this.chain[i];
            if (block.hash === hash) {
                return block;
            }
        }
        return null;
    }
    findByTransactionId(id) {
        for (let i = 0; i < this.chain.length; i++) {
            const block = this.chain[i];
            console.log(block);
            const transactions = block.transactions;
            console.log(transactions);
            for (let j = 0; j < transactions.length; j++) {
                if (transactions[j].id === id) {
                    return {
                        transaction: transactions[j],
                        block,
                    };
                }
            }
        }
        return null;
    }
    findByAddress(address) {
        const debit = [];
        const credit = [];
        let balance = 0;
        this.chain.forEach((block) => {
            block.transactions.forEach((transaction) => {
                if (transaction.sender === address) {
                    debit.push(transaction);
                    balance -= transaction.amount;
                } else if (transaction.recipient === address) {
                    credit.push(transaction);
                    balance += transaction.amount;
                }
            });
        });
        let transactions = [...debit, ...credit].sort(
            (a, b) => b.amount - a.amount
        );
        return {
            transactions,
            credit,
            debit,
            balance,
        };
    }
}

module.exports = Blockchain;
