/*=========================================
neXsv
Registro de Miembros
=========================================*/

document.addEventListener("DOMContentLoaded",()=>{

    const form=document.getElementById("loginForm");

    if(!form) return;

    form.addEventListener("submit",async(e)=>{

        e.preventDefault();

        const nombre=
            document.getElementById("fullName").value.trim();

        const correo=
            document.getElementById("email").value.trim();

        const password=
            document.getElementById("password").value;

        const confirmPassword=
            document.getElementById("confirmPassword").value;

        const message=
            document.getElementById("loginMessage");

        message.innerHTML="";

        if(password!==confirmPassword){

            message.innerHTML=
            "Las contraseñas no coinciden.";

            message.style.color="#D32F2F";

            return;

        }

        try{

            const response=
            await fetch("https://script.google.com/macros/s/AKfycbyG0WVu7rB3A7HTgEeZyAUXIM1yATouP57St49ZYcYTNi-D2JBU0cyCOSfSzMjaGrIr/exec",{

                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },

                body:JSON.stringify({

                    nombre:nombre,

                    correo:correo,

                    password:password

                })

            });

            const data=
            await response.json();

            if(data.success){

                message.style.color="#1B8A3B";

                message.innerHTML=
                "✅ Cuenta creada correctamente.";

                form.reset();

                setTimeout(()=>{

                    window.location.href="login-usuario.html";

                },2000);

            }else{

                message.style.color="#D32F2F";

                message.innerHTML=
                "Ocurrió un error al crear la cuenta.";

            }

        }catch(error){

            console.error(error);

            message.style.color="#D32F2F";

            message.innerHTML=
            "No fue posible conectar con el servidor.";

        }

    });

});
