const usuario = getCurrentUser();

console.log("USUARIO HEADER:", usuario);

document.write(`

<style>

/* ========================================
RESET AISLADO HEADER
======================================== */

.nex-header,
.nex-header *{
box-sizing:border-box;
}

/* ========================================
HEADER FIJO GLOBAL
======================================== */

.nex-header{

position:fixed;
top:0;
left:0;

width:100%;
height:72px;

display:flex;
justify-content:space-between;
align-items:center;

padding:0 18px;

background:rgba(255,255,255,.88);

backdrop-filter:blur(14px);
-webkit-backdrop-filter:blur(14px);

border-bottom:1px solid rgba(255,255,255,.5);

z-index:999999;

box-shadow:
0 4px 20px rgba(0,0,0,.04);

}

/* ========================================
LOGO
======================================== */

.nex-logo{
display:flex;
align-items:center;
text-decoration:none;
}

.nex-logo img{
height:50px;
display:block;
object-fit:contain;
}

/* ========================================
NAV DESKTOP
======================================== */

.nex-nav{
display:flex;
align-items:center;
gap:24px;
}

.nex-nav a{

text-decoration:none;

font-family:'Inter',sans-serif;

font-size:15px;
font-weight:600;

color:#2f4ea2;

transition:.3s;
}

.nex-nav a:hover{
opacity:.75;
}

/* ========================================
BOTÓN
======================================== */

.nex-btn{

background:linear-gradient(
135deg,
#F7C531,
#ffcf33
);

color:white !important;

padding:11px 18px;

border-radius:14px;

font-size:14px;
font-weight:700;

box-shadow:
0 8px 20px rgba(247,197,49,.25);

transition:.3s;
}

.nex-btn:hover{
transform:translateY(-2px);
}

/* ========================================
BOTÓN MENU
======================================== */

.menu-toggle{

display:none;

background:none;
border:none;

font-size:24px;

cursor:pointer;

color:#2f4ea2;
}

/* ========================================
MOBILE
======================================== */

@media(max-width:950px){

.menu-toggle{
display:block;
}

.nex-nav{

position:fixed;

top:72px;
right:-100%;

width:180px;

display:flex;
flex-direction:column;
align-items:flex-start;

padding:20px;

gap:14px;

background:white;

border-radius:
0 0 0 20px;

box-shadow:
-10px 0 30px rgba(0,0,0,.08);

transition:.35s ease;

z-index:999998;
}

.nex-nav.active{
right:0;
}

.nex-nav a{
font-size:14px;
}

.nex-btn{
width:100%;
text-align:center;
padding:12px;
font-size:13px;
}

}

/* ========================================
BODY OFFSET GLOBAL
======================================== */

body{
padding-top:72px !important;
}

</style>

<header class="nex-header">

<a href="index.html" class="nex-logo">

<img src="logo.png" alt="NeXsv">

</a>

<button
class="menu-toggle"
onclick="toggleMenu()">

☰

</button>

<nav class="nex-nav" id="mobileMenu">

<a href="index.html">
Inicio
</a>

<a href="como.html">
Cómo funciona
</a>

<a href="beneficios.html">
Beneficios
</a>

<a href="negocios.html">
Negocios
</a>

<a href="blog.html">
Blog
</a>

${usuario ? `
<a
    id="memberButton"
    href="#"
    class="nex-btn">

    👋 ${usuario.nombre.split(" ")[0]}

</a>
` : `
<a
    id="memberButton"
    href="acceso/index.html"
    class="nex-btn">

    <i class="fa-regular fa-user"></i>

    <span id="memberButtonText">
        Acceder →
    </span>

</a>
`}

</nav>

</header>

<script>

function toggleMenu(){

document
.getElementById("mobileMenu")
.classList
.toggle("active");

}

document.addEventListener("DOMContentLoaded",()=>{

    const button =
        document.getElementById("memberButton");

    const text =
        document.getElementById("memberButtonText");

    if(typeof isLogged === "function" && isLogged()){

        button.href="perfil.html";

        text.textContent="Mi cuenta";

    }

});

</script>

`);
