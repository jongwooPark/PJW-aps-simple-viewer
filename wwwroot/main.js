
//require vs import 문법
//(require / exports
//import / export
//일반적으로 import()는 사용자가 필요한 모듈 부분 만 선택하고 로드 할 수 있기 때문에 더 선호된다. 
//또한 require()보다 성능이 우수하며 메모리를 절약한다.

import { initViewer, loadModel } from './viewer.js';

console.log('kkkkkkk main.js->' );

//초기 뷰어설정
initViewer(document.getElementById('preview')).then(viewer => {
    
    //넘어온 url에 포함된 해시(#) 값을 javascript로 추출하는 함수입니다
    // 해시(#)값에서 첫번째자리를 제외한 값을 추출하여 가져온다.

   // const urn = window.location.hash?.substring(1);
    const urn = window.location.hash.substring(1);


    console.log('(2)get urn, window.location.hash', urn, window.location.hash);
    //모델링데이터 로드관련
    setupModelSelection(viewer, urn);
    
    //파일 업로드 관련 
    setupModelUpload(viewer);
});

//async await는 await뒤 함수종료때까지 대기

async function setupModelSelection(viewer, selectedUrn) {
    const dropdown = document.getElementById('models');
    dropdown.innerHTML = '';
    try {

        //모델리스트 불러오기
        //브라우저 내장 함수인 fetch()를 호출하여 REST API 호출

        const resp = await fetch('/api/models');
        if (!resp.ok) {
            throw new Error(await resp.text());
        }
        console.log('(3)get resp', resp);
        //셀렉션 리스트 만들기
        
        const models = await resp.json();
         console.log('(4)get models', models);

        dropdown.innerHTML = models.map(model => `<option value=${model.urn} ${model.urn === selectedUrn ? 'selected' : ''}>${model.name}</option>`).join('\n');
        dropdown.onchange = () => onModelSelected(viewer, dropdown.value);
        if (dropdown.value) {
            onModelSelected(viewer, dropdown.value);
             console.log('(7)onModelSelected', dropdown.value);

        }
    } catch (err) {
        alert('Could not list models. See the console for more details.');
        console.error(err);
    }
}

async function setupModelUpload(viewer) {
    const upload = document.getElementById('upload');
    const input = document.getElementById('input');
    const models = document.getElementById('models');
    upload.onclick = () => input.click();
    input.onchange = async () => {
        const file = input.files[0];
        let data = new FormData();
        data.append('model-file', file);
        if (file.name.endsWith('.zip')) { // When uploading a zip file, ask for the main design file in the archive
            const entrypoint = window.prompt('Please enter the filename of the main design inside the archive.');
            data.append('model-zip-entrypoint', entrypoint);
        }
        upload.setAttribute('disabled', 'true');
        models.setAttribute('disabled', 'true');
        showNotification(`Uploading model <em>${file.name}</em>. Do not reload the page.`);
        try {
            const resp = await fetch('/api/models', { method: 'POST', body: data });
            if (!resp.ok) {
                throw new Error(await resp.text());
            }
            const model = await resp.json();
            setupModelSelection(viewer, model.urn);
        } catch (err) {
            alert(`Could not upload model ${file.name}. See the console for more details.`);
            console.error(err);
        } finally {
            clearNotification();
            upload.removeAttribute('disabled');
            models.removeAttribute('disabled');
            input.value = '';
        }
    };
}

async function onModelSelected(viewer, urn) {
    if (window.onModelSelectedTimeout) {
        clearTimeout(window.onModelSelectedTimeout);
        delete window.onModelSelectedTimeout;
    }

    //브라우저 탭에서 열린 URL에 대한 해시(#) 값을 반환하는 속성이 있습니다. 
    //이 속성은 반환 값에서 해시가 URL에 있는지 여부를 확인하는 데 사용할 수 있습니다. 
    //반환 값이 빈 문자열이 아닌 경우 URL에 해시가 포함되어 있음을 의미합니
    window.location.hash = urn;
    
    console.log('(5) window.location.hash', window.location.hash);

    try {
        const resp = await fetch(`/api/models/${urn}/status`);
        if (!resp.ok) {
            throw new Error(await resp.text());
        }
        const status = await resp.json();
         console.log('(6) model loading .. resp', resp);
        switch (status.status) {
            case 'n/a':
                showNotification(`Model has not been translated.`);
                break;
            case 'inprogress':
                showNotification(`Model is being translated (${status.progress})...`);
                window.onModelSelectedTimeout = setTimeout(onModelSelected, 5000, viewer, urn);
                break;
            case 'failed':
                showNotification(`Translation failed. <ul>${status.messages.map(msg => `<li>${JSON.stringify(msg)}</li>`).join('')}</ul>`);
                break;
            default:
                clearNotification();
                loadModel(viewer, urn);
                break; 
        }
    } catch (err) {
        alert('Could not load model. See the console for more details.');
        console.error(err);
    }
}

function showNotification(message) {
    const overlay = document.getElementById('overlay');
    overlay.innerHTML = `<div class="notification">${message}</div>`;
    overlay.style.display = 'flex';
}

function clearNotification() {
    const overlay = document.getElementById('overlay');
    overlay.innerHTML = '';
    overlay.style.display = 'none';
}
