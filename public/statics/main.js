function _ajax(url, arg1, arg2) {
    var callback = arg1;
    var data = {};
    if (arg2) {
        data = arg1;
        callback = arg2;
    }
    $.ajax({
        type: "POST",
        url: url,
        dataType: "json",
        data: data,
        success: function (data, textStatus) { },
        complete: function (jqXHR) {
            var obj = null;
            if (jqXHR.responseText) {
                try {
                    if (JSON.parse) {
                        obj = JSON.parse(jqXHR.responseText);
                    } else {
                        obj = eval("(" + jqXHR.responseText + ")");
                    }
                } catch (err) {

                }
            }
            if (obj == null) {
                callback(jqXHR.responseText);
            } else {
                callback(obj);
            }
        }
    });
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //최댓값은 제외, 최솟값은 포함
}


var $document = $(document);

var $examBefore = $('#exam-before');
var $examOngoing = $('#exam-ongoing');
var $examAfter = $('#exam-after');

var $mondaiLen = $('#mondai-len');

var $questionNum = $('#question-num');
var $mondai = $('#mondai');
var $description = $('#description');

var $dabanzi = $('#dabanzi');
var $answer = $('#answer');
var $hantei = $('#hantei');
var $seikai = $('#seikai');
var seikai = null;

var $submit = $('#submit');
var $next = $('#next');

var $point = $('#point');
var $kyu = $('#kyu');

const START_PHASE = 0;
const MONDAI_PHASE = 1;
const ANSWER_PHASE = 2;
const RESULT_PHASE = 3;
var phase = START_PHASE;

var mondai_mem = [];
var mondai_cnt = 0;
var seikai_cnt = 0;

const MONDAI_LEN_PER_EXAM = 10;

var mondaishu = null;
var mondaishu_cp = null;

_ajax("statics/mondaishu.json", {}, function (data) {
    mondaishu = data;
});

function init_or_debug($phase = null) {
    $mondaiLen.text(MONDAI_LEN_PER_EXAM);

    $init = $phase == null ? $examBefore : $phase;
    $init.css({ "display": "block" });
}

function mondai_gen() {
    var mon_idx = getRandomInt(0, 123456789) % mondaishu_cp.length;
    var desc_idx = getRandomInt(0, 123456789) % mondaishu_cp[mon_idx].description.length;

    return [mon_idx, desc_idx];
}

function init_exam() {
    mondaishu_cp = JSON.parse(JSON.stringify(mondaishu));
    mondai_cnt = 0;
    seikai_cnt = 0;

    question_ready();
}

function chezeom(daban, seikai) {
    if (daban == seikai) {
        seikai_cnt += 1;
        $hantei.text("올ㅋ");
    } else {
        $hantei.text("응 아니야");
    }
}

function clean_answer() {
    $dabanzi.val("");
    $answer.css({ "display": "none" });
    $submit.css({ "display": "inline" });
    $next.css({ "display": "none" });
}

function question_ready() {
    clean_answer();

    mondai_cnt += 1;
    $questionNum.text(mondai_cnt);

    chulje();
}

function get_point(cnt) {
    return Math.round(cnt * 100 / MONDAI_LEN_PER_EXAM);
}

function init_after() {
    var point = get_point(seikai_cnt);
    var kyu = "";

    if (point >= 80) {
        kyu = "1급 ㅊㅋㅊㅋ";
    } else if (point >= 70) {
        kyu = "2급 ㅊㅋ";
    } else if (point >= 60) {
        kyu = "3급 ㅋ";
    } else {
        kyu = "불합격잼ㅋㅋㅋㅋㅋㅋ";
    }

    $point.text(point);
    $kyu.text(kyu);
    $examAfter.css({ "display": "block" });
}

function scroll_top() {
    $document.scrollTop($document.height());
}

function scroll_bottom() {
    $document.scrollTop($document.height());
}

function remove_mondai(key) {
    mondaishu_cp[key[0]].description.splice(key[1], 1);
    if (mondaishu_cp[key[0]].description.length == 0) {
        mondaishu_cp.splice(key[0], 1);
    }
}

function get_mondai_set() {
    var key = mondai_gen();
    var mondaizip = mondaishu_cp[key[0]];

    var mondai = mondaizip.mondai;
    var description = mondaizip.description[key[1]];
    var seikai = mondaizip.seikai;

    remove_mondai(key);

    return { mondai, description, seikai };
}

function chulje() {
    var mondai_set = get_mondai_set();

    $mondai.text(mondai_set.mondai);
    $description.text(mondai_set.description);
    $seikai.text(mondai_set.seikai);

    seikai = mondai_set.seikai;
}

function start() {
    if (mondaishu == null) {
        alert("문제 로딩중임.. 좀만 기달ㅎ");
        return false;
    }

    phase = MONDAI_PHASE;
    $examBefore.css({ "display": "none" });
    init_exam();
    $examOngoing.css({ "display": "block" });
    $dabanzi.focus();
}

function submit() {
    var daban = $dabanzi.val();
    if (daban.length == 0) {
        alert("최소한 답안은 작성하시길...");
        return true;
    }

    phase = ANSWER_PHASE;
    chezeom(daban, seikai)

    $answer.css({ "display": "block" });
    $submit.css({ "display": "none" });
    $next.css({ "display": "inline" });

    scroll_bottom();
}

function next() {
    if (mondai_cnt == MONDAI_LEN_PER_EXAM) {
        phase = RESULT_PHASE;
        $examOngoing.css({ "display": "none" });
        init_after();
    } else {
        phase = MONDAI_PHASE;
        question_ready();
        $dabanzi.focus();
    }
    scroll_top();
}

function retry() {
    phase = START_PHASE;
    $examBefore.css({ "display": "block" });
    $examAfter.css({ "display": "none" });
}

(function ($) {

    'use strict';
    $(document).ready(function () {
        init_or_debug();

        $('#start').on('click', function () {
            start();
        });

        $('#submit').on('click', function () {
            submit();
        });

        $('#next').on('click', function () {
            next();
        });

        $('#retry').on('click', function () {
            retry();
        });

        $document.keydown(function (e) {
            if (e.keyCode == 13) {
                switch (phase) {
                    case START_PHASE:
                        start();
                        break;
                    case MONDAI_PHASE:
                        submit();
                        break;
                    case ANSWER_PHASE:
                        next();
                        break;
                    case RESULT_PHASE:
                        retry();
                        break;
                }
            }
        });
    });

}(jQuery));