const botonCuenta = `
<a href="acceso/index.html" id="nexHeaderAuthBtn" class="nex-btn">
    <i class="fa-regular fa-user"></i> Acceder →
</a>
`;

document.write(`

<style>
.nex-header,.nex-header *{box-sizing:border-box}
.nex-header{position:fixed;top:0;left:0;width:100%;height:72px;display:flex;justify-content:space-between;align-items:center;padding:0 18px;background:rgba(255,255,255,.88);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid rgba(255,255,255,.5);z-index:999999;box-shadow:0 4px 20px rgba(0,0,0,.04)}
.nex-logo{display:flex;align-items:center;text-decoration:none}.nex-logo img{height:50px;display:block;object-fit:contain}
.nex-nav{display:flex;align-items:center;gap:24px}.nex-nav a{text-decoration:none;font-family:'Montserrat',sans-serif;font-size:15px;font-weight:600;color:#2f4ea2;transition:.3s}.nex-nav a:hover{opacity:.75}.nex-search-link{display:inline-flex;align-items:center;gap:6px}.nex-search-link i{font-size:13px}.nex-search-link{display:inline-flex;align-items:center;gap:6px}.nex-search-link i{font-size:13px}
.nex-btn{background:linear-gradient(135deg,#F7C531,#ffcf33);color:white!important;padding:11px 18px;border-radius:14px;font-size:14px;font-weight:700;box-shadow:0 8px 20px rgba(247,197,49,.25);transition:.3s}.nex-btn:hover{transform:translateY(-2px)}
.menu-toggle{display:none;background:none;border:none;font-size:24px;cursor:pointer;color:#2f4ea2}
@media(max-width:950px){.menu-toggle{display:block}.nex-nav{position:fixed;top:64px;right:-100%;width:min(280px,calc(100vw - 24px));display:flex;flex-direction:column;align-items:flex-start;padding:16px;gap:12px;background:white;border-radius:0 0 0 20px;box-shadow:-10px 0 30px rgba(0,0,0,.08);transition:.35s ease;z-index:999998}.nex-nav.active{right:0}.nex-nav a{font-size:14px}.nex-btn{width:100%;text-align:center;padding:12px;font-size:13px}}
body{padding-top:64px!important}
</style>

<header class="nex-header">
<a href="index.html" class="nex-logo"><img src="logo.png" alt="NeXsv"></a>
<button class="menu-toggle" onclick="toggleMenu()">☰</button>
<nav class="nex-nav" id="mobileMenu">
<a href="index.html">Inicio</a><a href="como.html">Cómo funciona</a><a href="beneficios.html">Beneficios</a><a href="negocios.html">Negocios</a><a href="buscar.html" class="nex-search-link" aria-label="Buscar en neXsv" title="Buscar en neXsv"><i class="fa-solid fa-magnifying-glass"></i><span>Buscar</span></a><a href="buscar.html" class="nex-search-link" aria-label="Buscar en neXsv" title="Buscar en neXsv"><i class="fa-solid fa-magnifying-glass"></i><span>Buscar</span></a><a href="blog.html">Blog</a>
${botonCuenta}
</nav>
</header>

<script>
function toggleMenu(){document.getElementById("mobileMenu").classList.toggle("active");}
</script>

`);
 
const authScript = document.createElement("script");
authScript.type = "module";
authScript.textContent = `
(async () => {
    try {
        const { default: AuthSession } = await import("./js/auth/auth.session.js");
        if (!AuthSession.isInitialized()) await AuthSession.initialize();

        const syncHeader = (session) => {
            const button = document.getElementById("nexHeaderAuthBtn");
            if (!button) return;

            if (session?.user) {
                button.href = "dashboard.html";
                button.innerHTML = '<i class="fa-regular fa-circle-user"></i> Mi espacio';
            } else {
                button.href = "acceso/index.html";
                button.innerHTML = '<i class="fa-regular fa-user"></i> Acceder →';
            }
        };

        syncHeader(AuthSession.getSession());

        const { supabase } = await import("./js/core/supabase-client.js");
        supabase.auth.onAuthStateChange((_event, session) => syncHeader(session));
    } catch (error) {
        console.warn("No se pudo sincronizar el estado de sesión del header:", error);
    }
})();
`;

document.head.appendChild(authScript);
