var accessToken = "TOKEN",
    baseUrl = "https://api.api.ai/v1/",
    $speechInput,
    $textInput,
    $recBtn,
    recognition,
    messageRecording = "Listening...",
    messageCouldntHear = "I couldn't hear you, could you say that again?",
    messageInternalError = "Oh no, there has been an internal server error",
    messageSorry = "I'm sorry, I don't have the answer to that yet.";

$(document).ready(function () {
    $speechInput = $("#speech");
    $recBtn = $("#rec");

    $speechInput.keypress(function (event) {
        if (event.which == 13) {
            event.preventDefault();
            send();
        }
    });
    $recBtn.on("click", function (event) {
        switchRecognition();
    });
});

function startRecognition() {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = function (event) {
        respond(messageRecording);
        updateRec();
    };
    recognition.onresult = function (event) {
        recognition.onend = null;

        var text = "";
        for (var i = event.resultIndex; i < event.results.length; ++i) {
            text += event.results[i][0].transcript;
        }
        setInput(text);
        stopRecognition();
    };
    recognition.onend = function () {
        respond(messageCouldntHear);
        stopRecognition();
    };
    recognition.lang = "en-US";
    recognition.start();
}

function stopRecognition() {
    if (recognition) {
        recognition.stop();
        recognition = null;
    }
    updateRec();
}

function switchRecognition() {
    if (recognition) {
        stopRecognition();
    } else {
        startRecognition();
    }
}

function setInput(text) {
    $textInput = text;
    send();
}

function updateRec() {
    if (recognition) {
        $("#rec").addClass("pulse").find(".rec_btn").html();
    } else { $("#rec").removeClass("pulse").find(".rec_btn").html(); }
}

function send() {
    var text = $speechInput.val();
    if (text.length < 1) { text = $textInput; }

    $("#spokenInput").addClass("is-active").find(".spoken-input__text").html("You: " + text);

    $("#spokenInput").removeClass("hide").find(".spoken-input__text").html();

    $.ajax({
        type: "POST",
        url: baseUrl + "query",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        headers: {
            "Authorization": "Bearer " + accessToken
        },
        data: JSON.stringify({ query: text, lang: "en", sessionId: "yaydevdiner" }),

        success: function (data) {
            prepareResponse(data);
        },
        error: function () {
            respond(messageInternalError);
        }
    });
}

function prepareResponse(val) {
    var debugJSON = JSON.stringify(val, undefined, 2),
        spokenResponse = val.result.speech,
        parameters = JSON.stringify(val.result.parameters, undefined, 2);

    if (val.result.speech == "Thank you. Result is booked") {
        spokenResponse = "Result " + val.result.parameters.result.amount + " was booked to competitor " + val.result.parameters.competitor
    } else { spokenResponse = val.result.speech; }

    respond(spokenResponse);
    debugRespond(debugJSON);
}

function debugRespond(val) {
    console.log(val);
    $("#response").text(val);

}

function respond(val) {
    if (val == "") {
        val = messageSorry;
    }

    if (val !== messageRecording) {
        var voices = window.speechSynthesis.getVoices();
        var msg = new SpeechSynthesisUtterance();
        msg.voiceURI = "native";
        msg.text = val;
        msg.lang = "en-US";
        window.speechSynthesis.speak(msg);
    }

    $("#spokenResponse").addClass("is-active").find(".spoken-response__text").html("SportAI: " + val);
    $speechInput.val("")
}