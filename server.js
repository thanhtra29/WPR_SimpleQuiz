const mongoose = require("mongoose");
const express = require("express");
const app = express();

const Question = require("./models/Questions");
const Attempt = require("./models/Attempts");

// serve static files (html, css, js, images...)
app.use(express.static("public"));
// decode req.body from post body message
app.use(express.json({ extented: true }));
//connect to the database
mongoose
    .connect(`mongodb://localhost:27017/`, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false,
    })
    .then(() => {
        const PORT = 9000;
        app.listen(PORT, () => {
            console.log(`Server is listening on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.log(err.message);
    });

app.post("/attempts", async(req, res) => {
    const { completed, score } = req.body;
    const questions = await Question.aggregate([{ $sample: { size: 10 } }]);
    try {
        let correctAnswers = {};
        questions.map((question) => {
            correctAnswers[question._id] = question.correctAnswers;
        });
        const newAttempt = new Attempt({
            questions,
            completed,
            score,
            correctAnswers,
        });
        const attempt = await newAttempt.save();

        const removed = ["correctAnswers"];
        let result = [];
        attempt.correctAnswers = {};
        attempt.questions.map((question) => {
            let newQuestionObject = Object.keys(question)
                .filter((key) => !removed.includes(key))
                .reduce((acc, key) => ((acc[key] = question[key]), acc), {});
            result.push(newQuestionObject);
        });
        attempt.questions = result;
        res.json(attempt);
    } catch (err) {
        console.log(err.message);
    }
});

app.post("/attempts/:id/submit", async(req, res) => {
    const attempt = await Attempt.findById(req.params.id);
    const { answers } = req.body;
    const { questions, correctAnswers } = attempt;
    try {
        //calculate the score, completed
        let completed = true;
        let score = 0;
        let scoreText = "";
        for (let i = 0; i < questions.length; ++i) {
            let id = questions[i]._id;
            if (id in answers && correctAnswers[id] == answers[id]) {
                score += 1;
            }
        }

        if (score <= 6) {
            scoreText = "Practice more to improve it :D";
        } else if (score > 6 && score <= 8) {
            scoreText = "Well done!";
        } else {
            scoreText = "Excellent!";
        }

        const submitted_Attempt = new Attempt({
            questions,
            score: score,
            completed: completed,
            correctAnswers,
            answers,
            scoreText: scoreText,
        });
        const response = await submitted_Attempt.save();

        await Attempt.findByIdAndDelete(attempt._id);
        res.json(response);
    } catch (err) {
        console.log(err.message);
    }
});

app.get("/attempts/:id", async(req, res) => {
    try {
        const attempt = await Attempt.findById(req.params.id);
        res.json(attempt);
    } catch (err) {
        console.log(err.message);
    }
});

app.patch("/attempts/:id", async(req, res) => {});

app.post("/api/question", async(req, res) => {
    const { text, answers, correctAnswers } = req.body;
    try {
        const newQuestion = new Question({
            text,
            answers,
            correctAnswers,
        });
        const question = await newQuestion.save();
        res.json(question);
    } catch (err) {
        console.log(err.message);
    }
});