var points = 3;
var playButton = document.querySelectorAll('.play');

playButton.forEach(function (el) {
    el.addEventListener('click', function (ev) {
        if (this.dataset.audio) {
            var audio = new Audio('data/media/' + this.dataset.audio);
            audio.play();
        }
    });
});

function level1(event) {
    var slideAudio = new Audio('static/media/slide.mp3');
    slideAudio.play();
    var activeSlide = document.querySelector('.owl-item.active');
    activeSlide.classList.add('solved');

    var slidesCount = event.item.count;;
    var solved = document.querySelectorAll('.owl-item.solved');

    if (solved.length + 1 === slidesCount) {
        var winnerAudio = new Audio('static/media/winner.mp3');
        winnerAudio.play();
        const result = document.getElementById('result');
        let retry = '<a class="btn btn-lg btn-info" href=""><i class="fas fa-redo"></i></a>';
        let next = '<a class="btn btn-lg btn-success ml-1" href="/level2"><i class="fas fa-forward"></i></a>';

        result.innerHTML = retry + next;
    }
}

function level2() {
    const cardsLeft = document.querySelectorAll('#cardsLeft .card');
    const cardsRight = document.querySelectorAll('#cardsRight .card');
    var points = 3;

    cardsLeft.forEach(function (el) {
        el.addEventListener('click', function (el) {
            cardsLeft.forEach(function (el) {
                el.classList.remove('border-success');
            });
            this.classList.add('border-success');
            checkPair();
        });
    });

    cardsRight.forEach(function (el) {
        el.addEventListener('click', function (el) {
            cardsRight.forEach(function (el) {
                el.classList.remove('border-success');
            });
            this.classList.add('border-success');
            checkPair();
        });
    });

    function checkPair() {
        let selectedLeft = document.querySelector('#cardsLeft .border-success');
        let selectedRight = document.querySelector('#cardsRight .border-success');

        if (selectedLeft && selectedRight) {
            let leftId = selectedLeft.dataset.id;
            let rightId = selectedRight.dataset.id;

            if (leftId !== rightId) {
                selectedRight.classList.remove('border-success');
                selectedRight.classList.add('border-danger');
                setTimeout(function(){
                    selectedRight.classList.remove('border-danger');
                },700);
                points--;
            } else {
                selectedLeft.classList.add('bg-success', 'text-white');
                selectedRight.classList.add('bg-success', 'text-white');
                setTimeout(function(){
                    selectedLeft.remove();
                    selectedRight.remove();

                    let cards = document.querySelectorAll('#pairs .card');

                    if (!cards.length) {
                        winner(points, '/level3');
                    }
                },700);
            }
        }
    }
}

function level3() {
    const activeSlide = document.querySelector('.owl-item.active');
    const activeOptions = activeSlide.querySelectorAll('.option');
    const activeId = activeSlide.querySelector('.owl-card').dataset.id;

    activeOptions.forEach(function (el) {
        el.addEventListener('click', function (el) {
            activeOptions.forEach(function (el) {
                el.classList.remove('border-success');
            });
            this.classList.add('border-success');
            checkOption();
        });
    });

    function checkOption() {
        let selected = activeSlide.querySelector('.border-success');
        let selectedId = selected.dataset.id;

        if (activeId !== selectedId) {
            selected.classList.remove('border-success');
            selected.classList.add('border-danger');
            setTimeout(function(){
                selected.classList.remove('border-danger');
            },700);
            points--;
        } else {
            selected.classList.add('bg-success', 'text-white');
            activeSlide.classList.add('solved');

            setTimeout(function() {
                nextSlide();
            },1500);
        }
    }

    function nextSlide() {
        var owl = $('#carouselLevel3');
        owl.trigger('next.owl.carousel');

        var slidesCount = document.querySelectorAll('.owl-item').length;
        var solved = document.querySelectorAll('.owl-item.solved');

        if (solved.length === slidesCount) {
            owl.remove();
            winner(points, null);
        } else {
            var slideAudio = new Audio('static/media/slide.mp3');
            slideAudio.play();
            level3();
        }
    }
}

function winner(points, nextUrl) {
    const result = document.getElementById('result');
    const title = document.getElementById('title');
    var winnerAudio = new Audio('static/media/winner.mp3');
    let content;
    let stars;
    let retry = '<a class="btn btn-lg btn-info" href=""><i class="fas fa-redo"></i></a>';
    let next = '<a class="btn btn-lg btn-warning ml-1" href="/">Закончить</a>';
    if (nextUrl) {
        next = '<a class="btn btn-lg btn-success ml-1" href="' + nextUrl + '"><i class="fas fa-forward"></i></a>';
    }
    let buttons;

    if (points === 3) {
        title.innerText = 'Умница!';
        stars = '<div class="mb-2">' +
            '<h2>' +
            '<i class="fas fa-star text-warning"></i>' +
            '<i class="fas fa-star text-warning"></i>' +
            '<i class="fas fa-star text-warning"></i>' +
            '</h2>' +
            '</div>';
        buttons = retry + next;
    }

    if (points === 2) {
        title.innerText = 'Хорошо!';
        stars = '<div class="mb-2">' +
            '<h2>' +
            '<i class="fas fa-star text-warning"></i>' +
            '<i class="fas fa-star text-warning"></i>' +
            '<i class="far fa-star text-warning"></i>' +
            '</h2>' +
            '</div>';
        buttons = retry + next;
    }

    if (points === 1) {
        title.innerText = 'Так себе';
        stars = '<div class="mb-2">' +
            '<h2>' +
            '<i class="fas fa-star text-warning"></i>' +
            '<i class="far fa-star text-warning"></i>' +
            '<i class="far fa-star text-warning"></i>' +
            '</h2>' +
            '</div>';
        buttons = retry + next;
    }

    if (points < 1) {
        title.innerText = 'Плохо, пробуй еще';
        stars = '<div class="mb-2">' +
            '<h2>' +
            '<i class="far fa-star text-warning"></i>' +
            '<i class="far fa-star text-warning"></i>' +
            '<i class="far fa-star text-warning"></i>' +
            '</h2>' +
            '</div>';
        buttons = retry;
        winnerAudio = new Audio('static/media/lose.mp3');
    }

    content = stars + buttons;

    winnerAudio.play();

    result.innerHTML = content;
}