document.addEventListener("DOMContentLoaded", function () {
    var form = document.querySelector(".registration-form");
    var submitBtn = document.getElementById("submit-btn");
    var cancelBtn = document.getElementById("cancel-btn");
    var formTitle = document.getElementById("form-title");
    var formSubtitle = document.getElementById("form-subtitle");
    var searchInput = document.getElementById("search");
    var tbody = document.getElementById("users-tbody");
    var noUsers = document.getElementById("no-users");

    var editingId = null;

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

        if (!editingId) {
            if (password.value === "") {
                showError(password, "password-error", "Введіть пароль");
                isValid = false;
            } else if (password.value.length < 8) {
                showError(password, "password-error", "Пароль має містити щонайменше 8 символів");
                isValid = false;
            } else {
                markValid(password);
            }
        } else {
            if (password.value !== "" && password.value.length < 8) {
                showError(password, "password-error", "Пароль має містити щонайменше 8 символів");
                isValid = false;
            } else if (password.value.length >= 8) {
                markValid(password);
            }
        }

        if (isValid) {
            var data = {
                firstName: firstName.value.trim(),
                lastName: lastName.value.trim(),
                email: email.value.trim(),
                password: password.value
            };

            if (editingId) {
                updateUser(editingId, data);
            } else {
                createUser(data);
            }
        }
    });

    function createUser(data) {
        fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        })
        .then(function (res) { return res.json().then(function (body) { return { ok: res.ok, body: body }; }); })
        .then(function (result) {
            if (!result.ok) {
                alert(result.body.error);
                return;
            }
            form.reset();
            clearState();
            loadUsers();
        });
    }

    function updateUser(id, data) {
        fetch("/api/users/" + id, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        })
        .then(function (res) { return res.json().then(function (body) { return { ok: res.ok, body: body }; }); })
        .then(function (result) {
            if (!result.ok) {
                alert(result.body.error);
                return;
            }
            cancelEdit();
            loadUsers();
        });
    }

    function deleteUser(id) {
        if (!confirm("Видалити користувача?")) return;
        fetch("/api/users/" + id, { method: "DELETE" })
        .then(function () {
            if (editingId === id) cancelEdit();
            loadUsers();
        });
    }

    function loadUsers(search) {
        var url = "/api/users";
        if (search) url += "?search=" + encodeURIComponent(search);
        fetch(url)
        .then(function (res) { return res.json(); })
        .then(function (users) { renderUsers(users); });
    }

    function renderUsers(users) {
        tbody.innerHTML = "";

        if (users.length === 0) {
            noUsers.style.display = "block";
            return;
        }

        noUsers.style.display = "none";

        users.forEach(function (user) {
            var tr = document.createElement("tr");

            var tdId = document.createElement("td");
            tdId.textContent = user.id;

            var tdFirst = document.createElement("td");
            tdFirst.textContent = user.firstName;

            var tdLast = document.createElement("td");
            tdLast.textContent = user.lastName;

            var tdEmail = document.createElement("td");
            tdEmail.textContent = user.email;

            var tdActions = document.createElement("td");

            var editBtn = document.createElement("button");
            editBtn.textContent = "Редагувати";
            editBtn.className = "btn-edit";
            editBtn.addEventListener("click", function () { startEdit(user); });

            var delBtn = document.createElement("button");
            delBtn.textContent = "Видалити";
            delBtn.className = "btn-delete";
            delBtn.addEventListener("click", function () { deleteUser(user.id); });

            tdActions.appendChild(editBtn);
            tdActions.appendChild(delBtn);

            tr.appendChild(tdId);
            tr.appendChild(tdFirst);
            tr.appendChild(tdLast);
            tr.appendChild(tdEmail);
            tr.appendChild(tdActions);

            tbody.appendChild(tr);
        });
    }

    function startEdit(user) {
        editingId = user.id;
        document.getElementById("first-name").value = user.firstName;
        document.getElementById("last-name").value = user.lastName;
        document.getElementById("email").value = user.email;
        document.getElementById("password").value = "";
        document.getElementById("password").placeholder = "Залиште порожнім, щоб не змінювати";

        formTitle.textContent = "Редагувати";
        formSubtitle.textContent = "Зміна даних користувача #" + user.id;
        submitBtn.textContent = "Зберегти";
        cancelBtn.style.display = "block";

        clearErrors();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function cancelEdit() {
        editingId = null;
        form.reset();
        clearState();
        document.getElementById("password").placeholder = "Мінімум 8 символів";
        formTitle.textContent = "Створити акаунт";
        formSubtitle.textContent = "Заповніть форму для реєстрації";
        submitBtn.textContent = "Зареєструватися";
        cancelBtn.style.display = "none";
        clearErrors();
    }

    cancelBtn.addEventListener("click", cancelEdit);

    // Search with debounce
    var searchTimeout;
    searchInput.addEventListener("input", function () {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(function () {
            loadUsers(searchInput.value.trim());
        }, 300);
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

    // Clear error styling as user types
    form.querySelectorAll("input").forEach(function (input) {
        input.addEventListener("input", function () {
            input.classList.remove("input-error", "input-valid");
            var errorEl = document.getElementById(input.id + "-error");
            if (errorEl) errorEl.textContent = "";
        });
    });

    // Initial load
    loadUsers();
});
