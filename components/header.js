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

padding:14px 28px;

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
height:56px;
display:block;
}

/* ========================================
NAV
======================================== */

.nex-nav{
display:flex;
align-items:center;
gap:22px;
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
#4CAF50,
#43a047
);

color:white !important;

padding:12px 22px;

border-radius:14px;

text-decoration:none;
font-weight:700;

box-shadow:
0 8px 20px rgba(76,175,80,.25);

transition:.3s;
}

.nex-btn:hover{
transform:translateY(-2px);
}

/* ========================================
MENU MOBILE BUTTON
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
padding:14px 20px;
}

.menu-toggle{
display:block;
z-index:10001;
}

.nex-nav{
position:fixed;

top:0;
right:-100%;

width:280px;
height:100vh;

background:white;

flex-direction:column;
align-items:flex-start;
justify-content:flex-start;

padding:
100px 30px
40px;

gap:24px;

transition:.4s ease;

box-shadow:
-10px 0 30px rgba(0,0,0,.08);

z-index:10000;
}

.nex-nav.active{
right:0;
}

.nex-nav a{
font-size:17px;
margin:0;
}

.nex-btn{
width:100%;
text-align:center;
padding:15px 20px;
}

}

/* ========================================
MOBILE SMALL
======================================== */

@media(max-width:480px){

.nex-header{
padding:12px 16px;
}

.nex-logo img{
height:48px;
}

.nex-nav{
width:100%;
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

    <a href="index.html">Inicio</a>

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
      class="nex-btn"
    >
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
