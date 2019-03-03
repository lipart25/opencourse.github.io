const original = document.getElementById('original');
const translation = document.getElementById('translation');
const transcription = document.getElementById('transcription');
const keyboard = document.getElementById('keyboard');
const vkeys = keyboard.querySelectorAll('input');
const images = document.getElementById('images');
const spinner = document.getElementById('spinner');
const saveButton = document.getElementById('save');
const saveSpinner = document.getElementById('spinner-save');
const audioChunksLt = [];
const audioChunksRu = [];
var filename;
var lastFocus;

saveButton.addEventListener('click', function () {
    if (original.value && translation.value) {
        var filename = Date.now();

        if (audioChunksLt.length) {
            let blob = new Blob(audioChunksLt);
            uploadAudio(blob, filename + '_lt');
        }

        if (audioChunksRu.length) {
            let blob = new Blob(audioChunksRu);
            uploadAudio(blob, filename + '_ru');
        }


        submitData(filename);
    }
});

original.addEventListener('click', function () {
    if (keyboard.style.display === 'none') {
        keyboard.style.display = 'block';
    }
});

original.addEventListener('blur', function () {
    lastFocus = this;
    translate();
    transliterate();
});

vkeys.forEach(function (el) {
    el.addEventListener('click', function (k) {
        k.preventDefault();
        k.stopPropagation();
        if (lastFocus) {
            setTimeout(function() {
                lastFocus.focus();
                insertAtCursor(original, k.target.value);
                transliterate();
            }, 10);
        }
        return(false);
    });
});

function submitData(filename) {
    var xhr = new XMLHttpRequest();
    save.style.display = 'none';
    saveSpinner.style.display = 'block';
    xhr.onload = function(e) {
        if (this.readyState === 4 && this.status === 200) {
            window.location.replace("/admin");
        } else {
            alert('Выбери другую картинку');
            save.style.display = 'block';
            saveSpinner.style.display = 'none';
        }
    };
    var fd = new FormData(document.querySelector('form'));
    fd.append("filename", filename);
    if (audioChunksLt.length) {
        fd.append("filename_lt", filename + '_lt');
    }
    if (audioChunksRu.length) {
        fd.append("filename_ru", filename + '_ru');
    }
    xhr.open("POST", "/submit-data", true);
    xhr.send(fd);
}

function uploadAudio(blob, filename) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function(e) {
        if (this.readyState === 4) {
            console.log("Server returned: ", e.target.responseText);
        }
    };
    var fd = new FormData();
    fd.append("audio_data", blob, filename);
    xhr.open("POST", "/upload-audio", true);
    xhr.send(fd);
}

function recognizer(el, lang, textFieldId) {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            // Создаем распознаватель
            var recognizer = new webkitSpeechRecognition();
            var mediaRecorder = new MediaRecorder(stream);

            recognizer.onerror = function(event) {
                console.log(event.error);
            };

            recognizer.onstart = function() {
                el.classList.add('text-danger');
                mediaRecorder.start();
            };

            recognizer.onend = function() {
                el.classList.remove('text-danger');
                el.classList.add('text-success');
                mediaRecorder.stop();
            };

            mediaRecorder.addEventListener("dataavailable", event => {
                if (lang === 'lt-LT') {
                    audioChunksLt.length = 0;
                    audioChunksLt.push(event.data);
                } else {
                    audioChunksRu.length = 0;
                    audioChunksRu.push(event.data);
                }
            });

            mediaRecorder.addEventListener("stop", () => {
                if (lang === 'lt-LT') {
                    audioChunks = audioChunksLt;
                } else {
                    audioChunks = audioChunksRu;
                }

                const audioBlob = new Blob(audioChunks,{type:'audio/mpeg-3'});
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);
                audio.play();
            });

            // Ставим опцию, чтобы распознавание началось ещё до того, как пользователь закончит говорить
            recognizer.interimResults = true;

            // Какой язык будем распознавать?
            recognizer.lang = lang;

            // Используем колбек для обработки результатов
            recognizer.onresult = function (event) {
                var result = event.results[event.resultIndex];
                if (result.isFinal) {
                    var textField = document.getElementById(textFieldId);

                    if (!textField.value) {
                        textField.value = result[0].transcript;

                        if (textFieldId === 'original') {
                            translate();
                            transliterate();
                        }
                    }

                    el.classList.remove('text-danger');
                } else {
                    console.log('Промежуточный результат: ', result[0].transcript);
                }
            };

            // Начинаем слушать микрофон и распознавать голос
            recognizer.start();
        });
}

