/*=========================================
neXsv
Sistema de Acceso
=========================================*/

document.addEventListener("DOMContentLoaded",()=>{

    initPasswordToggle();

});

/*=========================================
Mostrar / Ocultar contraseña
=========================================*/

function initPasswordToggle(){

    const passwordInput=document.getElementById("password");

    const togglePassword=document.getElementById("togglePassword");

    const toggleIcon=document.getElementById("togglePasswordIcon");

    if(!passwordInput || !togglePassword){

        return;

    }

    togglePassword.addEventListener("click",()=>{

        const visible=passwordInput.type==="text";

        passwordInput.type=visible ? "password" : "text";

        toggleIcon.className=visible

            ? "fa-regular fa-eye"

            : "fa-regular fa-eye-slash";

    });

}
