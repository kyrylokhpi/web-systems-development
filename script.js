document.addEventListener("DOMContentLoaded", function () {
    var form = document.querySelector(".registration-form");

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        clearErrors();

        var firstName = document.getElementById("first-name");
        var lastName = document.getElementById("last-name");
        var email = document.getElementById("email");
        var password = document.getElementById("password");

        var isValid = true;

        if (firstName.value.trim() === "") {
            showError(firstName, "first-name-error", "Введіть ім'я");
            isValid = false;
        } else {
            markValid(firstName);
        }

        if (lastName.value.trim() === "") {
            showError(lastName, "last-name-error", "Введіть прізвище");
            isValid = false;
        } else {
            markValid(lastName);
        }

        if (email.value.trim() === "") {
            showError(email, "email-error", "Введіть електронну пошту");
            isValid = false;
        } else if (!isValidEmail(email.value.trim())) {
            showError(email, "email-error", "Некоректний формат пошти");
            isValid = false;
        } else {
            markValid(email);
        }

        if (password.value === "") {
            showError(password, "password-error", "Введіть пароль");
            isValid = false;
        } else if (password.value.length < 8) {
            showError(password, "password-error", "Пароль має містити щонайменше 8 символів");
            isValid = false;
        } else {
            markValid(password);
        }

        if (isValid) {
            alert("Реєстрація успішна!");
            form.reset();
            clearState();
        }
    });

    function showError(input, errorId, message) {
        input.classList.add("input-error");
        document.getElementById(errorId).textContent = message;
    }

    function markValid(input) {
        input.classList.add("input-valid");
    }

    function clearErrors() {
        var errorMessages = document.querySelectorAll(".error-message");
        errorMessages.forEach(function (el) {
            el.textContent = "";
        });

        var inputs = form.querySelectorAll("input");
        inputs.forEach(function (input) {
            input.classList.remove("input-error");
            input.classList.remove("input-valid");
        });
    }

    function clearState() {
        var inputs = form.querySelectorAll("input");
        inputs.forEach(function (input) {
            input.classList.remove("input-valid");
        });
    }

    function isValidEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }
});