function insertAtCursor(myField, myValue) {
    //IE support
    if (document.selection) {
        myField.focus();
        sel = document.selection.createRange();
        sel.text = myValue;
    }
    //MOZILLA and others
    else if (myField.selectionStart || myField.selectionStart == '0') {
        var startPos = myField.selectionStart;
        var endPos = myField.selectionEnd;
        myField.value = myField.value.substring(0, startPos)
            + myValue
            + myField.value.substring(endPos, myField.value.length);
    } else {
        myField.value += myValue;
    }
}

function retrieveImages() {
    setTimeout(function(){
        if (translation.value) {
            spinner.style.display = 'block';
            images.style.display = 'none';
            var request = new XMLHttpRequest();
            request.onreadystatechange = function() {
                if(request.readyState === 4 && request.status === 200) {
                    images.innerHTML = '';
                    var parsed = JSON.parse(request.responseText);
                    parsed.forEach(function (el) {
                        var label = document.createElement('label');
                        var image = document.createElement('img');
                        var radio = document.createElement('input');

                        image.src = el.url;
                        image.classList.add('img-thumbnail');

                        radio.type = 'radio';
                        radio.name = 'image';
                        radio.value = el.url;

                        label.classList.add('col-6', 'mb-2');
                        label.innerHTML = radio.outerHTML + image.outerHTML;

                        images.appendChild(label);
                    });

                    img = images.querySelectorAll("img");

                    if (img) {
                        img.forEach(function (el) {
                            el.addEventListener("load", function() {
                                setTimeout(function(){
                                    spinner.style.display = 'none';
                                    images.style.display = 'flex';
                                },700);
                            });
                            el.addEventListener("error", function() {
                                this.parentNode.removeChild(this);
                            });
                        });
                    }
                }
            };
            request.open('GET', '/google-images?phrase=' + translation.value, true);
            request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
            request.send();
        }
    },700);
}

function translate() {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if(request.readyState === 4 && request.status === 200) {
            translation.value = request.responseText;
        }
    };
    request.open('GET', '/translate?phrase=' + original.value, true);
    request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
    request.send();
}

function transliterate() {
    var arrRu = new Array('Я','я','Ю','ю','Ч','ч','Ш','ш','Ж','ж','А','а','Б','б','В','в','Г','г', 'Д','д','Е',
        'е','Ё','ё','З','з','И','и','Й','й','К','к','Л','л','М','м','Н','н', 'О','о','П','п','Р','р','С', 'с','Т','т',
        'У','у','Ф','ф','Х','х','Ц','ц','И','и','А','а','Е','е','Е','е', 'У', 'у', 'У', 'у');
    var arrLt = new Array('Ja','ja','Ju','ju','Č','č','Š','š','Ž','ž','A','a','B','b','V','v', 'G','g','D','d',
        'E','e','Jo','jo','Z','z','I','i','J','j','K','k','L','l','M','m','N','n', 'O','o','P','p','R', 'r','S','s','T',
        't','U','u','F','f','H','h','C','c','Y','y','Ą','ą','Ę','ę','Ė', 'ė', 'Ų', 'ų', 'Ū', 'ū');

    var text = original.value;
    for(var i=0; i<arrLt.length; i++){
        var reg = new RegExp(arrLt[i], "g");
        text = text.replace(reg, arrRu[i]);
    }
    transcription.value = text;
}
