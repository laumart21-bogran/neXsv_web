document.write(`

<style>

/* ========================================
HEADER PREMIUM RESPONSIVE
======================================== */

.nex-header{
position:fixed;
top:0;
left:0;
width:100%;

display:flex;
justify-content:space-between;
align-items:center;

padding:12px 22px;

background:rgba(255,255,255,.88);

backdrop-filter:blur(14px);
-webkit-backdrop-filter:blur(14px);

border-bottom:1px solid rgba(255,255,255,.5);

z-index:9999;

box-shadow:
0 4px 20px rgba(0,0,0,.04);
}

/* ========================================
LOGO
======================================== */

.nex-logo img{
height:50px;
display:block;
}

/* ========================================
NAV DESKTOP
======================================== */

.nex-nav{
display:flex;
align-items:center;
gap:18px;
}

.nex-nav a{
color:#2f4ea2;
text-decoration:none;
font-weight:600;
font-size:15px;
transition:.3s;
white-space:nowrap;
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

text-decoration:none;
font-weight:700;

box-shadow:
0 8px 20px rgba(247,197,49,.25);

transition:.3s;
}

.nex-btn:hover{
transform:translateY(-2px);
}

/* ========================================
BOTÓN MOBILE
======================================== */

.menu-toggle{
display:none;

font-size:30px;
background:none;
border:none;

cursor:pointer;

color:#2f4ea2;
}

/* ========================================
RESPONSIVE
======================================== */

@media(max-width:950px){

.nex-header{
padding:12px 18px;
}

.nex-logo img{
height:44px;
}

.menu-toggle{
display:block;
z-index:10001;
}

/* MENU MOBILE */

.nex-nav{
position:fixed;

top:72px;
right:-100%;

width:260px;
height:auto;

background:white;

flex-direction:column;
align-items:flex-start;

padding:24px;

gap:18px;

transition:.35s ease;

box-shadow:
-10px 0 30px rgba(0,0,0,.08);

border-radius:
0 0 0 24px;

z-index:10000;
}

.nex-nav.active{
right:0;
}

.nex-nav a{
font-size:16px;
margin:0;
}

.nex-btn{
width:100%;
text-align:center;
padding:14px 18px;
margin-top:5px;
}

}

/* ========================================
MOBILE SMALL
======================================== */

@media(max-width:480px){

.nex-header{
padding:10px 16px;
}

.nex-logo img{
height:40px;
}

.menu-toggle{
font-size:28px;
}

.nex-nav{
width:240px;
top:68px;
padding:22px;
gap:16px;
}

.nex-nav a{
font-size:15px;
}

.nex-btn{
font-size:15px;
padding:13px 16px;
}

}

</style>

<header class="nex-header">

<!-- LOGO -->

<a href="index.html" class="nex-logo">
<img src="logo.png" alt="NeXsv">
</a>

<!-- BOTÓN MOBILE -->

<button class="menu-toggle" onclick="toggleMenu()">
☰
</button>

<!-- NAV -->

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

<a
href="https://docs.google.com/forms/d/e/1FAIpQLSeDIKEEkzAxlmfRmTNLVBQoiiNxrbpbRcqk3C3iL73QCDMhyw/viewform"
target="_blank"
class="nex-btn">

Solicitar acceso →

</a>

</nav>

</header>

<script>

function toggleMenu(){

document
.getElementById("mobileMenu")
.classList
.toggle("active");

}

</script>

`);
