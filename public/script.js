const teacher = document.getElementById("teacher")
const student = document.getElementById("student")

teacher.addEventListener("click", (e) => {
    location.href = "./admin"
})

student.addEventListener("click", (e) => {
    location.href = "./user"
})