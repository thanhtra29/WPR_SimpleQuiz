const _header = document.querySelector("header");
const _introduction = document.querySelector("#introduction");

const _quizSection = document.querySelector("#attempt-quiz");
const _quiz = document.querySelector("#quiz");
const _optionElement = document.querySelector(".all_options");
const _submitBlock = document.querySelector(".submit-block");

const _resultSection = document.querySelector("#review-quiz");
const _scoreIn10 = document.querySelector(".inTen");
const _score_percentage = document.querySelector(".inPercentage");
const _msg = document.querySelector(".message");

let idAttempt;
const getAttemptById = async() => {
    let current_attemptID = localStorage.getItem("attempt_id");
    const response = await fetch(`/attempts/${current_attemptID}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });
    const data = await response.json();
    return data;
};

const startAttempt = async() => {
    const reponse = await fetch("/attempts", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
    });
    const attemptObject = await reponse.json();
    return attemptObject;
};

const quizGenerator = async() => {
    _introduction.classList.add("hidden");
    _quizSection.classList.remove("hidden");

    let data;
    if (localStorage.getItem("attempt_id")) {
        data = await getAttemptById();
    } else {
        data = await startAttempt();
        localStorage.setItem("attempt_id", data._id);
    }

    data.questions.map((ques, index) => {
        const questionDiv = document.createElement("div");
        questionDiv.classList.add("ques-section");
        questionDiv.id = `${ques._id}`;

        const quesCounter = document.createElement("h1");
        quesCounter.classList.add("ques-counter");
        quesCounter.textContent = `Question ${index + 1} of 10`;

        const p = document.createElement("p");
        p.textContent = `Question ${index + 1}: ${ques.text}`;
        p.classList.add("ques-title");
        p.id = `${ques._id}`;

        questionDiv.appendChild(quesCounter);
        questionDiv.appendChild(p);

        ques.answers.map((option, i) => {
            const div = document.createElement("div");
            div.classList.add("options");

            const input = document.createElement("input");
            input.id = `question${index + 1}_option${i}`;
            input.setAttribute("type", "radio");
            input.value = `${i}`;
            input.classList.add("option-radio");
            input.name = `${p.id}`;

            const label = document.createElement("label");
            label.setAttribute("for", `question${index + 1}_option${i}`);
            label.textContent = option;
            label.classList.add("label-ques");
            const br = document.createElement("br");

            div.appendChild(input);
            div.appendChild(label);
            div.appendChild(br);

            questionDiv.appendChild(div);

            _optionElement.appendChild(questionDiv);
        });
    });
    _startBtn.removeEventListener("click", quizGenerator);
    idAttempt = data._id;
};

const onSubmitQuiz = async() => {
    localStorage.removeItem("attempt_id");
    if (!window.confirm("Do you want to submit?")) {
        return;
    }

    _submitBtn.classList.add("hidden");
    _resultSection.classList.remove("hidden");
    _redoBtn.classList.remove("hidden");
    _submitBlock.classList.add("hidden");

    const _inputs = document.querySelectorAll("input");

    const body = {
        answers: {},
    };

    const checkedInputs = [];

    for (input of _inputs) {
        if (input.checked) {
            checkedInputs.push(input);
            body.answers[input.name] = parseInt(input.value);
        }
    }

    const apiSubmit = `/attempts/${idAttempt}/submit`;
    const response = await fetch(apiSubmit, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    const data = await response.json();
    const solutions = data.correctAnswers;

    //gray all correct answer and disable input
    for (input of _inputs) {
        let quesID = input.name;
        let trueAnswer = input.value;
        let _selected = document.querySelector(`label[for=${input.id}]`);

        if (trueAnswer == solutions[quesID]) {
            _selected.style = "background-color: gray;";
            const div = document.createElement("div");
            div.classList.add("message-res");
            div.textContent = "Correct answer";
            _selected.insertAdjacentElement("afterend", div);
        }
        input.disabled = true;
    }

    // Display mark
    const finalInTen = `${data.score}/10`;
    const finalInPercentage = `${(data.score / 10) * 100}%`;
    _scoreIn10.textContent = finalInTen;
    _score_percentage.textContent = finalInPercentage;

    _msg.textContent = data.scoreText;

    for (input of checkedInputs) {
        let selectedIndex = input.value;
        let quesId = input.name;
        let _selected = document.querySelector(`label[for=${input.id}]`);

        if (selectedIndex == data.correctAnswers[quesId]) {
            _selected.style = "background-color: #d4edda;";
        } else {
            _selected.style = "background-color: #f8d7da;";
            const div = document.createElement("div");
            div.classList.add("message-res");
            div.textContent = "Your answer";
            _selected.insertAdjacentElement("afterend", div);
        }
    }
};

const onTryAgain = () => {
    _header.scrollIntoView();

    _optionElement.innerHTML = "";
    _score_percentage.innerHTML = "";
    _scoreIn10.innerHTML = "";
    _msg.innerHTML = "";

    // remove, add hidden class
    _submitBtn.classList.remove("hidden");
    _introduction.classList.remove("hidden");
    _quizSection.classList.add("hidden");
    _resultSection.classList.add("hidden");
    _submitBlock.classList.remove("hidden");

    //create new event
    const _startBtn1 = document.querySelector("#btn-start");
    _startBtn1.addEventListener("click", quizGenerator);
    const _submitBtn1 = document.querySelector("#btn-submit");
    _submitBtn1.addEventListener("click", onSubmitQuiz);
};

const _startBtn = document.querySelector("#btn-start");
const _redoBtn = document.querySelector("#btn-try-attempt");
const _submitBtn = document.querySelector("#btn-submit");
_startBtn.addEventListener("click", quizGenerator);
_submitBtn.addEventListener("click", onSubmitQuiz);
_redoBtn.addEventListener("click", onTryAgain);