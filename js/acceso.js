/*=========================================
neXsv
Sistema de Acceso
=========================================*/

document.addEventListener("DOMContentLoaded",()=>{

    initPasswordToggle();
    
    initLogin();

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

/*=========================================
Login
=========================================*/

function initLogin(){

    const form = document.getElementById("loginForm");

    if(!form) return;

    form.addEventListener("submit", async (e)=>{

        e.preventDefault();

        const correo =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;

        const message =
            document.getElementById("loginMessage");

        message.innerHTML = "";

        try{

            const response = await fetch(
                "https://script.google.com/macros/s/AKfycbzRyJ7TCcemV_5Sx8HjX7dkbXn3lHmS2EMuXB2-OlX3GsW8NpnGab69ErCOjVr3qK_5/exec",
                {
                    method:"POST",

                    headers:{
                        "Content-Type":"application/json"
                    },

                    body:JSON.stringify({

                        correo:correo,

                        password:password

                    })

                }
            );

            const data = await response.json();

            if(data.success){

                message.style.color="#1B8A3B";

                message.innerHTML="✅ Bienvenido.";

                console.log(data.user);

            }else{

                message.style.color="#D32F2F";

                message.innerHTML=data.message;

            }

        }

        catch(error){

            console.error(error);

            message.style.color="#D32F2F";

            message.innerHTML="No fue posible conectar con el servidor.";

        }

    });

}
