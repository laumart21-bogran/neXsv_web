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
.nex-nav{display:flex;align-items:center;gap:24px}.nex-nav a{text-decoration:none;font-family:'Montserrat',sans-serif;font-size:15px;font-weight:600;color:#1657B8;transition:.3s}.nex-nav a:hover{opacity:.75}
.nex-btn{background:linear-gradient(135deg,#F7C531,#ffcf33);color:white!important;padding:11px 18px;border-radius:14px;font-size:14px;font-weight:700;box-shadow:0 8px 20px rgba(247,197,49,.25);transition:.3s}.nex-btn:hover{transform:translateY(-2px)}
.nex-header-main{display:flex;align-items:center;gap:28px;flex:1;min-width:0}.nex-header-search{position:relative;flex:1;max-width:390px;min-width:180px}.nex-header-search-wrap{display:flex;align-items:center;gap:9px;height:42px;padding:0 12px 0 14px;background:#F7F9FC;border:1px solid #E1E7EF;border-radius:14px;transition:.2s ease}.nex-header-search-wrap:focus-within{background:#fff;border-color:#19C2C6;box-shadow:0 0 0 3px rgba(25,194,198,.10)}.nex-header-search-wrap i{color:#1657B8;font-size:14px}.nex-header-search-input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:#1D2A3A;font:500 13px 'Montserrat',sans-serif}.nex-header-search-input::placeholder{color:#8995A7}.nex-header-search-results{position:absolute;top:50px;left:0;width:min(520px,calc(100vw - 40px));background:#fff;border:1px solid #E3E9F1;border-radius:18px;box-shadow:0 18px 45px rgba(29,42,58,.14);padding:8px;display:none;z-index:1000000}.nex-header-search-results.is-open{display:block}.nex-header-search-result{display:flex;align-items:center;gap:10px;padding:10px;border-radius:12px;text-decoration:none;color:inherit}.nex-header-search-result:hover{background:#F5F8FC}.nex-header-search-result-icon{width:34px;height:34px;display:grid;place-items:center;border-radius:10px;background:#EEF5FF;color:#1657B8;flex:0 0 34px}.nex-header-search-result-content{min-width:0}.nex-header-search-type{display:block;color:#64748B;font:800 8px 'Montserrat',sans-serif;text-transform:uppercase;letter-spacing:.05em}.nex-header-search-title{display:block;margin-top:2px;color:#1D2A3A;font:700 13px/1.3 'Montserrat',sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.nex-header-search-more{display:block;padding:10px 8px 7px;color:#1657B8;text-decoration:none;font:800 11px 'Montserrat',sans-serif;border-top:1px solid #EDF1F5;margin-top:4px}.nex-header-search-empty{padding:14px 10px;color:#64748B;font:500 12px Inter,system-ui,sans-serif}.menu-toggle{display:none;background:none;border:none;font-size:24px;cursor:pointer;color:#1657B8}
@media(max-width:950px){.menu-toggle{display:block}.nex-nav{position:fixed;top:64px;right:-100%;width:min(280px,calc(100vw - 24px));display:flex;flex-direction:column;align-items:flex-start;padding:16px;gap:12px;background:white;border-radius:0 0 0 20px;box-shadow:-10px 0 30px rgba(0,0,0,.08);transition:.35s ease;z-index:999998}.nex-nav.active{right:0}.nex-nav a{font-size:14px}.nex-btn{width:100%;text-align:center;padding:12px;font-size:13px}}
body{padding-top:64px!important}
@media(max-width:950px){.nex-header-main{gap:0}.nex-header-search{display:none}.nex-logo img{height:46px}}</style>

<header class="nex-header">
<div class="nex-header-main"><a href="index.html" class="nex-logo"><img src="logo.png" alt="NeXsv"></a><div class="nex-header-search" id="nexHeaderSearch"><div class="nex-header-search-wrap"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i><input class="nex-header-search-input" id="nexHeaderSearchInput" type="search" placeholder="Buscar en tu comunidad..." autocomplete="off" aria-label="Buscar en tu comunidad"></div><div class="nex-header-search-results" id="nexHeaderSearchResults"></div></div></div>
<button class="menu-toggle" onclick="toggleMenu()">☰</button>
<nav class="nex-nav" id="mobileMenu">
<a href="index.html">Inicio</a><a href="como.html">Cómo funciona</a><a href="beneficios.html">Beneficios</a><a href="negocios.html">Negocios</a><a href="blog.html">Blog</a>
${botonCuenta}
</nav>
</header>
<script>
function toggleMenu(){document.getElementById("mobileMenu").classList.toggle("active");}
</script>

`);
 
const headerSearchScript = document.createElement("script");
headerSearchScript.type = "module";
headerSearchScript.src = "./js/pages/home-search.js?v=20261006-1";
document.head.appendChild(headerSearchScript);

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
