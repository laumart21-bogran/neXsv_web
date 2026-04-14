document.write(`

<header style="
  background:white;
  padding:12px 40px;
  display:flex;
  justify-content:space-between;
  align-items:center;
  box-shadow:0 2px 10px rgba(0,0,0,0.05);
">

  <img src="logo.png" style="height:60px;">

  <nav style="display:flex; align-items:center;">

    <a href="index.html" style="margin-left:20px; color:#2f4ea2; text-decoration:none;">Inicio</a>
    <a href="como.html" style="margin-left:20px; color:#2f4ea2; text-decoration:none;">Cómo funciona</a>
    <a href="beneficios.html" style="margin-left:20px; color:#2f4ea2; text-decoration:none;">Beneficios</a>
    <a href="negocios.html" style="margin-left:20px; color:#2f4ea2; text-decoration:none;">Negocios</a>
    <a href="blog.html" style="margin-left:20px; color:#2f4ea2; text-decoration:none;">Blog</a>

    <a href="https://docs.google.com/forms/d/e/1FAIpQLSeDIKEEkzAxlmfRmTNLVBQoiiNxrbpbRcqk3C3iL73QCDMhyw/viewform"
       target="_blank"
       style="
        margin-left:25px;
        background:#2e8c59;
        color:white;
        padding:12px 20px;
        border-radius:10px;
        text-decoration:none;
        font-weight:bold;
        box-shadow:0 6px 15px rgba(46,140,89,0.4);
        transition:0.3s;
       "
       onmouseover="this.style.background='#1f6d45'"
       onmouseout="this.style.background='#2e8c59'"
    >
      Solicitar acceso →
    </a>

  </nav>

</header>

`);
