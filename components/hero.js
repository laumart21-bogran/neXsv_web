function crearHero(
titulo,
subtitulo,
imagen
){

document.write(`

<section
class="nex-hero-global"
style="
background:
linear-gradient(
rgba(9,28,61,.78),
rgba(9,28,61,.82)
),
url('${imagen}') center/cover no-repeat;
">

<div class="nex-hero-content">

<h1>${titulo}</h1>

<p>${subtitulo}</p>

</div>

</section>

`);

}
