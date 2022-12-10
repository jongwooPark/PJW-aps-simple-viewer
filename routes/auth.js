const express = require('express');
const { getPublicToken } = require('../services/aps.js');

let router = express.Router();

//res.json()
//res.json()은 안에 들어있는 데이터들을 자동으로 json 형식으로 바꾸어 보내준다

router.get('/api/auth/token', async function (req, res, next) {
    try {
        res.json(await getPublicToken());
    } catch (err) {
        next(err);
    }
});

module.exports = router;
