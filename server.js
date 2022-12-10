const express = require('express');
const { PORT } = require('./config.js');

let app = express();
//wwwroot폴더를 루트로 정하고 폴더의 index.html을 실행하고
//index.html안에 있는  <script src="/main.js" type="module"></script>를 싱행한다.

app.use(express.static('wwwroot'));

//미들웨어 등록 인증
app.use(require('./routes/auth.js'));
//모델 데이터관련 미들웨어
app.use(require('./routes/models.js'));
app.listen(PORT, function () { console.log(`Server listening on port ${PORT}...`); });
