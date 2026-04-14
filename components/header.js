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
        background:#4CAF50;
        color:white;
        padding:12px 20px;
        border-radius:10px;
        text-decoration:none;
        font-weight:bold;
        box-shadow:0 4px 10px rgba(76,175,80,0.3);
        transition:0.3s;
       "
       onmouseover="this.style.background='#43a047'; this.style.transform='translateY(-2px)'"
       onmouseout="this.style.background='#4CAF50'; this.style.transform='translateY(0)'"
    >
      Solicitar acceso →
    </a>

  </nav>

</header>

`);
