/*=========================================
neXsv
Perfil del Miembro
=========================================*/

/*=========================================
Cloudinary
=========================================*/

const CLOUD_NAME = "dnub0aq2j";
const UPLOAD_PRESET = "nexsv-profile";

document.addEventListener("DOMContentLoaded", () => {

    if (!isLogged()) {

        window.location.href = "acceso/login-usuario.html";
        return;

    }

    const usuario = getCurrentUser();

    /*=========================================
    Elementos
    =========================================*/

    const topUserName = document.getElementById("topUserName");
    const topUserRole = document.getElementById("topUserRole");

    const memberName = document.getElementById("memberName");
    const memberEmail = document.getElementById("memberEmail");

    const nombre = document.getElementById("nombre");
    const correo = document.getElementById("correo");
    const telefono = document.getElementById("telefono");
    const ciudad = document.getElementById("ciudad");
    const colegio = document.getElementById("colegio");

    const profileForm = document.getElementById("profileForm");

    const imageInput = document.getElementById("profileImage");
    const preview = document.getElementById("profilePreview");
    const initials = document.getElementById("profileInitials");
    const changePhotoBtn = document.getElementById("changePhotoBtn");
    const topAvatarImage = document.getElementById("topAvatarImage");
const topAvatarInitials = document.getElementById("topAvatarInitials");

const sidebarAvatarImage = document.getElementById("sidebarAvatarImage");
const sidebarAvatarInitials = document.getElementById("sidebarAvatarInitials");

    /*=========================================
    Header
    =========================================*/

    if (topUserName)
        topUserName.textContent = usuario.nombre || "Miembro";

    if (topUserRole)
        topUserRole.textContent = usuario.rol || "Miembro";

    /*=========================================
    Sidebar
    =========================================*/

    if (memberName)
        memberName.textContent = usuario.nombre || "";

    if (memberEmail)
        memberEmail.textContent = usuario.correo || usuario.email || "";

    /*=========================================
    Formulario
    =========================================*/

    nombre.value = usuario.nombre || "";
    correo.value = usuario.correo || usuario.email || "";
    telefono.value = usuario.telefono || "";
    ciudad.value = usuario.ciudad || "";
    colegio.value = usuario.colegio || "";

    /*=========================================
    Foto Inicial
    =========================================*/

    if (usuario.foto) {

        preview.src = usuario.foto;
        preview.style.display = "block";
        initials.style.display = "none";

    } else {

        const partes = (usuario.nombre || "").trim().split(" ");

        let texto = "";

        if (partes.length > 0 && partes[0].length)
            texto += partes[0][0];

        if (partes.length > 1 && partes[1].length)
            texto += partes[1][0];

        initials.textContent = texto.toUpperCase();

    }

    /*=========================================
    Cambiar Foto
    =========================================*/

    changePhotoBtn.addEventListener("click", () => {

        imageInput.click();

    });

    /*=========================================
Sincronizar avatares
=========================================*/

if (usuario.foto) {

    if (topAvatarImage) {
        topAvatarImage.src = usuario.foto;
        topAvatarImage.style.display = "block";
    }

    if (topAvatarInitials) {
        topAvatarInitials.style.display = "none";
    }

    if (sidebarAvatarImage) {
        sidebarAvatarImage.src = usuario.foto;
        sidebarAvatarImage.style.display = "block";
    }

    if (sidebarAvatarInitials) {
        sidebarAvatarInitials.style.display = "none";
    }

}

    imageInput.addEventListener("change", async () => {

        const file = imageInput.files[0];

        if (!file) return;

        const tiposPermitidos = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!tiposPermitidos.includes(file.type)) {

            alert("Solo se permiten imágenes JPG, PNG o WEBP.");
            return;

        }

        if (file.size > 5 * 1024 * 1024) {

            alert("La imagen supera los 5 MB permitidos.");
            return;

        }

        /* Vista previa inmediata */

        preview.src = URL.createObjectURL(file);
        preview.style.display = "block";
        initials.style.display = "none";

        changePhotoBtn.disabled = true;
        changePhotoBtn.innerHTML = "Subiendo fotografía...";

        try {

            const photoUrl = await uploadPhoto(file);

            usuario.foto = photoUrl;

            login(usuario);

            changePhotoBtn.innerHTML =
                '<i class="fa-solid fa-circle-check"></i> Fotografía actualizada';

        } catch (error) {

            console.error(error);

            alert("No fue posible subir la fotografía.");

            preview.style.display = "none";
            initials.style.display = "flex";

            changePhotoBtn.innerHTML =
                '<i class="fa-solid fa-camera"></i> Cambiar fotografía';

        }

        changePhotoBtn.disabled = false;

    });

    /*=========================================
    Guardar Perfil
    =========================================*/

  profileForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const submitButton = profileForm.querySelector("button[type='submit']");
submitButton.disabled = true;
submitButton.textContent = "Guardando...";
      
    usuario.nombre = nombre.value.trim();
    usuario.telefono = telefono.value.trim();
    usuario.ciudad = ciudad.value.trim();
    usuario.colegio = colegio.value.trim();

    try {

        const response = await fetch("https://ne-xsv-api.vercel.app/api/profile", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                id: usuario.id,
                nombre: usuario.nombre,
                foto: usuario.foto,
                telefono: usuario.telefono,
                ciudad: usuario.ciudad,
                colegio: usuario.colegio

            })

        });

        const data = await response.json();

        if (!data.success) {

    submitButton.disabled = false;
    submitButton.textContent = "Guardar cambios";

    alert(data.message || "No fue posible actualizar el perfil.");
    return;

}
       login(usuario);

submitButton.disabled = false;
submitButton.textContent = "Guardar cambios";

alert("Perfil actualizado correctamente.");

    }

    catch (error) {

        console.error(error);

        submitButton.disabled = false;
submitButton.textContent = "Guardar cambios";

        alert("Ocurrió un error al actualizar el perfil.");

    }

});

});

/*=========================================
Subir Fotografía a Cloudinary
=========================================*/

async function uploadPhoto(file){

    const formData = new FormData();

    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    const response = await fetch(

        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,

        {

            method: "POST",
            body: formData

        }

    );

    const data = await response.json();

    if (!response.ok) {

        console.error(data);

        throw new Error(data.error?.message || "Error al subir imagen.");

    }

    return data.secure_url;

}
