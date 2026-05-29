const express = require("express");
const router = express.Router();
const { submitFeasibilityTest } = require("../controllers/feasibilityController");

// POST /api/feasibility-tests
router.post("/", submitFeasibilityTest);

module.exports = router;
