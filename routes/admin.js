import express from "express";
const router = express.Router();

router.get("/", (req,res) => {
    res.render("Admin page");
});

export default router;