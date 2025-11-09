const sendBtn = document.getElementById("send");
const partiBtn = document.getElementById("participate");
const student_number = document.getElementById("student-number");
const classcode = document.getElementById("classcode");
const errorElement = document.getElementById("error");

let code = -1;

partiBtn.addEventListener("click", (e) => {
    if (classcode.value == "" || code != -1) {
        return false;
    }
    classcode.disabled = true;
    fetch(`/classroom/${classcode.value}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then((res) => {
            if (!res.ok) {
                (errorElement.innerHTML = res.status), res.statusText;
                classcode.disabled = false;
                throw new Error(res.statusText);
            }

            return res.json();
        })
        .then((data) => {
            if (data.error) {
                errorElement.innerHTML = data.error;
                console.log(data.error);
                classcode.disabled = false;
                return;
            } else {
                console.log(data.result);
                code = classcode.value;
                nextStep();
            }
        });
});

sendBtn.addEventListener("click", (e) => {
    if (!(student_number.value >= 1) || code === -1 || e.isTrusted === false) {
        return false;
    }
    fetch(`/classroom/${code}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ student_number: student_number.value }),
    })
        .then((res) => {
            if (!res.ok) {
                (errorElement.innerHTML = res.status), res.statusText;
                throw new Error(res.statusText);
            }
            return res.json();
        })
        .then((data) => {
            if (data.error) {
                errorElement.innerHTML = data.error;
                console.log(data.error);
                return;
            } else {
                showSeat(data.message, data.index);
            }
        });
});

const codeDiv = document.getElementById("code-input");
const numberDiv = document.getElementById("number-input");
const showDiv = document.getElementById("show");
const resultNum = document.getElementById("result");

function nextStep() {
    errorElement.innerHTML = "";
    codeDiv.style.opacity = 0;
    setTimeout(() => {
        codeDiv.style.display = "none";
        numberDiv.style.display = "";
        numberDiv.style.opacity = 1;
    }, 300);
}

function showSeat(n, i) {
    resultNum.innerHTML = n;
    numberDiv.style.opacity = 0;
    setTimeout(() => {
        numberDiv.style.display = "none";
        showDiv.style.display = "";
        showDiv.style.opacity = 1;
        resultNum.style.scale = 0.0;
        setTimeout(() => {
            resultNum.style.scale = 1.2;
            setTimeout(() => {
                resultNum.style.scale = 1;
            }, 200);
        }, 200);
    }, 300);
}

document.getElementsByClassName("title")[0].addEventListener("click", ()=>{
    location.href = "/"
})