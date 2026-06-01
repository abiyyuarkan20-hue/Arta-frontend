const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// GET /api/users — Ambil semua user (untuk daftar tim)
router.get("/", userController.getAllUsers);

// POST /api/users — Buat akun karyawan baru
router.post("/", userController.createUser);

// PUT /api/users/:id — Update nama/role karyawan
router.put("/:id", userController.updateUser);

// DELETE /api/users/:id — Hapus akun karyawan
router.delete("/:id", userController.deleteUser);

// POST /api/users/set-owner — Set role OWNER untuk user saat ini
router.post("/set-owner", userController.setOwnerRole);

module.exports = router;
