import AuthService from "../auth/auth.service.js";
import BusinessService from "../services/business.service.js";

const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");

const togglePassword =
    document.getElementById("togglePassword");

const togglePasswordIcon =
    document.getElementById("togglePasswordIcon");


function showMessage(message, type = "error") {

    loginMessage.textContent = message;
    loginMessage.className = type;

}


function clearMessage() {

    loginMessage.textContent = "";
    loginMessage.className = "";

}


function setLoading(isLoading) {

    loginButton.disabled = isLoading;

    loginButton.textContent = isLoading
        ? "Ingresando..."
        : "Entrar";

}


if (togglePassword) {

    togglePassword.addEventListener("click", () => {

        const isPassword =
            passwordInput.type === "password";

        passwordInput.type =
            isPassword ? "text" : "password";

        if (togglePasswordIcon) {

            togglePasswordIcon.className =
                isPassword
                    ? "fa-regular fa-eye-slash"
                    : "fa-regular fa-eye";

        }

    });

}


form.addEventListener("submit", async (event) => {

    event.preventDefault();

    clearMessage();

    const email =
        emailInput.value.trim();

    const password =
        passwordInput.value;


    if (!email || !password) {

        showMessage(
            "Completa todos los campos."
        );

        return;

    }


    try {

        setLoading(true);


        const { error } =
            await AuthService.signIn(
                email,
                password
            );


        if (error) {

            switch (error.message) {

                case "Invalid login credentials":

                    showMessage(
                        "Correo o contraseña incorrectos."
                    );

                    break;


                case "Email not confirmed":

                    showMessage(
                        "Debes confirmar tu correo antes de ingresar."
                    );

                    break;


                default:

                    showMessage(
                        error.message
                    );

            }

            return;

        }


        showMessage(
            "Inicio de sesión exitoso.",
            "success"
        );


        const { data: businesses } = await BusinessService.getBusinessesByOwner((await import("../core/supabase-client.js")).supabase.auth.getUser().then(result => result.data.user?.id));
        const selectedBusiness = businesses?.find(business => business.id === sessionStorage.getItem("nexsv_selected_business_id")) || businesses?.[0];
        if (selectedBusiness) {
            sessionStorage.setItem("nexsv_selected_business_id", selectedBusiness.id);
            window.location.href = "../negocio.html?id=" + encodeURIComponent(selectedBusiness.id) + "&preview=owner";
        } else {
            window.location.href = "../dashboard-negocio.html";
        }


    } catch (error) {

        console.error(
            "Error en login de negocio:",
            error
        );


        showMessage(
            "Ocurrió un error inesperado."
        );


    } finally {

        setLoading(false);

    }

});
