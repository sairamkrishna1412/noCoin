const express = require("express");
const apiController = require("../controllers/apiController");

const router = express.Router();

router.get("/blockchain", apiController.getBlockchain);

router.post("/transaction", apiController.newTransaction);
router.post("/transaction/broadcast", apiController.transactBroadcast);
router.get("/transaction/:id", apiController.getTransactionById);
router.get("/address/:address", apiController.getTransactionsByAddress);
router.get("/block/:hash", apiController.getBlockByHash);

router.get("/mineBlock", apiController.mineBlock);
router.post("/add-block", apiController.addBlock);
router.get("/consensus", apiController.checkConsensus);

router.post("/register-node", apiController.registerNode);
router.post("/register-bulk-nodes", apiController.registerBulkNodes);
router.post("/register-broadcast-node", apiController.registerBroadcastNode);

module.exports = router;
